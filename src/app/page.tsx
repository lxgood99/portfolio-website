'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  User
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
  start_date: string;
  end_date: string;
}

interface Skill {
  id: number;
  name: string;
  level: number;
  category: string;
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
      className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div 
        className="flex transition-transform duration-300 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((item, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 w-full h-full cursor-pointer"
            onClick={() => onImageClick(item)}
          >
            <img
              src={item.url}
              alt={item.title || `图片 ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
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

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selfIntroduction, setSelfIntroduction] = useState<SelfIntroduction | null>(null);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [moduleOrders, setModuleOrders] = useState<ModuleOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [previewItem, setPreviewItem] = useState<WorkItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, selfIntroRes, expRes, eduRes, skillsRes, worksRes, moduleOrdersRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/self-introduction'),
        fetch('/api/work-experiences'),
        fetch('/api/educations'),
        fetch('/api/skills'),
        fetch('/api/works'),
        fetch('/api/module-orders'),
      ]);

      const profileData = await profileRes.json();
      const selfIntroData = await selfIntroRes.json();
      const expData = await expRes.json();
      const eduData = await eduRes.json();
      const skillsData = await skillsRes.json();
      const worksData = await worksRes.json();
      const moduleOrdersData = await moduleOrdersRes.json();

      if (profileData.success && profileData.data) {
        setProfile(profileData.data);
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
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold">{exp.position}</h3>
                        <p className="text-primary">{exp.company}</p>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {exp.start_date} - {exp.end_date || '至今'}
                        {exp.location && ` · ${exp.location}`}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="mt-3 text-muted-foreground">{exp.description}</p>
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
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold">{edu.school}</h3>
                        <p className="text-primary">{edu.degree} · {edu.field}</p>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {edu.start_date} - {edu.end_date || '至今'}
                      </div>
                    </div>
                    {edu.description && (
                      <p className="mt-3 text-muted-foreground">{edu.description}</p>
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
            <h2 className="text-2xl font-bold mb-6">技能特长</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <Card key={skill.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{skill.name}</h3>
                      {skill.category && <Badge variant="secondary">{skill.category}</Badge>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={skill.level} className="flex-1" />
                      <span className="text-sm text-muted-foreground w-12">{skill.level}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null;

      case 'works':
        return works.length > 0 ? (
          <section key={moduleName}>
            <h2 className="text-2xl font-bold mb-6">作品集</h2>
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'all' ? '全部' : cat}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedCategory === 'all' ? works : works.filter(w => w.category === selectedCategory)).map((work) => (
                <Card key={work.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                  {work.display_mode === 'carousel' && work.carouselItems && work.carouselItems.length > 0 ? (
                    <WorkCarousel images={work.carouselItems} onImageClick={(item) => setPreviewItem(item)} />
                  ) : work.coverImageUrl ? (
                    <div className="relative h-48 bg-slate-100 dark:bg-slate-800 cursor-pointer">
                      {work.work_items?.find(item => item.type === 'video' && item.url) ? (
                        <video src={work.coverImageUrl} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={work.coverImageUrl} alt={work.title} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ) : (
                    <div className="h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{work.title}</h3>
                      {work.category && <Badge variant="outline" className="text-xs shrink-0">{work.category}</Badge>}
                    </div>
                    {work.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{work.description}</p>}
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

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          {profile?.title && <p className="text-xl text-muted-foreground mb-4">{profile.title}</p>}
          {profile?.bio && <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-6">{profile.bio}</p>}

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                {profile.email}
              </a>
            )}
            {profile?.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                {profile.phone}
              </a>
            )}
            {profile?.location && (
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

          {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
            <div className="flex justify-center gap-3">
              {Object.entries(profile.social_links).map(([name, url]) => {
                if (!url) return null;
                return (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    {getSocialIcon(name)}
                  </a>
                );
              })}
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
                <img src={previewItem.url} alt={previewItem.title || '预览图片'} className="max-w-full max-h-[80vh] object-contain" />
              )}
              {previewItem.type === 'video' && previewItem.url && (
                <video src={previewItem.url} controls autoPlay className="max-w-full max-h-[80vh]" />
              )}
              {(previewItem.type === 'pdf' || previewItem.type === 'ppt' || previewItem.type === 'other') && previewItem.url && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  {getFileIcon(previewItem.type)}
                  <h3 className="mt-4 text-lg font-semibold">{previewItem.title || '文件预览'}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{previewItem.type === 'pdf' ? 'PDF 文件' : previewItem.type === 'ppt' ? 'PPT 演示文稿' : '文件'}</p>
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
