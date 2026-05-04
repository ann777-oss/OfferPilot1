'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CirclePlus as PlusCircle, FileText, Search, Star, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { ResumeVersion } from '@/lib/types';

export default function ResumesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadResumes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setResumes((data ?? []) as ResumeVersion[]);
    setLoading(false);
  };

  useEffect(() => {
    loadResumes();
  }, [user]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('resume_versions').delete().eq('id', id);
    setResumes((prev) => prev.filter((resume) => resume.id !== id));
    setDeleting(null);
    toast({ title: '已删除简历' });
  };

  const handleToggleStar = async (id: string, current: boolean) => {
    await supabase.from('resume_versions').update({ is_starred: !current }).eq('id', id);
    setResumes((prev) => prev.map((resume) => (resume.id === id ? { ...resume, is_starred: !current } : resume)));
  };

  const filtered = resumes.filter((resume) => {
    const matchSearch = resume.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ||
      resume.status === filterStatus ||
      (filterStatus === 'starred' && resume.is_starred);
    return matchSearch && matchStatus;
  });

  const stats = {
    total: resumes.length,
    final: resumes.filter((resume) => resume.status === 'final').length,
    starred: resumes.filter((resume) => resume.is_starred).length,
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <PageHeader
          title="简历中心"
          description="这里汇总你在所有求职项目里生成过的简历版本，方便统一查看、筛选和回访。"
          actions={
            <Link href="/jobs/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                新建求职项目
              </Button>
            </Link>
          }
        />

        {!loading && resumes.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: '简历总数', value: stats.total, color: 'text-blue-600' },
              { label: '已定稿', value: stats.final, color: 'text-emerald-600' },
              { label: '已收藏', value: stats.starred, color: 'text-amber-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && resumes.length > 0 && (
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索简历名称..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
              {[
                { key: 'all', label: '全部' },
                { key: 'draft', label: '草稿' },
                { key: 'final', label: '定稿' },
                { key: 'starred', label: '收藏' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filterStatus === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          resumes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="暂无简历"
              description="先新建一个求职项目，再生成你的第一份项目专属简历。"
              actionLabel="新建求职项目"
              onAction={() => router.push('/jobs/new')}
            />
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">没有符合当前筛选条件的简历。</p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {filtered.map((resume) => (
              <div key={resume.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link href={`/resumes/${resume.id}`} className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors truncate">
                        {resume.name}
                      </Link>
                      {resume.is_starred && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400">
                      创建于 {new Date(resume.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {resume.updated_at !== resume.created_at &&
                        ` · 更新于 ${new Date(resume.updated_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resume.status === 'final' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {resume.status === 'final' ? '定稿' : '草稿'}
                    </span>
                    <button
                      onClick={() => handleToggleStar(resume.id, resume.is_starred)}
                      className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${resume.is_starred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}
                    >
                      <Star className={`w-3.5 h-3.5 ${resume.is_starred ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      disabled={deleting === resume.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link href={`/resumes/${resume.id}`}>
                      <ArrowRight className="w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
