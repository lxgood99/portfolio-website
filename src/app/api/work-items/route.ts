import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取作品文件列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('work_id');
    
    let result;
    if (workId) {
      result = await db.selectAll('work_items', '*', { work_id: parseInt(workId) }, { orderBy: 'order_index, id' });
    } else {
      result = await db.selectAll('work_items', '*', {}, { orderBy: 'work_id, order_index, id' });
    }

    if (result.error) {
      throw new Error(`获取作品文件列表失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取作品文件列表错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建作品文件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert('work_items', body);

    if (result.error) {
      throw new Error(`创建作品文件失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建作品文件错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
