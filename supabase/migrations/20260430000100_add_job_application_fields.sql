/*
  # Add Basic Application Tracking Fields To Job Projects

  ## Summary
  Adds the minimum fields needed to turn a job project status into
  real application data instead of a display-only label.

  ## Changes
  - `applied_at` date
  - `application_channel` text
  - `application_notes` text
*/

ALTER TABLE job_descriptions
  ADD COLUMN IF NOT EXISTS applied_at date,
  ADD COLUMN IF NOT EXISTS application_channel text DEFAULT '',
  ADD COLUMN IF NOT EXISTS application_notes text DEFAULT '';
