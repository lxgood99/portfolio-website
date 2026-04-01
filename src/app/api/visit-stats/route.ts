import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { VisitStats, VisitIpRecord } from '@/storage/database/shared/schema';

// 获取客户端真实IP
function getClientIP(request: NextRequest): string {
  // 尝试从各种header中获取真实IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for 可能包含多个IP，取第一个
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  if (cfIP) {
    return cfIP.trim();
  }
  
  // 如果都获取不到，返回一个标识
  return 'unknown';
}

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
    const clientIP = getClientIP(request);
    
    // 检查该IP是否已经访问过
    const { data: existingIP, error: checkError } = await client
      .from('visit_ip_records')
      .select('id')
      .eq('ip_address', clientIP)
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('检查IP记录失败:', checkError);
    }

    // 如果该IP已经访问过，不重复计数
    if (existingIP && existingIP.length > 0) {
      return NextResponse.json({ success: true, message: 'IP已记录，不重复计数' });
    }

    // 记录新IP（使用upsert防止并发插入）
    const { error: insertIPError } = await client
      .from('visit_ip_records')
      .upsert(
        { ip_address: clientIP },
        { onConflict: 'ip_address', ignoreDuplicates: true }
      );

    if (insertIPError) {
      console.error('记录IP失败:', insertIPError);
      // 如果是唯一约束冲突，说明并发时其他请求已经记录了该IP
      if (insertIPError.code === '23505') {
        return NextResponse.json({ success: true, message: 'IP已记录，不重复计数' });
      }
      // 其他错误不影响继续统计
    }

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
