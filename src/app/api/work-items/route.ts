import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - 创建作品文件记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { work_id, file_key, title, type, is_carousel_item } = body;

    if (!work_id || !file_key) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取当前最大 order 值
    const client = getSupabaseClient();
    const { data: maxOrder } = await client
      .from('work_items')
      .select('order')
      .eq('work_id', work_id)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const newOrder = (maxOrder?.order ?? -1) + 1;

    const { data, error } = await client
      .from('work_items')
      .insert({
        work_id,
        file_key,
        title: title || '',
        type: type || 'other',
        is_carousel_item: is_carousel_item || false,
        order: newOrder,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建作品文件失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建作品文件错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
