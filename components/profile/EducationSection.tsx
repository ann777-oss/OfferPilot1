'use client';

import { useState } from 'react';
import { GraduationCap, Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SectionCard from './SectionCard';
import EmptyState from '@/components/common/EmptyState';
import { supabase } from '@/lib/supabase';
import type { Education } from '@/lib/types';

interface Props {
  userId: string;
  educationList: Education[];
  onSaved: () => void;
}

type FormData = Omit<Education, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string };

const emptyForm = (): FormData => ({
  institution: '',
  degree: '',
  field_of_study: '',
  start_date: '',
  end_date: '',
  gpa: '',
  activities: '',
  description: '',
  sort_order: 0,
});

export default function EducationSection({ userId, educationList, onSaved }: Props) {
  const [editing, setEditing] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const data = { ...editing, user_id: userId };
    if (editing.id) {
      await supabase.from('education').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('education').insert({ ...data, sort_order: educationList.length });
    }
    setSaving(false);
    setEditing(null);
    onSaved();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('education').delete().eq('id', id);
    setDeleting(null);
    onSaved();
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <SectionCard
          icon={GraduationCap}
          title={editing.id ? '编辑教育背景' : '添加教育背景'}
          action={
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="h-7 w-7 p-0 text-gray-400">
              <X className="w-4 h-4" />
            </Button>
          }
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium text-gray-600">学校名称</Label>
              <Input value={editing.institution} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} placeholder="北京大学" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">学位</Label>
              <Input value={editing.degree} onChange={(e) => setEditing({ ...editing, degree: e.target.value })} placeholder="理学学士" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">专业</Label>
              <Input value={editing.field_of_study} onChange={(e) => setEditing({ ...editing, field_of_study: e.target.value })} placeholder="计算机科学" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">入学时间</Label>
              <Input value={editing.start_date} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} placeholder="2014-09" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">毕业时间</Label>
              <Input value={editing.end_date} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} placeholder="2018-05" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">GPA（选填）</Label>
              <Input value={editing.gpa} onChange={(e) => setEditing({ ...editing, gpa: e.target.value })} placeholder="3.8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">课外活动（选填）</Label>
              <Input value={editing.activities} onChange={(e) => setEditing({ ...editing, activities: e.target.value })} placeholder="ACM、黑客松俱乐部" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</> : <><Save className="w-3.5 h-3.5" />保存</>}
            </Button>
          </div>
        </SectionCard>
      ) : (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing(emptyForm())} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" />添加教育背景
          </Button>
        </div>
      )}

      {educationList.length === 0 && !editing ? (
        <EmptyState
          icon={GraduationCap}
          title="暂无教育背景"
          description="添加您的学历和学术经历。"
          actionLabel="添加教育背景"
          onAction={() => setEditing(emptyForm())}
        />
      ) : (
        <div className="space-y-3">
          {educationList.map((edu) => (
            <div key={edu.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{edu.degree} in {edu.field_of_study}</h3>
                  <p className="text-sm text-gray-500">{edu.institution}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {edu.start_date} — {edu.end_date}
                    {edu.gpa && <span className="ml-2 font-medium text-gray-500">GPA: {edu.gpa}</span>}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ ...edu })} className="h-8 px-2.5 text-gray-400 hover:text-gray-700 text-xs">编辑</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(edu.id)} disabled={deleting === edu.id} className="h-8 w-8 p-0 text-gray-300 hover:text-red-500">
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
