'use client';

import { useState } from 'react';
import { Award, Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SectionCard from './SectionCard';
import EmptyState from '@/components/common/EmptyState';
import { supabase } from '@/lib/supabase';
import type { Certification } from '@/lib/types';

interface Props {
  userId: string;
  certifications: Certification[];
  onSaved: () => void;
}

type FormData = Omit<Certification, 'id' | 'user_id' | 'created_at'> & { id?: string };

const emptyForm = (): FormData => ({
  name: '',
  issuer: '',
  issue_date: '',
  expiry_date: '',
  credential_id: '',
  credential_url: '',
  sort_order: 0,
});

export default function CertificationsSection({ userId, certifications, onSaved }: Props) {
  const [editing, setEditing] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const data = { ...editing, user_id: userId };
    if (editing.id) {
      await supabase.from('certifications').update(data).eq('id', editing.id);
    } else {
      await supabase.from('certifications').insert({ ...data, sort_order: certifications.length });
    }
    setSaving(false);
    setEditing(null);
    onSaved();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('certifications').delete().eq('id', id);
    setDeleting(null);
    onSaved();
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <SectionCard
          icon={Award}
          title={editing.id ? '编辑证书' : '添加证书'}
          action={
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="h-7 w-7 p-0 text-gray-400">
              <X className="w-4 h-4" />
            </Button>
          }
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium text-gray-600">证书名称</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="如大学英语四级" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">颁发机构</Label>
              <Input value={editing.issuer} onChange={(e) => setEditing({ ...editing, issuer: e.target.value })} placeholder="如教育部教育考试院" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">证书编号（选填）</Label>
              <Input value={editing.credential_id} onChange={(e) => setEditing({ ...editing, credential_id: e.target.value })} placeholder="如 CET4-2023-123456" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">颁发日期</Label>
              <Input value={editing.issue_date} onChange={(e) => setEditing({ ...editing, issue_date: e.target.value })} placeholder="2022-08" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">到期日期（选填）</Label>
              <Input value={editing.expiry_date} onChange={(e) => setEditing({ ...editing, expiry_date: e.target.value })} placeholder="2025-08" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium text-gray-600">证书链接（选填）</Label>
              <Input value={editing.credential_url} onChange={(e) => setEditing({ ...editing, credential_url: e.target.value })} placeholder="https://..." />
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
            <Plus className="w-3.5 h-3.5" />添加证书
          </Button>
        </div>
      )}

      {certifications.length === 0 && !editing ? (
        <EmptyState
          icon={Award}
          title="暂无证书"
          description="添加专业资质证书，提升您的求职竞争力。"
          actionLabel="添加证书"
          onAction={() => setEditing(emptyForm())}
        />
      ) : (
        <div className="space-y-3">
          {certifications.map((cert) => (
            <div key={cert.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{cert.name}</h3>
                  <p className="text-sm text-gray-500">{cert.issuer}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    颁发于 {cert.issue_date}
                    {cert.expiry_date && ` · 到期 ${cert.expiry_date}`}
                    {cert.credential_id && <span className="ml-2 font-medium text-gray-500">ID: {cert.credential_id}</span>}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ ...cert })} className="h-8 px-2.5 text-gray-400 hover:text-gray-700 text-xs">编辑</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(cert.id)} disabled={deleting === cert.id} className="h-8 w-8 p-0 text-gray-300 hover:text-red-500">
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
