'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Save, GripVertical, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { RichTextEditor } from '@/components/RichTextEditor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SelfIntroduction {
  id: number;
  content: string;
  is_visible: boolean;
}

interface SelfIntroCard {
  id: number;
  title: string;
  content: string;
  order_index: number;
}

interface SortableCardItemProps {
  card: SelfIntroCard;
  onEdit: (card: SelfIntroCard) => void;
  onDelete: (id: number) => void;
}

function SortableCardItem({ card, onEdit, onDelete }: SortableCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border shadow-sm">
      <button {...attributes} {...listeners} className="cursor-grab hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded mt-1">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate">{card.title || '无标题'}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{card.content || '无内容'}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onEdit(card)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(card.id)} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SelfIntroductionPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [selfIntro, setSelfIntro] = useState<SelfIntroduction | null>(null);
  const [cards, setCards] = useState<SelfIntroCard[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 卡片编辑对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<SelfIntroCard | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [introRes, cardsRes] = await Promise.all([
        fetch('/api/self-introduction'),
        fetch('/api/self-intro-cards'),
      ]);
      const introData = await introRes.json();
      const cardsData = await cardsRes.json();
      
      if (introData.success && introData.data) {
        setSelfIntro(introData.data);
        setIsVisible(introData.data.is_visible ?? true);
      }
      if (cardsData.success) {
        setCards(cardsData.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 拖拽排序
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((c) => c.id === active.id);
      const newIndex = cards.findIndex((c) => c.id === over.id);
      const newCards = arrayMove(cards, oldIndex, newIndex);
      setCards(newCards);

      const items = newCards.map((card, index) => ({
        id: card.id,
        order_index: index,
      }));

      try {
        await fetch('/api/self-intro-cards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      } catch (error) {
        console.error('保存排序失败:', error);
      }
    }
  };

  // 打开编辑对话框
  const handleOpenDialog = (card?: SelfIntroCard) => {
    if (card) {
      setEditingCard(card);
      setFormTitle(card.title);
      setFormContent(card.content);
    } else {
      setEditingCard(null);
      setFormTitle('');
      setFormContent('');
    }
    setDialogOpen(true);
  };

  // 保存卡片
  const handleSaveCard = async () => {
    if (!formContent.trim()) {
      alert('请输入内容');
      return;
    }

    try {
      const url = editingCard ? `/api/self-intro-cards/${editingCard.id}` : '/api/self-intro-cards';
      const method = editingCard ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, content: formContent }),
      });
      const data = await res.json();

      if (data.success) {
        setDialogOpen(false);
        loadData();
      } else {
        alert('保存失败：' + data.error);
      }
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  // 删除卡片
  const handleDeleteCard = async (id: number) => {
    if (!confirm('确定要删除这个卡片吗？')) return;

    try {
      const res = await fetch(`/api/self-intro-cards/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      alert('删除失败，请重试');
    }
  };

  // 保存显示开关
  const handleSaveVisibility = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/self-introduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: selfIntro?.content || '', is_visible: isVisible }),
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
            <h1 className="text-2xl font-bold">关于我</h1>
            <p className="text-sm text-muted-foreground">管理个人介绍卡片内容</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 显示开关 */}
        <Card>
          <CardHeader>
            <CardTitle>显示设置</CardTitle>
            <CardDescription>控制前端页面是否显示此模块</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>是否显示</Label>
                <p className="text-sm text-muted-foreground">
                  关闭后，前端页面将不显示「关于我」模块
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Switch checked={isVisible} onCheckedChange={setIsVisible} />
                <Button onClick={handleSaveVisibility} disabled={isSaving} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 卡片管理 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>卡片管理</CardTitle>
                <CardDescription>
                  添加、编辑、删除和拖拽排序卡片
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                添加卡片
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {cards.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {cards.map((card) => (
                      <SortableCardItem
                        key={card.id}
                        card={card}
                        onEdit={handleOpenDialog}
                        onDelete={handleDeleteCard}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>暂无卡片，点击上方按钮添加</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 历史数据迁移提示 */}
        {selfIntro?.content && cards.length === 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-amber-600 dark:text-amber-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">检测到历史数据</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    您之前的自我评价内容仍在保存中。如需使用新版卡片功能，请手动添加卡片并复制内容。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* 卡片编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCard ? '编辑卡片' : '添加卡片'}</DialogTitle>
            <DialogDescription>
              填写卡片的标题和内容，支持富文本编辑（加粗、斜体、颜色、列表等）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题（可选）</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="例如：个人简介、工作态度等"
              />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <RichTextEditor
                value={formContent}
                onChange={setFormContent}
                placeholder="请输入卡片内容，支持加粗、斜体、列表等格式..."
                minHeight={150}
              />
              <p className="text-xs text-muted-foreground">
                提示：点击编辑区域显示格式工具栏，支持加粗、斜体、颜色、列表等格式
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveCard}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
