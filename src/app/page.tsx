'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PDFViewer } from '@/components/PDFViewer';
import { RichTextContent } from '@/components/RichTextContent';
import { GanttChartDisplay } from '@/components/gantt/GanttChartDisplay';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter, 
  Instagram,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  Image as ImageIcon,
  Video,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  User,
  Wrench,
  FolderOpen,
  Download,
  Presentation,
  Star,
  Bot,
  Code2,
  Play,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface Profile {
  name: string;
  title: string;
  bio: string;
  avatar_key: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  social_links: Record<string, string>;
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  show_github: boolean;
  show_linkedin: boolean;
  show_twitter: boolean;
  show_instagram: boolean;
  custom_title: string;
  custom_content: string;
  show_custom: boolean;
  timeline_title: string;
}

interface SelfIntroduction {
  content: string;
  is_visible: boolean;
}

interface WorkExperienceImage {
  id: number;
  file_key: string;
  title: string;
  url?: string;
  order: number;
}

interface WorkExperience {
  id: number;
  company: string;
  position: string;
  description: string;
  description_align?: string;
  start_date: string;
  end_date: string;
  location: string;
  image_display_mode?: string;
  work_experience_images?: WorkExperienceImage[];
}

interface Education {
  id: number;
  school: string;
  degree: string;
  field: string;
  description: string;
  description_align?: string;
  start_date: string;
  end_date: string;
  awards?: string;
  gpa?: string;
  ranking?: string;
}

interface Skill {
  id: number;
  name: string;
  level: number;
  category: string | null;
  description: string | null;
}

interface WorkItem {
  id: number;
  type: string;
  title: string;
  file_key: string;
  url?: string;
  is_carousel_item?: boolean;
}

interface Work {
  id: number;
  title: string;
  description: string;
  description_align?: string;
  category?: { id: number; name: string; order_index: number } | string;
  category_id?: number;
  order: number;
  tags: string[];
  display_mode?: string;
  cover_image_key?: string;
  coverImageUrl?: string;
  work_items: WorkItem[];
  carouselItems?: WorkItem[];
}

interface WorkCategory {
  id: number;
  name: string;
  order_index: number;
}

interface ModuleOrder {
  module_name: string;
  order: number;
  is_visible: boolean;
}

interface ContactInfo {
  email: string;
  phone: string;
  wechat_qr_key: string;
  wechat_id: string;
  is_visible: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_wechat: boolean;
  wechatQrUrl?: string;
}

// 辅助函数：获取类别名称
function getCategoryName(category: Work['category']): string {
  if (typeof category === 'object' && category !== null) {
    return category.name || '';
  }
  return category || '';
}

