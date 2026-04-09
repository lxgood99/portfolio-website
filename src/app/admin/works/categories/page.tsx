'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Image,
  FileText,
  Video,
  Layers,
} from 'lucide-react';

interface Category {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
}

export default function CategoriesPage() {
  const isAuthenticated = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // 加载分类
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/work-categories?include_hidden=true');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
    }
  }, [isAuthenticated, loadCategories]);

  // 移动分类
  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const newCategories = [...categories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
    
    // 更新 sort_order
    const updatedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      sort_order: idx,
    }));
    
    setCategories(updatedCategories);

    // 保存到服务器
    try {
      await fetch('/api/work-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedCategories.map(cat => ({
            id: cat.id,
            sort_order: cat.sort_order,
          })),
        }),
      });
    } catch (error) {
      console.error('更新排序失败:', error);
      loadCategories();
    }
  };

  // 开始编辑
  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.display_name);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/work-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          display_name: editingName.trim(),
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setCategories(prev =>
          prev.map(cat =>
            cat.id === editingId ? { ...cat, display_name: editingName.trim() } : cat
          )
        );
        cancelEdit();
      } else {
        alert('保存失败: ' + data.error);
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 添加新分类
  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/work-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: newCategoryName.trim(),
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setCategories(prev => [...prev, data.data]);
        setNewCategoryName('');
        setIsAddingNew(false);
      } else {
        alert('添加失败: ' + data.error);
      }
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 删除分类
  const deleteCategory = async (id: number) => {
    try {
      const res = await fetch(`/api/work-categories?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
        setDeleteConfirm(null);
      } else {
        alert('删除失败: ' + data.error);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 获取分类图标
  const getCategoryIcon = (categoryType: string) => {
    if (categoryType.includes('image') || categoryType.includes('img')) {
      return <Image className="h-4 w-4" />;
    }
    if (categoryType.includes('ppt') || categoryType.includes('pdf')) {
      return <FileText className="h-4 w-4" />;
    }
    if (categoryType.includes('video') || categoryType.includes('vid')) {
      return <Video className="h-4 w-4" />;
    }
    return <Layers className="h-4 w-4" />;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Layers className="h-6 w-6" />
              作品分类管理
            </CardTitle>
            <CardDescription>
              自定义分类名称、调整显示顺序、添加或删除分类
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : (
              <div className="space-y-2">
                {/* 分类列表 */}
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* 拖拽手柄 */}
                    <div className="text-muted-foreground cursor-grab">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* 分类图标 */}
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                      {getCategoryIcon(category.category_type)}
                    </div>

                    {/* 分类名称 */}
                    {editingId === category.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={saveEdit}
                          disabled={isSaving || !editingName.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-2">
                        <span className="font-medium">{category.display_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {category.category_type}
                        </Badge>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    {editingId !== category.id && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveCategory(index, 'up')}
                          disabled={index === 0}
                          title="上移"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveCategory(index, 'down')}
                          disabled={index === categories.length - 1}
                          title="下移"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(category)}
                          title="编辑名称"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirm(category.id)}
                          className="text-destructive hover:text-destructive"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* 添加新分类 */}
                {isAddingNew ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-primary bg-primary/5">
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                      <Plus className="h-4 w-4" />
                    </div>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="输入分类名称"
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addCategory();
                        if (e.key === 'Escape') {
                          setIsAddingNew(false);
                          setNewCategoryName('');
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={addCategory}
                      disabled={isSaving || !newCategoryName.trim()}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewCategoryName('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsAddingNew(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加新分类
                  </Button>
                )}
              </div>
            )}

            {/* 说明 */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="font-medium mb-2">使用说明：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>点击分类名称旁边的编辑按钮修改名称</li>
                <li>使用上下箭头调整分类的显示顺序</li>
                <li>删除分类前请先确保该分类下没有作品</li>
                <li>分类名称修改后，前端展示页面会同步更新</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个分类吗？删除后无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteCategory(deleteConfirm)}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
