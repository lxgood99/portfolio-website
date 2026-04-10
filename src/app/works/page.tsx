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
  isUploading?: boolean;
  tempId?: number;
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

// 独立的作品卡片列表组件
function WorksGrid({ 
  works, 
  currentIndex, 
  setCurrentIndex,
  onPreview 
}: {
  works: WorkItem[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onPreview: (item: WorkItem, index: number) => void;
}) {
  if (works.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Layers className="h-8 w-8" />
        </div>
        <p>暂无作品</p>
      </div>
    );
  }

  return (
    <>
      {/* 卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {works.map((item, idx) => (
          <div 
            key={item.id || item.tempId || idx}
            className={`
              transition-all duration-300 cursor-pointer
              ${idx === currentIndex ? 'ring-2 ring-primary scale-105' : 'opacity-80 hover:opacity-100'}
            `}
            onClick={() => {
              setCurrentIndex(idx);
              onPreview(item, idx);
            }}
          >
            <WorkCard item={item} onClick={() => onPreview(item, idx)} />
          </div>
        ))}
      </div>

      {/* 作品信息 */}
      {works[currentIndex] && (
        <div className="text-center mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
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

      {/* 指示器 */}
      {works.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {works.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
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
    </>
  );
}

export default function WorksPage() {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('image');
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载数据
  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // 加载分类
        const catRes = await fetch('/api/work-categories');
        const catData = await catRes.json();
        if (catData?.success) {
          const visibleCats = catData.data.filter((c: WorkCategory) => c.is_visible);
          setCategories(visibleCats);
          
          // 优先选中图片分类
          const imageCat = visibleCats.find((c: WorkCategory) => c.category_type === 'image');
          const defaultCat = imageCat || visibleCats[0];
          const targetCategory = defaultCat?.category_type || 'image';
          setActiveCategory(targetCategory);
          
          // 加载该分类作品
          const res = await fetch(`/api/works-by-category/${targetCategory}`);
          const data = await res.json();
          if (data?.success && data.data) {
            const worksWithUrls = await Promise.all(
              data.data.map(async (item: WorkItem) => {
                const mainUrl = await loadFileUrl(item.file_key);
                let coverUrl: string | null = null;
                if (item.cover_key) {
                  coverUrl = await loadFileUrl(item.cover_key);
                }
                return { ...item, url: mainUrl, cover_url: coverUrl };
              })
            );
            setWorks(worksWithUrls);
          } else {
            setWorks([]);
          }
        }
      } catch (error) {
        console.error('加载失败:', error);
        setWorks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [mounted]);

  // 分类切换
  const handleCategoryChange = async (category: string) => {
    if (category === activeCategory) return;
    setActiveCategory(category);
    setIsLoading(true);
    setCurrentIndex(0);

    try {
      const res = await fetch(`/api/works-by-category/${category}`);
      const data = await res.json();
      if (data?.success && data.data) {
        const worksWithUrls = await Promise.all(
          data.data.map(async (item: WorkItem) => {
            const mainUrl = await loadFileUrl(item.file_key);
            let coverUrl: string | null = null;
            if (item.cover_key) {
              coverUrl = await loadFileUrl(item.cover_key);
            }
            return { ...item, url: mainUrl, cover_url: coverUrl };
          })
        );
        setWorks(worksWithUrls);
      } else {
        setWorks([]);
      }
    } catch (error) {
      console.error('加载失败:', error);
      setWorks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 预览
  const handlePreview = (item: WorkItem, index: number) => {
    setPreviewItem(item);
    setCurrentIndex(index);
  };

  const closePreview = () => {
    setPreviewItem(null);
  };

  const currentCategoryName = categories.find(c => c.category_type === activeCategory)?.display_name || '作品';

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
                  disabled={isLoading}
                  className={`
                    px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
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

        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <WorksGrid 
            works={works}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            onPreview={handlePreview}
          />
        )}

        {/* 提示文字 */}
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>点击卡片查看详情</p>
        </div>
      </div>

      {/* 图片预览模态框 */}
      {previewItem && previewItem.type === 'image' && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={closePreview}
        >
          <button
            onClick={closePreview}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
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
          </div>
        </div>
      )}

      {/* PPT/PDF 预览模态框 */}
      {previewItem && (previewItem.type === 'pdf' || previewItem.type === 'ppt') && (
        <div 
          className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200"
          onClick={closePreview}
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
                onClick={closePreview}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4">
            {previewItem.url ? (
              <iframe
                src={previewItem.url}
                className="w-full h-full rounded-lg bg-white"
                title={previewItem.title}
              />
            ) : (
              <div className="text-white/50">文件加载中...</div>
            )}
          </div>
        </div>
      )}

      {/* 视频预览模态框 */}
      {previewItem && previewItem.type === 'video' && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={closePreview}
        >
          <button
            onClick={closePreview}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          <div 
            className="w-full h-full flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {previewItem.url ? (
              <video
                src={previewItem.url}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg"
              />
            ) : (
              <div className="text-white/50">视频加载中...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
