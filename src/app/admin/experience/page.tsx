'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Plus, GripVertical, Edit2, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { RichTextEditor } from '@/components/RichTextEditor';
import { RichTextContent } from '@/components/RichTextContent';
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

interface WorkExperienceImage {
  id?: number;
  file_key: string;
  title: string;
  url?: string;
  order: number;
}

interface WorkExperience {
  id: number;
  company: string;
  position: string;
  description: string;
  description_align?: string;
  start_date: string;
  end_date: string;
  location: string;
  image_display_mode?: string;
  order: number;
  work_experience_images?: WorkExperienceImage[];
}

interface SortableItemProps {
  experience: WorkExperience;
  onEdit: (exp: WorkExperience) => void;
  onDelete: (id: number) => void;
}

function SortableItem({ experience, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: experience.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const imageCount = experience.work_experience_images?.length || 0;

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border shadow-sm">
      <button {...attributes} {...listeners} className="mt-1 cursor-grab hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{experience.position}</h3>
            <p className="text-sm text-muted-foreground">{experience.company}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {experience.start_date} - {experience.end_date || '至今'}
              {experience.location && ` · ${experience.location}`}
            </p>
            {imageCount > 0 && (
              <p className="text-xs text-blue-500 mt-1">
                {imageCount} 张图片 · {experience.image_display_mode === 'carousel' ? '轮播展示' : '横排展示'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(experience)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(experience.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        {experience.description && (
          <div className="text-sm text-muted-foreground mt-2">
            <RichTextContent html={experience.description} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExperiencePage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    description: '',
    description_align: 'left',
    start_date: '',
    end_date: '',
    location: '',
    image_display_mode: 'none',
  });
  const [images, setImages] = useState<WorkExperienceImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadExperiences();
    }
  }, [isAuthenticated]);

  const loadExperiences = async () => {
    try {
      const res = await fetch('/api/work-experiences');
      const data = await res.json();
      if (data.success) {
        // 加载图片URL
        const experiencesWithUrls = await Promise.all(
          data.data.map(async (exp: WorkExperience) => {
            if (exp.work_experience_images && exp.work_experience_images.length > 0) {
              const imagesWithUrls = await Promise.all(
                exp.work_experience_images.map(async (img) => {
                  try {
                    const res = await fetch('/api/file-url', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: img.file_key }),
                    });
                    const urlData = await res.json();
                    return { ...img, url: urlData.success ? urlData.data.url : '' };
                  } catch {
                    return img;
                  }
                })
              );
              return { ...exp, work_experience_images: imagesWithUrls };
            }
            return exp;
          })
        );
        setExperiences(experiencesWithUrls);
      }
    } catch (error) {
      console.error('加载工作经历失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = experiences.findIndex((e) => e.id === active.id);
      const newIndex = experiences.findIndex((e) => e.id === over.id);
      const newExperiences = arrayMove(experiences, oldIndex, newIndex);
      setExperiences(newExperiences);

      const items = newExperiences.map((exp, index) => ({
        id: exp.id,
        order: index,
      }));

      try {
        await fetch('/api/work-experiences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      } catch (error) {
        console.error('保存排序失败:', error);
      }
    }
  };

  const handleOpenDialog = async (experience?: WorkExperience) => {
    if (experience) {
      setEditingExperience(experience);
      setFormData({
        company: experience.company ?? '',
        position: experience.position ?? '',
        description: experience.description ?? '',
        description_align: experience.description_align ?? 'left',
        start_date: experience.start_date ?? '',
        end_date: experience.end_date ?? '',
        location: experience.location ?? '',
        image_display_mode: experience.image_display_mode ?? 'none',
      });
      
      // 加载图片
      if (experience.work_experience_images && experience.work_experience_images.length > 0) {
        const imagesWithUrls = await Promise.all(
          experience.work_experience_images.map(async (img) => {
            if (!img.url && img.file_key) {
              try {
                const res = await fetch('/api/file-url', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: img.file_key }),
                });
                const data = await res.json();
                return { ...img, url: data.success ? data.data.url : '' };
              } catch {
                return img;
              }
            }
            return img;
          })
        );
        setImages(imagesWithUrls);
      } else {
        setImages([]);
      }
    } else {
      setEditingExperience(null);
      setFormData({
        company: '',
        position: '',
        description: '',
        description_align: 'left',
        start_date: '',
        end_date: '',
        location: '',
        image_display_mode: 'none',
      });
      setImages([]);
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const newImages: WorkExperienceImage[] = [];

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
          newImages.push({
            file_key: data.data.key,
            title: file.name,
            url: data.data.url,
            order: images.length + newImages.length,
          });
        }
      }

      setImages([...images, ...newImages]);
      
      // 自动切换到横排模式
      if (formData.image_display_mode === 'none' && newImages.length > 0) {
        setFormData({ ...formData, image_display_mode: 'grid' });
      }
    } catch (error) {
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageId: number | undefined, index: number) => {
    if (imageId && editingExperience) {
      // 从数据库删除
      try {
        await fetch(`/api/work-experiences/${editingExperience.id}/images?imageId=${imageId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('删除图片失败:', error);
      }
    }
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // 如果没有图片了，切换回无图片模式
    if (newImages.length === 0) {
      setFormData({ ...formData, image_display_mode: 'none' });
    }
  };

  const handleSave = async () => {
    const url = editingExperience
      ? `/api/work-experiences/${editingExperience.id}`
      : '/api/work-experiences';
    const method = editingExperience ? 'PUT' : 'POST';

    const body = {
      ...formData,
      order: editingExperience ? editingExperience.order : experiences.length,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        const expId = data.data.id;

        // 保存图片
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (!img.file_key) continue;

          if (!img.id) {
            // 新图片
            await fetch(`/api/work-experiences/${expId}/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file_key: img.file_key,
                title: img.title,
                order: i,
              }),
            });
          }
        }

        setDialogOpen(false);
        loadExperiences();
      } else {
        alert('保存失败：' + data.error);
      }
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条工作经历吗？')) return;

    try {
      const res = await fetch(`/api/work-experiences/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadExperiences();
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
              <h1 className="text-2xl font-bold">工作经历</h1>
              <p className="text-sm text-muted-foreground">拖拽调整顺序</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            添加经历
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {experiences.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>还没有工作经历，点击右上角按钮添加</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={experiences.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {experiences.map((experience) => (
                  <SortableItem
                    key={experience.id}
                    experience={experience}
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
            <DialogTitle>{editingExperience ? '编辑工作经历' : '添加工作经历'}</DialogTitle>
            <DialogDescription>填写您的工作经历信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">公司</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="公司名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">职位</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="职位名称"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">开始时间</Label>
                <Input
                  id="start_date"
                  type="month"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">结束时间</Label>
                <Input
                  id="end_date"
                  type="month"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  placeholder="至今"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">地点</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="如：北京"
              />
            </div>
            <div className="space-y-2">
              <Label>工作描述</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(html) => setFormData({ ...formData, description: html })}
                placeholder="描述您的工作内容和成就...&#10;支持加粗、颜色、列表等格式"
                minHeight={150}
              />
              <p className="text-xs text-muted-foreground">支持加粗、颜色、下划线、列表等格式，点击编辑框显示工具栏</p>
            </div>

            {/* 图片上传区域 */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>工作图片（可选）</Label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={uploading}
                >
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-1" />
                    {uploading ? '上传中...' : '上传图片'}
                  </label>
                </Button>
              </div>

              {images.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label>展示模式</Label>
                    <Select
                      value={formData.image_display_mode}
                      onValueChange={(value) => setFormData({ ...formData, image_display_mode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">横排并列展示</SelectItem>
                        <SelectItem value="carousel">横向轮播展示</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.url}
                          alt={img.title}
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => handleRemoveImage(img.id, index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
