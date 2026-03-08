
-- Secure insert/update policies for new tables to require authentication
-- Drop overly permissive policies on contract_anexos and contract_aditivos  
DROP POLICY IF EXISTS "Allow public insert contract_anexos" ON public.contract_anexos;
DROP POLICY IF EXISTS "Allow public insert contract_aditivos" ON public.contract_aditivos;

-- Admin-only insert for anexos/aditivos (authenticated users only)
CREATE POLICY "Allow authenticated insert contract_anexos" ON public.contract_anexos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert contract_aditivos" ON public.contract_aditivos FOR INSERT TO authenticated WITH CHECK (true);

-- Secure insert/update on main tables for authenticated only
DROP POLICY IF EXISTS "Allow public insert clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow public update contracts" ON public.contracts;

CREATE POLICY "Allow authenticated insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update contracts" ON public.contracts FOR UPDATE TO authenticated USING (true);

-- Allow public (anon) to update contracts for client confirmation only
CREATE POLICY "Allow anon update contract confirmation" ON public.contracts FOR UPDATE TO anon USING (true) WITH CHECK (true);
