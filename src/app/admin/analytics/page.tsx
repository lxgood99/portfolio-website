'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, Calendar, Clock, TrendingUp, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface VisitStats {
  id: number;
  total_visits: number;
  today_visits: number;
  cumulative_visits: number;
  last_visit_at: string | null;
  today_date: string;
}

interface DailyStat {
  id: number;
  date: string;
  visit_count: number;
}

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/visit-stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setDailyStats(data.data.dailyStats || []);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (action: 'reset_today' | 'reset_total' | 'reset_cumulative' | 'reset_all') => {
    const actionNames: Record<string, string> = {
      reset_today: '今日访问',
      reset_total: '总访问量',
      reset_cumulative: '累计访问总量',
      reset_all: '所有数据',
    };
    
    if (!confirm(`确定要清零${actionNames[action]}吗？`)) return;

    try {
      const res = await fetch('/api/visit-stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        loadStats();
      }
    } catch (error) {
      console.error('清零失败:', error);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '暂无记录';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateWithWeekday = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 ${weekday}`;
  };

  // 生成最近5天的数据（包括0访问的日期）
  const getRecent5Days = () => {
    const result = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingStat = dailyStats.find(s => s.date === dateStr);
      result.push({
        date: dateStr,
        visit_count: existingStat?.visit_count || 0,
      });
    }
    
    return result;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const recent5Days = getRecent5Days();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">数据统计</h1>
            <p className="text-sm text-muted-foreground">网站访问数据概览</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 顶部统计卡片 */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* 总访问量 */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总访问量
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleReset('reset_total')}
                  title="清零总访问量"
                >
                  <RotateCcw className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </Button>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_visits || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">累计访问次数</p>
            </CardContent>
          </Card>

          {/* 今日访问 */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                今日访问
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleReset('reset_today')}
                  title="清零今日访问"
                >
                  <RotateCcw className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </Button>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.today_visits || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.today_date || '今日'}
              </p>
            </CardContent>
          </Card>

          {/* 最近访问 */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                最近访问
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {formatDateTime(stats?.last_visit_at || null)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">最后一次访问时间</p>
            </CardContent>
          </Card>
        </div>

        {/* 中间新增模块 */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* 累计访问总量 */}
          <Card className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                累计访问总量
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleReset('reset_cumulative')}
                  title="清零累计访问总量"
                >
                  <RotateCcw className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </Button>
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.cumulative_visits || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                同一IP每天计1次，持续累计
              </p>
            </CardContent>
          </Card>

          {/* 最近5日访问趋势 */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                最近5日访问趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recent5Days.map((day, index) => (
                  <div
                    key={day.date}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                      index === 0 
                        ? 'bg-blue-50 dark:bg-blue-950/30' 
                        : 'bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-sm text-muted-foreground">
                      {formatDateWithWeekday(day.date)}
                    </span>
                    <span className={`font-semibold ${index === 0 ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {day.visit_count}人
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 清空所有数据 */}
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="text-base text-red-600 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              危险操作
            </CardTitle>
            <CardDescription>
              清空所有历史访问记录，归零重新统计（用于测试）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => handleReset('reset_all')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空所有数据
            </Button>
          </CardContent>
        </Card>

        {/* 说明 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">统计规则说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• 同一IP每天只记1次访问，不重复计数</p>
            <p>• 今日访问量每日零点自动重置</p>
            <p>• 累计访问总量持续累计，同一IP第二天访问继续+1</p>
            <p>• 最近5日数据滚动显示，超过5天自动删除</p>
            <p>• 清零按钮仅影响顶部卡片显示，不影响累计访问总量</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
