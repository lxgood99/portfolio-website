import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Work } from '@/storage/database/shared/schema';

// GET - 获取所有作品，支持按分类筛选
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    let query = client
      .from('works')
      .select('*, work_items(*), category:work_categories(*)')
      .order('order', { ascending: true });
    
    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', parseInt(categoryId));
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取作品失败: ${error.message}`);
    }

    const response = NextResponse.json({ success: true, data: data as Work[] });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('获取作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建作品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('works')
      .insert(body)
      .select()
      .single();

    if (error) {
      throw new Error(`创建作品失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as Work });
  } catch (error) {
    console.error('创建作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 批量更新排序
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: Array<{ id: number; order: number }> };
    const client = getSupabaseClient();

    for (const item of items) {
      const { error } = await client
        .from('works')
        .update({ order: item.order, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) {
        throw new Error(`更新排序失败: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新排序错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
