import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface WorkCategory {
  id: number;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// GET - 获取所有分类
export async function GET() {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('work_categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`获取分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkCategory[] });
  } catch (error) {
    console.error('获取分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建或批量更新分类
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    // 如果是批量更新（保存排序）
    if (body.items && Array.isArray(body.items)) {
      const updates = body.items.map((item: { id: number; name?: string; order_index: number }) => ({
        id: item.id,
        order_index: item.order_index,
        ...(item.name !== undefined && { name: item.name }),
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await client
          .from('work_categories')
          .update({ name: update.name, order_index: update.order_index, updated_at: update.updated_at })
          .eq('id', update.id);

        if (error) {
          throw new Error(`更新分类失败: ${error.message}`);
        }
      }

      // 返回更新后的分类
      const { data } = await client
        .from('work_categories')
        .select('*')
        .order('order_index', { ascending: true });

      return NextResponse.json({ success: true, data: data as WorkCategory[] });
    }

    // 如果是单个创建
    if (body.name) {
      // 获取当前最大的 order_index
      const { data: maxData } = await client
        .from('work_categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const maxOrder = maxData && maxData.length > 0 ? maxData[0].order_index : -1;

      const { data, error } = await client
        .from('work_categories')
        .insert({ name: body.name, order_index: maxOrder + 1 })
        .select()
        .single();

      if (error) {
        throw new Error(`创建分类失败: ${error.message}`);
      }

      return NextResponse.json({ success: true, data: data as WorkCategory });
    }

    return NextResponse.json({ success: false, error: '无效的请求参数' }, { status: 400 });
  } catch (error) {
    console.error('创建/更新分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 更新分类名称
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    if (!body.id || !body.name) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const { data, error } = await client
      .from('work_categories')
      .update({ name: body.name, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkCategory });
  } catch (error) {
    console.error('更新分类错误:', error);
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
