/*
  # Resume Board: Extended Status & Events Table

  ## Summary
  Extends `resume_versions` with board-compatible statuses and adds a
  `resume_events` table to track status transitions over time.

  ## Changes

  ### 1. resume_versions — status constraint update
  - Existing status column (text, default 'draft') is kept as-is
  - No destructive changes; existing 'draft' / 'final' values remain valid
  - Application layer now recognises: draft | pending | applied | interviewing | archived

  ### 2. New Table: resume_events
  - `id` uuid PK
  - `resume_id` uuid FK → resume_versions(id) ON DELETE CASCADE
  - `user_id` uuid (for RLS)
  - `from_status` text  (nullable — first event has no prior status)
  - `to_status` text
  - `note` text (optional)
  - `created_at` timestamptz

  ## Security
  - RLS enabled on resume_events
  - SELECT / INSERT policies scoped to auth.uid() = user_id
*/

CREATE TABLE IF NOT EXISTS resume_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id     uuid NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  from_status   text,
  to_status     text NOT NULL,
  note          text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE resume_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resume events"
  ON resume_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume events"
  ON resume_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS resume_events_resume_id_idx ON resume_events(resume_id);
CREATE INDEX IF NOT EXISTS resume_events_user_id_idx ON resume_events(user_id);
