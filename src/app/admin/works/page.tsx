'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Edit2,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Video,
  FileText,
  Plus,
  Loader2,
  X,
  Upload,
  AlertCircle,
  Info,
  Layers,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';

// Types
interface WorkItem {
  id?: number;
  tempId?: number;
  type: string;
  title: string;
  file_key?: string;
  url?: string;
  description?: string;
  order: number;
  category: string;
  cover_key?: string;
  cover_url?: string | null;
  summary?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface WorkCategory {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
}

// 拖拽组件
function SortableItem({ 
  item, 
  onEdit, 
  onRemove 
}: { 
  item: WorkItem; 
  onEdit: () => void; 
  onRemove: () => void;
}) {
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
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group"
    >
      {/* 拖拽手柄 */}
      <div 
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* 预览图 */}
      <div className="w-12 h-12 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.type === 'image' && <ImageIcon className="h-5 w-5 text-green-500" />}
        {item.type === 'video' && <Video className="h-5 w-5 text-purple-500" />}
        {(item.type === 'pdf' || item.type === 'ppt') && <FileText className="h-5 w-5 text-orange-500" />}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {item.type === 'image' ? '图片' : item.type === 'video' ? '视频' : '文档'}
          {item.summary && ` · ${item.summary}`}
        </p>
      </div>

      {/* 上传进度 */}
      {item.isUploading && (
        <div className="w-20">
          <Progress value={item.uploadProgress || 0} className="h-2" />
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
          <Edit2 className="h-4 w-4 text-blue-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

interface FormValues {
  title: string;
  summary: string;
  category: string;
}

export default function AdminWorksPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WorkItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadName, setCurrentUploadName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tempIdRef = useRef(0);

  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      summary: '',
      category: '',
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 初始化
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const catRes = await fetch('/api/work-categories');
      const catData = await catRes.json();
      
      if (catData.success && catData.data) {
        setCategories(catData.data);
        if (catData.data.length > 0) {
          setActiveCategory(catData.data[0].category_type);
          await loadWorks(catData.data[0].category_type);
        }
      }
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted, loadData]);

  // 加载作品
  const loadWorks = async (category: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/works-by-category/${category}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setWorks(data.data);
      } else {
        setWorks([]);
      }
    } catch (err) {
      console.error('加载作品失败:', err);
      setWorks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = works.findIndex(w => (w.tempId || w.id || 0) === active.id);
      const newIndex = works.findIndex(w => (w.tempId || w.id || 0) === over.id);
      
      const newWorks = arrayMove(works, oldIndex, newIndex);
      setWorks(newWorks);

      // 保存排序
      try {
        const updates = newWorks.map((item, idx) => ({
          id: item.id,
          order: idx,
        }));
        
        await fetch('/api/work-items/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: updates }),
        });
      } catch (err) {
        console.error('保存排序失败:', err);
      }
    }
  };

  // 上传文件
  const uploadFile = async (file: File) => {
    const type = file.type.startsWith('image/') ? 'image' 
      : file.type.startsWith('video/') ? 'video' 
      : file.type.includes('pdf') ? 'pdf' 
      : 'ppt';

    // 文件大小限制
    const limits = {
      image: 10 * 1024 * 1024, // 10MB
      video: 300 * 1024 * 1024, // 300MB
      pdf: 150 * 1024 * 1024, // 150MB
      ppt: 150 * 1024 * 1024, // 150MB
    };

    if (file.size > limits[type as keyof typeof limits]) {
      setError(`文件大小超过限制：${type === 'image' ? '图片10MB' : type === 'video' ? '视频300MB' : 'PPT/PDF 150MB'}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadName(file.name);
    setError(null);

    const tempId = --tempIdRef.current;
    const newItem: WorkItem = {
      tempId,
      type,
      title: file.name,
      category: activeCategory,
      order: works.length,
      isUploading: true,
      uploadProgress: 0,
    };

    setWorks(prev => [...prev, newItem]);

    try {
      // 上传到 /api/upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', activeCategory);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (uploadData.success) {
        // 更新作品信息
        const updateRes = await fetch(`/api/work-items/${uploadData.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name,
            category: activeCategory,
          }),
        });

        if (updateRes.ok) {
          setWorks(prev => prev.map(w => 
            w.tempId === tempId 
              ? { ...w, ...uploadData.data, isUploading: false, uploadProgress: 100 }
              : w
          ));
        }
      } else {
        throw new Error(uploadData.error || '上传失败');
      }
    } catch (err) {
      console.error('上传失败:', err);
      setError(err instanceof Error ? err.message : '上传失败');
      setWorks(prev => prev.filter(w => w.tempId !== tempId));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadName('');
    }
  };

  // 文件选择
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, [activeCategory, works]);

  // 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
      e.target.value = '';
    }
  };

  // 删除作品
  const handleDelete = async () => {
    if (!deleteConfirm?.id) return;

    try {
      const res = await fetch(`/api/work-items/${deleteConfirm.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setWorks(prev => prev.filter(w => w.id !== deleteConfirm.id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  // 打开编辑
  const openEdit = (item: WorkItem) => {
    setEditingWork(item);
    form.reset({
      title: item.title,
      summary: item.summary || '',
      category: item.category,
    });
  };

  // 保存编辑
  const handleSaveEdit = async (values: FormValues) => {
    if (!editingWork?.id) return;

    try {
      const res = await fetch(`/api/work-items/${editingWork.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          summary: values.summary,
          category: values.category,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorks(prev => prev.map(w => 
          w.id === editingWork.id ? { ...w, ...data.data } : w
        ));
        setEditingWork(null);
      }
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  // 切换分类
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    loadWorks(category);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">作品管理</h1>

      {/* 分类选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">选择分类</label>
        <Select value={activeCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.category_type}>
                {cat.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 上传区域 */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.ppt,.pptx"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label 
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          {isUploading ? (
            <div>
              <p className="text-sm mb-2">{currentUploadName}</p>
              <Progress value={uploadProgress} className="w-48 mx-auto" />
            </div>
          ) : (
            <div>
              <p className="text-sm">
                点击选择文件，或拖拽文件到此处
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                图片最大 10MB · 视频最大 300MB · PPT/PDF 最大 150MB
              </p>
            </div>
          )}
        </label>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 作品列表 */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">
          {categories.find(c => c.category_type === activeCategory)?.display_name || '作品列表'} 
          <span className="text-muted-foreground ml-2">({works.length}个)</span>
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-8 w-8 mx-auto mb-2" />
            <p>暂无作品</p>
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
                  <SortableItem
                    key={item.tempId || item.id || 0}
                    item={item}
                    onEdit={() => openEdit(item)}
                    onRemove={() => item.id ? setDeleteConfirm(item) : null}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* 使用说明 */}
      <div className="border-t pt-6 mt-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium mb-2">使用说明</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 拖拽作品卡片可以调整顺序</li>
                <li>• 点击编辑按钮可以修改封面、标题和简介</li>
                <li>• 图片建议尺寸：1920x1080</li>
                <li>• 图片最大：10MB | 视频最大：300MB | PPT/PDF 最大：150MB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      <Dialog open={!!editingWork} onOpenChange={() => setEditingWork(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑作品</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="作品标题" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>简介</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="简短描述（选填）" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分类</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.category_type}>
                            {cat.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingWork(null)}>
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            确定要删除作品 "{deleteConfirm?.title}" 吗？此操作无法撤销。
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
