export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          professional_title: string;
          email: string;
          phone: string;
          location: string;
          website: string;
          linkedin: string;
          github: string;
          avatar_url: string;
          summary: string;
          profile_completion: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>;
      };
      education: {
        Row: {
          id: string;
          user_id: string;
          institution: string;
          degree: string;
          field_of_study: string;
          start_date: string;
          end_date: string;
          gpa: string;
          activities: string;
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['education']['Row']> & { user_id: string; institution: string; degree: string };
        Update: Partial<Database['public']['Tables']['education']['Row']>;
      };
      work_experience: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          role: string;
          location: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          bullets: string[];
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['work_experience']['Row']> & { user_id: string; company: string; role: string };
        Update: Partial<Database['public']['Tables']['work_experience']['Row']>;
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          tech_stack: string[];
          live_url: string;
          repo_url: string;
          start_date: string;
          end_date: string;
          highlights: string[];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['projects']['Row']> & { user_id: string; name: string };
        Update: Partial<Database['public']['Tables']['projects']['Row']>;
      };
      skills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          proficiency: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['skills']['Row']> & { user_id: string; name: string };
        Update: Partial<Database['public']['Tables']['skills']['Row']>;
      };
      certifications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          issuer: string;
          issue_date: string;
          expiry_date: string;
          credential_id: string;
          credential_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['certifications']['Row']> & { user_id: string; name: string };
        Update: Partial<Database['public']['Tables']['certifications']['Row']>;
      };
      profile_links: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profile_links']['Row']> & { user_id: string; label: string; url: string };
        Update: Partial<Database['public']['Tables']['profile_links']['Row']>;
      };
      job_descriptions: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          job_title: string;
          raw_text: string;
          source_type: string;
          analysis: Json;
          match_score: number;
          status: string;
          applied_at: string | null;
          application_channel: string | null;
          application_notes: string | null;
          offer_salary: string | null;
          offer_city: string | null;
          offer_department: string | null;
          offer_work_mode: string | null;
          offer_conversion_opportunity: boolean | null;
          offer_reply_deadline: string | null;
          offer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['job_descriptions']['Row']> & { user_id: string; raw_text: string };
        Update: Partial<Database['public']['Tables']['job_descriptions']['Row']>;
      };
      resume_versions: {
        Row: {
          id: string;
          user_id: string;
          job_description_id: string | null;
          name: string;
          content: Json;
          status: string;
          is_starred: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['resume_versions']['Row']> & { user_id: string; content: Json };
        Update: Partial<Database['public']['Tables']['resume_versions']['Row']>;
      };
    };
  };
}
