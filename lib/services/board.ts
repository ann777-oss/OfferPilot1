import { supabase } from '@/lib/supabase';
import type { ResumeVersion, BoardStatus, ResumeEvent } from '@/lib/types';

export async function getBoardResumes(userId: string): Promise<ResumeVersion[]> {
  const { data, error } = await supabase
    .from('resume_versions')
    .select('*, job_descriptions(company_name, job_title, analysis)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ResumeVersion[];
}

export async function moveResumeStatus(
  resumeId: string,
  userId: string,
  fromStatus: BoardStatus,
  toStatus: BoardStatus
): Promise<void> {
  const { error: updateError } = await supabase
    .from('resume_versions')
    .update({ status: toStatus, updated_at: new Date().toISOString() })
    .eq('id', resumeId)
    .eq('user_id', userId);

  if (updateError) throw new Error(updateError.message);

  await supabase.from('resume_events').insert({
    resume_id: resumeId,
    user_id: userId,
    from_status: fromStatus,
    to_status: toStatus,
  });
}

export async function duplicateResume(
  resume: ResumeVersion,
  userId: string
): Promise<ResumeVersion> {
  const { data, error } = await supabase
    .from('resume_versions')
    .insert({
      user_id: userId,
      job_description_id: resume.job_description_id,
      name: `${resume.name} (副本)`,
      content: resume.content,
      status: 'draft',
      is_starred: false,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ResumeVersion;
}

export async function archiveResume(resumeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('resume_versions')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', resumeId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function deleteResume(resumeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('resume_versions')
    .delete()
    .eq('id', resumeId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function getResumeEvents(resumeId: string): Promise<ResumeEvent[]> {
  const { data } = await supabase
    .from('resume_events')
    .select('*')
    .eq('resume_id', resumeId)
    .order('created_at', { ascending: false });
  return (data ?? []) as ResumeEvent[];
}