interface TimelineBreak {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

interface TimelineItem {
  id: number;
  name: string;
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  color: string;
  breaks: TimelineBreak[];
  order: number;
  created_at: string;
  updated_at: string;
}

// 图片轮播组件
function ImageCarousel({ images }: { images: WorkExperienceImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="relative mt-4 overflow-hidden rounded-lg"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, index) => (
          <div key={index} className="flex-shrink-0 w-full">
            <img
              src={img.url}
              alt={img.title || `图片 ${index + 1}`}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// 横排图片展示
function ImageGrid({ images }: { images: WorkExperienceImage[] }) {
  if (!images || images.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
      {images.map((img, index) => (
        <img
          key={index}
          src={img.url}
          alt={img.title || `图片 ${index + 1}`}
          className="w-full h-24 md:h-32 object-cover rounded-lg"
          loading="lazy"
        />
      ))}
    </div>
  );
}

// 作品集轮播组件
function WorkCarousel({ images, onImageClick }: { images: WorkItem[]; onImageClick: (item: WorkItem) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.touches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
      touchStartX.current = e.touches[0].clientX;
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div 
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((item, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 w-full h-full cursor-pointer relative group"
            onClick={() => onImageClick(item)}
          >
            <img
              src={item.url}
              alt={item.title || `图片 ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* 底部渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selfIntroduction, setSelfIntroduction] = useState<SelfIntroduction | null>(null);
  const [selfIntroCards, setSelfIntroCards] = useState<Array<{ id: number; title: string; content: string }>>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillCategories, setSkillCategories] = useState<Array<{ id: number; name: string; is_visible: boolean }>>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [moduleOrders, setModuleOrders] = useState<ModuleOrder[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [previewItem, setPreviewItem] = useState<(WorkItem & { allImages?: WorkItem[]; workId?: number; index?: number }) | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeSkillCategory, setActiveSkillCategory] = useState<string>('办公软件');

  // 生成设备指纹（基于浏览器特性，不涉及隐私）
  const generateDeviceFingerprint = (): string => {
    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || '',
        navigator.platform || '',
        // 使用 canvas 指纹增强唯一性
        (() => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.textBaseline = 'top';
              ctx.font = '14px Arial';
              ctx.fillStyle = '#f60';
              ctx.fillRect(125, 1, 62, 20);
              ctx.fillStyle = '#069';
              ctx.fillText('fingerprint', 2, 15);
              return canvas.toDataURL().slice(-50);
            }
          } catch {
            return '';
          }
          return '';
        })(),
      ];
      
      // 简单哈希函数
      const str = components.join('|');
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'device_' + Math.abs(hash).toString(36);
    } catch {
      // 降级方案：使用随机ID存储在localStorage
      let storedId = localStorage.getItem('device_id');
      if (!storedId) {
        storedId = 'device_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
        localStorage.setItem('device_id', storedId);
      }
      return storedId;
    }
  };

  // 记录访问（使用设备指纹）
  const recordVisit = async () => {
    try {
      const deviceId = generateDeviceFingerprint();
      await fetch('/api/visit-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
    } catch {
      // 静默失败
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadData 在组件生命周期内不会变化

  const loadData = async () => {
    try {
      // 记录访问统计（使用设备指纹去重）
      recordVisit().catch(() => {});

      const [profileRes, selfIntroRes, selfIntroCardsRes, expRes, eduRes, skillsRes, skillCategoriesRes, worksRes, moduleOrdersRes, contactRes, timelineRes, workCategoriesRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/self-introduction'),
        fetch('/api/self-intro-cards'),
        fetch('/api/work-experiences'),
        fetch('/api/educations'),
        fetch('/api/skills'),
        fetch('/api/skill-categories'),
        fetch('/api/works'),
        fetch('/api/module-orders'),
        fetch('/api/contact-info'),
        fetch('/api/timeline-items'),
        fetch('/api/work-categories'),
      ]);

      const profileData = profileRes.ok ? await profileRes.json() : null;
      const selfIntroData = selfIntroRes.ok ? await selfIntroRes.json() : null;
      const expData = expRes.ok ? await expRes.json() : null;
      const eduData = eduRes.ok ? await eduRes.json() : null;
      const skillsData = skillsRes.ok ? await skillsRes.json() : null;
      const skillCategoriesData = skillCategoriesRes.ok ? await skillCategoriesRes.json() : null;
      const workCategoriesData = workCategoriesRes.ok ? await workCategoriesRes.json() : null;
      const worksData = worksRes.ok ? await worksRes.json() : null;
      const moduleOrdersData = moduleOrdersRes.ok ? await moduleOrdersRes.json() : null;

      if (profileData.success && profileData.data) {
        // 确保显示开关字段有默认值
        const profileWithDefaults = {
          ...profileData.data,
          show_email: profileData.data.show_email ?? true,
          show_phone: profileData.data.show_phone ?? true,
          show_location: profileData.data.show_location ?? true,
          show_github: profileData.data.show_github ?? false,
          show_linkedin: profileData.data.show_linkedin ?? false,
          show_twitter: profileData.data.show_twitter ?? false,
          show_instagram: profileData.data.show_instagram ?? false,
          custom_title: profileData.data.custom_title ?? '',
          custom_content: profileData.data.custom_content ?? '',
          show_custom: profileData.data.show_custom ?? false,
        };
        setProfile(profileWithDefaults);
        if (profileData.data.avatar_key) {
          loadAvatarUrl(profileData.data.avatar_key);
        }
      }

      if (selfIntroData.success && selfIntroData.data) {
        setSelfIntroduction(selfIntroData.data);
      }

      if (selfIntroCardsRes.ok) {
        const cardsData = await selfIntroCardsRes.json();
        if (cardsData.success) {
          setSelfIntroCards(cardsData.data);
        }
      }

      if (expData.success) {
        // 加载工作经历图片URL
        const expWithUrls = await Promise.all(
          expData.data.map(async (exp: WorkExperience) => {
            if (exp.work_experience_images && exp.work_experience_images.length > 0) {
              const imagesWithUrls = await Promise.all(
                exp.work_experience_images.map(async (img) => {
                  try {
                    const res = await fetch('/api/file-url', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: img.file_key }),
                    });
                    const data = await res.json();
                    return { ...img, url: data.success ? data.data.url : '' };
                  } catch {
                    return img;
                  }
                })
              );
              return { ...exp, work_experience_images: imagesWithUrls };
            }
            return exp;
          })
        );
        setWorkExperiences(expWithUrls);
      }

      if (eduData.success) setEducations(eduData.data);
      if (skillsData.success) setSkills(skillsData.data);
      if (skillCategoriesData.success) {
        const visibleCategories = skillCategoriesData.data.filter((c: { is_visible: boolean }) => c.is_visible);
        setSkillCategories(visibleCategories);
        // 自动选中第一个有技能的分类（排除"其他"）
        const firstCategory = visibleCategories.find((c: { name: string }) => c.name !== '其他');
        if (firstCategory) {
          setActiveSkillCategory(firstCategory.name);
        }
      }
      
      if (worksData.success && worksData.data) {
        const worksWithUrls = await loadWorkItemsUrls(worksData.data);
        
        // 按分类顺序 + 作品 order 排序
        let sortedWorks = worksWithUrls;
        if (workCategoriesData?.success && workCategoriesData.data) {
          const categoryOrder = new Map((workCategoriesData.data as WorkCategory[]).map((c, i) => [c.id, i]));
          sortedWorks = worksWithUrls.sort((a, b) => {
            const orderA = categoryOrder.get(a.category_id ?? 0) ?? 999;
            const orderB = categoryOrder.get(b.category_id ?? 0) ?? 999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.order || 0) - (b.order || 0);
          });
        } else {
          sortedWorks = worksWithUrls.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        setWorks(sortedWorks);
        
        // 使用分类 API 的数据来设置分类列表（保证顺序）
        if (workCategoriesData?.success && workCategoriesData.data) {
          // 按 order_index 排序分类
          const sortedCategories = (workCategoriesData.data as WorkCategory[]).sort((a, b) => a.order_index - b.order_index);
          setCategories(['all', ...sortedCategories.map(c => c.name)]);
        } else {
          // 降级：从作品数据中提取分类
          const cats = new Set<string>();
          worksWithUrls.forEach(w => {
            if (typeof w.category === 'object' && w.category?.name) cats.add(w.category.name);
            else if (typeof w.category === 'string') cats.add(w.category);
          });
          setCategories(['all', ...Array.from(cats)]);
        }
      }

      if (moduleOrdersData.success) {
        setModuleOrders(moduleOrdersData.data);
      }

      const contactData = await contactRes.json();
      if (contactData.success && contactData.data) {
        // 加载微信二维码URL
        if (contactData.data.wechat_qr_key) {
          try {
            const qrRes = await fetch('/api/file-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: contactData.data.wechat_qr_key }),
            });
            const qrData = await qrRes.json();
            if (qrData.success) {
              contactData.data.wechatQrUrl = qrData.data.url;
            }
          } catch {}
        }
        setContactInfo(contactData.data);
      }

      // 加载时间线数据
      const timelineData = await timelineRes.json();
      if (timelineData.success && timelineData.data) {
        setTimelineItems(timelineData.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkItemsUrls = async (worksList: Work[]): Promise<Work[]> => {
    const updatedWorks = await Promise.all(
      worksList.map(async (work) => {
        let coverImageUrl = '';
        if (work.cover_image_key) {
          try {
            const res = await fetch('/api/file-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: work.cover_image_key }),
            });
            const data = await res.json();
            if (data.success) {
              coverImageUrl = data.data.url;
            }
          } catch {}
        }

        if (!work.work_items || work.work_items.length === 0) {
          return { ...work, coverImageUrl };
        }

        const itemsWithUrls = await Promise.all(
          work.work_items.map(async (item) => {
            if (!item.file_key) return item;
            try {
              const res = await fetch('/api/file-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: item.file_key }),
              });
              const data = await res.json();
              if (data.success) return { ...item, url: data.data.url };
            } catch {}
            return item;
          })
        );

        const carouselItems = itemsWithUrls.filter(item => item.is_carousel_item);
        const regularItems = itemsWithUrls.filter(item => !item.is_carousel_item);

        if (!coverImageUrl) {
          const firstMediaItem = itemsWithUrls.find(
            (item) => (item.type === 'image' || item.type === 'video') && item.url && !item.is_carousel_item
          );
          coverImageUrl = firstMediaItem?.url || '';
        }

        return { ...work, work_items: regularItems, carouselItems, coverImageUrl };
      })
    );
    return updatedWorks;
  };

  const loadAvatarUrl = async (key: string) => {
    try {
      const res = await fetch('/api/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.success) setAvatarUrl(data.data.url);
    } catch {}
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // 根据模块排序渲染
  const renderModule = (moduleName: string) => {
    const moduleOrder = moduleOrders.find(m => m.module_name === moduleName);
    if (moduleOrder && !moduleOrder.is_visible) return null;

    // 标题图标映射
    const getTitleIcon = (title: string) => {
      const titleLower = title.toLowerCase();
      if (titleLower.includes('自我评价')) {
        return <User className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-slate-500 shrink-0" />;
      }
      if (titleLower.includes('优势') || titleLower.includes('优点')) {
        return <Star className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-slate-500 shrink-0" />;
      }
      if (titleLower.includes('工具') || titleLower.includes('探索')) {
        return <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-slate-500 shrink-0" />;
      }
      if (titleLower.includes('网页') || titleLower.includes('网站')) {
        return <Code2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-slate-500 shrink-0" />;
      }
      return null;
    };

    switch (moduleName) {
      case 'self_introduction':
        return (selfIntroduction?.is_visible || selfIntroCards.length > 0) ? (
          <section key={moduleName} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <User className="h-6 w-6" />
              关于我
            </h2>
            <Card className="overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                {selfIntroCards.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {selfIntroCards.map((card) => (
                      <div 
                        key={card.id} 
                        className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 sm:p-5 transition-all duration-200"
                      >
                        {/* 小卡片标题 + 图标 */}
                        {card.title && (
                          <h3 className="font-semibold text-base sm:text-lg text-foreground mb-2 flex items-center gap-2">
                            {getTitleIcon(card.title)}
                            <span>{card.title}</span>
                          </h3>
                        )}
                        {/* 小卡片正文 - 支持富文本渲染 + 两端对齐 */}
                        <RichTextContent 
                          html={card.content} 
                          textAlign="justify"
                          className="text-sm sm:text-base text-muted-foreground [&>p]:leading-relaxed [&>p]:my-1 [&>strong]:font-semibold [&>em]:italic" 
                        />
                      </div>
                    ))}
                  </div>
                ) : selfIntroduction?.content ? (
                  <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-justify">
                    {selfIntroduction.content}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    暂无内容
                  </div>
                )}

                {/* 甘特图板块 */}
                {timelineItems.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span>{profile?.timeline_title || '成长规划'}</span>
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                      <GanttChartDisplay items={timelineItems} />
                    </div>
                    {/* 滑动提示文字 - 手机端显示 */}
                    <div className="mt-3 text-center text-sm text-muted-foreground/60 flex items-center justify-center gap-2 md:hidden">
                      <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span>可左右滑动观看</span>
                      <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        ) : null;

      case 'work_experiences':
        return workExperiences.length > 0 ? (
          <section key={moduleName} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              工作经历
            </h2>
            <div className="space-y-4">
              {workExperiences.map((exp) => (
                <Card key={exp.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <CardContent className="p-6 sm:p-6">
                    {/* ========== 手机端布局（分行展示） ========== */}
                    <div className="sm:hidden space-y-1">
                      {/* 第一行：公司全称（增大一号字体） */}
                      <div className="text-lg font-semibold text-foreground">
                        {exp.company}
                      </div>
                      {/* 第二行：职位名称（缩小、灰色） */}
                      <div className="text-sm text-muted-foreground">
                        {exp.position}
                      </div>
                      {/* 第三行：时间信息（左对齐、缩小、灰色） */}
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {exp.start_date} - {exp.end_date || '至今'}
                        {exp.location && ` · ${exp.location}`}
                      </div>
                    </div>
                    
                    {/* ========== 电脑端布局（三列对齐） ========== */}
                    <div className="hidden sm:grid sm:grid-cols-3 sm:items-center gap-4">
                      {/* 左侧：公司名称 */}
                      <span className="text-lg font-semibold text-primary text-left">
                        {exp.company}
                      </span>
                      {/* 中间：岗位名称（居中） */}
                      <span className="text-lg font-semibold text-center">
                        {exp.position}
                      </span>
                      {/* 右侧：时间 + 地点 */}
                      <span className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                        <Calendar className="h-4 w-4" />
                        {exp.start_date} - {exp.end_date || '至今'}
                        {exp.location && ` · ${exp.location}`}
                      </span>
                    </div>
                    {exp.description && (
                      <div className="mt-5 text-muted-foreground">
                        {exp.description.includes('<') && exp.description.includes('>') ? (
                          // 富文本内容 - 两端对齐
                          <RichTextContent html={exp.description} textAlign="justify" className="[&>p]:leading-relaxed" />
                        ) : (
                          // 普通文本，段落间距增加 + 两端对齐
                          <div className="space-y-2">
                            {exp.description.split('\n').map((line, idx) => (
                              <p key={idx} className="whitespace-pre-wrap text-justify leading-relaxed">
                                {line}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* 工作经历图片展示 */}
                    {exp.work_experience_images && exp.work_experience_images.length > 0 && (
                      exp.image_display_mode === 'carousel' ? (
                        <ImageCarousel images={exp.work_experience_images} />
                      ) : (
                        <ImageGrid images={exp.work_experience_images} />
                      )
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null;

      case 'educations':
        return educations.length > 0 ? (
          <section key={moduleName} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              教育背景
            </h2>
            <div className="space-y-4">
              {educations.map((edu) => (
                <Card key={edu.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <CardContent className="p-6 sm:p-6">
                    {/* ========== 手机端布局（分行展示） ========== */}
                    <div className="sm:hidden space-y-1">
                      {/* 第一行：学校全称（增大一号字体） */}
                      <div className="text-lg font-semibold text-foreground">
                        {edu.school}
                      </div>
                      {/* 第二行：学历 + 专业（缩小、灰色） */}
                      <div className="text-sm text-muted-foreground">
                        {edu.degree} | {edu.field}
                      </div>
                      {/* 第三行：时间信息（左对齐、缩小、灰色） */}
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {edu.start_date} - {edu.end_date || '至今'}
                      </div>
                      {/* 补充信息：每行一个，左对齐，缩小、灰色 */}
                      {edu.awards && (
                        <div className="text-sm text-muted-foreground mt-2">
                          🏆 {edu.awards}
                        </div>
                      )}
                      {edu.gpa && (
                        <div className="text-sm text-muted-foreground">
                          📊 GPA：{edu.gpa}
                        </div>
                      )}
                      {edu.ranking && (
                        <div className="text-sm text-muted-foreground">
                          🏅 专业排名：{edu.ranking}
                        </div>
                      )}
                    </div>
                    
                    {/* ========== 电脑端布局（三列对齐） ========== */}
                    <div className="hidden sm:block">
                      {/* 首行：学校 | 学位专业 | 时间 */}
                      <div className="grid grid-cols-3 items-center gap-4">
                        {/* 左侧：学校名称 */}
                        <span className="text-lg font-semibold text-primary text-left">
                          {edu.school}
                        </span>
                        {/* 中间：学位 · 专业（居中） */}
                        <span className="text-lg font-semibold text-center">
                          {edu.degree} · {edu.field}
                        </span>
                        {/* 右侧：时间 */}
                        <span className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                          <Calendar className="h-4 w-4" />
                          {edu.start_date} - {edu.end_date || '至今'}
                        </span>
                      </div>
                      {/* 第二行：奖学金/荣誉 | GPA | 专业排名 */}
                      {(edu.awards || edu.gpa || edu.ranking) && (
                        <div className="grid grid-cols-3 items-center gap-4 mt-5">
                          <span className="text-muted-foreground text-left">
                            {edu.awards}
                          </span>
                          <span className="text-muted-foreground text-center">
                            {edu.gpa && `GPA：${edu.gpa}`}
                          </span>
                          <span className="text-muted-foreground text-right">
                            {edu.ranking && `专业排名 ${edu.ranking}`}
                          </span>
                        </div>
                      )}
                    </div>
                    {edu.description && (
                      <>
                        {/* 教育描述 - 段落间距增加 + 两端对齐 */}
                        <div className="mt-5 text-muted-foreground space-y-2">
                          {edu.description.split('\n').map((line, idx) => (
                            <p key={idx} className="whitespace-pre-wrap text-justify leading-relaxed">
                              {line}
                            </p>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null;

      case 'skills':
        return skills.length > 0 ? (
          <section key={moduleName} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Wrench className="h-6 w-6" />
              技能特长
            </h2>
            {/* 单一大卡片 + 顶部标签页切换 */}
            <Card className="overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
              <CardContent className="p-0">
                {/* 顶部标签栏 + 图例 */}
                <div className="flex items-center border-b border-slate-200 dark:border-slate-700">
                  {/* 左侧标签 */}
                  <div className="flex overflow-x-auto scrollbar-hide flex-1">
                    {skillCategories.map((cat) => {
                      const catSkills = skills.filter(s => s.category === cat.name);
                      if (catSkills.length === 0) return null;
                      const isActive = activeSkillCategory === cat.name;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveSkillCategory(cat.name)}
                          className={`flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                            isActive
                              ? 'text-primary border-b-2 border-primary bg-slate-50 dark:bg-slate-700/50'
                              : 'text-muted-foreground hover:text-foreground hover:bg-slate-50/50 dark:hover:bg-slate-700/30'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                    {/* 未分类标签 - 只显示 category 为空/null 的技能 */}
                    {(() => {
                      const uncategorizedSkills = skills.filter(s => !s.category);
                      if (uncategorizedSkills.length === 0) return null;
                      const isActive = activeSkillCategory === '未分类';
                      return (
                        <button
                          onClick={() => setActiveSkillCategory('未分类')}
                          className={`flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                            isActive
                              ? 'text-primary border-b-2 border-primary bg-slate-50 dark:bg-slate-700/50'
                              : 'text-muted-foreground hover:text-foreground hover:bg-slate-50/50 dark:hover:bg-slate-700/30'
                          }`}
                        >
                          未分类
                        </button>
                      );
                    })()}
                  </div>
                  {/* 右侧图例 - 进度条样式 */}
                  <div className="hidden sm:flex flex-col items-center px-4 py-2 border-l border-slate-200 dark:border-slate-700">
                    {/* 进度条 + 两端数值 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 w-2.5 text-right">0</span>
                      <div className="relative w-28 h-1.5 bg-primary/20 rounded-full">
                        {/* 填充 */}
                        <div className="absolute inset-y-0 left-0 w-full bg-primary rounded-full"></div>
                        {/* 分段标记 - 平均分布 */}
                        <div className="absolute top-0 left-0 w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500"></div>
                        <div className="absolute top-0 left-1/3 w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500"></div>
                        <div className="absolute top-0 left-2/3 w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500"></div>
                        <div className="absolute top-0 right-0 w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500"></div>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 w-7">100%</span>
                    </div>
                    {/* 标签 - 与进度条对齐 */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="shrink-0 w-2.5"></span>
                      <div className="relative w-28 flex justify-between">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">入门</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">掌握</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">熟练</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">精通</span>
                      </div>
                      <span className="shrink-0 w-7"></span>
                    </div>
                  </div>
                </div>
                
                {/* 内容区域 */}
                <div className="p-4 sm:p-6">
                  {/* 手机端图例 - 进度条样式 */}
                  <div className="sm:hidden flex flex-col items-center mb-4">
                    {/* 进度条 + 两端数值 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 w-2.5 text-right">0</span>
                      <div className="relative w-44 h-1.5 bg-primary/20 rounded-full">
                        <div className="absolute inset-y-0 left-0 w-full bg-primary rounded-full"></div>
                        {/* 分段标记 - 平均分布 */}
                        <div className="absolute top-0 left-0 w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500"></div>
                        <div className="absolute top-0 left-1/3 w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500"></div>
                        <div className="absolute top-0 left-2/3 w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500"></div>
                        <div className="absolute top-0 right-0 w-0.5 h-1.5 bg-slate-400 dark:bg-slate-500"></div>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 w-7">100%</span>
                    </div>
                    {/* 标签 - 与进度条对齐 */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="shrink-0 w-2.5"></span>
                      <div className="relative w-44 flex justify-between">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">入门</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">掌握</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">熟练</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">精通</span>
                      </div>
                      <span className="shrink-0 w-7"></span>
                    </div>
                  </div>
                  {/* 当前分类的技能列表 */}
                  {(() => {
                    let currentSkills: Skill[] = [];
                    if (activeSkillCategory === '未分类') {
                      // 只显示 category 为空/null 的技能
                      currentSkills = skills.filter(s => !s.category);
                    } else {
                      currentSkills = skills.filter(s => s.category === activeSkillCategory);
                    }
                    
                    if (currentSkills.length === 0) {
                      return (
                        <div className="text-center text-muted-foreground py-8">
                          暂无技能数据
                        </div>
                      );
                    }
                    
                    return (
                      <div className="flex flex-col gap-3">
                        {currentSkills.map((skill) => (
                          <div 
                            key={skill.id} 
                            className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:bg-slate-100 dark:hover:bg-slate-700/70 cursor-default"
                          >
                            {/* 技能名称 + 百分比 */}
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm sm:text-base">{skill.name}</h4>
                              <span className="text-xs sm:text-sm text-muted-foreground ml-2 shrink-0">{skill.level}%</span>
                            </div>
                            {/* 进度条 */}
                            <Progress value={skill.level} className="h-1.5 mb-2" />
                            {/* 补充说明（可选） */}
                            {skill.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {skill.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null;

      case 'works':
        return works.length > 0 ? (
          <section key={moduleName} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FolderOpen className="h-6 w-6" />
              作品集
            </h2>
            
            {/* 分类标签切换 - 带动画 */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
                    }`}
                  >
                    {cat === 'all' ? '全部' : cat}
                  </button>
                ))}
              </div>
            )}
            
            {/* 横向滚动卡片列表 - 统一布局 */}
            <div className="relative">
              {/* 横向滚动容器 - 支持触摸滑动和鼠标拖动 */}
              <div 
                className="overflow-x-auto scrollbar-thin snap-x snap-mandatory pb-4 -mx-4 px-4 cursor-grab active:cursor-grabbing"
                data-works-container
                style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                }}
                onMouseDown={(e) => {
                  const container = e.currentTarget;
                  container.style.cursor = 'grabbing';
                  container.style.userSelect = 'none';
                }}
                onMouseUp={(e) => {
                  const container = e.currentTarget;
                  container.style.cursor = 'grab';
                  container.style.userSelect = '';
                }}
                onMouseLeave={(e) => {
                  const container = e.currentTarget;
                  container.style.cursor = 'grab';
                  container.style.userSelect = '';
                }}
              >
                <div className="flex gap-4" style={{ width: 'max-content' }}>
                  {/* 填充左侧距离 */}
                  <div className="shrink-0 w-1" />
                  
                  {(selectedCategory === 'all' ? works : works.filter(w => getCategoryName(w.category) === selectedCategory)).map((work) => {
                    // 从 cover_image_key 检测文件类型
                    const getFileTypeFromKey = (key: string | undefined | null): string => {
                      if (!key) return 'image';
                      const ext = key.split('.').pop()?.toLowerCase() || '';
                      if (ext === 'pdf') return 'pdf';
                      if (['ppt', 'pptx'].includes(ext)) return 'ppt';
                      if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
                      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
                      return 'other';
                    };
                    
                    // 判断封面图的文件类型
                    const coverFileType = getFileTypeFromKey(work.cover_image_key);
                    
                    // 判断作品是否有上传的文件（PDF/视频/其他非图片文件）
                    const hasUploadedFiles = work.work_items?.some(item => 
                      ['pdf', 'ppt', 'video', 'other'].includes(item.type)
                    ) || ['pdf', 'ppt', 'video'].includes(coverFileType);
                    
                    // 获取作品的所有文件，用于预览导航
                    const allImages = work.display_mode === 'carousel' 
                      ? (work.carouselItems || [])
                      : (work.work_items?.filter(item => item.type === 'image' && item.url) || []);
                    
                    // 确定点击标题时打开哪个文件
                    const getPreviewItem = () => {
                      // 优先：封面文件本身是非图片类型（PDF/PPT/视频）
                      if (['pdf', 'ppt', 'video'].includes(coverFileType)) {
                        return { 
                          id: work.id, 
                          type: coverFileType, 
                          title: work.title, 
                          file_key: work.cover_image_key,
                          url: work.coverImageUrl,
                          workId: work.id, 
                          allImages: [],
                          index: 0
                        };
                      }
                      
                      // 其次：work_items 中的文件
                      if (work.work_items && work.work_items.length > 0) {
                        // 优先视频
                        const videoItem = work.work_items.find(item => item.type === 'video' && item.url);
                        if (videoItem) return { ...videoItem, workId: work.id, allImages };
                        
                        // 然后是 PDF/PPT
                        const docItem = work.work_items.find(item => ['pdf', 'ppt'].includes(item.type) && item.url);
                        if (docItem) return { ...docItem, workId: work.id, allImages };
                        
                        // 然后是其他文件
                        const otherItem = work.work_items.find(item => ['other'].includes(item.type) && item.url);
                        if (otherItem) return { ...otherItem, workId: work.id, allImages };
                        
                        // 最后是轮播图片或封面图片
                        if (work.display_mode === 'carousel' && work.carouselItems && work.carouselItems.length > 0) {
                          return { ...work.carouselItems[0], workId: work.id, allImages: work.carouselItems, index: 0 };
                        }
                        
                        // 图片
                        const imageItem = work.work_items.find(item => item.type === 'image' && item.url);
                        if (imageItem) return { ...imageItem, workId: work.id, allImages };
                      }
                      
                      // 然后：轮播图片
                      if (work.display_mode === 'carousel' && work.carouselItems && work.carouselItems.length > 0) {
                        return { ...work.carouselItems[0], workId: work.id, allImages: work.carouselItems, index: 0 };
                      }
                      
                      // 最后：封面图片
                      if (work.cover_image_key && work.coverImageUrl) {
                        return { 
                          id: work.id, 
                          type: 'image', 
                          title: work.title, 
                          file_key: work.cover_image_key,
                          url: work.coverImageUrl,
                          workId: work.id, 
                          allImages: [],
                          index: 0
                        };
                      }
                      
                      return null;
                    };
                    
                    const previewItem = getPreviewItem();
                    
                    // 点击标题打开预览
                    const handleTitleClick = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (previewItem) {
                        setPreviewImageIndex(0);
                        setPreviewItem(previewItem as any);
                      }
                    };
                    
                    return (
                    <Card 
                      key={work.id} 
                      className="overflow-hidden hover:shadow-xl transition-all duration-300 group snap-start shrink-0 bg-white dark:bg-slate-800 cursor-pointer"
                      style={{ width: 'calc(33.333% - 12px)', minWidth: '280px', maxWidth: '360px' }}
                      onClick={hasUploadedFiles ? undefined : handleTitleClick}
                    >
                      {/* 封面图 - 根据是否有文件决定是否可点击 */}
                      {work.display_mode === 'carousel' && work.carouselItems && work.carouselItems.length > 0 ? (
                        <div 
                          className={`relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden ${hasUploadedFiles ? '' : 'cursor-pointer'}`}
                          onClick={hasUploadedFiles ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
                        >
                          <img 
                            src={work.carouselItems[0].url} 
                            alt={work.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {work.carouselItems.length > 1 && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
                              +{work.carouselItems.length - 1}
                            </div>
                          )}
                          {/* 有上传文件时显示遮罩提示 */}
                          {hasUploadedFiles && (
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-colors">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                                点击下方标题打开文件
                              </div>
                            </div>
                          )}
                        </div>
                      ) : work.coverImageUrl ? (
                        <div 
                          className={`relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden ${hasUploadedFiles ? '' : 'cursor-pointer'}`}
                          onClick={hasUploadedFiles ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
                        >
                          {/* 视频作品：显示封面图片 + 播放图标 */}
                          {(coverFileType === 'video' || work.work_items?.find(item => item.type === 'video' && item.url)) ? (
                            <>
                              <img src={work.coverImageUrl} alt={work.title} className="w-full h-full object-cover" loading="lazy" />
                              {/* 播放图标遮罩 */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                                <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                                  <Play className="h-7 w-7 text-white ml-1" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <img src={work.coverImageUrl} alt={work.title} className="w-full h-full object-cover" loading="lazy" />
                          )}
                          {/* 有上传文件时显示遮罩提示 */}
                          {hasUploadedFiles && (
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-colors">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                                点击下方标题打开文件
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // 无封面时显示文件类型图标
                        <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex flex-col items-center justify-center">
                          {/* 根据文件类型显示不同图标 */}
                          {(() => {
                            const videoItem = work.work_items?.find(item => item.type === 'video' && item.url);
                            const pdfItem = work.work_items?.find(item => item.type === 'pdf' && item.url);
                            const pptItem = work.work_items?.find(item => item.type === 'ppt' && item.url);
                            
                            if (videoItem) {
                              return (
                                <>
                                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                    <Play className="h-8 w-8 text-red-600 ml-1" />
                                  </div>
                                  <span className="mt-3 text-sm font-medium text-slate-600">点击下方标题打开</span>
                                </>
                              );
                            } else if (pdfItem) {
                              return (
                                <>
                                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-blue-600" />
                                  </div>
                                  <span className="mt-3 text-sm font-medium text-slate-600">点击下方标题打开</span>
                                </>
                              );
                            } else if (pptItem) {
                              return (
                                <>
                                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                    <Presentation className="h-8 w-8 text-orange-600" />
                                  </div>
                                  <span className="mt-3 text-sm font-medium text-slate-600">点击下方标题打开</span>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <FolderOpen className="h-12 w-12 text-slate-400" />
                                  <span className="mt-3 text-sm font-medium text-slate-500">点击下方标题打开</span>
                                </>
                              );
                            }
                          })()}
                        </div>
                      )}
                      
                      {/* 卡片内容 */}
                      <CardContent className="p-4">
                        {/* 标题区域 - 始终可点击打开 */}
                        <button 
                          onClick={handleTitleClick}
                          className="w-full text-left group/title mb-2 cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            {/* 文件类型图标 */}
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                              coverFileType === 'video' || work.work_items?.find(item => item.type === 'video') ? 'bg-red-100 text-red-600' :
                              coverFileType === 'pdf' || work.work_items?.find(item => item.type === 'pdf') ? 'bg-blue-100 text-blue-600' :
                              coverFileType === 'ppt' || work.work_items?.find(item => item.type === 'ppt') ? 'bg-orange-100 text-orange-600' :
                              'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              {coverFileType === 'video' || work.work_items?.find(item => item.type === 'video') ? (
                                <Play className="h-4 w-4" />
                              ) : coverFileType === 'pdf' || work.work_items?.find(item => item.type === 'pdf') ? (
                                <FileText className="h-4 w-4" />
                              ) : coverFileType === 'ppt' || work.work_items?.find(item => item.type === 'ppt') ? (
                                <Presentation className="h-4 w-4" />
                              ) : (
                                <FolderOpen className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base leading-snug group-hover/title:text-primary transition-colors break-words">
                                {work.title}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover/title:opacity-100 transition-opacity">
                                <Eye className="h-3 w-3" />
                                <span>点击打开</span>
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        {getCategoryName(work.category) && (
                          <Badge variant="outline" className="text-xs mb-2">{getCategoryName(work.category)}</Badge>
                        )}
                        
                        {work.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {work.description}
                          </p>
                        )}
                        
                        {/* 文件列表 - 可点击查看 */}
                        {work.display_mode !== 'carousel' && work.work_items && work.work_items.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {work.work_items.slice(0, 3).map((item) => (
                              <button
                                key={item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageIndex(0);
                                  setPreviewItem({ 
                                    ...item, 
                                    allImages: work.work_items?.filter(i => i.type === 'image' && i.url) || [] 
                                  } as any);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                {getFileIcon(item.type)}
                                <span className="truncate max-w-[60px]">{item.title || item.type}</span>
                              </button>
                            ))}
                            {work.work_items.length > 3 && (
                              <span className="px-2 py-1 text-xs text-muted-foreground">
                                +{work.work_items.length - 3}个文件
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    );
                  })}
                  
                  {/* 填充右侧距离 */}
                  <div className="shrink-0 w-1" />
                </div>
              </div>
              
              {/* 滚动提示箭头 - 仅在作品多时显示 */}
              {works.length > 3 && (
                <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none px-2 z-10">
                  <button 
                    onClick={() => {
                      const container = document.querySelector('[data-works-container]');
                      if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
                    }}
                    className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg flex items-center justify-center pointer-events-auto hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => {
                      const container = document.querySelector('[data-works-container]');
                      if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
                    }}
                    className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg flex items-center justify-center pointer-events-auto hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            
            {/* 滑动提示文字 */}
            <div className="mt-3 text-center text-sm text-muted-foreground/60 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>可左右滑动观看</span>
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            
            {/* 查看更多作品按钮 */}
            {works.length > 6 && (
              <div className="pt-6 text-center">
                <Link 
                  href="/works"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  查看更多作品
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>
        ) : null;

      case 'contact_info':
        // 计算实际需要显示的项目数量
        const visibleItems = [
          contactInfo?.show_email && contactInfo?.email,
          contactInfo?.show_phone && contactInfo?.phone,
          contactInfo?.show_wechat && (contactInfo?.wechat_id || contactInfo?.wechatQrUrl),
        ].filter(Boolean).length;

        // 检查是否需要显示左侧信息（邮箱或微信号）
        const hasLeftInfo = (contactInfo?.show_email && contactInfo?.email) || (contactInfo?.show_wechat && contactInfo?.wechat_id);
        // 检查是否需要显示二维码
        const hasQrCode = contactInfo?.show_wechat && contactInfo?.wechatQrUrl;

        return contactInfo?.is_visible && visibleItems > 0 ? (
          <section key={moduleName} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Mail className="h-6 w-6" />
              联系方式
            </h2>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-4 sm:p-6">
                {/* 电脑端：左右两栏布局，左宽右窄 */}
                <div className="hidden md:flex md:items-stretch">
                  {/* 左栏：邮箱和微信信息（垂直居中） */}
                  {hasLeftInfo && (
                    <div className="flex flex-col justify-center gap-6 min-w-0 flex-[3] pl-5 pr-5">
                      {/* 邮箱 */}
                      {contactInfo.show_email && contactInfo.email && (
                        <div className="flex items-center gap-3 -mt-2">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-muted-foreground">邮箱：</span>
                            <span className="font-medium">{contactInfo.email}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(contactInfo.email);
                              setCopiedText('email');
                              setTimeout(() => setCopiedText(null), 2000);
                            }}
                            className="text-xs px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
                          >
                            {copiedText === 'email' ? '已复制' : '复制'}
                          </button>
                        </div>
                      )}

                      {/* 微信号 */}
                      {contactInfo.show_wechat && contactInfo.wechat_id && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0">
                            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088-.181-.013-.363-.027-.557-.034zm-2.89 3.015c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.97-.983zm4.844 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983z"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-muted-foreground">微信：</span>
                            <span className="font-medium">{contactInfo.wechat_id}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(contactInfo.wechat_id);
                              setCopiedText('wechat');
                              setTimeout(() => setCopiedText(null), 2000);
                            }}
                            className="text-xs px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
                          >
                            {copiedText === 'wechat' ? '已复制' : '复制'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 分割线 */}
                  {hasLeftInfo && hasQrCode && (
                    <div className="w-px bg-slate-200 dark:bg-slate-700" />
                  )}

                  {/* 右栏：二维码 */}
                  {hasQrCode && (
                    <div className="flex flex-col items-center justify-center flex-[2] pl-5 pr-5 pt-2">
                      <img
                        src={contactInfo.wechatQrUrl}
                        alt="微信二维码"
                        className="w-24 h-24 border rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground mt-2">扫码添加微信</p>
                    </div>
                  )}
                </div>

                {/* 手机端：保持原有自适应布局 */}
                <div className="md:hidden">
                  <div className="grid gap-4">
                    {/* 邮箱 */}
                    {contactInfo.show_email && contactInfo.email && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">邮箱</p>
                          <p className="font-medium truncate">{contactInfo.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(contactInfo.email);
                            setCopiedText('email');
                            setTimeout(() => setCopiedText(null), 2000);
                          }}
                          className="text-xs px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
                        >
                          {copiedText === 'email' ? '已复制' : '复制'}
                        </button>
                      </div>
                    )}

                    {/* 电话 */}
                    {contactInfo.show_phone && contactInfo.phone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
                          <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">电话</p>
                          <p className="font-medium truncate">{contactInfo.phone}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(contactInfo.phone);
                            setCopiedText('phone');
                            setTimeout(() => setCopiedText(null), 2000);
                          }}
                          className="text-xs px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
                        >
                          {copiedText === 'phone' ? '已复制' : '复制'}
                        </button>
                      </div>
                    )}

                    {/* 微信号 */}
                    {contactInfo.show_wechat && contactInfo.wechat_id && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0">
                          <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088-.181-.013-.363-.027-.557-.034zm-2.89 3.015c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.97-.983zm4.844 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">微信号</p>
                          <p className="font-medium truncate">{contactInfo.wechat_id}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(contactInfo.wechat_id);
                            setCopiedText('wechat');
                            setTimeout(() => setCopiedText(null), 2000);
                          }}
                          className="text-xs px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
                        >
                          {copiedText === 'wechat' ? '已复制' : '复制'}
                        </button>
                      </div>
                    )}

                    {/* 微信二维码 */}
                    {contactInfo.show_wechat && contactInfo.wechatQrUrl && (
                      <div className="flex justify-center pt-2">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">扫码添加微信</p>
                          <img
                            src={contactInfo.wechatQrUrl}
                            alt="微信二维码"
                            className="w-32 h-32 border rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null;

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary"></div>
          <div className="absolute inset-0 animate-pulse rounded-full h-12 w-12 bg-primary/10"></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">加载中...</p>
      </div>
    );
  }

  // 按排序获取模块列表
  // 如果没有模块排序数据，使用默认顺序
  const defaultModuleOrders: ModuleOrder[] = [
    { module_name: 'self_introduction', order: 1, is_visible: true },
    { module_name: 'work_experiences', order: 2, is_visible: true },
    { module_name: 'educations', order: 3, is_visible: true },
    { module_name: 'skills', order: 4, is_visible: true },
    { module_name: 'works', order: 5, is_visible: true },
    { module_name: 'contact_info', order: 6, is_visible: true },
  ];
  
  const sortedModules = moduleOrders.length > 0 
    ? [...moduleOrders].sort((a, b) => a.order - b.order)
    : defaultModuleOrders;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="fixed top-4 right-4 z-50">
        <Link href="/admin" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-lg">
          管理后台
        </Link>
      </div>

      {/* Header */}
      <header className="pt-16 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Avatar className="h-32 w-32 mx-auto mb-6 ring-4 ring-white shadow-lg">
            <AvatarImage src={avatarUrl} alt={profile?.name || 'Avatar'} />
            <AvatarFallback className="text-3xl">{profile?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <h1 className="text-4xl font-bold mb-2">{profile?.name || '您的姓名'}</h1>
          {/* 自定义栏目 - 显示在职位上方，标题和内容可独立显示 */}
          {profile?.show_custom && (profile?.custom_title || profile?.custom_content) && (
            <p className="text-lg text-muted-foreground mb-1">
              {profile.custom_title && <span className="font-medium">{profile.custom_title}</span>}
              {profile.custom_title && profile.custom_content && '：'}
              {profile.custom_content}
            </p>
          )}
          {profile?.title && <p className="text-xl text-muted-foreground mb-4">{profile.title}</p>}
          {profile?.bio && <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-6">{profile.bio}</p>}

          {/* 联系方式 - 根据开关显示 */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {profile?.show_email && profile?.email && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(profile.email);
                  setCopiedText('profile-email');
                  setTimeout(() => setCopiedText(null), 2000);
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
              >
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedText === 'profile-email' ? '已复制!' : '点击复制'}
                </span>
              </button>
            )}
            {profile?.show_phone && profile?.phone && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(profile.phone);
                  setCopiedText('profile-phone');
                  setTimeout(() => setCopiedText(null), 2000);
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
              >
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedText === 'profile-phone' ? '已复制!' : '点击复制'}
                </span>
              </button>
            )}
            {profile?.show_location && profile?.location && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {profile.location}
              </span>
            )}
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-4 w-4" />
                个人网站
              </a>
            )}
          </div>

          {/* 社交链接 - 根据开关显示 */}
          {profile && (
            <div className="flex justify-center gap-3">
              {profile.show_github && profile.social_links?.github && (
                <a href={profile.social_links.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <Github className="h-5 w-5" />
                </a>
              )}
              {profile.show_linkedin && profile.social_links?.linkedin && (
                <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {profile.show_twitter && profile.social_links?.twitter && (
                <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {profile.show_instagram && profile.social_links?.instagram && (
                <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content - 按模块排序渲染 */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {sortedModules.map(module => renderModule(module.module_name))}
        
        {!profile && workExperiences.length === 0 && educations.length === 0 && skills.length === 0 && works.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">还没有添加任何内容</p>
            <Link href="/admin" className="text-primary hover:underline">前往管理后台添加内容</Link>
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} {profile?.name || '个人作品集'}. All rights reserved.</p>
      </footer>

      {/* 预览模态框 */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-0 sm:p-4" onClick={() => setPreviewItem(null)}>
          <div className="relative w-full h-full sm:max-w-6xl sm:max-h-[90vh] sm:w-full bg-white dark:bg-slate-900 sm:rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
              <X className="h-5 w-5" />
            </button>
            
            {/* 图片预览 - 改为竖向滑动 */}
            {previewItem.type === 'image' && previewItem.url && (
              <div className="relative w-full h-full flex flex-col bg-black">
                {/* 图片容器 - 竖向滚动，每页占满视口 */}
                <div 
                  className="flex-1 overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
                  style={{ scrollSnapType: 'y mandatory' }}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const scrollTop = container.scrollTop;
                    const pageHeight = container.clientHeight;
                    const newIndex = Math.round(scrollTop / pageHeight);
                    if (newIndex !== previewImageIndex) {
                      setPreviewImageIndex(newIndex);
                    }
                  }}
                >
                  {/* 所有图片竖向排列，每张占满一屏 */}
                  {(previewItem.allImages && previewItem.allImages.length > 0 ? previewItem.allImages : [previewItem]).map((img, idx) => (
                    <div 
                      key={idx}
                      className="snap-start min-h-full min-h-screen flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImageIndex(idx);
                      }}
                    >
                      <img 
                        src={img.url} 
                        alt={img.title || `图片 ${idx + 1}`} 
                        className="max-w-full max-h-full object-contain" 
                      />
                    </div>
                  ))}
                </div>
                
                {/* 底部导航栏 */}
                {previewItem.allImages && previewItem.allImages.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                    {/* 上下切换按钮 */}
                    <div className="flex items-center justify-center gap-8">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const container = document.querySelector('.overflow-y-auto');
                          if (container) container.scrollBy({ top: -container.clientHeight, behavior: 'smooth' });
                        }}
                        disabled={previewImageIndex === 0}
                        className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="h-6 w-6" />
                      </button>
                      
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                        <span className="text-white text-sm font-medium">{previewImageIndex + 1}</span>
                        <span className="text-white/60 text-sm">/</span>
                        <span className="text-white text-sm">{previewItem.allImages.length}</span>
                      </div>
                      
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const container = document.querySelector('.overflow-y-auto');
                          if (container) container.scrollBy({ top: container.clientHeight, behavior: 'smooth' });
                        }}
                        disabled={previewImageIndex >= previewItem.allImages!.length - 1}
                        className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="h-6 w-6" />
                      </button>
                    </div>
                    
                    {/* 页面缩略图指示器 */}
                    <div className="flex justify-center gap-2 mt-3 overflow-x-auto pb-2 px-2">
                      {previewItem.allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            const container = document.querySelector('.overflow-y-auto');
                            if (container) {
                              container.scrollTo({ top: idx * container.clientHeight, behavior: 'smooth' });
                            }
                            setPreviewImageIndex(idx);
                          }}
                          className={`shrink-0 w-2 h-2 rounded-full transition-all ${
                            idx === previewImageIndex 
                              ? 'bg-white scale-125' 
                              : 'bg-white/40 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 滑动提示 */}
                {previewItem.allImages && previewItem.allImages.length > 1 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs flex items-center gap-1 animate-bounce">
                    <ArrowUp className="h-3 w-3" />
                    <span>上下滑动浏览</span>
                    <ArrowDown className="h-3 w-3" />
                  </div>
                )}
                
                {previewItem.title && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                    {previewItem.title}
                  </div>
                )}
              </div>
            )}
            
            {/* 视频预览 */}
            {previewItem.type === 'video' && previewItem.url && (
              <div className="w-full bg-black flex items-center justify-center">
                <video 
                  src={previewItem.url} 
                  controls 
                  autoPlay 
                  className="max-w-full max-h-[85vh]" 
                  controlsList="nodownload"
                />
              </div>
            )}
            
            {/* PDF 预览 - 竖向滑动翻页 */}
            {previewItem.type === 'pdf' && previewItem.url && (
              <div className="w-full h-[85vh] relative overflow-hidden">
                <PDFViewer url={previewItem.url} title={previewItem.title || 'PDF预览'} />
              </div>
            )}
            
            {/* PPT 预览 - 显示缩略图列表 */}
            {previewItem.type === 'ppt' && previewItem.url && (
              <div className="flex flex-col items-center justify-center h-[85vh] p-8 text-center bg-gray-50 dark:bg-slate-800 overflow-y-auto">
                <Presentation className="h-20 w-20 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{previewItem.title || 'PPT演示文稿'}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  PPT文件暂不支持在线预览，请下载后使用PowerPoint或其他演示软件打开查看
                </p>
              </div>
            )}
            
            {/* 其他文件 */}
            {previewItem.type === 'other' && previewItem.url && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                {getFileIcon(previewItem.type)}
                <h3 className="mt-4 text-lg font-semibold">{previewItem.title || '文件预览'}</h3>
                <p className="mt-2 text-sm text-muted-foreground">文件</p>
              </div>
            )}
            
            {/* 无URL或未知类型 */}
            {!['image', 'video', 'pdf', 'ppt', 'other'].includes(previewItem.type || '') && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">文件暂不可预览</p>
                <p className="mt-2 text-xs text-muted-foreground">type: {previewItem.type || 'undefined'}, url: {previewItem.url ? '有' : '无'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
