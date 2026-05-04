'use client';

import { Briefcase } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { JobDescription } from '@/lib/types';

interface ProjectSelectorProps {
  projects: JobDescription[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
}

export default function ProjectSelector({
  projects,
  selectedProjectId,
  onSelectProject,
}: ProjectSelectorProps) {
  if (projects.length === 0) return null;

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <Briefcase className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">选择一个求职项目</label>
          <Select value={selectedProjectId || undefined} onValueChange={onSelectProject}>
            <SelectTrigger className="h-auto border-0 p-0 font-semibold text-gray-900 focus:ring-0">
              <SelectValue placeholder="选择求职项目">
                {selectedProject && (
                  <span className="text-base">
                    {selectedProject.company_name || '未知公司'} - {selectedProject.job_title || '未命名职位'}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{project.company_name || '未知公司'}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-gray-600">{project.job_title || '未命名职位'}</span>
                    {project.match_score > 0 && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          project.match_score >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : project.match_score >= 60
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {project.match_score}%
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
