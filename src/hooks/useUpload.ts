'use client';

import { useState, useCallback } from 'react';

// 上传状态类型
interface UploadState {
  isUploading: boolean;
  progress: number;
  fileName: string;
  fileSize: string;
}

// 上传 Hook
export function useUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    fileName: '',
    fileSize: '',
  });

  // 开始上传
  const startUpload = useCallback((fileName: string, fileSize: string) => {
    setUploadState({
      isUploading: true,
      progress: 0,
      fileName,
      fileSize,
    });
  }, []);

  // 更新进度
  const updateProgress = useCallback((progress: number) => {
    setUploadState(prev => ({
      ...prev,
      progress: Math.min(progress, 99),
    }));
  }, []);

  // 上传成功
  const uploadSuccess = useCallback(() => {
    setUploadState(prev => ({
      ...prev,
      progress: 100,
      isUploading: false,
    }));
  }, []);

  // 上传失败
  const uploadError = useCallback((errorMessage: string) => {
    console.error('上传失败:', errorMessage);
    setUploadState(prev => ({
      ...prev,
      isUploading: false,
    }));
  }, []);

  // 重置状态
  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      fileName: '',
      fileSize: '',
    });
  }, []);

  return {
    uploadState,
    startUpload,
    updateProgress,
    uploadSuccess,
    uploadError,
    resetUpload,
  };
}

// 上传函数（XMLHttpRequest 支持进度）
export async function uploadWithProgress(
  file: File,
  type: string,
  onProgress: (progress: number) => void
): Promise<{ success: boolean; data?: { key: string; url: string }; error?: string }> {
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
        resolve({ success: false, error: '文件大小超过限制' });
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
