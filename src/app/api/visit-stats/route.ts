import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { VisitStats } from '@/storage/database/shared/schema';

// GET - 获取访问统计（仅管理员）
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('visit_stats')
      .select('*')
      .single();

    if (error) {
      throw new Error(`获取访问统计失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data as VisitStats });
  } catch (error) {
    console.error('获取访问统计错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// POST - 记录一次访问（公开，用于前端调用）
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 获取当前统计
    const { data: currentStats, error: fetchError } = await client
      .from('visit_stats')
      .select('*')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`获取统计失败: ${fetchError.message}`);
    }

    const now = new Date().toISOString();
    
    if (!currentStats) {
      // 创建初始记录
      const { error: insertError } = await client
        .from('visit_stats')
        .insert({
          total_visits: 1,
          today_visits: 1,
          today_date: today,
          last_visit_at: now,
        });

      if (insertError) {
        throw new Error(`创建统计失败: ${insertError.message}`);
      }
    } else {
      // 更新统计
      const isNewDay = currentStats.today_date !== today;
      const updateData = {
        total_visits: (currentStats.total_visits || 0) + 1,
        today_visits: isNewDay ? 1 : (currentStats.today_visits || 0) + 1,
        today_date: today,
        last_visit_at: now,
        updated_at: now,
      };

      const { error: updateError } = await client
        .from('visit_stats')
        .update(updateData)
        .eq('id', currentStats.id);

      if (updateError) {
        throw new Error(`更新统计失败: ${updateError.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('记录访问错误:', error);
    // 静默失败，不影响用户体验
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
