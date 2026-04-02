'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, FileText, AlertCircle, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DevLog {
  id: number;
  version: string;
  title: string;
  created_at: string;
  requirements: string;
  completed_features: string;
  bug_fixes: string;
  notes: string;
  order_index: number;
}

// 版本号格式校验
function isValidVersion(version: string): boolean {
  // 支持 V1.0, V1.1, V1.2.bug1 等格式
  const pattern = /^V\d+(\.\d+)*(\.bug\d*)?$/;
  return pattern.test(version);
}

// 简易富文本编辑器
function SimpleEditor({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const contentRef = useState<HTMLDivElement | null>(null);
  
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-1.5 border-b bg-slate-50 dark:bg-slate-800">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-7 w-7 p-0 font-bold"
          title="加粗"
        >
          B
        </Button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
        <select
          onChange={(e) => execCommand('fontSize', e.target.value)}
          className="h-7 px-2 text-sm rounded border-0 bg-transparent"
          defaultValue="3"
        >
          <option value="1">小号</option>
          <option value="2">较小</option>
          <option value="3">正常</option>
          <option value="4">较大</option>
          <option value="5">大号</option>
        </select>
      </div>
      {/* 编辑区域 */}
      <div
        ref={(el) => {
          if (el && !el.innerHTML && value) {
            el.innerHTML = value;
          }
        }}
        contentEditable
        onInput={(e) => {
          onChange(e.currentTarget.innerHTML);
        }}
        onBlur={(e) => {
          onChange(e.currentTarget.innerHTML);
        }}
        className="min-h-[100px] p-3 focus:outline-none text-sm leading-relaxed"
        data-placeholder={placeholder}
        style={{ 
          minHeight: '100px',
        }}
      />
    </div>
  );
}

export default function DevLogsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DevLog | null>(null);
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    requirements: '',
    completed_features: '',
    bug_fixes: '',
    notes: '',
  });
  const [versionError, setVersionError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadLogs();
    }
  }, [isAuthenticated]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/dev-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (log?: DevLog) => {
    if (log) {
      setEditingLog(log);
      setFormData({
        version: log.version,
        title: log.title,
        requirements: log.requirements || '',
        completed_features: log.completed_features || '',
        bug_fixes: log.bug_fixes || '',
        notes: log.notes || '',
      });
    } else {
      setEditingLog(null);
      setFormData({
        version: '',
        title: '',
        requirements: '',
        completed_features: '',
        bug_fixes: '',
        notes: '',
      });
    }
    setVersionError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // 验证版本号格式
    if (!isValidVersion(formData.version)) {
      setVersionError('版本号格式错误，示例：V1.0, V1.1, V1.2.bug1');
      return;
    }

    const url = editingLog
      ? `/api/dev-logs/${editingLog.id}`
      : '/api/dev-logs';
    const method = editingLog ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        loadLogs();
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条日志吗？')) return;

    try {
      await fetch(`/api/dev-logs/${id}`, { method: 'DELETE' });
      loadLogs();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 获取版本类型标签
  const getVersionBadge = (version: string) => {
    if (version.includes('.bug')) {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">修复版</span>;
    } else if (version.match(/V\d+\.\d+/)) {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">功能版</span>;
    } else {
      return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">大版本</span>;
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            开发工作日志
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            记录项目开发历程，仅管理员可见
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回后台
            </Link>
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            新增日志
          </Button>
        </div>
      </div>

      {/* 版本规则说明 */}
      <Card className="bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2 text-sm">版本号规则</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><span className="font-medium text-green-600 dark:text-green-400">V1/V2</span> - 大版本：整体架构、核心模块新增</p>
            <p><span className="font-medium text-blue-600 dark:text-blue-400">V1.1/V1.2</span> - 小版本：局部功能迭代优化</p>
            <p><span className="font-medium text-red-600 dark:text-red-400">V1.2.bug1</span> - 修复版：仅修漏洞/报错</p>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">暂无日志记录</div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary">{log.version}</span>
                      {getVersionBadge(log.version)}
                    </div>
                    <CardTitle className="text-lg">{log.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(log)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(log.created_at)}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {log.requirements && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">本次需求</h4>
                    <div 
                      className="text-sm text-muted-foreground pl-3 border-l-2 border-blue-200 dark:border-blue-800"
                      dangerouslySetInnerHTML={{ __html: log.requirements }}
                    />
                  </div>
                )}
                {log.completed_features && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">完成功能</h4>
                    <div 
                      className="text-sm text-muted-foreground pl-3 border-l-2 border-green-200 dark:border-green-800"
                      dangerouslySetInnerHTML={{ __html: log.completed_features }}
                    />
                  </div>
                )}
                {log.bug_fixes && log.bug_fixes !== '<p>无</p>' && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">修复问题</h4>
                    <div 
                      className="text-sm text-muted-foreground pl-3 border-l-2 border-red-200 dark:border-red-800"
                      dangerouslySetInnerHTML={{ __html: log.bug_fixes }}
                    />
                  </div>
                )}
                {log.notes && log.notes !== '<p>无</p>' && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">备注</h4>
                    <div 
                      className="text-sm text-muted-foreground pl-3 border-l-2 border-slate-200 dark:border-slate-700"
                      dangerouslySetInnerHTML={{ __html: log.notes }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新建/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLog ? '编辑日志' : '新增日志'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 版本号 */}
            <div>
              <Label htmlFor="version">版本号 *</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => {
                  setFormData({ ...formData, version: e.target.value });
                  setVersionError('');
                }}
                placeholder="例如：V1.0, V1.1, V1.2.bug1"
              />
              {versionError && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {versionError}
                </div>
              )}
            </div>

            {/* 标题 */}
            <div>
              <Label htmlFor="title">版本标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：基础骨架版"
              />
            </div>

            {/* 本次需求 */}
            <div>
              <Label>本次需求</Label>
              <SimpleEditor
                value={formData.requirements}
                onChange={(html) => setFormData({ ...formData, requirements: html })}
                placeholder="描述本次开发需求..."
              />
            </div>

            {/* 完成功能 */}
            <div>
              <Label>完成功能</Label>
              <SimpleEditor
                value={formData.completed_features}
                onChange={(html) => setFormData({ ...formData, completed_features: html })}
                placeholder="列出已完成的功能..."
              />
            </div>

            {/* 修复问题 */}
            <div>
              <Label>修复问题</Label>
              <SimpleEditor
                value={formData.bug_fixes}
                onChange={(html) => setFormData({ ...formData, bug_fixes: html })}
                placeholder="记录修复的BUG..."
              />
            </div>

            {/* 备注 */}
            <div>
              <Label>备注说明</Label>
              <SimpleEditor
                value={formData.notes}
                onChange={(html) => setFormData({ ...formData, notes: html })}
                placeholder="其他备注..."
              />
            </div>

            {/* 按钮 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
