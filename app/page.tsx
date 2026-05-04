'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  ChevronRight,
  CircleCheck as CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Briefcase,
    title: '以求职项目为中心',
    description: '每个公司和岗位都是一个独立项目，JD 分析、投递状态、简历、面试和 Offer 都围绕项目推进。',
  },
  {
    icon: FileText,
    title: '岗位专属简历',
    description: '基于你的真实职业档案和目标 JD，生成更贴合岗位要求的简历版本，并沉淀到简历中心。',
  },
  {
    icon: MessageSquare,
    title: '面试准备与复盘',
    description: '为具体岗位生成面试准备材料，面试后继续记录问题、回答和改进点，形成可复用经验。',
  },
  {
    icon: BadgeCheck,
    title: 'Offer 管理与对比',
    description: '记录薪资、城市、部门、工作制、转正机会和回复截止时间，帮助你做最终选择。',
  },
];

const steps = [
  { number: '01', title: '完善职业档案', description: '录入教育背景、校园经历、项目、技能和证书，作为后续简历与面试准备的基础资料。' },
  { number: '02', title: '新建求职项目', description: '填写目标公司、职位和 JD，让系统把这次申请变成可持续推进的项目。' },
  { number: '03', title: '推进简历与面试', description: '围绕项目生成定制简历、准备面试材料，并在面试后完成复盘记录。' },
  { number: '04', title: '管理 Offer 决策', description: '当项目进入 Offer 阶段，集中记录关键信息，并在多个 Offer 之间横向对比。' },
];

const testimonials = [
  {
    quote: '以前我只是到处改简历，现在每个岗位都有自己的进度和下一步动作，求职过程清楚很多。',
    author: '大二学生',
    role: 'AI 产品实习方向',
  },
  {
    quote: '职业档案、项目简历、面试复盘和 Offer 终于串起来了，不再是零散文件夹。',
    author: '应届生',
    role: '运营与产品方向',
  },
  {
    quote: '最有用的是按岗位推进，每次打开都知道这个项目下一步该做什么。',
    author: '在校求职者',
    role: '互联网实习方向',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">
              OfferPilot
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-600 transition-colors hover:text-gray-900">核心功能</a>
            <a href="#how-it-works" className="text-sm text-gray-600 transition-colors hover:text-gray-900">使用流程</a>
            <a href="#testimonials" className="text-sm text-gray-600 transition-colors hover:text-gray-900">用户反馈</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-gray-600">登录</Button>
            </Link>
            <Link href="/auth?mode=signup">
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                免费开始
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="px-6 pb-24 pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <Sparkles className="h-3 w-3" />
            AI 驱动的全流程求职助手
          </div>
          <h1 className="mx-auto mb-6 max-w-4xl text-center text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl">
            管理每一次申请<br />
            <span className="text-blue-600">推进每一步求职</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-gray-500">
            从职业档案、JD 分析、岗位专属简历，到面试准备、复盘和 Offer 对比，把每个岗位申请都管理成一个清晰的求职项目。
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth?mode=signup">
              <Button size="lg" className="h-12 bg-blue-600 px-8 text-base text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
                免费开始
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" size="lg" className="h-12 border-gray-200 px-8 text-base text-gray-700">
                登录账户
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {['围绕真实经历生成', '按岗位项目推进', '覆盖简历到 Offer'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50 py-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-3 text-sm font-medium text-gray-400">
            {['职业档案', '求职项目', 'JD 分析', '定制简历', '面试中心', 'Offer 管理'].map((item) => (
              <span key={item} className="opacity-60 transition-opacity hover:opacity-90">{item}</span>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-gray-400">为在校生、应届生和求职转向者设计的求职工作台</p>
        </div>
      </section>

      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">把求职流程串成一条线</h2>
            <p className="mx-auto max-w-xl text-gray-500">不是堆工具，而是围绕每个岗位申请持续推进。</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group rounded-2xl border border-gray-100 p-6 transition-all duration-200 hover:border-blue-100 hover:shadow-md">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 transition-colors group-hover:bg-blue-100">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">从准备到 Offer 的四步流程</h2>
            <p className="text-gray-500">让每一次岗位申请都有资料、有进度、有下一步。</p>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-start gap-6 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && <ChevronRight className="h-5 w-5 flex-shrink-0 self-center text-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Target, title: '今天该做什么', text: '工作台会把最需要推进的项目和动作放到最前面。' },
              { icon: ClipboardList, title: '每个岗位独立管理', text: '不同公司、职位、简历和面试记录不会混在一起。' },
              { icon: Shield, title: '基于真实经历', text: '所有内容围绕你的职业档案组织，不鼓励虚构经历。' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <Icon className="mb-4 h-6 w-6 text-blue-600" />
                  <h3 className="mb-2 font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm leading-6 text-gray-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="testimonials" className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">适合正在认真推进求职的人</h2>
            <div className="mt-2 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-sm text-gray-500">围绕求职全流程设计</span>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.author} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-gray-700">&ldquo;{item.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.author}</p>
                  <p className="text-xs text-gray-400">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-600 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">开始管理你的求职项目</h2>
          <p className="mb-8 text-blue-100">从第一个目标岗位开始，把简历、面试和 Offer 都放到同一条清晰流程里。</p>
          <Link href="/auth?mode=signup">
            <Button size="lg" className="h-12 bg-white px-8 text-base font-semibold text-blue-600 shadow-lg hover:bg-blue-50">
              免费注册
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">OfferPilot</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 OfferPilot 版权所有</p>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="#" className="transition-colors hover:text-gray-600">隐私政策</a>
            <a href="#" className="transition-colors hover:text-gray-600">服务条款</a>
            <a href="#" className="transition-colors hover:text-gray-600">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
