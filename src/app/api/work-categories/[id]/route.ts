import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - 删除分类（同时删除该分类下的所有作品和关联文件）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少分类ID' }, { status: 400 });
    }

    const categoryId = parseInt(id);

    // 查询该分类下的所有作品
    const { data: works, error: worksError } = await client
      .from('works')
      .select('id')
      .eq('category_id', categoryId);

    if (worksError) {
      throw new Error(`查询作品失败: ${worksError.message}`);
    }

    // 如果有作品，先删除关联数据
    if (works && works.length > 0) {
      const workIds = works.map(w => w.id);

      // 1. 删除作品关联的文件记录 (work_items)
      const { error: itemsError } = await client
        .from('work_items')
        .delete()
        .in('work_id', workIds);

      if (itemsError) {
        console.error('删除作品文件记录失败:', itemsError);
        // 继续执行，不阻断流程
      }

      // 2. 删除作品记录
      const { error: deleteWorksError } = await client
        .from('works')
        .delete()
        .eq('category_id', categoryId);

      if (deleteWorksError) {
        throw new Error(`删除作品失败: ${deleteWorksError.message}`);
      }
    }

    // 3. 删除分类
    const { error } = await client
      .from('work_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      throw new Error(`删除分类失败: ${error.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `已删除分类及关联的 ${works?.length || 0} 个作品` 
    });
  } catch (error) {
    console.error('删除分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
