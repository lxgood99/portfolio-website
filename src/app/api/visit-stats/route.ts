import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { VisitStats, VisitDailyStats } from '@/storage/database/shared/schema';

// 获取客户端真实IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP.trim();
  }
  if (cfIP) {
    return cfIP.trim();
  }
  return 'unknown';
}

// 获取今天的日期字符串
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// GET - 获取访问统计（管理员）
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    // 获取顶部统计数据
    const { data: stats, error: statsError } = await client
      .from('visit_stats')
      .select('*')
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      throw new Error(`获取统计失败: ${statsError.message}`);
    }

    // 获取最近5日访问数据
    const { data: dailyStats, error: dailyError } = await client
      .from('visit_daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);

    if (dailyError) {
      console.error('获取每日统计失败:', dailyError);
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: stats || null,
        dailyStats: dailyStats || [],
      },
    });
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
    const clientIP = getClientIP(request);
    const today = getTodayStr();
    const now = new Date().toISOString();

    // 1. 检查该IP今天是否已访问过
    const { data: existingTodayIP } = await client
      .from('visit_daily_ips')
      .select('id')
      .eq('ip_address', clientIP)
      .eq('visit_date', today)
      .limit(1);

    const isNewIPToday = !existingTodayIP || existingTodayIP.length === 0;

    // 2. 如果是新IP今天首次访问，记录IP并更新计数
    if (isNewIPToday) {
      // 记录今日IP
      await client
        .from('visit_daily_ips')
        .upsert(
          { ip_address: clientIP, visit_date: today },
          { onConflict: 'ip_address,visit_date', ignoreDuplicates: true }
        );

      // 更新今日访问统计
      await updateTodayStats(client, today, now);
      
      // 更新累计访问总量（每个IP每天+1，持续累计）
      await updateCumulativeVisits(client);
    }

    // 3. 更新最后访问时间
    await updateLastVisitTime(client, now);

    // 4. 清理超过5天的旧数据
    await cleanupOldData(client);

    return NextResponse.json({ success: true, isNewVisit: isNewIPToday });
  } catch (error) {
    console.error('记录访问错误:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// PUT - 清零操作（管理员）
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { action } = body;

    if (action === 'reset_today') {
      // 清零今日访问
      await client
        .from('visit_stats')
        .update({ today_visits: 0 })
        .neq('id', 0);
    } else if (action === 'reset_total') {
      // 清零总访问量
      await client
        .from('visit_stats')
        .update({ total_visits: 0 })
        .neq('id', 0);
    } else if (action === 'reset_cumulative') {
      // 清零累计访问总量
      await client
        .from('visit_stats')
        .update({ cumulative_visits: 0 })
        .neq('id', 0);
    } else if (action === 'reset_all') {
      // 清零所有
      await client.from('visit_stats').update({
        total_visits: 0,
        today_visits: 0,
        cumulative_visits: 0,
      }).neq('id', 0);
      await client.from('visit_daily_stats').delete().neq('id', 0);
      await client.from('visit_daily_ips').delete().neq('id', 0);
      await client.from('visit_ip_records').delete().neq('id', 0);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('清零操作错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

// 更新今日访问统计
async function updateTodayStats(client: ReturnType<typeof getSupabaseClient>, today: string, now: string) {
  // 检查今天的记录是否存在
  const { data: todayRecord } = await client
    .from('visit_daily_stats')
    .select('*')
    .eq('date', today)
    .single();

  if (!todayRecord) {
    // 创建今天的记录
    await client
      .from('visit_daily_stats')
      .insert({
        date: today,
        visit_count: 1,
      });
  } else {
    // 更新今天的访问数
    await client
      .from('visit_daily_stats')
      .update({
        visit_count: (todayRecord.visit_count || 0) + 1,
        updated_at: now,
      })
      .eq('id', todayRecord.id);
  }

  // 更新顶部统计卡片
  const { data: stats } = await client
    .from('visit_stats')
    .select('*')
    .single();

  const isNewDay = !stats || stats.today_date !== today;

  if (!stats) {
    await client.from('visit_stats').insert({
      total_visits: 1,
      today_visits: 1,
      today_date: today,
      cumulative_visits: 0,
      last_visit_at: now,
    });
  } else {
    await client
      .from('visit_stats')
      .update({
        total_visits: isNewDay ? 1 : (stats.total_visits || 0) + 1,
        today_visits: isNewDay ? 1 : (stats.today_visits || 0) + 1,
        today_date: today,
        last_visit_at: now,
        updated_at: now,
      })
      .eq('id', stats.id);
  }
}

// 更新累计访问总量
async function updateCumulativeVisits(client: ReturnType<typeof getSupabaseClient>) {
  const { data: stats } = await client
    .from('visit_stats')
    .select('*')
    .single();

  if (stats) {
    await client
      .from('visit_stats')
      .update({
        cumulative_visits: (stats.cumulative_visits || 0) + 1,
      })
      .eq('id', stats.id);
  }
}

// 更新最后访问时间
async function updateLastVisitTime(client: ReturnType<typeof getSupabaseClient>, now: string) {
  const { data: stats } = await client
    .from('visit_stats')
    .select('id')
    .single();

  if (stats) {
    await client
      .from('visit_stats')
      .update({ last_visit_at: now })
      .eq('id', stats.id);
  }
}

// 清理超过5天的旧数据
async function cleanupOldData(client: ReturnType<typeof getSupabaseClient>) {
  // 获取保留的日期
  const { data: recentDates } = await client
    .from('visit_daily_stats')
    .select('date')
    .order('date', { ascending: false })
    .limit(5);

  if (recentDates && recentDates.length > 0) {
    const datesToKeep = recentDates.map((d: { date: string }) => d.date);
    
    // 删除旧于保留日期的每日统计
    await client
      .from('visit_daily_stats')
      .delete()
      .not('date', 'in', `(${datesToKeep.map(d => `'${d}'`).join(',')})`);
    
    // 删除旧于保留日期的每日IP记录
    await client
      .from('visit_daily_ips')
      .delete()
      .not('visit_date', 'in', `(${datesToKeep.map(d => `'${d}'`).join(',')})`);
  }
}
