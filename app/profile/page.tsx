'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Briefcase, GraduationCap, Code, Award, Link2, Sparkles, School } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { MasterProfile } from '@/lib/types';
import { calculateProfileCompletion, getMasterProfile, updateProfileCompletion } from '@/lib/services/profile';
import BasicInfoSection from '@/components/profile/BasicInfoSection';
import ExperienceSection from '@/components/profile/ExperienceSection';
import EducationSection from '@/components/profile/EducationSection';
import SkillsSection from '@/components/profile/SkillsSection';
import ProjectsSection from '@/components/profile/ProjectsSection';
import CertificationsSection from '@/components/profile/CertificationsSection';
import CampusActivitySection from '@/components/profile/CampusActivitySection';
import ResumeImportModal from '@/components/profile/ResumeImportModal';

const tabs = [
  { id: 'basics', label: '基本信息', icon: User },
  { id: 'education', label: '教育背景', icon: GraduationCap },
  { id: 'experience', label: '工作/实习经历', icon: Briefcase },
  { id: 'projects', label: '项目经验', icon: Link2 },
  { id: 'campus', label: '校园经历', icon: School },
  { id: 'skills', label: '技能', icon: Code },
  { id: 'certifications', label: '证书', icon: Award },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basics');
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const data = await getMasterProfile(user.id);
    const currentCompletion = await calculateProfileCompletion(data);
    setProfile(data);
    setCompletion(currentCompletion);
    if ((data.profile?.profile_completion ?? 0) !== currentCompletion) {
      await updateProfileCompletion(user.id, data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSaved = () => {
    toast({ title: '已保存！', description: '您的档案已成功更新。' });
    loadProfile();
  };

  const handleImported = () => {
    toast({ title: '导入成功！', description: 'AI 已自动填充您的职业档案。' });
    loadProfile();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mb-8" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">职业档案</h1>
            <p className="text-sm text-gray-500 mt-0.5">您的完整职业数据——所有定制简历的基础来源。</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">档案完整度</p>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700">{completion}%</span>
              </div>
            </div>
            <Button
              onClick={() => setImportOpen(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI 导入简历
            </Button>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div>
          {activeTab === 'basics' && (
            <BasicInfoSection profile={profile} userId={user?.id ?? ''} onSaved={handleSaved} />
          )}
          {activeTab === 'experience' && (
            <ExperienceSection userId={user?.id ?? ''} experiences={profile?.workExperience ?? []} onSaved={handleSaved} />
          )}
          {activeTab === 'education' && (
            <EducationSection userId={user?.id ?? ''} educationList={profile?.education ?? []} onSaved={handleSaved} />
          )}
          {activeTab === 'projects' && (
            <ProjectsSection userId={user?.id ?? ''} projects={profile?.projects ?? []} onSaved={handleSaved} />
          )}
          {activeTab === 'campus' && (
            <CampusActivitySection userId={user?.id ?? ''} activities={profile?.campusActivities ?? []} onSaved={handleSaved} />
          )}
          {activeTab === 'skills' && (
            <SkillsSection userId={user?.id ?? ''} skills={profile?.skills ?? []} onSaved={handleSaved} />
          )}
          {activeTab === 'certifications' && (
            <CertificationsSection userId={user?.id ?? ''} certifications={profile?.certifications ?? []} onSaved={handleSaved} />
          )}
        </div>
      </div>

      <ResumeImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        userId={user?.id ?? ''}
        onImported={handleImported}
      />
    </AppLayout>
  );
}
