import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Profile } from '@/storage/database/shared/schema';

// GET - 获取个人信息
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`获取个人信息失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as Profile | null });
  } catch (error) {
    console.error('获取个人信息错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 创建或更新个人信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    // 先检查是否已存在
    const { data: existing } = await client
      .from('profiles')
      .select('id')
      .maybeSingle();

    let result;
    if (existing) {
      // 更新
      const { data, error } = await client
        .from('profiles')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`更新个人信息失败: ${error.message}`);
      }
      result = data;
    } else {
      // 创建
      const { data, error } = await client
        .from('profiles')
        .insert(body)
        .select()
        .single();

      if (error) {
        throw new Error(`创建个人信息失败: ${error.message}`);
      }
      result = data;
    }

    return NextResponse.json({ success: true, data: result as Profile });
  } catch (error) {
    console.error('保存个人信息错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
