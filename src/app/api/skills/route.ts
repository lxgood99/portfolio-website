import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取技能列表
export async function GET() {
  try {
    const result = await db.selectAll('skills', '*', {}, { orderBy: 'order_index, id' });

    if (result.error) {
      throw new Error(`获取技能列表失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取技能列表错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建技能
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert('skills', body);

    if (result.error) {
      throw new Error(`创建技能失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建技能错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
