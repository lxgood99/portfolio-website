'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminAuth() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // checkAuth 在组件生命周期内不会变化

  const checkAuth = async () => {
    try {
      // 从 localStorage 获取 session 信息
      const sessionToken = localStorage.getItem('admin_session');
      const storedUsername = localStorage.getItem('admin_user');

      if (!sessionToken || !storedUsername) {
        router.push('/admin');
        setIsLoading(false);
        return;
      }

      // 验证 session 是否有效
      const res = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'X-Admin-User': storedUsername,
        },
      });

      const data = await res.json();
      if (data.success && data.data.authenticated) {
        setUsername(data.data.username);
        setIsAuthenticated(true);
      } else {
        // 清除无效的 session
        localStorage.removeItem('admin_session');
        localStorage.removeItem('admin_user');
        router.push('/admin');
      }
    } catch (error) {
      console.error('验证登录状态失败:', error);
      router.push('/admin');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      // 清除 localStorage
      localStorage.removeItem('admin_session');
      localStorage.removeItem('admin_user');
      router.push('/admin');
    }
  };

  return { username, isLoading, isAuthenticated, logout };
}
