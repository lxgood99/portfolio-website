'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Save, X, Palette } from 'lucide-react';
import Link from 'next/link';
import type { TimelineItem, TimelineBreak } from '@/app/api/timeline-items/route';

// 定义时间范围：2025年4月 - 2026年4月
const START_YEAR = 2025;
const START_MONTH = 4;
const END_YEAR = 2026;
const END_MONTH = 4;

// 低饱和度颜色预设
const COLOR_PRESETS = [
  '#3b82f6', // 蓝色
  '#10b981', // 绿色
  '#8b5cf6', // 紫色
  '#f59e0b', // 橙色
  '#ef4444', // 红色
  '#06b6d4', // 青色
  '#ec4899', // 粉色
  '#6366f1', // 靛蓝
];

// 计算总月份数
const getTotalMonths = () => {
  return (END_YEAR - START_YEAR) * 12 + (END_MONTH - START_MONTH) + 1;
};

// 年月转换为索引（从0开始）
const yearMonthToIndex = (year: number, month: number): number => {
  return (year - START_YEAR) * 12 + (month - START_MONTH);
};

// 索引转换为年月
const indexToYearMonth = (index: number): { year: number; month: number } => {
  const year = START_YEAR + Math.floor((START_MONTH - 1 + index) / 12);
  const month = ((START_MONTH - 1 + index) % 12) + 1;
  return { year, month };
};

// 生成月份标签
const generateMonthLabels = (): string[] => {
  const labels: string[] = [];
  const totalMonths = getTotalMonths();
  
  for (let i = 0; i < totalMonths; i++) {
    const { year, month } = indexToYearMonth(i);
    if (month === 1 || i === 0) {
      labels.push(`${year}.${month}`);
    } else {
      labels.push(`${month}`);
    }
  }
  
  return labels;
};

