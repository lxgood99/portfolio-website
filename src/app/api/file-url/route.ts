import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// POST - 获取文件访问 URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, expireTime } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: '缺少文件 key' },
        { status: 400 }
      );
    }

    const url = await storage.generatePresignedUrl({
      key: key,
      expireTime: expireTime || 86400 * 30, // 默认 30 天
    });

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('获取文件 URL 错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
