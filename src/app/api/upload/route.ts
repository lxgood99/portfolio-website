import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// 配置路由选项
export const runtime = 'nodejs';
export const maxDuration = 300; // 5分钟超时，支持大文件上传
export const dynamic = 'force-dynamic'; // 禁用缓存，确保每次请求都处理

// 允许较大的请求体大小（500MB）
export const preferredRegion = 'auto';

// 文件大小限制配置（单位：字节）
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,     // 10MB - 图片
  pdf: 150 * 1024 * 1024,      // 150MB - PDF文档
  ppt: 150 * 1024 * 1024,      // 150MB - PPT文档
  video: 300 * 1024 * 1024,    // 300MB - 视频
  other: 150 * 1024 * 1024,    // 150MB - 其他类型
} as const;

// 错误提示信息
const SIZE_ERROR_MESSAGES: Record<string, string> = {
  image: '图片大小不能超过 10MB，请压缩后重试',
  pdf: 'PDF文件大小不能超过 150MB，建议分割文档或降低图片质量',
  ppt: 'PPT文件大小不能超过 150MB，建议压缩后重试',
  video: '视频大小不能超过 300MB，建议压缩或使用短视频',
  other: '文件大小不能超过 150MB',
};

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 根据文件类型获取大小限制
function getSizeLimit(mimeType: string): { limit: number; type: string; message: string } {
  if (mimeType.startsWith('image/')) {
    return { limit: FILE_SIZE_LIMITS.image, type: 'image', message: SIZE_ERROR_MESSAGES.image };
  }
  if (mimeType === 'application/pdf') {
    return { limit: FILE_SIZE_LIMITS.pdf, type: 'pdf', message: SIZE_ERROR_MESSAGES.pdf };
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || mimeType.includes('ppt')) {
    return { limit: FILE_SIZE_LIMITS.ppt, type: 'ppt', message: SIZE_ERROR_MESSAGES.ppt };
  }
  if (mimeType.startsWith('video/')) {
    return { limit: FILE_SIZE_LIMITS.video, type: 'video', message: SIZE_ERROR_MESSAGES.video };
  }
  return { limit: FILE_SIZE_LIMITS.other, type: 'other', message: SIZE_ERROR_MESSAGES.other };
}

// 格式化文件大小显示
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// POST - 上传文件
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'avatar' | 'work' | 'wechat_qr'

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到文件' },
        { status: 400 }
      );
    }

    // 检查文件大小限制
    const sizeConfig = getSizeLimit(file.type);
    if (file.size > sizeConfig.limit) {
      return NextResponse.json(
        {
          success: false,
          error: sizeConfig.message,
          details: {
            fileSize: formatFileSize(file.size),
            maxAllowed: formatFileSize(sizeConfig.limit),
            fileType: sizeConfig.type,
          },
        },
        { status: 413 } // Payload Too Large
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名
    const timestamp = Date.now();
    const fileName = `${type}/${timestamp}_${file.name}`;

    console.log(`[上传] 开始上传文件: ${file.name}, 大小: ${formatFileSize(file.size)}, 类型: ${file.type}`);

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    console.log(`[上传] 上传成功: ${fileKey}`);

    // 生成访问 URL
    const url = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400 * 30, // 30 天有效期
    });

    return NextResponse.json({
      success: true,
      data: {
        key: fileKey,
        url: url,
        name: file.name,
        type: file.type,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
      },
    });
  } catch (error) {
    console.error('上传文件错误:', error);
    
    // 更友好的错误信息
    let errorMessage = '上传失败，请重试';
    if (error instanceof Error) {
      if (error.message.includes('memory') || error.message.includes('heap')) {
        errorMessage = '文件过大，服务器内存不足，请选择更小的文件';
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = '上传超时，请检查网络连接后重试';
      } else {
        errorMessage = `上传失败: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
