'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageBreadcrumb from '@/components/common/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { analyzeInterviewFeedback } from '@/lib/services/interview';
import { supabase } from '@/lib/supabase';
import type { InterviewQuestionRecord, InterviewRecord } from '@/lib/types';

type ProjectContext = {
  jobId: string;
  companyName: string;
  jobTitle: string;
};

export default function EditInterviewPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="p-8 max-w-4xl mx-auto">
            <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
            <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </AppLayout>
      }
    >
      <EditInterviewContent />
    </Suspense>
  );
}

function EditInterviewContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState<string>('technical');
  const [questions, setQuestions] = useState<InterviewQuestionRecord[]>([
    { question: '', my_answer: '', feedback: '', rating: undefined },
  ]);
  const [overallRating, setOverallRating] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiImprovements, setAiImprovements] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !id) return;
    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id]);

  const loadRecord = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_records')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ title: '记录不存在', variant: 'destructive' });
        router.push('/interviews');
        return;
      }

      const record = data as InterviewRecord;
      setCompanyName(record.company_name);
      setInterviewDate(record.interview_date);
      setInterviewType(record.interview_type);
      setQuestions(record.questions.length > 0 ? record.questions : [{ question: '', my_answer: '', feedback: '', rating: undefined }]);
      setOverallRating(record.overall_rating);
      setNotes(record.notes || '');
      setAiImprovements(record.improvements || []);
      await loadProjectContext(record);
    } catch (error: any) {
      toast({ title: '加载失败', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectContext = async (record: InterviewRecord) => {
    const jobIdFromUrl = searchParams.get('jobId');

    if (jobIdFromUrl) {
      const { data: job } = await supabase
        .from('job_descriptions')
        .select('id, company_name, job_title')
        .eq('id', jobIdFromUrl)
        .maybeSingle();

      if (job) {
        setProjectContext({ jobId: job.id, companyName: job.company_name, jobTitle: job.job_title });
        return;
      }
    }

    if (!record.resume_version_id) return;

    const { data: resume } = await supabase
      .from('resume_versions')
      .select('job_description_id')
      .eq('id', record.resume_version_id)
      .maybeSingle();

    if (!resume?.job_description_id) return;

    const { data: job } = await supabase
      .from('job_descriptions')
      .select('id, company_name, job_title')
      .eq('id', resume.job_description_id)
      .maybeSingle();

    if (job) {
      setProjectContext({ jobId: job.id, companyName: job.company_name, jobTitle: job.job_title });
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

  const reviewUrl = useMemo(() => {
    const source = searchParams.get('from');
    if (source === 'project' && projectContext) {
      return `/interviews/${id}/review?from=project&jobId=${projectContext.jobId}`;
    }
    if (source === 'interviews') {
      return `/interviews/${id}/review?from=interviews`;
    }
    if (projectContext) {
      return `/interviews/${id}/review?from=project&jobId=${projectContext.jobId}`;
    }
    return `/interviews/${id}/review?from=interviews`;
  }, [id, projectContext, searchParams]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', my_answer: '', feedback: '', rating: undefined }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof InterviewQuestionRecord, value: any) => {
    const nextQuestions = [...questions];
    nextQuestions[index] = { ...nextQuestions[index], [field]: value };
    setQuestions(nextQuestions);
  };

  const handleAnalyze = async () => {
    if (!companyName || questions.length === 0) {
      toast({ title: '请填写公司名称和至少一个问题', variant: 'destructive' });
      return;
    }

    setAnalyzing(true);
    try {
      const { improvements } = await analyzeInterviewFeedback(questions, companyName, interviewType, '');
      setAiImprovements(improvements);
      toast({ title: 'AI 分析完成' });
    } catch (error: any) {
      toast({ title: 'AI 分析失败', description: error.message, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !companyName || !interviewDate || questions.length === 0) {
      toast({ title: '请填写必填字段', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('interview_records')
        .update({
          company_name: companyName,
          interview_date: interviewDate,
          interview_type: interviewType,
          questions,
          overall_rating: overallRating,
          improvements: aiImprovements,
          notes,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: '面试复盘已保存' });
      router.push(reviewUrl);
    } catch (error: any) {
      toast({ title: '保存失败', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  const breadcrumbItems = returnTarget.fromProject && projectContext
    ? [
        { label: '工作台', href: '/dashboard' },
        { label: '求职项目', href: `/jobs/${projectContext.jobId}` },
        { label: '填写面试复盘' },
      ]
    : [
        { label: '工作台', href: '/dashboard' },
        { label: '面试中心', href: '/interviews' },
        { label: '填写面试复盘' },
      ];

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <PageBreadcrumb items={breadcrumbItems} />

        <div className="mb-6">
          <Link href={returnTarget.href} className="mb-4 inline-flex text-sm text-blue-600 hover:underline">
            {returnTarget.label}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">填写面试复盘</h1>
          <p className="text-gray-500">
            记录面试问题和你的回答，AI 将帮助你分析表现并给出改进建议。
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">基本信息</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                    公司名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="例如：字节跳动"
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                    面试日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="border-gray-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-gray-700">面试类型</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">电话面试</SelectItem>
                    <SelectItem value="technical">专业面试</SelectItem>
                    <SelectItem value="hr">HR 面试</SelectItem>
                    <SelectItem value="final">终面</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">面试问题</h3>
                <p className="text-sm text-gray-500 mt-1">记录面试官的问题和你的回答。</p>
              </div>
              <Button onClick={handleAddQuestion} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                添加问题
              </Button>
            </div>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">问题 {index + 1}</h4>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(index)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">问题内容</Label>
                    <Input
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      placeholder="面试官问了什么？"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">我的回答</Label>
                    <Textarea
                      value={question.my_answer}
                      onChange={(e) => handleQuestionChange(index, 'my_answer', e.target.value)}
                      placeholder="你是怎么回答的？"
                      rows={4}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">面试官反馈（可选）</Label>
                      <Input
                        value={question.feedback || ''}
                        onChange={(e) => handleQuestionChange(index, 'feedback', e.target.value)}
                        placeholder="面试官有什么反馈？"
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">自我评分（可选）</Label>
                      <Select
                        value={question.rating?.toString() || ''}
                        onValueChange={(value) => handleQuestionChange(index, 'rating', parseInt(value))}
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="选择评分" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 分 - 非常好</SelectItem>
                          <SelectItem value="4">4 分 - 较好</SelectItem>
                          <SelectItem value="3">3 分 - 一般</SelectItem>
                          <SelectItem value="2">2 分 - 较差</SelectItem>
                          <SelectItem value="1">1 分 - 很差</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">整体评价</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">整体表现评分</Label>
                <Select value={overallRating.toString()} onValueChange={(value) => setOverallRating(parseInt(value))}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 分 - 非常好</SelectItem>
                    <SelectItem value="4">4 分 - 较好</SelectItem>
                    <SelectItem value="3">3 分 - 一般</SelectItem>
                    <SelectItem value="2">2 分 - 较差</SelectItem>
                    <SelectItem value="1">1 分 - 很差</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">其他备注</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="记录其他想法、感受或需要注意的地方..."
                  rows={4}
                  className="border-gray-300"
                />
              </div>
            </div>
          </div>

          {aiImprovements.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">AI 改进建议</h3>
              <ul className="space-y-2">
                {aiImprovements.map((improvement, index) => (
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

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleAnalyze} disabled={analyzing || !companyName || questions.length === 0}>
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI 分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 分析
                </>
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !companyName || !interviewDate || questions.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存复盘'
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
