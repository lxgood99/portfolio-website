import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { WorkExperienceImage } from '@/storage/database/shared/schema';

// GET - 获取工作经历的所有图片
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('work_experience_images')
      .select('*')
      .eq('work_experience_id', parseInt(id))
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`获取工作经历图片失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkExperienceImage[] });
  } catch (error) {
    console.error('获取工作经历图片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 添加工作经历图片
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('work_experience_images')
      .insert({
        work_experience_id: parseInt(id),
        file_key: body.file_key,
        title: body.title,
        order: body.order ?? 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`添加工作经历图片失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkExperienceImage });
  } catch (error) {
    console.error('添加工作经历图片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除工作经历图片
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    
    if (!imageId) {
      return NextResponse.json({ success: false, error: '缺少图片ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('work_experience_images')
      .delete()
      .eq('id', parseInt(imageId))
      .eq('work_experience_id', parseInt(id));

    if (error) {
      throw new Error(`删除工作经历图片失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除工作经历图片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
