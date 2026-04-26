'use client';

import { useState } from 'react';
import { School, Plus, Trash2, Save, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SectionCard from './SectionCard';
import EmptyState from '@/components/common/EmptyState';
import { supabase } from '@/lib/supabase';
import type { CampusActivity } from '@/lib/types';
import { useBeautify } from '@/hooks/use-beautify';

interface Props {
  userId: string;
  activities: CampusActivity[];
  onSaved: () => void;
}

type FormData = Omit<CampusActivity, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string };

const ACTIVITY_TYPES = ['学生组织', '志愿活动', '科研竞赛', '校园实习', '社团活动', '其他'];

const emptyForm = (): FormData => ({
  organization: '',
  role: '',
  activity_type: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: '',
  highlights: [''],
  sort_order: 0,
});

export default function CampusActivitySection({ userId, activities, onSaved }: Props) {
  const [editing, setEditing] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { beautify, loading: beautifyLoading } = useBeautify();

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const cleanHighlights = editing.highlights.filter((h) => h.trim() !== '');
    const data = { ...editing, highlights: cleanHighlights, user_id: userId };

    if (editing.id) {
      await supabase.from('campus_activities').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('campus_activities').insert({ ...data, sort_order: activities.length });
    }
    setSaving(false);
    setEditing(null);
    onSaved();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('campus_activities').delete().eq('id', id);
    setDeleting(null);
    onSaved();
  };

  const addHighlight = () => {
    if (!editing) return;
    setEditing({ ...editing, highlights: [...editing.highlights, ''] });
  };

  const updateHighlight = (index: number, value: string) => {
    if (!editing) return;
    const highlights = [...editing.highlights];
    highlights[index] = value;
    setEditing({ ...editing, highlights });
  };

  const removeHighlight = (index: number) => {
    if (!editing) return;
    setEditing({ ...editing, highlights: editing.highlights.filter((_, i) => i !== index) });
  };

  const handleBeautifyDescription = async () => {
    if (!editing || editing.description.trim().length < 5) return;
    const context = [editing.role, editing.organization, editing.activity_type].filter(Boolean).join(' · ');
    const result = await beautify('campus-desc', 'description', editing.description, context);
    if (typeof result === 'string') {
      setEditing({ ...editing, description: result });
    }
  };

  const handleBeautifyHighlights = async () => {
    if (!editing) return;
    const nonEmpty = editing.highlights.filter((h) => h.trim() !== '');
    if (nonEmpty.length === 0) return;
    const context = [editing.role, editing.organization].filter(Boolean).join(' @ ');
    const result = await beautify('campus-highlights', 'highlights', nonEmpty, context);
    if (Array.isArray(result)) {
      setEditing({ ...editing, highlights: result });
    }
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <SectionCard
          icon={School}
          title={editing.id ? '编辑校园经历' : '添加校园经历'}
          action={
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 h-7 w-7 p-0">
              <X className="w-4 h-4" />
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">组织/机构名称</Label>
                <Input
                  value={editing.organization}
                  onChange={(e) => setEditing({ ...editing, organization: e.target.value })}
                  placeholder="清华大学学生会"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">担任角色</Label>
                <Input
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  placeholder="部长 / 队长 / 志愿者"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">活动类型</Label>
                <select
                  value={editing.activity_type}
                  onChange={(e) => setEditing({ ...editing, activity_type: e.target.value })}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">请选择...</option>
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">开始时间</Label>
                <Input
                  value={editing.start_date}
                  onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                  placeholder="2021-09"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">结束时间</Label>
                <Input
                  value={editing.end_date}
                  onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                  placeholder="2023-06"
                  disabled={editing.is_current}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="campus_is_current"
                  checked={editing.is_current}
                  onChange={(e) => setEditing({ ...editing, is_current: e.target.checked, end_date: e.target.checked ? '' : editing.end_date })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="campus_is_current" className="text-xs font-medium text-gray-600 cursor-pointer">目前仍在参与</Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">简要描述（选填）</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBeautifyDescription}
                  disabled={beautifyLoading === 'campus-desc' || editing.description.trim().length < 5}
                  className="h-6 gap-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 px-2"
                >
                  {beautifyLoading === 'campus-desc' ? (
                    <><span className="w-2.5 h-2.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />美化中...</>
                  ) : (
                    <><Sparkles className="w-2.5 h-2.5" />AI 美化</>
                  )}
                </Button>
              </div>
              <Textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="简述这段经历的背景和目标..."
                className="min-h-[72px] resize-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">成就亮点</Label>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBeautifyHighlights}
                    disabled={beautifyLoading === 'campus-highlights' || editing.highlights.every((h) => !h.trim())}
                    className="h-6 gap-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 px-2"
                  >
                    {beautifyLoading === 'campus-highlights' ? (
                      <><span className="w-2.5 h-2.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />美化中...</>
                    ) : (
                      <><Sparkles className="w-2.5 h-2.5" />AI 美化</>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={addHighlight} className="text-xs text-blue-600 hover:text-blue-700 h-6 px-2">
                    <Plus className="w-3 h-3 mr-1" />添加
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-400">用动词开头，尽量量化成果（如"组织 500+ 人参与的公益活动"）</p>
              {editing.highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={h}
                    onChange={(e) => updateHighlight(i, e.target.value)}
                    placeholder="组织并主持校园品牌大赛，吸引 30 支队伍参赛..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHighlight(i)}
                    className="text-gray-300 hover:text-red-500 h-9 w-9 p-0 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>取消</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {saving
                  ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</>
                  : <><Save className="w-3.5 h-3.5" />保存</>}
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing(emptyForm())} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" />添加校园经历
          </Button>
        </div>
      )}

      {activities.length === 0 && !editing ? (
        <EmptyState
          icon={School}
          title="暂无校园经历"
          description="添加学生组织、志愿活动、科研竞赛等校园经历，让您的简历更加丰富。"
          actionLabel="添加校园经历"
          onAction={() => setEditing(emptyForm())}
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{activity.role || '未填写角色'}</h3>
                    {activity.activity_type && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        {activity.activity_type}
                      </span>
                    )}
                    {activity.is_current && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">进行中</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{activity.organization}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activity.start_date} — {activity.is_current ? '至今' : activity.end_date}
                  </p>
                  {activity.highlights.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {activity.highlights.slice(0, 3).map((h, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                          <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
                          {h}
                        </li>
                      ))}
                      {activity.highlights.length > 3 && (
                        <li className="text-xs text-gray-400">还有 {activity.highlights.length - 3} 条</li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing({ ...activity })}
                    className="h-8 px-2.5 text-gray-400 hover:text-gray-700 text-xs"
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(activity.id)}
                    disabled={deleting === activity.id}
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
