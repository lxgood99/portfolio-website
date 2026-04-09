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

// GET - 获取所有作品分类
export async function GET() {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('work_categories')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

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
