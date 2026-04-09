'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

interface Education {
  id: number;
  school: string;
  degree: string;
  field: string;
  description: string;
  description_align?: string;
  start_date: string;
  end_date: string;
  order: number;
  awards?: string;
  gpa?: string;
  ranking?: string;
}

interface SortableItemProps {
  education: Education;
  onEdit: (edu: Education) => void;
  onDelete: (id: number) => void;
}

function SortableItem({ education, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: education.id });

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
            <h3 className="font-semibold">{education.school}</h3>
            <p className="text-sm text-muted-foreground">{education.degree} · {education.field}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {education.start_date} - {education.end_date || '至今'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(education)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(education.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        {education.description && (
          <p className="text-sm text-muted-foreground mt-2">{education.description}</p>
        )}
      </div>
    </div>
  );
}

export default function EducationPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [educations, setEducations] = useState<Education[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [formData, setFormData] = useState({
    school: '',
    degree: '',
    field: '',
    description: '',
    description_align: 'left',
    start_date: '',
    end_date: '',
    awards: '',
    gpa: '',
    ranking: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadEducations();
    }
  }, [isAuthenticated]);

  const loadEducations = async () => {
    try {
      const res = await fetch('/api/educations');
      const data = await res.json();
      if (data.success) {
        setEducations(data.data);
      }
    } catch (error) {
      console.error('加载教育经历失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = educations.findIndex((e) => e.id === active.id);
      const newIndex = educations.findIndex((e) => e.id === over.id);
      const newEducations = arrayMove(educations, oldIndex, newIndex);
      setEducations(newEducations);

      const items = newEducations.map((edu, index) => ({
        id: edu.id,
        order: index,
      }));

      try {
        await fetch('/api/educations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      } catch (error) {
        console.error('保存排序失败:', error);
      }
    }
  };

  const handleOpenDialog = (education?: Education) => {
    if (education) {
      setEditingEducation(education);
      setFormData({
        school: education.school ?? '',
        degree: education.degree ?? '',
        field: education.field ?? '',
        description: education.description ?? '',
        description_align: education.description_align ?? 'left',
        start_date: education.start_date ?? '',
        end_date: education.end_date ?? '',
        awards: education.awards ?? '',
        gpa: education.gpa ?? '',
        ranking: education.ranking ?? '',
      });
    } else {
      setEditingEducation(null);
      setFormData({
        school: '',
        degree: '',
        field: '',
        description: '',
        description_align: 'left',
        start_date: '',
        end_date: '',
        awards: '',
        gpa: '',
        ranking: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const url = editingEducation
      ? `/api/educations/${editingEducation.id}`
      : '/api/educations';
    const method = editingEducation ? 'PUT' : 'POST';

    const body = {
      ...formData,
      order: editingEducation ? editingEducation.order : educations.length,
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
        loadEducations();
      } else {
        alert('保存失败：' + data.error);
      }
    } catch {
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条教育经历吗？')) return;

    try {
      const res = await fetch(`/api/educations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadEducations();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch {
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
              <h1 className="text-2xl font-bold">教育背景</h1>
              <p className="text-sm text-muted-foreground">拖拽调整顺序</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            添加教育经历
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {educations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>还没有教育经历，点击右上角按钮添加</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={educations.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {educations.map((education) => (
                  <SortableItem
                    key={education.id}
                    education={education}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEducation ? '编辑教育经历' : '添加教育经历'}</DialogTitle>
            <DialogDescription>填写您的教育经历信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school">学校</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="学校名称"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="degree">学位</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="如：学士、硕士"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field">专业</Label>
                <Input
                  id="field"
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  placeholder="专业名称"
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
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述您的学习经历和成就...&#10;支持换行，按Enter键换行"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">支持换行和空格</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_align">描述对齐方式</Label>
              <Select
                value={formData.description_align}
                onValueChange={(value) => setFormData({ ...formData, description_align: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择对齐方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">左对齐</SelectItem>
                  <SelectItem value="center">居中</SelectItem>
                  <SelectItem value="right">右对齐</SelectItem>
                  <SelectItem value="justify">两端对齐</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* 学术成绩信息 */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">学术成绩信息（选填）</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="awards">奖学金/荣誉</Label>
                  <Input
                    id="awards"
                    value={formData.awards}
                    onChange={(e) => setFormData({ ...formData, awards: e.target.value })}
                    placeholder="如：国家奖学金"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    value={formData.gpa}
                    onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                    placeholder="如：3.8/4.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ranking">专业排名</Label>
                  <Input
                    id="ranking"
                    value={formData.ranking}
                    onChange={(e) => setFormData({ ...formData, ranking: e.target.value })}
                    placeholder="如：前5%"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
