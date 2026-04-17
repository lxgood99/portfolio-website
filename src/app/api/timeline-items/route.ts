import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取时间线项目
export async function GET() {
  try {
    const result = await db.selectAll('timeline_items', '*', {}, { orderBy: 'order_index, id' });

    if (result.error) {
      throw new Error(`获取时间线项目失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取时间线项目错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建时间线项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert('timeline_items', body);

    if (result.error) {
      throw new Error(`创建时间线项目失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建时间线项目错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 更新时间线项目
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少ID参数' },
        { status: 400 }
      );
    }

    const result = await db.update('timeline_items', {
      ...data,
      updated_at: new Date().toISOString(),
    }, { id: parseInt(id) });

    if (result.error) {
      throw new Error(`更新时间线项目失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('更新时间线项目错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除时间线项目
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

    const result = await db.delete('timeline_items', { id: parseInt(id) });

    if (result.error) {
      throw new Error(`删除时间线项目失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除时间线项目错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
