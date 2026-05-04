'use client';

import { useState } from 'react';
import { Briefcase, Plus, Trash2, Save, X, GripVertical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SectionCard from './SectionCard';
import EmptyState from '@/components/common/EmptyState';
import { supabase } from '@/lib/supabase';
import type { WorkExperience } from '@/lib/types';
import { useBeautify } from '@/hooks/use-beautify';

interface Props {
  userId: string;
  experiences: WorkExperience[];
  onSaved: () => void;
}

type FormData = Omit<WorkExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string };

const emptyForm = (): FormData => ({
  company: '',
  role: '',
  location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  bullets: [''],
  description: '',
  sort_order: 0,
});

export default function ExperienceSection({ userId, experiences, onSaved }: Props) {
  const [editing, setEditing] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { beautify, loading: beautifyLoading } = useBeautify();

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const cleanBullets = editing.bullets.filter((b) => b.trim() !== '');
    const data = { ...editing, bullets: cleanBullets, user_id: userId };

    if (editing.id) {
      await supabase.from('work_experience').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('work_experience').insert({ ...data, sort_order: experiences.length });
    }
    setSaving(false);
    setEditing(null);
    onSaved();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('work_experience').delete().eq('id', id);
    setDeleting(null);
    onSaved();
  };

  const addBullet = () => {
    if (!editing) return;
    setEditing({ ...editing, bullets: [...editing.bullets, ''] });
  };

  const updateBullet = (index: number, value: string) => {
    if (!editing) return;
    const bullets = [...editing.bullets];
    bullets[index] = value;
    setEditing({ ...editing, bullets });
  };

  const removeBullet = (index: number) => {
    if (!editing) return;
    setEditing({ ...editing, bullets: editing.bullets.filter((_, i) => i !== index) });
  };

  const handleBeautifyBullets = async () => {
    if (!editing) return;
    const nonEmpty = editing.bullets.filter((b) => b.trim() !== '');
    if (nonEmpty.length === 0) return;
    const context = [editing.role, editing.company].filter(Boolean).join(' @ ');
    const result = await beautify('bullets', 'bullets', nonEmpty, context);
    if (Array.isArray(result)) {
      setEditing({ ...editing, bullets: result });
    }
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <SectionCard
          icon={Briefcase}
          title={editing.id ? '编辑工作/实习经历' : '添加工作/实习经历'}
          action={
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 h-7 w-7 p-0">
              <X className="w-4 h-4" />
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">公司名称</Label>
                <Input value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} placeholder="阿里巴巴" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">职位名称</Label>
                <Input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder="高级软件工程师" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">工作地点</Label>
                <Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="上海，中国" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">入职时间</Label>
                <Input value={editing.start_date} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} placeholder="2021-03" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">离职时间</Label>
                <Input
                  value={editing.end_date}
                  onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                  placeholder="2024-01"
                  disabled={editing.is_current}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="is_current"
                  checked={editing.is_current}
                  onChange={(e) => setEditing({ ...editing, is_current: e.target.checked, end_date: e.target.checked ? '' : editing.end_date })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="is_current" className="text-xs font-medium text-gray-600 cursor-pointer">目前在职</Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">成就亮点</Label>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBeautifyBullets}
                    disabled={beautifyLoading === 'bullets' || editing.bullets.every((b) => !b.trim())}
                    className="h-6 gap-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 px-2"
                  >
                    {beautifyLoading === 'bullets' ? (
                      <><span className="w-2.5 h-2.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />美化中...</>
                    ) : (
                      <><Sparkles className="w-2.5 h-2.5" />AI 美化</>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={addBullet} className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2">
                    <Plus className="w-3 h-3 mr-1" />添加
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-400">使用动词开头，尽量量化成果（如"主导迁移，延迟降低 40%"）</p>
              {editing.bullets.map((bullet, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={bullet}
                    onChange={(e) => updateBullet(i, e.target.value)}
                    placeholder="主导微服务迁移，将系统延迟降低 40%..."
                    className="flex-1 text-sm"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeBullet(i)} className="text-gray-300 hover:text-red-500 h-9 w-9 p-0 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
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
            <Plus className="w-3.5 h-3.5" />添加工作/实习经历
          </Button>
        </div>
      )}

      {experiences.length === 0 && !editing ? (
        <EmptyState
          icon={Briefcase}
          title="暂无工作/实习经历"
          description="添加工作/实习经历，让生成的定制简历更具针对性。"
          actionLabel="添加工作/实习经历"
          onAction={() => setEditing(emptyForm())}
        />
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div key={exp.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-gray-900 text-sm">{exp.role}</h3>
                    {exp.is_current && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">在职</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{exp.company} · {exp.location}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {exp.start_date} — {exp.is_current ? '至今' : exp.end_date}
                  </p>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.bullets.slice(0, 3).map((b, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                          <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
                          {b}
                        </li>
                      ))}
                      {exp.bullets.length > 3 && (
                        <li className="text-xs text-gray-400">还有 {exp.bullets.length - 3} 条</li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ ...exp })} className="h-8 px-2.5 text-gray-400 hover:text-gray-700 text-xs">
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(exp.id)}
                    disabled={deleting === exp.id}
                    className="h-8 w-8 p-0 text-gray-300 hover:text-red-500"
                  >
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
