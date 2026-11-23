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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      monthly_history: {
        Row: {
          ano: number | null
          canal: string | null
          faturamento_liquido: number
          id: string
          mes: string | null
          mes_ordem: number | null
          meta_restante: number
          percentual_atingimento: number | null
        }
        Insert: {
          ano?: number | null
          canal?: string | null
          faturamento_liquido?: number
          id?: string
          mes?: string | null
          mes_ordem?: number | null
          meta_restante?: number
          percentual_atingimento?: number | null
        }
        Update: {
          ano?: number | null
          canal?: string | null
          faturamento_liquido?: number
          id?: string
          mes?: string | null
          mes_ordem?: number | null
          meta_restante?: number
          percentual_atingimento?: number | null
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          ano: number | null
          atingimento: number | null
          canal: string | null
          cliente: string | null
          familia: string | null
          faturamento: number
          gerente: string | null
          id: string
          mes_ordem: number | null
          meta: number
          representante: string | null
          supervisor: string | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          atingimento?: number | null
          canal?: string | null
          cliente?: string | null
          familia?: string | null
          faturamento?: number
          gerente?: string | null
          id?: string
          mes_ordem?: number | null
          meta?: number
          representante?: string | null
          supervisor?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          atingimento?: number | null
          canal?: string | null
          cliente?: string | null
          familia?: string | null
          faturamento?: number
          gerente?: string | null
          id?: string
          mes_ordem?: number | null
          meta?: number
          representante?: string | null
          supervisor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supervisor_mapping: {
        Row: {
          id: string
          representante: string
          representante_key: string
          supervisor: string
          updated_at: string
        }
        Insert: {
          id?: string
          representante: string
          representante_key: string
          supervisor: string
          updated_at?: string
        }
        Update: {
          id?: string
          representante?: string
          representante_key?: string
          supervisor?: string
          updated_at?: string
        }
        Relationships: []
      }
      supervisor_uploads: {
        Row: {
          rows: Json
          supervisor: string
          updated_at: string
        }
        Insert: {
          rows?: Json
          supervisor: string
          updated_at?: string
        }
        Update: {
          rows?: Json
          supervisor?: string
          updated_at?: string
        }
        Relationships: []
      }
      upload_logs: {
        Row: {
          id: string
          total_faturamento: number
          total_meta: number
          updated_at: string
        }
        Insert: {
          id?: string
          total_faturamento?: number
          total_meta?: number
          updated_at?: string
        }
        Update: {
          id?: string
          total_faturamento?: number
          total_meta?: number
          updated_at?: string
        }
        Relationships: []
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
