'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn,
  Image as ImageIcon,
  Video,
  Play,
  FileText,
  Layers,
} from 'lucide-react';

// 加载文件URL
async function loadFileUrl(key: string): Promise<string> {
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

interface WorkItem {
  id: number;
  type: string;
  title: string;
  file_key: string;
  url?: string;
  description?: string;
  order: number;
  category: string;
  cover_key?: string;
  cover_url?: string | null;
  summary?: string;
}

interface WorkCategory {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
}

// 统一的卡片组件
function WorkCard({ 
  item, 
  onClick,
}: { 
  item: WorkItem; 
  onClick: () => void;
}) {
  // 优先使用封面图
  const displayUrl = item.cover_url || item.url;
  
  const getTypeIcon = () => {
    if (item.type === 'image') return <ImageIcon className="h-6 w-6" />;
    if (item.type === 'video') return <Play className="h-6 w-6 ml-0.5" fill="currentColor" />;
    return <FileText className="h-6 w-6" />;
  };
  
  return (
    <div 
      className="relative group flex-shrink-0 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800"
      onClick={onClick}
    >
      {/* 封面图区域 */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {displayUrl ? (
          <img 
            src={displayUrl} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex flex-col items-center justify-center">
            {getTypeIcon()}
          </div>
        )}
        
        {/* 类型标签 */}
        <div className="absolute top-3 left-3">
          <span className={`
            px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm
            ${item.type === 'image' ? 'bg-green-500/80 text-white' : ''}
            ${item.type === 'video' ? 'bg-purple-500/80 text-white' : ''}
            ${item.type === 'pdf' || item.type === 'ppt' ? 'bg-orange-500/80 text-white' : ''}
          `}>
            {item.type === 'image' ? '图片' : item.type === 'video' ? '视频' : '文档'}
          </span>
        </div>
        
        {/* 悬停遮罩 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div className="bg-white/90 dark:bg-slate-800/90 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            {item.type === 'video' ? (
              <Play className="h-6 w-6 text-slate-800 ml-0.5" fill="currentColor" />
            ) : (
              <ZoomIn className="h-6 w-6 text-slate-800" />
            )}
          </div>
        </div>
      </div>
      
      {/* 信息区域 */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate mb-1">{item.title}</h3>
        {item.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
        )}
      </div>
    </div>
  );
}

export default function WorksPage() {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const categoriesLoadedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载分类
  const loadCategories = useCallback(async () => {
    if (categoriesLoadedRef.current) return;
    categoriesLoadedRef.current = true;
    
    try {
      const res = await fetch('/api/work-categories');
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        const visibleCats = data.data.filter((c: WorkCategory) => c.is_visible);
        setCategories(visibleCats);
        if (visibleCats.length > 0) {
          // 优先选中图片分类，如果没有图片则选第一个
          const imageCat = visibleCats.find((c: WorkCategory) => c.category_type === 'image');
          const defaultCat = imageCat || visibleCats[0];
          setActiveCategory(defaultCat.category_type);
        }
      }
    } catch (error) {
      console.error('加载分类失败:', error);
      categoriesLoadedRef.current = false;
    }
  }, []);

  // 加载作品
  const loadWorks = useCallback(async (category: string) => {
    if (!category) return;
    setIsLoading(true);
    setIsTransitioning(true);
    setCurrentIndex(0);
    setIsAutoPlaying(true);
    
    try {
      const res = await fetch(`/api/works-by-category/${category}`);
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        const worksWithUrls = await Promise.all(
          data.data.map(async (item: WorkItem) => {
            const mainUrl = await loadFileUrl(item.file_key);
            let coverUrl: string | null = null;
            if (item.cover_key) {
              coverUrl = await loadFileUrl(item.cover_key);
            }
            return {
              ...item,
              url: mainUrl,
              cover_url: coverUrl,
            };
          })
        );
        setWorks(worksWithUrls);
      } else {
        setWorks([]);
      }
    } catch (error) {
      console.error('加载作品失败:', error);
      setWorks([]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsTransitioning(false), 300);
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
    if (isAutoPlaying && works.length > 1 && !previewItem) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % works.length);
      }, 4000);
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, works.length, previewItem]);

  // 滚动到当前卡片
  useEffect(() => {
    if (scrollRef.current && works.length > 0) {
      const container = scrollRef.current;
      const cards = container.querySelectorAll('.work-card');
      const targetCard = cards[currentIndex] as HTMLElement;
      
      if (targetCard) {
        const containerWidth = container.offsetWidth;
        const cardLeft = targetCard.offsetLeft;
        const cardWidth = targetCard.offsetWidth;
        const scrollLeft = cardLeft - (containerWidth - cardWidth) / 2;
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex, works.length]);

  // 导航函数
  const goToNext = useCallback(() => {
    if (works.length > 0) {
      setCurrentIndex(prev => (prev + 1) % works.length);
    }
  }, [works.length]);

  const goToPrev = useCallback(() => {
    if (works.length > 0) {
      setCurrentIndex(prev => (prev - 1 + works.length) % works.length);
    }
  }, [works.length]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // 分类切换
  const handleCategoryChange = (category: string) => {
    if (category !== activeCategory && !isTransitioning) {
      setActiveCategory(category);
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
    const newIndex = direction === 'prev' 
      ? (previewIndex - 1 + works.length) % works.length
      : (previewIndex + 1) % works.length;
    setPreviewIndex(newIndex);
    setPreviewItem(works[newIndex]);
  };

  // 触摸滑动
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsAutoPlaying(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  const currentCategoryName = categories.find(c => c.category_type === activeCategory)?.display_name || '作品';

  // 加载状态
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 顶部标签导航 */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 py-4 overflow-x-auto">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.category_type;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.category_type)}
                  disabled={isTransitioning}
                  className={`
                    px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
                    }
                    ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {cat.display_name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 分类标题 */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            {activeCategory === 'image' && <ImageIcon className="h-6 w-6" />}
            {activeCategory === 'video' && <Video className="h-6 w-6" />}
            {(activeCategory === 'ppt' || activeCategory === 'pdf') && <FileText className="h-6 w-6" />}
            {activeCategory === 'image' && '图片作品'}
            {activeCategory === 'video' && '视频作品'}
            {activeCategory === 'ppt' && 'PPT / PDF 作品'}
            {!['image', 'video', 'ppt', 'pdf'].includes(activeCategory) && currentCategoryName}
          </h2>
        </div>

        {isLoading || isTransitioning ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Layers className="h-8 w-8" />
            </div>
            <p>暂无{currentCategoryName}作品</p>
          </div>
        ) : (
          <>
            {/* 卡片轮播区域 */}
            <div 
              className="relative mb-6"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => works.length > 1 && setIsAutoPlaying(true)}
            >
              {/* 左右导航按钮 */}
              {works.length > 1 && (
                <>
                  <button
                    onClick={goToPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110 z-10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110 z-10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              
              {/* 卡片容器 - 横向滚动 */}
              <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {works.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`
                      work-card flex-shrink-0 w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(33.333%-11px)]
                      snap-center transition-all duration-300
                      ${idx === currentIndex ? 'ring-2 ring-primary' : 'opacity-70'}
                    `}
                    onClick={() => handleOpenPreview(item, idx)}
                  >
                    <WorkCard item={item} onClick={() => handleOpenPreview(item, idx)} />
                  </div>
                ))}
              </div>

              {/* 指示器 */}
              {works.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {works.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToIndex(idx)}
                      className={`
                        w-2 h-2 rounded-full transition-all duration-300 
                        ${idx === currentIndex 
                          ? 'bg-primary w-6' 
                          : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                        }
                      `}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 作品信息 */}
            {works.length > 0 && works[currentIndex] && (
              <div className="text-center mb-4">
                <p className="text-lg font-medium">{works[currentIndex].title}</p>
                {works[currentIndex].summary && (
                  <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                    {works[currentIndex].summary}
                  </p>
                )}
                <p className="text-muted-foreground text-xs mt-2">
                  {currentIndex + 1} / {works.length}
                </p>
              </div>
            )}

            {/* 提示文字 */}
            <div className="text-center text-sm text-muted-foreground">
              <p>点击卡片查看详情 · 左右滑动切换</p>
            </div>
          </>
        )}
      </div>

      {/* 图片预览模态框 */}
      {previewItem && previewItem.type === 'image' && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={handleClosePreview}
        >
          <button
            onClick={handleClosePreview}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
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
          
          <div 
            className="w-full h-full flex items-center justify-center p-8 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewItem.url || previewItem.cover_url || ''}
              alt={previewItem.title}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: '90vh' }}
            />
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full flex items-center gap-4">
            <p className="text-white text-sm">{previewItem.title}</p>
            {previewItem.summary && (
              <p className="text-white/70 text-xs max-w-xs truncate">{previewItem.summary}</p>
            )}
            <p className="text-white/70 text-xs">{previewIndex + 1} / {works.length}</p>
          </div>
        </div>
      )}

      {/* PPT/PDF 预览模态框 */}
      {previewItem && (previewItem.type === 'pdf' || previewItem.type === 'ppt') && (
        <div 
          className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200"
          onClick={handleClosePreview}
        >
          <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
            <p className="text-white font-medium truncate px-4">{previewItem.title}</p>
            <div className="flex items-center gap-2">
              {previewItem.summary && (
                <span className="text-white/70 text-sm max-w-xs truncate hidden sm:inline">
                  {previewItem.summary}
                </span>
              )}
              <span className="text-white/70 text-sm">{previewIndex + 1} / {works.length}</span>
              <button
                onClick={handleClosePreview}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* 预览内容 - 竖向滚动 */}
          <div 
            className="flex-1 flex items-start justify-center bg-neutral-900 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.url ? (
              <iframe
                src={`${previewItem.url}#toolbar=0&navpanes=0&scrollbar=1&view=FitV`}
                className="w-full h-full"
                style={{ minHeight: '90vh' }}
                title={previewItem.title}
              />
            ) : (
              <div className="text-white/50 flex items-center justify-center h-full">加载中...</div>
            )}
          </div>
          
          {/* 底部导航 */}
          {works.length > 1 && (
            <div className="flex items-center justify-center gap-4 p-4 bg-black/80">
              <button
                onClick={(e) => { e.stopPropagation(); handlePreviewNav('prev'); }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handlePreviewNav('next'); }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 视频预览模态框 */}
      {previewItem && previewItem.type === 'video' && (
        <div 
          className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200"
          onClick={handleClosePreview}
        >
          <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
            <div className="flex-1 min-w-0 px-4">
              <p className="text-white font-medium truncate">{previewItem.title}</p>
              {previewItem.summary && (
                <p className="text-white/70 text-sm truncate mt-1">{previewItem.summary}</p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
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
          
          {/* 底部导航 */}
          {works.length > 1 && (
            <div className="flex items-center justify-center gap-4 p-4 bg-black/80">
              <button
                onClick={(e) => { e.stopPropagation(); handlePreviewNav('prev'); }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handlePreviewNav('next'); }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
