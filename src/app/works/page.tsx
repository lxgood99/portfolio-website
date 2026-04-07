'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, FileText, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { PDFViewer } from '@/components/PDFViewer';

interface WorkItem {
  id: number;
  type: string;
  title: string;
  file_key: string;
  url?: string;
  description?: string;
  is_carousel_item?: boolean;
  order: number;
}

interface Work {
  id: number;
  title: string;
  description: string;
  description_align?: string;
  category: string;
  tags: string[];
  display_mode?: string;
  cover_image_key?: string;
  coverImageUrl?: string;
  order: number;
  work_items?: WorkItem[];
  carouselItems?: WorkItem[];
}

// 作品集轮播组件
function WorkCarousel({ images }: { images: WorkItem[]; onImageClick: (item: WorkItem) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  const currentImage = images[currentIndex];

  return (
    <div 
      className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 cursor-pointer overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {currentImage?.url && (
        <img 
          src={currentImage.url} 
          alt={currentImage.title || '作品图片'} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
      
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf':
      return <FileText className="h-4 w-4" />;
    case 'image':
      return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>;
    case 'video':
      return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23,7 16,12 23,17 23,7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

export default function WorksListPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const worksRes = await fetch('/api/works');
      const worksData = await worksRes.json();

      if (worksData.success && worksData.data) {
        const worksWithUrls = await loadWorkItemsUrls(worksData.data);
        setWorks(worksWithUrls);
        
        const cats = new Set<string>();
        worksWithUrls.forEach(w => {
          if (w.category) cats.add(w.category);
        });
        setCategories(['all', ...Array.from(cats)]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkItemsUrls = async (worksList: Work[]): Promise<Work[]> => {
    const updatedWorks = await Promise.all(
      worksList.map(async (work) => {
        let coverImageUrl = '';
        if (work.cover_image_key) {
          try {
            const res = await fetch('/api/file-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: work.cover_image_key }),
            });
            const data = await res.json();
            if (data.success) coverImageUrl = data.data.url;
          } catch (e) {
            console.error('加载封面URL失败:', e);
          }
        }

        const carouselItems: WorkItem[] = [];
        const regularItems: WorkItem[] = [];

        if (work.work_items && work.work_items.length > 0) {
          for (const item of work.work_items) {
            if (item.file_key) {
              try {
                const res = await fetch('/api/file-url', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: item.file_key }),
                });
                const data = await res.json();
                if (data.success) {
                  const itemWithUrl = { ...item, url: data.data.url };
                  if (item.is_carousel_item) {
                    carouselItems.push(itemWithUrl);
                  } else {
                    regularItems.push(itemWithUrl);
                  }
                }
              } catch (e) {
                console.error('加载文件URL失败:', e);
              }
            }
          }
        }

        return {
          ...work,
          coverImageUrl,
          carouselItems,
          work_items: regularItems,
        };
      })
    );
    return updatedWorks;
  };

  const filteredWorks = selectedCategory === 'all' 
    ? works 
    : works.filter(w => w.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">作品集</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 分类筛选 */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
                }`}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
        )}

        {/* 作品数量统计 */}
        <p className="text-sm text-muted-foreground mb-4">
          共 {filteredWorks.length} 个作品
        </p>

        {/* 作品列表 */}
        {filteredWorks.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">暂无作品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorks.map((work) => (
              <Card key={work.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                {work.display_mode === 'carousel' && work.carouselItems && work.carouselItems.length > 0 ? (
                  <WorkCarousel images={work.carouselItems} onImageClick={(item) => setPreviewItem(item)} />
                ) : work.coverImageUrl ? (
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 cursor-pointer overflow-hidden">
                    {work.work_items?.find(item => item.type === 'video' && item.url) ? (
                      <video src={work.coverImageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" muted playsInline />
                    ) : (
                      <img src={work.coverImageUrl} alt={work.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-all duration-300" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:from-slate-800 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{work.title}</h3>
                    {work.category && <Badge variant="outline" className="text-xs shrink-0">{work.category}</Badge>}
                  </div>
                  {work.description && (
                    <p 
                      className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap"
                      style={{ textAlign: (work.description_align || 'left') as 'left' | 'center' | 'right' | 'justify' }}
                    >
                      {work.description}
                    </p>
                  )}
                  {work.tags && work.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {work.tags.slice(0, 4).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  {work.display_mode !== 'carousel' && work.work_items && work.work_items.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t">
                      {work.work_items.slice(0, 4).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setPreviewItem(item)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          {getFileIcon(item.type)}
                          <span className="truncate max-w-[80px]">{item.title || item.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 预览模态框 */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
          <div className="relative max-w-5xl max-h-[90vh] w-full bg-white dark:bg-slate-900 rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              {previewItem.type === 'pdf' && previewItem.url ? (
                <div className="w-full h-[80vh]">
                  <PDFViewer url={previewItem.url} title={previewItem.title} />
                </div>
              ) : previewItem.type === 'video' && previewItem.url ? (
                <video 
                  src={previewItem.url} 
                  controls 
                  autoPlay 
                  className="max-w-full max-h-[80vh] rounded-lg"
                />
              ) : previewItem.type === 'image' && previewItem.url ? (
                <img 
                  src={previewItem.url} 
                  alt={previewItem.title || '作品预览'} 
                  className="max-w-full max-h-[80vh] rounded-lg"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">无法预览此文件</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
