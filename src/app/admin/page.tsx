'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function AdminPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true); // 默认显示登录页面
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 先检查 localStorage
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('admin_session') : null;
      const storedUsername = typeof window !== 'undefined' ? localStorage.getItem('admin_user') : null;
      
      if (sessionToken && storedUsername) {
        // 验证 session 是否有效
        const res = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'X-Admin-User': storedUsername,
          },
        });
        const data = await res.json();
        if (data.success && data.data.authenticated) {
          router.push('/admin/dashboard');
        }
      }
    } catch (error) {
      console.error('验证登录状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performLogin = async (user: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });
    return res.json();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await performLogin(username, password);
      if (data.success && data.data.sessionToken) {
        // 将 session 信息存储到 localStorage
        localStorage.setItem('admin_session', data.data.sessionToken);
        localStorage.setItem('admin_user', data.data.username);
        // 使用完整页面刷新确保 cookie 生效
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.error || '登录失败');
        setIsLoading(false);
      }
    } catch (error) {
      setError('登录失败，请重试');
      setIsLoading(false);
    }
  };

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/init-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        // 初始化成功后自动登录
        const loginData = await performLogin(username, password);
        if (loginData.success && loginData.data.sessionToken) {
          // 将 session 信息存储到 localStorage
          localStorage.setItem('admin_session', loginData.data.sessionToken);
          localStorage.setItem('admin_user', loginData.data.username);
          // 使用完整页面刷新确保 cookie 生效
          window.location.href = '/admin/dashboard';
        } else {
          setError('初始化成功，但登录失败，请手动登录');
          setIsLogin(true);
          setIsLoading(false);
        }
      } else {
        setError(data.error || '初始化失败');
        setIsLoading(false);
      }
    } catch (error) {
      setError('初始化失败，请重试');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? '管理员登录' : '初始化管理员'}</CardTitle>
          <CardDescription>
            {isLogin
              ? '请输入您的用户名和密码'
              : '首次使用，请创建管理员账户'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleInit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '处理中...' : isLogin ? '登录' : '创建并登录'}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? '需要初始化管理员？' : '已有账户？去登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