export default function TimelineAdminPage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dragState, setDragState] = useState<{
    itemId: number;
    type: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    originalItem: TimelineItem;
  } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const totalMonths = getTotalMonths();
  const monthLabels = generateMonthLabels();

  // 加载数据
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadItems();
    }
  }, [authLoading, isAuthenticated]);

  const loadItems = async () => {
    try {
      const res = await fetch('/api/timeline-items');
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('加载时间线失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存项目
  const handleSave = async (item: Partial<TimelineItem>) => {
    try {
      if (item.id) {
        // 更新
        await fetch('/api/timeline-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      } else {
        // 创建
        await fetch('/api/timeline-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }
      await loadItems();
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 删除项目
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这个时间线项目吗？')) return;
    
    try {
      await fetch(`/api/timeline-items?id=${id}`, { method: 'DELETE' });
      await loadItems();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 计算位置百分比
  const calculatePosition = useCallback((year: number, month: number): number => {
    const index = yearMonthToIndex(year, month);
    return (index / totalMonths) * 100;
  }, [totalMonths]);

  // 计算宽度百分比
  const calculateWidth = useCallback(
    (startYear: number, startMonth: number, endYear: number, endMonth: number): number => {
      const startIndex = yearMonthToIndex(startYear, startMonth);
      const endIndex = yearMonthToIndex(endYear, endMonth);
      return ((endIndex - startIndex + 1) / totalMonths) * 100;
    },
    [totalMonths]
  );

  // 拖拽处理
  const handleDragStart = useCallback(
    (e: React.MouseEvent, itemId: number, type: 'move' | 'resize-left' | 'resize-right') => {
      e.preventDefault();
      
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      setDragState({
        itemId,
        type,
        startX: e.clientX,
        originalItem: { ...item },
      });
    },
    [items]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const deltaX = e.clientX - dragState.startX;
      const deltaPercent = (deltaX / containerRect.width) * 100;
      const deltaMonths = Math.round((deltaPercent / 100) * totalMonths);

      const item = items.find((i) => i.id === dragState.itemId);
      if (!item) return;

      let updatedItem = { ...item };

      if (dragState.type === 'move') {
        const originalDuration =
          yearMonthToIndex(dragState.originalItem.end_year, dragState.originalItem.end_month) -
          yearMonthToIndex(dragState.originalItem.start_year, dragState.originalItem.start_month);

        let newStartIndex = yearMonthToIndex(
          dragState.originalItem.start_year,
          dragState.originalItem.start_month
        ) + deltaMonths;
        
        newStartIndex = Math.max(0, Math.min(totalMonths - originalDuration - 1, newStartIndex));
        
        const newStart = indexToYearMonth(newStartIndex);
        const newEnd = indexToYearMonth(newStartIndex + originalDuration);

        updatedItem = {
          ...item,
          start_year: newStart.year,
          start_month: newStart.month,
          end_year: newEnd.year,
          end_month: newEnd.month,
        };
      } else if (dragState.type === 'resize-left') {
        const currentEndIndex = yearMonthToIndex(
          dragState.originalItem.end_year,
          dragState.originalItem.end_month
        );
        let newStartIndex = yearMonthToIndex(
          dragState.originalItem.start_year,
          dragState.originalItem.start_month
        ) + deltaMonths;
        
        newStartIndex = Math.max(0, Math.min(currentEndIndex, newStartIndex));
        const newStart = indexToYearMonth(newStartIndex);

        updatedItem = {
          ...item,
          start_year: newStart.year,
          start_month: newStart.month,
        };
      } else if (dragState.type === 'resize-right') {
        const currentStartIndex = yearMonthToIndex(
          dragState.originalItem.start_year,
          dragState.originalItem.start_month
        );
        let newEndIndex = yearMonthToIndex(
          dragState.originalItem.end_year,
          dragState.originalItem.end_month
        ) + deltaMonths;
        
        newEndIndex = Math.max(currentStartIndex, Math.min(totalMonths - 1, newEndIndex));
        const newEnd = indexToYearMonth(newEndIndex);

        updatedItem = {
          ...item,
          end_year: newEnd.year,
          end_month: newEnd.month,
        };
      }

      setItems(items.map((i) => (i.id === dragState.itemId ? updatedItem : i)));
    },
    [dragState, items, totalMonths]
  );

  const handleMouseUp = useCallback(async () => {
    if (!dragState) return;

    const item = items.find((i) => i.id === dragState.itemId);
    if (item) {
      try {
        await fetch('/api/timeline-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      } catch (error) {
        console.error('保存失败:', error);
      }
    }

    setDragState(null);
  }, [dragState, items]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // 渲染任务条
  const renderTaskBar = (item: TimelineItem) => {
    const left = calculatePosition(item.start_year, item.start_month);
    const width = calculateWidth(
      item.start_year,
      item.start_month,
      item.end_year,
      item.end_month
    );

    // 计算断点段落
    const segments: { start: number; width: number }[] = [];
    
    if (item.breaks && item.breaks.length > 0) {
      const sortedBreaks = [...item.breaks].sort((a, b) => {
        return yearMonthToIndex(a.startYear, a.startMonth) - yearMonthToIndex(b.startYear, b.startMonth);
      });

      let lastIndex = yearMonthToIndex(item.start_year, item.start_month);

      for (const breakItem of sortedBreaks) {
        const breakStartIndex = yearMonthToIndex(breakItem.startYear, breakItem.startMonth);
        const breakEndIndex = yearMonthToIndex(breakItem.endYear, breakItem.endMonth);

        if (breakStartIndex > lastIndex) {
          const segmentStart = (lastIndex / totalMonths) * 100;
          const segmentWidth = ((breakStartIndex - lastIndex) / totalMonths) * 100;
          segments.push({ start: segmentStart, width: segmentWidth });
        }

        lastIndex = breakEndIndex + 1;
      }

      const endIndex = yearMonthToIndex(item.end_year, item.end_month);
      if (lastIndex <= endIndex) {
        const segmentStart = (lastIndex / totalMonths) * 100;
        const segmentWidth = ((endIndex - lastIndex + 1) / totalMonths) * 100;
        segments.push({ start: segmentStart, width: segmentWidth });
      }
    } else {
      segments.push({ start: left, width });
    }

    return (
      <div key={item.id} className="relative h-12 mb-4 group">
        {/* 任务名称 + 操作按钮 */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-28 sm:w-32 flex items-center gap-1 pr-2">
          <span className="flex-1 truncate text-xs sm:text-sm font-medium">{item.name}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => { setEditingItem(item); setIsDialogOpen(true); }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <Palette className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 任务条区域 */}
        <div className="absolute left-28 sm:left-32 right-0 h-full">
          {segments.map((segment, idx) => (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 h-7 sm:h-8 rounded transition-all duration-150"
              style={{
                left: `${segment.start}%`,
                width: `${segment.width}%`,
                backgroundColor: item.color,
              }}
            >
              {idx === 0 && (
                <>
                  {/* 左拖拽手柄 */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize rounded-l-md hover:bg-black/20 flex items-center justify-center"
                    onMouseDown={(e) => handleDragStart(e, item.id, 'resize-left')}
                  >
                    <div className="w-0.5 h-5 bg-white/50 rounded" />
                  </div>
                  
                  {/* 移动手柄 */}
                  <div
                    className="absolute left-3 right-3 top-0 bottom-0 cursor-move"
                    onMouseDown={(e) => handleDragStart(e, item.id, 'move')}
                  />
                  
                  {/* 右拖拽手柄 */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize rounded-r-md hover:bg-black/20 flex items-center justify-center"
                    onMouseDown={(e) => handleDragStart(e, item.id, 'resize-right')}
                  >
                    <div className="w-0.5 h-5 bg-white/50 rounded" />
                  </div>
                  
                  {/* 时间标签 */}
                  <span className="absolute -bottom-4 left-0 right-0 text-[10px] text-muted-foreground text-center">
                    {item.start_year}.{item.start_month} - {item.end_year}.{item.end_month}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">成长规划管理</h1>
        </div>
        <Button onClick={() => { setEditingItem(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          添加任务
        </Button>
      </div>

      {/* 甘特图编辑器 */}
      <Card>
        <CardHeader>
          <CardTitle>时间轴编辑器</CardTitle>
          <p className="text-sm text-muted-foreground">
            拖拽任务条可调整位置和时长，悬停显示操作按钮
          </p>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="overflow-x-auto">
            <div className="min-w-[700px] sm:min-w-[800px]">
              {/* 横轴时间刻度 */}
              <div className="relative h-8 mb-4 ml-28 sm:ml-32">
                <div className="absolute inset-0 flex">
                  {monthLabels.map((label, index) => (
                    <div
                      key={index}
                      className="flex-1 border-l border-slate-200/60 dark:border-slate-600/40 relative"
                    >
                      <span className="absolute left-0.5 sm:left-1 top-0.5 text-[10px] sm:text-xs text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 任务条列表 */}
              <div className="space-y-1">
                {items.map((item) => renderTaskBar(item))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑任务' : '添加任务'}</DialogTitle>
            <DialogDescription>
              设置任务名称、时间范围和颜色
            </DialogDescription>
          </DialogHeader>
          
          <EditForm
            item={editingItem}
            onSave={handleSave}
            onCancel={() => { setIsDialogOpen(false); setEditingItem(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 编辑表单组件
function EditForm({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: TimelineItem | null;
  onSave: (data: Partial<TimelineItem>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [startYear, setStartYear] = useState(item?.start_year || 2025);
  const [startMonth, setStartMonth] = useState(item?.start_month || 4);
  const [endYear, setEndYear] = useState(item?.end_year || 2025);
  const [endMonth, setEndMonth] = useState(item?.end_month || 12);
  const [color, setColor] = useState(item?.color || '#3b82f6');
  const [breaks, setBreaks] = useState<TimelineBreak[]>(item?.breaks || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: item?.id,
      name,
      start_year: startYear,
      start_month: startMonth,
      end_year: endYear,
      end_month: endMonth,
      color,
      breaks,
    });
  };

  // 添加断点
  const addBreak = () => {
    setBreaks([
      ...breaks,
      { startYear: 2025, startMonth: 6, endYear: 2025, endMonth: 7 },
    ]);
  };

  // 删除断点
  const removeBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  // 更新断点
  const updateBreak = (index: number, field: keyof TimelineBreak, value: number) => {
    const newBreaks = [...breaks];
    newBreaks[index] = { ...newBreaks[index], [field]: value };
    setBreaks(newBreaks);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 任务名称 */}
      <div className="space-y-2">
        <Label>任务名称</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入任务名称"
          required
        />
      </div>

      {/* 开始时间 */}
      <div className="space-y-2">
        <Label>开始时间</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            min={2025}
            max={2026}
            className="w-24"
          />
          <span className="flex items-center">年</span>
          <Input
            type="number"
            value={startMonth}
            onChange={(e) => setStartMonth(Number(e.target.value))}
            min={1}
            max={12}
            className="w-20"
          />
          <span className="flex items-center">月</span>
        </div>
      </div>

      {/* 结束时间 */}
      <div className="space-y-2">
        <Label>结束时间</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(Number(e.target.value))}
            min={2025}
            max={2026}
            className="w-24"
          />
          <span className="flex items-center">年</span>
          <Input
            type="number"
            value={endMonth}
            onChange={(e) => setEndMonth(Number(e.target.value))}
            min={1}
            max={12}
            className="w-20"
          />
          <span className="flex items-center">月</span>
        </div>
      </div>

      {/* 颜色选择 */}
      <div className="space-y-2">
        <Label>颜色</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-md transition-transform ${
                color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* 断点设置 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>断点（非连续时间段）</Label>
          <Button type="button" variant="outline" size="sm" onClick={addBreak}>
            <Plus className="h-3 w-3 mr-1" />
            添加断点
          </Button>
        </div>
        {breaks.length > 0 && (
          <div className="space-y-2">
            {breaks.map((b, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <span className="text-xs text-muted-foreground">断点{index + 1}:</span>
                <Input
                  type="number"
                  value={b.startYear}
                  onChange={(e) => updateBreak(index, 'startYear', Number(e.target.value))}
                  className="w-16 h-7 text-xs"
                  min={2025}
                  max={2026}
                />
                <span className="text-xs">.</span>
                <Input
                  type="number"
                  value={b.startMonth}
                  onChange={(e) => updateBreak(index, 'startMonth', Number(e.target.value))}
                  className="w-14 h-7 text-xs"
                  min={1}
                  max={12}
                />
                <span className="text-xs">-</span>
                <Input
                  type="number"
                  value={b.endYear}
                  onChange={(e) => updateBreak(index, 'endYear', Number(e.target.value))}
                  className="w-16 h-7 text-xs"
                  min={2025}
                  max={2026}
                />
                <span className="text-xs">.</span>
                <Input
                  type="number"
                  value={b.endMonth}
                  onChange={(e) => updateBreak(index, 'endMonth', Number(e.target.value))}
                  className="w-14 h-7 text-xs"
                  min={1}
                  max={12}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeBreak(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          保存
        </Button>
      </DialogFooter>
    </form>
  );
}
