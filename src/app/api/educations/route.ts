import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Education } from '@/storage/database/shared/schema';

// GET - 获取所有教育经历
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('educations')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`获取教育经历失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as Education[] });
  } catch (error) {
    console.error('获取教育经历错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建教育经历
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('educations')
      .insert(body)
      .select()
      .single();

    if (error) {
      throw new Error(`创建教育经历失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as Education });
  } catch (error) {
    console.error('创建教育经历错误:', error);
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

    for (const item of items) {
      const { error } = await client
        .from('educations')
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
