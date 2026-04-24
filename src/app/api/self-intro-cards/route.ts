import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { SelfIntroCard } from '@/storage/database/shared/schema';

// GET - 获取所有自我评价卡片
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('self_intro_cards')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`获取自我评价卡片失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as SelfIntroCard[] });
  } catch (error) {
    console.error('获取自我评价卡片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建自我评价卡片
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    // 获取当前最大 order_index
    const { data: maxOrder } = await client
      .from('self_intro_cards')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = maxOrder && maxOrder.length > 0 ? maxOrder[0].order_index + 1 : 0;

    const { data, error } = await client
      .from('self_intro_cards')
      .insert({
        title: body.title,
        content: body.content,
        order_index: body.order_index ?? nextOrder,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建自我评价卡片失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as SelfIntroCard });
  } catch (error) {
    console.error('创建自我评价卡片错误:', error);
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
    const { items } = body as { items: Array<{ id: number; order_index: number }> };
    const client = getSupabaseClient();

    for (const item of items) {
      const { error } = await client
        .from('self_intro_cards')
        .update({ order_index: item.order_index, updated_at: new Date().toISOString() })
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
