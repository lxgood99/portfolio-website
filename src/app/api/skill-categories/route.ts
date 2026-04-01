import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { SkillCategory } from '@/storage/database/shared/schema';

// GET - 获取所有技能分类
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('skill_categories')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`获取技能分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as SkillCategory[] });
  } catch (error) {
    console.error('获取技能分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建技能分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;
    const client = getSupabaseClient();

    // 获取最大order
    const { data: existing } = await client
      .from('skill_categories')
      .select('order')
      .order('order', { ascending: false })
      .limit(1);

    const maxOrder = existing && existing.length > 0 ? existing[0].order : 0;

    const { data, error } = await client
      .from('skill_categories')
      .insert({
        name,
        order: maxOrder + 1,
        is_visible: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建技能分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as SkillCategory });
  } catch (error) {
    console.error('创建技能分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 批量更新分类排序
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: Array<{ id: number; order: number; is_visible: boolean }> };
    const client = getSupabaseClient();

    for (const item of items) {
      const { error } = await client
        .from('skill_categories')
        .update({
          order: item.order,
          is_visible: item.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) {
        throw new Error(`更新技能分类失败: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新技能分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除技能分类
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少id参数' }, { status: 400 });
    }

    const client = getSupabaseClient();
    
    // 将该分类下的技能的category设为null
    await client
      .from('skills')
      .update({ category: null })
      .eq('category', (await client.from('skill_categories').select('name').eq('id', id).single()).data?.name);

    const { error } = await client
      .from('skill_categories')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      throw new Error(`删除技能分类失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除技能分类错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
