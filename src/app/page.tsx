'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PDFViewer } from '@/components/PDFViewer';
import { RichTextContent } from '@/components/RichTextContent';
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
  User,
  Wrench,
  FolderOpen,
  Download,
  Presentation
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
  category: string;
  tags: string[];
  display_mode?: string;
  cover_image_key?: string;
  coverImageUrl?: string;
  work_items: WorkItem[];
  carouselItems?: WorkItem[];
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
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillCategories, setSkillCategories] = useState<Array<{ id: number; name: string; is_visible: boolean }>>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [moduleOrders, setModuleOrders] = useState<ModuleOrder[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

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
  }, []);

  const loadData = async () => {
    try {
      // 记录访问统计（使用设备指纹去重）
      recordVisit().catch(() => {});

      const [profileRes, selfIntroRes, expRes, eduRes, skillsRes, skillCategoriesRes, worksRes, moduleOrdersRes, contactRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/self-introduction'),
        fetch('/api/work-experiences'),
        fetch('/api/educations'),
        fetch('/api/skills'),
        fetch('/api/skill-categories'),
        fetch('/api/works'),
        fetch('/api/module-orders'),
        fetch('/api/contact-info'),
      ]);

      const profileData = await profileRes.json();
      const selfIntroData = await selfIntroRes.json();
      const expData = await expRes.json();
      const eduData = await eduRes.json();
      const skillsData = await skillsRes.json();
      const skillCategoriesData = await skillCategoriesRes.json();
      const worksData = await worksRes.json();
      const moduleOrdersData = await moduleOrdersRes.json();

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
      if (skillCategoriesData.success) setSkillCategories(skillCategoriesData.data.filter((c: { is_visible: boolean }) => c.is_visible));
      
      if (worksData.success && worksData.data) {
        const worksWithUrls = await loadWorkItemsUrls(worksData.data);
        setWorks(worksWithUrls);
        
        const cats = new Set<string>();
        worksWithUrls.forEach(w => {
          if (w.category) cats.add(w.category);
        });
        setCategories(['all', ...Array.from(cats)]);
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
            if (data.success) coverImageUrl = data.data.url;
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

  const getSocialIcon = (name: string) => {
    switch (name) {
      case 'github': return <Github className="h-5 w-5" />;
      case 'linkedin': return <Linkedin className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'instagram': return <Instagram className="h-5 w-5" />;
      default: return null;
    }
  };

  // 根据模块排序渲染
  const renderModule = (moduleName: string) => {
    const moduleOrder = moduleOrders.find(m => m.module_name === moduleName);
    if (moduleOrder && !moduleOrder.is_visible) return null;

    switch (moduleName) {
      case 'self_introduction':
        return selfIntroduction?.is_visible && selfIntroduction.content ? (
          <section key={moduleName} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <User className="h-6 w-6" />
              自我评价
            </h2>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {selfIntroduction.content}
                </div>
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
                          // 富文本内容
                          <RichTextContent html={exp.description} />
                        ) : (
                          // 普通文本，手机端段落间距增加 + 两端对齐
                          <div className="sm:hidden space-y-2">
                            {exp.description.split('\n').map((line, idx) => (
                              <p key={idx} className="whitespace-pre-wrap text-justify">
                                {line}
                              </p>
                            ))}
                          </div>
                        )}
                        {/* 电脑端普通文本 */}
                        {!exp.description.includes('<') && !exp.description.includes('>') && (
                          <p 
                            className="hidden sm:block whitespace-pre-wrap"
                            style={{ textAlign: (exp.description_align || 'left') as 'left' | 'center' | 'right' | 'justify' }}
                          >
                            {exp.description}
                          </p>
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
                  <CardContent className="p-3 sm:p-6">
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
                        {/* 手机端：段落间距增加 + 两端对齐 */}
                        <div className="sm:hidden mt-2 text-muted-foreground space-y-2">
                          {edu.description.split('\n').map((line, idx) => (
                            <p key={idx} className="whitespace-pre-wrap text-justify">
                              {line}
                            </p>
                          ))}
                        </div>
                        {/* 电脑端：原有样式 */}
                        <p 
                          className="hidden sm:block mt-2 text-muted-foreground whitespace-pre-wrap"
                          style={{ textAlign: (edu.description_align || 'left') as 'left' | 'center' | 'right' | 'justify' }}
                        >
                          {edu.description}
                        </p>
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
            {/* 分类卡片展示 */}
            {skillCategories.length > 0 ? (
              // 大分类卡片：两列并排布局（电脑端和手机端都保持两列）
              <div className="grid grid-cols-2 gap-4 items-start">
                {skillCategories.map((cat) => {
                  const catSkills = skills.filter(s => s.category === cat.name);
                  if (catSkills.length === 0) return null;
                  return (
                    <Card key={cat.id} className="overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                      <CardContent className="p-3 sm:p-4">
                        <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                          {cat.name}
                        </h3>
                        {/* 内层技能卡片：两列网格布局 */}
                        <div className="grid grid-cols-2 gap-2">
                          {catSkills.map((skill) => (
                            <div 
                              key={skill.id} 
                              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 sm:p-3"
                            >
                              {/* 技能名称 + 百分比 */}
                              <div className="flex items-center justify-between mb-1.5">
                                <h4 className="font-medium text-xs sm:text-sm truncate">{skill.name}</h4>
                                <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 shrink-0">{skill.level}%</span>
                              </div>
                              {/* 进度条 */}
                              <Progress value={skill.level} className="h-1 mb-1.5" />
                              {/* 补充说明（可选） */}
                              {skill.description && (
                                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                  {skill.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {/* 未分类的技能 */}
                {(() => {
                  const uncategorizedSkills = skills.filter(s => !s.category || !skillCategories.find(c => c.name === s.category));
                  if (uncategorizedSkills.length === 0) return null;
                  return (
                    <Card className="overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                      <CardContent className="p-3 sm:p-4">
                        <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">
                          其他
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {uncategorizedSkills.map((skill) => (
                            <div 
                              key={skill.id} 
                              className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 sm:p-3"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <h4 className="font-medium text-xs sm:text-sm truncate">{skill.name}</h4>
                                <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 shrink-0">{skill.level}%</span>
                              </div>
                              <Progress value={skill.level} className="h-1 mb-1.5" />
                              {skill.description && (
                                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                  {skill.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            ) : (
              // 默认展示（无分类时）
              <Card className="overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {skills.map((skill) => (
                      <div 
                        key={skill.id} 
                        className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 sm:p-3"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-medium text-xs sm:text-sm truncate">{skill.name}</h4>
                          <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 shrink-0">{skill.level}%</span>
                        </div>
                        <Progress value={skill.level} className="h-1 mb-1.5" />
                        {skill.description && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {skill.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        ) : null;

      case 'works':
        return works.length > 0 ? (
          <section key={moduleName} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FolderOpen className="h-6 w-6" />
              作品集
            </h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedCategory === 'all' ? works : works.filter(w => w.category === selectedCategory)).map((work) => (
                <Card key={work.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                  {work.display_mode === 'carousel' && work.carouselItems && work.carouselItems.length > 0 ? (
                    <WorkCarousel images={work.carouselItems} onImageClick={(item) => setPreviewItem(item)} />
                  ) : work.coverImageUrl ? (
                    <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 cursor-pointer overflow-hidden">
                      {work.work_items?.find(item => item.type === 'video' && item.url) ? (
                        <video src={work.coverImageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" muted playsInline />
                      ) : (
                        <img src={work.coverImageUrl} alt={work.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-all duration-300" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{work.title}</h3>
                      {work.category && <Badge variant="outline" className="text-xs shrink-0">{work.category}</Badge>}
                    </div>
                    {work.description && (
                      <p 
                        className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap"
                        style={{ textAlign: (work.description_align || 'left') as 'left' | 'center' | 'right' | 'justify' }}
                      >
                        {work.description}
                      </p>
                    )}
                    {work.tags && work.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {work.tags.slice(0, 4).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    {work.display_mode !== 'carousel' && work.work_items && work.work_items.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        {work.work_items.slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setPreviewItem(item)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            {getFileIcon(item.type)}
                            <span className="truncate max-w-[80px]">{item.title || item.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null;

      case 'contact_info':
        // 计算实际需要显示的项目数量
        const visibleItems = [
          contactInfo?.show_email && contactInfo?.email,
          contactInfo?.show_phone && contactInfo?.phone,
          contactInfo?.show_wechat && (contactInfo?.wechat_id || contactInfo?.wechatQrUrl),
        ].filter(Boolean).length;

        return contactInfo?.is_visible && visibleItems > 0 ? (
          <section key={moduleName} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Mail className="h-6 w-6" />
              联系方式
            </h2>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className={`grid gap-6 ${
                  visibleItems === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
                  visibleItems === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  'grid-cols-1 md:grid-cols-2'
                }`}>
                  {/* 邮箱 */}
                  {contactInfo.show_email && contactInfo.email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
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
                        className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        {copiedText === 'email' ? '已复制' : '复制'}
                      </button>
                    </div>
                  )}

                  {/* 电话 */}
                  {contactInfo.show_phone && contactInfo.phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
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
                        className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        {copiedText === 'phone' ? '已复制' : '复制'}
                      </button>
                    </div>
                  )}

                  {/* 微信号 */}
                  {contactInfo.show_wechat && contactInfo.wechat_id && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
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
                        className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        {copiedText === 'wechat' ? '已复制' : '复制'}
                      </button>
                    </div>
                  )}

                  {/* 微信二维码 */}
                  {contactInfo.show_wechat && contactInfo.wechatQrUrl && (
                    <div className={`${visibleItems > 1 ? 'md:col-span-2' : ''} flex justify-center mt-2`}>
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
          <div className="relative max-w-5xl max-h-[90vh] w-full bg-white dark:bg-slate-900 rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              {previewItem.type === 'image' && previewItem.url && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img src={previewItem.url} alt={previewItem.title || '预览图片'} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg" />
                </div>
              )}
              {previewItem.type === 'video' && previewItem.url && (
                <div className="w-full bg-black flex items-center justify-center">
                  <video src={previewItem.url} controls autoPlay className="max-w-full max-h-[80vh]" />
                </div>
              )}
              {previewItem.type === 'pdf' && previewItem.url && (
                <div className="w-full h-[80vh] relative">
                  <PDFViewer url={previewItem.url} title={previewItem.title || 'PDF预览'} />
                  <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                    <a 
                      href={previewItem.url} 
                      download={previewItem.title || 'document.pdf'}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/90 dark:bg-slate-800/90 shadow-lg text-sm hover:bg-white dark:hover:bg-slate-800"
                    >
                      <Download className="h-4 w-4" />
                      下载
                    </a>
                  </div>
                </div>
              )}
              {previewItem.type === 'ppt' && previewItem.url && (
                <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center bg-gray-50 dark:bg-slate-800">
                  <Presentation className="h-20 w-20 text-orange-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{previewItem.title || 'PPT演示文稿'}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                    PPT文件暂不支持在线预览，请下载后使用PowerPoint或其他演示软件打开查看
                  </p>
                  <div className="flex gap-3">
                    <a 
                      href={previewItem.url} 
                      download={previewItem.title || 'presentation.pptx'}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      下载PPT
                    </a>
                  </div>
                </div>
              )}
              {previewItem.type === 'other' && previewItem.url && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  {getFileIcon(previewItem.type)}
                  <h3 className="mt-4 text-lg font-semibold">{previewItem.title || '文件预览'}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">文件</p>
                  <div className="mt-6 flex gap-3">
                    <a href={previewItem.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                      <ExternalLink className="h-4 w-4" />新窗口打开
                    </a>
                    <a href={previewItem.url} download={previewItem.title} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                      <FileText className="h-4 w-4" />下载文件
                    </a>
                  </div>
                </div>
              )}
              {!previewItem.url && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">文件暂不可预览</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
