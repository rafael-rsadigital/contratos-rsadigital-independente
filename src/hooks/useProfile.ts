import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Contratado } from "@/types/contract";

export interface Profile {
  id: string | number;
  email: string | null;
  nome_contratado: string;
  cnpj: string;
  nome_fantasia: string;
  cidade: string;
  whatsapp: string;
  logo_url: string | null;
  multa_pct: number;
  juros_pct: number;
  multa_rescisoria_pct: number;
}

export function profileToContratado(profile: Profile | null): Contratado | undefined {
  if (!profile) return undefined;
  return {
    nome: profile.nome_contratado,
    cnpj: profile.cnpj,
    nomeFantasia: profile.nome_fantasia,
    cidade: profile.cidade,
    whatsapp: profile.whatsapp,
    logoUrl: profile.logo_url,
    multaPct: Number(profile.multa_pct),
    jurosPct: 1,
    multaRescisoriaPct: Number(profile.multa_rescisoria_pct),
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles' as any)
      .select('*')
      // The legacy production table uses a bigint primary key. The UUID from
      // auth.users is stored in owner_id, so never compare it with profiles.id.
      .eq('owner_id', user.id)
      .maybeSingle();
    if (error) {
      console.warn('Não foi possível carregar o perfil da contratada:', error.message);
      setProfile(null);
    } else {
      setProfile((data as any) || null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { profile, loading, reload };
}
