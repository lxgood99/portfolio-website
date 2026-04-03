import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { SelfIntroCard } from '@/storage/database/shared/schema';

// GET - 获取单个卡片（可选）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('self_intro_cards')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) {
      throw new Error(`获取卡片失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as SelfIntroCard });
  } catch (error) {
    console.error('获取卡片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 更新卡片
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('self_intro_cards')
      .update({
        title: body.title,
        content: body.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      throw new Error(`更新卡片失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as SelfIntroCard });
  } catch (error) {
    console.error('更新卡片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除卡片
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    const { error } = await client
      .from('self_intro_cards')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      throw new Error(`删除卡片失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除卡片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
