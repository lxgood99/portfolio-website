'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Palette,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

// 预设颜色
const TEXT_COLORS = [
  { name: '默认', value: '' },
  { name: '黑色', value: '#000000' },
  { name: '灰色', value: '#6b7280' },
  { name: '红色', value: '#ef4444' },
  { name: '橙色', value: '#f97316' },
  { name: '黄色', value: '#eab308' },
  { name: '绿色', value: '#22c55e' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '紫色', value: '#8b5cf6' },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  className = '',
  minHeight = 120,
}: RichTextEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isInternalChange, setIsInternalChange] = useState(false);

  const editor = useEditor({
    immediatelyRender: false, // 避免 SSR hydration 不匹配
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      setIsInternalChange(true);
      onChange(editor.getHTML());
      // 重置标记
      setTimeout(() => setIsInternalChange(false), 0);
    },
    onFocus: () => {
      setShowToolbar(true);
    },
    onBlur: () => {
      // 延迟隐藏，让工具栏按钮点击有时间执行
      setTimeout(() => {
        setShowToolbar(false);
        setShowColorPicker(false);
      }, 200);
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor prose prose-sm max-w-none focus:outline-none px-3 py-2 text-sm leading-relaxed',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  // 同步外部value变化（解决多次编辑、反复保存问题）
  useEffect(() => {
    if (editor && !isInternalChange) {
      const currentValue = editor.getHTML();
      // 只有当外部value与编辑器内容不同时才更新
      if (value !== currentValue) {
        // 保留光标位置
        const { from, to } = editor.state.selection;
        editor.commands.setContent(value || '', { emitUpdate: false });
        // 尝试恢复光标位置
        try {
          editor.commands.setTextSelection({ from: Math.min(from, editor.state.doc.content.size), to: Math.min(to, editor.state.doc.content.size) });
        } catch {
          // 如果恢复失败，忽略
        }
      }
    }
  }, [value, editor, isInternalChange]);

  const setTextColor = useCallback((color: string) => {
    if (!editor) return;
    editor.chain().focus();
    if (color) {
      editor.chain().setColor(color).run();
    } else {
      editor.chain().unsetColor().run();
    }
    setShowColorPicker(false);
  }, [editor]);

  const clearFormat = useCallback(() => {
    if (!editor) return;
    // 先移除所有标记（加粗、斜体、下划线、颜色等）
    editor.chain()
      .focus()
      .unsetAllMarks()
      .unsetColor()
      .clearNodes()
      .run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-md overflow-hidden bg-white dark:bg-slate-900 ${className}`}>
      {/* 工具栏 */}
      <div 
        className={`transition-all duration-200 overflow-hidden ${
          showToolbar ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex items-center gap-0.5 p-1.5 border-b bg-slate-50 dark:bg-slate-800 flex-wrap">
          {/* 加粗 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-7 w-7 p-0 ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
            title="加粗"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>

          {/* 斜体 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-7 w-7 p-0 ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
            title="斜体"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>

          {/* 下划线 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`h-7 w-7 p-0 ${editor.isActive('underline') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
            title="下划线"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* 文字颜色 */}
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`h-7 px-2 ${showColorPicker ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
              title="文字颜色"
            >
              <Palette className="h-3.5 w-3.5" />
              <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
            </Button>
            
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border rounded-md shadow-lg z-50 min-w-[140px]">
                <div className="grid grid-cols-3 gap-1">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setTextColor(color.value)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
                    >
                      {color.value ? (
                        <span 
                          className="w-3 h-3 rounded-full border flex-shrink-0" 
                          style={{ backgroundColor: color.value }}
                        />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[8px] text-slate-400 flex-shrink-0">A</span>
                      )}
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* 无序列表 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-7 w-7 p-0 ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
            title="无序列表"
          >
            <List className="h-3.5 w-3.5" />
          </Button>

          {/* 有序列表 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-7 w-7 p-0 ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
            title="有序列表"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* 清除格式 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFormat}
            className="h-7 w-7 p-0"
            title="清除格式"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 编辑区域 */}
      <EditorContent editor={editor} />

      {/* 展开/收起工具栏提示 */}
      <div 
        className={`flex items-center justify-center bg-slate-50 dark:bg-slate-800 border-t cursor-pointer transition-all duration-200 ${
          showToolbar ? 'max-h-0 opacity-0 overflow-hidden py-0' : 'max-h-8 opacity-100 py-1'
        }`}
        onClick={() => {
          setShowToolbar(true);
          editor.commands.focus();
        }}
      >
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <ChevronUp className="h-3 w-3" />
          点击编辑显示格式工具栏
        </span>
      </div>
    </div>
  );
}

export default RichTextEditor;
