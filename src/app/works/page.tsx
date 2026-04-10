'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn,
  Image as ImageIcon,
  Video,
  Play,
  FileText,
  Layers,
  Loader2,
} from 'lucide-react';

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

// 作品卡片组件
function WorkCard({ 
  item, 
  onPreview 
}: { 
  item: WorkItem & { displayUrl?: string }; 
  onPreview: () => void;
}) {
  const getTypeIcon = () => {
    if (item.type === 'image') return <ImageIcon className="h-8 w-8 text-green-500" />;
    if (item.type === 'video') return <Play className="h-8 w-8 text-purple-500" />;
    return <FileText className="h-8 w-8 text-orange-500" />;
  };
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 group"
      onClick={onPreview}
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
            {getTypeIcon()}
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
  const [activeCategory, setActiveCategory] = useState<string>('image');
  const [works, setWorks] = useState<(WorkItem & { displayUrl?: string })[]>([]);
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 初始化
  useEffect(() => {
    setMounted(true);
    loadInitialData();
  }, []);

  // 加载初始数据
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 加载分类
      const catRes = await fetch('/api/work-categories');
      const catData = await catRes.json();
      
      if (!catData.success) {
        throw new Error('加载分类失败');
      }
      
      const visibleCats = catData.data.filter((c: WorkCategory) => c.is_visible);
      setCategories(visibleCats);
      
      // 优先选中图片分类
      const imageCat = visibleCats.find((c: WorkCategory) => c.category_type === 'image');
      const defaultCat = imageCat || visibleCats[0];
      const targetCategory = defaultCat?.category_type || 'image';
      
      setActiveCategory(targetCategory);
      await loadWorks(targetCategory);
    } catch (err) {
      console.error('加载失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载作品
  const loadWorks = async (category: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/works-by-category/${category}`);
      const data = await res.json();
      
      if (!data.success) {
        throw new Error('加载作品失败');
      }
      
      // 获取文件URL
      const worksWithUrls = await Promise.all(
        data.data.map(async (item: WorkItem) => {
          try {
            // 获取主文件URL
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
            
            // 获取封面URL
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
      setError(err instanceof Error ? err.message : '加载作品失败');
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

  // 预览
  const handlePreview = (item: WorkItem & { displayUrl?: string }) => {
    setPreviewItem(item);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewItem(null);
  };

  const currentCategoryName = categories.find(c => c.category_type === activeCategory)?.display_name || '作品';

  // 渲染状态
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
      {/* 标签导航 */}
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
        {/* 标题 */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            {activeCategory === 'image' && <ImageIcon className="h-6 w-6" />}
            {activeCategory === 'video' && <Video className="h-6 w-6" />}
            {(activeCategory === 'ppt' || activeCategory === 'pdf') && <FileText className="h-6 w-6" />}
            {activeCategory === 'image' && '图片作品'}
            {activeCategory === 'video' && '视频作品'}
            {(activeCategory === 'ppt' || activeCategory === 'pdf') && '文档作品'}
            {!['image', 'video', 'ppt', 'pdf'].includes(activeCategory) && currentCategoryName}
          </h2>
          <p className="text-muted-foreground text-sm mt-2">{currentCategoryName} · 共 {works.length} 个作品</p>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <p className="text-red-500 text-2xl">!</p>
            </div>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => loadWorks(activeCategory)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && works.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Layers className="h-8 w-8" />
            </div>
            <p>暂无作品</p>
            <p className="text-sm mt-2">点击上方标签切换其他分类</p>
          </div>
        )}

        {/* 作品网格 */}
        {!loading && !error && works.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {works.map((item) => (
              <WorkCard
                key={item.id}
                item={item}
                onPreview={() => handlePreview(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 图片预览 */}
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

      {/* PDF/PPT 预览 */}
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
            {previewItem.displayUrl ? (
              <iframe
                src={previewItem.displayUrl}
                className="w-full h-full rounded-lg bg-white"
                title={previewItem.title}
              />
            ) : (
              <div className="text-white/50 flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
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
    </div>
  );
}
