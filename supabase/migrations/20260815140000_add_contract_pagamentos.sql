-- Support for financial tracking (item 3): records payments received against
-- a contract, allowing partial/installment payments to be logged over time.
-- valor_recebido = sum of contract_pagamentos.valor for that contract.
-- valor_pendente = contracts.valor_total - valor_recebido.

CREATE TABLE IF NOT EXISTS public.contract_pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  data_pagamento date NOT NULL DEFAULT CURRENT_DATE,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_pagamentos ENABLE ROW LEVEL SECURITY;

-- Admin-only feature (used exclusively in the protected CRM area), so unlike
-- permuta_utilizacoes this does not need anon access.
CREATE POLICY "Allow authenticated read contract_pagamentos" ON public.contract_pagamentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert contract_pagamentos" ON public.contract_pagamentos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated delete contract_pagamentos" ON public.contract_pagamentos
  FOR DELETE TO authenticated USING (true);

-- Support for follow-up reminders (item 4): a short "next action" note with
-- an optional due date, shown prominently on the client profile and
-- surfaced in a CRM-wide reminders list.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS proxima_acao text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS proxima_acao_data date;

