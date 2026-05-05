'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Building,
  Code,
  HelpCircle,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  createDraftInterviewRecord,
  generateInterviewPack,
  getInterviewPack,
  saveInterviewPack,
} from '@/lib/services/interview';
import type {
  InterviewPack,
  InterviewQuestion,
  JobDescription,
  ResumeVersion,
} from '@/lib/types';

export default function InterviewPrepPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [job, setJob] = useState<JobDescription | null>(null);
  const [interviewPack, setInterviewPack] = useState<InterviewPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: resumeData } = await supabase
        .from('resume_versions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!resumeData) {
        toast({ title: '简历不存在', variant: 'destructive' });
        router.push('/resumes');
        return;
      }

      setResume(resumeData as ResumeVersion);

      if (resumeData.job_description_id) {
        const { data: jobData } = await supabase
          .from('job_descriptions')
          .select('*')
          .eq('id', resumeData.job_description_id)
          .maybeSingle();
        setJob(jobData as JobDescription);
      }

      const existingPack = await getInterviewPack(id);
      setInterviewPack(existingPack);
    } catch (error: any) {
      toast({ title: '加载失败', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!resume || !job || !user) return;

    setGenerating(true);
    try {
      const content = await generateInterviewPack(resume.content, job.analysis, job);
      const savedPack = await saveInterviewPack(user.id, resume.id, job.id, content);

      setInterviewPack(savedPack);

      try {
        await createDraftInterviewRecord(
          user.id,
          resume.id,
          job.company_name,
          job.job_title,
          'technical'
        );
        toast({
          title: '面试准备材料生成成功',
          description: '已自动创建面试复盘草稿，可在面试中心查看。',
        });
      } catch (draftError) {
        console.error('创建面试复盘草稿失败:', draftError);
        toast({ title: '面试准备材料生成成功' });
      }
    } catch (error: any) {
      toast({
        title: '生成失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 max-w-6xl mx-auto">
          <div className="h-8 w-64 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div className="p-8 max-w-4xl mx-auto">
          <PageBreadcrumb
            items={[
              { label: '工作台', href: '/dashboard' },
              { label: '求职项目', href: '/jobs' },
              { label: '简历详情', href: `/resumes/${id}` },
              { label: '面试准备' },
            ]}
          />
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              无法生成面试准备材料
            </h3>
            <p className="text-gray-500 mb-6">
              这份简历没有关联求职项目，无法基于岗位信息生成面试准备材料。
            </p>
            <Button onClick={() => router.push(`/resumes/${id}`)} className="bg-blue-600 hover:bg-blue-700">
              返回简历详情
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const projectHref = `/jobs/${job.id}`;

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <PageBreadcrumb
          items={[
            { label: '工作台', href: '/dashboard' },
            { label: '求职项目', href: projectHref },
            { label: '简历详情', href: `/resumes/${id}` },
            { label: '面试准备' },
          ]}
        />

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">面试准备</h1>
            <p className="text-gray-500">
              {job.company_name} · {job.job_title}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" asChild>
              <Link href={projectHref}>返回求职项目</Link>
            </Button>
            {!interviewPack && (
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI 生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成面试准备材料
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {!interviewPack ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">开始准备面试</h3>
            <p className="text-gray-500 mb-6">
              AI 将基于你的简历和职位描述，生成个性化的面试准备材料。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                icon={<BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />}
                title="常见问题"
                description="整理常见面试问题，并给出基于你真实经历的参考回答。"
              />
              <FeatureCard
                icon={<Code className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />}
                title="专业问题"
                description="围绕岗位要求拆解专业问题、能力考察点和回答思路。"
              />
              <FeatureCard
                icon={<Users className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />}
                title="行为问题"
                description="用 STAR 结构组织校园经历、项目经历和协作经历。"
              />
              <FeatureCard
                icon={<HelpCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />}
                title="反问环节"
                description="准备高质量反问问题，帮助你判断岗位和团队是否适合。"
              />
            </div>
          </div>
        ) : (
          <Tabs defaultValue="common" className="space-y-6">
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="common" className="data-[state=active]:bg-gray-100">
                <BookOpen className="w-4 h-4 mr-2" />
                常见问题
              </TabsTrigger>
              <TabsTrigger value="technical" className="data-[state=active]:bg-gray-100">
                <Code className="w-4 h-4 mr-2" />
                专业问题
              </TabsTrigger>
              <TabsTrigger value="behavioral" className="data-[state=active]:bg-gray-100">
                <Users className="w-4 h-4 mr-2" />
                行为问题
              </TabsTrigger>
              <TabsTrigger value="reverse" className="data-[state=active]:bg-gray-100">
                <HelpCircle className="w-4 h-4 mr-2" />
                反问环节
              </TabsTrigger>
              <TabsTrigger value="company" className="data-[state=active]:bg-gray-100">
                <Building className="w-4 h-4 mr-2" />
                公司背景
              </TabsTrigger>
            </TabsList>

            <TabsContent value="common" className="space-y-4">
              {interviewPack.content.common_questions?.map((q, i) => (
                <QuestionCard key={i} question={q} index={i + 1} />
              ))}
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              {interviewPack.content.technical_questions?.map((q, i) => (
                <QuestionCard key={i} question={q} index={i + 1} />
              ))}
            </TabsContent>

            <TabsContent value="behavioral" className="space-y-4">
              {interviewPack.content.behavioral_questions?.map((q, i) => (
                <QuestionCard key={i} question={q} index={i + 1} />
              ))}
            </TabsContent>

            <TabsContent value="reverse">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">反问环节建议</h3>
                <p className="text-gray-500 mb-6">
                  这些问题可以帮助你更好地了解公司、团队和岗位预期。
                </p>
                <ul className="space-y-3">
                  {interviewPack.content.reverse_questions?.map((q, i) => (
                    <li key={i} className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-900">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="company">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">公司背景速查</h3>
                <p className="text-gray-500 mb-4">快速了解公司基本情况。</p>
                <p className="text-gray-900 leading-relaxed">
                  {interviewPack.content.company_background}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
      {icon}
      <div>
        <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function QuestionCard({ question, index }: { question: InterviewQuestion; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start flex-1">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-medium mr-3 flex-shrink-0">
            {index}
          </span>
          <h4 className="text-base font-semibold text-gray-900">{question.question}</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAnswer(!showAnswer)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          {showAnswer ? '隐藏答案' : '查看答案'}
        </Button>
      </div>
      {showAnswer && (
        <div className="ml-10 space-y-3">
          <div>
            <h5 className="text-sm font-medium text-gray-500 mb-2">参考答案</h5>
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
              {question.answer}
            </p>
          </div>
          {question.tips && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-amber-900 mb-2">回答技巧</h5>
              <p className="text-sm text-amber-800">{question.tips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
