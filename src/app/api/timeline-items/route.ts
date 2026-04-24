import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 时间线项目类型
export interface TimelineBreak {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

export interface TimelineItem {
  id: number;
  name: string;
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  color: string;
  breaks: TimelineBreak[];
  order: number;
  created_at: string;
  updated_at: string;
}

// GET - 获取所有时间线项目
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('timeline_items')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`获取时间线失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as TimelineItem[] });
  } catch (error) {
    console.error('获取时间线错误:', error);
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
    const client = getSupabaseClient();

    // 获取当前最大 order
    const { data: maxOrderData } = await client
      .from('timeline_items')
      .select('order')
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].order + 1 : 1;

    const { data, error } = await client
      .from('timeline_items')
      .insert({
        name: body.name,
        start_year: body.start_year,
        start_month: body.start_month,
        end_year: body.end_year,
        end_month: body.end_month,
        color: body.color || '#3b82f6',
        breaks: body.breaks || [],
        order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建时间线失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as TimelineItem });
  } catch (error) {
    console.error('创建时间线错误:', error);
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
    const { id, ...updates } = body;
    const client = getSupabaseClient();

    const { error } = await client
      .from('timeline_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`更新时间线失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新时间线错误:', error);
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
        { success: false, error: '缺少 id 参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('timeline_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除时间线失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除时间线错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
