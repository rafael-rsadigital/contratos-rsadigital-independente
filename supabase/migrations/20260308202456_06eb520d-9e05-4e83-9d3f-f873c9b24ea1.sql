
-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  bairro TEXT NOT NULL,
  cep TEXT NOT NULL,
  municipio TEXT NOT NULL,
  estado TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('website', 'google')),
  servicos TEXT[] NOT NULL DEFAULT '{}',
  valor_total NUMERIC(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('pix', 'boleto', 'cartao')),
  numero_parcelas INTEGER NOT NULL DEFAULT 1,
  dia_vencimento INTEGER NOT NULL DEFAULT 1,
  desconto_regressivo BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'confirmado')),
  data_confirmacao TIMESTAMP WITH TIME ZONE,
  email_confirmacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (internal business tool)
CREATE POLICY "Allow public read clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update clients" ON public.clients FOR UPDATE USING (true);

CREATE POLICY "Allow public read contracts" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Allow public insert contracts" ON public.contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update contracts" ON public.contracts FOR UPDATE USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
