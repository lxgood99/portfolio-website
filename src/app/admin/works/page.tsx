'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowLeft, Plus, Pencil, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { validateFileSize, uploadWithProgress } from '@/components/UploadProgress';

// 类型定义
interface WorkCategory {
  id: number;
  name: string;
  order_index: number;
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
}

// 拖拽图标组件
function DragHandle({ id }: { id: number | string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 flex items-center justify-center">
      <GripVertical className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

// 分类标签组件
function CategoryTag({
  category,
  isSelected,
  onClick,
  onEdit,
}: {
  category: WorkCategory;
  isSelected: boolean;
  onClick: () => void;
  onEdit: (name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  const handleSave = () => {
    if (editName.trim()) onEdit(editName.trim());
    setIsEditing(false);
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-4 py-2 rounded-full border transition-all text-sm font-medium h-10
        ${isSelected 
          ? 'bg-black text-white border-black' 
          : 'bg-white text-black border-gray-300 hover:border-gray-500'}`}
    >
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); else if (e.key === 'Escape') { setEditName(category.name); setIsEditing(false); } }}
          onClick={(e) => e.stopPropagation()}
          className="w-20 bg-transparent outline-none text-center"
          autoFocus
        />
      ) : (
        <span onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>{category.name}</span>
      )}
      {!isEditing && (
        <Pencil className="w-3 h-3 ml-1 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} />
      )}
    </button>
  );
}

// 可排序分类
function SortableCategory({
  category,
  isSelected,
  onClick,
  onEdit,
}: {
  category: WorkCategory;
  isSelected: boolean;
  onClick: () => void;
  onEdit: (name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `cat-${category.id}` });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} {...attributes} {...listeners}>
      <CategoryTag category={category} isSelected={isSelected} onClick={onClick} onEdit={onEdit} />
    </div>
  );
}

// 作品卡片组件 - 所有元素水平对齐
function WorkCard({
  work,
  onEdit,
  onDelete,
  onCoverUpload,
}: {
  work: Work;
  onEdit: () => void;
  onDelete: () => void;
  onCoverUpload: (file: File) => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-800 p-3 rounded-lg touch-none">
      <DragHandle id={work.id} />
      
      {/* 封面 - 固定宽度 */}
      <label className="flex-shrink-0 relative w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors overflow-hidden bg-white">
        {work.cover_image_url ? (
          <>
            <img src={work.cover_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <Upload className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">封面</span>
          </div>
        )}
        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onCoverUpload(f); }} className="hidden" />
      </label>

      {/* 标题和备注 - 自适应宽度 */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-base truncate">{work.title || '未命名'}</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {work.description || '暂无备注'}
          </p>
        </div>
      </div>

      {/* 按钮 - 固定宽度 */}
      <div className="flex-shrink-0 flex gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8"><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    </div>
  );
}

// 可排序作品
function SortableWork({
  work,
  onEdit,
  onDelete,
  onCoverUpload,
}: {
  work: Work;
  onEdit: () => void;
  onDelete: () => void;
  onCoverUpload: (file: File) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: work.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} {...attributes} {...listeners}>
      <WorkCard work={work} onEdit={onEdit} onDelete={onDelete} onCoverUpload={onCoverUpload} />
    </div>
  );
}

export default function WorksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [formData, setFormData] = useState({ title: '', subtitle: '', description: '' });
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [coverImageKey, setCoverImageKey] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/work-categories');
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        setCategories(data.data);
        // 默认选中第一个分类
        if (data.data.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(data.data[0].id);
        }
      }
    } catch (e) { console.error('加载分类失败:', e); }
  };

  const loadWorks = async () => {
    if (!selectedCategoryId) return;
    setIsLoading(true);
    try {
      const url = `/api/works?categoryId=${selectedCategoryId}`;
      const res = await fetch(url);
      const data = res.ok ? await res.json() : null;
      if (data?.success) {
        const worksWithCovers = await Promise.all(data.data.map(async (w: Work) => {
          let url = '';
          if (w.cover_image_key) {
            try {
              const r = await fetch('/api/file-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: w.cover_image_key }) });
              const d = await r.json();
              url = d.success ? d.data.url : '';
            } catch {}
          }
          return { ...w, cover_image_url: url };
        }));
        setWorks(worksWithCovers);
      }
    } catch (e) { console.error('加载作品失败:', e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedCategoryId) {
      loadWorks();
    } else {
      setWorks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  // 分类排序
  const handleCategoriesDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = categories.findIndex((c) => `cat-${c.id}` === active.id);
      const newIdx = categories.findIndex((c) => `cat-${c.id}` === over.id);
      const newCats = arrayMove(categories, oldIdx, newIdx).map((c, i) => ({ ...c, order_index: i }));
      setCategories(newCats);
      await fetch('/api/work-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: newCats.map((c) => ({ id: c.id, order_index: c.order_index })) }) });
    }
  };

  // 更新分类名称
  const handleUpdateCategory = async (id: number, name: string) => {
    await fetch('/api/work-categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name }) });
    setCategories(categories.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  // 添加分类
  const handleAddCategory = async () => {
    const res = await fetch('/api/work-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `新分类${categories.length + 1}` }) });
    const data = await res.json();
    if (data.success) {
      const newCat = data.data;
      setCategories(prev => [...prev, newCat]);
      // 自动选中新分类
      setSelectedCategoryId(newCat.id);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定要删除该分类吗？该分类下的所有作品也会被删除。')) return;
    await fetch(`/api/work-categories/${id}`, { method: 'DELETE' });
    const newCategories = categories.filter(c => c.id !== id);
    setCategories(newCategories);
    // 如果删除的是当前选中分类，选中第一个
    if (selectedCategoryId === id) {
      setSelectedCategoryId(newCategories.length > 0 ? newCategories[0].id : null);
    }
  };

  // 作品排序
  const handleWorksDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = works.findIndex((w) => w.id === active.id);
      const newIdx = works.findIndex((w) => w.id === over.id);
      const newWorks = arrayMove(works, oldIdx, newIdx).map((w, i) => ({ ...w, order: i }));
      setWorks(newWorks);
      await fetch('/api/works', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: newWorks.map((w) => ({ id: w.id, order: w.order })) }) });
    }
  };

  // 封面上传
  const handleCoverUpload = async (workId: number, file: File) => {
    const valid = validateFileSize(file);
    if (!valid.valid) { alert(valid.error); return; }
    setIsUploading(true);
    try {
      const result = await uploadWithProgress(file, 'work', () => {});
      if (result.success) {
        await fetch(`/api/works/${workId}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ cover_image_key: result.data.key }) 
        });
        loadWorks();
      }
    } finally { setIsUploading(false); }
  };

  // 对话框内封面上传
  const handleDialogCoverUpload = async (file: File) => {
    const valid = validateFileSize(file);
    if (!valid.valid) { alert(valid.error); return; }
    setIsUploading(true);
    try {
      const result = await uploadWithProgress(file, 'work', () => {});
      if (result.success) {
        setCoverImageKey(result.data.key);
        setCoverImageUrl(result.data.url);
      }
    } finally { setIsUploading(false); }
  };

  // 打开对话框
  const handleOpenDialog = (work?: Work) => {
    if (work) {
      setEditingWork(work);
      setFormData({ title: work.title || '', subtitle: work.subtitle || '', description: work.description || '' });
      setEditCategoryId(work.category_id || selectedCategoryId);
      setCoverImageKey(work.cover_image_key || '');
      setCoverImageUrl(work.cover_image_url || '');
    } else {
      setEditingWork(null);
      setFormData({ title: '', subtitle: '', description: '' });
      setEditCategoryId(selectedCategoryId);
      setCoverImageKey('');
      setCoverImageUrl('');
    }
    setDialogOpen(true);
  };

  // 保存
  const handleSave = async () => {
    if (!formData.title.trim()) { alert('请输入作品标题'); return; }
    try {
      const url = editingWork ? `/api/works/${editingWork.id}` : '/api/works';
      const method = editingWork ? 'PUT' : 'POST';
      const body: Record<string, unknown> = { 
        ...formData, 
        category_id: editCategoryId || selectedCategoryId, 
        order: editingWork ? editingWork.order : works.length 
      };
      if (coverImageKey) {
        body.cover_image_key = coverImageKey;
      }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { 
        setDialogOpen(false); 
        loadWorks(); 
      }
      else alert('保存失败：' + data.error);
    } catch { alert('保存失败'); }
  };

  // 删除
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除吗？')) return;
    const res = await fetch(`/api/works/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) loadWorks();
    else alert('删除失败');
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild><Link href="/admin/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
              <div>
                <h1 className="text-2xl font-bold">作品集</h1>
                <p className="text-sm text-muted-foreground">点击分类筛选，拖拽调整顺序</p>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />添加作品</Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoriesDragEnd}>
              <SortableContext items={categories.map((c) => `cat-${c.id}`)} strategy={horizontalListSortingStrategy}>
                <div className="flex items-center gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-1">
                      <SortableCategory 
                        category={cat} 
                        isSelected={selectedCategoryId === cat.id} 
                        onClick={() => setSelectedCategoryId(cat.id)} 
                        onEdit={(name) => handleUpdateCategory(cat.id, name)} 
                      />
                      {categories.length > 1 && (
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)} 
                          className="ml-1 p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="删除分类"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Button variant="outline" size="sm" onClick={handleAddCategory}><Plus className="h-4 w-4 mr-1" />添加分类</Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleWorksDragEnd}>
          <SortableContext items={works.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {works.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <p>该分类下还没有作品</p>
                    <p className="text-sm mt-2">点击右上角「添加作品」开始创建</p>
                  </CardContent>
                </Card>
              ) : (
                works.map((work) => (
                  <SortableWork 
                    key={work.id} 
                    work={work} 
                    onEdit={() => handleOpenDialog(work)} 
                    onDelete={() => handleDelete(work.id)} 
                    onCoverUpload={(f) => handleCoverUpload(work.id, f)} 
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-8 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm text-muted-foreground">
          <ul className="space-y-1">
            <li>• 点击分类标签筛选作品</li>
            <li>• 双击分类名称可编辑，双击拖拽手柄排序</li>
            <li>• 拖拽作品卡片可调整显示顺序</li>
            <li>• 点击封面可上传/替换</li>
            <li>• 图片建议尺寸：1920x1080</li>
            <li>• 图片最大：10MB | 视频最大：300MB | PPT/PDF最大：150MB</li>
          </ul>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingWork ? '编辑作品' : '添加作品'}</DialogTitle>
            <DialogDescription>填写作品信息，支持上传封面和设置分类</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 封面预览和上传 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">封面图片</label>
              <div className="flex items-center gap-4">
                <label className="relative w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors overflow-hidden bg-gray-50 dark:bg-slate-700">
                  {coverImageUrl ? (
                    <>
                      <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-xs mt-1">上传封面</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDialogCoverUpload(f); }} 
                    className="hidden" 
                    disabled={isUploading}
                  />
                </label>
                {coverImageUrl && (
                  <Button variant="outline" size="sm" onClick={() => { setCoverImageKey(''); setCoverImageUrl(''); }}>
                    移除封面
                  </Button>
                )}
                {isUploading && <span className="text-sm text-muted-foreground">上传中...</span>}
              </div>
            </div>

            {/* 分类选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">所属分类</label>
              <Select value={editCategoryId?.toString() || ''} onValueChange={(v) => setEditCategoryId(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">作品标题</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                placeholder="如：PPT第一版" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">副标题</label>
              <Input 
                value={formData.subtitle} 
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} 
                placeholder="如：PPT设计" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">备注说明</label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="请输入作品描述或备注" 
                className="min-h-[80px] resize-none" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={isUploading}>{isUploading ? '上传中...' : '保存'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
