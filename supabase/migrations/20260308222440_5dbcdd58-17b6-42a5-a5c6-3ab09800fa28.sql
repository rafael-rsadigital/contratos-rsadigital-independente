
-- Just drop all outdated check constraints
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_forma_pagamento_check;
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_tipo_check;
