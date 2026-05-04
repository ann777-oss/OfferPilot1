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
    id: 'hr_interview',
    label: 'HR面试',
    color: 'text-purple-600',
    headerBg: 'bg-purple-50 border-purple-200',
    dotColor: 'bg-purple-500',
    dropHighlight: 'ring-2 ring-purple-300 bg-purple-50/80',
  },
  {
    id: 'technical_interview',
    label: '技术面试',
    color: 'text-emerald-600',
    headerBg: 'bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-500',
    dropHighlight: 'ring-2 ring-emerald-300 bg-emerald-50/80',
  },
  {
    id: 'final_interview',
    label: '终面',
    color: 'text-indigo-600',
    headerBg: 'bg-indigo-50 border-indigo-200',
    dotColor: 'bg-indigo-500',
    dropHighlight: 'ring-2 ring-indigo-300 bg-indigo-50/80',
  },
  {
    id: 'offer',
    label: 'Offer',
    color: 'text-green-600',
    headerBg: 'bg-green-50 border-green-200',
    dotColor: 'bg-green-500',
    dropHighlight: 'ring-2 ring-green-300 bg-green-50/80',
  },
  {
    id: 'rejected',
    label: '已拒绝',
    color: 'text-red-600',
    headerBg: 'bg-red-50 border-red-200',
    dotColor: 'bg-red-500',
    dropHighlight: 'ring-2 ring-red-300 bg-red-50/80',
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
  hr_interview: 'HR面试',
  technical_interview: '技术面试',
  final_interview: '终面',
  offer: 'Offer',
  rejected: '已拒绝',
  archived: '已归档',
};
