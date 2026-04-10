'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Image as ImageIcon, 
  FileText, 
  Video,
  X,
  AlertCircle,
  Loader2,
  Edit2,
  Upload,
  Settings,
} from 'lucide-react';
import { useUpload, uploadWithProgress } from '@/hooks/useUpload';
import { formatFileSize } from '@/components/UploadProgress';

interface WorkCategory {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
}

interface WorkItem {
  id?: number;
  tempId?: string;
  type: string;
  title: string;
  file_key: string;
  url?: string;
  description?: string;
  order: number;
  isUploading?: boolean;
  category: string;
  cover_key?: string;
  cover_url?: string | null;
  summary?: string;
}

// 文件项行组件
function FileItemRow({ 
  item, 
  onRemove,
  onEdit,
}: { 
  item: WorkItem; 
  onRemove: () => void;
  onEdit: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (item.file_key && !item.url && !item.isUploading) {
      // 获取 URL
      fetch('/api/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: item.file_key }),
      })
        .then(res => res.json())
        .then(data => {
          if (data?.success) {
            setImageUrl(data.data.url);
          }
        })
        .catch(() => {
          // 忽略错误
        });
    }
  }, [item.file_key, item.url, item.isUploading]);
  
  // 直接使用 url prop
  const displayUrl = item.url || imageUrl;

  const getTypeIcon = () => {
    if (item.type === 'image') return <ImageIcon className="h-5 w-5 text-green-500" />;
    if (item.type === 'video') return <Video className="h-5 w-5 text-purple-500" />;
    return <FileText className="h-5 w-5 text-orange-500" />;
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group">
      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-3 flex-shrink-0" />
      {displayUrl ? (
        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
          {item.type === 'video' ? (
            <div className="w-full h-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Video className="h-6 w-6 text-purple-500" />
            </div>
          ) : (
            <img src={displayUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      ) : (
        <div className="w-16 h-16 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
          {item.isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : getTypeIcon()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${item.isUploading ? 'text-muted-foreground' : ''}`}>
          {item.isUploading ? `${item.title} (上传中...)` : item.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.type === 'image' ? '图片' : item.type === 'video' ? '视频' : '文档'}
        </p>
        {item.summary && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {item.summary}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {item.id && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="编辑封面和备注"
          >
            <Edit2 className="h-4 w-4 text-blue-500" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

// 可排序的文件项
function SortableFileItem({ item, onRemove, onEdit }: { item: WorkItem; onRemove: () => void; onEdit: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.tempId || item.id || 0 });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FileItemRow item={item} onRemove={onRemove} onEdit={onEdit} />
    </div>
  );
}

export default function WorksAdminPage() {
  useAdminAuth();
  const { startUpload, updateProgress, uploadSuccess, uploadError } = useUpload();
  
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 上传相关状态
  const [sizeValidationError, setSizeValidationError] = useState<string | null>(null);
  const [uploadProgress] = useState<{ file: string; percent: number } | null>(null);
  
  // 分类名称编辑
  const [editingCategory, setEditingCategory] = useState<WorkCategory | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // 作品编辑对话框
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null);
  const [workDialogOpen, setWorkDialogOpen] = useState(false);
  const [workCoverKey, setWorkCoverKey] = useState('');
  const [workCoverUrl, setWorkCoverUrl] = useState<string | null>(null);
  const [workSummary, setWorkSummary] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 加载分类
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/work-categories');
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        setCategories(data.data);
        // 默认设置第一个分类
        if (data.data.length > 0) {
          setActiveCategory(data.data[0].category_type);
        }
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载作品
  const loadWorks = useCallback(async (category: string) => {
    if (!category) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/works-by-category/${encodeURIComponent(category)}`);
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }
      const data = await res.json();
      if (data?.success) {
        setWorks(data.data.map((item: WorkItem) => ({
          ...item,
          type: item.type === 'pdf' ? 'ppt' : item.type, // 兼容旧数据
        })));
      }
    } catch (error) {
      console.error('加载作品失败:', error);
      setWorks([]); // 确保出错时清空列表
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      loadCategories();
    }
  }, [mounted, loadCategories]);

  useEffect(() => {
    if (activeCategory) {
      loadWorks(activeCategory);
    }
  }, [activeCategory, loadWorks]);

  // 验证文件大小
  const validateFileSize = (file: File) => {
    const maxSizes: Record<string, number> = {
      image: 10 * 1024 * 1024, // 10MB
      video: 300 * 1024 * 1024, // 300MB
      pdf: 150 * 1024 * 1024, // 150MB
    };
    
    const maxSize = maxSizes[activeCategory] || 150 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: `文件超过${formatFileSize(maxSize)}限制` };
    }
    return { valid: true };
  };

  // 处理文件上传
  const handleFileUploadWithFile = async (file: File, tempId: string) => {
    const validation = validateFileSize(file);
    if (!validation.valid) {
      setWorks(prev => prev.filter(item => item.tempId !== tempId));
      setSizeValidationError(validation.error || '文件大小超过限制');
      return;
    }
    
    setSizeValidationError(null);

    // 标记为上传中
    setWorks(prev => prev.map(item => 
      item.tempId === tempId 
        ? { ...item, title: file.name, isUploading: true }
        : item
    ));

    const fileType = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : 'ppt';

    startUpload(file.name, formatFileSize(file.size));

    try {
      console.log('[上传] 开始上传:', file.name, file.size);
      const result = await uploadWithProgress(file, 'work', (progress: number) => {
        try {
          updateProgress(progress);
        } catch (e) {
          console.error('[上传] 进度回调错误:', e);
        }
      });
      console.log('[上传] 上传结果:', result);
      
      if (result.success) {
        const fileKey = result.data?.key || '';
        
        // 立即保存到数据库
        try {
          const saveRes = await fetch(`/api/works-by-category/${activeCategory}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: fileType,
              title: file.name,
              file_key: fileKey,
            }),
          });
          const saveData = await saveRes.json();
          
          if (saveData.success) {
            // 更新状态，使用从数据库返回的真实 ID
            setWorks(prev => prev.map(item => 
              item.tempId === tempId 
                ? { ...item, id: saveData.data.id, type: fileType, title: file.name, file_key: fileKey, isUploading: false }
                : item
            ));
            uploadSuccess();
          } else {
            console.error('[上传] 保存失败:', saveData.error);
            setWorks(prev => prev.filter(item => item.tempId !== tempId));
            uploadError(saveData.error || '保存失败');
          }
        } catch (saveError) {
          console.error('[上传] 保存异常:', saveError);
          setWorks(prev => prev.filter(item => item.tempId !== tempId));
          uploadError('保存失败，请重试');
        }
      } else {
        setWorks(prev => prev.filter(item => item.tempId !== tempId));
        uploadError(result.error || '上传失败');
      }
    } catch (error) {
      console.error('[上传] 上传异常:', error);
      setWorks(prev => prev.filter(item => item.tempId !== tempId));
      uploadError('上传失败，请重试');
    }
  };

  // 添加文件
  const handleAddFile = () => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 根据当前分类设置默认类型
    const defaultType = activeCategory === 'image' ? 'image' 
      : activeCategory === 'video' ? 'video' 
      : 'ppt';
    
    setWorks(prev => [...prev, { 
      tempId, 
      type: defaultType, 
      title: '选择文件中...', 
      file_key: '', 
      order: prev.length,
      isUploading: false,
      category: activeCategory,
    }]);
    
    const inputId = `file-input-${tempId}`;
    let input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) {
      input = document.createElement('input');
      input.id = inputId;
      input.type = 'file';
      input.accept = activeCategory === 'image' 
        ? '.png,.jpg,.jpeg,.gif,.webp'
        : activeCategory === 'video'
          ? '.mp4,.mov,.avi,.webm'
          : '.pdf,.ppt,.pptx';
      input.style.display = 'none';
      document.body.appendChild(input);
    }
    
    input.value = '';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUploadWithFile(file, tempId);
      } else {
        setWorks(prev => prev.filter(item => item.tempId !== tempId));
      }
      if (input && document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    input.click();
  };

  // 移除文件
  const handleRemoveFile = (itemToRemove: WorkItem) => {
    if (itemToRemove?.id) {
      if (!confirm('确定要删除这个作品吗？')) return;
      fetch(`/api/work-items/${itemToRemove.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setWorks(prev => prev.filter(item => item.id !== itemToRemove.id));
          } else {
            alert('删除失败：' + data.error);
          }
        });
    } else {
      setWorks(prev => prev.filter(item => item.tempId !== itemToRemove.tempId));
    }
  };

  // 拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = works.findIndex(item => (item.tempId || item.id) === active.id);
      const newIndex = works.findIndex(item => (item.tempId || item.id) === over.id);
      
      const newWorks = arrayMove(works, oldIndex, newIndex);
      setWorks(newWorks);
      
      // 只更新有 id 的项目的排序
      const itemsWithId = newWorks
        .filter(item => item.id !== undefined)
        .map((item, idx) => ({ id: item.id, order: idx }));
      
      if (itemsWithId.length > 0) {
        // 更新服务器排序
        try {
          await fetch(`/api/works-by-category/${activeCategory}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsWithId }),
          });
        } catch (error) {
          console.error('更新排序失败:', error);
        }
      }
    }
  };

  // 分类切换
  const handleCategoryChange = (category: string) => {
    if (works.some(w => w.isUploading)) {
      alert('有文件正在上传，请等待上传完成');
      return;
    }
    setActiveCategory(category);
  };

  // 编辑分类名称
  const handleEditCategory = (category: WorkCategory) => {
    setEditingCategory({ ...category });
    setCategoryDialogOpen(true);
  };

  // 保存分类名称
  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    
    try {
      const res = await fetch('/api/work-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          display_name: editingCategory.display_name,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setCategories(prev => prev.map(c => 
          c.id === editingCategory.id ? { ...c, display_name: editingCategory.display_name } : c
        ));
        setCategoryDialogOpen(false);
      } else {
        alert('保存失败：' + data.error);
      }
    } catch {
      alert('保存失败，请重试');
    }
  };

  // 打开作品编辑对话框
  const handleEditWork = (work: WorkItem) => {
    setEditingWork(work);
    setWorkCoverKey(work.cover_key || '');
    setWorkSummary(work.summary || '');
    setWorkCoverUrl(work.cover_url || null);
    setWorkDialogOpen(true);
    
    // 如果有封面 key 但没有 url，加载 url
    if (work.cover_key && !work.cover_url) {
      fetch('/api/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: work.cover_key }),
      })
        .then(res => res.json())
        .then(data => {
          if (data?.success) {
            setWorkCoverUrl(data.data.url);
          }
        });
    }
  };

  // 上传封面图
  const handleUploadCover = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.png,.jpg,.jpeg,.gif,.webp';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editingWork) return;
      
      if (file.size > 5 * 1024 * 1024) {
        alert('封面图片不能超过 5MB');
        return;
      }
      
      setIsUploadingCover(true);
      try {
        const result = await uploadWithProgress(file, 'work', () => {});
        if (result.success) {
          const key = result.data?.key || '';
          setWorkCoverKey(key);
          
          // 获取预览 URL
          const urlRes = await fetch('/api/file-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
          });
          const urlData = await urlRes.json();
          if (urlData?.success) {
            setWorkCoverUrl(urlData.data.url);
          }
        } else {
          alert('封面上传失败');
        }
      } catch {
        alert('封面上传失败');
      } finally {
        setIsUploadingCover(false);
      }
    };
    input.click();
  };

  // 保存作品编辑
  const handleSaveWork = async () => {
    if (!editingWork?.id) return;
    
    try {
      const res = await fetch(`/api/work-items/${editingWork.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_key: workCoverKey,
          summary: workSummary,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setWorks(prev => prev.map(w => 
          w.id === editingWork.id 
            ? { ...w, cover_key: workCoverKey, cover_url: workCoverUrl, summary: workSummary }
            : w
        ));
        setWorkDialogOpen(false);
      } else {
        alert('保存失败：' + data.error);
      }
    } catch {
      alert('保存失败，请重试');
    }
  };

  // 显示加载状态
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">作品集管理</h1>
          <Button variant="outline" onClick={() => window.location.href = '/admin/works/categories'}>
            <Settings className="h-4 w-4 mr-2" />
            管理分类
          </Button>
        </div>

        {/* 加载状态 */}
        {isLoading && categories.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}


        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <div key={cat.id} className="relative group">
                <button
                  onClick={() => handleCategoryChange(cat.category_type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat.category_type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.display_name}
                </button>
                <button
                  onClick={() => handleEditCategory(cat)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-slate-400 hover:bg-slate-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✎
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 上传进度提示 */}
        {uploadProgress && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              上传中: {uploadProgress.file} ({uploadProgress.percent}%)
            </span>
          </div>
        )}

        {/* 错误提示 */}
        {sizeValidationError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">{sizeValidationError}</span>
            <button 
              onClick={() => setSizeValidationError(null)}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 文件列表 */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {categories.find(c => c.category_type === activeCategory)?.display_name || '作品'}
            </h2>
            <Button onClick={handleAddFile} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              添加作品
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <FileText className="h-8 w-8" />
              </div>
              <p>暂无作品</p>
              <p className="text-sm mt-1">点击上方按钮添加作品</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={works.map((w, i) => w.tempId || w.id || i)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {works.map((item) => (
                    <SortableFileItem
                      key={item.tempId || item.id || 0}
                      item={item}
                      onRemove={() => handleRemoveFile(item)}
                      onEdit={() => handleEditWork(item)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* 说明 */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <h3 className="font-medium mb-2">使用说明</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 拖拽文件可以调整顺序</li>
            <li>• 点击作品卡片的编辑按钮可以修改封面和简介</li>
            <li>• 图片建议尺寸：1920x1080</li>
            <li>• 图片最大：10MB | 视频最大：300MB | PPT/PDF最大：150MB</li>
          </ul>
        </div>
      </div>

      {/* 分类名称编辑弹窗 */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类名称</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="categoryName">分类名称</Label>
            <Input
              id="categoryName"
              value={editingCategory?.display_name || ''}
              onChange={(e) => setEditingCategory(prev => prev ? { ...prev, display_name: e.target.value } : null)}
              placeholder="输入分类名称"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveCategory}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 作品编辑弹窗 */}
      <Dialog open={workDialogOpen} onOpenChange={setWorkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑作品</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* 封面图 */}
            <div>
              <Label className="mb-2 block">封面图片</Label>
              <div className="flex items-start gap-3">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800">
                  {workCoverUrl ? (
                    <img src={workCoverUrl} alt="封面" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                      <p className="text-xs">无封面</p>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    上传封面图片，支持 JPG、PNG、GIF、WebP 格式，最大 5MB
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUploadCover}
                    disabled={isUploadingCover}
                  >
                    {isUploadingCover ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    {workCoverKey ? '更换封面' : '上传封面'}
                  </Button>
                  {workCoverKey && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 text-destructive"
                      onClick={() => {
                        setWorkCoverKey('');
                        setWorkCoverUrl(null);
                      }}
                    >
                      移除
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 备注文字 */}
            <div>
              <Label htmlFor="workSummary" className="mb-2 block">作品简介</Label>
              <textarea
                id="workSummary"
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
                placeholder="输入作品简介，用于在前端卡片中展示"
                className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {workSummary.length}/200 字符
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveWork}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
