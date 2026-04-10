'use client';

import { useState, useEffect, useRef } from 'react';
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
  Info,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';

// ============ 类型定义 ============
interface Category {
  id: number;
  category_type: string;
  display_name: string;
  sort_order: number;
  is_visible: boolean;
}

interface WorkItem {
  id?: number;
  tempId?: number;
  type: string;
  title: string;
  file_key?: string;
  url?: string;
  summary: string;
  order: number;
}

interface Work {
  id?: number;
  tempId?: number;
  title: string;
  description: string;
  category: string;
  cover_key?: string;
  cover_url?: string;
  order: number;
  items: WorkItem[];
}

// ============ 分类管理组件 ============
function CategoryManager({ 
  categories, 
  onUpdate 
}: { 
  categories: Category[]; 
  onUpdate: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.display_name);
  };

  const handleSave = async (cat: Category) => {
    if (!editName.trim()) return;
    
    try {
      const res = await fetch(`/api/work-categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: editName.trim() }),
      });
      
      if (res.ok) {
        setEditingId(null);
        onUpdate();
      }
    } catch (e) {
      console.error('保存失败', e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此分类？')) return;
    
    try {
      await fetch(`/api/work-categories/${id}`, { method: 'DELETE' });
      onUpdate();
    } catch (e) {
      console.error('删除失败', e);
    }
  };

  const handleAdd = async () => {
    const name = prompt('输入新分类名称：');
    if (!name?.trim()) return;
    
    try {
      await fetch('/api/work-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_type: `category_${Date.now()}`,
          display_name: name.trim(),
          sort_order: categories.length,
          is_visible: true,
        }),
      });
      onUpdate();
    } catch (e) {
      console.error('添加失败', e);
    }
  };

  return (
    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">分类管理</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded-lg px-2 py-1">
            {editingId === cat.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="px-2 py-1 text-sm border rounded outline-none"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSave(cat)}
                />
                <button onClick={() => handleSave(cat)} className="text-green-500 hover:text-green-600">
                  <Save className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-slate-700 dark:text-slate-300">{cat.display_name}</span>
                <button onClick={() => handleEdit(cat)} className="text-blue-500 hover:text-blue-600 ml-1">
                  <Edit2 className="h-3 w-3" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))}
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1 px-2 py-1 text-sm text-blue-500 hover:text-blue-600 border border-dashed border-blue-300 rounded-lg"
        >
          <Plus className="h-3 w-3" /> 新增分类
        </button>
      </div>
    </div>
  );
}

// ============ 拖拽排序组件 ============
function SortableItem({ 
  work, 
  onEdit, 
  onDelete, 
  isDragging 
}: { 
  work: Work; 
  onEdit: () => void; 
  onDelete: () => void;
  isDragging?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={ref}
      className={cn(
        "flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border transition-all",
        isDragging ? "border-blue-500 shadow-lg opacity-90" : "border-slate-200 dark:border-slate-700"
      )}
    >
      <GripVertical className="h-5 w-5 text-slate-400 cursor-grab flex-shrink-0" />
      <div className="w-16 h-12 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
        {work.cover_url ? (
          <img src={work.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-6 w-6 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 dark:text-white truncate">{work.title || '未命名'}</p>
        <p className="text-xs text-slate-500 truncate">{work.description || '无描述'}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button 
          onClick={onEdit}
          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============ 主组件 ============
export default function AdminWorksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // 编辑相关
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  
  // 上传相关
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTitle, setUploadTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, workRes] = await Promise.all([
        fetch('/api/work-categories'),
        fetch('/api/works'),
      ]);
      
      const catData = await catRes.json();
      const workData = await workRes.json();
      
      if (catData.success) {
        setCategories(catData.data.sort((a: Category, b: Category) => a.sort_order - b.sort_order));
      }
      
      if (workData.success) {
        const sorted = workData.data.sort((a: Work, b: Work) => a.order - b.order);
        setWorks(sorted);
      }
    } catch (e) {
      console.error('加载失败', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // 上传文件
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 文件大小限制
    const maxSize = file.type.startsWith('image') ? 10 * 1024 * 1024 :
                     file.type.startsWith('video') ? 300 * 1024 * 1024 : 150 * 1024 * 1024;
    
    if (file.size > maxSize) {
      alert(`文件过大！${file.type.startsWith('image') ? '图片最大10MB' : file.type.startsWith('video') ? '视频最大300MB' : '文档最大150MB'}`);
      return;
    }

    const title = prompt('请输入作品标题：', file.name.split('.')[0]);
    if (!title) return;

    const category = prompt('请选择分类（输入分类ID）：\n' + categories.map(c => `${c.id}: ${c.display_name}`).join('\n'));
    if (!category) return;

    setUploading(true);
    setUploadTitle(title);
    setUploadProgress(0);

    try {
      // 模拟进度
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 10, 90));
      }, 200);

      // 上传文件
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', category);

      const res = await fetch('/api/works', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.ok) {
        alert('上传成功！');
        loadData();
      } else {
        alert('上传失败');
      }
    } catch (e) {
      console.error('上传失败', e);
      alert('上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 删除作品
  const handleDelete = async (work: Work) => {
    if (!confirm(`确定删除作品"${work.title}"吗？`)) return;
    
    try {
      const res = await fetch(`/api/works/${work.id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        alert('删除失败');
      }
    } catch (e) {
      console.error('删除失败', e);
      alert('删除失败');
    }
  };

  // 编辑作品
  const handleEdit = (work: Work) => {
    setEditingWork({ ...work });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingWork) return;
    
    try {
      const res = await fetch(`/api/works/${editingWork.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingWork.title,
          description: editingWork.description,
          category: editingWork.category,
        }),
      });
      
      if (res.ok) {
        setShowEditModal(false);
        setEditingWork(null);
        loadData();
      } else {
        alert('保存失败');
      }
    } catch (e) {
      console.error('保存失败', e);
      alert('保存失败');
    }
  };

  // 拖拽排序
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newWorks = [...works];
    const dragged = newWorks[draggedIndex];
    newWorks.splice(draggedIndex, 1);
    newWorks.splice(index, 0, dragged);
    setWorks(newWorks);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    // 保存排序
    try {
      await Promise.all(works.map((work, index) => 
        fetch(`/api/works/${work.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: index }),
        })
      ));
    } catch (e) {
      console.error('保存排序失败', e);
    }
    
    setDraggedIndex(null);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">作品集管理</h1>

        {/* 分类管理 */}
        <CategoryManager categories={categories} onUpdate={loadData} />

        {/* 上传区域 */}
        <div className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-slate-400 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 mb-3">点击选择文件上传</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.ppt,.pptx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {uploading ? '上传中...' : '选择文件'}
            </button>
            
            {uploading && (
              <div className="w-full max-w-xs mt-4">
                <div className="flex justify-between text-sm text-slate-500 mb-1">
                  <span>{uploadTitle}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 作品列表 */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-3">
            作品列表（{works.length}个）
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              暂无作品，点击上方按钮上传
            </div>
          ) : (
            <div className="space-y-2">
              {works.map((work, index) => (
                <div
                  key={work.id || work.tempId}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <SortableItem
                    work={work}
                    onEdit={() => handleEdit(work)}
                    onDelete={() => handleDelete(work)}
                    isDragging={draggedIndex === index}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex gap-2 text-blue-700 dark:text-blue-400">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p><strong>使用说明：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>拖拽作品卡片可调整显示顺序</li>
                <li>点击编辑按钮可修改作品标题、简介和分类</li>
                <li>图片建议尺寸：1920x1080</li>
                <li>图片最大：10MB | 视频最大：300MB | PPT/PDF最大：150MB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEditModal && editingWork && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">编辑作品</h3>
              <button onClick={() => setShowEditModal(false)}>
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">标题</label>
                <input
                  type="text"
                  value={editingWork.title}
                  onChange={e => setEditingWork({ ...editingWork, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">简介</label>
                <textarea
                  value={editingWork.description}
                  onChange={e => setEditingWork({ ...editingWork, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">分类</label>
                <select
                  value={editingWork.category}
                  onChange={e => setEditingWork({ ...editingWork, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.category_type}>
                      {cat.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
