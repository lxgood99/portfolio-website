'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// PDF.js 类型定义
type PDFDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
};

type PDFPageProxy = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};

type PDFJS = {
  getDocument: (options: { url: string }) => {
    onProgress: ((progress: { loaded: number; total: number }) => void) | null;
    promise: Promise<PDFDocumentProxy>;
  };
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  version: string;
};

interface PDFViewerProps {
  url: string;
  title?: string;
  onClose?: () => void;
}

export function PDFViewer({ url, title }: PDFViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<{ pageNum: number; dataUrl: string }[]>([]);
  const [currentViewPage, setCurrentViewPage] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('正在初始化...');
  const [isRenderingAll, setIsRenderingAll] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfJsRef = useRef<PDFJS | null>(null);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  // 动态加载 PDF.js
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        setStatusMessage('正在加载PDF组件...');
        
        // 动态导入 pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist') as unknown as PDFJS;
        
        // 设置 worker - 使用本地文件
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.mjs';
        
        pdfJsRef.current = pdfjsLib;
        setIsReady(true);
        console.log('PDF.js 加载成功, 版本:', pdfjsLib.version);
      } catch (err) {
        console.error('PDF.js 加载失败:', err);
        setError('PDF预览组件加载失败，请刷新页面重试');
        setLoading(false);
      }
    };
    
    loadPdfJs();
  }, []);

  // 加载PDF文档
  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfJsRef.current || !url) return;
      
      try {
        setLoading(true);
        setLoadingProgress(0);
        setError(null);
        setStatusMessage('正在获取PDF文件...');
        setRenderedPages([]);
        
        console.log('开始加载PDF:', url);
        
        const loadingTask = pdfJsRef.current.getDocument({
          url,
        });
        
        // 监听加载进度
        (loadingTask as unknown as { 
          onProgress: ((progress: { loaded: number; total: number }) => void) | null 
        }).onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setLoadingProgress(percent);
            setStatusMessage(`正在加载... ${percent}%`);
          }
        };
        
        const pdf = await loadingTask.promise;
        console.log('PDF加载成功, 页数:', pdf.numPages);
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);
        setStatusMessage('正在渲染页面...');
        
        // 开始预渲染所有页面
        setIsRenderingAll(true);
        await renderAllPages(pdf);
        setIsRenderingAll(false);
        setStatusMessage('');
      } catch (err) {
        console.error('PDF加载失败:', err);
        let errorMessage = 'PDF加载失败';
        
        if (err instanceof Error) {
          if (err.message.includes('Invalid PDF')) {
            errorMessage = '文件格式无效，请确保是有效的PDF文件';
          } else if (err.message.includes('fetch') || err.message.includes('network')) {
            errorMessage = '网络错误，请检查网络连接后重试';
          } else {
            errorMessage = `加载失败: ${err.message}`;
          }
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };
    
    if (isReady && url) {
      loadPDF();
    }
    
    return () => {
      setPdfDoc(null);
    };
  }, [url, isReady]);

  // 渲染所有页面为图片
  const renderAllPages = async (pdf: PDFDocumentProxy) => {
    if (!pdfJsRef.current) return;
    
    const containerWidth = containerRef.current?.clientWidth || 800;
    const pages: { pageNum: number; dataUrl: string }[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        setRenderProgress(Math.round((i / pdf.numPages) * 100));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const baseScale = Math.min(containerWidth / viewport.width, 1.5);
        const scaledViewport = page.getViewport({ scale: baseScale * scale });
        
        const canvas = document.createElement('canvas');
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = scaledViewport.width * pixelRatio;
        canvas.height = scaledViewport.height * pixelRatio;
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;
        
        const context = canvas.getContext('2d');
        if (!context) continue;
        context.scale(pixelRatio, pixelRatio);
        
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
        
        pages.push({
          pageNum: i,
          dataUrl: canvas.toDataURL('image/png'),
        });
        
        setRenderedPages([...pages]);
      } catch (err) {
        console.error(`渲染第${i}页失败:`, err);
      }
    }
  };

  // 处理滚动，同步当前页码
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const pageHeight = container.clientHeight;
    const newPage = Math.round(scrollTop / pageHeight) + 1;
    
    if (newPage !== currentViewPage && newPage >= 1 && newPage <= totalPages) {
      setCurrentViewPage(newPage);
    }
  }, [currentViewPage, totalPages]);

  // 滚动到指定页面
  const scrollToPage = (pageNum: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const pageHeight = container.clientHeight;
    container.scrollTo({
      top: (pageNum - 1) * pageHeight,
      behavior: 'smooth',
    });
    setCurrentViewPage(pageNum);
  };

  // 上一页
  const goToPrevPage = () => {
    if (currentViewPage > 1) {
      scrollToPage(currentViewPage - 1);
    }
  };

  // 下一页
  const goToNextPage = () => {
    if (currentViewPage < totalPages) {
      scrollToPage(currentViewPage + 1);
    }
  };

  // 缩放
  const zoomIn = () => {
    setScale(Math.min(scale + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.25, 0.5));
  };

  // 重新渲染（当缩放改变时）
  useEffect(() => {
    if (pdfDoc && !loading && scale) {
      const reRender = async () => {
        setRenderedPages([]);
        setIsRenderingAll(true);
        await renderAllPages(pdfDoc);
        setIsRenderingAll(false);
      };
      reRender();
    }
  }, [scale, pdfDoc, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-slate-800">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{statusMessage}</p>
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{loadingProgress}%</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-slate-800 p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">{error}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">请尝试下载文件后查看</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-md">
          提示：如果在微信中无法预览，请点击右上角菜单选择「在浏览器中打开」
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-slate-800 relative">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentViewPage <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[80px] text-center">
            {currentViewPage} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentViewPage >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        
        {title && (
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px] hidden sm:block">
            {title}
          </p>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 渲染进度条 */}
      {isRenderingAll && (
        <div className="absolute top-14 left-4 right-4 z-10">
          <div className="bg-white/90 dark:bg-slate-800/90 rounded-lg p-3 shadow-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              正在渲染页面... {renderProgress}%
            </p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* PDF内容区域 - 支持自由滚动 */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory' }}
        onScroll={handleScroll}
      >
        {renderedPages.map((page, idx) => (
          <div 
            key={page.pageNum}
            className="snap-start min-h-full flex items-start justify-center bg-white dark:bg-slate-900 p-4"
            onClick={() => scrollToPage(page.pageNum)}
          >
            <img 
              src={page.dataUrl} 
              alt={`第 ${page.pageNum} 页`}
              className="max-w-full object-contain shadow-lg"
              style={{ cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>
      
      {/* 底部导航栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
        {/* 上下切换按钮 */}
        <div className="flex items-center justify-center gap-8">
          <button 
            onClick={goToPrevPage}
            disabled={currentViewPage <= 1}
            className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-white text-sm font-medium">{currentViewPage}</span>
            <span className="text-white/60 text-sm">/</span>
            <span className="text-white text-sm">{totalPages}</span>
          </div>
          
          <button 
            onClick={goToNextPage}
            disabled={currentViewPage >= totalPages}
            className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        </div>
        
        {/* 页面缩略图指示器 */}
        <div className="flex justify-center gap-2 mt-3 overflow-x-auto pb-2 px-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => scrollToPage(pageNum)}
              className={`shrink-0 w-2 h-2 rounded-full transition-all ${
                pageNum === currentViewPage 
                  ? 'bg-white scale-125' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* 滑动提示 */}
      {renderedPages.length > 1 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs flex items-center gap-1 animate-bounce">
          <ChevronUp className="h-3 w-3" />
          <span>上下滑动浏览</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

export default PDFViewer;
