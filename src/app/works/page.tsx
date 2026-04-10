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

interface WorkItem {
  id: number;
  type: string;
  title: string;
  file_key: string;
  url?: string;
  summary?: string;
  order: number;
  category: string;
}

interface Work {
  id: number;
  title: string;
  description: string;
  category: string;
  order: number;
  items: WorkItem[];
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [displayWorks, setDisplayWorks] = useState<Work[]>([]);
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselReady, setCarouselReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载数据
  useEffect(() => {
    if (!mounted || initialized.current) return;
    initialized.current = true;

    async function init() {
      setLoading(true);
      try {
        const [catRes, workRes] = await Promise.all([
          fetch('/api/work-categories'),
          fetch('/api/works'),
        ]);

        const catData = await catRes.json();
        const workData = await workRes.json();

        if (catData.success && catData.data) {
          const sorted = catData.data
            .filter((c: Category) => c.is_visible)
            .sort((a: Category, b: Category) => a.sort_order - b.sort_order);
          setCategories(sorted);
        }

        if (workData.success && workData.data) {
          setAllWorks(workData.data);
        }
      } catch (e) {
        console.error('加载失败', e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [mounted]);

  // 根据分类过滤并加载URL
  useEffect(() => {
    if (!mounted || categories.length === 0) return;

    const cat = categories[activeIndex];
    if (!cat) return;

    const filtered = allWorks.filter((w: Work) =>
      w.items && w.items.some((item: WorkItem) => item.category === cat.category_type)
    );

    // 加载URL
    const loadUrls = async () => {
      setDisplayWorks([]);
      for (const work of filtered) {
        for (const item of work.items) {
          if (!item.url && item.file_key) {
            try {
              const res = await fetch('/api/file-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: item.file_key }),
              });
              const data = await res.json();
              if (data.success) {
                item.url = data.data.url;
              }
            } catch {}
          }
        }
      }
      setDisplayWorks(filtered.sort((a: Work, b: Work) => a.order - b.order));
      setCurrentIndex(0);
      setCarouselReady(false);
      setTimeout(() => setCarouselReady(true), 100);
    };

    loadUrls();
  }, [mounted, categories, activeIndex, allWorks]);

  // 自动轮播
  useEffect(() => {
    if (carouselReady && displayWorks.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % displayWorks.length);
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [carouselReady, displayWorks.length]);

  // 滚动到当前卡片
  useEffect(() => {
    if (scrollRef.current && carouselReady && displayWorks.length > 0) {
      const cardWidth = 296;
      scrollRef.current.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
    }
  }, [currentIndex, carouselReady, displayWorks.length]);

  const handleTabChange = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    setCurrentIndex(0);
  };

  const handlePreview = (item: WorkItem, index: number) => {
    setPreviewItem(item);
    setCurrentIndex(index);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-8 w-8 text-green-500" />;
      case 'video': return <Play className="h-8 w-8 text-purple-500" />;
      default: return <FileText className="h-8 w-8 text-orange-500" />;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const currentCat = categories[activeIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8">
          作品集
        </h1>

        {/* 分类标签 */}
        {categories.length > 0 && (
          <div className="flex justify-center gap-3 mb-10 flex-wrap">
            {categories.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => handleTabChange(idx)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  idx === activeIndex
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 -translate-y-0.5'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 hover:-translate-y-0.5'
                }`}
              >
                {cat.display_name}
              </button>
            ))}
          </div>
        )}

        {/* 内容区 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : displayWorks.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <ImageIcon className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              {currentCat ? `暂无${currentCat.display_name}作品` : '暂无作品'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* 横向滚动 */}
            <div 
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 transparent' }}
            >
              {displayWorks.map((work, idx) => {
                const firstItem = work.items[0];
                return (
                  <div
                    key={work.id}
                    className="flex-shrink-0 w-[280px] snap-start cursor-pointer group"
                    onClick={() => firstItem && handlePreview(firstItem, idx)}
                  >
                    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full">
                      <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-slate-700">
                        {firstItem?.url ? (
                          <img 
                            src={firstItem.url} 
                            alt={work.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            {firstItem ? getTypeIcon(firstItem.type) : <ImageIcon className="h-10 w-10 text-slate-400" />}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <ZoomIn className="h-9 w-9 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
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

            {/* 导航按钮 */}
            {displayWorks.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex(p => p > 0 ? p - 1 : displayWorks.length - 1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-white dark:bg-slate-700 rounded-full p-2.5 shadow-lg hover:shadow-xl transition-shadow z-10"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  onClick={() => setCurrentIndex(p => p < displayWorks.length - 1 ? p + 1 : 0)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-white dark:bg-slate-700 rounded-full p-2.5 shadow-lg hover:shadow-xl transition-shadow z-10"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
              </>
            )}
          </div>
        )}

        {/* 指示器 */}
        {displayWorks.length > 1 && (
          <div className="flex justify-center gap-2 mt-5">
            {displayWorks.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'bg-blue-500 w-6' : 'bg-slate-300 dark:bg-slate-600 w-2'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 预览 */}
      {previewItem && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <div onClick={e => e.stopPropagation()}>
            {previewItem.type === 'image' && (
              <img src={previewItem.url} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            )}
            {previewItem.type === 'video' && (
              <video src={previewItem.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg" />
            )}
            {(previewItem.type === 'pdf' || previewItem.type === 'ppt') && (
              <iframe src={previewItem.url} className="w-full max-w-4xl h-[90vh] rounded-lg bg-white" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
