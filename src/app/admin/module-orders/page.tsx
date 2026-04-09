'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
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

interface ModuleOrder {
  id: number;
  module_name: string;
  order: number;
  is_visible: boolean;
}

const MODULE_LABELS: Record<string, string> = {
  self_introduction: '自我评价',
  work_experiences: '工作经历',
  educations: '教育背景',
  skills: '技能特长',
  works: '作品集',
};

function SortableItem({ 
  item, 
  onToggleVisibility 
}: { 
  item: ModuleOrder; 
  onToggleVisibility: (id: number, isVisible: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border shadow-sm"
    >
      <button 
        {...attributes} 
        {...listeners} 
        className="cursor-grab hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <h3 className="font-semibold">{MODULE_LABELS[item.module_name] || item.module_name}</h3>
        <p className="text-sm text-muted-foreground">排序：{item.order + 1}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {item.is_visible ? '显示' : '隐藏'}
        </span>
        <Switch
          checked={item.is_visible}
          onCheckedChange={(checked) => onToggleVisibility(item.id, checked)}
        />
      </div>
    </div>
  );
}

export default function ModuleOrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [modules, setModules] = useState<ModuleOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadModules();
    }
  }, [isAuthenticated]);

  const loadModules = async () => {
    try {
      const res = await fetch('/api/module-orders');
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        setModules(data.data);
      }
    } catch (error) {
      console.error('加载模块排序失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);
      const newModules = arrayMove(modules, oldIndex, newIndex).map((m, i) => ({
        ...m,
        order: i,
      }));
      setModules(newModules);

      // 保存排序
      const items = newModules.map((m) => ({
        id: m.id,
        order: m.order,
        is_visible: m.is_visible,
      }));

      try {
        await fetch('/api/module-orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      } catch (error) {
        console.error('保存排序失败:', error);
      }
    }
  };

  const handleToggleVisibility = async (id: number, isVisible: boolean) => {
    const newModules = modules.map((m) =>
      m.id === id ? { ...m, is_visible: isVisible } : m
    );
    setModules(newModules);

    const items = newModules.map((m) => ({
      id: m.id,
      order: m.order,
      is_visible: m.is_visible,
    }));

    try {
      await fetch('/api/module-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
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
            <h1 className="text-2xl font-bold">模块排序</h1>
            <p className="text-sm text-muted-foreground">拖拽调整模块显示顺序</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>模块排序设置</CardTitle>
            <CardDescription>
              拖拽调整模块顺序，控制模块是否在前端显示
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={modules.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {modules.map((module) => (
                    <SortableItem
                      key={module.id}
                      item={module}
                      onToggleVisibility={handleToggleVisibility}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
