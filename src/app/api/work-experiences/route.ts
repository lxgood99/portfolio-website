import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { WorkExperience } from '@/storage/database/shared/schema';

// GET - 获取所有工作经历（包含图片）
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('work_experiences')
      .select('*, work_experience_images(*)')
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`获取工作经历失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取工作经历错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建工作经历
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('work_experiences')
      .insert(body)
      .select()
      .single();

    if (error) {
      throw new Error(`创建工作经历失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkExperience });
  } catch (error) {
    console.error('创建工作经历错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 批量更新排序
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: Array<{ id: number; order: number }> };
    const client = getSupabaseClient();

    // 批量更新
    for (const item of items) {
      const { error } = await client
        .from('work_experiences')
        .update({ order: item.order, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) {
        throw new Error(`更新排序失败: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新排序错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
