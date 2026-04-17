import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取教育背景列表
export async function GET() {
  try {
    const result = await db.selectAll('educations', '*', {}, { orderBy: 'order_index, id' });

    if (result.error) {
      throw new Error(`获取教育背景失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取教育背景错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建教育背景
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert('educations', body);

    if (result.error) {
      throw new Error(`创建教育背景失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建教育背景错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
