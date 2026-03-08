
-- Add new columns to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS celular text NOT NULL DEFAULT '';
ALTER TABLE public.clients ALTER COLUMN email SET DEFAULT '';

-- Add new columns to contracts table
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS codigo_verificacao text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS nome_confirmacao text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS ip_confirmacao text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS navegador_confirmacao text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS valor_entrada numeric NOT NULL DEFAULT 0;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS forma_pagamento_entrada text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS data_primeiro_vencimento date;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS numero_paginas integer;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS servico_principal text;

-- Create anexos table
CREATE TABLE public.contract_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text NOT NULL,
  data text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read contract_anexos" ON public.contract_anexos FOR SELECT USING (true);
CREATE POLICY "Allow public insert contract_anexos" ON public.contract_anexos FOR INSERT WITH CHECK (true);

-- Create aditivos table
CREATE TABLE public.contract_aditivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text NOT NULL,
  data text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_aditivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read contract_aditivos" ON public.contract_aditivos FOR SELECT USING (true);
CREATE POLICY "Allow public insert contract_aditivos" ON public.contract_aditivos FOR INSERT WITH CHECK (true);
