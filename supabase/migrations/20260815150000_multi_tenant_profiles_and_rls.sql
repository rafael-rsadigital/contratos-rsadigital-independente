-- Multi-tenant support: each authenticated user (gestor) becomes a tenant
-- with their own company info (logo, CNPJ, juros/multa) and their own
-- clients/contracts, isolated from other tenants.

-- 1) Per-user profile / contract settings (replaces the hardcoded CONTRATADO
--    constant and hardcoded 2%/1%/20% penalty clauses in the frontend).
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  nome_contratado text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '',
  nome_fantasia text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  logo_url text,
  multa_pct numeric NOT NULL DEFAULT 2,
  juros_pct numeric NOT NULL DEFAULT 1,
  multa_rescisoria_pct numeric NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Company info is not sensitive client data, and the public contract page
-- (viewed by clients, without login) needs to read the correct tenant's
-- logo/CNPJ/juros-multa to render the contract correctly.
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow user update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow user insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create a profile row (with sensible defaults) whenever a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Tenant ownership columns
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Backfill: at the time of this migration there is only one existing user
-- (the original RSA Digital admin account) — assign all pre-existing rows
-- to that account so nothing already created gets orphaned.
UPDATE public.clients SET owner_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE owner_id IS NULL;
UPDATE public.contracts SET owner_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) WHERE owner_id IS NULL;

-- Seed that account's profile with the original hardcoded RSA Digital data,
-- so nothing changes visually for the existing account after this migration.
INSERT INTO public.profiles (id, email, nome_contratado, cnpj, nome_fantasia, cidade, whatsapp, multa_pct, juros_pct, multa_rescisoria_pct)
SELECT id, email, 'Rafael Kelvin Silva de Assis', '60.351.596/0001-04', 'RSA Digital', 'Jacareí – SP', '5512988052097', 2, 1, 20
FROM auth.users ORDER BY created_at ASC LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  nome_contratado = EXCLUDED.nome_contratado,
  cnpj = EXCLUDED.cnpj,
  nome_fantasia = EXCLUDED.nome_fantasia,
  cidade = EXCLUDED.cidade,
  whatsapp = EXCLUDED.whatsapp,
  multa_pct = EXCLUDED.multa_pct,
  juros_pct = EXCLUDED.juros_pct,
  multa_rescisoria_pct = EXCLUDED.multa_rescisoria_pct;

-- 3) Rewrite RLS: authenticated (CRM/admin) access is scoped to owner_id.
-- Anon access (public contract confirmation flow) is untouched.

DROP POLICY IF EXISTS "Allow authenticated insert clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated delete clients" ON public.clients;

CREATE POLICY "Allow owner insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Allow owner update clients" ON public.clients FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Allow owner delete clients" ON public.clients FOR DELETE TO authenticated USING (owner_id = auth.uid());
-- Note: SELECT on clients stays public (USING true) as before — it already
-- was, and the public /contrato/:id page needs to read the client's own
-- name/CPF/address without being logged in. Narrowing this further would
-- require a bigger redesign (a dedicated public-facing view); flagged as a
-- known trade-off rather than tackled in this pass.

DROP POLICY IF EXISTS "Allow authenticated insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow authenticated update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow authenticated delete contracts" ON public.contracts;
DROP POLICY IF EXISTS "Allow public read contracts" ON public.contracts;

CREATE POLICY "Allow anon read contracts" ON public.contracts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow owner read contracts" ON public.contracts FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Allow owner insert contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Allow owner update contracts" ON public.contracts FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Allow owner delete contracts" ON public.contracts FOR DELETE TO authenticated USING (owner_id = auth.uid());
-- "Allow anon update contract confirmation" (client-side confirmation flow) is untouched.

-- 4) Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Allow owner upload logo" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Allow owner update logo" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Allow owner delete logo" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);
