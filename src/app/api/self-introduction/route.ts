import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { SelfIntroduction } from '@/storage/database/shared/schema';

// GET - 获取自我评价
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('self_introduction')
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`获取自我评价失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as SelfIntroduction | null });
  } catch (error) {
    console.error('获取自我评价错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建或更新自我评价
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    // 先检查是否已存在
    const { data: existing } = await client
      .from('self_introduction')
      .select('id')
      .maybeSingle();

    let result;
    if (existing) {
      // 更新
      const { data, error } = await client
        .from('self_introduction')
        .update({
          content: body.content,
          is_visible: body.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`更新自我评价失败: ${error.message}`);
      }
      result = data;
    } else {
      // 创建
      const { data, error } = await client
        .from('self_introduction')
        .insert({
          content: body.content,
          is_visible: body.is_visible ?? true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`创建自我评价失败: ${error.message}`);
      }
      result = data;
    }

    return NextResponse.json({ success: true, data: result as SelfIntroduction });
  } catch (error) {
    console.error('保存自我评价错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
