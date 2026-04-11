import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - 删除分类
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少分类ID' }, { status: 400 });
    }

    // 检查该分类下是否有作品
    const { data: works } = await client
      .from('works')
      .select('id')
      .eq('category_id', parseInt(id))
      .limit(1);

    if (works && works.length > 0) {
      return NextResponse.json(
        { success: false, error: '该分类下还有作品，无法删除' },
        { status: 400 }
      );
    }

    const { error } = await client
      .from('work_categories')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      throw new Error(`删除分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
