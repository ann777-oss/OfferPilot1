import type {
  InterviewPackContent,
  InterviewPack,
  InterviewRecord,
  InterviewQuestionRecord,
  ResumeContent,
  JobAnalysis,
  JobDescription
} from '@/lib/types';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// 生成面试准备材料
export async function generateInterviewPack(
  resumeContent: ResumeContent,
  jobAnalysis: JobAnalysis,
  jobDescription: JobDescription
): Promise<InterviewPackContent> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const response = await fetch(`${url}/functions/v1/generate-interview-pack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'Apikey': key,
    },
    body: JSON.stringify({
      resumeContent,
      jobAnalysis,
      jobDescription
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: '未知错误' }));
    throw new Error(err.error || `生成面试包失败 (${response.status})`);
  }

  const content: InterviewPackContent = await response.json();
  return content;
}

// 保存面试准备材料
export async function saveInterviewPack(
  userId: string,
  resumeVersionId: string | null,
  jobDescriptionId: string | null,
  content: InterviewPackContent
): Promise<InterviewPack> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('interview_packs')
    .insert({
      user_id: userId,
      resume_version_id: resumeVersionId,
      job_description_id: jobDescriptionId,
      content,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InterviewPack;
}

// 获取面试准备材料
export async function getInterviewPack(
  resumeVersionId: string
): Promise<InterviewPack | null> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('interview_packs')
    .select('*')
    .eq('resume_version_id', resumeVersionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as InterviewPack | null;
}

// 分析面试反馈
export async function analyzeInterviewFeedback(
  questions: InterviewQuestionRecord[],
  companyName: string,
  interviewType: string,
  jobTitle?: string
): Promise<{ analysis: any; improvements: string[] }> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const response = await fetch(`${url}/functions/v1/analyze-interview-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'Apikey': key,
    },
    body: JSON.stringify({
      questions,
      companyName,
      interviewType,
      jobTitle
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: '未知错误' }));
    throw new Error(err.error || `分析面试反馈失败 (${response.status})`);
  }

  return await response.json();
}

// 创建草稿面试记录（生成面试准备包后自动创建）
export async function createDraftInterviewRecord(
  userId: string,
  resumeVersionId: string,
  companyName: string,
  jobTitle: string,
  interviewType: string = 'technical'
): Promise<InterviewRecord> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const supabase = createClient(url, key);

  // 检查是否已存在草稿记录
  const { data: existing } = await supabase
    .from('interview_records')
    .select('*')
    .eq('user_id', userId)
    .eq('resume_version_id', resumeVersionId)
    .eq('status', 'draft')
    .maybeSingle();

  if (existing) {
    return existing as InterviewRecord;
  }

  // 创建新的草稿记录
  const { data, error } = await supabase
    .from('interview_records')
    .insert({
      user_id: userId,
      resume_version_id: resumeVersionId,
      company_name: companyName,
      interview_date: new Date().toISOString().split('T')[0], // 默认今天
      interview_type: interviewType,
      questions: [],
      overall_rating: 3,
      improvements: [],
      notes: `${jobTitle} - 待填写面试复盘`,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InterviewRecord;
}

// 保存面试复盘记录
export async function saveInterviewRecord(
  userId: string,
  resumeVersionId: string | null,
  companyName: string,
  interviewDate: string,
  interviewType: string,
  questions: InterviewQuestionRecord[],
  overallRating: number,
  improvements: string[],
  notes: string,
  status: 'draft' | 'completed' = 'completed'
): Promise<InterviewRecord> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('interview_records')
    .insert({
      user_id: userId,
      resume_version_id: resumeVersionId,
      company_name: companyName,
      interview_date: interviewDate,
      interview_type: interviewType,
      questions,
      overall_rating: overallRating,
      improvements,
      notes,
      status,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InterviewRecord;
}

// 获取用户的所有面试记录
export async function getInterviewRecords(
  userId: string
): Promise<InterviewRecord[]> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('interview_records')
    .select('*')
    .eq('user_id', userId)
    .order('interview_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data as InterviewRecord[];
}

// 获取单个面试记录
export async function getInterviewRecord(
  recordId: string
): Promise<InterviewRecord | null> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('interview_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (error) throw new Error(error.message);
  return data as InterviewRecord | null;
}

// 更新面试记录
export async function updateInterviewRecord(
  recordId: string,
  updates: Partial<InterviewRecord>
): Promise<InterviewRecord> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('interview_records')
    .update(updates)
    .eq('id', recordId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InterviewRecord;
}

// 删除面试记录
export async function deleteInterviewRecord(
  recordId: string
): Promise<void> {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 配置缺失');

  const supabase = createClient(url, key);

  const { error } = await supabase
    .from('interview_records')
    .delete()
    .eq('id', recordId);

  if (error) throw new Error(error.message);
}
