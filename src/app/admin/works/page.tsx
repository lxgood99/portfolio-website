'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Edit2, Trash2, GripVertical, Upload, Loader2, X, Save, 
  Plus, ChevronUp, ChevronDown, Check
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';

interface WorkItem {
  id: number;
  type: string;
  title: string;
  file_key: string;
  url?: string;
  summary?: string;
  order: number;
  category: string;
}

interface Work {
  id: number;
  title: string;
  description: string;
  category: string;
  order: number;
  items: WorkItem[];
}

interface Category {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
}

// ============ 作品卡片组件 ============
function WorkCard({ 
  work, 
  onEdit, 
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging 
}: { 
  work: Work; 
  onEdit: () => void; 
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const firstItem = work.items[0];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border transition-all",
        isDragging ? "border-blue-500 shadow-lg opacity-80" : "border-slate-200 dark:border-slate-700"
      )}
    >
      <GripVertical className="h-5 w-5 text-slate-400 cursor-grab flex-shrink-0" />
      <div className="w-16 h-12 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
        {firstItem?.url ? (
          <img src={firstItem.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-slate-400">
            {firstItem?.type === 'image' ? '图' : firstItem?.type === 'video' ? '视' : '文'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{work.title || '未命名'}</p>
        <p className="text-xs text-slate-500 truncate">{work.description || '无描述'}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
          <Edit2 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============ 分类卡片组件 ============
function CategoryCard({
  category,
  works,
  onUpload,
  onEditName,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onWorkEdit,
  onWorkDelete,
  onWorkReorder,
  draggingWork,
  setDraggingWork,
}: {
  category: Category;
  works: Work[];
  onUpload: (file: File) => void;
  onEditName: (name: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  onWorkEdit: (work: Work) => void;
  onWorkDelete: (work: Work) => void;
  onWorkReorder: (works: Work[]) => void;
  draggingWork: number | null;
  setDraggingWork: (id: number | null) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(category.display_name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  const handleSaveName = () => {
    if (nameValue.trim() && nameValue !== category.display_name) {
      onEditName(nameValue.trim());
    }
    setEditingName(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* 分类头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-slate-400" />
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                className="px-2 py-1 text-sm border rounded outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              />
              <button onClick={handleSaveName} className="text-green-500"><Check className="h-4 w-4" /></button>
              <button onClick={() => { setEditingName(false); setNameValue(category.display_name); }} className="text-slate-400"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <span className="font-medium text-slate-800 dark:text-white">{category.display_name}</span>
              <button onClick={() => setEditingName(true)} className="text-slate-400 hover:text-blue-500 ml-1"><Edit2 className="h-3 w-3" /></button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-30">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-30">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500 ml-2">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 上传区 */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.ppt,.pptx" onChange={handleFileSelect} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm">点击上传{category.display_name}作品</span>
        </button>
      </div>

      {/* 作品列表 */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {works.length === 0 ? (
          <p className="text-center text-slate-400 py-4 text-sm">暂无作品</p>
        ) : (
          <div className="space-y-2">
            {works.map(work => (
              <WorkCard
                key={work.id}
                work={work}
                onEdit={() => onWorkEdit(work)}
                onDelete={() => onWorkDelete(work)}
                onDragStart={() => setDraggingWork(work.id)}
                onDragOver={e => { e.preventDefault(); }}
                onDragEnd={() => {
                  if (draggingWork !== null && draggingWork !== work.id) {
                    const fromIdx = works.findIndex(w => w.id === draggingWork);
                    const toIdx = works.findIndex(w => w.id === work.id);
                    if (fromIdx !== -1 && toIdx !== -1) {
                      const newWorks = [...works];
                      const [removed] = newWorks.splice(fromIdx, 1);
                      newWorks.splice(toIdx, 0, removed);
                      onWorkReorder(newWorks);
                    }
                  }
                  setDraggingWork(null);
                }}
                isDragging={draggingWork === work.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ 编辑弹窗 ============
function EditModal({
  work,
  categories,
  onSave,
  onClose,
}: {
  work: Work;
  categories: Category[];
  onSave: (data: { title: string; description: string; category: string }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(work.title);
  const [description, setDescription] = useState(work.description);
  const [category, setCategory] = useState(work.items[0]?.category || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">编辑作品</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">标题</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} 
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">简介</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">分类</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600">
              {categories.map(c => (
                <option key={c.id} value={c.category_type}>{c.display_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">取消</button>
          <button onClick={() => onSave({ title, description, category })} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
        </div>
      </div>
    </div>
  );
}

// ============ 主组件 ============
export default function AdminWorksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [draggingWork, setDraggingWork] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, workRes] = await Promise.all([
        fetch('/api/work-categories'),
        fetch('/api/works'),
      ]);
      const catData = await catRes.json();
      const workData = await workRes.json();
      if (catData.success) setCategories(catData.data.sort((a: Category, b: Category) => a.sort_order - b.sort_order));
      if (workData.success) setAllWorks(workData.data);
    } catch (e) {
      console.error('加载失败', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  // 上传
  const handleUpload = async (file: File, categoryType: string) => {
    const maxSize = file.type.startsWith('image') ? 10 * 1024 * 1024 :
                    file.type.startsWith('video') ? 300 * 1024 * 1024 : 150 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`文件过大！${file.type.startsWith('image') ? '图片最大10MB' : file.type.startsWith('video') ? '视频最大300MB' : '文档最大150MB'}`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^.]+$/, ''));
      formData.append('category', categoryType);

      const res = await fetch('/api/works', { method: 'POST', body: formData });
      if (res.ok) {
        alert('上传成功！');
        loadData();
      } else {
        alert('上传失败');
      }
    } catch (e) {
      console.error('上传失败', e);
      alert('上传失败');
    }
  };

  // 编辑分类名称
  const handleEditCategory = async (cat: Category, name: string) => {
    try {
      await fetch(`/api/work-categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name }),
      });
      loadData();
    } catch (e) {
      console.error('更新失败', e);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`确定删除分类"${cat.display_name}"？该分类下的所有作品也会被删除。`)) return;
    try {
      await fetch(`/api/work-categories/${cat.id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error('删除失败', e);
    }
  };

  // 移动分类
  const handleMoveCategory = async (cat: Category, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === cat.id);
    const newCats = [...categories];
    if (direction === 'up' && idx > 0) {
      [newCats[idx - 1], newCats[idx]] = [newCats[idx], newCats[idx - 1]];
    } else if (direction === 'down' && idx < categories.length - 1) {
      [newCats[idx], newCats[idx + 1]] = [newCats[idx + 1], newCats[idx]];
    } else return;

    try {
      await fetch('/api/work-categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newCats.map((c, i) => ({ id: c.id, sort_order: i })) }),
      });
      loadData();
    } catch (e) {
      console.error('保存排序失败', e);
    }
  };

  // 新增分类
  const handleAddCategory = async () => {
    const name = prompt('输入新分类名称：');
    if (!name?.trim()) return;
    try {
      await fetch('/api/work-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_type: `cat_${Date.now()}`,
          display_name: name.trim(),
          sort_order: categories.length,
          is_visible: true,
        }),
      });
      loadData();
    } catch (e) {
      console.error('添加失败', e);
    }
  };

  // 删除作品
  const handleDeleteWork = async (work: Work) => {
    if (!confirm(`确定删除作品"${work.title}"？`)) return;
    try {
      await fetch(`/api/works/${work.id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error('删除失败', e);
    }
  };

  // 保存作品
  const handleSaveWork = async (data: { title: string; description: string; category: string }) => {
    if (!editingWork) return;
    try {
      await fetch(`/api/works/${editingWork.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setEditingWork(null);
      loadData();
    } catch (e) {
      console.error('保存失败', e);
    }
  };

  // 保存作品排序
  const handleSaveWorkOrder = async (catType: string, works: Work[]) => {
    try {
      await Promise.all(works.map((w, i) =>
        fetch(`/api/works/${w.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: i, category: catType }),
        })
      ));
    } catch (e) {
      console.error('保存排序失败', e);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">作品集管理</h1>
          <button onClick={handleAddCategory} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Plus className="h-4 w-4" /> 新增分类
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, idx) => {
              const catWorks = allWorks
                .filter(w => w.items.some(item => item.category === cat.category_type))
                .sort((a, b) => a.order - b.order);
              return (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  works={catWorks}
                  onUpload={file => handleUpload(file, cat.category_type)}
                  onEditName={name => handleEditCategory(cat, name)}
                  onDelete={() => handleDeleteCategory(cat)}
                  onMoveUp={() => handleMoveCategory(cat, 'up')}
                  onMoveDown={() => handleMoveCategory(cat, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === categories.length - 1}
                  onWorkEdit={setEditingWork}
                  onWorkDelete={handleDeleteWork}
                  onWorkReorder={works => handleSaveWorkOrder(cat.category_type, works)}
                  draggingWork={draggingWork}
                  setDraggingWork={setDraggingWork}
                />
              );
            })}
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-16 mb-8 px-6 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <p className="text-base font-medium text-slate-800 dark:text-white mb-3">使用说明</p>
            <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5">
              <li>拖拽作品卡片可调整显示顺序</li>
              <li>点击编辑按钮可修改作品标题、简介和分类</li>
              <li>图片建议尺寸：1920x1080</li>
              <li>图片最大：10MB | 视频最大：300MB | PPT/PDF最大：150MB</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingWork && (
        <EditModal
          work={editingWork}
          categories={categories}
          onSave={handleSaveWork}
          onClose={() => setEditingWork(null)}
        />
      )}
    </div>
  );
}
