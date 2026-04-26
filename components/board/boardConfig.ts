import type { BoardStatus } from '@/lib/types';

export interface ColumnConfig {
  id: BoardStatus;
  label: string;
  color: string;
  headerBg: string;
  dotColor: string;
  dropHighlight: string;
}

export const BOARD_COLUMNS: ColumnConfig[] = [
  {
    id: 'draft',
    label: '草稿',
    color: 'text-gray-600',
    headerBg: 'bg-gray-50 border-gray-200',
    dotColor: 'bg-gray-400',
    dropHighlight: 'ring-2 ring-gray-300 bg-gray-50/80',
  },
  {
    id: 'pending',
    label: '待投递',
    color: 'text-blue-600',
    headerBg: 'bg-blue-50 border-blue-200',
    dotColor: 'bg-blue-500',
    dropHighlight: 'ring-2 ring-blue-300 bg-blue-50/80',
  },
  {
    id: 'applied',
    label: '已投递',
    color: 'text-amber-600',
    headerBg: 'bg-amber-50 border-amber-200',
    dotColor: 'bg-amber-500',
    dropHighlight: 'ring-2 ring-amber-300 bg-amber-50/80',
  },
  {
    id: 'interviewing',
    label: '面试中',
    color: 'text-emerald-600',
    headerBg: 'bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-500',
    dropHighlight: 'ring-2 ring-emerald-300 bg-emerald-50/80',
  },
  {
    id: 'archived',
    label: '已归档',
    color: 'text-gray-400',
    headerBg: 'bg-gray-50 border-gray-200',
    dotColor: 'bg-gray-300',
    dropHighlight: 'ring-2 ring-gray-200 bg-gray-50/80',
  },
];

export const STATUS_LABELS: Record<BoardStatus, string> = {
  draft: '草稿',
  pending: '待投递',
  applied: '已投递',
  interviewing: '面试中',
  archived: '已归档',
};
