import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取开发日志
export async function GET() {
  try {
    const result = await db.selectAll('dev_logs', '*', {}, { orderBy: 'created_at DESC, order_index DESC, id DESC' });

    if (result.error) {
      throw new Error(`获取开发日志失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
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
    const result = await db.insert('dev_logs', body);

    if (result.error) {
      throw new Error(`创建开发日志失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建开发日志错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
