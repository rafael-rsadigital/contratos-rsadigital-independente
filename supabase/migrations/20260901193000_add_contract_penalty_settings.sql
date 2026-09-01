-- Store the late-payment charges that belong to each contract.
-- The fine is selected during contract creation; interest remains fixed at 1% per month.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS multa_pct numeric NOT NULL DEFAULT 2;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS juros_pct numeric NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.contracts.multa_pct IS 'Late-payment fine percentage defined for this contract.';
COMMENT ON COLUMN public.contracts.juros_pct IS 'Late-payment interest percentage per month; fixed at 1% by the application.';

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_multa_pct_range;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_multa_pct_range CHECK (multa_pct >= 0 AND multa_pct <= 100);

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_juros_pct_fixed;

ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_juros_pct_fixed CHECK (juros_pct = 1);

UPDATE public.contracts
SET juros_pct = 1
WHERE juros_pct IS DISTINCT FROM 1;
