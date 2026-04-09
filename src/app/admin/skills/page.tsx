'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, GripVertical, Edit2, Trash2, FolderPlus, Folder, Eye, EyeOff } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Skill {
  id: number;
  name: string;
  level: number;
  category: string | null;
  description: string | null;
  order: number;
}

interface SkillCategory {
  id: number;
  name: string;
  order: number;
  is_visible: boolean;
}

interface SortableItemProps {
  skill: Skill;
  onEdit: (skill: Skill) => void;
  onDelete: (id: number) => void;
}

function SortableItem({ skill, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border shadow-sm">
      <button {...attributes} {...listeners} className="cursor-grab hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold">{skill.name}</h3>
            {skill.category && (
              <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                {skill.category}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(skill)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(skill.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={skill.level} className="flex-1" />
          <span className="text-sm text-muted-foreground w-12">{skill.level}%</span>
        </div>
      </div>
    </div>
  );
}

interface SortableCategoryProps {
  category: SkillCategory;
  skillCount: number;
  onEdit: (category: SkillCategory) => void;
  onDelete: (id: number) => void;
  onToggleVisibility: (id: number, is_visible: boolean) => void;
}

function SortableCategory({ category, skillCount, onEdit, onDelete, onToggleVisibility }: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `category-${category.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border shadow-sm">
      <button {...attributes} {...listeners} className="cursor-grab hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <Folder className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{category.name}</h3>
            <p className="text-xs text-muted-foreground">{skillCount} 个技能</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {category.is_visible ? (
                <Eye className="h-4 w-4 text-green-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                checked={category.is_visible}
                onCheckedChange={(checked) => onToggleVisibility(category.id, checked)}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 80,
    category: '__none__',
    description: '',
  });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [activeTab, setActiveTab] = useState('skills');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 加载数据
  const loadSkills = async () => {
    try {
      const res = await fetch('/api/skills');
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        setSkills(data.data);
      }
    } catch (error) {
      console.error('加载技能失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/skill-categories');
      const data = res.ok ? await res.json() : null;
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadSkills(), loadCategories()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // 技能拖拽排序
  const handleSkillDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = skills.findIndex((s) => s.id === active.id);
      const newIndex = skills.findIndex((s) => s.id === over.id);
      const newSkills = arrayMove(skills, oldIndex, newIndex);
      setSkills(newSkills);

      const items = newSkills.map((skill, index) => ({
        id: skill.id,
        order: index,
      }));

      try {
        await fetch('/api/skills', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      } catch (error) {
        console.error('保存排序失败:', error);
      }
    }
  };

  // 分类拖拽排序
  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = String(active.id).replace('category-', '');
      const overId = String(over.id).replace('category-', '');
      
      const oldIndex = categories.findIndex((c) => c.id === parseInt(activeId));
      const newIndex = categories.findIndex((c) => c.id === parseInt(overId));
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      const items = newCategories.map((category, index) => ({
        id: category.id,
        order: index,
        is_visible: category.is_visible,
      }));

      try {
        await fetch('/api/skill-categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      } catch (error) {
        console.error('保存排序失败:', error);
      }
    }
  };

  // 技能操作
  const handleOpenSkillDialog = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({
        name: skill.name ?? '',
        level: skill.level ?? 80,
        category: skill.category ?? '__none__',
        description: skill.description ?? '',
      });
    } else {
      setEditingSkill(null);
      setFormData({
        name: '',
        level: 80,
        category: '__none__',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSaveSkill = async () => {
    const url = editingSkill ? `/api/skills/${editingSkill.id}` : '/api/skills';
    const method = editingSkill ? 'PUT' : 'POST';

    const body = {
      ...formData,
      category: formData.category === '__none__' ? null : formData.category,
      description: formData.description || null,
      order: editingSkill ? editingSkill.order : skills.length,
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
        loadSkills();
      } else {
        alert('保存失败：' + data.error);
      }
    } catch {
      alert('保存失败，请重试');
    }
  };

  const handleDeleteSkill = async (id: number) => {
    if (!confirm('确定要删除这个技能吗？')) return;

    try {
      const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadSkills();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch {
      alert('删除失败，请重试');
    }
  };

  // 分类操作
  const handleOpenCategoryDialog = (category?: SkillCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '' });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (editingCategory) {
      // 更新分类名称
      const oldName = editingCategory.name;
      const newName = categoryForm.name;
      
      try {
        // 更新分类名称
        const res = await fetch(`/api/skill-categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        });
        const data = await res.json();
        
        if (data.success) {
          // 更新该分类下所有技能的category字段
          const skillsToUpdate = skills.filter(s => s.category === oldName);
          for (const skill of skillsToUpdate) {
            await fetch(`/api/skills/${skill.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...skill, category: newName }),
            });
          }
          
          setCategoryDialogOpen(false);
          loadData();
        } else {
          alert('保存失败：' + data.error);
        }
      } catch {
        alert('保存失败，请重试');
      }
    } else {
      // 创建新分类
      try {
        const res = await fetch('/api/skill-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryForm),
        });
        const data = await res.json();
        if (data.success) {
          setCategoryDialogOpen(false);
          loadCategories();
        } else {
          alert('保存失败：' + data.error);
        }
      } catch {
        alert('保存失败，请重试');
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const category = categories.find(c => c.id === id);
    const skillCount = skills.filter(s => s.category === category?.name).length;
    
    if (skillCount > 0) {
      if (!confirm(`该分类下有 ${skillCount} 个技能，删除后这些技能将变为未分类。确定要删除吗？`)) return;
    } else {
      if (!confirm('确定要删除这个分类吗？')) return;
    }

    try {
      const res = await fetch(`/api/skill-categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch {
      alert('删除失败，请重试');
    }
  };

  const handleToggleCategoryVisibility = async (id: number, is_visible: boolean) => {
    try {
      const category = categories.find(c => c.id === id);
      if (!category) return;

      const res = await fetch('/api/skill-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id, order: category.order, is_visible }],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(categories.map(c => c.id === id ? { ...c, is_visible } : c));
      }
    } catch (error) {
      console.error('更新可见性失败:', error);
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

  // 按分类分组技能
  const groupedSkills: { [key: string]: Skill[] } = {};
  skills.forEach(skill => {
    const cat = skill.category || '未分类';
    if (!groupedSkills[cat]) {
      groupedSkills[cat] = [];
    }
    groupedSkills[cat].push(skill);
  });

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
              <h1 className="text-2xl font-bold">技能特长</h1>
              <p className="text-sm text-muted-foreground">拖拽调整顺序</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="skills">技能管理</TabsTrigger>
            <TabsTrigger value="categories">分类管理</TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">技能列表</h2>
              <Button onClick={() => handleOpenSkillDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                添加技能
              </Button>
            </div>

            {Object.keys(groupedSkills).length > 0 ? (
              Object.entries(groupedSkills).map(([categoryName, categorySkills]) => (
                <Card key={categoryName}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      {categoryName}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({categorySkills.length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleSkillDragEnd}
                    >
                      <SortableContext
                        items={categorySkills.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {categorySkills.map((skill) => (
                            <SortableItem
                              key={skill.id}
                              skill={skill}
                              onEdit={handleOpenSkillDialog}
                              onDelete={handleDeleteSkill}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>还没有技能，点击右上角按钮添加</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">分类列表</h2>
              <Button onClick={() => handleOpenCategoryDialog()}>
                <FolderPlus className="h-4 w-4 mr-2" />
                添加分类
              </Button>
            </div>

            {categories.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => `category-${c.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <SortableCategory
                        key={category.id}
                        category={category}
                        skillCount={skills.filter(s => s.category === category.name).length}
                        onEdit={handleOpenCategoryDialog}
                        onDelete={handleDeleteCategory}
                        onToggleVisibility={handleToggleCategoryVisibility}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>还没有分类，点击右上角按钮添加</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* 技能编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSkill ? '编辑技能' : '添加技能'}</DialogTitle>
            <DialogDescription>填写技能信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">技能名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：React、TypeScript"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">熟练度 ({formData.level}%)</Label>
              <Input
                id="level"
                type="range"
                min="0"
                max="100"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">补充说明（可选）</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="如：熟练使用Excel函数/数据透视表"
              />
              <p className="text-xs text-muted-foreground">填写后将显示在进度条下方</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSaveSkill}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 分类编辑对话框 */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '添加分类'}</DialogTitle>
            <DialogDescription>输入分类名称</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">分类名称</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ name: e.target.value })}
                placeholder="如：前端、后端、设计"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>取消</Button>
              <Button onClick={handleSaveCategory}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
