'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { TimelineItem } from '@/app/api/timeline-items/route';

interface GanttChartProps {
  items: TimelineItem[];
  onUpdate?: (item: TimelineItem) => Promise<void>;
  isEditing?: boolean;
}

// 定义时间范围：2025年4月 - 2026年4月
const START_YEAR = 2025;
const START_MONTH = 4;
const END_YEAR = 2026;
const END_MONTH = 4;

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
  const totalMonthsFromStart = index;
  const year = START_YEAR + Math.floor((START_MONTH - 1 + totalMonthsFromStart) / 12);
  const month = ((START_MONTH - 1 + totalMonthsFromStart) % 12) + 1;
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

export default function GanttChart({ items, onUpdate, isEditing = false }: GanttChartProps) {
  const [localItems, setLocalItems] = useState<TimelineItem[]>(items);
  const [dragState, setDragState] = useState<{
    itemId: number;
    type: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    originalItem: TimelineItem;
  } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const totalMonths = getTotalMonths();
  const monthLabels = generateMonthLabels();

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

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

  // 处理拖拽开始
  const handleDragStart = useCallback(
    (
      e: React.MouseEvent,
      itemId: number,
      type: 'move' | 'resize-left' | 'resize-right'
    ) => {
      if (!isEditing) return;
      e.preventDefault();
      
      const item = localItems.find((i) => i.id === itemId);
      if (!item) return;

      setDragState({
        itemId,
        type,
        startX: e.clientX,
        originalItem: { ...item },
      });
    },
    [isEditing, localItems]
  );

  // 处理拖拽移动
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const deltaX = e.clientX - dragState.startX;
      const deltaPercent = (deltaX / containerRect.width) * 100;
      const deltaMonths = Math.round((deltaPercent / 100) * totalMonths);

      const item = localItems.find((i) => i.id === dragState.itemId);
      if (!item) return;

      let updatedItem = { ...item };

      if (dragState.type === 'move') {
        // 移动整个任务条
        const originalDuration =
          yearMonthToIndex(dragState.originalItem.end_year, dragState.originalItem.end_month) -
          yearMonthToIndex(dragState.originalItem.start_year, dragState.originalItem.start_month);

        let newStartIndex = yearMonthToIndex(
          dragState.originalItem.start_year,
          dragState.originalItem.start_month
        ) + deltaMonths;
        
        // 边界检查
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
        // 调整左边界
        const currentEndIndex = yearMonthToIndex(
          dragState.originalItem.end_year,
          dragState.originalItem.end_month
        );
        let newStartIndex = yearMonthToIndex(
          dragState.originalItem.start_year,
          dragState.originalItem.start_month
        ) + deltaMonths;
        
        // 边界检查
        newStartIndex = Math.max(0, Math.min(currentEndIndex, newStartIndex));
        
        const newStart = indexToYearMonth(newStartIndex);

        updatedItem = {
          ...item,
          start_year: newStart.year,
          start_month: newStart.month,
        };
      } else if (dragState.type === 'resize-right') {
        // 调整右边界
        const currentStartIndex = yearMonthToIndex(
          dragState.originalItem.start_year,
          dragState.originalItem.start_month
        );
        let newEndIndex = yearMonthToIndex(
          dragState.originalItem.end_year,
          dragState.originalItem.end_month
        ) + deltaMonths;
        
        // 边界检查
        newEndIndex = Math.max(currentStartIndex, Math.min(totalMonths - 1, newEndIndex));
        
        const newEnd = indexToYearMonth(newEndIndex);

        updatedItem = {
          ...item,
          end_year: newEnd.year,
          end_month: newEnd.month,
        };
      }

      setLocalItems(localItems.map((i) => (i.id === dragState.itemId ? updatedItem : i)));
    },
    [dragState, localItems, totalMonths]
  );

  // 处理拖拽结束
  const handleMouseUp = useCallback(async () => {
    if (!dragState || !onUpdate) {
      setDragState(null);
      return;
    }

    const item = localItems.find((i) => i.id === dragState.itemId);
    if (item) {
      await onUpdate(item);
    }

    setDragState(null);
  }, [dragState, localItems, onUpdate]);

  // 绑定全局鼠标事件
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

    // 计算断点
    const segments: { start: number; width: number }[] = [];

    if (item.breaks && item.breaks.length > 0) {
      // 按开始位置排序断点
      const sortedBreaks = [...item.breaks].sort((a, b) => {
        return yearMonthToIndex(a.startYear, a.startMonth) - yearMonthToIndex(b.startYear, b.startMonth);
      });

      let lastIndex = yearMonthToIndex(item.start_year, item.start_month);

      for (const breakItem of sortedBreaks) {
        const breakStartIndex = yearMonthToIndex(breakItem.startYear, breakItem.startMonth);
        const breakEndIndex = yearMonthToIndex(breakItem.endYear, breakItem.endMonth);

        // 添加断点前的段落
        if (breakStartIndex > lastIndex) {
          const segmentStart = (lastIndex / totalMonths) * 100;
          const segmentWidth = ((breakStartIndex - lastIndex) / totalMonths) * 100;
          segments.push({ start: segmentStart, width: segmentWidth });
        }

        lastIndex = breakEndIndex + 1;
      }

      // 添加最后一段
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
      <div key={item.id} className="relative h-10 mb-2 group">
        {/* 任务名称 */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 truncate text-sm font-medium pr-2">
          {item.name}
        </div>

        {/* 任务条区域 */}
        <div className="absolute left-24 right-0 h-full">
          {segments.map((segment, idx) => (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 h-7 rounded-md transition-all duration-150"
              style={{
                left: `${segment.start}%`,
                width: `${segment.width}%`,
                backgroundColor: item.color,
              }}
            >
              {/* 可编辑模式下显示拖拽手柄 */}
              {isEditing && idx === 0 && (
                <>
                  {/* 左拖拽手柄 */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-md hover:bg-black/20 flex items-center justify-center"
                    onMouseDown={(e) => handleDragStart(e, item.id, 'resize-left')}
                  >
                    <div className="w-0.5 h-4 bg-white/50 rounded" />
                  </div>
                  
                  {/* 移动手柄 */}
                  <div
                    className="absolute left-2 right-2 top-0 bottom-0 cursor-move flex items-center justify-center"
                    onMouseDown={(e) => handleDragStart(e, item.id, 'move')}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white/80 text-xs">
                      ⋮⋮
                    </div>
                  </div>
                  
                  {/* 右拖拽手柄 */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-md hover:bg-black/20 flex items-center justify-center"
                    onMouseDown={(e) => handleDragStart(e, item.id, 'resize-right')}
                  >
                    <div className="w-0.5 h-4 bg-white/50 rounded" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div ref={containerRef} className="min-w-[600px] md:min-w-[800px]">
        {/* 横轴时间刻度 */}
        <div className="relative h-8 mb-4 ml-24">
          <div className="absolute inset-0 flex">
            {monthLabels.map((label, index) => (
              <div
                key={index}
                className="flex-1 border-l border-slate-200 dark:border-slate-700 relative"
              >
                <span className="absolute left-1 top-1 text-xs text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 任务条列表 */}
        <div className="space-y-1">
          {localItems.map((item) => renderTaskBar(item))}
        </div>

        {/* 垂直参考线 */}
        <div className="absolute inset-0 pointer-events-none ml-24">
          {monthLabels.map((_, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800"
              style={{ left: `${(index / totalMonths) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* 时间范围提示 */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        {isEditing ? '💡 拖拽任务条可调整位置和时长' : ''}
      </div>
    </div>
  );
}
