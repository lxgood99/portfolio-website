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
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化 - 只设置 mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载所有数据（分类 + 作品）
  useEffect(() => {
    if (!mounted) return;
    
    async function loadData() {
      setLoading(true);
      try {
        // 并行加载分类和作品
        const [catRes, workRes] = await Promise.all([
          fetch('/api/work-categories'),
          fetch('/api/works'),
        ]);
        
        const catData = await catRes.json();
        const workData = await workRes.json();
        
        // 处理分类
        if (catData.success && catData.data) {
          const visible = catData.data.filter((c: Category) => c.is_visible);
          const sorted = visible.sort((a: Category, b: Category) => a.sort_order - b.sort_order);
          setCategories(sorted);
          setActiveCategoryIndex(0); // 默认选中第一个
        }
        
        // 处理作品
        if (workData.success && workData.data) {
          setAllWorks(workData.data);
          
          // 获取第一个分类的 type
          const firstCat = catData.success ? 
            catData.data.filter((c: Category) => c.is_visible)
               .sort((a: Category, b: Category) => a.sort_order - b.sort_order)[0] : null;
          
          if (firstCat) {
            // 根据第一个分类过滤
            const filtered = workData.data.filter((w: Work) => 
              w.items && w.items.some((item: WorkItem) => item.category === firstCat.category_type)
            );
            
            // 获取封面URL
            for (const work of filtered) {
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
            
            setFilteredWorks(filtered.sort((a: Work, b: Work) => a.order - b.order));
          }
        }
      } catch (e) {
        console.error('加载失败', e);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [mounted]);

  // 切换分类
  const handleCategoryChange = (index: number) => {
    if (index === activeCategoryIndex) return;
    
    setActiveCategoryIndex(index);
    setCurrentIndex(0);
    
    const cat = categories[index];
    if (!cat) return;
    
    // 过滤作品
    const filtered = allWorks.filter((w: Work) => 
      w.items && w.items.some((item: WorkItem) => item.category === cat.category_type)
    );
    
    // 获取URL
    const loadUrls = async () => {
      for (const work of filtered) {
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
      setFilteredWorks([...filtered]);
    };
    
    loadUrls();
  };

  // 自动轮播
  useEffect(() => {
    if (filteredWorks.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % filteredWorks.length);
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [filteredWorks.length]);

  // 滚动到当前
  useEffect(() => {
    if (scrollRef.current && filteredWorks.length > 0) {
      const cardWidth = 296;
      scrollRef.current.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
    }
  }, [currentIndex, filteredWorks.length]);

  const handlePreview = (item: WorkItem, index: number) => {
    setPreviewItem(item);
    setCurrentIndex(index);
  };

  const closePreview = () => {
    setPreviewItem(null);
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

  const currentCategory = categories[activeCategoryIndex];

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
            {categories.map((cat, index) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(index)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  index === activeCategoryIndex
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {cat.display_name}
              </button>
            ))}
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <p>{currentCategory ? `暂无${currentCategory.display_name}作品` : '暂无作品'}</p>
          </div>
        ) : (
          <div className="relative">
            {/* 横向滚动容器 */}
            <div 
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 transparent' }}
            >
              {filteredWorks.map((work, index) => {
                const firstItem = work.items[0];
                
                return (
                  <div
                    key={work.id}
                    className="flex-shrink-0 w-[280px] snap-start cursor-pointer group"
                    onClick={() => firstItem && handlePreview(firstItem, index)}
                  >
                    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full">
                      {/* 封面 */}
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
                            {firstItem && (
                              <span className="mt-2 text-xs text-slate-500">
                                {firstItem.type === 'image' ? '图片' : 
                                 firstItem.type === 'video' ? '视频' : '文档'}
                              </span>
                            )}
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
            {filteredWorks.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : filteredWorks.length - 1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white dark:bg-slate-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => prev < filteredWorks.length - 1 ? prev + 1 : 0)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white dark:bg-slate-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
              </>
            )}
          </div>
        )}

        {/* 指示器 */}
        {filteredWorks.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {filteredWorks.map((_, i) => (
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
      {previewItem && (
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
          
          <div onClick={e => e.stopPropagation()}>
            {previewItem.type === 'image' && (
              <img 
                src={previewItem.url}
                alt={previewItem.title}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}
            
            {previewItem.type === 'video' && (
              <video 
                src={previewItem.url}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            )}
            
            {(previewItem.type === 'pdf' || previewItem.type === 'ppt') && (
              <iframe 
                src={previewItem.url}
                className="w-full max-w-4xl h-[90vh] rounded-lg bg-white"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
