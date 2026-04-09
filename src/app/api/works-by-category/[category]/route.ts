import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface WorkItem {
  id: number;
  work_id: number;
  type: string;
  title: string;
  file_key: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  is_carousel_item: boolean;
  category: string;
}

// GET - 获取指定分类的所有作品
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category }> }
) {
  try {
    const { category } = await params;
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('work_items')
      .select('*')
      .eq('category', category)
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`获取作品失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkItem[] });
  } catch (error) {
    console.error('获取作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建作品
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ category }> }
) {
  try {
    const { category } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    // 如果没有指定order，获取该分类最大的order值
    let order = body.order;
    if (order === undefined) {
      const { data: existingData } = await client
        .from('work_items')
        .select('order')
        .eq('category', category)
        .order('order', { ascending: false })
        .limit(1);
      
      order = existingData && existingData.length > 0 ? (existingData[0].order || 0) + 1 : 0;
    }

    const { data, error } = await client
      .from('work_items')
      .insert({
        category: category,
        type: body.type,
        title: body.title,
        file_key: body.file_key,
        description: body.description || null,
        order: order,
        is_carousel_item: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建作品失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as WorkItem });
  } catch (error) {
    console.error('创建作品错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 批量更新排序
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ category }> }
) {
  try {
    const { category } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { success: false, error: '缺少items参数' },
        { status: 400 }
      );
    }

    for (const item of body.items) {
      const { error } = await client
        .from('work_items')
        .update({ order: item.order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('category', category);

      if (error) {
        throw new Error(`更新作品排序失败: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新作品排序错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
