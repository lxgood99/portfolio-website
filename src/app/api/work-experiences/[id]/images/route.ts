import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取工作经历图片
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('work_id');
    
    let result;
    if (workId) {
      result = await db.selectAll('work_experience_images', '*', { work_experience_id: parseInt(workId) }, { orderBy: 'order_index, id' });
    } else {
      result = await db.selectAll('work_experience_images', '*', {}, { orderBy: 'order_index, id' });
    }

    if (result.error) {
      throw new Error(`获取工作经历图片失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取工作经历图片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建工作经历图片
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert('work_experience_images', body);

    if (result.error) {
      throw new Error(`创建工作经历图片失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建工作经历图片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除工作经历图片
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少ID参数' },
        { status: 400 }
      );
    }

    const result = await db.delete('work_experience_images', { id: parseInt(id) });

    if (result.error) {
      throw new Error(`删除工作经历图片失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除工作经历图片错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
