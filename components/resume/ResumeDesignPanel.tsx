'use client';

import { useState } from 'react';
import { Eye, EyeOff, GripVertical, RotateCcw, Save, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ResumeContent, ResumeDesignSettings, ResumeSectionId } from '@/lib/types';
import { getDefaultResumeDesign, normalizeResumeDesign, SECTION_LABELS } from '@/lib/resume-design';

interface Props {
  content: ResumeContent;
  onChange: (design: ResumeDesignSettings) => void;
  onSave: () => void;
  saving: boolean;
}

export default function ResumeDesignPanel({ content, onChange, onSave, saving }: Props) {
  const design = normalizeResumeDesign(content);
  const [draggingSection, setDraggingSection] = useState<ResumeSectionId | null>(null);
  const [dragOverSection, setDragOverSection] = useState<ResumeSectionId | null>(null);

  const update = (patch: Partial<ResumeDesignSettings>) => {
    onChange({ ...design, ...patch });
  };

  const toggleSection = (section: ResumeSectionId, visible: boolean) => {
    const hiddenSections = visible
      ? design.hiddenSections.filter((id) => id !== section)
      : design.hiddenSections.includes(section)
        ? design.hiddenSections
        : [...design.hiddenSections, section];
    update({ hiddenSections });
  };

  const reorderSection = (target: ResumeSectionId) => {
    if (!draggingSection || draggingSection === target) return;
    const next = [...design.sectionOrder];
    const from = next.indexOf(draggingSection);
    const to = next.indexOf(target);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, draggingSection);
    update({ sectionOrder: next });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-600" />
            排版设计
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(getDefaultResumeDesign(content))}
            className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            重置
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1">调整后会立即反映在左侧预览。</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">模块顺序与显示</p>
        <div className="space-y-1.5">
          {design.sectionOrder.map((section, index) => {
            const visible = !design.hiddenSections.includes(section);
            return (
              <div
                key={section}
                draggable
                onDragStart={(e) => {
                  setDraggingSection(section);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', section);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverSection(section);
                }}
                onDragLeave={() => setDragOverSection((current) => current === section ? null : current)}
                onDrop={(e) => {
                  e.preventDefault();
                  reorderSection(section);
                  setDraggingSection(null);
                  setDragOverSection(null);
                }}
                onDragEnd={() => {
                  setDraggingSection(null);
                  setDragOverSection(null);
                }}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all ${
                  dragOverSection === section && draggingSection !== section
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-100 bg-gray-50'
                } ${draggingSection === section ? 'opacity-50' : ''}`}
              >
                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0" />
                <Switch
                  checked={visible}
                  onCheckedChange={(checked) => toggleSection(section, checked)}
                  className="scale-75 data-[state=checked]:bg-blue-600"
                />
                {visible ? <Eye className="w-3.5 h-3.5 text-gray-400" /> : <EyeOff className="w-3.5 h-3.5 text-gray-300" />}
                <span className={`flex-1 text-xs font-medium ${visible ? 'text-gray-700' : 'text-gray-400'}`}>
                  {SECTION_LABELS[section]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">页面样式</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">左右边距</label>
            <span className="text-xs text-gray-400">{design.marginX}px</span>
          </div>
          <Slider value={[design.marginX]} min={24} max={64} step={2} onValueChange={([value]) => update({ marginX: value })} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">上下边距</label>
            <span className="text-xs text-gray-400">{design.marginY}px</span>
          </div>
          <Slider value={[design.marginY]} min={20} max={56} step={2} onValueChange={([value]) => update({ marginY: value })} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">字号比例</label>
            <span className="text-xs text-gray-400">{design.fontScale}%</span>
          </div>
          <Slider value={[design.fontScale]} min={88} max={112} step={1} onValueChange={([value]) => update({ fontScale: value })} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">行距</label>
            <span className="text-xs text-gray-400">{design.lineHeight.toFixed(2)}</span>
          </div>
          <Slider value={[design.lineHeight]} min={1.25} max={1.75} step={0.05} onValueChange={([value]) => update({ lineHeight: value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">字体</label>
          <Select value={design.fontFamily} onValueChange={(value) => update({ fontFamily: value as ResumeDesignSettings['fontFamily'] })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="microsoft">微软雅黑 / 默认</SelectItem>
              <SelectItem value="simsun">宋体</SelectItem>
              <SelectItem value="arial">Arial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={onSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
        {saving ? (
          <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</>
        ) : (
          <><Save className="w-3.5 h-3.5" />保存排版</>
        )}
      </Button>
    </div>
  );
}
