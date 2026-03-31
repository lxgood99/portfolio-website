'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface SelfIntroduction {
  id: number;
  content: string;
  is_visible: boolean;
}

export default function SelfIntroductionPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [content, setContent] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadSelfIntroduction();
    }
  }, [isAuthenticated]);

  const loadSelfIntroduction = async () => {
    try {
      const res = await fetch('/api/self-introduction');
      const data = await res.json();
      if (data.success && data.data) {
        setContent(data.data.content ?? '');
        setIsVisible(data.data.is_visible ?? true);
      }
    } catch (error) {
      console.error('加载自我评价失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/self-introduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, is_visible: isVisible }),
      });
      const data = await res.json();
      if (data.success) {
        alert('保存成功！');
      } else {
        alert('保存失败：' + data.error);
      }
    } catch (error) {
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
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
            <h1 className="text-2xl font-bold">自我评价</h1>
            <p className="text-sm text-muted-foreground">编辑您的自我评价内容</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>自我评价</CardTitle>
            <CardDescription>
              撰写您的自我评价，支持换行分点展示
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content">评价内容</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入您的自我评价，可换行分点描述..."
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                提示：使用换行可以分点展示内容，使页面更清晰
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="visibility">是否显示</Label>
                <p className="text-sm text-muted-foreground">
                  关闭后，前端页面将不显示此模块
                </p>
              </div>
              <Switch
                id="visibility"
                checked={isVisible}
                onCheckedChange={setIsVisible}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/dashboard">
                <Button variant="outline">取消</Button>
              </Link>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
