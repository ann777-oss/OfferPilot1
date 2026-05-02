/*
  # Add Offer Management Fields To Job Projects

  ## Summary
  Adds the minimum fields needed for offer management and comparison.

  ## Changes
  - `offer_salary` text
  - `offer_city` text
  - `offer_department` text
  - `offer_work_mode` text
  - `offer_conversion_opportunity` boolean
  - `offer_reply_deadline` date
  - `offer_notes` text
*/

ALTER TABLE job_descriptions
  ADD COLUMN IF NOT EXISTS offer_salary text DEFAULT '',
  ADD COLUMN IF NOT EXISTS offer_city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS offer_department text DEFAULT '',
  ADD COLUMN IF NOT EXISTS offer_work_mode text DEFAULT '',
  ADD COLUMN IF NOT EXISTS offer_conversion_opportunity boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_reply_deadline date,
  ADD COLUMN IF NOT EXISTS offer_notes text DEFAULT '';
