'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, X, ChevronRight, ChevronLeft, FileText, Image, Video, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFViewer } from '@/components/PDFViewer';

interface WorkCategory {
  id: number;
  name: string;
  order_index: number;
}

interface WorkItem {
  id: number;
  type: string;
  title: string;
  file_key: string;
  url?: string;
}

interface Work {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  category_id?: number;
  cover_image_key?: string;
  cover_image_url?: string;
  order: number;
  work_items?: WorkItem[];
}

// 预览对话框
function PreviewDialog({
  item,
  onClose,
}: {
  item: WorkItem & { allItems?: WorkItem[] };
  onClose: () => void;
}) {
  const items = item.allItems || [item];
  const initialIndex = items.findIndex((i) => i.id === item.id);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const handlePrev = () => setCurrentIndex((p) => (p > 0 ? p - 1 : items.length - 1));
  const handleNext = () => setCurrentIndex((p) => (p < items.length - 1 ? p + 1 : 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
        <X className="w-8 h-8" />
      </button>

      {items.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10">
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10">
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}

      <div className="max-w-5xl max-h-[90vh] w-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {currentItem.type === 'image' && currentItem.url ? (
          <img src={currentItem.url} alt={currentItem.title} className="max-w-full max-h-[90vh] object-contain" />
        ) : currentItem.type === 'pdf' && currentItem.url ? (
          <div className="w-full h-[90vh] bg-white rounded-lg overflow-hidden">
            <PDFViewer url={currentItem.url} />
          </div>
        ) : currentItem.type === 'video' && currentItem.url ? (
          <video 
            src={currentItem.url} 
            controls 
            autoPlay 
            playsInline
            webkit-playsinline="true"
            x5-video-player-type="h5"
            x5-video-player-fullscreen="true"
            className="max-w-full max-h-[90vh]" 
          />
        ) : (
          <div className="text-white">无法预览此文件</div>
        )}
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          {currentIndex + 1} / {items.length}
        </div>
      )}
    </div>
  );
}

