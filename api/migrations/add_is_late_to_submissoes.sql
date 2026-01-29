-- Migration: Add is_late column to submissoes table
-- Purpose: Track whether a submission was submitted after the deadline

ALTER TABLE submissoes ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false;

-- Optional: Index for querying late submissions
CREATE INDEX IF NOT EXISTS idx_submissoes_is_late ON submissoes(is_late);

-- Display the table structure to confirm
\d submissoes
