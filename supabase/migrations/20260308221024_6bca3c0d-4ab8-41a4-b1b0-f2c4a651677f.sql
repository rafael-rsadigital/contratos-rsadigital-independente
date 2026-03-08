
-- Fix all RLS policies: drop RESTRICTIVE and recreate as PERMISSIVE

-- ====== CLIENTS ======
DROP POLICY IF EXISTS "Allow authenticated insert clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public read clients" ON public.clients;

CREATE POLICY "Allow authenticated insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow public read clients" ON public.clients FOR SELECT TO anon, authenticated USING (true);

-- ====== CONTRACTS ======
DROP POLICY IF EXISTS "Allow anon update contract confirmation" ON public.contracts;
DROP POLICY IF EXISTS "Allow authenticated insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow authenticated update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow public read contracts" ON public.contracts;

CREATE POLICY "Allow authenticated insert contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update contracts" ON public.contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow anon update contract confirmation" ON public.contracts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read contracts" ON public.contracts FOR SELECT TO anon, authenticated USING (true);

-- ====== CONTRACT_ANEXOS ======
DROP POLICY IF EXISTS "Allow authenticated insert contract_anexos" ON public.contract_anexos;
DROP POLICY IF EXISTS "Allow public read contract_anexos" ON public.contract_anexos;

CREATE POLICY "Allow authenticated insert contract_anexos" ON public.contract_anexos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow public read contract_anexos" ON public.contract_anexos FOR SELECT TO anon, authenticated USING (true);

-- ====== CONTRACT_ADITIVOS ======
DROP POLICY IF EXISTS "Allow authenticated insert contract_aditivos" ON public.contract_aditivos;
DROP POLICY IF EXISTS "Allow public read contract_aditivos" ON public.contract_aditivos;

CREATE POLICY "Allow authenticated insert contract_aditivos" ON public.contract_aditivos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow public read contract_aditivos" ON public.contract_aditivos FOR SELECT TO anon, authenticated USING (true);

-- ====== ADD prazo_google column ======
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS prazo_google text DEFAULT '30 dias';

-- ====== ADD numero_contrato column ======
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS numero_contrato text;

-- ====== CREATE contract_views table ======
CREATE TABLE IF NOT EXISTS public.contract_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  navegador text
);

ALTER TABLE public.contract_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert contract_views" ON public.contract_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated read contract_views" ON public.contract_views FOR SELECT TO authenticated USING (true);

-- ====== CREATE function for auto contract numbering ======
CREATE OR REPLACE FUNCTION public.generate_numero_contrato()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_year int;
  seq int;
BEGIN
  current_year := EXTRACT(YEAR FROM now());
  SELECT COUNT(*) + 1 INTO seq FROM public.contracts
    WHERE EXTRACT(YEAR FROM created_at) = current_year AND numero_contrato IS NOT NULL;
  NEW.numero_contrato := 'RSA-' || current_year || '-' || LPAD(seq::text, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_numero_contrato
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_numero_contrato();
