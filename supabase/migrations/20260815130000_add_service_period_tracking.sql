-- Support for the renewals/expirations panel: tracks when a contract's
-- service period starts and ends, so ongoing services (Google Business
-- Profile management, recurring contracts) can be flagged for renewal.
--
-- data_inicio_servico: when the contracted service period began (defaults to
--   the client confirmation date, but editable by the admin).
-- data_termino_servico: when the contracted service period ends. Auto-computed
--   from the free-text "prazo" field when possible (e.g. "30 dias", "6 meses"),
--   but always editable — since prazo is now free text it may not be parseable
--   (e.g. "até 15/12", "indeterminado").

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS data_inicio_servico date;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS data_termino_servico date;
