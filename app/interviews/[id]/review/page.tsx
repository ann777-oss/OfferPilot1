'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building, Calendar, Loader2, Star, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { deleteInterviewRecord, getInterviewRecord } from '@/lib/services/interview';
import { supabase } from '@/lib/supabase';
import type { InterviewRecord } from '@/lib/types';

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  phone: '电话面试',
  technical: '专业面试',
  hr: 'HR 面试',
  final: '终面',
  other: '其他',
};

type ProjectContext = {
  jobId: string;
  companyName: string;
  jobTitle: string;
};

export default function InterviewReviewPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="p-8 max-w-5xl mx-auto">
            <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </AppLayout>
      }
    >
      <InterviewReviewContent />
    </Suspense>
  );
}

function InterviewReviewContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [record, setRecord] = useState<InterviewRecord | null>(null);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id]);

  const loadRecord = async () => {
    setLoading(true);
    try {
      const data = await getInterviewRecord(id);
      if (!data || data.user_id !== user!.id) {
        toast({ title: '面试记录不存在', variant: 'destructive' });
        router.push('/interviews');
        return;
      }

      setRecord(data);
      await loadProjectContext(data);
    } catch (error: any) {
      toast({ title: '加载失败', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectContext = async (interviewRecord: InterviewRecord) => {
    const jobIdFromUrl = searchParams.get('jobId');
    const resumeVersionId = interviewRecord.resume_version_id;

    if (jobIdFromUrl) {
      const { data: job } = await supabase
        .from('job_descriptions')
        .select('id, company_name, job_title')
        .eq('id', jobIdFromUrl)
        .maybeSingle();

      if (job) {
        setProjectContext({
          jobId: job.id,
          companyName: job.company_name,
          jobTitle: job.job_title,
        });
        return;
      }
    }

    if (!resumeVersionId) return;

    const { data: resume } = await supabase
      .from('resume_versions')
      .select('job_description_id')
      .eq('id', resumeVersionId)
      .maybeSingle();

    if (!resume?.job_description_id) return;

    const { data: job } = await supabase
      .from('job_descriptions')
      .select('id, company_name, job_title')
      .eq('id', resume.job_description_id)
      .maybeSingle();

    if (job) {
      setProjectContext({
        jobId: job.id,
        companyName: job.company_name,
        jobTitle: job.job_title,
      });
    }
  };

  const returnTarget = useMemo(() => {
    const source = searchParams.get('from');
    if (source === 'interviews') {
      return { href: '/interviews', label: '返回面试中心', fromProject: false };
    }
    if (source === 'project' && projectContext) {
      return { href: `/jobs/${projectContext.jobId}`, label: '返回求职项目', fromProject: true };
    }
    if (projectContext) {
      return { href: `/jobs/${projectContext.jobId}`, label: '返回求职项目', fromProject: true };
    }
    return { href: '/interviews', label: '返回面试中心', fromProject: false };
  }, [projectContext, searchParams]);

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这条面试记录吗？')) return;

    setDeleting(true);
    try {
      await deleteInterviewRecord(id);
      toast({ title: '已删除面试记录' });
      router.push(returnTarget.fromProject ? returnTarget.href : '/interviews');
    } catch (error: any) {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!record) return null;

  const breadcrumbItems = returnTarget.fromProject && projectContext
    ? [
        { label: '工作台', href: '/dashboard' },
        { label: '求职项目', href: `/jobs/${projectContext.jobId}` },
        { label: '面试复盘' },
      ]
    : [
        { label: '工作台', href: '/dashboard' },
        { label: '面试中心', href: '/interviews' },
        { label: '面试复盘' },
      ];

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <PageBreadcrumb items={breadcrumbItems} />

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href={returnTarget.href} className="mb-4 inline-flex text-sm text-blue-600 hover:underline">
              {returnTarget.label}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">面试复盘</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-500">
              <div className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {record.company_name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(record.interview_date).toLocaleDateString('zh-CN')}
              </div>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                {INTERVIEW_TYPE_LABELS[record.interview_type] || record.interview_type}
              </span>
              {projectContext && (
                <span className="text-sm text-gray-400">
                  {projectContext.companyName} · {projectContext.jobTitle}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                删除中...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">整体表现</h3>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${star <= record.overall_rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="text-lg font-medium text-gray-900 ml-2">{record.overall_rating}/5</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">面试问题与回答</h3>
            <p className="text-sm text-gray-500 mb-6">共 {record.questions.length} 个问题</p>
            <div className="space-y-6">
              {record.questions.map((question, index) => (
                <div key={index} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                  <div className="flex items-start mb-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-medium mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
                      {question.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= question.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-10 space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">我的回答</h5>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {question.my_answer || '（未记录）'}
                      </p>
                    </div>
                    {question.feedback && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">面试官反馈</h5>
                        <p className="text-gray-900">{question.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {record.improvements && record.improvements.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">AI 改进建议</h3>
              <p className="text-sm text-gray-500 mb-4">基于你的回答，AI 给出以下改进建议。</p>
              <ul className="space-y-3">
                {record.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-900">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {record.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">备注</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
