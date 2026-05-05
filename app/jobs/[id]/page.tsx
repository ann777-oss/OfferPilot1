'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  CircleCheck as CheckCircle2,
  FileText,
  MessageSquare,
  Save,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ProjectTimeline from '@/components/dashboard/ProjectTimeline';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { getJobProject, updateJobProjectStatus } from '@/lib/services/project';
import type { InterviewRecord, JobProject, ProjectStatus } from '@/lib/types';

const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: string }> = {
  analyzed: { label: '已分析 JD', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  resume_ready: { label: '简历已就绪', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  applied: { label: '已投递', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  interviewing: { label: '面试中', tone: 'bg-purple-50 text-purple-700 border-purple-200' },
  offer: { label: '已拿 Offer', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: '已结束', tone: 'bg-red-50 text-red-700 border-red-200' },
  archived: { label: '已归档', tone: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  'analyzed',
  'resume_ready',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'archived',
];

function normalizeProjectStatus(status?: string): ProjectStatus {
  if (!status) return 'analyzed';
  if (status in PROJECT_STATUS_META) return status as ProjectStatus;
  return 'analyzed';
}

function getNextAction(project: JobProject) {
  const status = normalizeProjectStatus(project.job.status);

  if (!project.progress.hasResume) {
    return {
      title: '先生成项目简历',
      description: '这条申请已经完成 JD 分析，下一步建议先产出一份针对这个岗位的项目简历。',
      href: `/jobs/${project.job.id}/analysis`,
      cta: '去生成简历',
    };
  }

  if (status === 'analyzed' || status === 'resume_ready') {
    return {
      title: '准备投递这个岗位',
      description: '简历已经准备好，下一步建议补全投递信息并推进到投递阶段。',
      href: `/resumes/${project.progress.resumeId}`,
      cta: '去检查简历',
    };
  }

  if (!project.progress.hasInterviewPrep && project.progress.resumeId) {
    return {
      title: '生成面试准备材料',
      description: '当前项目已经进入投递后阶段，可以提前生成面试准备包。',
      href: `/resumes/${project.progress.resumeId}/interview-prep`,
      cta: '去准备面试',
    };
  }

  if (!project.progress.hasInterviewRecord) {
    return {
      title: '补充面试记录',
      description: '如果已经参加过面试，建议把问题、表现和复盘都沉淀在这里。',
      href: '/interviews',
      cta: '去写复盘',
    };
  }

  return {
    title: '继续推进项目进展',
    description: '这条项目主链路已经跑通，下一步可以继续更新状态、跟进结果或做复盘迭代。',
    href: `/jobs/${project.job.id}/analysis`,
    cta: '查看项目分析',
  };
}

function getInterviewRecordLink(record: InterviewRecord | undefined, jobId: string) {
  if (!record) return '/interviews';
  const params = `from=project&jobId=${jobId}`;
  return record.status === 'completed' ? `/interviews/${record.id}/review?${params}` : `/interviews/${record.id}/edit?${params}`;
}

export default function JobProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [project, setProject] = useState<JobProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [applicationSaving, setApplicationSaving] = useState(false);
  const [offerSaving, setOfferSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [appliedAt, setAppliedAt] = useState('');
  const [applicationChannel, setApplicationChannel] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');

  const [offerSalary, setOfferSalary] = useState('');
  const [offerCity, setOfferCity] = useState('');
  const [offerDepartment, setOfferDepartment] = useState('');
  const [offerWorkMode, setOfferWorkMode] = useState('');
  const [offerConversionOpportunity, setOfferConversionOpportunity] = useState(false);
  const [offerReplyDeadline, setOfferReplyDeadline] = useState('');
  const [offerNotes, setOfferNotes] = useState('');

  useEffect(() => {
    if (!user || !id) return;

    (async () => {
      setLoading(true);
      const data = await getJobProject(id, user.id);
      setProject(data);
      setLoading(false);
    })();
  }, [id, user]);

  useEffect(() => {
    if (!project) return;

    setAppliedAt(project.job.applied_at ?? '');
    setApplicationChannel(project.job.application_channel ?? '');
    setApplicationNotes(project.job.application_notes ?? '');

    setOfferSalary(project.job.offer_salary ?? '');
    setOfferCity(project.job.offer_city ?? '');
    setOfferDepartment(project.job.offer_department ?? '');
    setOfferWorkMode(project.job.offer_work_mode ?? '');
    setOfferConversionOpportunity(Boolean(project.job.offer_conversion_opportunity));
    setOfferReplyDeadline(project.job.offer_reply_deadline ?? '');
    setOfferNotes(project.job.offer_notes ?? '');
  }, [project]);

  const latestResume = project?.resumes[0] ?? null;
  const latestInterviewPack = project?.interviewPacks[0] ?? null;
  const latestInterviewRecord = useMemo(() => {
    if (!project) return null;
    return project.interviewRecords.find((record) => record.status === 'completed') ?? project.interviewRecords[0] ?? null;
  }, [project]);

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-6xl space-y-4 p-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl p-8">
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <p className="mb-2 text-base font-semibold text-gray-900">未找到这个求职项目</p>
            <p className="mb-6 text-sm text-gray-500">这个项目可能已被删除，或者当前账号没有访问权限。</p>
            <Button onClick={() => router.push('/dashboard')} className="bg-blue-600 text-white hover:bg-blue-700">
              返回工作台
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const analysis = project.job.analysis;
  const nextAction = getNextAction(project);
  const matchScore = analysis?.match_score ?? project.job.match_score ?? 0;
  const status = normalizeProjectStatus(project.job.status);
  const statusMeta = PROJECT_STATUS_META[status];
  const questionCount = latestInterviewPack
    ? (latestInterviewPack.content?.common_questions?.length || 0) +
      (latestInterviewPack.content?.technical_questions?.length || 0) +
      (latestInterviewPack.content?.behavioral_questions?.length || 0)
    : 0;

  const handleStatusChange = async (nextStatus: ProjectStatus) => {
    if (!user || !project || nextStatus === status) return;

    setStatusSaving(true);
    const success = await updateJobProjectStatus(project.job.id, user.id, nextStatus);

    if (!success) {
      setStatusSaving(false);
      toast({ title: '更新状态失败', variant: 'destructive' });
      return;
    }

    setProject({
      ...project,
      job: {
        ...project.job,
        status: nextStatus,
      },
    });

    setStatusSaving(false);
    toast({ title: `项目状态已更新为“${PROJECT_STATUS_META[nextStatus].label}”` });
  };

  const handleSaveApplication = async () => {
    if (!user || !project) return;

    setApplicationSaving(true);
    const { error } = await supabase
      .from('job_descriptions')
      .update({
        applied_at: appliedAt || null,
        application_channel: applicationChannel.trim() || null,
        application_notes: applicationNotes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.job.id)
      .eq('user_id', user.id);

    if (error) {
      setApplicationSaving(false);
      toast({ title: '保存投递信息失败', variant: 'destructive' });
      return;
    }

    setProject({
      ...project,
      job: {
        ...project.job,
        applied_at: appliedAt || null,
        application_channel: applicationChannel.trim(),
        application_notes: applicationNotes.trim(),
      },
    });

    setApplicationSaving(false);
    toast({ title: '投递信息已保存' });
  };

  const handleSaveOffer = async () => {
    if (!user || !project) return;

    setOfferSaving(true);
    const { error } = await supabase
      .from('job_descriptions')
      .update({
        offer_salary: offerSalary.trim() || null,
        offer_city: offerCity.trim() || null,
        offer_department: offerDepartment.trim() || null,
        offer_work_mode: offerWorkMode.trim() || null,
        offer_conversion_opportunity: offerConversionOpportunity,
        offer_reply_deadline: offerReplyDeadline || null,
        offer_notes: offerNotes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.job.id)
      .eq('user_id', user.id);

    if (error) {
      setOfferSaving(false);
      toast({ title: '保存 Offer 信息失败', variant: 'destructive' });
      return;
    }

    setProject({
      ...project,
      job: {
        ...project.job,
        offer_salary: offerSalary.trim(),
        offer_city: offerCity.trim(),
        offer_department: offerDepartment.trim(),
        offer_work_mode: offerWorkMode.trim(),
        offer_conversion_opportunity: offerConversionOpportunity,
        offer_reply_deadline: offerReplyDeadline || null,
        offer_notes: offerNotes.trim(),
      },
    });

    setOfferSaving(false);
    toast({ title: 'Offer 信息已保存' });
  };

  const handleDeleteProject = async () => {
    if (!user || !project || deleting) return;

    const label = `${project.job.company_name || '未知公司'} / ${project.job.job_title || '未命名职位'}`;
    if (!window.confirm(`确定要删除这个求职项目吗？\n${label}\n删除后无法恢复。`)) return;

    setDeleting(true);
    const { error } = await supabase
      .from('job_descriptions')
      .delete()
      .eq('id', project.job.id)
      .eq('user_id', user.id);

    if (error) {
      setDeleting(false);
      toast({ title: '删除求职项目失败', variant: 'destructive' });
      return;
    }

    toast({ title: '已删除求职项目' });
    router.push('/jobs');
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl p-8">
        <div className="mb-6 flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" />
            返回工作台
          </Link>
        </div>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
              <Building2 className="h-4 w-4" />
              <span>{project.job.company_name || '未知公司'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{project.job.job_title || '未命名职位'}</h1>
            <p className="mt-1 text-sm text-gray-500">
              这是这个岗位申请的主页面，后续简历、面试准备、投递信息、Offer 跟进和复盘都会围绕这个项目推进。
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDeleteProject}
              disabled={deleting}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {deleting ? '删除中...' : '删除'}
            </Button>
            <Button variant="outline" onClick={() => router.push(`/jobs/${project.job.id}/analysis`)}>
              查看 JD 分析
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => router.push(nextAction.href)}>
              {nextAction.cta}
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-5 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Briefcase className="h-3.5 w-3.5" />
              项目信息
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-500">公司</span>
                <span className="text-right text-gray-900">{project.job.company_name || '未知公司'}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-500">职位</span>
                <span className="text-right text-gray-900">{project.job.job_title || '未命名职位'}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-500">匹配度</span>
                <span className="font-semibold text-blue-600">{matchScore}%</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-500">创建时间</span>
                <span className="text-gray-900">{new Date(project.job.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Target className="h-3.5 w-3.5" />
              当前状态
            </p>
            <div className="mb-4">
              <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${statusMeta.tone}`}>
                {statusMeta.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROJECT_STATUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={statusSaving}
                  onClick={() => handleStatusChange(option)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    status === option
                      ? PROJECT_STATUS_META[option].tone
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {PROJECT_STATUS_META[option].label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700">下一步动作</p>
            <p className="mb-2 text-base font-semibold text-gray-900">{nextAction.title}</p>
            <p className="mb-4 text-sm text-gray-600">{nextAction.description}</p>
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={() => router.push(nextAction.href)}>
              {nextAction.cta}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <ProjectTimeline jobId={project.job.id} progress={project.progress} />
        </div>

        <div className="mb-6 grid gap-5 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText className="h-4 w-4 text-blue-500" />
                项目简历
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(project.progress.hasResume && latestResume ? `/resumes/${latestResume.id}` : `/jobs/${project.job.id}/analysis`)}
              >
                {project.progress.hasResume ? '查看' : '生成'}
              </Button>
            </div>

            {latestResume ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{latestResume.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    最近更新于 {new Date(latestResume.updated_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  已生成 {project.resumes.length} 份与该项目关联的简历
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">这个项目还没有生成简历，建议先从 JD 分析页开始定制。</p>
                <Button variant="outline" size="sm" onClick={() => router.push(`/jobs/${project.job.id}/analysis`)}>
                  去生成简历
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                面试准备
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (project.progress.resumeId) {
                    router.push(`/resumes/${project.progress.resumeId}/interview-prep`);
                    return;
                  }
                  toast({ title: '请先生成项目简历', variant: 'destructive' });
                }}
              >
                {latestInterviewPack ? '查看' : '生成'}
              </Button>
            </div>

            {latestInterviewPack ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-900">已生成专属面试准备包</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  共包含 {questionCount} 个问题与回答参考
                </div>
                <p className="text-xs text-gray-500">
                  生成时间：{new Date(latestInterviewPack.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">简历生成后，可以继续为这个项目生成面试准备材料。</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!project.progress.resumeId}
                  onClick={() => project.progress.resumeId && router.push(`/resumes/${project.progress.resumeId}/interview-prep`)}
                >
                  去准备面试
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MessageSquare className="h-4 w-4 text-amber-500" />
                面试记录
              </p>
              <Button variant="ghost" size="sm" onClick={() => router.push(getInterviewRecordLink(latestInterviewRecord ?? undefined, project.job.id))}>
                {latestInterviewRecord ? '查看' : '填写'}
              </Button>
            </div>

            {latestInterviewRecord ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-900">
                  {latestInterviewRecord.status === 'completed' ? '已完成面试复盘' : '已有待完善的面试记录'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(latestInterviewRecord.interview_date).toLocaleDateString('zh-CN')}
                </div>
                <p className="text-xs text-gray-500">公司：{latestInterviewRecord.company_name}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">等面试进行后，把问题、回答和复盘内容都沉淀在这个项目里。</p>
                <Button variant="outline" size="sm" onClick={() => router.push('/interviews')}>
                  去查看面试记录
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">投递信息</p>
            <Button
              size="sm"
              onClick={handleSaveApplication}
              disabled={applicationSaving}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              {applicationSaving ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              保存投递信息
            </Button>
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">投递日期</label>
              <Input type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">投递渠道</label>
              <Input value={applicationChannel} onChange={(e) => setApplicationChannel(e.target.value)} placeholder="如 Boss 直聘、官网、内推" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">备注</label>
            <Textarea
              value={applicationNotes}
              onChange={(e) => setApplicationNotes(e.target.value)}
              placeholder="记录内推人、沟通进展、投递版本或其他补充说明"
              className="min-h-[96px]"
            />
          </div>
        </div>

        <div id="offer-info" className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
              Offer 信息
            </p>
            <Button
              size="sm"
              onClick={handleSaveOffer}
              disabled={offerSaving}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              {offerSaving ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              保存 Offer 信息
            </Button>
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">薪资</label>
              <Input value={offerSalary} onChange={(e) => setOfferSalary(e.target.value)} placeholder="如 8k-10k/月，15薪" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">城市</label>
              <Input value={offerCity} onChange={(e) => setOfferCity(e.target.value)} placeholder="如 上海、杭州" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">部门</label>
              <Input value={offerDepartment} onChange={(e) => setOfferDepartment(e.target.value)} placeholder="如 AI 产品部、增长运营部" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">工作制</label>
              <Input value={offerWorkMode} onChange={(e) => setOfferWorkMode(e.target.value)} placeholder="如 双休、大小周、远程实习" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">截止回复时间</label>
              <Input type="date" value={offerReplyDeadline} onChange={(e) => setOfferReplyDeadline(e.target.value)} />
            </div>
            <div className="flex items-end">
              <label className="flex h-10 items-center gap-3 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={offerConversionOpportunity}
                  onChange={(e) => setOfferConversionOpportunity(e.target.checked)}
                />
                有转正机会
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">Offer 备注</label>
            <Textarea
              value={offerNotes}
              onChange={(e) => setOfferNotes(e.target.value)}
              placeholder="记录回复策略、谈薪空间、入职时间、对比判断等"
              className="min-h-[96px]"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
