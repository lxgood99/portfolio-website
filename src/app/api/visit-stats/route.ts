import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取今天的日期字符串（使用本地时区，格式：YYYY-MM-DD）
function getTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET - 获取访问统计（管理员）
export async function GET() {
  try {
    const client = getSupabaseClient();
    
    const { data: stats, error: statsError } = await client
      .from('visit_stats')
      .select('*')
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      throw new Error(`获取统计失败: ${statsError.message}`);
    }

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
    const body = await request.json();
    const { deviceId } = body;
    
    // 如果没有设备ID，生成一个基于时间戳的临时ID
    const deviceIdFinal = deviceId || `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const today = getTodayStr();
    const now = new Date().toISOString();

    // 1. 尝试插入设备记录（如果已存在会失败）
    // 复用 visit_daily_ips 表，将 ip_address 字段存储 device_id
    const { error: insertError } = await client
      .from('visit_daily_ips')
      .insert({
        ip_address: deviceIdFinal, // 存储 device_id
        visit_date: today,
        first_visit_at: now,
      });

    // 2. 如果插入成功，说明是新设备今天首次访问
    if (!insertError) {
      // 更新今日访问统计
      await updateTodayStats(client, today, now);
      
      // 更新累计访问总量
      await updateCumulativeVisits(client);
    } else if (insertError.code === '23505') {
      // 唯一约束冲突，说明该设备今天已访问过，不计数
      console.log(`设备 ${deviceIdFinal} 今天已访问过，不重复计数`);
    } else {
      // 其他错误，记录日志但不影响用户体验
      console.error('插入设备记录失败:', insertError);
    }

    // 3. 更新最后访问时间（每次访问都更新）
    await updateLastVisitTime(client, now);

    // 4. 清理超过5天的旧数据
    await cleanupOldData(client);

    return NextResponse.json({ success: true });
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
      await client.from('visit_stats').update({ today_visits: 0 }).neq('id', 0);
    } else if (action === 'reset_total') {
      await client.from('visit_stats').update({ total_visits: 0 }).neq('id', 0);
    } else if (action === 'reset_cumulative') {
      await client.from('visit_stats').update({ cumulative_visits: 0 }).neq('id', 0);
    } else if (action === 'reset_all') {
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
  // 更新或创建今天的每日统计记录
  const { data: todayRecord } = await client
    .from('visit_daily_stats')
    .select('*')
    .eq('date', today)
    .single();

  if (!todayRecord) {
    await client.from('visit_daily_stats').insert({
      date: today,
      visit_count: 1,
    });
  } else {
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
  const { data: recentDates } = await client
    .from('visit_daily_stats')
    .select('date')
    .order('date', { ascending: false })
    .limit(5);

  if (recentDates && recentDates.length > 0) {
    const datesToKeep = recentDates.map((d: { date: string }) => d.date);
    
    // 获取所有日期并删除超过5天的
    const { data: allDates } = await client
      .from('visit_daily_stats')
      .select('date');
    
    if (allDates) {
      const toDelete = allDates
        .map((d: { date: string }) => d.date)
        .filter((d: string) => !datesToKeep.includes(d));
      
      if (toDelete.length > 0) {
        await client
          .from('visit_daily_stats')
          .delete()
          .in('date', toDelete);
        await client
          .from('visit_daily_ips')
          .delete()
          .in('visit_date', toDelete);
      }
    }
  }
}
