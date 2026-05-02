'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  saveInterviewRecord,
  analyzeInterviewFeedback
} from '@/lib/services/interview';
import type { InterviewQuestionRecord } from '@/lib/types';

export default function NewInterviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState<string>('technical');
  const [questions, setQuestions] = useState<InterviewQuestionRecord[]>([
    { question: '', my_answer: '', feedback: '', rating: undefined }
  ]);
  const [overallRating, setOverallRating] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiImprovements, setAiImprovements] = useState<string[]>([]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', my_answer: '', feedback: '', rating: undefined }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof InterviewQuestionRecord, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleAnalyze = async () => {
    if (!companyName || questions.length === 0) {
      toast({ title: '请填写公司名称和至少一个问题', variant: 'destructive' });
      return;
    }

    setAnalyzing(true);
    try {
      const { analysis, improvements } = await analyzeInterviewFeedback(
        questions,
        companyName,
        interviewType,
        ''
      );

      setAiImprovements(improvements);
      toast({ title: 'AI分析完成！' });
    } catch (error: any) {
      toast({
        title: 'AI分析失败',
        description: error.message,
        variant: 'destructive'
      });
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
      const record = await saveInterviewRecord(
        user.id,
        null,
        companyName,
        interviewDate,
        interviewType,
        questions,
        overallRating,
        aiImprovements,
        notes
      );

      toast({ title: '面试复盘已保存！' });
      router.push(`/interviews/${record.id}/review`);
    } catch (error: any) {
      toast({
        title: '保存失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/interviews"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            返回面试记录
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">新建面试复盘</h1>
          <p className="text-gray-500">
            记录面试问题和你的回答，AI将帮你分析并给出改进建议
          </p>
        </div>

        <div className="space-y-6">
          {/* 基本信息 */}
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
                    <SelectItem value="technical">技术面试</SelectItem>
                    <SelectItem value="hr">HR面试</SelectItem>
                    <SelectItem value="final">终面</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 面试问题 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">面试问题</h3>
                <p className="text-sm text-gray-500 mt-1">记录面试官的问题和你的回答</p>
              </div>
              <Button onClick={handleAddQuestion} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                添加问题
              </Button>
            </div>
            <div className="space-y-4">
              {questions.map((q, index) => (
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
                      value={q.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      placeholder="面试官问了什么？"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">我的回答</Label>
                    <Textarea
                      value={q.my_answer}
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
                        value={q.feedback || ''}
                        onChange={(e) => handleQuestionChange(index, 'feedback', e.target.value)}
                        placeholder="面试官有什么反馈？"
                        className="border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">自我评分（可选）</Label>
                      <Select
                        value={q.rating?.toString() || ''}
                        onValueChange={(v) => handleQuestionChange(index, 'rating', parseInt(v))}
                      >
                        <SelectTrigger className="border-gray-300">
                          <SelectValue placeholder="选择评分" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5分 - 非常好</SelectItem>
                          <SelectItem value="4">4分 - 较好</SelectItem>
                          <SelectItem value="3">3分 - 一般</SelectItem>
                          <SelectItem value="2">2分 - 较差</SelectItem>
                          <SelectItem value="1">1分 - 很差</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 整体评价 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">整体评价</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">整体表现评分</Label>
                <Select
                  value={overallRating.toString()}
                  onValueChange={(v) => setOverallRating(parseInt(v))}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5分 - 非常好</SelectItem>
                    <SelectItem value="4">4分 - 较好</SelectItem>
                    <SelectItem value="3">3分 - 一般</SelectItem>
                    <SelectItem value="2">2分 - 较差</SelectItem>
                    <SelectItem value="1">1分 - 很差</SelectItem>
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

          {/* AI改进建议 */}
          {aiImprovements.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">AI改进建议</h3>
              <ul className="space-y-2">
                {aiImprovements.map((improvement, i) => (
                  <li key={i} className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-900">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleAnalyze}
              disabled={analyzing || !companyName || questions.length === 0}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI分析
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
