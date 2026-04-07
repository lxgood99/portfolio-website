'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// 文件大小限制配置（单位：字节）
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,     // 10MB - 图片
  pdf: 150 * 1024 * 1024,      // 150MB - PDF文档
  ppt: 150 * 1024 * 1024,      // 150MB - PPT文档
  video: 300 * 1024 * 1024,    // 300MB - 视频
  other: 150 * 1024 * 1024,    // 150MB - 其他类型
} as const;

// 错误提示信息
export const SIZE_ERROR_MESSAGES: Record<string, string> = {
  image: '图片大小不能超过 10MB，请压缩后重试',
  pdf: 'PDF文件大小不能超过 150MB，建议分割文档或降低图片质量',
  ppt: 'PPT文件大小不能超过 150MB，建议压缩后重试',
  video: '视频大小不能超过 300MB，建议压缩或使用短视频',
  other: '文件大小不能超过 150MB',
};

// 根据文件类型获取大小限制
export function getFileSizeLimit(mimeType: string, fileName?: string): { 
  limit: number; 
  type: string; 
  message: string;
} {
  // 先检查文件扩展名（更可靠）
  const ext = fileName?.toLowerCase().split('.').pop() || '';
  
  // 图片类型
  if (mimeType.startsWith('image/')) {
    return { limit: FILE_SIZE_LIMITS.image, type: 'image', message: SIZE_ERROR_MESSAGES.image };
  }
  
  // PDF
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return { limit: FILE_SIZE_LIMITS.pdf, type: 'pdf', message: SIZE_ERROR_MESSAGES.pdf };
  }
  
  // PPT（检查 MIME 类型和扩展名）
  if (
    mimeType.includes('presentation') || 
    mimeType.includes('powerpoint') || 
    ext === 'ppt' || 
    ext === 'pptx'
  ) {
    return { limit: FILE_SIZE_LIMITS.ppt, type: 'ppt', message: SIZE_ERROR_MESSAGES.ppt };
  }
  
  // 视频
  if (mimeType.startsWith('video/')) {
    return { limit: FILE_SIZE_LIMITS.video, type: 'video', message: SIZE_ERROR_MESSAGES.video };
  }
  
  return { limit: FILE_SIZE_LIMITS.other, type: 'other', message: SIZE_ERROR_MESSAGES.other };
}

// 格式化文件大小显示
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// 验证文件大小
export function validateFileSize(file: File): { 
  valid: boolean; 
  error?: string;
  sizeInfo?: {
    fileSize: string;
    maxAllowed: string;
    fileType: string;
  };
} {
  const config = getFileSizeLimit(file.type, file.name);
  
  if (file.size > config.limit) {
    return {
      valid: false,
      error: config.message,
      sizeInfo: {
        fileSize: formatFileSize(file.size),
        maxAllowed: formatFileSize(config.limit),
        fileType: config.type,
      },
    };
  }
  
  return { valid: true };
}

interface UploadProgressBarProps {
  progress: number;
  status: 'uploading' | 'success' | 'error';
  fileName?: string;
  errorMessage?: string;
  fileSize?: string;
  onClose?: () => void;
}

export function UploadProgressBar({
  progress,
  status,
  fileName,
  errorMessage,
  fileSize,
  onClose,
}: UploadProgressBarProps) {
  const [showDetails, setShowDetails] = useState(true);
  
  // 成功后 3 秒自动隐藏
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setShowDetails(false);
        onClose?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);
  
  if (!showDetails && status === 'success') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border p-4 animate-in slide-in-from-bottom-2">
      <div className="flex items-start gap-3">
        {status === 'uploading' && (
          <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0 mt-0.5" />
        )}
        {status === 'success' && (
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
        )}
        {status === 'error' && (
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{fileName || '上传文件'}</p>
            {fileSize && (
              <span className="text-xs text-muted-foreground shrink-0">{fileSize}</span>
            )}
          </div>
          
          {status === 'uploading' && (
            <div className="mt-2 space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">{progress}%</p>
            </div>
          )}
          
          {status === 'success' && (
            <p className="text-xs text-green-600 mt-1">上传成功</p>
          )}
          
          {status === 'error' && (
            <p className="text-xs text-red-500 mt-1">{errorMessage || '上传失败'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 上传状态管理
export interface UploadState {
  isUploading: boolean;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  fileName: string;
  fileSize: string;
  errorMessage: string;
}

// 创建上传状态的 Hook
export function useUploadProgress() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    status: 'uploading',
    fileName: '',
    fileSize: '',
    errorMessage: '',
  });
  
  const startUpload = (fileName: string, fileSize: string) => {
    setUploadState({
      isUploading: true,
      progress: 0,
      status: 'uploading',
      fileName,
      fileSize,
      errorMessage: '',
    });
  };
  
  const updateProgress = (progress: number) => {
    setUploadState(prev => ({
      ...prev,
      progress: Math.min(progress, 99), // 最大99，成功后设为100
    }));
  };
  
  const uploadSuccess = () => {
    setUploadState(prev => ({
      ...prev,
      progress: 100,
      status: 'success',
      isUploading: false,
    }));
  };
  
  const uploadError = (errorMessage: string) => {
    setUploadState(prev => ({
      ...prev,
      status: 'error',
      isUploading: false,
      errorMessage,
    }));
  };
  
  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      status: 'uploading',
      fileName: '',
      fileSize: '',
      errorMessage: '',
    });
  };
  
  return {
    uploadState,
    startUpload,
    updateProgress,
    uploadSuccess,
    uploadError,
    resetUpload,
  };
}

// 模拟上传进度（因为 fetch API 不支持原生进度）
// 使用 XMLHttpRequest 来获取真实的上传进度
export function uploadWithProgress(
  file: File,
  type: string,
  onProgress: (progress: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ success: boolean; data?: any; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append('file', file);
    formData.append('type', type);
    
    // 监听上传进度
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });
    
    // 监听完成
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          resolve({ success: false, error: '解析响应失败' });
        }
      } else if (xhr.status === 413) {
        // 文件过大
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          resolve({ success: false, error: '文件大小超过限制' });
        }
      } else {
        resolve({ success: false, error: `上传失败 (${xhr.status})` });
      }
    });
    
    // 监听错误
    xhr.addEventListener('error', () => {
      resolve({ success: false, error: '网络错误，请检查连接后重试' });
    });
    
    // 监听超时
    xhr.addEventListener('timeout', () => {
      resolve({ success: false, error: '上传超时，请检查网络后重试' });
    });
    
    // 设置超时时间为 5 分钟
    xhr.timeout = 5 * 60 * 1000;
    
    // 发送请求
    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
  });
}
