'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert as AlertCircle, FileText, Sparkles, Upload } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { analyzeJobDescription } from '@/lib/services/analysis';
import { getMasterProfile } from '@/lib/services/profile';

type InputMode = 'paste' | 'upload';

const SAMPLE_JD = `AI 产品实习生

公司简介：
某互联网科技公司，主要面向企业客户提供智能办公和数据分析产品。团队正在探索大模型在知识库问答、用户增长和业务自动化场景中的应用。

岗位职责：
1. 协助产品经理完成用户调研、竞品分析和需求整理，输出需求文档和原型说明。
2. 参与 AI 产品功能设计，包括对话流程、提示词策略、知识库配置和效果评估。
3. 跟进研发、设计和测试同学的协作进度，记录问题并推动解决。
4. 分析用户反馈和使用数据，提出产品优化建议。
5. 协助整理产品说明文档、上线材料和内部培训资料。

任职要求：
1. 本科或研究生在读，计算机、信息管理、电子商务、心理学、统计学、新闻传播等相关专业优先。
2. 对 AI 产品、大模型应用或智能工具有兴趣，愿意主动学习。
3. 具备较好的逻辑表达和文档能力，能清晰梳理问题和需求。
4. 熟悉 Axure、Figma、墨刀、飞书文档、Excel 等工具者优先。
5. 每周至少实习 4 天，连续实习 3 个月以上。

加分项：
1. 有校园项目、创新创业项目、产品分析报告或实习经历。
2. 使用过 ChatGPT、通义千问、豆包、Kimi 等 AI 工具，并能总结使用体验。
3. 了解基础数据分析方法，能用表格或 BI 工具完成简单分析。`;

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '分析失败，请重试';

  if (message.includes('DeepSeek API Key')) {
    return 'AI 服务未配置，请先填写 DeepSeek API Key。';
  }
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return '网络连接失败，请检查网络后重试。';
  }

  return message;
}

export default function JobInputPage() {
  const [mode, setMode] = useState<InputMode>('paste');
  const [jobText, setJobText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const handleAnalyze = async () => {
    if (!companyName.trim()) {
      setError('请输入公司名称。');
      return;
    }
    if (!jobTitle.trim()) {
      setError('请输入职位名称。');
      return;
    }
    if (!jobText.trim()) {
      setError('请粘贴职位描述。');
      return;
    }
    if (!user) return;

    setError('');
    setAnalyzing(true);

    try {
      const profile = await getMasterProfile(user.id);
      const analysis = await analyzeJobDescription(jobText, profile);

      const { data, error: insertError } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: user.id,
          company_name: companyName,
          job_title: jobTitle,
          raw_text: jobText,
          source_type: mode,
          analysis: analysis as any,
          match_score: analysis.match_score,
          status: 'analyzed',
        })
        .select('id')
        .single();

      if (insertError || !data) {
        setError('保存职位描述失败，请重试。');
        return;
      }

      router.push(`/jobs/${data.id}/analysis`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">新建求职项目</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            填写目标公司、职位和 JD，创建一条新的岗位申请，并开始后续的简历定制流程。
          </p>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">项目基础信息（必填）</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">公司名称</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="如 字节跳动"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">职位名称</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="如 AI 产品实习生"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setMode('paste')}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors flex-1 justify-center ${mode === 'paste' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="w-4 h-4" />
                粘贴文字
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors flex-1 justify-center ${mode === 'upload' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Upload className="w-4 h-4" />
                上传图片（OCR）
              </button>
            </div>

            <div className="p-5">
              {mode === 'paste' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-600">职位描述</Label>
                    <button
                      onClick={() => setJobText(SAMPLE_JD)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      加载示例 JD
                    </button>
                  </div>
                  <Textarea
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    placeholder="请粘贴完整的职位描述，包括岗位职责、任职要求、加分项等内容。"
                    className="min-h-[280px] resize-none text-sm leading-relaxed"
                  />
                  <p className="text-xs text-gray-400">约 {getWordCount(jobText)} 个词</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-blue-300 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600 mb-1">拖放截图或图片到此处</p>
                    <p className="text-xs text-gray-400 mb-4">支持 PNG、JPG、WEBP</p>
                    <Button variant="outline" size="sm">浏览文件</Button>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      OCR 功能即将上线，目前请直接粘贴职位描述文字。
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">或手动粘贴文字</Label>
                    <Textarea
                      value={jobText}
                      onChange={(e) => setJobText(e.target.value)}
                      placeholder="在此粘贴职位描述..."
                      className="min-h-[200px] resize-none text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">接下来会发生什么？</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  系统会先分析 JD，再把这次申请作为一个求职项目，继续推进简历定制和面试准备。
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !companyName.trim() || !jobTitle.trim() || !jobText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 gap-2 h-11"
            >
              {analyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  创建并分析项目
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
