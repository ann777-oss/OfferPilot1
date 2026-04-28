'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, CirclePlus as PlusCircle, User, ArrowRight, Briefcase, CircleCheck as CheckCircle2, Clock, Star, TrendingUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { calculateProfileCompletion, getMasterProfile, updateProfileCompletion } from '@/lib/services/profile';
import { useToast } from '@/hooks/use-toast';
import type { JobDescription, ResumeVersion } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [recentJobs, setRecentJobs] = useState<JobDescription[]>([]);
  const [recentResumes, setRecentResumes] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? '朋友';

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [masterProfile, jobsRes, resumesRes] = await Promise.all([
        getMasterProfile(user.id),
        supabase.from('job_descriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('resume_versions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
      ]);
      const currentCompletion = await calculateProfileCompletion(masterProfile);
      setProfileCompletion(currentCompletion);
      if ((masterProfile.profile?.profile_completion ?? 0) !== currentCompletion) {
        await updateProfileCompletion(user.id, masterProfile);
      }
      setRecentJobs((jobsRes.data ?? []) as JobDescription[]);
      setRecentResumes((resumesRes.data ?? []) as ResumeVersion[]);
      setLoading(false);
    })();
  }, [user]);

  const handleDeleteJob = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setRecentJobs((prev) => prev.filter((j) => j.id !== jobId));
    const { error } = await supabase.from('job_descriptions').delete().eq('id', jobId).eq('user_id', user.id);
    if (error) {
      toast({ title: '删除失败', variant: 'destructive' });
      const { data } = await supabase.from('job_descriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4);
      setRecentJobs((data ?? []) as JobDescription[]);
    } else {
      toast({ title: '已删除求职记录' });
    }
  };

  const handleDeleteResume = async (e: React.MouseEvent, resumeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setRecentResumes((prev) => prev.filter((r) => r.id !== resumeId));
    const { error } = await supabase.from('resume_versions').delete().eq('id', resumeId).eq('user_id', user.id);
    if (error) {
      toast({ title: '删除失败', variant: 'destructive' });
      const { data } = await supabase.from('resume_versions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4);
      setRecentResumes((data ?? []) as ResumeVersion[]);
    } else {
      toast({ title: '已删除简历' });
    }
  };

  const stats = [
    { label: '已生成简历', value: recentResumes.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '已分析职位', value: recentJobs.length, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '档案完整度', value: `${profileCompletion}%`, icon: User, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '已收藏简历', value: recentResumes.filter((r) => r.is_starred).length, icon: Star, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-gray-500 mb-0.5">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">你好，{firstName}</h1>
          </div>
          <Link href="/jobs/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <PlusCircle className="w-4 h-4" />
              新建求职
            </Button>
          </Link>
        </div>

        {profileCompletion < 60 && !loading && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">完善您的职业档案</p>
                <p className="text-xs text-amber-600">您的档案已完成 {profileCompletion}%。档案越完整，生成的定制简历质量越高。</p>
              </div>
            </div>
            <Link href="/profile">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 flex-shrink-0">
                去完善
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-4 bg-white rounded-xl border border-gray-100">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-0.5">
                  {loading ? <span className="inline-block w-10 h-6 bg-gray-100 rounded animate-pulse" /> : stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                最近求职
              </h2>
              <Link href="/jobs/new" className="text-xs text-blue-600 hover:underline font-medium">新建 +</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="py-10 text-center">
                <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-3">暂无求职记录</p>
                <Link href="/jobs/new">
                  <Button size="sm" variant="outline" className="text-xs">分析职位描述</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}/analysis`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{job.job_title || '未命名职位'}</p>
                      <p className="text-xs text-gray-400 truncate">{job.company_name || '未知公司'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {job.match_score > 0 && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${job.match_score >= 80 ? 'bg-emerald-50 text-emerald-700' : job.match_score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                          {job.match_score}%
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteJob(e, job.id)}
                        className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                最近简历
              </h2>
              <Link href="/resumes" className="text-xs text-blue-600 hover:underline font-medium">查看全部</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentResumes.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-3">暂无生成的简历</p>
                <p className="text-xs text-gray-400">分析一个职位，生成您的第一份定制简历</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentResumes.map((resume) => (
                  <Link key={resume.id} href={`/resumes/${resume.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{resume.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(resume.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {resume.is_starred && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resume.status === 'final' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {resume.status}
                      </span>
                      <button
                        onClick={(e) => handleDeleteResume(e, resume.id)}
                        className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">准备开始投递了吗？</p>
                <p className="text-xs text-gray-500">粘贴职位描述，秒级获取含 ATS 关键词的定制简历。</p>
              </div>
            </div>
            <Link href="/jobs/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
                立即开始
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
