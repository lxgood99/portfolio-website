import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取所有开发日志
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('dev_logs')
      .select('*')
      .order('order_index', { ascending: false });

    if (error) {
      throw new Error(`获取开发日志失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取开发日志错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建开发日志
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    // 获取当前最大order_index
    const { data: maxOrder } = await client
      .from('dev_logs')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = maxOrder && maxOrder.length > 0 ? maxOrder[0].order_index + 1 : 100;

    const { data, error } = await client
      .from('dev_logs')
      .insert({
        ...body,
        order_index: nextOrder,
        created_at: body.created_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建开发日志失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('创建开发日志错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
