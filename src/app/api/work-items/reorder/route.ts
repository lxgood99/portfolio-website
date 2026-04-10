import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// PUT - 批量更新作品顺序
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body; // items: [{ id: number, order: number }]

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: '无效的参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 批量更新顺序
    for (const item of items) {
      const { error } = await client
        .from('work_items')
        .update({
          order: item.order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) {
        throw new Error(`更新顺序失败: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新顺序错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
