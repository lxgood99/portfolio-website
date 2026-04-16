import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// Initialize S3 storage (支持标准环境变量和TCB环境变量)
const storage = new S3Storage({
  endpointUrl: process.env.S3_ENDPOINT_URL || process.env.S3_ENDPOINT || process.env.COBæE_BUCKET_ENDPOINT_URL || '',
  accessKey: process.env.S3_ACCESS_KEY_ID || '',
  secretKey: process.env.S3_SECRET_ACCESS_KEY || '',
  bucketName: process.env.S3_BUCKET || process.env.COBæE_BUCKET_NAME || '',
  region: process.env.S3_REGION || 'cn-beijing',
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get content-length to check size
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      console.log(`[Upload] Content-Length: ${size} bytes (${Math.round(size / 1024 / 1024)}MB)`);
    }

    // Read file as blob, then convert to buffer
    // This approach works better with Next.js body handling
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`[Upload] File: ${file.name}, Size: ${file.size} bytes`);

    // Validate file size
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).slice(2, 10);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50);
    const ext = safeFileName.split('.').pop()?.toLowerCase() || '';
    const key = `${type}/${timestamp}_${safeFileName}_${uniqueId}.${ext}`;

    console.log(`[Upload] Uploading to: ${key}`);

    // Convert file to buffer using arrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Upload] Buffer ready: ${buffer.length} bytes`);

    // Upload to S3
    const uploadedKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: key,
      contentType: file.type || 'application/octet-stream',
    });

    console.log(`[Upload] Uploaded: ${uploadedKey}`);

    // Generate URL
    const url = await storage.generatePresignedUrl({
      key: uploadedKey,
      expireTime: 86400 * 365,
    });

    console.log(`[Upload] Success!`);

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
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    );
  }
}