// 作品卡片
function WorkCard({
  work,
  onPreview,
}: {
  work: Work;
  onPreview: (item: WorkItem, allItems: WorkItem[]) => void;
}) {
  const carouselItems = work.work_items?.filter((i) => i.type === 'image' && i.url) || [];
  const firstItem = carouselItems[0] || work.work_items?.[0];

  const handleClick = () => {
    if (carouselItems.length > 0) {
      onPreview(carouselItems[0], carouselItems);
    } else if (firstItem) {
      onPreview(firstItem, work.work_items || []);
    }
  };

  return (
    <div
      className="group relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex-shrink-0 w-[280px] snap-center"
      onClick={handleClick}
    >
      {/* 封面图 */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-slate-700 overflow-hidden">
        {work.cover_image_url ? (
          // 有封面图片时正常显示
          <img
            src={work.cover_image_url}
            alt={work.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : firstItem?.type === 'video' && firstItem?.url ? (
          // 视频文件：电脑端显示首帧，移动端显示播放图标
          <>
            <video
              src={firstItem.url}
              className="w-full h-full object-cover hidden md:block"
              muted
              playsInline
              webkit-playsinline="true"
              preload="metadata"
            />
            <div className="w-full h-full md:hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
                <Video className="w-7 h-7 text-white" />
              </div>
            </div>
          </>
        ) : firstItem?.url ? (
          // 其他文件（图片等）
          <img
            src={firstItem.url}
            alt={work.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // 无任何文件时显示默认图标
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FileText className="w-12 h-12" />
          </div>
        )}
        {/* 悬停遮罩 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {/* 类型标签 */}
        {firstItem && (
          <div className="absolute top-2 right-2">
            {firstItem.type === 'image' && <span className="px-2 py-1 bg-blue-500/80 text-white text-xs rounded"><Image className="w-3 h-3 inline mr-1" />图片</span>}
            {firstItem.type === 'pdf' && <span className="px-2 py-1 bg-red-500/80 text-white text-xs rounded"><FileText className="w-3 h-3 inline mr-1" />PDF</span>}
            {firstItem.type === 'video' && <span className="px-2 py-1 bg-purple-500/80 text-white text-xs rounded"><Video className="w-3 h-3 inline mr-1" />视频</span>}
          </div>
        )}
      </div>
      {/* 内容 */}
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate">{work.title}</h3>
        {work.subtitle && <p className="text-sm text-gray-500 truncate">{work.subtitle}</p>}
        {work.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{work.description}</p>}
      </div>
    </div>
  );
}

export default function WorksPage() {
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<(WorkItem & { allItems?: WorkItem[] }) | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categoriesLoaded) {
      loadWorks();
    }
  }, [selectedCategoryId, categoriesLoaded]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/work-categories', { cache: 'no-store' });
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        setCategories(data.data);
        setCategoriesLoaded(true);
      }
    } catch (e) { console.error('加载分类失败:', e); }
  };

  const loadWorks = async () => {
    setIsLoading(true);
    setIsAnimating(true);
    try {
      const url = selectedCategoryId !== 'all' ? `/api/works?categoryId=${selectedCategoryId}` : '/api/works';
      const res = await fetch(url, { cache: 'no-store' });
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        // 按分类顺序排序（分类顺序优先，然后是作品自己的 order）
        const sortedWorks = [...data.data].sort((a: Work, b: Work) => {
          // 如果有分类，按分类顺序排
          if (a.category_id && b.category_id && selectedCategoryId === 'all') {
            const catA = categories.find(c => c.id === a.category_id);
            const catB = categories.find(c => c.id === b.category_id);
            const orderA = catA?.order_index ?? 999;
            const orderB = catB?.order_index ?? 999;
            if (orderA !== orderB) return orderA - orderB;
          }
          // 同分类内按作品自己的 order 排
          return (a.order || 0) - (b.order || 0);
        });
        
        const worksWithUrls = await Promise.all(sortedWorks.map(async (w: Work) => {
          let coverUrl = '';
          if (w.cover_image_key) {
            try {
              const r = await fetch('/api/file-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: w.cover_image_key }) });
              const d = await r.json();
              coverUrl = d.success ? d.data.url : '';
            } catch {}
          }
          // 加载文件URL
          const itemsWithUrls = await Promise.all((w.work_items || []).map(async (item: WorkItem) => {
            if (!item.url && item.file_key) {
              try {
                const r = await fetch('/api/file-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: item.file_key }) });
                const d = await r.json();
                return { ...item, url: d.success ? d.data.url : '' };
              } catch { return item; }
            }
            return item;
          }));
          return { ...w, cover_image_url: coverUrl, work_items: itemsWithUrls };
        }));
        setWorks(worksWithUrls);
      }
    } catch (e) { console.error('加载作品失败:', e); }
    finally {
      setTimeout(() => { setIsLoading(false); setIsAnimating(false); }, 300);
    }
  };

  const handleCategoryChange = (id: string) => {
    if (id === selectedCategoryId) return;
    setIsAnimating(true);
    setTimeout(() => setSelectedCategoryId(id), 150);
  };

  const handlePreview = useCallback((item: WorkItem, allItems: WorkItem[]) => {
    setPreviewItem({ ...item, allItems });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* 头部 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" asChild><Link href="/"><ArrowLeft className="h-4 w-4 mr-1" />返回</Link></Button>
          </div>
          {/* 分类按钮 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${selectedCategoryId === 'all' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300'}`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(String(cat.id))}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${selectedCategoryId === String(cat.id) ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 作品列表 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div
          ref={scrollRef}
          className={`flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        >
          {isLoading ? (
            <div className="w-full flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : works.length === 0 ? (
            <div className="w-full text-center py-20 text-gray-500">
              <p>暂无作品</p>
            </div>
          ) : (
            works.map((work) => (
              <WorkCard key={work.id} work={work} onPreview={handlePreview} />
            ))
          )}
        </div>
      </main>

      {/* 预览对话框 */}
      {previewItem && <PreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
}
