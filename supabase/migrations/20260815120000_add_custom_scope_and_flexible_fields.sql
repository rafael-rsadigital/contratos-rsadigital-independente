-- Support for:
-- 1) "Outro" free-text service (stores category explicitly instead of
--    inferring website vs google by matching the name against a fixed list,
--    which breaks once custom service names are allowed)
-- 2) Editable custom scope/deliverables text (OBJETO DO CONTRATO section)
-- 3) "Serviço recorrente" flag decoupled from forma_pagamento
-- 4) "Mencionar desconto à vista no contrato" visibility toggle
-- 5) Custom per-installment payment schedule (cronograma flexível)

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS servico_website text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS servico_google text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS escopo_personalizado text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS servico_recorrente boolean NOT NULL DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS mencionar_desconto_avista boolean NOT NULL DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS vencimentos_personalizados text[];
