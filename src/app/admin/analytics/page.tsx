'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, Calendar, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface VisitStats {
  id: number;
  total_visits: number;
  today_visits: number;
  last_visit_at: string | null;
  today_date: string;
}

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [stats, setStats] = useState<VisitStats | null>(null);
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
        setStats(data.data);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    } finally {
      setIsLoading(false);
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
        <div className="grid gap-6 md:grid-cols-3">
          {/* 总访问量 */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总访问量
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
              <Calendar className="h-4 w-4 text-muted-foreground" />
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

        {/* 说明 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• 访问统计仅记录访问次数，不收集任何用户隐私信息（如 IP、设备信息等）</p>
            <p>• 今日访问量每日零点自动重置</p>
            <p>• 数据实时更新，每次页面访问都会计入统计</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
