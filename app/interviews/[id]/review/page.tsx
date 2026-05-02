'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Calendar, Building, Star, Trash2, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getInterviewRecord,
  deleteInterviewRecord
} from '@/lib/services/interview';
import type { InterviewRecord } from '@/lib/types';

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  phone: '电话面试',
  technical: '技术面试',
  hr: 'HR面试',
  final: '终面',
  other: '其他'
};

export default function InterviewReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [record, setRecord] = useState<InterviewRecord | null>(null);
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
      if (!data) {
        toast({ title: '面试记录不存在', variant: 'destructive' });
        router.push('/interviews');
        return;
      }
      setRecord(data);
    } catch (error: any) {
      toast({
        title: '加载失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条面试记录吗？')) return;

    setDeleting(true);
    try {
      await deleteInterviewRecord(id);
      toast({ title: '已删除面试记录' });
      router.push('/interviews');
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive'
      });
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

  if (!record) {
    return null;
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/interviews"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            返回面试记录
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">面试复盘</h1>
              <div className="flex items-center gap-4 text-gray-500">
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
        </div>

        <div className="space-y-6">
          {/* 整体评分 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">整体表现</h3>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= record.overall_rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-lg font-medium text-gray-900 ml-2">
                {record.overall_rating}/5
              </span>
            </div>
          </div>

          {/* 面试问题 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">面试问题与回答</h3>
            <p className="text-sm text-gray-500 mb-6">共 {record.questions.length} 个问题</p>
            <div className="space-y-6">
              {record.questions.map((q, index) => (
                <div key={index} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                  <div className="flex items-start mb-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-medium mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">{q.question}</h4>
                      {q.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= q.rating!
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-10 space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">
                        我的回答
                      </h5>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {q.my_answer || '（未记录）'}
                      </p>
                    </div>
                    {q.feedback && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                          面试官反馈
                        </h5>
                        <p className="text-gray-900">{q.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI改进建议 */}
          {record.improvements && record.improvements.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">AI改进建议</h3>
              <p className="text-sm text-gray-500 mb-4">
                基于你的回答，AI给出以下改进建议
              </p>
              <ul className="space-y-3">
                {record.improvements.map((improvement, i) => (
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

          {/* 备注 */}
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
