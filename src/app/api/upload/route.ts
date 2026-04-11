import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// Initialize S3 storage
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is 500MB.` },
        { status: 400 }
      );
    }

    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'mp4', 'webm', 'mov', 'avi', 'ppt', 'pptx', 'txt', 'json', 'xml'];
    
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `File type not allowed. Allowed types: ${allowedExts.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).slice(2, 10);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50);
    const key = `${type}/${timestamp}_${safeFileName}_${uniqueId}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const uploadedKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: key,
      contentType: file.type || 'application/octet-stream',
    });

    // Generate presigned URL
    const url = await storage.generatePresignedUrl({
      key: uploadedKey,
      expireTime: 86400 * 365, // 1 year for uploaded files
    });

    return NextResponse.json({
      success: true,
      data: {
        key: uploadedKey,
        url: url,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
