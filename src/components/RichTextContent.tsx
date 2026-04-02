'use client';

interface RichTextContentProps {
  html: string;
  className?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

/**
 * 富文本内容展示组件
 * 用于在前端安全渲染富文本编辑器生成的内容
 */
export function RichTextContent({ html, className = '', textAlign = 'left' }: RichTextContentProps) {
  if (!html) return null;

  return (
    <div 
      className={`rich-text-content ${className}`}
      style={{ textAlign }}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

/**
 * 简单的HTML清理函数，确保只保留安全的标签
 */
function sanitizeHtml(html: string): string {
  // 允许的标签
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'ul', 'ol', 'li'];
  
  // 创建一个临时div来解析HTML
  if (typeof document === 'undefined') {
    return html; // SSR时直接返回
  }
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // 递归清理节点
  function cleanNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      if (!allowedTags.includes(tagName)) {
        // 不允许的标签，保留其内容
        while (element.firstChild) {
          element.parentNode?.insertBefore(element.firstChild, element);
        }
        element.parentNode?.removeChild(element);
        return;
      }
      
      // 清理属性，只保留style
      const attributes = Array.from(element.attributes);
      attributes.forEach(attr => {
        if (attr.name !== 'style') {
          element.removeAttribute(attr.name);
        }
      });
      
      // 清理子节点
      Array.from(element.childNodes).forEach(cleanNode);
    }
  }
  
  Array.from(tempDiv.childNodes).forEach(cleanNode);
  
  return tempDiv.innerHTML;
}

export default RichTextContent;
