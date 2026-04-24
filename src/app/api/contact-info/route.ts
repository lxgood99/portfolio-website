import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { ContactInfo } from '@/storage/database/shared/schema';

// GET - 获取联系方式
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('contact_info')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`获取联系方式失败: ${error.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      data: data as ContactInfo | null 
    });
  } catch (error) {
    console.error('获取联系方式错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// PUT - 更新联系方式（需管理员权限）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      phone, 
      wechat_qr_key, 
      wechat_id, 
      is_visible,
      show_email,
      show_phone,
      show_wechat
    } = body;
    const client = getSupabaseClient();

    // 检查是否存在记录
    const { data: existing } = await client
      .from('contact_info')
      .select('id')
      .single();

    const updateData = {
      email,
      phone,
      wechat_qr_key,
      wechat_id,
      is_visible,
      show_email,
      show_phone,
      show_wechat,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await client
        .from('contact_info')
        .update(updateData)
        .eq('id', existing.id);

      if (error) {
        throw new Error(`更新联系方式失败: ${error.message}`);
      }
    } else {
      const { error } = await client
        .from('contact_info')
        .insert(updateData);

      if (error) {
        throw new Error(`创建联系方式失败: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新联系方式错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
