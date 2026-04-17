import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// PUT - 更新作品
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

    const result = await db.update('works', {
      ...data,
      updated_at: new Date().toISOString(),
    }, { id: parseInt(id) });

    if (result.error) {
      throw new Error(`更新作品失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('更新作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除作品
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

    const result = await db.delete('works', { id: parseInt(id) });

    if (result.error) {
      throw new Error(`删除作品失败: ${result.error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
