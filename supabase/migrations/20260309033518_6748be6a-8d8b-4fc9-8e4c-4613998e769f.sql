
ALTER TABLE public.contract_aditivos
  ADD COLUMN status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN numero integer NOT NULL DEFAULT 1,
  ADD COLUMN clausulas_alteradas text,
  ADD COLUMN novo_valor numeric,
  ADD COLUMN novo_prazo text,
  ADD COLUMN data_aceite timestamp with time zone,
  ADD COLUMN nome_aceite text,
  ADD COLUMN email_aceite text,
  ADD COLUMN ip_aceite text,
  ADD COLUMN navegador_aceite text,
  ADD COLUMN timezone_aceite text,
  ADD COLUMN idioma_aceite text,
  ADD COLUMN resolucao_aceite text,
  ADD COLUMN codigo_verificacao text;

-- Allow anon to update aditivos for acceptance
CREATE POLICY "Allow anon update aditivo acceptance"
  ON public.contract_aditivos
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow authenticated update
CREATE POLICY "Allow authenticated update contract_aditivos"
  ON public.contract_aditivos
  FOR UPDATE
  TO authenticated
  USING (true);
