'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CircleAlert as AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

function translateAuthError(message: string, mode: 'signin' | 'signup') {
  const text = message.toLowerCase();

  if (text.includes('invalid login credentials')) return '邮箱或密码不正确，请检查后重试。';
  if (text.includes('email not confirmed')) return '邮箱还没有完成验证，请先到邮箱里点击验证链接。';
  if (text.includes('user already registered') || text.includes('already registered')) return '这个邮箱已经注册过，请直接登录。';
  if (text.includes('password') && text.includes('characters')) return '密码长度不符合要求，请至少输入 8 位。';
  if (text.includes('invalid email') || text.includes('email address')) return '邮箱格式不正确，请检查后重试。';
  if (text.includes('signup') && text.includes('disabled')) return '当前暂时无法注册，请稍后再试。';
  if (text.includes('rate limit') || text.includes('too many')) return '操作太频繁了，请稍等一会儿再试。';
  if (text.includes('network') || text.includes('fetch')) return '网络连接失败，请检查网络后重试。';

  return mode === 'signin' ? '登录失败，请检查邮箱和密码后重试。' : '注册失败，请检查填写信息后重试。';
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('请填写姓名。');
          return;
        }

        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(translateAuthError(error.message, mode));
          return;
        }

        router.push('/dashboard');
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        setError(translateAuthError(error.message, mode));
        return;
      }

      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden items-center justify-center bg-blue-600 p-12 lg:flex lg:w-1/2">
        <div className="max-w-sm text-white">
          <div className="mb-12 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">OfferPilot</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold leading-snug">
            把每一次岗位申请，都推进成清晰的求职项目。
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-blue-100">
            从职业档案、JD 分析、定制简历，到面试准备、复盘和 Offer 对比，OfferPilot 帮你持续管理完整求职流程。
          </p>
          <div className="space-y-3">
            {[
              '以求职项目为中心管理每个岗位',
              '基于真实经历生成岗位专属简历',
              '统一沉淀面试准备和复盘记录',
              '记录并对比 Offer 关键信息',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-blue-100">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900">OfferPilot</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="mb-1 text-2xl font-bold text-gray-900">
              {mode === 'signin' ? '欢迎回来' : '创建账户'}
            </h1>
            <p className="text-sm text-gray-500">
              {mode === 'signin' ? '登录后继续推进你的求职项目。' : '开始建立你的求职工作台。'}
            </p>
          </div>

          <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">姓名</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="请输入你的姓名"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required={mode === 'signup'}
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱地址"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? '至少 8 位字符' : '请输入密码'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-blue-600 font-medium text-white hover:bg-blue-700"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {mode === 'signin' ? '登录中...' : '注册中...'}
                </span>
              ) : (
                mode === 'signin' ? '登录' : '注册'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            {mode === 'signup'
              ? '注册即表示你同意使用 OfferPilot 管理个人求职资料。'
              : '忘记密码？请联系管理员或客服。'}
          </p>

          <div className="mt-4 text-center text-sm text-gray-500">
            <Link href="/" className="text-blue-600 hover:underline">返回首页</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
