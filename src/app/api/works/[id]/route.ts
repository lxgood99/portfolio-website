import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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
    if (body.cover_key !== undefined) updateData.cover_key = body.cover_key;

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

    // 先获取作品文件
    const { data: items } = await client
      .from('work_items')
      .select('file_key, cover_key')
      .eq('work_id', id);

    // 删除存储文件
    if (items) {
      for (const item of items) {
        if (item.file_key) {
          await client.storage.from('portfolio').remove([item.file_key]);
        }
        if (item.cover_key) {
          await client.storage.from('portfolio').remove([item.cover_key]);
        }
      }
    }

    // 删除作品文件记录
    await client.from('work_items').delete().eq('work_id', id);

    // 删除作品记录
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
