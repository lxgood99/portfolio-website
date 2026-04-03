'use client';

import type { TimelineItem } from '@/app/api/timeline-items/route';

interface GanttChartDisplayProps {
  items: TimelineItem[];
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
      <div key={item.id} className="relative h-8 sm:h-9 mb-3 sm:mb-4">
        {/* 任务名称 */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 sm:w-32 truncate text-xs sm:text-sm font-medium pr-2 text-foreground">
          {item.name}
        </div>

        {/* 任务条区域 */}
        <div className="absolute left-24 sm:left-32 right-0 h-full">
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
    <div className="w-full overflow-x-auto">
      <div className="min-w-[500px] sm:min-w-[650px]">
        {/* 横轴时间刻度 */}
        <div className="relative h-7 sm:h-8 mb-3 ml-24 sm:ml-32">
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
        <div className="space-y-2">
          {items.map((item) => renderTaskBar(item))}
        </div>
      </div>
    </div>
  );
}
