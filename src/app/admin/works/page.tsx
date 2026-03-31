'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, GripVertical, Edit2, Trash2, Upload, X, FileText, Image, Video, ImageIcon } from 'lucide-react';
import Link from 'next/link';
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

interface WorkItem {
  id?: number;
  type: string;
  title: string;
  file_key: string;
  description?: string;
  is_carousel_item?: boolean;
  order: number;
}

interface Work {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  display_mode?: string;
  cover_image_key?: string;
  order: number;
  work_items?: WorkItem[];
}

interface SortableItemProps {
  work: Work;
  onEdit: (work: Work) => void;
  onDelete: (id: number) => void;
}

function SortableItem({ work, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: work.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDisplayModeLabel = (mode?: string) => {
    switch (mode) {
      case 'carousel':
        return '多图轮播';
      case 'combined':
        return '组合展示';
      default:
        return '单文件';
    }
  };

  const carouselCount = work.work_items?.filter(item => item.is_carousel_item).length || 0;

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border shadow-sm">
      <button {...attributes} {...listeners} className="mt-1 cursor-grab hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{work.title}</h3>
              <Badge variant="outline" className="text-xs">{getDisplayModeLabel(work.display_mode)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{work.category}</p>
            {work.tags && work.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {work.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
            {work.display_mode === 'carousel' && carouselCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                轮播图片：{carouselCount} 张
              </p>
            )}
            {work.work_items && work.work_items.length > 0 && work.display_mode !== 'carousel' && (
              <div className="flex gap-2 mt-2">
                {work.work_items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getFileIcon(item.type)}
                    <span>{item.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(work)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(work.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        {work.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{work.description}</p>
        )}
      </div>
    </div>
  );
}

export default function WorksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    display_mode: 'single',
  });
  const [coverImageKey, setCoverImageKey] = useState<string>('');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [carouselItems, setCarouselItems] = useState<Array<{
    id?: number;
    file_key: string;
    title: string;
    url?: string;
  }>>([]);
  const [workItems, setWorkItems] = useState<Array<{
    id?: number;
    type: string;
    title: string;
    file_key: string;
  }>>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadingType, setUploadingType] = useState<'cover' | 'carousel' | 'file' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadWorks();
    }
  }, [isAuthenticated]);

  const loadWorks = async () => {
    try {
      const res = await fetch('/api/works');
      const data = await res.json();
      if (data.success) {
        setWorks(data.data);
      }
    } catch (error) {
      console.error('加载作品失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = works.findIndex((w) => w.id === active.id);
      const newIndex = works.findIndex((w) => w.id === over.id);
      const newWorks = arrayMove(works, oldIndex, newIndex);
      setWorks(newWorks);

      const items = newWorks.map((work, index) => ({
        id: work.id,
        order: index,
      }));

      try {
        await fetch('/api/works', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      } catch (error) {
        console.error('保存排序失败:', error);
      }
    }
  };

  const handleOpenDialog = async (work?: Work) => {
    if (work) {
      setEditingWork(work);
      setFormData({
        title: work.title ?? '',
        description: work.description ?? '',
        category: work.category ?? '',
        tags: work.tags?.join(', ') ?? '',
        display_mode: work.display_mode ?? 'single',
      });
      setCoverImageKey(work.cover_image_key ?? '');
      
      // 加载封面图URL
      if (work.cover_image_key) {
        const url = await loadFileUrl(work.cover_image_key);
        setCoverImageUrl(url);
      } else {
        setCoverImageUrl('');
      }

      // 分离轮播图片和普通文件
      const carousels: typeof carouselItems = [];
      const files: typeof workItems = [];
      
      work.work_items?.forEach(item => {
        if (item.is_carousel_item) {
          carousels.push({
            id: item.id,
            file_key: item.file_key,
            title: item.title ?? '',
          });
        } else {
          files.push({
            id: item.id,
            type: item.type ?? '',
            title: item.title ?? '',
            file_key: item.file_key,
          });
        }
      });

      // 加载轮播图片URL
      const carouselWithUrls = await Promise.all(
        carousels.map(async (item) => ({
          ...item,
          url: await loadFileUrl(item.file_key),
        }))
      );
      
      setCarouselItems(carouselWithUrls);
      setWorkItems(files);
    } else {
      setEditingWork(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: '',
        display_mode: 'single',
      });
      setCoverImageKey('');
      setCoverImageUrl('');
      setCarouselItems([]);
      setWorkItems([]);
    }
    setDialogOpen(true);
  };

  const loadFileUrl = async (key: string): Promise<string> => {
    try {
      const res = await fetch('/api/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      return data.success ? data.data.url : '';
    } catch {
      return '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType('cover');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('type', 'work');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success) {
        setCoverImageKey(data.data.key);
        setCoverImageUrl(data.data.url);
      } else {
        alert('上传失败：' + data.error);
      }
    } catch (error) {
      alert('上传失败，请重试');
    } finally {
      setUploadingType(null);
    }
  };

  const handleCarouselUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingType('carousel');

    try {
      const newItems: typeof carouselItems = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('type', 'work');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        const data = await res.json();
        
        if (data.success) {
          newItems.push({
            file_key: data.data.key,
            title: file.name,
            url: data.data.url,
          });
        }
      }

      setCarouselItems([...carouselItems, ...newItems]);
    } catch (error) {
      alert('上传失败，请重试');
    } finally {
      setUploadingType(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    setUploadingType('file');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('type', 'work');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success) {
        const fileType = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : 'pdf';

        const newItems = [...workItems];
        newItems[index] = {
          ...newItems[index],
          file_key: data.data.key,
          title: file.name,
          type: fileType,
        };
        setWorkItems(newItems);
      } else {
        alert('上传失败：' + data.error);
      }
    } catch (error) {
      alert('上传失败，请重试');
    } finally {
      setUploadingIndex(null);
      setUploadingType(null);
    }
  };

  const handleAddCarouselItem = () => {
    // 通过文件选择器触发多图上传
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => handleCarouselUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  const handleRemoveCarouselItem = (index: number) => {
    const newItems = carouselItems.filter((_, i) => i !== index);
    setCarouselItems(newItems);
  };

  const handleAddFileItem = () => {
    setWorkItems([...workItems, { type: 'pdf', title: '', file_key: '' }]);
  };

  const handleRemoveFileItem = (index: number) => {
    const newItems = workItems.filter((_, i) => i !== index);
    setWorkItems(newItems);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('请输入作品标题');
      return;
    }

    const url = editingWork ? `/api/works/${editingWork.id}` : '/api/works';
    const method = editingWork ? 'PUT' : 'POST';

    const body = {
      ...formData,
      cover_image_key: coverImageKey || null,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      order: editingWork ? editingWork.order : works.length,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        const workId = data.data.id;

        // 处理轮播图片
        for (let i = 0; i < carouselItems.length; i++) {
          const item = carouselItems[i];
          if (!item.file_key) continue;

          if (item.id) {
            await fetch(`/api/work-items/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'image',
                title: item.title,
                file_key: item.file_key,
                is_carousel_item: true,
                order: i,
              }),
            });
          } else {
            await fetch(`/api/works/${workId}/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'image',
                title: item.title,
                file_key: item.file_key,
                is_carousel_item: true,
                order: i,
              }),
            });
          }
        }

        // 处理普通文件
        for (let i = 0; i < workItems.length; i++) {
          const item = workItems[i];
          if (!item.file_key) continue;

          if (item.id) {
            await fetch(`/api/work-items/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: item.type,
                title: item.title,
                file_key: item.file_key,
                is_carousel_item: false,
                order: i,
              }),
            });
          } else {
            await fetch(`/api/works/${workId}/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: item.type,
                title: item.title,
                file_key: item.file_key,
                is_carousel_item: false,
                order: i,
              }),
            });
          }
        }

        setDialogOpen(false);
        loadWorks();
      } else {
        alert('保存失败：' + data.error);
      }
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个作品吗？')) return;

    try {
      const res = await fetch(`/api/works/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadWorks();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      alert('删除失败，请重试');
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">作品集</h1>
              <p className="text-sm text-muted-foreground">拖拽调整顺序</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            添加作品
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {works.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>还没有作品，点击右上角按钮添加</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={works.map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {works.map((work) => (
                  <SortableItem
                    key={work.id}
                    work={work}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWork ? '编辑作品' : '添加作品'}</DialogTitle>
            <DialogDescription>填写作品信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">作品标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="作品标题"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">分类</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="如：PPT设计、视频剪辑"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_mode">展示模式</Label>
                  <Select
                    value={formData.display_mode}
                    onValueChange={(value) => setFormData({ ...formData, display_mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">单文件/单图</SelectItem>
                      <SelectItem value="carousel">多图轮播</SelectItem>
                      <SelectItem value="combined">组合展示</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">标签（用逗号分隔）</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="如：React, TypeScript, 前端"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">作品描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述您的作品..."
                  rows={3}
                />
              </div>
            </div>

            {/* 封面图上传 */}
            <div className="space-y-3">
              <Label>封面图（可选，用于PDF/PPT等文件的卡片封面）</Label>
              <div className="flex items-start gap-4">
                {coverImageUrl ? (
                  <div className="relative">
                    <img
                      src={coverImageUrl}
                      alt="封面"
                      className="w-32 h-24 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => { setCoverImageKey(''); setCoverImageUrl(''); }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label htmlFor="cover-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild disabled={uploadingType === 'cover'}>
                      <span>
                        <Upload className="h-4 w-4 mr-1" />
                        {uploadingType === 'cover' ? '上传中...' : '上传封面'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    建议尺寸 16:9，如 800x450 像素
                  </p>
                </div>
              </div>
            </div>

            {/* 轮播图片（仅轮播模式显示） */}
            {formData.display_mode === 'carousel' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>轮播图片</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCarouselItem} disabled={uploadingType === 'carousel'}>
                    <Plus className="h-4 w-4 mr-1" />
                    {uploadingType === 'carousel' ? '上传中...' : '添加图片'}
                  </Button>
                </div>
                {carouselItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                    点击"添加图片"上传轮播图片（支持多选）
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {carouselItems.map((item, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => handleRemoveCarouselItem(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 文件上传（非轮播模式显示） */}
            {formData.display_mode !== 'carousel' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>文件（支持 PDF、图片、视频）</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddFileItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加文件
                  </Button>
                </div>
                {workItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.type || '未上传'}</Badge>
                        {item.title && <span className="text-sm text-muted-foreground">{item.title}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,image/*,video/*"
                          onChange={(e) => handleFileUpload(e, index)}
                          className="hidden"
                          id={`file-${index}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={uploadingIndex === index && uploadingType === 'file'}
                        >
                          <label htmlFor={`file-${index}`} className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-1" />
                            {uploadingIndex === index && uploadingType === 'file' ? '上传中...' : item.file_key ? '重新上传' : '上传文件'}
                          </label>
                        </Button>
                        {item.file_key && (
                          <span className="text-xs text-green-600">已上传</span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFileItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
