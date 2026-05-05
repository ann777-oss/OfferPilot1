'use client';

import { useRouter } from 'next/navigation';
import { BadgeCheck, BookOpen, Check, FileText, MessageSquare } from 'lucide-react';
import type { ProjectProgress } from '@/lib/types';

interface ProjectTimelineProps {
  jobId: string;
  progress: ProjectProgress;
}

export default function ProjectTimeline({ jobId, progress }: ProjectTimelineProps) {
  const router = useRouter();

  const steps = [
    {
      id: 'resume',
      label: '定制简历',
      icon: FileText,
      completed: progress.hasResume,
      onClick: () => {
        if (progress.hasResume && progress.resumeId) {
          router.push(`/resumes/${progress.resumeId}`);
          return;
        }

        router.push(`/jobs/${jobId}/analysis`);
      },
    },
    {
      id: 'interview-prep',
      label: '面试准备',
      icon: BookOpen,
      completed: progress.hasInterviewPrep,
      onClick: () => {
        if (!progress.hasResume) {
          alert('请先生成项目简历');
          return;
        }

        if (progress.resumeId) {
          router.push(`/resumes/${progress.resumeId}/interview-prep`);
        }
      },
    },
    {
      id: 'interview-review',
      label: '面试复盘',
      icon: MessageSquare,
      completed: progress.hasInterviewRecord,
      onClick: () => {
        if (!progress.hasInterviewPrep) {
          alert('请先生成面试准备材料');
          return;
        }

        if (progress.interviewRecordId) {
          const target =
            progress.interviewRecordStatus === 'completed'
              ? `/interviews/${progress.interviewRecordId}/review?from=project&jobId=${jobId}`
              : `/interviews/${progress.interviewRecordId}/edit?from=project&jobId=${jobId}`;
          router.push(target);
          return;
        }

        alert('当前项目还没有面试复盘草稿，请先从面试准备页生成准备材料。');
      },
    },
    {
      id: 'offer',
      label: 'Offer 管理',
      icon: BadgeCheck,
      completed: progress.hasOffer,
      onClick: () => {
        router.push(`/jobs/${jobId}#offer-info`);
      },
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-sm font-semibold text-gray-900">项目进度</h3>

      <div className="mx-auto w-full max-w-5xl px-2">
        <div className="grid grid-cols-4 items-start">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.completed;
            const isNext = !isCompleted && (index === 0 || steps[index - 1].completed);
            const lineCompleted = index < steps.length - 1 && step.completed;

            return (
              <div key={step.id} className="relative flex justify-center">
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-5 h-0.5 w-full px-14">
                    <div className={`h-full w-full ${lineCompleted ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  </div>
                )}

                <button onClick={step.onClick} className="group relative z-10 flex w-28 flex-col items-center">
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all group-hover:scale-110 ${
                      isCompleted
                        ? 'border-blue-600 bg-blue-600'
                        : isNext
                          ? 'border-blue-600 bg-white'
                          : 'border-gray-300 bg-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isCompleted ? 'text-white' : isNext ? 'text-blue-600' : 'text-gray-400'}`} />
                    {isCompleted && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-emerald-500">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </div>

                  <span className={`mt-3 text-center text-sm font-medium ${isCompleted || isNext ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                  <span className={`mt-1 text-xs ${isCompleted ? 'text-blue-600' : isNext ? 'text-amber-600' : 'text-gray-400'}`}>
                    {isCompleted ? '已完成' : isNext ? '进行中' : '未开始'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-7 border-t border-gray-100 pt-6">
        <p className="text-center text-xs text-gray-500">点击节点可快速进入对应页面</p>
      </div>
    </div>
  );
}
