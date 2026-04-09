'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Upload, ExternalLink, Eye, EyeOff, Mail, Phone, MapPin, Globe, Tag } from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface Profile {
  id?: number;
  name: string;
  title: string;
  bio: string;
  avatar_key: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  social_links: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    [key: string]: string | undefined;
  };
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  show_github: boolean;
  show_linkedin: boolean;
  show_twitter: boolean;
  show_instagram: boolean;
  // 自定义栏目
  custom_title: string;
  custom_content: string;
  show_custom: boolean;
}

export default function ProfilePage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [profile, setProfile] = useState<Profile>({
    name: '',
    title: '',
    bio: '',
    avatar_key: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    social_links: {},
    show_email: true,
    show_phone: true,
    show_location: true,
    show_github: false,
    show_linkedin: false,
    show_twitter: false,
    show_instagram: false,
    custom_title: '',
    custom_content: '',
    show_custom: false,
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]); // loadProfile 在组件生命周期内不会变化

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success && data.data) {
        const profileData = {
          ...data.data,
          name: data.data.name ?? '',
          title: data.data.title ?? '',
          bio: data.data.bio ?? '',
          email: data.data.email ?? '',
          phone: data.data.phone ?? '',
          location: data.data.location ?? '',
          website: data.data.website ?? '',
          avatar_key: data.data.avatar_key ?? '',
          social_links: data.data.social_links ?? {},
          show_email: data.data.show_email ?? true,
          show_phone: data.data.show_phone ?? true,
          show_location: data.data.show_location ?? true,
          show_github: data.data.show_github ?? false,
          show_linkedin: data.data.show_linkedin ?? false,
          show_twitter: data.data.show_twitter ?? false,
          show_instagram: data.data.show_instagram ?? false,
          custom_title: data.data.custom_title ?? '',
          custom_content: data.data.custom_content ?? '',
          show_custom: data.data.show_custom ?? false,
        };
        setProfile(profileData);
        if (profileData.avatar_key) {
          loadAvatarUrl(profileData.avatar_key);
        }
      }
    } catch (error) {
      console.error('加载个人信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvatarUrl = async (key: string) => {
    try {
      const res = await fetch('/api/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.success) {
        setAvatarUrl(data.data.url);
      }
    } catch (error) {
      console.error('加载头像失败:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'avatar');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile, avatar_key: data.data.key });
        setAvatarUrl(data.data.url);
      }
    } catch (error) {
      console.error('上传头像失败:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        alert('保存成功！');
      } else {
        alert('保存失败：' + data.error);
      }
    } catch {
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
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">个人信息</h1>
              <p className="text-sm text-muted-foreground">编辑您的基本信息</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              预览网站
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 头像 */}
          <Card>
            <CardHeader>
              <CardTitle>头像</CardTitle>
              <CardDescription>上传您的个人头像</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} alt="Avatar" />
                <AvatarFallback>{profile.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
                  <Upload className="h-4 w-4" />
                  上传头像
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  支持 JPG、PNG 格式，建议 400x400 像素
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>您的姓名、职位和简介</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 自定义栏目 - 放在姓名下方、职位上方 */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <Label className="font-medium">自定义栏目</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.show_custom ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={profile.show_custom}
                      onCheckedChange={(checked) => setProfile({ ...profile, show_custom: checked })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom_title">栏目标题</Label>
                    <Input
                      id="custom_title"
                      value={profile.custom_title ?? ''}
                      onChange={(e) => setProfile({ ...profile, custom_title: e.target.value })}
                      placeholder="如：意向岗位、曾经任职"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom_content">栏目内容</Label>
                    <Input
                      id="custom_content"
                      value={profile.custom_content ?? ''}
                      onChange={(e) => setProfile({ ...profile, custom_content: e.target.value })}
                      placeholder="填写对应的内容"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {profile.show_custom ? '将在职位上方显示' : '已隐藏，不会在前端显示'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={profile.name ?? ''}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="请输入姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">职位</Label>
                  <Input
                    id="title"
                    value={profile.title ?? ''}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    placeholder="如：高级前端工程师"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  value={profile.bio ?? ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="简单介绍一下自己..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* 联系方式 */}
          <Card>
            <CardHeader>
              <CardTitle>联系方式</CardTitle>
              <CardDescription>设置您的联系方式，可单独控制每项是否显示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 邮箱 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <Label className="font-medium">邮箱</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.show_email ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={profile.show_email}
                      onCheckedChange={(checked) => setProfile({ ...profile, show_email: checked })}
                    />
                  </div>
                </div>
                <Input
                  type="email"
                  value={profile.email ?? ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="your@email.com"
                />
                <p className="text-xs text-muted-foreground">
                  {profile.show_email ? '将在前端显示' : '已隐藏，不会在前端显示'}
                </p>
              </div>

              {/* 电话 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-500" />
                    <Label className="font-medium">电话</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.show_phone ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={profile.show_phone}
                      onCheckedChange={(checked) => setProfile({ ...profile, show_phone: checked })}
                    />
                  </div>
                </div>
                <Input
                  value={profile.phone ?? ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+86 123 4567 8900"
                />
                <p className="text-xs text-muted-foreground">
                  {profile.show_phone ? '将在前端显示' : '已隐藏，不会在前端显示'}
                </p>
              </div>

              {/* 位置 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <Label className="font-medium">位置</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.show_location ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={profile.show_location}
                      onCheckedChange={(checked) => setProfile({ ...profile, show_location: checked })}
                    />
                  </div>
                </div>
                <Input
                  value={profile.location ?? ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="如：北京，中国"
                />
                <p className="text-xs text-muted-foreground">
                  {profile.show_location ? '将在前端显示' : '已隐藏，不会在前端显示'}
                </p>
              </div>

              {/* 个人网站 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <Label className="font-medium">个人网站</Label>
                </div>
                <Input
                  value={profile.website ?? ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
                <p className="text-xs text-muted-foreground">
                  始终显示，点击可在新窗口打开
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 社交链接 */}
          <Card>
            <CardHeader>
              <CardTitle>社交链接</CardTitle>
              <CardDescription>设置您的社交媒体链接，默认隐藏，开启后才会显示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* GitHub */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </Label>
                  <div className="flex items-center gap-2">
                    {profile.show_github ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={profile.show_github}
                      onCheckedChange={(checked) => setProfile({ ...profile, show_github: checked })}
                    />
                  </div>
                </div>
                <Input
                  value={profile.social_links?.github ?? ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      social_links: { ...profile.social_links, github: e.target.value },
                    })
                  }
                  placeholder="https://github.com/username"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </Label>
                  <div className="flex items-center gap-2">
                    {profile.show_linkedin ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={profile.show_linkedin}
                      onCheckedChange={(checked) => setProfile({ ...profile, show_linkedin: checked })}
                    />
                  </div>
                </div>
                <Input
                  value={profile.social_links?.linkedin ?? ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      social_links: { ...profile.social_links, linkedin: e.target.value },
                    })
                  }
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              {/* Twitter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter / X
                  </Label>
                  <div className="flex items-center gap-2">
                    {profile.show_twitter ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={profile.show_twitter}
                      onCheckedChange={(checked) => setProfile({ ...profile, show_twitter: checked })}
                    />
                  </div>
                </div>
                <Input
                  value={profile.social_links?.twitter ?? ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      social_links: { ...profile.social_links, twitter: e.target.value },
                    })
                  }
                  placeholder="https://twitter.com/username"
                />
              </div>

              {/* Instagram */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </Label>
                  <div className="flex items-center gap-2">
                    {profile.show_instagram ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={profile.show_instagram}
                      onCheckedChange={(checked) => setProfile({ ...profile, show_instagram: checked })}
                    />
                  </div>
                </div>
                <Input
                  value={profile.social_links?.instagram ?? ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      social_links: { ...profile.social_links, instagram: e.target.value },
                    })
                  }
                  placeholder="https://instagram.com/username"
                />
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-between gap-4">
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/dashboard">
                  返回后台
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  返回首页
                </Link>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  新窗口预览
                </Link>
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
