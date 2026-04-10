'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ZoomIn,
  Image as ImageIcon,
  Video,
  Play,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Layers,
} from 'lucide-react';

// Types
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
  displayUrl?: string;
}

interface WorkCategory {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
}

// 作品卡片
function WorkCard({ 
  item, 
  onClick 
}: { 
  item: WorkItem & { displayUrl?: string }; 
  onClick: () => void;
}) {
  return (
    <div 
      className="relative rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 group flex-shrink-0 w-[280px] snap-start"
      onClick={onClick}
    >
      {/* 封面图 */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {item.displayUrl ? (
          <img 
            src={item.displayUrl} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex flex-col items-center justify-center">
            {item.type === 'image' && <ImageIcon className="h-10 w-10 text-green-500" />}
            {item.type === 'video' && <Play className="h-10 w-10 text-purple-500" />}
            {(item.type === 'pdf' || item.type === 'ppt') && <FileText className="h-10 w-10 text-orange-500" />}
          </div>
        )}
        
        {/* 类型标签 */}
        <div className="absolute top-2 left-2">
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm
            ${item.type === 'image' ? 'bg-green-500/80 text-white' : ''}
            ${item.type === 'video' ? 'bg-purple-500/80 text-white' : ''}
            ${item.type === 'pdf' || item.type === 'ppt' ? 'bg-orange-500/80 text-white' : ''}
          `}>
            {item.type === 'image' ? '图片' : item.type === 'video' ? '视频' : '文档'}
          </span>
        </div>
        
        {/* 悬停效果 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <div className="bg-white/90 dark:bg-slate-800/90 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            {item.type === 'video' ? (
              <Play className="h-6 w-6 text-slate-800 ml-0.5" fill="currentColor" />
            ) : (
              <ZoomIn className="h-6 w-6 text-slate-800" />
            )}
          </div>
        </div>
      </div>
      
      {/* 信息 */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{item.title}</h3>
        {item.summary && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
        )}
      </div>
    </div>
  );
}

export default function WorksPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [works, setWorks] = useState<(WorkItem & { displayUrl?: string })[]>([]);
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化
  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const catRes = await fetch('/api/work-categories');
      const catData = await catRes.json();
      
      if (!catData.success || !catData.data) {
        setCategories([]);
        setWorks([]);
        return;
      }
      
      const visibleCats = catData.data.filter((c: WorkCategory) => c.is_visible);
      setCategories(visibleCats);
      
      // 默认选中第一个分类
      if (visibleCats.length > 0) {
        setActiveCategory(visibleCats[0].category_type);
        await loadWorks(visibleCats[0].category_type);
      } else {
        setActiveCategory('');
        setWorks([]);
      }
    } catch (err) {
      console.error('加载失败:', err);
      setCategories([]);
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted, loadData]);

  // 加载作品
  const loadWorks = async (category: string) => {
    setLoading(true);
    setCurrentSlide(0);
    
    try {
      const res = await fetch(`/api/works-by-category/${category}`);
      const data = await res.json();
      
      if (!data.success || !data.data) {
        setWorks([]);
        return;
      }
      
      const worksWithUrls = await Promise.all(
        data.data.map(async (item: WorkItem) => {
          try {
            let mainUrl = '';
            const urlRes = await fetch('/api/file-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: item.file_key }),
            });
            const urlData = await urlRes.json();
            if (urlData.success) {
              mainUrl = urlData.data.url;
            }
            
            let coverUrl: string | undefined;
            if (item.cover_key) {
              const coverRes = await fetch('/api/file-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: item.cover_key }),
              });
              const coverData = await coverRes.json();
              if (coverData.success) {
                coverUrl = coverData.data.url;
              }
            }
            
            return { ...item, displayUrl: coverUrl || mainUrl };
          } catch {
            return { ...item, displayUrl: '' };
          }
        })
      );
      
      setWorks(worksWithUrls);
    } catch (err) {
      console.error('加载作品失败:', err);
      setWorks([]);
    } finally {
      setLoading(false);
    }
  };

  // 分类切换
  const handleCategoryChange = (category: string) => {
    if (category !== activeCategory) {
      setActiveCategory(category);
      loadWorks(category);
    }
  };

  // 自动轮播
  useEffect(() => {
    if (autoPlay && works.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % works.length);
      }, 5000);
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, works.length]);

  // 滚动到当前卡片
  useEffect(() => {
    if (scrollRef.current && works.length > 0) {
      const cardWidth = 296; // 280px + 16px gap
      scrollRef.current.scrollTo({
        left: currentSlide * cardWidth,
        behavior: 'smooth'
      });
    }
  }, [currentSlide, works.length]);

  // 手动滑动
  const handleScroll = () => {
    if (scrollRef.current) {
      const cardWidth = 296;
      const newSlide = Math.round(scrollRef.current.scrollLeft / cardWidth);
      setCurrentSlide(newSlide);
      setAutoPlay(false);
    }
  };

  // 预览
  const handlePreview = (item: WorkItem & { displayUrl?: string }) => {
    setPreviewItem(item);
    setAutoPlay(false);
  };

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
      {/* 标题 */}
      <div className="pt-12 pb-6 text-center">
        <h1 className="text-3xl font-bold text-foreground">作品集</h1>
      </div>

      {/* 分类导航 */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 py-4 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.category_type)}
                disabled={loading}
                className={`
                  px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  transition-all duration-300 ease-out
                  ${activeCategory === cat.category_type 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary/30' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {cat.display_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Layers className="h-8 w-8" />
            </div>
            <p>暂无作品</p>
          </div>
        ) : (
          <>
            {/* 作品轮播 */}
            <div className="relative">
              {/* 左右箭头 */}
              {works.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide(prev => prev > 0 ? prev - 1 : works.length - 1)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide(prev => prev < works.length - 1 ? prev + 1 : 0)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* 滚动容器 */}
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {works.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    className={`transition-all duration-300 ${idx === currentSlide ? 'ring-2 ring-primary' : 'opacity-80'}`}
                  >
                    <WorkCard
                      item={item}
                      onClick={() => handlePreview(item)}
                    />
                  </div>
                ))}
              </div>

              {/* 指示器 */}
              {works.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {works.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentSlide(idx);
                        setAutoPlay(false);
                      }}
                      className={`
                        h-2 rounded-full transition-all duration-300 
                        ${idx === currentSlide 
                          ? 'bg-primary w-6' 
                          : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 w-2'
                        }
                      `}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 提示 */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              点击卡片查看详情 · 左右滑动浏览更多
            </p>
          </>
        )}
      </div>

      {/* 图片预览 */}
      {previewItem && previewItem.type === 'image' && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setPreviewItem(null)}
        >
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          <div 
            className="w-full h-full flex items-center justify-center p-8 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewItem.displayUrl || ''}
              alt={previewItem.title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full flex items-center gap-4">
            <p className="text-white text-sm">{previewItem.title}</p>
            {previewItem.summary && (
              <p className="text-white/70 text-xs max-w-xs truncate">{previewItem.summary}</p>
            )}
          </div>
        </div>
      )}

      {/* PDF/PPT 预览 - 竖向滚动 */}
      {previewItem && (previewItem.type === 'pdf' || previewItem.type === 'ppt') && (
        <div 
          className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200"
          onClick={() => setPreviewItem(null)}
        >
          <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
            <p className="text-white font-medium truncate px-4">{previewItem.title}</p>
            <div className="flex items-center gap-2">
              {previewItem.summary && (
                <span className="text-white/70 text-sm max-w-xs truncate hidden sm:inline">
                  {previewItem.summary}
                </span>
              )}
              <button
                onClick={() => setPreviewItem(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {previewItem.displayUrl ? (
              <iframe
                src={`${previewItem.displayUrl}#toolbar=0&navpanes=1&scrollbar=1`}
                className="w-full h-full min-h-[calc(100vh-64px)]"
                title={previewItem.title}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                文件加载中...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 视频预览 */}
      {previewItem && previewItem.type === 'video' && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setPreviewItem(null)}
        >
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          <div 
            className="w-full h-full flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.displayUrl ? (
              <video
                src={previewItem.displayUrl}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg"
              />
            ) : (
              <div className="text-white/50 flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                视频加载中...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 隐藏滚动条 */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
