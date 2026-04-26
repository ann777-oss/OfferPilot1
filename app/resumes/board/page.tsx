'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, LayoutGrid, List, CirclePlus as PlusCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import BoardColumn from '@/components/board/BoardColumn';
import DeleteConfirmDialog from '@/components/board/DeleteConfirmDialog';
import { BOARD_COLUMNS } from '@/components/board/boardConfig';
import {
  getBoardResumes,
  moveResumeStatus,
  duplicateResume,
  archiveResume,
  deleteResume,
} from '@/lib/services/board';
import type { ResumeVersion, BoardStatus } from '@/lib/types';

type EnrichedResume = ResumeVersion & {
  job_descriptions?: { company_name: string; job_title: string; analysis?: { match_score?: number } } | null;
};

interface DragState {
  resumeId: string;
  fromStatus: BoardStatus;
}

export default function BoardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [resumes, setResumes] = useState<EnrichedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EnrichedResume | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getBoardResumes(user.id);
      setResumes(data as EnrichedResume[]);
    } catch {
      toast({ title: '加载失败', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleDragStart = (resumeId: string, fromStatus: BoardStatus) => {
    dragRef.current = { resumeId, fromStatus };
  };

  const handleDrop = async (toStatus: BoardStatus) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !user || drag.fromStatus === toStatus) return;

    const prev = resumes;
    setResumes((r) => r.map((rv) => rv.id === drag.resumeId ? { ...rv, status: toStatus } : rv));

    try {
      await moveResumeStatus(drag.resumeId, user.id, drag.fromStatus, toStatus);
    } catch {
      setResumes(prev);
      toast({ title: '移动失败，已回滚', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (resume: ResumeVersion) => {
    if (!user) return;
    try {
      const copy = await duplicateResume(resume, user.id);
      setResumes((prev) => [copy as EnrichedResume, ...prev]);
      toast({ title: '已复制简历' });
    } catch {
      toast({ title: '复制失败', variant: 'destructive' });
    }
  };

  const handleArchive = async (resumeId: string) => {
    if (!user) return;
    const prev = resumes;
    setResumes((r) => r.map((rv) => rv.id === resumeId ? { ...rv, status: 'archived' } : rv));
    try {
      await archiveResume(resumeId, user.id);
      toast({ title: '已归档' });
    } catch {
      setResumes(prev);
      toast({ title: '归档失败', variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !user) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setResumes((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteResume(id, user.id);
      toast({ title: '已删除简历' });
    } catch {
      load();
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  const searchLower = search.toLowerCase();
  const filtered = resumes.filter((r) => {
    if (!searchLower) return true;
    const jd = r.job_descriptions;
    return (
      r.name.toLowerCase().includes(searchLower) ||
      jd?.company_name?.toLowerCase().includes(searchLower) ||
      jd?.job_title?.toLowerCase().includes(searchLower)
    );
  });

  const columnResumes = (status: BoardStatus) =>
    filtered.filter((r) => (r.status || 'draft') === status);

  const totalByStatus = BOARD_COLUMNS.map((c) => ({
    ...c,
    count: resumes.filter((r) => (r.status || 'draft') === c.id).length,
  }));

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="px-8 pt-8 pb-4 border-b border-gray-100 bg-white flex-shrink-0">
          <PageHeader
            title="简历看板"
            description="可视化管理求职进度，拖拽卡片改变状态。"
            actions={
              <div className="flex items-center gap-2">
                <Link href="/resumes">
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm">
                    <List className="w-3.5 h-3.5" />列表视图
                  </Button>
                </Link>
                <Link href="/jobs/new">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9 text-sm">
                    <PlusCircle className="w-3.5 h-3.5" />新建简历
                  </Button>
                </Link>
              </div>
            }
          />

          <div className="flex items-center gap-6 mt-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索简历、公司、岗位..."
                className="pl-9 h-9 text-sm w-72"
              />
            </div>
            <div className="flex items-center gap-4 flex-1">
              {totalByStatus.map((col) => (
                <div key={col.id} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="text-xs text-gray-500">{col.label}</span>
                  <span className="text-xs font-semibold text-gray-700">{col.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {loading ? (
            <div className="flex gap-4 p-8">
              {BOARD_COLUMNS.map((col) => (
                <div key={col.id} className="w-72 flex-shrink-0 space-y-2">
                  <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 p-8 min-w-max">
              {BOARD_COLUMNS.map((col) => (
                <BoardColumn
                  key={col.id}
                  column={col}
                  resumes={columnResumes(col.id)}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                  onDelete={(id) => {
                    const r = resumes.find((rv) => rv.id === id);
                    if (r) setDeleteTarget(r);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        resumeName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
