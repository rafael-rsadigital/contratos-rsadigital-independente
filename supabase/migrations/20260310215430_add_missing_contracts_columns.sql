-- Additional columns that existed in the live Lovable Cloud project but were
-- never captured as migrations. Reconstructed from
-- src/integrations/supabase/types.ts and usage in Step3Commercial.tsx,
-- Step4Contract.tsx, ContratoView.tsx and ContractDocument.tsx.

-- Permuta (trade/barter) fields, used on the commercial step of the contract
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS permuta_valor numeric;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS permuta_descricao text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS permuta_condicoes text;

-- Client confirmation metadata (device/locale fingerprint captured alongside
-- ip_confirmacao, navegador_confirmacao, nome_confirmacao, etc.)
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS idioma_confirmacao text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS timezone_confirmacao text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS resolucao_confirmacao text;
