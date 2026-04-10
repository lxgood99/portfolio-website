import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取所有作品
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 获取所有作品
    const { data: works, error: worksError } = await client
      .from('works')
      .select('*')
      .order('order', { ascending: true });

    if (worksError) {
      throw new Error(`获取作品失败: ${worksError.message}`);
    }

    // 获取所有作品文件
    const { data: items, error: itemsError } = await client
      .from('work_items')
      .select('*')
      .order('order', { ascending: true });

    if (itemsError) {
      throw new Error(`获取作品文件失败: ${itemsError.message}`);
    }

    // 合并数据
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

    // 上传文件
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const fileKey = `work/${fileName}`;

    const { error: uploadError } = await client.storage
      .from('portfolio')
      .upload(fileKey, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`上传文件失败: ${uploadError.message}`);
    }

    // 获取文件URL
    const { data: urlData } = client.storage
      .from('portfolio')
      .getPublicUrl(fileKey);

    // 确定文件类型
    let fileType = 'image';
    if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else if (file.type.includes('pdf') || file.type.includes('ppt')) {
      fileType = 'pdf';
    }

    // 创建作品
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

    // 创建作品文件
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

    return NextResponse.json({ success: true, data: { ...work, url: urlData.publicUrl } });
  } catch (error) {
    console.error('创建作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
