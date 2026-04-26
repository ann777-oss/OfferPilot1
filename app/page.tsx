'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, CircleCheck as CheckCircle2, Zap, Shield, FileText, Upload, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: '绝不虚构内容',
    description: '我们仅使用您的真实经历和成就，绝不编造内容，100% 真实可信。',
  },
  {
    icon: Zap,
    title: '即时 ATS 优化',
    description: 'AI 从任意职位描述中识别 ATS 关键词，并自然地融入您的简历。',
  },
  {
    icon: FileText,
    title: '一份核心档案',
    description: '一次录入完整职业经历，为每次求职生成无限量定制简历。',
  },
  {
    icon: Upload,
    title: '粘贴或上传职位描述',
    description: '直接粘贴职位文本，或上传截图，我们的 OCR 引擎自动提取内容。',
  },
];

const steps = [
  { number: '01', title: '创建职业核心档案', description: '一次性录入工作经历、教育背景、项目经验、技能与成就。' },
  { number: '02', title: '粘贴或上传职位描述', description: '输入职位描述，AI 分析关键词、岗位要求和 ATS 术语。' },
  { number: '03', title: '获得定制化简历', description: '我们从档案中筛选并改写与岗位最相关的内容。' },
  { number: '04', title: '编辑、保存并导出', description: '微调生成的简历，保存版本，下载为整洁的 PDF 文件。' },
];

const testimonials = [
  {
    quote: '使用 ResumeTailor AI 后，我的简历回复率从 2% 提升到了 18%，专属定制简历的效果有目共睹。',
    author: 'Priya S.',
    role: '产品经理',
  },
  {
    quote: '以前每份申请要花 3 小时，现在 10 分钟就能搞定，质量还更高。',
    author: 'Marcus L.',
    role: '高级软件工程师',
  },
  {
    quote: '它绝不虚构内容，这让我很放心。每一条都是我真实的经历。',
    author: 'Dana K.',
    role: 'UX 设计师',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">ResumeTailor <span className="text-blue-600">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">功能特点</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">使用流程</a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">用户评价</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-gray-600">登录</Button>
            </Link>
            <Link href="/auth?mode=signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                免费开始
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="pt-20 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-6 border border-blue-100">
            <Sparkles className="w-3 h-3" />
            AI 驱动的简历定制
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            一份档案，<br />
            <span className="text-blue-600">每个岗位，</span>量身定制。
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            一次录入职业档案，秒级生成岗位专属、ATS 优化的简历——仅使用您的真实经历，绝不虚构。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth?mode=signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base shadow-lg shadow-blue-200">
                免费开始
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" size="lg" className="px-8 h-12 text-base border-gray-200 text-gray-700">
                登录账户
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {['无需信用卡', '永久免费方案', '隐私优先'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-4 border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-3 text-sm text-gray-400 font-medium">
            {['Stripe', 'Airbnb', 'Google', 'Meta', 'Shopify', 'Figma', 'Notion', 'Linear'].map((co) => (
              <span key={co} className="opacity-50 hover:opacity-80 transition-opacity">{co}</span>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">助力求职者进入顶尖企业</p>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">求职所需，一应俱全</h2>
            <p className="text-gray-500 max-w-xl mx-auto">为现代求职而生——智能、真实、高效。</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all duration-200 group">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">四步从档案到 PDF</h2>
            <p className="text-gray-500">将您的经验最快速地转化为求职利器。</p>
          </div>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.number} className="flex gap-6 items-start p-6 bg-white rounded-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-200 self-center flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">深受求职者喜爱</h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-sm text-gray-500 ml-2">4.9 / 5 分</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.author} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.author}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">立即开始定制您的简历</h2>
          <p className="text-blue-100 mb-8">加入数千名使用 ResumeTailor AI 获得更多面试机会的职场人。</p>
          <Link href="/auth?mode=signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 h-12 text-base font-semibold shadow-lg">
              免费注册
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900">ResumeTailor AI</span>
          </div>
          <p className="text-xs text-gray-400">© 2025 ResumeTailor AI 版权所有</p>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-gray-600 transition-colors">服务条款</a>
            <a href="#" className="hover:text-gray-600 transition-colors">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
