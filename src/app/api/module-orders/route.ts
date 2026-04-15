import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { ModuleOrder } from '@/storage/database/shared/schema';

// GET - 获取所有模块排序
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('module_orders')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`获取模块排序失败: ${error.message}`);
    }

    const response = NextResponse.json({ success: true, data: data as ModuleOrder[] });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('获取模块排序错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 批量更新模块排序
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: Array<{ id: number; order: number; is_visible: boolean }> };
    const client = getSupabaseClient();

    for (const item of items) {
      const { error } = await client
        .from('module_orders')
        .update({
          order: item.order,
          is_visible: item.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) {
        throw new Error(`更新模块排序失败: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新模块排序错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
