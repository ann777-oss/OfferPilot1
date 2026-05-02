'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Briefcase, CirclePlus as PlusCircle, LayoutGrid, List, Search, Target, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { getJobProjects } from '@/lib/services/project';
import type { JobDescription, ProjectStatus } from '@/lib/types';

const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: string }> = {
  analyzed: { label: '已分析 JD', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  resume_ready: { label: '简历已就绪', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  applied: { label: '已投递', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  interviewing: { label: '面试中', tone: 'bg-purple-50 text-purple-700 border-purple-200' },
  offer: { label: '已拿 Offer', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: '已结束', tone: 'bg-red-50 text-red-700 border-red-200' },
  archived: { label: '已归档', tone: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const BOARD_COLUMNS: ProjectStatus[] = [
  'analyzed',
  'resume_ready',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'archived',
];

function normalizeProjectStatus(status?: string): ProjectStatus {
  if (!status) return 'analyzed';
  if (status in PROJECT_STATUS_META) return status as ProjectStatus;
  return 'analyzed';
}

export default function JobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [projects, setProjects] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'board'>(
    searchParams.get('view') === 'board' ? 'board' : 'list'
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getJobProjects(user.id);
        setProjects(data);
      } catch {
        toast({ title: '加载求职项目失败', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return projects;
    return projects.filter((project) => {
      return (
        project.company_name?.toLowerCase().includes(keyword) ||
        project.job_title?.toLowerCase().includes(keyword)
      );
    });
  }, [projects, search]);

  const totalStats = useMemo(() => {
    return BOARD_COLUMNS.map((status) => ({
      status,
      label: PROJECT_STATUS_META[status].label,
      count: projects.filter((project) => normalizeProjectStatus(project.status) === status).length,
      tone: PROJECT_STATUS_META[status].tone,
    }));
  }, [projects]);

  const boardProjects = (status: ProjectStatus) =>
    filteredProjects.filter((project) => normalizeProjectStatus(project.status) === status);

  const handleDeleteProject = async (event: React.MouseEvent, project: JobDescription) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user || deletingId) return;

    const label = `${project.company_name || '未知公司'} / ${project.job_title || '未命名职位'}`;
    if (!window.confirm(`确定要删除这个求职项目吗？\n${label}\n删除后无法恢复。`)) return;

    setDeletingId(project.id);
    const { error } = await supabase
      .from('job_descriptions')
      .delete()
      .eq('id', project.id)
      .eq('user_id', user.id);

    setDeletingId(null);
    if (error) {
      toast({ title: '删除求职项目失败', variant: 'destructive' });
      return;
    }

    setProjects((prev) => prev.filter((item) => item.id !== project.id));
    toast({ title: '已删除求职项目' });
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          title="求职项目"
          description="这里统一管理每一条岗位申请。你可以查看所有项目、切换看板，并进入单个项目继续推进状态、简历、投递和面试。"
          actions={
            <Link href="/jobs/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <PlusCircle className="w-4 h-4" />
                新建求职项目
              </Button>
            </Link>
          }
        />

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: '全部项目', value: projects.length, tone: 'text-blue-600 bg-blue-50' },
              { label: '已投递', value: projects.filter((p) => normalizeProjectStatus(p.status) === 'applied').length, tone: 'text-amber-600 bg-amber-50' },
              { label: '面试中', value: projects.filter((p) => normalizeProjectStatus(p.status) === 'interviewing').length, tone: 'text-purple-600 bg-purple-50' },
              { label: '已拿 Offer', value: projects.filter((p) => normalizeProjectStatus(p.status) === 'offer').length, tone: 'text-emerald-600 bg-emerald-50' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${stat.tone.split(' ')[1]}`}>
                  <Target className={`w-4 h-4 ${stat.tone.split(' ')[0]}`} />
                </div>
                <p className={`text-2xl font-bold ${stat.tone.split(' ')[0]}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索公司或职位..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'list' | 'board')}>
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="list" className="gap-1.5">
                <List className="w-3.5 h-3.5" />
                项目列表
              </TabsTrigger>
              <TabsTrigger value="board" className="gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                求职看板
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          projects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="还没有求职项目"
              description="从一个目标岗位开始，新建项目后，你就能在这里持续推进整条申请流程。"
              actionLabel="新建求职项目"
              onAction={() => router.push('/jobs/new')}
            />
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">没有符合当前搜索条件的求职项目。</p>
            </div>
          )
        ) : activeView === 'list' ? (
          <div className="space-y-3">
            {filteredProjects.map((project) => {
              const status = normalizeProjectStatus(project.status);
              const statusMeta = PROJECT_STATUS_META[status];

              return (
                <Link
                  key={project.id}
                  href={`/jobs/${project.id}`}
                  className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{project.job_title || '未命名职位'}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${statusMeta.tone}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {project.company_name || '未知公司'} · 创建于 {new Date(project.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {project.match_score > 0 && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          project.match_score >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : project.match_score >= 60
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-600'
                        }`}>
                          {project.match_score}%
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(event) => handleDeleteProject(event, project)}
                        disabled={deletingId === project.id}
                        className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="删除求职项目"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {totalStats.map((column) => (
                <div key={column.status} className="w-72 flex-shrink-0">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${column.tone}`}>
                        {column.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">{column.count}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {boardProjects(column.status).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-400 text-center">
                        暂无项目
                      </div>
                    ) : (
                      boardProjects(column.status).map((project) => (
                        <Link
                          key={project.id}
                          href={`/jobs/${project.id}`}
                          className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                        >
                          <p className="text-sm font-semibold text-gray-900 mb-1">{project.company_name || '未知公司'}</p>
                          <p className="text-sm text-gray-700 mb-2">{project.job_title || '未命名职位'}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
                            <div className="flex items-center gap-2">
                              {project.match_score > 0 && <span>{project.match_score}%</span>}
                              <button
                                type="button"
                                onClick={(event) => handleDeleteProject(event, project)}
                                disabled={deletingId === project.id}
                                className="rounded-md p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="删除求职项目"
                                title="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
