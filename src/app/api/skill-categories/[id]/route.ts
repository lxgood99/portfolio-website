import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// PUT - 更新分类名称
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('skill_categories')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      throw new Error(`更新分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
