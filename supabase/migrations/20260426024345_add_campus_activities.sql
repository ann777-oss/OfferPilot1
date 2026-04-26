/*
  # Add campus_activities table

  ## Summary
  Adds a new `campus_activities` table to store users' campus/extracurricular
  experience such as student organizations, volunteer work, competitions,
  internships during school, etc.

  ## New Tables
  - `campus_activities`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK to auth.users)
    - `organization` (text) – club, team, or institution name
    - `role` (text) – the user's title/role in that activity
    - `activity_type` (text) – e.g. 学生组织 / 志愿活动 / 竞赛 / 实习
    - `start_date` (text) – YYYY-MM
    - `end_date` (text) – YYYY-MM, nullable
    - `is_current` (boolean) – still active
    - `description` (text) – free-form description
    - `highlights` (text[]) – bullet achievements
    - `sort_order` (int)
    - `created_at` / `updated_at` (timestamptz)

  ## Security
  - RLS enabled; authenticated users can only access their own rows
*/

CREATE TABLE IF NOT EXISTS campus_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  activity_type text NOT NULL DEFAULT '',
  start_date text NOT NULL DEFAULT '',
  end_date text NOT NULL DEFAULT '',
  is_current boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  highlights text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campus_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own campus activities"
  ON campus_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campus activities"
  ON campus_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campus activities"
  ON campus_activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own campus activities"
  ON campus_activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS campus_activities_user_id_idx ON campus_activities(user_id);
