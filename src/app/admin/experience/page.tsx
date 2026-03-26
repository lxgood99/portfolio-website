'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, GripVertical, Edit2, Trash2 } from 'lucide-react';
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

interface WorkExperience {
  id: number;
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  order: number;
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
          <p className="text-sm text-muted-foreground mt-2">{experience.description}</p>
        )}
      </div>
    </div>
  );
}

export default function ExperiencePage() {
  const router = useRouter();
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    checkAuth();
    loadExperiences();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/verify');
      const data = await res.json();
      if (!data.success || !data.data.authenticated) {
        router.push('/admin');
      }
    } catch (error) {
      router.push('/admin');
    }
  };

  const loadExperiences = async () => {
    try {
      const res = await fetch('/api/work-experiences');
      const data = await res.json();
      if (data.success) {
        setExperiences(data.data);
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

      // 保存排序
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

  const handleOpenDialog = (experience?: WorkExperience) => {
    if (experience) {
      setEditingExperience(experience);
      setFormData({
        company: experience.company,
        position: experience.position,
        description: experience.description || '',
        start_date: experience.start_date,
        end_date: experience.end_date || '',
        location: experience.location || '',
      });
    } else {
      setEditingExperience(null);
      setFormData({
        company: '',
        position: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
      });
    }
    setDialogOpen(true);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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

      {/* Main Content */}
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExperience ? '编辑工作经历' : '添加工作经历'}</DialogTitle>
            <DialogDescription>
              填写您的工作经历信息
            </DialogDescription>
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
                  placeholder="留空表示至今"
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
              <Label htmlFor="description">工作描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述您的主要工作内容和成就..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
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
