import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取联系方式
export async function GET() {
  try {
    const result = await db.select('contact_info');

    if (result.error) {
      throw new Error(`获取联系方式失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取联系方式错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建或更新联系方式
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 先检查是否已存在
    const existing = await db.select('contact_info', 'id');

    let result;
    if (existing.data) {
      // 更新
      result = await db.update('contact_info', {
        ...body,
        updated_at: new Date().toISOString(),
      }, { id: (existing.data as { id: number }).id });
    } else {
      // 创建
      result = await db.insert('contact_info', body);
    }

    if (result.error) {
      throw new Error(`保存联系方式失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('保存联系方式错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
