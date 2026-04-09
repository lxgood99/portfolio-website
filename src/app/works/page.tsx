'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Play, 
  Pause, 
  Image as ImageIcon, 
  FileText, 
  Video,
  Maximize2
} from 'lucide-react';
import { PDFViewer } from '@/components/PDFViewer';

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
function ImageCard({ item, onClick }: { item: WorkItem; onClick: () => void }) {
  return (
    <div 
      className="relative group flex-shrink-0 w-72 h-48 md:w-80 md:h-52 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
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
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-full">
          <Maximize2 className="h-4 w-4" />
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
      className="relative group flex-shrink-0 w-72 h-48 md:w-80 md:h-52 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
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
      className="relative group flex-shrink-0 w-72 h-48 md:w-80 md:h-52 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
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
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 轮播状态
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

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
    try {
      const res = await fetch(`/api/works-by-category/${category}`);
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        // 加载所有文件的URL
        const worksWithUrls = await Promise.all(
          data.data.map(async (item: WorkItem) => ({
            ...item,
            url: await loadFileUrl(item.file_key),
          }))
        );
        setWorks(worksWithUrls);
        setCarouselIndex(0);
      }
    } catch (error) {
      console.error('加载作品失败:', error);
    } finally {
      setIsLoading(false);
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
        setCarouselIndex((prev) => (prev + 1) % works.length);
      }, 4000);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, works.length]);

  // 手动切换时暂停自动播放
  const handleManualNav = (direction: 'prev' | 'next') => {
    setIsAutoPlaying(false);
    if (direction === 'prev') {
      setCarouselIndex((prev) => (prev - 1 + works.length) % works.length);
    } else {
      setCarouselIndex((prev) => (prev + 1) % works.length);
    }
  };

  // 分类切换动画
  const handleCategoryChange = (category: string) => {
    if (category !== activeCategory) {
      setActiveCategory(category);
      setCarouselIndex(0);
      setIsAutoPlaying(true);
    }
  };

  // 打开预览
  const handleOpenPreview = (item: WorkItem) => {
    setPreviewItem(item);
    if (item.type === 'video') {
      setIsPlaying(true);
    }
  };

  // 关闭预览
  const handleClosePreview = () => {
    setPreviewItem(null);
    setIsPlaying(false);
  };

  const currentWorks = works.filter(w => w.type === (activeCategory === 'ppt' ? 'pdf' : activeCategory === 'image' ? 'image' : 'video'));
  const currentCategoryName = categories.find(c => c.category_type === activeCategory)?.display_name || '';

  // 渲染卡片
  const renderCard = (item: WorkItem) => {
    if (activeCategory === 'image') {
      return <ImageCard key={item.id} item={item} onClick={() => handleOpenPreview(item)} />;
    } else if (activeCategory === 'video') {
      return <VideoCard key={item.id} item={item} onClick={() => handleOpenPreview(item)} />;
    } else {
      return <PPTCard key={item.id} item={item} onClick={() => handleOpenPreview(item)} />;
    }
  };

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
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform ${
                  activeCategory === cat.category_type
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
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
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : currentWorks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <FileText className="h-8 w-8" />
            </div>
            <p>暂无{currentCategoryName}作品</p>
          </div>
        ) : (
          <>
            {/* 横向轮播区域 */}
            <div 
              ref={carouselRef}
              className="relative mb-8"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => works.length > 1 && setIsAutoPlaying(true)}
            >
              {/* 卡片容器 */}
              <div className="overflow-hidden">
                <div 
                  className="flex gap-4 transition-transform duration-500 ease-out"
                  style={{ 
                    transform: `translateX(-${carouselIndex * (288 + 16)}px)`,
                  }}
                >
                  {/* 左右各添加一个循环副本 */}
                  {[...currentWorks, ...currentWorks, ...currentWorks].map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="flex-shrink-0"
                      style={{ width: '288px' }}
                    >
                      {renderCard(item)}
                    </div>
                  ))}
                </div>
              </div>

              {/* 左右导航按钮 */}
              {currentWorks.length > 1 && (
                <>
                  <button
                    onClick={() => handleManualNav('prev')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200 opacity-0 hover:opacity-100 group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleManualNav('next')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200 opacity-0 hover:opacity-100 group-hover:opacity-100"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* 指示器 */}
            {currentWorks.length > 1 && (
              <div className="flex justify-center gap-2 mb-8">
                {currentWorks.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCarouselIndex(idx);
                      setIsAutoPlaying(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === carouselIndex 
                        ? 'bg-primary w-6' 
                        : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* 网格展示（备用展示方式） */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
              {currentWorks.map((item) => (
                <div key={item.id} className="aspect-[4/3]">
                  {renderCard(item)}
                </div>
              ))}
            </div>

            {/* 移动端左右滑动提示 */}
            <div className="md:hidden text-center text-sm text-muted-foreground mt-4">
              <p>左右滑动查看更多</p>
            </div>
          </>
        )}
      </div>

      {/* 图片预览模态框 */}
      {previewItem && activeCategory === 'image' && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={handleClosePreview}
        >
          <button
            onClick={handleClosePreview}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          
          {/* 左右导航 */}
          {currentWorks.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleManualNav('prev'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleManualNav('next'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}
          
          <img
            src={currentWorks[carouselIndex]?.url || previewItem.url}
            alt={previewItem.title}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* 底部标题 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full">
            <p className="text-white text-sm">{currentWorks[carouselIndex]?.title}</p>
          </div>
        </div>
      )}

      {/* PPT/PDF 预览模态框 */}
      {previewItem && (previewItem.type === 'pdf' || activeCategory === 'ppt') && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={handleClosePreview}
        >
          <div className="flex items-center justify-between p-4 bg-black/50">
            <p className="text-white font-medium truncate px-4">{previewItem.title}</p>
            <button
              onClick={handleClosePreview}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <div 
            className="flex-1 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.url && (
              <PDFViewer url={previewItem.url} />
            )}
          </div>
        </div>
      )}

      {/* 视频预览模态框 */}
      {previewItem && previewItem.type === 'video' && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={handleClosePreview}
        >
          <div className="flex items-center justify-between p-4 bg-black/50">
            <p className="text-white font-medium truncate px-4">{previewItem.title}</p>
            <button
              onClick={handleClosePreview}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <div 
            className="flex-1 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.url && (
              <video
                src={previewItem.url}
                controls
                autoPlay
                className="max-w-full max-h-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
