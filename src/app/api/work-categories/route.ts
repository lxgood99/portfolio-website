import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 禁用静态优化，确保每次请求都执行
export const dynamic = 'force-dynamic';

interface WorkCategory {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// 生成唯一的 category_type
function generateCategoryType(): string {
  return 'cat_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

// GET - 获取所有作品分类
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('include_hidden') === 'true';

    let query = client
      .from('work_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeHidden) {
      query = query.eq('is_visible', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取作品分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkCategory[] });
  } catch (error) {
    console.error('获取作品分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建新分类
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { display_name } = body;

    if (!display_name || display_name.trim() === '') {
      return NextResponse.json(
        { success: false, error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    // 获取当前最大的 sort_order
    const { data: maxData } = await client
      .from('work_categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const newSortOrder = maxData && maxData.length > 0 
      ? (maxData[0].sort_order || 0) + 1 
      : 0;

    // 生成唯一的 category_type
    let categoryType = generateCategoryType();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await client
        .from('work_categories')
        .select('id')
        .eq('category_type', categoryType)
        .limit(1);
      
      if (!existing || existing.length === 0) break;
      categoryType = generateCategoryType();
      attempts++;
    }

    // 创建新分类
    const { data, error } = await client
      .from('work_categories')
      .insert({
        category_type: categoryType,
        display_name: display_name.trim(),
        sort_order: newSortOrder,
        is_visible: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkCategory });
  } catch (error) {
    console.error('创建作品分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 更新分类排序/名称
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    // 支持批量更新排序
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        const { error } = await client
          .from('work_categories')
          .update({
            sort_order: item.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        if (error) {
          throw new Error(`更新分类排序失败: ${error.message}`);
        }
      }
      return NextResponse.json({ success: true });
    }

    // 支持更新单个分类
    if (body.id) {
      const updateData: Partial<WorkCategory> = {
        updated_at: new Date().toISOString(),
      };
      
      if (body.display_name !== undefined) updateData.display_name = body.display_name;
      if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
      if (body.is_visible !== undefined) updateData.is_visible = body.is_visible;

      const { error } = await client
        .from('work_categories')
        .update(updateData)
        .eq('id', body.id);

      if (error) {
        throw new Error(`更新分类失败: ${error.message}`);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: '缺少参数' },
      { status: 400 }
    );
  } catch (error) {
    console.error('更新作品分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除分类
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少分类ID' },
        { status: 400 }
      );
    }

    // 检查该分类下是否有作品
    const { data: works } = await client
      .from('work_items')
      .select('id')
      .eq('category', id)
      .limit(1);

    if (works && works.length > 0) {
      return NextResponse.json(
        { success: false, error: '该分类下仍有作品，请先删除或移动作品后再试' },
        { status: 400 }
      );
    }

    // 删除分类
    const { error } = await client
      .from('work_categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除作品分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
