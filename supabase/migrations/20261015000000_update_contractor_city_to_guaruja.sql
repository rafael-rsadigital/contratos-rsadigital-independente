-- Atualiza a sede do contratado para a nova cidade.
-- O filtro preserva perfis que já tenham sido atualizados manualmente.
UPDATE public.profiles
SET cidade = 'Guarujá – SP'
WHERE cidade ILIKE 'Jacareí%'
   OR cidade ILIKE 'Jacarei%';
