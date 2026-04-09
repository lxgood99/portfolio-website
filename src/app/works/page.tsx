'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Play, 
  Image as ImageIcon, 
  FileText, 
  Video,
  ZoomIn
} from 'lucide-react';

interface WorkCategory {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
}

interface WorkItem {
  id: number;
  type: string;
  title: string;
  file_key: string;
  url?: string;
  description?: string;
  order: number;
  category: string;
}

// 加载文件URL
async function loadFileUrl(key: string): Promise<string> {
  if (!key) return '';
  try {
    const res = await fetch('/api/file-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    const data = res.ok ? await res.json() : null;
    return data?.success ? data.data.url : '';
  } catch {
    return '';
  }
}

// 图片卡片组件
function ImageCard({ item, onClick, isActive }: { item: WorkItem; onClick: () => void; isActive?: boolean }) {
  return (
    <div 
      className="relative group flex-shrink-0 w-full h-full rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
      onClick={onClick}
    >
      {item.url ? (
        <img 
          src={item.url} 
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      {/* 悬停遮罩 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
        <div className="bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ZoomIn className="h-5 w-5" />
        </div>
      </div>
      {/* 标题 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white text-sm font-medium truncate">{item.title}</p>
      </div>
    </div>
  );
}

// 视频卡片组件
function VideoCard({ item, onClick }: { item: WorkItem; onClick: () => void }) {
  return (
    <div 
      className="relative group flex-shrink-0 w-full h-full rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
      onClick={onClick}
    >
      {item.url ? (
        <img 
          src={item.url} 
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
          <Video className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      {/* 播放按钮遮罩 */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Play className="h-6 w-6 text-slate-800 ml-1" fill="currentColor" />
        </div>
      </div>
      {/* 标题 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white text-sm font-medium truncate">{item.title}</p>
      </div>
    </div>
  );
}

// PPT卡片组件
function PPTCard({ item, onClick }: { item: WorkItem; onClick: () => void }) {
  return (
    <div 
      className="relative group flex-shrink-0 w-full h-full rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
      onClick={onClick}
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
          <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        <p className="text-sm font-medium text-center line-clamp-2">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-1">点击预览</p>
      </div>
      {/* 悬停效果 */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-200 dark:group-hover:border-orange-800 rounded-xl transition-all duration-300" />
    </div>
  );
}

export default function WorksPage() {
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 预览状态
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  
  // 轮播状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 加载分类
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/work-categories');
      const data = res.ok ? await res.json() : null;
      if (data?.success && data.data.length > 0) {
        setCategories(data.data);
        if (!activeCategory) {
          setActiveCategory(data.data[0].category_type);
        }
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  }, [activeCategory]);

  // 加载作品
  const loadWorks = useCallback(async (category: string) => {
    if (!category) return;
    setIsLoading(true);
    setCurrentIndex(0);
    setIsTransitioning(true);
    
    try {
      const res = await fetch(`/api/works-by-category/${category}`);
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        const worksWithUrls = await Promise.all(
          data.data.map(async (item: WorkItem) => ({
            ...item,
            url: await loadFileUrl(item.file_key),
          }))
        );
        setWorks(worksWithUrls);
        setCurrentIndex(0);
      } else {
        setWorks([]);
      }
    } catch (error) {
      console.error('加载作品失败:', error);
      setWorks([]);
    } finally {
      setIsLoading(false);
      setIsTransitioning(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (activeCategory) {
      loadWorks(activeCategory);
    }
  }, [activeCategory, loadWorks]);

  // 自动轮播
  useEffect(() => {
    if (isAutoPlaying && works.length > 1) {
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, 4000);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, works.length]);

  // 切换到下一个
  const goToNext = useCallback(() => {
    if (works.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % works.length);
  }, [works.length]);

  // 切换到上一个
  const goToPrev = useCallback(() => {
    if (works.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + works.length) % works.length);
  }, [works.length]);

  // 跳转到指定索引
  const goToIndex = useCallback((index: number) => {
    if (index < 0 || index >= works.length) return;
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  }, [works.length]);

  // 分类切换
  const handleCategoryChange = (category: string) => {
    if (category !== activeCategory && !isTransitioning) {
      setIsAutoPlaying(true);
      loadWorks(category);
    }
  };

  // 打开预览
  const handleOpenPreview = (item: WorkItem, index: number) => {
    setPreviewItem(item);
    setPreviewIndex(index);
    setIsAutoPlaying(false);
  };

  // 关闭预览
  const handleClosePreview = () => {
    setPreviewItem(null);
    setIsAutoPlaying(true);
  };

  // 预览导航
  const handlePreviewNav = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setPreviewIndex((prev) => (prev - 1 + works.length) % works.length);
      setPreviewItem(works[(previewIndex - 1 + works.length) % works.length]);
    } else {
      setPreviewIndex((prev) => (prev + 1) % works.length);
      setPreviewItem(works[(previewIndex + 1) % works.length]);
    }
  };

  // 触摸滑动开始
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsAutoPlaying(false);
  };

  // 触摸滑动结束
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    
    // 滑动超过50px认为是有效滑动
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  // 渲染当前卡片
  const renderCurrentCard = () => {
    if (works.length === 0) return null;
    const item = works[currentIndex];
    
    if (activeCategory === 'image') {
      return <ImageCard item={item} onClick={() => handleOpenPreview(item, currentIndex)} />;
    } else if (activeCategory === 'video') {
      return <VideoCard item={item} onClick={() => handleOpenPreview(item, currentIndex)} />;
    } else {
      return <PPTCard item={item} onClick={() => handleOpenPreview(item, currentIndex)} />;
    }
  };

  const currentCategoryName = categories.find(c => c.category_type === activeCategory)?.display_name || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 顶部标签导航 */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 py-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.category_type)}
                disabled={isTransitioning}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform ${
                  activeCategory === cat.category_type
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 disabled:opacity-50'
                }`}
              >
                {cat.display_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 分类标题 */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">{currentCategoryName}</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileText className="h-8 w-8" />
            </div>
            <p>暂无{currentCategoryName}作品</p>
          </div>
        ) : (
          <>
            {/* 卡片轮播区域 */}
            <div 
              ref={containerRef}
              className="relative mb-8"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => works.length > 1 && setIsAutoPlaying(true)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* 卡片容器 - 响应式尺寸 */}
              <div className="relative mx-auto" style={{ maxWidth: '400px' }}>
                <div className="aspect-[4/3]">
                  {renderCurrentCard()}
                </div>
              </div>

              {/* 左右导航按钮 */}
              {works.length > 1 && (
                <>
                  <button
                    onClick={goToPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110 z-10"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110 z-10"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* 指示器 */}
            {works.length > 1 && (
              <div className="flex justify-center gap-2 mb-8">
                {works.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex 
                        ? 'bg-primary w-6' 
                        : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* 作品信息 */}
            {works.length > 0 && (
              <div className="text-center mb-4">
                <p className="text-muted-foreground text-sm">
                  {currentIndex + 1} / {works.length}
                </p>
              </div>
            )}

            {/* 提示文字 */}
            <div className="text-center text-sm text-muted-foreground">
              <p>左右滑动或点击按钮切换</p>
            </div>
          </>
        )}
      </div>

      {/* 图片预览模态框 */}
      {previewItem && activeCategory === 'image' && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={handleClosePreview}
        >
          <button
            onClick={handleClosePreview}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          {/* 左右导航 */}
          {works.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePreviewNav('prev'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              >
                <ChevronLeft className="h-7 w-7 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handlePreviewNav('next'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              >
                <ChevronRight className="h-7 w-7 text-white" />
              </button>
            </>
          )}
          
          {/* 图片 - 支持缩放 */}
          <div 
            className="w-full h-full flex items-center justify-center p-8 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewItem.url}
              alt={previewItem.title}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: '90vh' }}
            />
          </div>
          
          {/* 底部标题和计数器 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full flex items-center gap-4">
            <p className="text-white text-sm">{previewItem.title}</p>
            <p className="text-white/70 text-xs">{previewIndex + 1} / {works.length}</p>
          </div>
        </div>
      )}

      {/* PPT/PDF 预览模态框 */}
      {previewItem && activeCategory === 'ppt' && (
        <div 
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={handleClosePreview}
        >
          <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
            <p className="text-white font-medium truncate px-4">{previewItem.title}</p>
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">{previewIndex + 1} / {works.length}</span>
              <button
                onClick={handleClosePreview}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* 预览内容 */}
          <div 
            className="flex-1 flex items-center justify-center bg-neutral-900 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.url ? (
              <iframe
                src={`${previewItem.url}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full"
                style={{ minHeight: '90vh' }}
                title={previewItem.title}
              />
            ) : (
              <div className="text-white/50">加载中...</div>
            )}
          </div>
        </div>
      )}

      {/* 视频预览模态框 */}
      {previewItem && activeCategory === 'video' && (
        <div 
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={handleClosePreview}
        >
          <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
            <p className="text-white font-medium truncate px-4">{previewItem.title}</p>
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">{previewIndex + 1} / {works.length}</span>
              <button
                onClick={handleClosePreview}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          <div 
            className="flex-1 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.url ? (
              <video
                src={previewItem.url}
                controls
                autoPlay
                className="max-w-full max-h-full"
              />
            ) : (
              <div className="text-white/50">加载中...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
