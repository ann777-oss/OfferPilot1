'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TourStep = {
  title: string;
  description: string;
  selector?: string;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOUR_VERSION = 'v2';

interface NewUserTourProps {
  userId: string;
}

export default function NewUserTour({ userId }: NewUserTourProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  const storageKey = useMemo(() => `resume-tailor:onboarding:${TOUR_VERSION}:${userId}`, [userId]);

  const steps = useMemo<TourStep[]>(
    () => [
      {
        title: '这是你的求职操作台',
        description:
          'OfferPilot 不是只生成一份简历的工具，而是围绕每一个岗位申请，陪你推进从准备资料、定制简历、准备面试到管理 Offer 的完整流程。',
        selector: '[data-tour="app-logo"]',
      },
      {
        title: '先完善职业档案',
        description:
          '职业档案是你的基础资料库。教育背景、校园经历、项目、技能和证书越完整，后续生成的简历和面试准备材料就越贴合真实经历。',
        selector: '[data-tour="nav-profile"]',
      },
      {
        title: '用求职项目管理每个岗位',
        description:
          '每投一个公司或岗位，都建议新建一个求职项目。项目里会保存 JD 分析、投递信息、项目状态和后续所有推进记录。',
        selector: '[data-tour="nav-jobs"]',
      },
      {
        title: '围绕项目产出简历',
        description:
          '简历中心会沉淀你为不同岗位生成的简历版本。你可以回看、修改，也可以继续从具体求职项目进入对应简历。',
        selector: '[data-tour="nav-resumes"]',
      },
      {
        title: '面试集中到面试中心',
        description:
          '面试中心把面试准备材料、待完善复盘和已完成复盘放在一起，方便你按项目持续准备和复盘。',
        selector: '[data-tour="nav-interviews"]',
      },
      {
        title: 'Offer 是求职项目的最后一步',
        description:
          '当项目推进到 Offer 阶段，可以在 Offer 管理里记录薪资、城市、部门、工作制、转正机会和回复截止时间，并进行横向对比。',
        selector: '[data-tour="nav-offers"]',
      },
      {
        title: '建议的使用顺序',
        description:
          '推荐路径是：先完善职业档案，再新建求职项目，之后围绕项目依次推进简历、面试和 Offer。每天回到工作台查看下一步该做什么。',
        selector: '[data-tour="nav-dashboard"]',
      },
    ],
    []
  );

  const closeTour = useCallback(
    (finished: boolean) => {
      setOpen(false);
      setHighlightRect(null);
      if (finished) {
        window.localStorage.setItem(storageKey, 'done');
      }
    },
    [storageKey]
  );

  const updateHighlight = useCallback(() => {
    const selector = steps[currentStep]?.selector;
    if (!selector) {
      setHighlightRect(null);
      return;
    }

    const element = document.querySelector(selector);
    if (!element) {
      setHighlightRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setHighlightRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [currentStep, steps]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      setOpen(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;

    updateHighlight();

    const handleWindowChange = () => updateHighlight();
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [open, currentStep, updateHighlight]);

  if (!open) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const cardTop = highlightRect
    ? Math.min(window.innerHeight - 260, Math.max(24, highlightRect.top + highlightRect.height + 18))
    : Math.max(40, window.innerHeight / 2 - 130);
  const cardLeft = highlightRect
    ? Math.min(window.innerWidth - 400, Math.max(24, highlightRect.left))
    : Math.max(24, window.innerWidth / 2 - 190);

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-950/55" />

      {highlightRect && (
        <div
          className="absolute rounded-2xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)] transition-all duration-200"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
          }}
        />
      )}

      <div
        className="absolute w-[min(380px,calc(100vw-32px))] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        style={{ top: cardTop, left: cardLeft }}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600">新手引导</p>
              <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => closeTour(true)}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭引导"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-6 text-slate-600">{step.description}</p>

        <div className="mt-4 flex items-center gap-1.5">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${index === currentStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200'}`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            第 {currentStep + 1} 步，共 {steps.length} 步
          </span>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={() => setCurrentStep((prev) => prev - 1)}>
                上一步
              </Button>
            )}
            {!isLastStep ? (
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setCurrentStep((prev) => prev + 1)}>
                下一步
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    closeTour(true);
                    router.push('/profile');
                  }}
                >
                  完善档案
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => {
                    closeTour(true);
                    router.push('/jobs');
                  }}
                >
                  去看求职项目
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
