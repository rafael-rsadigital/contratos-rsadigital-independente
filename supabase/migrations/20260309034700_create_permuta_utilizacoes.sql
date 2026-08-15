-- Recreated migration: this table existed in the live Lovable Cloud project
-- but was never captured as a migration file. Reconstructed from
-- src/integrations/supabase/types.ts and its usage in PermutaControl.tsx.

CREATE TABLE IF NOT EXISTS public.permuta_utilizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  valor_utilizado numeric NOT NULL,
  data_utilizacao date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permuta_utilizacoes ENABLE ROW LEVEL SECURITY;

-- ContratoView is a public route (/contrato/:id) where clients register
-- permuta usage, so anon needs select+insert, matching contract_views pattern.
CREATE POLICY "Allow public read permuta_utilizacoes" ON public.permuta_utilizacoes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert permuta_utilizacoes" ON public.permuta_utilizacoes
  FOR INSERT TO anon, authenticated WITH CHECK (true);
