'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  FolderOpen,
  LogOut,
  ExternalLink 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/verify');
      const data = await res.json();
      if (!data.success || !data.data.authenticated) {
        router.push('/admin');
      } else {
        setUsername(data.data.username);
      }
    } catch (error) {
      router.push('/admin');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const menuItems = [
    {
      title: '个人信息',
      description: '编辑您的基本信息和头像',
      icon: User,
      href: '/admin/profile',
      color: 'bg-blue-500',
    },
    {
      title: '工作经历',
      description: '管理工作经历（支持拖拽排序）',
      icon: Briefcase,
      href: '/admin/experience',
      color: 'bg-green-500',
    },
    {
      title: '教育背景',
      description: '管理教育经历（支持拖拽排序）',
      icon: GraduationCap,
      href: '/admin/education',
      color: 'bg-purple-500',
    },
    {
      title: '技能特长',
      description: '管理技能列表（支持拖拽排序）',
      icon: Wrench,
      href: '/admin/skills',
      color: 'bg-orange-500',
    },
    {
      title: '作品集',
      description: '管理作品和文件上传',
      icon: FolderOpen,
      href: '/admin/works',
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">个人作品集管理后台</h1>
            <p className="text-sm text-muted-foreground">欢迎，{username}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                预览网站
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`${item.color} p-2 rounded-lg`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </div>
                  <CardDescription className="mt-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
