'use client';

import { useState } from 'react';
import type { ResumeVersion, BoardStatus } from '@/lib/types';
import BoardCard from './BoardCard';
import type { ColumnConfig } from './boardConfig';
import { cn } from '@/lib/utils';

interface BoardColumnProps {
  column: ColumnConfig;
  resumes: (ResumeVersion & { job_descriptions?: { company_name: string; job_title: string; analysis?: { match_score?: number } } | null })[];
  onDragStart: (resumeId: string, fromStatus: BoardStatus) => void;
  onDrop: (toStatus: BoardStatus) => void;
  onDuplicate: (resume: ResumeVersion) => void;
  onArchive: (resumeId: string) => void;
  onDelete: (resumeId: string) => void;
}

export default function BoardColumn({ column, resumes, onDragStart, onDrop, onDuplicate, onArchive, onDelete }: BoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(column.id);
  };

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-3', column.headerBg)}>
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', column.dotColor)} />
        <span className={cn('text-sm font-semibold flex-1', column.color)}>{column.label}</span>
        <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-md bg-white/70', column.color)}>
          {resumes.length}
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex-1 min-h-[200px] rounded-xl p-2 space-y-2 transition-all duration-150',
          isDragOver ? column.dropHighlight : 'bg-gray-50/50'
        )}
      >
        {resumes.map((resume) => (
          <BoardCard
            key={resume.id}
            resume={resume}
            onDragStart={onDragStart}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}

        {resumes.length === 0 && !isDragOver && (
          <div className="flex items-center justify-center h-24 text-xs text-gray-300 border-2 border-dashed border-gray-200 rounded-lg">
            拖拽简历至此
          </div>
        )}
      </div>
    </div>
  );
}
