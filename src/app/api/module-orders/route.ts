import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取模块排序
export async function GET() {
  try {
    const result = await db.selectAll('module_orders', '*', {}, { orderBy: 'order_index, id' });

    if (result.error) {
      throw new Error(`获取模块排序失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取模块排序错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 更新模块排序
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modules } = body;

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { success: false, error: 'modules必须是数组' },
        { status: 400 }
      );
    }

    // 逐个更新
    for (const module of modules) {
      const { module_name, order_index, is_visible } = module;
      await db.update('module_orders', {
        order_index,
        is_visible,
        updated_at: new Date().toISOString(),
      }, { module_name });
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
