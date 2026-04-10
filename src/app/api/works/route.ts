import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 配置路由选项
export const runtime = 'nodejs';
export const maxDuration = 300; // 5分钟超时，支持大文件上传

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 文件大小限制（字节）
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 300 * 1024 * 1024,
  other: 150 * 1024 * 1024,
};

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// GET - 获取所有作品
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    const { data: works, error: worksError } = await client
      .from('works')
      .select('*')
      .order('order', { ascending: true });

    if (worksError) {
      throw new Error(`获取作品失败: ${worksError.message}`);
    }

    const { data: items } = await client
      .from('work_items')
      .select('*')
      .order('order', { ascending: true });

    const worksWithItems = works.map(work => ({
      ...work,
      items: (items || []).filter(item => item.work_id === work.id),
    }));

    return NextResponse.json({ success: true, data: worksWithItems });
  } catch (error) {
    console.error('获取作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建作品
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    
    if (!file || !title || !category) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查文件大小
    let limit = FILE_SIZE_LIMITS.other;
    if (file.type.startsWith('image/')) {
      limit = FILE_SIZE_LIMITS.image;
    } else if (file.type.startsWith('video/')) {
      limit = FILE_SIZE_LIMITS.video;
    }
    
    if (file.size > limit) {
      return NextResponse.json(
        { success: false, error: `文件过大：${formatFileSize(file.size)}，最大允许 ${formatFileSize(limit)}` },
        { status: 413 }
      );
    }

    // 上传文件到对象存储
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `work/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 获取文件URL
    const url = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400 * 30,
    });

    // 确定文件类型
    let fileType = 'image';
    if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else if (file.type.includes('pdf') || file.type.includes('ppt')) {
      fileType = 'pdf';
    }

    // 创建作品记录
    const { data: work, error: workError } = await client
      .from('works')
      .insert({
        title,
        description: '',
        category,
        order: 0,
      })
      .select()
      .single();

    if (workError) {
      throw new Error(`创建作品失败: ${workError.message}`);
    }

    // 创建作品文件记录
    const { error: itemError } = await client
      .from('work_items')
      .insert({
        work_id: work.id,
        type: fileType,
        title: file.name,
        file_key: fileKey,
        summary: '',
        order: 0,
        category,
      });

    if (itemError) {
      throw new Error(`创建作品文件失败: ${itemError.message}`);
    }

    return NextResponse.json({ success: true, data: { ...work, url, file_key: fileKey } });
  } catch (error) {
    console.error('创建作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
