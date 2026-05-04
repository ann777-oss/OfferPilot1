'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Building2,
  Calendar,
  CirclePlus as PlusCircle,
  GitCompareArrows,
  MapPin,
  Search,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getJobProjects } from '@/lib/services/project';
import type { JobDescription } from '@/lib/types';

function hasOfferData(project: JobDescription) {
  return (
    project.status === 'offer' ||
    !!project.offer_salary ||
    !!project.offer_city ||
    !!project.offer_department ||
    !!project.offer_reply_deadline
  );
}

function formatReplyDeadline(value?: string | null) {
  if (!value) return '未填写';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('zh-CN');
}

export default function OffersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'compare'>('list');

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const data = await getJobProjects(user.id);
        setProjects(data.filter(hasOfferData));
      } catch {
        toast({ title: '加载 Offer 失败', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast, user]);

  const filteredOffers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return projects;

    return projects.filter((project) =>
      [project.company_name, project.job_title, project.offer_city, project.offer_department]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword))
    );
  }, [projects, search]);

  const compareOffers = filteredOffers.filter((offer) => selectedIds.includes(offer.id));

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(-3)));
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl p-8">
        <PageHeader
          title="Offer 管理"
          description="统一记录收到的 Offer，并支持多岗位横向对比。"
          actions={
            <Link href="/jobs/new">
              <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                <PlusCircle className="h-4 w-4" />
                新建求职项目
              </Button>
            </Link>
          }
        />

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Offer 数量', value: projects.length },
            { label: '待回复 Offer', value: projects.filter((item) => item.offer_reply_deadline).length },
            { label: '可转正机会', value: projects.filter((item) => item.offer_conversion_opportunity).length },
            { label: '已选对比项', value: selectedIds.length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索公司、职位、城市或部门"
              className="h-9 pl-9 text-sm"
            />
          </div>

          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'list' | 'compare')}>
            <TabsList className="border border-gray-200 bg-white">
              <TabsTrigger value="list">Offer 列表</TabsTrigger>
              <TabsTrigger value="compare" className="gap-1.5">
                <GitCompareArrows className="h-3.5 w-3.5" />
                Offer 对比
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <EmptyState
            icon={BadgeCheck}
            title="还没有可管理的 Offer"
            description="当某个求职项目进入 Offer 阶段后，你可以在项目详情页补充薪资、城市、部门和回复时间等信息。"
            actionLabel="查看求职项目"
            onAction={() => router.push('/jobs')}
          />
        ) : (
          <Tabs value={activeView}>
            <TabsContent value="list" className="mt-0">
              <div className="space-y-3">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <Checkbox checked={selectedIds.includes(offer.id)} onCheckedChange={() => toggleSelection(offer.id)} />
                      </div>

                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{offer.company_name || '未填写公司'}</p>
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                            Offer
                          </span>
                        </div>
                        <p className="mb-3 text-sm text-gray-600">{offer.job_title || '未填写职位'}</p>

                        <div className="grid gap-2 text-xs text-gray-500 md:grid-cols-3">
                          <div>薪资：{offer.offer_salary || '未填写'}</div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {offer.offer_city || '未填写'}
                          </div>
                          <div>部门：{offer.offer_department || '未填写'}</div>
                          <div>工作制：{offer.offer_work_mode || '未填写'}</div>
                          <div>实习/转正：{offer.offer_conversion_opportunity ? '有机会' : '待确认'}</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatReplyDeadline(offer.offer_reply_deadline)}
                          </div>
                        </div>
                      </div>

                      <Link href={`/jobs/${offer.id}`}>
                        <Button variant="outline" size="sm">
                          查看项目
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compare" className="mt-0">
              {compareOffers.length < 2 ? (
                <div className="rounded-xl border border-gray-100 bg-white p-10 text-center">
                  <p className="text-sm text-gray-500">请先勾选至少 2 个 Offer，再进入对比视图。</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4 text-left font-semibold text-gray-700">对比项</th>
                        {compareOffers.map((offer) => (
                          <th key={offer.id} className="min-w-[220px] p-4 text-left font-semibold text-gray-900">
                            <div className="flex items-start gap-2">
                              <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
                              <div>
                                <p>{offer.company_name || '未填写公司'}</p>
                                <p className="mt-1 text-xs font-normal text-gray-500">{offer.job_title || '未填写职位'}</p>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '薪资', render: (offer: JobDescription) => offer.offer_salary || '未填写' },
                        { label: '城市', render: (offer: JobDescription) => offer.offer_city || '未填写' },
                        { label: '部门', render: (offer: JobDescription) => offer.offer_department || '未填写' },
                        { label: '工作制', render: (offer: JobDescription) => offer.offer_work_mode || '未填写' },
                        {
                          label: '实习/转正机会',
                          render: (offer: JobDescription) => (offer.offer_conversion_opportunity ? '有机会' : '待确认'),
                        },
                        {
                          label: '截止回复时间',
                          render: (offer: JobDescription) => formatReplyDeadline(offer.offer_reply_deadline),
                        },
                        { label: '备注', render: (offer: JobDescription) => offer.offer_notes || '未填写' },
                      ].map((row) => (
                        <tr key={row.label} className="border-t border-gray-100">
                          <td className="p-4 font-medium text-gray-700">{row.label}</td>
                          {compareOffers.map((offer) => (
                            <td key={`${offer.id}-${row.label}`} className="p-4 align-top text-gray-600">
                              {row.render(offer)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
