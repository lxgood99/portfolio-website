import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取作品分类
export async function GET() {
  try {
    const result = await db.selectAll('work_categories', '*', {}, { orderBy: 'order_index, id' });

    if (result.error) {
      throw new Error(`获取作品分类失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取作品分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建作品分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert('work_categories', body);

    if (result.error) {
      throw new Error(`创建作品分类失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建作品分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
