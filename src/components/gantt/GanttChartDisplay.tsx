'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TimelineItem } from '@/app/api/timeline-items/route';

interface GanttChartDisplayProps {
  items: TimelineItem[];
}

// 定义时间范围：2025年6月 - 2026年4月
const START_YEAR = 2025;
const START_MONTH = 6;
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
    // 每年第一个月或起始月显示年份
    if (month === 1 || i === 0) {
      labels.push(`${year}.${String(month).padStart(2, '0')}`);
    } else {
      labels.push(String(month).padStart(2, '0'));
    }
  }
  
  return labels;
};

export function GanttChartDisplay({ items }: GanttChartDisplayProps) {
  const totalMonths = getTotalMonths();
  const monthLabels = generateMonthLabels();

  // 计算位置百分比
  const calculatePosition = (year: number, month: number): number => {
    const index = yearMonthToIndex(year, month);
    return (index / totalMonths) * 100;
  };

  // 计算宽度百分比
  const calculateWidth = (
    startYear: number, 
    startMonth: number, 
    endYear: number, 
    endMonth: number
  ): number => {
    const startIndex = yearMonthToIndex(startYear, startMonth);
    const endIndex = yearMonthToIndex(endYear, endMonth);
    return ((endIndex - startIndex + 1) / totalMonths) * 100;
  };

  // 滚动容器引用
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // 左右滚动函数
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // 渲染任务条（只包含时间条部分）
  const renderTaskBar = (item: TimelineItem) => {
    // 计算断点段落
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
      const left = calculatePosition(item.start_year, item.start_month);
      const width = calculateWidth(item.start_year, item.start_month, item.end_year, item.end_month);
      segments.push({ start: left, width });
    }

    return (
      <div key={item.id} className="relative h-8 sm:h-9 mb-3 sm:mb-4">
        {/* 任务条区域 - 与时间轴对齐 */}
        <div className="absolute left-0 right-0 h-full">
          {segments.map((segment, idx) => (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 h-5 sm:h-6 rounded transition-all duration-200"
              style={{
                left: `${segment.start}%`,
                width: `${segment.width}%`,
                backgroundColor: item.color,
                minWidth: '2px',
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 甘特图主体 - 左侧固定 + 右侧滚动 */}
      <div className="flex w-full overflow-hidden rounded-lg border dark:border-slate-700">
        {/* 左侧固定列 - 任务名称 */}
        <div className="shrink-0 w-36 sm:w-44 bg-slate-50 dark:bg-slate-800/50 border-r dark:border-slate-700 z-10">
          {/* 表头占位 */}
          <div className="h-7 sm:h-8 border-b dark:border-slate-700" />
          {/* 任务名称列表 */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="h-8 sm:h-9 flex items-center px-2 sm:px-3 text-xs sm:text-sm font-medium text-foreground"
              >
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧可滚动区域 */}
        <div className="flex-1 overflow-x-auto min-w-0" ref={scrollContainerRef}>
          <div className="min-w-[550px] sm:min-w-[700px]">
            {/* 横轴时间刻度 */}
            <div className="relative h-7 sm:h-8 mb-3 sm:mb-4 bg-slate-50/50 dark:bg-slate-800/30 border-b dark:border-slate-700">
              <div className="absolute inset-0 flex">
                {monthLabels.map((label, index) => (
                  <div
                    key={index}
                    className="flex-1 border-l border-slate-200/50 dark:border-slate-600/30 relative"
                  >
                    <span className="absolute left-0.5 sm:left-1 top-0 text-[9px] sm:text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 任务条列表 */}
            <div className="px-2">
              {items.map((item) => renderTaskBar(item))}
            </div>
          </div>
        </div>
      </div>

      {/* 滚动箭头按钮 */}
      <div className="flex md:hidden justify-between mt-2 px-2">
        <button 
          onClick={scrollLeft}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
        <button 
          onClick={scrollRight}
          className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* 可左右滑动提示 */}
      <div className="mt-2 text-center text-xs sm:text-sm text-muted-foreground/60 flex items-center justify-center gap-2">
        <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>可左右滑动查看</span>
        <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
    </div>
  );
}
