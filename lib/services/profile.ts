import { supabase } from '@/lib/supabase';
import type {
  UserProfile,
  Education,
  WorkExperience,
  Project,
  Skill,
  Certification,
  ProfileLink,
  CampusActivity,
  MasterProfile,
} from '@/lib/types';

export async function getMasterProfile(userId: string): Promise<MasterProfile> {
  const [
    profileRes,
    educationRes,
    workRes,
    projectsRes,
    skillsRes,
    certsRes,
    linksRes,
    campusRes,
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('education').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('work_experience').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('projects').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('skills').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('certifications').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('profile_links').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('campus_activities').select('*').eq('user_id', userId).order('sort_order'),
  ]);

  return {
    profile: profileRes.data as UserProfile | null,
    education: (educationRes.data ?? []) as Education[],
    workExperience: (workRes.data ?? []) as WorkExperience[],
    projects: (projectsRes.data ?? []) as Project[],
    skills: (skillsRes.data ?? []) as Skill[],
    certifications: (certsRes.data ?? []) as Certification[],
    links: (linksRes.data ?? []) as ProfileLink[],
    campusActivities: (campusRes.data ?? []) as CampusActivity[],
  };
}

export async function upsertProfile(userId: string, data: Partial<UserProfile>) {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ ...data, user_id: userId, updated_at: new Date().toISOString() });
  return { error };
}

export async function calculateProfileCompletion(profile: MasterProfile): Promise<number> {
  let score = 0;
  const p = profile.profile;
  if (!p) return 0;

  if (p.full_name) score += 10;
  if (p.professional_title) score += 10;
  if (p.email) score += 10;
  if (p.phone) score += 5;
  if (p.location) score += 5;
  if (p.summary && p.summary.length > 50) score += 15;
  if (profile.education.length > 0) score += 10;
  if (profile.workExperience.length > 0) score += 20;
  if (profile.projects.length > 0) score += 10;
  if (profile.campusActivities.length > 0) score += 5;
  if (profile.skills.length >= 3) score += 10;
  if (profile.certifications.length > 0) score += 5;

  return Math.min(score, 100);
}

export async function updateProfileCompletion(userId: string, profile?: MasterProfile): Promise<number> {
  const currentProfile = profile ?? await getMasterProfile(userId);
  const completion = await calculateProfileCompletion(currentProfile);

  if (currentProfile.profile) {
    await supabase
      .from('user_profiles')
      .update({ profile_completion: completion, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  return completion;
}
