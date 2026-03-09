
-- Add new columns to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS empresa text DEFAULT '';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS observacoes text DEFAULT '';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'lead';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS origem text DEFAULT '';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
