import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { WorkItem } from '@/storage/database/shared/schema';

// GET - 获取作品的所有项目
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('work_items')
      .select('*')
      .eq('work_id', parseInt(id))
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`获取作品项目失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkItem[] });
  } catch (error) {
    console.error('获取作品项目错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建作品项目
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('work_items')
      .insert({
        ...body,
        work_id: parseInt(id),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建作品项目失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkItem });
  } catch (error) {
    console.error('创建作品项目错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
