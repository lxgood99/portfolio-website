import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// GET - 获取单个作品
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data: work, error } = await client
      .from('works')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`获取作品失败: ${error.message}`);
    }

    const { data: items } = await client
      .from('work_items')
      .select('*')
      .eq('work_id', id)
      .order('order', { ascending: true });

    return NextResponse.json({ success: true, data: { ...work, items } });
  } catch (error) {
    console.error('获取作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PATCH - 更新作品
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.order !== undefined) updateData.order = body.order;

    const { data, error } = await client
      .from('works')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新作品失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除作品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    // 获取作品文件
    const { data: items } = await client
      .from('work_items')
      .select('file_key, cover_key')
      .eq('work_id', id);

    // 删除存储文件
    if (items) {
      for (const item of items) {
        if (item.file_key) {
          try {
            await storage.deleteFile({ key: item.file_key });
          } catch (e) {
            console.error('删除存储文件失败:', e);
          }
        }
        if (item.cover_key) {
          try {
            await storage.deleteFile({ key: item.cover_key });
          } catch (e) {
            console.error('删除封面文件失败:', e);
          }
        }
      }
    }

    // 删除数据库记录
    await client.from('work_items').delete().eq('work_id', id);

    const { error } = await client
      .from('works')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除作品失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
