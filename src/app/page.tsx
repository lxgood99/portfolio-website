'use client';

import { useState, useEffect } from 'react';
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
  Video
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
  social_links: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    [key: string]: string | undefined;
  };
}

interface WorkExperience {
  id: number;
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
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
}

interface Work {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  work_items: WorkItem[];
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 并行加载所有数据
      const [profileRes, expRes, eduRes, skillsRes, worksRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/work-experiences'),
        fetch('/api/educations'),
        fetch('/api/skills'),
        fetch('/api/works'),
      ]);

      const profileData = await profileRes.json();
      const expData = await expRes.json();
      const eduData = await eduRes.json();
      const skillsData = await skillsRes.json();
      const worksData = await worksRes.json();

      if (profileData.success && profileData.data) {
        setProfile(profileData.data);
        if (profileData.data.avatar_key) {
          loadAvatarUrl(profileData.data.avatar_key);
        }
      }

      if (expData.success) setWorkExperiences(expData.data);
      if (eduData.success) setEducations(eduData.data);
      if (skillsData.success) setSkills(skillsData.data);
      if (worksData.success) setWorks(worksData.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvatarUrl = async (key: string) => {
    try {
      const res = await fetch('/api/file-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.success) {
        setAvatarUrl(data.data.url);
      }
    } catch (error) {
      console.error('加载头像失败:', error);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getSocialIcon = (name: string) => {
    switch (name) {
      case 'github':
        return <Github className="h-5 w-5" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* 管理后台入口 */}
      <div className="fixed top-4 right-4 z-50">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 shadow-lg"
        >
          管理后台
        </Link>
      </div>

      {/* Header Section */}
      <header className="pt-16 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Avatar className="h-32 w-32 mx-auto mb-6 ring-4 ring-white shadow-lg">
            <AvatarImage src={avatarUrl} alt={profile?.name || 'Avatar'} />
            <AvatarFallback className="text-3xl">{profile?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <h1 className="text-4xl font-bold mb-2">{profile?.name || '您的姓名'}</h1>
          {profile?.title && (
            <p className="text-xl text-muted-foreground mb-4">{profile.title}</p>
          )}
          {profile?.bio && (
            <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-6">{profile.bio}</p>
          )}

          {/* Contact Info */}
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

          {/* Social Links */}
          {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
            <div className="flex justify-center gap-3">
              {Object.entries(profile.social_links).map(([name, url]) => {
                if (!url) return null;
                return (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {getSocialIcon(name)}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Work Experience */}
        {workExperiences.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              工作经历
            </h2>
            <div className="space-y-4">
              {workExperiences.map((exp) => (
                <Card key={exp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              教育背景
            </h2>
            <div className="space-y-4">
              {educations.map((edu) => (
                <Card key={edu.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">技能特长</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <Card key={skill.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{skill.name}</h3>
                      {skill.category && (
                        <Badge variant="secondary">{skill.category}</Badge>
                      )}
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
        )}

        {/* Works */}
        {works.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">作品集</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {works.map((work) => (
                <Card key={work.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{work.title}</h3>
                      {work.category && (
                        <Badge variant="outline">{work.category}</Badge>
                      )}
                    </div>
                    {work.description && (
                      <p className="text-sm text-muted-foreground mb-3">{work.description}</p>
                    )}
                    {work.tags && work.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-3">
                        {work.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    {work.work_items && work.work_items.length > 0 && (
                      <div className="flex gap-2">
                        {work.work_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getFileIcon(item.type)}
                            <span>{item.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!profile && workExperiences.length === 0 && educations.length === 0 && skills.length === 0 && works.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">还没有添加任何内容</p>
            <Link href="/admin" className="text-primary hover:underline">
              前往管理后台添加内容
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} {profile?.name || '个人作品集'}. All rights reserved.</p>
      </footer>
    </div>
  );
}
