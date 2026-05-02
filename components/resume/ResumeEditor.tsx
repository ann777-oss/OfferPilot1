'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ResumeContent } from '@/lib/types';

interface ResumeEditorProps {
  content: ResumeContent;
  onUpdate: (c: ResumeContent) => void;
}

function Field({ label, value, onChange, multiline, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {multiline ? (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none min-h-[72px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      ) : (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
  defaultOpen = true,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-3 space-y-4">
          {children}
          {footer && (
            <div className="flex justify-end -mt-2" onClick={(e) => e.stopPropagation()}>
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResumeEditor({ content, onUpdate }: ResumeEditorProps) {
  const [local, setLocal] = useState<ResumeContent>(content);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const { toast } = useToast();

  const save = async () => {
    setSaving(true);
    await onUpdate(local);
    setSaving(false);
    toast({ title: '更改已保存！' });
  };

  useEffect(() => {
    setLocal(content);
  }, [content]);

  const saveSection = async (sectionTitle: string) => {
    setSavingSection(sectionTitle);
    try {
      await onUpdate(local);
      toast({ title: `${sectionTitle}已保存` });
    } finally {
      setSavingSection(null);
    }
  };

  const renderSectionSaveButton = (sectionTitle: string) => (
    <Button
      type="button"
      size="sm"
      onClick={() => saveSection(sectionTitle)}
      disabled={saving || savingSection !== null}
      className="h-7 gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] px-2.5 rounded-md"
    >
      {savingSection === sectionTitle ? (
        <><span className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />保存中...</>
      ) : (
        <><Save className="w-3 h-3" />保存</>
      )}
    </Button>
  );

  const setHeader = (key: keyof ResumeContent['header'], val: string) =>
    setLocal((p) => ({ ...p, header: { ...p.header, [key]: val } }));

  const setKeyword = (i: number, val: string) =>
    setLocal((p) => {
      const kws = [...(p.core_keywords ?? [])];
      kws[i] = val;
      return { ...p, core_keywords: kws };
    });

  const addKeyword = () =>
    setLocal((p) => ({ ...p, core_keywords: [...(p.core_keywords ?? []), ''] }));

  const removeKeyword = (i: number) =>
    setLocal((p) => ({ ...p, core_keywords: (p.core_keywords ?? []).filter((_, j) => j !== i) }));

  const setExpField = (idx: number, key: string, val: string | boolean) =>
    setLocal((p) => {
      const exp = [...p.experience];
      exp[idx] = { ...exp[idx], [key]: val };
      return { ...p, experience: exp };
    });

  const setExpBullet = (idx: number, bi: number, val: string) =>
    setLocal((p) => {
      const exp = [...p.experience];
      const bullets = [...exp[idx].bullets];
      bullets[bi] = val;
      exp[idx] = { ...exp[idx], bullets };
      return { ...p, experience: exp };
    });

  const addExpBullet = (idx: number) =>
    setLocal((p) => {
      const exp = [...p.experience];
      exp[idx] = { ...exp[idx], bullets: [...exp[idx].bullets, ''] };
      return { ...p, experience: exp };
    });

  const removeExpBullet = (idx: number, bi: number) =>
    setLocal((p) => {
      const exp = [...p.experience];
      exp[idx] = { ...exp[idx], bullets: exp[idx].bullets.filter((_, j) => j !== bi) };
      return { ...p, experience: exp };
    });

  const addExperience = () =>
    setLocal((p) => ({
      ...p,
      experience: [...p.experience, {
        id: `exp-${Date.now()}`,
        company: '', role: '', location: '',
        start_date: '', end_date: '', is_current: false, bullets: [''],
      }],
    }));

  const removeExperience = (idx: number) =>
    setLocal((p) => ({ ...p, experience: p.experience.filter((_, j) => j !== idx) }));

  const setProjField = (idx: number, key: string, val: string | string[]) =>
    setLocal((p) => {
      const projects = [...p.projects];
      projects[idx] = { ...projects[idx], [key]: val };
      return { ...p, projects };
    });

  const setProjHighlight = (idx: number, hi: number, val: string) =>
    setLocal((p) => {
      const projects = [...p.projects];
      const highlights = [...projects[idx].highlights];
      highlights[hi] = val;
      projects[idx] = { ...projects[idx], highlights };
      return { ...p, projects };
    });

  const addProjHighlight = (idx: number) =>
    setLocal((p) => {
      const projects = [...p.projects];
      projects[idx] = { ...projects[idx], highlights: [...projects[idx].highlights, ''] };
      return { ...p, projects };
    });

  const removeProjHighlight = (idx: number, hi: number) =>
    setLocal((p) => {
      const projects = [...p.projects];
      projects[idx] = { ...projects[idx], highlights: projects[idx].highlights.filter((_, j) => j !== hi) };
      return { ...p, projects };
    });

  const addProject = () =>
    setLocal((p) => ({
      ...p,
      projects: [...p.projects, {
        id: `proj-${Date.now()}`,
        name: '', description: '', tech_stack: [], live_url: '', repo_url: '', highlights: [''],
      }],
    }));

  const removeProject = (idx: number) =>
    setLocal((p) => ({ ...p, projects: p.projects.filter((_, j) => j !== idx) }));

  const setCampusField = (idx: number, key: string, val: string | boolean) =>
    setLocal((p) => {
      const campusActivities = [...(p.campusActivities ?? [])];
      campusActivities[idx] = { ...campusActivities[idx], [key]: val };
      return { ...p, campusActivities };
    });

  const setCampusHighlight = (idx: number, hi: number, val: string) =>
    setLocal((p) => {
      const campusActivities = [...(p.campusActivities ?? [])];
      const highlights = [...campusActivities[idx].highlights];
      highlights[hi] = val;
      campusActivities[idx] = { ...campusActivities[idx], highlights };
      return { ...p, campusActivities };
    });

  const addCampusHighlight = (idx: number) =>
    setLocal((p) => {
      const campusActivities = [...(p.campusActivities ?? [])];
      campusActivities[idx] = { ...campusActivities[idx], highlights: [...campusActivities[idx].highlights, ''] };
      return { ...p, campusActivities };
    });

  const removeCampusHighlight = (idx: number, hi: number) =>
    setLocal((p) => {
      const campusActivities = [...(p.campusActivities ?? [])];
      campusActivities[idx] = { ...campusActivities[idx], highlights: campusActivities[idx].highlights.filter((_, j) => j !== hi) };
      return { ...p, campusActivities };
    });

  const addCampusActivity = () =>
    setLocal((p) => ({
      ...p,
      campusActivities: [...(p.campusActivities ?? []), {
        id: `campus-${Date.now()}`,
        organization: '',
        role: '',
        activity_type: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
        highlights: [''],
      }],
    }));

  const removeCampusActivity = (idx: number) =>
    setLocal((p) => ({ ...p, campusActivities: (p.campusActivities ?? []).filter((_, j) => j !== idx) }));

  const setEduField = (idx: number, key: string, val: string) =>
    setLocal((p) => {
      const education = [...p.education];
      education[idx] = { ...education[idx], [key]: val };
      return { ...p, education };
    });

  const addEducation = () =>
    setLocal((p) => ({
      ...p,
      education: [...p.education, {
        id: `edu-${Date.now()}`,
        institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', gpa: '',
      }],
    }));

  const removeEducation = (idx: number) =>
    setLocal((p) => ({ ...p, education: p.education.filter((_, j) => j !== idx) }));

  const setSkillCategory = (idx: number, val: string) =>
    setLocal((p) => {
      const skills = [...p.skills];
      skills[idx] = { ...skills[idx], category: val };
      return { ...p, skills };
    });

  const setSkillItems = (idx: number, val: string) =>
    setLocal((p) => {
      const skills = [...p.skills];
      skills[idx] = { ...skills[idx], items: val.split(/[,，·]/).map((s) => s.trim()).filter(Boolean) };
      return { ...p, skills };
    });

  const addSkillGroup = () =>
    setLocal((p) => ({ ...p, skills: [...p.skills, { category: '', items: [] }] }));

  const removeSkillGroup = (idx: number) =>
    setLocal((p) => ({ ...p, skills: p.skills.filter((_, j) => j !== idx) }));

  const setCertField = (idx: number, key: string, val: string) =>
    setLocal((p) => {
      const certifications = [...p.certifications];
      certifications[idx] = { ...certifications[idx], [key]: val };
      return { ...p, certifications };
    });

  const addCert = () =>
    setLocal((p) => ({
      ...p,
      certifications: [...p.certifications, { id: `cert-${Date.now()}`, name: '', issuer: '', issue_date: '' }],
    }));

  const removeCert = (idx: number) =>
    setLocal((p) => ({ ...p, certifications: p.certifications.filter((_, j) => j !== idx) }));

  return (
    <div className="space-y-3">
      <SectionCard title="个人信息" footer={renderSectionSaveButton('个人信息')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="姓名" value={local.header.name} onChange={(v) => setHeader('name', v)} />
          <Field label="职位头衔" value={local.header.title} onChange={(v) => setHeader('title', v)} />
          <Field label="邮箱" value={local.header.email} onChange={(v) => setHeader('email', v)} />
          <Field label="电话" value={local.header.phone} onChange={(v) => setHeader('phone', v)} />
          <Field label="城市" value={local.header.location} onChange={(v) => setHeader('location', v)} />
          <Field label="LinkedIn" value={local.header.linkedin} onChange={(v) => setHeader('linkedin', v)} />
          <Field label="GitHub" value={local.header.github} onChange={(v) => setHeader('github', v)} />
          <Field label="个人网站" value={local.header.website} onChange={(v) => setHeader('website', v)} />
          <Field label="证件照 URL" value={local.header.avatar_url ?? ''} onChange={(v) => setHeader('avatar_url', v)} />
        </div>
      </SectionCard>

      {local.core_keywords !== undefined && (
        <SectionCard title="核心能力关键词" footer={renderSectionSaveButton('核心能力关键词')}>
          <div className="space-y-2">
            {(local.core_keywords ?? []).map((kw, i) => (
              <div key={i} className="flex gap-2 items-center">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <input
                  type="text"
                  value={kw}
                  onChange={(e) => setKeyword(i, e.target.value)}
                  placeholder="如：新媒体运营"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button onClick={() => removeKeyword(i)} className="p-1.5 text-gray-300 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={addKeyword} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
              <Plus className="w-4 h-4" />添加关键词
            </button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="个人简介" footer={renderSectionSaveButton('个人简介')}>
        <textarea
          value={local.summary ?? ''}
          onChange={(e) => setLocal({ ...local, summary: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="针对岗位的个人简介..."
        />
      </SectionCard>

      <SectionCard title="工作经历" footer={renderSectionSaveButton('工作经历')}>
        <div className="space-y-5">
          {local.experience.map((exp, idx) => (
            <div key={exp.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">经历 {idx + 1}</span>
                <button onClick={() => removeExperience(idx)} className="p-1 text-gray-300 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="公司名称" value={exp.company} onChange={(v) => setExpField(idx, 'company', v)} />
                <Field label="职位名称" value={exp.role} onChange={(v) => setExpField(idx, 'role', v)} />
                <Field label="城市/地点" value={exp.location} onChange={(v) => setExpField(idx, 'location', v)} />
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    checked={exp.is_current}
                    onChange={(e) => setExpField(idx, 'is_current', e.target.checked)}
                    id={`current-${idx}`}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor={`current-${idx}`} className="text-sm text-gray-600">在职中</label>
                </div>
                <Field label="开始时间 (YYYY-MM)" value={exp.start_date} onChange={(v) => setExpField(idx, 'start_date', v)} placeholder="2024-01" />
                {!exp.is_current && (
                  <Field label="结束时间 (YYYY-MM)" value={exp.end_date} onChange={(v) => setExpField(idx, 'end_date', v)} placeholder="2024-12" />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500">工作亮点</label>
                {exp.bullets.map((bullet, bi) => (
                  <div key={bi} className="flex gap-2 items-start">
                    <span className="text-blue-400 text-sm mt-2.5 flex-shrink-0">•</span>
                    <textarea
                      value={bullet}
                      onChange={(e) => setExpBullet(idx, bi, e.target.value)}
                      placeholder="以强动词开头，包含数据和 JD 关键词..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none min-h-[64px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button onClick={() => removeExpBullet(idx, bi)} className="mt-2 p-1 text-gray-300 hover:text-red-400 transition flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addExpBullet(idx)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
                  <Plus className="w-4 h-4" />添加亮点
                </button>
              </div>
            </div>
          ))}
          <button onClick={addExperience} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
            <Plus className="w-4 h-4" />添加工作经历
          </button>
        </div>
      </SectionCard>

      <SectionCard title="项目经历" footer={renderSectionSaveButton('项目经历')}>
        <div className="space-y-5">
          {local.projects.map((proj, idx) => (
            <div key={proj.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">项目 {idx + 1}</span>
                <button onClick={() => removeProject(idx)} className="p-1 text-gray-300 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="项目名称" value={proj.name} onChange={(v) => setProjField(idx, 'name', v)} />
                <Field label="技术栈 (逗号分隔)" value={proj.tech_stack.join('、')} onChange={(v) => setProjField(idx, 'tech_stack', v.split(/[,，、]/).map(s => s.trim()).filter(Boolean))} />
                <Field label="项目链接" value={proj.live_url ?? ''} onChange={(v) => setProjField(idx, 'live_url', v)} />
                <Field label="代码仓库" value={proj.repo_url ?? ''} onChange={(v) => setProjField(idx, 'repo_url', v)} />
              </div>
              <Field label="项目描述" value={proj.description} onChange={(v) => setProjField(idx, 'description', v)} multiline placeholder="一句话描述项目价值..." />
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500">项目亮点</label>
                {proj.highlights.map((h, hi) => (
                  <div key={hi} className="flex gap-2 items-start">
                    <span className="text-blue-400 text-sm mt-2.5 flex-shrink-0">•</span>
                    <textarea
                      value={h}
                      onChange={(e) => setProjHighlight(idx, hi, e.target.value)}
                      placeholder="量化成就..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none min-h-[56px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button onClick={() => removeProjHighlight(idx, hi)} className="mt-2 p-1 text-gray-300 hover:text-red-400 transition flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addProjHighlight(idx)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
                  <Plus className="w-4 h-4" />添加亮点
                </button>
              </div>
            </div>
          ))}
          <button onClick={addProject} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
            <Plus className="w-4 h-4" />添加项目
          </button>
        </div>
      </SectionCard>

      <SectionCard title="教育背景" footer={renderSectionSaveButton('教育背景')}>
        <div className="space-y-4">
          {local.education.map((edu, idx) => (
            <div key={edu.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">学历 {idx + 1}</span>
                <button onClick={() => removeEducation(idx)} className="p-1 text-gray-300 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="学校名称" value={edu.institution} onChange={(v) => setEduField(idx, 'institution', v)} />
                <Field label="学位" value={edu.degree} onChange={(v) => setEduField(idx, 'degree', v)} placeholder="本科 / 硕士" />
                <Field label="专业" value={edu.field_of_study} onChange={(v) => setEduField(idx, 'field_of_study', v)} />
                <Field label="GPA" value={edu.gpa ?? ''} onChange={(v) => setEduField(idx, 'gpa', v)} placeholder="3.8/4.0" />
                <Field label="开始时间 (YYYY-MM)" value={edu.start_date} onChange={(v) => setEduField(idx, 'start_date', v)} placeholder="2021-09" />
                <Field label="结束时间 (YYYY-MM)" value={edu.end_date} onChange={(v) => setEduField(idx, 'end_date', v)} placeholder="2025-06" />
              </div>
            </div>
          ))}
          <button onClick={addEducation} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
            <Plus className="w-4 h-4" />添加教育经历
          </button>
        </div>
      </SectionCard>

      <SectionCard title="校园经历" footer={renderSectionSaveButton('校园经历')}>
        <div className="space-y-5">
          {(local.campusActivities ?? []).map((activity, idx) => (
            <div key={activity.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">校园经历 {idx + 1}</span>
                <button onClick={() => removeCampusActivity(idx)} className="p-1 text-gray-300 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="组织/活动名称" value={activity.organization} onChange={(v) => setCampusField(idx, 'organization', v)} />
                <Field label="角色" value={activity.role} onChange={(v) => setCampusField(idx, 'role', v)} />
                <Field label="类型" value={activity.activity_type} onChange={(v) => setCampusField(idx, 'activity_type', v)} placeholder="学生组织 / 志愿活动 / 竞赛" />
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    checked={activity.is_current}
                    onChange={(e) => setCampusField(idx, 'is_current', e.target.checked)}
                    id={`campus-current-${idx}`}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor={`campus-current-${idx}`} className="text-sm text-gray-600">进行中</label>
                </div>
                <Field label="开始时间 (YYYY-MM)" value={activity.start_date} onChange={(v) => setCampusField(idx, 'start_date', v)} placeholder="2023-09" />
                {!activity.is_current && (
                  <Field label="结束时间 (YYYY-MM)" value={activity.end_date} onChange={(v) => setCampusField(idx, 'end_date', v)} placeholder="2024-06" />
                )}
              </div>
              <Field label="经历概述" value={activity.description} onChange={(v) => setCampusField(idx, 'description', v)} multiline placeholder="一句话描述校园经历价值..." />
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500">成果亮点</label>
                {activity.highlights.map((highlight, hi) => (
                  <div key={hi} className="flex gap-2 items-start">
                    <span className="text-blue-400 text-sm mt-2.5 flex-shrink-0">•</span>
                    <textarea
                      value={highlight}
                      onChange={(e) => setCampusHighlight(idx, hi, e.target.value)}
                      placeholder="组织活动、协调资源、获得奖项等量化成果..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none min-h-[56px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button onClick={() => removeCampusHighlight(idx, hi)} className="mt-2 p-1 text-gray-300 hover:text-red-400 transition flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addCampusHighlight(idx)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
                  <Plus className="w-4 h-4" />添加亮点
                </button>
              </div>
            </div>
          ))}
          <button onClick={addCampusActivity} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
            <Plus className="w-4 h-4" />添加校园经历
          </button>
        </div>
      </SectionCard>

      <SectionCard title="专业技能" footer={renderSectionSaveButton('专业技能')}>
        <div className="space-y-3">
          {local.skills.map((group, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-shrink-0 w-32">
                <input
                  type="text"
                  value={group.category}
                  onChange={(e) => setSkillCategory(idx, e.target.value)}
                  placeholder="分类名称"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <input
                type="text"
                value={group.items.join('、')}
                onChange={(e) => setSkillItems(idx, e.target.value)}
                placeholder="技能1、技能2、技能3（逗号或顿号分隔）"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button onClick={() => removeSkillGroup(idx)} className="mt-1 p-1.5 text-gray-300 hover:text-red-400 transition flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addSkillGroup} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
            <Plus className="w-4 h-4" />添加技能分类
          </button>
        </div>
      </SectionCard>

      <SectionCard title="证书 & 奖项" defaultOpen={false} footer={renderSectionSaveButton('证书 & 奖项')}>
        <div className="space-y-3">
          {local.certifications.map((cert, idx) => (
            <div key={cert.id} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) => setCertField(idx, 'name', e.target.value)}
                  placeholder="证书名称"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <input
                  type="text"
                  value={cert.issuer}
                  onChange={(e) => setCertField(idx, 'issuer', e.target.value)}
                  placeholder="颁发机构"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <input
                  type="text"
                  value={cert.issue_date}
                  onChange={(e) => setCertField(idx, 'issue_date', e.target.value)}
                  placeholder="YYYY-MM"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <button onClick={() => removeCert(idx)} className="mt-1 p-1.5 text-gray-300 hover:text-red-400 transition flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addCert} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition">
            <Plus className="w-4 h-4" />添加证书
          </button>
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2 pb-6">
        <Button onClick={save} disabled={saving || savingSection !== null} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6">
          {saving ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</>
          ) : (
            <><Save className="w-3.5 h-3.5" />保存全部更改</>
          )}
        </Button>
      </div>
    </div>
  );
}
