
CREATE OR REPLACE FUNCTION public.generate_numero_contrato()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  seq int;
BEGIN
  SELECT COUNT(*) + 1 INTO seq FROM public.contracts
    WHERE numero_contrato IS NOT NULL;
  NEW.numero_contrato := to_char(now(), 'YYYYMMDD') || LPAD(seq::text, 3, '0');
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_numero_contrato ON public.contracts;
CREATE TRIGGER set_numero_contrato
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_numero_contrato();
