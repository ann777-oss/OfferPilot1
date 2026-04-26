'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface OcrResult {
  basic?: {
    full_name?: string;
    professional_title?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
    summary?: string;
  };
  experience?: Array<{
    company: string;
    role: string;
    location: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    bullets: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string;
    gpa: string;
    activities: string;
  }>;
  skills?: Array<{ name: string; category: string; proficiency: string }>;
  projects?: Array<{
    name: string;
    description: string;
    tech_stack: string[];
    live_url: string;
    repo_url: string;
    start_date: string;
    end_date: string;
    highlights: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issue_date: string;
    expiry_date: string;
    credential_id: string;
    credential_url: string;
  }>;
}

type Step = 'upload' | 'processing' | 'preview' | 'saving' | 'done';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  onImported: () => void;
}

export default function ResumeImportModal({ open, onClose, userId, onImported }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProgress('');
    setDragOver(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = useCallback((f: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(f.type)) {
      setError('请上传图片格式文件（JPG、PNG、WebP、GIF）');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }
    setError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file) return;
    setStep('processing');
    setError(null);

    try {
      setProgress('正在上传文件...');
      const ext = file.name.split('.').pop() ?? 'jpg';
      const storagePath = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('resume-uploads')
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) throw new Error(`上传失败: ${uploadError.message}`);

      setProgress('AI 正在识别简历内容...');
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

      const res = await fetch(`${supabaseUrl}/functions/v1/ocr-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ storagePath }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? 'OCR 识别失败');
      }

      const data: OcrResult = await res.json();
      setResult(data);
      setStep('preview');
    } catch (e) {
      setError((e as Error).message);
      setStep('upload');
    }
  };

  const handleImport = async () => {
    if (!result) return;
    setStep('saving');

    try {
      if (result.basic && Object.values(result.basic).some(Boolean)) {
        await supabase.from('user_profiles').upsert(
          { user_id: userId, ...result.basic, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      }

      if (result.experience?.length) {
        await supabase.from('work_experience').insert(
          result.experience.map((e, i) => ({ ...e, user_id: userId, sort_order: i }))
        );
      }

      if (result.education?.length) {
        await supabase.from('education').insert(
          result.education.map((e, i) => ({ ...e, user_id: userId, sort_order: i }))
        );
      }

      if (result.skills?.length) {
        await supabase.from('skills').insert(
          result.skills.map((s, i) => ({ ...s, user_id: userId, sort_order: i }))
        );
      }

      if (result.projects?.length) {
        await supabase.from('projects').insert(
          result.projects.map((p, i) => ({ ...p, user_id: userId, sort_order: i }))
        );
      }

      if (result.certifications?.length) {
        await supabase.from('certifications').insert(
          result.certifications.map((c, i) => ({ ...c, user_id: userId, sort_order: i }))
        );
      }
      setStep('done');
      setTimeout(() => {
        handleClose();
        onImported();
      }, 1500);
    } catch (e) {
      setError((e as Error).message);
      setStep('preview');
    }
  };

  const countItems = (r: OcrResult) => {
    let count = 0;
    if (r.basic && Object.values(r.basic).some(Boolean)) count++;
    if (r.experience?.length) count += r.experience.length;
    if (r.education?.length) count += r.education.length;
    if (r.skills?.length) count += r.skills.length;
    if (r.projects?.length) count += r.projects.length;
    if (r.certifications?.length) count += r.certifications.length;
    return count;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI 一键导入简历
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">上传一张简历截图或扫描件，AI 将自动识别并填充您的职业档案。</p>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {file && preview ? (
                  <div className="space-y-3">
                    <img src={preview} alt="简历预览" className="max-h-40 mx-auto rounded-lg object-contain shadow-sm" />
                    <p className="text-sm font-medium text-green-700">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · 点击更换</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                      <FileImage className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">拖拽图片到此处，或点击选择</p>
                      <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、WebP · 最大 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleClose}>取消</Button>
                <Button
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={!file}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  开始识别
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="font-medium text-gray-900">AI 正在解析中</p>
                <p className="text-sm text-gray-400 mt-1">{progress}</p>
              </div>
              <div className="w-48 mx-auto h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {step === 'preview' && result && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">AI 已识别以下内容，确认后将导入到您的职业档案。</p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {result.basic && Object.values(result.basic).some(Boolean) && (
                  <PreviewSection label="基本信息" items={[
                    result.basic.full_name && `姓名：${result.basic.full_name}`,
                    result.basic.professional_title && `职位：${result.basic.professional_title}`,
                    result.basic.email && `邮箱：${result.basic.email}`,
                    result.basic.phone && `电话：${result.basic.phone}`,
                    result.basic.location && `城市：${result.basic.location}`,
                    result.basic.summary && `简介：${result.basic.summary.slice(0, 60)}...`,
                  ].filter(Boolean) as string[]} />
                )}
                {result.experience?.map((e, i) => (
                  <PreviewSection key={i} label={`工作/实习经历 ${i + 1}`} items={[
                    `${e.role} @ ${e.company}`,
                    `${e.start_date} — ${e.is_current ? '至今' : e.end_date}`,
                    ...e.bullets.slice(0, 2),
                  ].filter(Boolean)} />
                ))}
                {result.education?.map((e, i) => (
                  <PreviewSection key={i} label={`教育背景 ${i + 1}`} items={[
                    `${e.degree} · ${e.institution}`,
                    e.field_of_study && `专业：${e.field_of_study}`,
                  ].filter(Boolean) as string[]} />
                ))}
                {result.skills?.length ? (
                  <PreviewSection label={`技能（${result.skills.length} 项）`} items={result.skills.slice(0, 6).map(s => s.name)} />
                ) : null}
                {result.projects?.map((p, i) => (
                  <PreviewSection key={i} label={`项目 ${i + 1}`} items={[
                    p.name,
                    p.description?.slice(0, 60),
                  ].filter(Boolean) as string[]} />
                ))}
                {result.certifications?.map((c, i) => (
                  <PreviewSection key={i} label={`证书 ${i + 1}`} items={[`${c.name} · ${c.issuer}`]} />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  重新上传
                </button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClose}>取消</Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    导入 {countItems(result)} 条数据
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'saving' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7 text-blue-600 animate-bounce" />
              </div>
              <p className="font-medium text-gray-900">正在保存数据...</p>
            </div>
          )}

          {step === 'done' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">导入成功！</p>
                <p className="text-sm text-gray-400 mt-1">您的职业档案已更新</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</p>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-700 flex gap-1.5">
            <span className="text-blue-400 flex-shrink-0">·</span>
            <span className="truncate">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
