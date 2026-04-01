'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
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
    canvas: HTMLCanvasElement;
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

// Worker源列表，按优先级排序
const WORKER_SOURCES = [
  '/pdf/pdf.worker.min.mjs',  // 本地worker
  'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs',  // unpkg CDN
];

export function PDFViewer({ url, title }: PDFViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('正在初始化...');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfJsRef = useRef<PDFJS | null>(null);

  // 动态加载 PDF.js 并尝试多个worker源
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        setStatusMessage('正在加载PDF组件...');
        
        // 动态导入 pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist') as unknown as PDFJS;
        pdfJsRef.current = pdfjsLib;
        
        // 尝试加载worker
        let workerLoaded = false;
        
        for (const workerSrc of WORKER_SOURCES) {
          try {
            setStatusMessage(`正在加载PDF组件... (${workerSrc.includes('unpkg') ? 'CDN' : '本地'})`);
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
            
            // 测试worker是否可用（通过尝试加载一个空PDF来验证）
            // 这里我们只是设置，实际验证在加载PDF时进行
            workerLoaded = true;
            console.log('PDF.js worker源设置成功:', workerSrc);
            break;
          } catch (err) {
            console.warn('Worker源加载失败:', workerSrc, err);
          }
        }
        
        if (!workerLoaded) {
          throw new Error('无法加载PDF预览组件');
        }
        
        setIsReady(true);
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
        
        console.log('开始加载PDF:', url);
        
        // 首先验证URL是否可访问
        try {
          const headResponse = await fetch(url, { method: 'HEAD' });
          if (!headResponse.ok) {
            throw new Error(`文件无法访问 (${headResponse.status})`);
          }
          console.log('PDF文件可访问, 大小:', headResponse.headers.get('content-length'));
        } catch (fetchErr) {
          console.error('PDF文件访问失败:', fetchErr);
          throw new Error('文件链接无效或已过期，请重新上传');
        }
        
        setStatusMessage('正在加载PDF内容...');
        
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
        setCurrentPage(1);
        setLoading(false);
        setStatusMessage('');
      } catch (err) {
        console.error('PDF加载失败:', err);
        let errorMessage = 'PDF加载失败';
        
        if (err instanceof Error) {
          if (err.message.includes('Invalid PDF')) {
            errorMessage = '文件格式无效，请确保是有效的PDF文件';
          } else if (err.message.includes('fetch')) {
            errorMessage = '网络错误，请检查网络连接后重试';
          } else if (err.message.includes('链接无效') || err.message.includes('已过期')) {
            errorMessage = err.message;
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

  // 渲染当前页
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;
    
    try {
      setRendering(true);
      const page = await pdfDoc.getPage(pageNum);
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // 计算合适的缩放比例
      const containerWidth = containerRef.current?.clientWidth || 800;
      const viewport = page.getViewport({ scale: 1 });
      const baseScale = Math.min(containerWidth / viewport.width, 1.5);
      const scaledViewport = page.getViewport({ scale: baseScale * scale });
      
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas: canvas,
      }).promise;
      
      setRendering(false);
    } catch (err) {
      console.error('页面渲染失败:', err);
      setRendering(false);
    }
  }, [pdfDoc, scale]);

  // 当页面或缩放变化时重新渲染
  useEffect(() => {
    if (pdfDoc && !loading) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, loading, renderPage]);

  // 窗口大小变化时重新渲染
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc && !loading) {
        renderPage(currentPage);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc, currentPage, loading, renderPage]);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setScale(Math.min(scale + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.25, 0.5));
  };

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
          提示：如果在微信中无法预览，请点击右上角菜单选择"在浏览器中打开"
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-slate-800">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[80px] text-center">
            {currentPage} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
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
      
      {/* PDF内容区域 */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex items-start justify-center"
      >
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="shadow-lg bg-white dark:bg-slate-900"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
}

export default PDFViewer;
