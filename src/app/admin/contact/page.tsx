'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Upload,
  X,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ContactInfo {
  id?: number;
  email: string;
  phone: string;
  wechat_qr_key: string;
  wechat_id: string;
  is_visible: boolean;
}

export default function ContactPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wechatQrUrl, setWechatQrUrl] = useState('');
  const [formData, setFormData] = useState<ContactInfo>({
    email: '',
    phone: '',
    wechat_qr_key: '',
    wechat_id: '',
    is_visible: true,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadContactInfo();
    }
  }, [isAuthenticated]);

  const loadContactInfo = async () => {
    try {
      const res = await fetch('/api/contact-info');
      const data = await res.json();
      if (data.success && data.data) {
        setFormData({
          email: data.data.email || '',
          phone: data.data.phone || '',
          wechat_qr_key: data.data.wechat_qr_key || '',
          wechat_id: data.data.wechat_id || '',
          is_visible: data.data.is_visible ?? true,
        });

        if (data.data.wechat_qr_key) {
          loadWechatQrUrl(data.data.wechat_qr_key);
        }
      }
    } catch (error) {
      console.error('加载联系方式失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWechatQrUrl = async (key: string) => {
    try {
      const res = await fetch('/api/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.success) {
        setWechatQrUrl(data.data.url);
      }
    } catch {}
  };

  const handleWechatQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('type', 'contact');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await res.json();

      if (data.success) {
        setFormData({ ...formData, wechat_qr_key: data.data.key });
        setWechatQrUrl(data.data.url);
      } else {
        alert('上传失败：' + data.error);
      }
    } catch {
      alert('上传失败，请重试');
    }
  };

  const handleRemoveWechatQr = () => {
    setFormData({ ...formData, wechat_qr_key: '' });
    setWechatQrUrl('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/contact-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        alert('保存成功');
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
      <header className="bg-white dark:bg-slate-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">联系方式</h1>
            <p className="text-sm text-muted-foreground">编辑页面底部的联系方式信息</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>联系方式设置</CardTitle>
            <CardDescription>设置前端页面底部显示的联系方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 显示开关 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>显示联系方式模块</Label>
                <p className="text-sm text-muted-foreground">
                  关闭后前端页面将不显示联系方式模块
                </p>
              </div>
              <Switch
                checked={formData.is_visible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_visible: checked })
                }
              />
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                邮箱
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>

            {/* 电话 */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                电话（可选）
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="13800138000"
              />
            </div>

            {/* 微信号 */}
            <div className="space-y-2">
              <Label htmlFor="wechat_id" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                微信号（可选）
              </Label>
              <Input
                id="wechat_id"
                value={formData.wechat_id}
                onChange={(e) => setFormData({ ...formData, wechat_id: e.target.value })}
                placeholder="your_wechat_id"
              />
              <p className="text-xs text-muted-foreground">
                用户可复制微信号添加好友
              </p>
            </div>

            {/* 微信二维码 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                微信二维码（可选）
              </Label>
              
              {wechatQrUrl ? (
                <div className="relative inline-block">
                  <img
                    src={wechatQrUrl}
                    alt="微信二维码"
                    className="w-40 h-40 object-contain border rounded-lg"
                  />
                  <button
                    onClick={handleRemoveWechatQr}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWechatQrUpload}
                    className="hidden"
                    id="wechat-qr-upload"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="wechat-qr-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      上传二维码
                    </label>
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
