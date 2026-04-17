import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取自我评价
export async function GET() {
  try {
    const result = await db.selectAll('self_introduction', '*', {}, { orderBy: 'id' });

    if (result.error) {
      throw new Error(`获取自我评价失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取自我评价错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建自我评价
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert('self_introduction', body);

    if (result.error) {
      throw new Error(`创建自我评价失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建自我评价错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 更新自我评价
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const result = await db.update('self_introduction', {
      ...data,
      updated_at: new Date().toISOString(),
    }, { id });

    if (result.error) {
      throw new Error(`更新自我评价失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('更新自我评价错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除自我评价
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

    const result = await db.delete('self_introduction', { id: parseInt(id) });

    if (result.error) {
      throw new Error(`删除自我评价失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除自我评价错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
