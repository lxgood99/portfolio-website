'use client';

import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';

// Types
interface Work {
  id: number;
  title: string;
  description: string;
  category: string;
  category_name: string;
  cover_url: string | null;
  display_mode: string;
  order: number;
  items: WorkItem[];
}

interface WorkItem {
  id: number;
  type: string;
  title: string;
  url: string;
  summary: string;
  order: number;
}

interface Category {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
}

export default function WorksPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [works, setWorks] = useState<Work[]>([]);
  const [previewWork, setPreviewWork] = useState<WorkItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化
  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载分类
  useEffect(() => {
    if (!mounted) return;
    
    async function loadCategories() {
      try {
        const res = await fetch('/api/work-categories');
        const data = await res.json();
        if (data.success && data.data) {
          const visible = data.data.filter((c: Category) => c.is_visible);
          const sorted = visible.sort((a: Category, b: Category) => a.sort_order - b.sort_order);
          setCategories(sorted);
          if (sorted.length > 0) {
            setActiveCategory(sorted[0].category_type);
          }
        }
      } catch (e) {
        console.error('加载分类失败', e);
      }
    }
    loadCategories();
  }, [mounted]);

  // 加载作品
  useEffect(() => {
    if (!mounted || !activeCategory) return;
    
    async function loadWorks() {
      setLoading(true);
      try {
        const res = await fetch('/api/works');
        const data = await res.json();
        if (data.success && data.data) {
          // 过滤当前分类的作品（基于work_items的category）
          let filtered = data.data.filter((w: Work) => 
            w.items && w.items.some((item: WorkItem) => item.category === activeCategory)
          );
          const sorted = filtered.sort((a: Work, b: Work) => a.order - b.order);
          
          // 获取每个item的URL
          for (const work of sorted) {
            for (const item of work.items) {
              try {
                const urlRes = await fetch('/api/file-url', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: item.file_key }),
                });
                const urlData = await urlRes.json();
                if (urlData.success) {
                  item.url = urlData.data.url;
                }
              } catch {
                // ignore
              }
            }
          }
          
          setWorks(sorted);
        } else {
          setWorks([]);
        }
      } catch (e) {
        console.error('加载作品失败', e);
        setWorks([]);
      } finally {
        setLoading(false);
      }
    }
    loadWorks();
  }, [mounted, activeCategory]);

  // 自动轮播
  useEffect(() => {
    if (works.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % works.length);
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [works.length]);

  // 滚动到当前
  useEffect(() => {
    if (scrollRef.current && works.length > 0) {
      const cardWidth = 300;
      scrollRef.current.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
    }
  }, [currentIndex, works.length]);

  const handleCategoryChange = (type: string) => {
    if (type !== activeCategory) {
      setActiveCategory(type);
      setCurrentIndex(0);
    }
  };

  const handlePreview = (item: WorkItem, index: number) => {
    setPreviewWork(item);
    setCurrentIndex(index);
  };

  const closePreview = () => {
    setPreviewWork(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-6 w-6 text-green-500" />;
      case 'video': return <Play className="h-6 w-6 text-purple-500" />;
      default: return <FileText className="h-6 w-6 text-orange-500" />;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8">
          作品集
        </h1>

        {/* 分类标签 */}
        {categories.length > 0 && (
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.category_type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat.category_type
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {cat.display_name}
              </button>
            ))}
          </div>
        )}

        {/* 作品列表 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <p>暂无作品</p>
          </div>
        ) : (
          <div className="relative">
            {/* 横向滚动容器 */}
            <div 
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'thin' }}
            >
              {works.map((work, index) => {
                const firstItem = work.items[0];
                const coverUrl = firstItem?.url;
                
                return (
                  <div
                    key={work.id}
                    className="flex-shrink-0 w-[280px] snap-start cursor-pointer group"
                    onClick={() => firstItem && handlePreview(firstItem, index)}
                  >
                    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                      {/* 封面 */}
                      <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-slate-700">
                        {coverUrl ? (
                          <img 
                            src={coverUrl} 
                            alt={work.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {firstItem ? getTypeIcon(firstItem.type) : <ImageIcon className="h-10 w-10 text-slate-400" />}
                          </div>
                        )}
                        {/* 悬浮遮罩 */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                      {/* 信息 */}
                      <div className="p-4">
                        <h3 className="font-medium text-slate-800 dark:text-white truncate">
                          {work.title || '未命名作品'}
                        </h3>
                        {work.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {work.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 左右导航 */}
            {works.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : works.length - 1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white dark:bg-slate-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => prev < works.length - 1 ? prev + 1 : 0)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white dark:bg-slate-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
              </>
            )}
          </div>
        )}

        {/* 指示器 */}
        {works.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {works.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'bg-blue-500 w-6' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 预览弹窗 */}
      {previewWork && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <button
            onClick={closePreview}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          
          {previewWork.type === 'image' && (
            <img 
              src={previewWork.url}
              alt={previewWork.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={e => e.stopPropagation()}
            />
          )}
          
          {previewWork.type === 'video' && (
            <video 
              src={previewWork.url}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={e => e.stopPropagation()}
            />
          )}
          
          {(previewWork.type === 'pdf' || previewWork.type === 'ppt') && (
            <iframe 
              src={previewWork.url}
              className="w-full max-w-4xl h-[90vh] rounded-lg bg-white"
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
