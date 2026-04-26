'use client';

import { useState } from 'react';
import { Link2, Plus, Trash2, Save, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SectionCard from './SectionCard';
import EmptyState from '@/components/common/EmptyState';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/types';
import { useBeautify } from '@/hooks/use-beautify';

interface Props {
  userId: string;
  projects: Project[];
  onSaved: () => void;
}

type FormData = Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string; techInput?: string; highlightInput?: string };

const emptyForm = (): FormData => ({
  name: '',
  description: '',
  tech_stack: [],
  live_url: '',
  repo_url: '',
  start_date: '',
  end_date: '',
  highlights: [],
  sort_order: 0,
  techInput: '',
  highlightInput: '',
});

export default function ProjectsSection({ userId, projects, onSaved }: Props) {
  const [editing, setEditing] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { beautify, loading: beautifyLoading } = useBeautify();

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { techInput, highlightInput, ...data } = editing;
    if (editing.id) {
      await supabase.from('projects').update({ ...data, user_id: userId, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('projects').insert({ ...data, user_id: userId, sort_order: projects.length });
    }
    setSaving(false);
    setEditing(null);
    onSaved();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('projects').delete().eq('id', id);
    setDeleting(null);
    onSaved();
  };

  const addTech = () => {
    if (!editing || !editing.techInput?.trim()) return;
    setEditing({ ...editing, tech_stack: [...editing.tech_stack, editing.techInput.trim()], techInput: '' });
  };

  const addHighlight = () => {
    if (!editing || !editing.highlightInput?.trim()) return;
    setEditing({ ...editing, highlights: [...editing.highlights, editing.highlightInput.trim()], highlightInput: '' });
  };

  const handleBeautifyDescription = async () => {
    if (!editing || editing.description.trim().length < 5) return;
    const context = [editing.name, editing.tech_stack.slice(0, 5).join('、')].filter(Boolean).join(' · ');
    const result = await beautify('proj-desc', 'description', editing.description, context);
    if (typeof result === 'string') {
      setEditing({ ...editing, description: result });
    }
  };

  const handleBeautifyHighlights = async () => {
    if (!editing || editing.highlights.length === 0) return;
    const nonEmpty = editing.highlights.filter((h) => h.trim() !== '');
    if (nonEmpty.length === 0) return;
    const context = [editing.name, editing.tech_stack.slice(0, 5).join('、')].filter(Boolean).join(' · ');
    const result = await beautify('proj-highlights', 'highlights', nonEmpty, context);
    if (Array.isArray(result)) {
      setEditing({ ...editing, highlights: result });
    }
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <SectionCard
          icon={Link2}
          title={editing.id ? '编辑项目' : '添加项目'}
          action={
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="h-7 w-7 p-0 text-gray-400">
              <X className="w-4 h-4" />
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium text-gray-600">项目名称</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="OpenDash" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-gray-600">项目描述</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBeautifyDescription}
                    disabled={beautifyLoading === 'proj-desc' || editing.description.trim().length < 5}
                    className="h-6 gap-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 px-2"
                  >
                    {beautifyLoading === 'proj-desc' ? (
                      <><span className="w-2.5 h-2.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />美化中...</>
                    ) : (
                      <><Sparkles className="w-2.5 h-2.5" />AI 美化</>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="简要描述该项目的功能及其实际价值..."
                  className="resize-none min-h-[80px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">线上链接（选填）</Label>
                <Input value={editing.live_url} onChange={(e) => setEditing({ ...editing, live_url: e.target.value })} placeholder="https://project.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">代码仓库（选填）</Label>
                <Input value={editing.repo_url} onChange={(e) => setEditing({ ...editing, repo_url: e.target.value })} placeholder="https://github.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">开始时间</Label>
                <Input value={editing.start_date} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} placeholder="2022-01" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">结束时间</Label>
                <Input value={editing.end_date} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} placeholder="2023-06" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">技术栈</Label>
              <div className="flex gap-2">
                <Input value={editing.techInput ?? ''} onChange={(e) => setEditing({ ...editing, techInput: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTech()} placeholder="如 React" className="flex-1" />
                <Button variant="outline" size="sm" onClick={addTech} className="px-3">添加</Button>
              </div>
              {editing.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {editing.tech_stack.map((t, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">
                      {t}
                      <button onClick={() => setEditing({ ...editing, tech_stack: editing.tech_stack.filter((_, j) => j !== i) })}><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">项目亮点</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBeautifyHighlights}
                  disabled={beautifyLoading === 'proj-highlights' || editing.highlights.every((h) => !h.trim())}
                  className="h-6 gap-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 px-2"
                >
                  {beautifyLoading === 'proj-highlights' ? (
                    <><span className="w-2.5 h-2.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />美化中...</>
                  ) : (
                    <><Sparkles className="w-2.5 h-2.5" />AI 美化</>
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input value={editing.highlightInput ?? ''} onChange={(e) => setEditing({ ...editing, highlightInput: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addHighlight()} placeholder="如 2,400+ GitHub 星标" className="flex-1" />
                <Button variant="outline" size="sm" onClick={addHighlight} className="px-3">添加</Button>
              </div>
              {editing.highlights.length > 0 && (
                <ul className="space-y-1 mt-1">
                  {editing.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="text-blue-400">•</span>{h}
                      <button onClick={() => setEditing({ ...editing, highlights: editing.highlights.filter((_, j) => j !== i) })} className="text-gray-300 hover:text-red-500 ml-auto"><X className="w-3 h-3" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>取消</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</> : <><Save className="w-3.5 h-3.5" />保存</>}
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing(emptyForm())} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" />添加项目
          </Button>
        </div>
      )}

      {projects.length === 0 && !editing ? (
        <EmptyState
          icon={Link2}
          title="暂无项目经验"
          description="添加个人或业余项目，展示您工作/实习经历之外的技能。"
          actionLabel="添加项目"
          onAction={() => setEditing(emptyForm())}
        />
      ) : (
        <div className="space-y-3">
          {projects.map((proj) => (
            <div key={proj.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{proj.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{proj.description}</p>
                  {proj.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proj.tech_stack.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ ...proj, techInput: '', highlightInput: '' })} className="h-8 px-2.5 text-gray-400 hover:text-gray-700 text-xs">编辑</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(proj.id)} disabled={deleting === proj.id} className="h-8 w-8 p-0 text-gray-300 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
