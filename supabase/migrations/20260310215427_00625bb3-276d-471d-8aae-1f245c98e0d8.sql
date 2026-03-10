
-- Allow admin to delete clients
CREATE POLICY "Allow authenticated delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- Allow admin to delete contracts
CREATE POLICY "Allow authenticated delete contracts" ON public.contracts FOR DELETE TO authenticated USING (true);

-- Allow admin to delete contract_anexos
CREATE POLICY "Allow authenticated delete contract_anexos" ON public.contract_anexos FOR DELETE TO authenticated USING (true);

-- Allow admin to delete contract_aditivos
CREATE POLICY "Allow authenticated delete contract_aditivos" ON public.contract_aditivos FOR DELETE TO authenticated USING (true);

-- Allow admin to delete contract_views
CREATE POLICY "Allow authenticated delete contract_views" ON public.contract_views FOR DELETE TO authenticated USING (true);

-- Allow admin to delete permuta_utilizacoes
CREATE POLICY "Allow authenticated delete permuta_utilizacoes" ON public.permuta_utilizacoes FOR DELETE TO authenticated USING (true);
