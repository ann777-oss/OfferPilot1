import { supabase } from '@/lib/supabase';
import type {
  JobProject,
  ProjectProgress,
  JobDescription,
  ResumeVersion,
  InterviewPack,
  InterviewRecord
} from '@/lib/types';

// 计算项目进度
export function calculateProjectProgress(
  resumes: ResumeVersion[],
  interviewPacks: InterviewPack[],
  interviewRecords: InterviewRecord[],
  job?: JobDescription
): ProjectProgress {
  const hasResume = resumes.length > 0;
  const hasInterviewPrep = interviewPacks.length > 0;
  const hasInterviewRecord = interviewRecords.some(r => r.status === 'completed');
  const latestInterviewRecord = interviewRecords[0] ?? null;
  const hasOffer = Boolean(
    job?.status === 'offer' ||
    job?.offer_salary ||
    job?.offer_city ||
    job?.offer_department ||
    job?.offer_work_mode ||
    job?.offer_conversion_opportunity ||
    job?.offer_reply_deadline ||
    job?.offer_notes
  );

  return {
    hasResume,
    resumeId: resumes[0]?.id || null,
    hasInterviewPrep,
    interviewPrepId: interviewPacks[0]?.id || null,
    hasInterviewRecord,
    interviewRecordId: latestInterviewRecord?.id || null,
    interviewRecordStatus: latestInterviewRecord?.status || null,
    hasOffer,
    completedSteps: [hasResume, hasInterviewPrep, hasInterviewRecord, hasOffer].filter(Boolean).length
  };
}

// 获取单个项目的详细信息
export async function getJobProject(jobId: string, userId: string): Promise<JobProject | null> {
  try {
    // 1. 获取职位描述
    const { data: job, error: jobError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .maybeSingle();

    if (jobError || !job) {
      console.error('获取职位描述失败:', jobError);
      return null;
    }

    // 2. 获取关联的简历
    const { data: resumes, error: resumesError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('job_description_id', jobId)
      .order('created_at', { ascending: false });

    if (resumesError) {
      console.error('获取简历失败:', resumesError);
    }

    const resumesList = (resumes || []) as ResumeVersion[];
    const latestResume = resumesList[0];

    // 3. 获取面试准备包
    const { data: interviewPacks, error: packsError } = await supabase
      .from('interview_packs')
      .select('*')
      .eq('job_description_id', jobId);

    if (packsError) {
      console.error('获取面试准备包失败:', packsError);
    }

    const packsList = (interviewPacks || []) as InterviewPack[];

    // 4. 获取面试记录（通过最新简历关联）
    let recordsList: InterviewRecord[] = [];
    if (latestResume) {
      const { data: interviewRecords, error: recordsError } = await supabase
        .from('interview_records')
        .select('*')
        .eq('resume_version_id', latestResume.id)
        .order('created_at', { ascending: false });

      if (recordsError) {
        console.error('获取面试记录失败:', recordsError);
      }

      recordsList = (interviewRecords || []) as InterviewRecord[];
    }

    // 5. 计算进度
    const progress = calculateProjectProgress(resumesList, packsList, recordsList, job as JobDescription);

    return {
      job: job as JobDescription,
      resumes: resumesList,
      interviewPacks: packsList,
      interviewRecords: recordsList,
      progress
    };
  } catch (error) {
    console.error('获取项目详情失败:', error);
    return null;
  }
}

export async function updateJobProjectStatus(jobId: string, userId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('job_descriptions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('user_id', userId);

    if (error) {
      console.error('更新求职项目状态失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('更新求职项目状态失败:', error);
    return false;
  }
}

// 获取用户的所有求职项目（简化版，只返回职位列表）
export async function getJobProjects(userId: string): Promise<JobDescription[]> {
  try {
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取求职项目列表失败:', error);
      return [];
    }

    return (data || []) as JobDescription[];
  } catch (error) {
    console.error('获取求职项目列表失败:', error);
    return [];
  }
}
