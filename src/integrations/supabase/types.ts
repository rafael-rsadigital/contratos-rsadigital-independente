export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          bairro: string
          celular: string
          cep: string
          cpf_cnpj: string
          created_at: string
          email: string
          estado: string
          id: string
          logradouro: string
          municipio: string
          nome: string
          numero: string
          updated_at: string
        }
        Insert: {
          bairro: string
          celular?: string
          cep: string
          cpf_cnpj: string
          created_at?: string
          email?: string
          estado: string
          id?: string
          logradouro: string
          municipio: string
          nome: string
          numero: string
          updated_at?: string
        }
        Update: {
          bairro?: string
          celular?: string
          cep?: string
          cpf_cnpj?: string
          created_at?: string
          email?: string
          estado?: string
          id?: string
          logradouro?: string
          municipio?: string
          nome?: string
          numero?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_aditivos: {
        Row: {
          contract_id: string
          created_at: string
          data: string
          descricao: string
          id: string
          titulo: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          data: string
          descricao: string
          id?: string
          titulo: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_aditivos_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_anexos: {
        Row: {
          contract_id: string
          created_at: string
          data: string
          descricao: string
          id: string
          titulo: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          data: string
          descricao: string
          id?: string
          titulo: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_anexos_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          codigo_verificacao: string | null
          created_at: string
          data_confirmacao: string | null
          data_primeiro_vencimento: string | null
          desconto_regressivo: boolean
          dia_vencimento: number
          email_confirmacao: string | null
          forma_pagamento: string
          forma_pagamento_entrada: string | null
          id: string
          ip_confirmacao: string | null
          navegador_confirmacao: string | null
          nome_confirmacao: string | null
          numero_paginas: number | null
          numero_parcelas: number
          servico_principal: string | null
          servicos: string[]
          status: string
          tipo: string
          updated_at: string
          valor_entrada: number
          valor_total: number
        }
        Insert: {
          client_id: string
          codigo_verificacao?: string | null
          created_at?: string
          data_confirmacao?: string | null
          data_primeiro_vencimento?: string | null
          desconto_regressivo?: boolean
          dia_vencimento?: number
          email_confirmacao?: string | null
          forma_pagamento: string
          forma_pagamento_entrada?: string | null
          id?: string
          ip_confirmacao?: string | null
          navegador_confirmacao?: string | null
          nome_confirmacao?: string | null
          numero_paginas?: number | null
          numero_parcelas?: number
          servico_principal?: string | null
          servicos?: string[]
          status?: string
          tipo: string
          updated_at?: string
          valor_entrada?: number
          valor_total: number
        }
        Update: {
          client_id?: string
          codigo_verificacao?: string | null
          created_at?: string
          data_confirmacao?: string | null
          data_primeiro_vencimento?: string | null
          desconto_regressivo?: boolean
          dia_vencimento?: number
          email_confirmacao?: string | null
          forma_pagamento?: string
          forma_pagamento_entrada?: string | null
          id?: string
          ip_confirmacao?: string | null
          navegador_confirmacao?: string | null
          nome_confirmacao?: string | null
          numero_paginas?: number | null
          numero_parcelas?: number
          servico_principal?: string | null
          servicos?: string[]
          status?: string
          tipo?: string
          updated_at?: string
          valor_entrada?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
