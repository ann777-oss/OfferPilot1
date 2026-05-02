'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Briefcase,
  CalendarClock,
  CirclePlus as PlusCircle,
  FileText,
  Sparkles,
  Target,
  User,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import ProjectSelector from '@/components/dashboard/ProjectSelector';
import ProjectTimeline from '@/components/dashboard/ProjectTimeline';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { calculateProfileCompletion, getMasterProfile, updateProfileCompletion } from '@/lib/services/profile';
import { getJobProject, getJobProjects } from '@/lib/services/project';
import type { JobDescription, JobProject, ProjectStatus, ResumeVersion } from '@/lib/types';

type ActionPriority = 'high' | 'medium' | 'normal';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  company?: string;
  jobTitle?: string;
  priority: ActionPriority;
  sortScore: number;
}

const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: string }> = {
  analyzed: { label: '已分析 JD', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  resume_ready: { label: '简历已就绪', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  applied: { label: '已投递', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  interviewing: { label: '面试中', tone: 'bg-purple-50 text-purple-700 border-purple-200' },
  offer: { label: '已拿 Offer', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: '已结束', tone: 'bg-red-50 text-red-700 border-red-200' },
  archived: { label: '已归档', tone: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function normalizeProjectStatus(status?: string): ProjectStatus {
  if (!status) return 'analyzed';
  if (status in PROJECT_STATUS_META) return status as ProjectStatus;
  return 'analyzed';
}

function getReplyDaysLeft(deadline?: string | null) {
  if (!deadline) return null;
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function buildProjectAction(project: JobProject): ActionItem {
  const status = normalizeProjectStatus(project.job.status);
  const company = project.job.company_name || '未知公司';
  const jobTitle = project.job.job_title || '未命名职位';
  const daysLeft = getReplyDaysLeft(project.job.offer_reply_deadline);

  if (status === 'offer' || project.progress.hasOffer) {
    const urgent = daysLeft !== null && daysLeft <= 3;
    return {
      id: `${project.job.id}-offer`,
      title: urgent ? 'Offer 即将到回复截止日' : '处理 Offer 信息和对比',
      description:
        daysLeft === null
          ? '记录薪资、城市、部门、工作制和转正机会，方便最终对比选择。'
          : daysLeft < 0
            ? `回复截止日已过 ${Math.abs(daysLeft)} 天，请确认是否已处理。`
            : `距离回复截止日还有 ${daysLeft} 天，建议尽快完成对比和决策。`,
      href: `/jobs/${project.job.id}#offer-info`,
      cta: '处理 Offer',
      company,
      jobTitle,
      priority: urgent ? 'high' : 'medium',
      sortScore: urgent ? 10 : 40,
    };
  }

  if (!project.progress.hasResume) {
    return {
      id: `${project.job.id}-resume`,
      title: '生成项目简历',
      description: '先把这条岗位申请对应的定制简历生成出来。',
      href: `/jobs/${project.job.id}/analysis`,
      cta: '生成简历',
      company,
      jobTitle,
      priority: 'high',
      sortScore: 20,
    };
  }

  if (status === 'analyzed' || status === 'resume_ready') {
    return {
      id: `${project.job.id}-apply`,
      title: '准备投递这个岗位',
      description: '简历已经就绪，下一步可以检查简历并推进到投递阶段。',
      href: project.progress.resumeId ? `/resumes/${project.progress.resumeId}` : `/jobs/${project.job.id}`,
      cta: '检查简历',
      company,
      jobTitle,
      priority: 'medium',
      sortScore: 50,
    };
  }

  if (!project.progress.hasInterviewPrep && project.progress.resumeId) {
    return {
      id: `${project.job.id}-interview-prep`,
      title: '生成面试准备材料',
      description: '项目已经进入投递后阶段，可以提前准备高频问题和岗位相关回答。',
      href: `/resumes/${project.progress.resumeId}/interview-prep`,
      cta: '准备面试',
      company,
      jobTitle,
      priority: 'medium',
      sortScore: 60,
    };
  }

  if (!project.progress.hasInterviewRecord) {
    return {
      id: `${project.job.id}-review`,
      title: '补充面试复盘',
      description: '把面试问题、回答表现和改进点沉淀下来，避免每次面试都从头开始。',
      href: '/interviews',
      cta: '写复盘',
      company,
      jobTitle,
      priority: status === 'interviewing' ? 'high' : 'normal',
      sortScore: status === 'interviewing' ? 30 : 80,
    };
  }

  return {
    id: `${project.job.id}-follow`,
    title: '继续跟进项目状态',
    description: '这条项目主链路已经基本跑通，可以更新状态或补充最新进展。',
    href: `/jobs/${project.job.id}`,
    cta: '查看项目',
    company,
    jobTitle,
    priority: 'normal',
    sortScore: 90,
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [recentResumes, setRecentResumes] = useState<ResumeVersion[]>([]);
  const [allProjects, setAllProjects] = useState<JobDescription[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<JobProject | null>(null);
  const [actionProjects, setActionProjects] = useState<JobProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? '同学';

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      const [masterProfile, resumesRes, projects] = await Promise.all([
        getMasterProfile(user.id),
        supabase.from('resume_versions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        getJobProjects(user.id),
      ]);

      const currentCompletion = await calculateProfileCompletion(masterProfile);
      setProfileCompletion(currentCompletion);
      if ((masterProfile.profile?.profile_completion ?? 0) !== currentCompletion) {
        await updateProfileCompletion(user.id, masterProfile);
      }

      setRecentResumes((resumesRes.data ?? []) as ResumeVersion[]);
      setAllProjects(projects);

      if (projects.length > 0) {
        setSelectedProjectId((prev) => prev ?? projects[0].id);
      }

      const detailProjects = await Promise.all(projects.slice(0, 8).map((project) => getJobProject(project.id, user.id)));
      setActionProjects(detailProjects.filter(Boolean) as JobProject[]);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedProjectId) return;

    (async () => {
      setProjectLoading(true);
      const project = await getJobProject(selectedProjectId, user.id);
      setSelectedProject(project);
      setProjectLoading(false);
    })();
  }, [selectedProjectId, user]);

  const actionItems = useMemo(() => {
    const profileAction: ActionItem | null =
      profileCompletion < 60
        ? {
            id: 'profile-completion',
            title: '先完善职业档案',
            description: '档案越完整，后续项目简历和面试准备材料越稳定。',
            href: '/profile',
            cta: '完善档案',
            priority: 'high',
            sortScore: 0,
          }
        : null;

    const projectActions = actionProjects
      .filter((project) => !['rejected', 'archived'].includes(normalizeProjectStatus(project.job.status)))
      .map(buildProjectAction);

    return [profileAction, ...projectActions]
      .filter(Boolean)
      .sort((a, b) => a!.sortScore - b!.sortScore)
      .slice(0, 5) as ActionItem[];
  }, [actionProjects, profileCompletion]);

  const todayFocus = actionItems[0] ?? {
    id: 'new-project',
    title: allProjects.length === 0 ? '新建你的第一个求职项目' : '今天可以继续拓展新机会',
    description:
      allProjects.length === 0
        ? '从一个目标岗位开始，系统会围绕它推进简历、面试准备、复盘和 Offer 管理。'
        : '当前没有特别紧急的待办，可以新建一个目标岗位，或回看已有项目进度。',
    href: allProjects.length === 0 ? '/jobs/new' : '/jobs',
    cta: allProjects.length === 0 ? '新建求职项目' : '查看求职项目',
    priority: 'normal' as ActionPriority,
    sortScore: 100,
  };

  const activeProjects = allProjects.filter((project) => !['rejected', 'archived'].includes(normalizeProjectStatus(project.status)));
  const offerProjects = allProjects.filter((project) => normalizeProjectStatus(project.status) === 'offer');
  const stats = [
    { label: '进行中项目', value: activeProjects.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '待推进事项', value: actionItems.length, icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '已生成简历', value: recentResumes.length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Offer 数量', value: offerProjects.length, icon: BadgeCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const recentProjects = allProjects.slice(0, 5);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-0.5 text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">你好，{firstName}</h1>
            <p className="mt-1 text-sm text-gray-500">这里是你今天继续推进求职的入口。</p>
          </div>
          <Link href="/jobs/new">
            <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <PlusCircle className="h-4 w-4" />
              新建求职项目
            </Button>
          </Link>
        </div>

        <section className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-700" />
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">今日重点</p>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">{todayFocus.title}</h2>
              <p className="max-w-2xl text-sm leading-6 text-gray-600">{todayFocus.description}</p>
              {todayFocus.company && (
                <p className="mt-2 text-xs text-gray-500">
                  {todayFocus.company} / {todayFocus.jobTitle}
                </p>
              )}
            </div>
            <Link href={todayFocus.href} className="shrink-0">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                {todayFocus.cta}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <div className="mb-6 grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
          <section className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <CalendarClock className="h-4 w-4 text-amber-500" />
                待推进事项
              </h2>
              <Link href="/jobs" className="text-xs font-medium text-blue-600 hover:underline">
                查看全部项目
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-lg bg-gray-50" />
                ))}
              </div>
            ) : actionItems.length === 0 ? (
              <div className="py-10 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-800">今天没有紧急待办</p>
                <p className="mt-1 text-xs text-gray-500">可以新建项目，或检查已有项目是否需要更新状态。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-amber-400' : 'bg-gray-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
                        {item.company && <span className="shrink-0 text-xs text-gray-400">{item.company}</span>}
                      </div>
                      <p className="line-clamp-2 text-xs leading-5 text-gray-500">{item.description}</p>
                    </div>
                    <Link href={item.href} className="shrink-0">
                      <Button size="sm" variant={item.priority === 'high' ? 'default' : 'outline'} className={item.priority === 'high' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}>
                        {item.cta}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900">快速总览</h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-lg border border-gray-100 p-4">
                    <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <p className="mb-0.5 text-xl font-bold text-gray-900">
                      {loading ? <span className="inline-block h-5 w-8 animate-pulse rounded bg-gray-100" /> : stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>
            {profileCompletion < 80 && (
              <Link href="/profile" className="mt-4 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span>职业档案完整度 {profileCompletion}%</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </section>
        </div>

        {!loading && allProjects.length > 0 && (
          <section className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">当前项目进度</h2>
              {selectedProject && (
                <Link href={`/jobs/${selectedProject.job.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                  进入项目详情
                </Link>
              )}
            </div>
            <ProjectSelector projects={allProjects} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />
            {projectLoading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="h-32 animate-pulse rounded bg-gray-100" />
              </div>
            ) : selectedProject ? (
              <ProjectTimeline jobId={selectedProject.job.id} progress={selectedProject.progress} />
            ) : null}
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <Briefcase className="h-4 w-4 text-gray-400" />
                最近项目
              </h2>
              <Link href="/jobs" className="text-xs font-medium text-blue-600 hover:underline">
                查看全部
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-lg bg-gray-50" />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="py-10 text-center">
                <Briefcase className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                <p className="mb-3 text-sm text-gray-400">暂无求职项目</p>
                <Link href="/jobs/new">
                  <Button size="sm" variant="outline" className="text-xs">
                    新建第一个项目
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((job) => {
                  const status = normalizeProjectStatus(job.status);
                  const statusMeta = PROJECT_STATUS_META[status];

                  return (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{job.job_title || '未命名职位'}</p>
                        <p className="truncate text-xs text-gray-400">{job.company_name || '未知公司'}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.tone}`}>
                        {statusMeta.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <FileText className="h-4 w-4 text-gray-400" />
                最近简历
              </h2>
              <Link href="/resumes" className="text-xs font-medium text-blue-600 hover:underline">
                简历中心
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-lg bg-gray-50" />
                ))}
              </div>
            ) : recentResumes.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">暂无已生成简历</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentResumes.slice(0, 4).map((resume) => (
                  <Link key={resume.id} href={`/resumes/${resume.id}`} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <FileText className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{resume.name}</p>
                      <p className="text-xs text-gray-400">{new Date(resume.created_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
