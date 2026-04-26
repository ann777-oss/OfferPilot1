'use client';

import { useState, useRef } from 'react';
import { X, Check, Upload, FileImage, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TemplateSelection } from '@/lib/types';
export type { TemplateSelection } from '@/lib/types';

const BUILTIN_TEMPLATES: TemplateSelection[] = [
  {
    type: 'builtin',
    id: 'classic-chinese',
    label: '中文经典版',
    imageUrl: '/resume-templates/338ee8019261e51e6986026b3b59fb5e.jpg',
    styleDescription:
      '左上角大字姓名，右上角照片，顶部紧凑联系信息行（电话 | 邮箱 | 微信）。各板块标题（教育背景 / 实习经历 / 项目经历 / 校园经历 / 技能特长）用蓝色加粗并加下划线横线分隔，左对齐。每条经历：日期左对齐（YYYY.MM-YYYY.MM）、机构/公司居中加粗、职位/学位右对齐，三列布局于同一行。要点前使用实心圆点（●），关键词加粗。整体字体宋体/黑体混排，行间距紧凑，专业严谨风格。',
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (template: TemplateSelection) => void;
  generating: boolean;
}

export default function TemplatePickerModal({ open, onClose, onConfirm, generating }: Props) {
  const [selected, setSelected] = useState<TemplateSelection>(BUILTIN_TEMPLATES[0]);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('请上传图片文件（JPG / PNG / WEBP）');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('文件大小不能超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setCustomPreview(url);
      setSelected({
        type: 'custom',
        id: 'custom-upload',
        label: file.name,
        imageUrl: url,
        styleDescription:
          '请严格模仿用户上传的简历模版图片的版式风格：字体大小层级、板块标题样式、经历条目的日期/机构/职位排列方式、要点符号、分隔线使用方式，以及整体的留白和紧凑程度。',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectBuiltin = (tpl: TemplateSelection) => {
    setSelected(tpl);
    setCustomPreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">选择简历模版</h2>
            <p className="text-xs text-gray-500 mt-0.5">内置模版会应用对应排版，自定义模版用于 AI 参考内容风格</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Built-in templates */}
            {BUILTIN_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleSelectBuiltin(tpl)}
                className={`group relative rounded-xl border-2 overflow-hidden transition-all text-left ${
                  selected.id === tpl.id && selected.type === 'builtin'
                    ? 'border-blue-500 shadow-md shadow-blue-100'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50">
                  <img
                    src={tpl.imageUrl}
                    alt={tpl.label}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="px-3 py-2.5 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-800">{tpl.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">内置模版</p>
                </div>
                {selected.id === tpl.id && selected.type === 'builtin' && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            ))}

            {/* Upload custom template */}
            <button
              onClick={() => fileRef.current?.click()}
              className={`group relative rounded-xl border-2 border-dashed overflow-hidden transition-all text-left ${
                selected.type === 'custom'
                  ? 'border-blue-500 shadow-md shadow-blue-100'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {customPreview ? (
                <>
                  <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50">
                    <img src={customPreview} alt="自定义模版" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="px-3 py-2.5 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-800 truncate">{selected.label}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">点击重新上传</p>
                  </div>
                  {selected.type === 'custom' && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-3 p-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-700">上传自定义模版</p>
                    <p className="text-[10px] text-gray-400 mt-1">用于风格参考<br />暂不精确复刻排版</p>
                  </div>
                </div>
              )}
            </button>
          </div>

          {uploadError && (
            <p className="mt-3 text-xs text-red-500 flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5" />{uploadError}
            </p>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Style description preview */}
          {selected && (
            <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />AI 将模仿的样式要点
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">{selected.styleDescription}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">已选：<span className="font-medium text-gray-600">{selected.label ?? '未选择'}</span></p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button
              size="sm"
              onClick={() => onConfirm(selected)}
              disabled={generating || !selected}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {generating ? (
                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />生成中...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" />确认并生成</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
