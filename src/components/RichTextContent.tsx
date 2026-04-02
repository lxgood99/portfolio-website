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
  if (!html || html.trim() === '') return null;

  return (
    <div 
      className={`rich-text-content ${className}`}
      style={{ textAlign }}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

/**
 * HTML清理函数，确保只保留安全的标签和样式
 */
function sanitizeHtml(html: string): string {
  // 允许的标签
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'ul', 'ol', 'li'];
  
  // 允许的style属性
  const allowedStylePattern = /^(color\s*:\s*#[0-9a-fA-F]{3,6}|text-decoration\s*:\s*underline)\s*;?\s*$/;
  
  // 处理空段落 - Tiptap空段落会生成<p></p>
  let processedHtml = html;
  
  // 客户端清理
  if (typeof document !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedHtml;
    
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
          if (attr.name === 'style') {
            // 验证style内容
            const styleValue = attr.value.trim();
            if (!allowedStylePattern.test(styleValue)) {
              // 只保留color样式
              const colorMatch = styleValue.match(/color\s*:\s*(#[0-9a-fA-F]{3,6})/);
              if (colorMatch) {
                element.setAttribute('style', `color: ${colorMatch[1]}`);
              } else {
                element.removeAttribute('style');
              }
            }
          } else {
            element.removeAttribute(attr.name);
          }
        });
        
        // 清理子节点
        Array.from(element.childNodes).forEach(cleanNode);
      }
    }
    
    Array.from(tempDiv.childNodes).forEach(cleanNode);
    processedHtml = tempDiv.innerHTML;
  }
  
  return processedHtml;
}

export default RichTextContent;
