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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      daily_entries: {
        Row: {
          ai_prompt: string | null
          ai_suggestion: string | null
          completed: boolean | null
          created_at: string | null
          date: string
          id: string
          mood: number | null
          reflections: string | null
          user_id: string
        }
        Insert: {
          ai_prompt?: string | null
          ai_suggestion?: string | null
          completed?: boolean | null
          created_at?: string | null
          date: string
          id?: string
          mood?: number | null
          reflections?: string | null
          user_id: string
        }
        Update: {
          ai_prompt?: string | null
          ai_suggestion?: string | null
          completed?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          mood?: number | null
          reflections?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mentor_notes: {
        Row: {
          created_at: string | null
          id: string
          note: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      mission_completions: {
        Row: {
          coins_awarded: number
          created_at: string | null
          id: string
          mission_instance_id: string | null
          user_id: string
          xp_awarded: number
        }
        Insert: {
          coins_awarded: number
          created_at?: string | null
          id?: string
          mission_instance_id?: string | null
          user_id: string
          xp_awarded: number
        }
        Update: {
          coins_awarded?: number
          created_at?: string | null
          id?: string
          mission_instance_id?: string | null
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_instance_id_fkey"
            columns: ["mission_instance_id"]
            isOneToOne: false
            referencedRelation: "mission_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_instances: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          mission_id: string | null
          period_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string | null
          period_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string | null
          period_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_instances_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          active: boolean | null
          bucket: string | null
          cadence: string
          coins: number
          created_at: string | null
          id: string
          instructions: string | null
          size: string | null
          title: string
          xp: number
        }
        Insert: {
          active?: boolean | null
          bucket?: string | null
          cadence: string
          coins: number
          created_at?: string | null
          id?: string
          instructions?: string | null
          size?: string | null
          title: string
          xp: number
        }
        Update: {
          active?: boolean | null
          bucket?: string | null
          cadence?: string
          coins?: number
          created_at?: string | null
          id?: string
          instructions?: string | null
          size?: string | null
          title?: string
          xp?: number
        }
        Relationships: []
      }
      payment_credentials: {
        Row: {
          created_at: string | null
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: Json | null
          created_at: string | null
          display_name: string | null
          id: string
          subscription_plan: string | null
          timezone: string | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: Json | null
          created_at?: string | null
          display_name?: string | null
          id: string
          subscription_plan?: string | null
          timezone?: string | null
        }
        Update: {
          avatar_url?: string | null
          badges?: Json | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          subscription_plan?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          coins_total: number | null
          created_at: string | null
          daily_streak: number | null
          freeze_available: boolean | null
          freeze_reset_date: string | null
          last_daily_date: string | null
          updated_at: string | null
          user_id: string
          xp_total: number | null
        }
        Insert: {
          coins_total?: number | null
          created_at?: string | null
          daily_streak?: number | null
          freeze_available?: boolean | null
          freeze_reset_date?: string | null
          last_daily_date?: string | null
          updated_at?: string | null
          user_id: string
          xp_total?: number | null
        }
        Update: {
          coins_total?: number | null
          created_at?: string | null
          daily_streak?: number | null
          freeze_available?: boolean | null
          freeze_reset_date?: string | null
          last_daily_date?: string | null
          updated_at?: string | null
          user_id?: string
          xp_total?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      mission_type:
        | "Mind"
        | "Body"
        | "Craft"
        | "Relationships"
        | "Finance"
        | "Spirit"
        | "Custom"
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
    Enums: {
      app_role: ["admin", "user"],
      mission_type: [
        "Mind",
        "Body",
        "Craft",
        "Relationships",
        "Finance",
        "Spirit",
        "Custom",
      ],
    },
  },
} as const
