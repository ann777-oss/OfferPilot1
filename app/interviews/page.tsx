'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar, CheckCircle, Edit, FileText, Plus, Sparkles, Star } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { InterviewRecord } from '@/lib/types';

interface RelationResume {
  id: string;
  name: string;
}

interface RelationJob {
  id?: string;
  company_name: string;
  job_title: string;
}

interface InterviewPackWithDetails {
  id: string;
  created_at: string;
  resume_versions?: RelationResume[] | RelationResume | null;
  job_descriptions?: RelationJob[] | RelationJob | null;
  content: any;
}

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  phone: '电话面试',
  technical: '技术面试',
  hr: 'HR 面试',
  final: '终面',
  other: '其他',
};

function pickFirst<T>(value?: T[] | T | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function InterviewsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [packs, setPacks] = useState<InterviewPackWithDetails[]>([]);
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preps' | 'draft' | 'completed'>('preps');

  useEffect(() => {
    if (!user) return;
    loadInterviewCenter();
  }, [user?.id]);

  const loadInterviewCenter = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [packsResult, recordsResult] = await Promise.all([
        supabase
          .from('interview_packs')
          .select(`
            id,
            created_at,
            resume_version_id,
            job_description_id,
            content,
            resume_versions:resume_version_id (
              id,
              name
            ),
            job_descriptions:job_description_id (
              id,
              company_name,
              job_title
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('interview_records')
          .select('*')
          .eq('user_id', user.id)
          .order('interview_date', { ascending: false }),
      ]);

      if (packsResult.error) throw packsResult.error;
      if (recordsResult.error) throw recordsResult.error;

      setPacks((packsResult.data ?? []) as unknown as InterviewPackWithDetails[]);
      setRecords((recordsResult.data ?? []) as InterviewRecord[]);
    } catch (error) {
      console.error('加载面试中心失败:', error);
      setPacks([]);
      setRecords([]);
      toast({ title: '加载面试中心失败', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const draftRecords = records.filter((record) => record.status === 'draft');
  const completedRecords = records.filter((record) => record.status === 'completed');

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-6xl p-8">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-100" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl p-8">
        <PageHeader
          title="面试中心"
          description="统一管理面试准备材料、待完善复盘和已完成面试记录。"
          actions={
            <Button onClick={() => router.push('/interviews/new')} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              新建面试复盘
            </Button>
          }
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preps' | 'draft' | 'completed')} className="space-y-6">
          <TabsList className="border border-gray-200 bg-white">
            <TabsTrigger value="preps" className="data-[state=active]:bg-gray-100">
              <BookOpen className="mr-2 h-4 w-4" />
              面试准备 ({packs.length})
            </TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-gray-100">
              <Edit className="mr-2 h-4 w-4" />
              待完善复盘 ({draftRecords.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-gray-100">
              <CheckCircle className="mr-2 h-4 w-4" />
              已完成复盘 ({completedRecords.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preps">
            {packs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">还没有面试准备材料</h3>
                <p className="mb-6 text-gray-500">在求职项目里生成简历后，可以继续生成该岗位专属的面试准备材料。</p>
                <Button onClick={() => router.push('/jobs')} className="bg-blue-600 hover:bg-blue-700">
                  <Sparkles className="mr-2 h-4 w-4" />
                  查看求职项目
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {packs.map((pack) => (
                  <InterviewPackCard key={pack.id} pack={pack} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="draft">
            {draftRecords.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Edit className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">没有待完善的面试复盘</h3>
                <p className="mb-6 text-gray-500">生成面试准备后，系统通常会自动为对应项目创建一条待补充的复盘草稿。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {draftRecords.map((record) => (
                  <RecordCard key={record.id} record={record} isDraft />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedRecords.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">还没有完成的面试复盘</h3>
                <p className="mb-6 text-gray-500">补全问题、回答和复盘内容后，这里会沉淀所有已完成的面试经验。</p>
                <Button onClick={() => router.push('/interviews/new')} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  创建第一条面试复盘
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {completedRecords.map((record) => (
                  <RecordCard key={record.id} record={record} isDraft={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function InterviewPackCard({ pack }: { pack: InterviewPackWithDetails }) {
  const resume = pickFirst(pack.resume_versions);
  const job = pickFirst(pack.job_descriptions);
  const resumeName = resume?.name || '未命名简历';
  const companyName = job?.company_name || '未知公司';
  const jobTitle = job?.job_title || '未知职位';
  const resumeId = resume?.id;
  const jobId = job?.id;

  const questionCount =
    (pack.content?.common_questions?.length || 0) +
    (pack.content?.technical_questions?.length || 0) +
    (pack.content?.behavioral_questions?.length || 0);

  return (
    <Link href={jobId ? `/jobs/${jobId}` : resumeId ? `/resumes/${resumeId}/interview-prep` : '#'}>
      <div className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-md">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-1 text-base font-semibold text-gray-900">{companyName}</h3>
            <p className="mb-2 text-sm text-gray-600">{jobTitle}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {resumeName}
              </div>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">{questionCount} 个面试问题</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            生成于 {new Date(pack.created_at).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>
    </Link>
  );
}

function RecordCard({ record, isDraft }: { record: InterviewRecord; isDraft: boolean }) {
  return (
    <Link href={isDraft ? `/interviews/${record.id}/edit?from=interviews` : `/interviews/${record.id}/review?from=interviews`}>
      <div className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-md">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{record.company_name}</h3>
              {isDraft && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">待完善</span>}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(record.interview_date).toLocaleDateString('zh-CN')}
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {INTERVIEW_TYPE_LABELS[record.interview_type] || record.interview_type}
              </span>
            </div>
          </div>
          {!isDraft && (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${star <= record.overall_rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          {isDraft ? (
            <div className="text-sm text-gray-600">点击继续完善这条面试复盘</div>
          ) : (
            <>
              <div className="text-sm text-gray-600">{record.questions.length} 个问题</div>
              {record.improvements && record.improvements.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-gray-900">AI 建议：</span>
                  <span className="text-gray-600">
                    {record.improvements[0].substring(0, 50)}
                    {record.improvements[0].length > 50 ? '...' : ''}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
