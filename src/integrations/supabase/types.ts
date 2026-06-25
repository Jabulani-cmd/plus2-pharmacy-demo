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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      loyalty_points: {
        Row: {
          customer_id: string
          points: number
          updated_at: string
        }
        Insert: {
          customer_id: string
          points?: number
          updated_at?: string
        }
        Update: {
          customer_id?: string
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          created_at: string
          id: string
          link: string | null
          link_search: Json | null
          read: boolean
          title: string
          tone: string | null
          user_id: string | null
        }
        Insert: {
          audience: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          link_search?: Json | null
          read?: boolean
          title: string
          tone?: string | null
          user_id?: string | null
        }
        Update: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          link_search?: Json | null
          read?: boolean
          title?: string
          tone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          name: string
          order_id: string
          price: number
          qty: number
        }
        Insert: {
          id?: string
          name: string
          order_id: string
          price?: number
          qty?: number
        }
        Update: {
          id?: string
          name?: string
          order_id?: string
          price?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          order_id: string
          sender: string
          sender_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          order_id: string
          sender: string
          sender_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          order_id?: string
          sender?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_ratings: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          order_id: string
          stars: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          order_id: string
          stars: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          order_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          branch_id: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          delivered_at: string | null
          delivery_method: string | null
          dispatched_at: string | null
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          driver_vehicle: string | null
          eta: string | null
          id: string
          item_count: number
          out_for_delivery_ts: number | null
          packed_at: string | null
          payment_method: string | null
          payment_ref: string | null
          phone: string | null
          placed_at: string
          status: string
          total: number
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          delivered_at?: string | null
          delivery_method?: string | null
          dispatched_at?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_vehicle?: string | null
          eta?: string | null
          id: string
          item_count?: number
          out_for_delivery_ts?: number | null
          packed_at?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          phone?: string | null
          placed_at?: string
          status?: string
          total?: number
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          delivered_at?: string | null
          delivery_method?: string | null
          dispatched_at?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_vehicle?: string | null
          eta?: string | null
          id?: string
          item_count?: number
          out_for_delivery_ts?: number | null
          packed_at?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          phone?: string | null
          placed_at?: string
          status?: string
          total?: number
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          approved_at: string | null
          collection_branch_id: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivery: string | null
          delivery_address: Json | null
          dispatched_at: string | null
          doctor_name: string | null
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          driver_vehicle: string | null
          file_name: string | null
          files: Json | null
          for_self: boolean | null
          id: string
          is_repeat: boolean | null
          notes: string | null
          paid_at: string | null
          patient_name: string | null
          payment_method: string | null
          payment_ref: string | null
          pharmacist_notes: string | null
          quotation: Json | null
          rejection_reason: string | null
          relationship: string | null
          repeats_left: number | null
          script_date: string | null
          status: string
          uploaded_at: string
        }
        Insert: {
          approved_at?: string | null
          collection_branch_id?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery?: string | null
          delivery_address?: Json | null
          dispatched_at?: string | null
          doctor_name?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_vehicle?: string | null
          file_name?: string | null
          files?: Json | null
          for_self?: boolean | null
          id: string
          is_repeat?: boolean | null
          notes?: string | null
          paid_at?: string | null
          patient_name?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          pharmacist_notes?: string | null
          quotation?: Json | null
          rejection_reason?: string | null
          relationship?: string | null
          repeats_left?: number | null
          script_date?: string | null
          status?: string
          uploaded_at?: string
        }
        Update: {
          approved_at?: string | null
          collection_branch_id?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery?: string | null
          delivery_address?: Json | null
          dispatched_at?: string | null
          doctor_name?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_vehicle?: string | null
          file_name?: string | null
          files?: Json | null
          for_self?: boolean | null
          id?: string
          is_repeat?: boolean | null
          notes?: string | null
          paid_at?: string | null
          patient_name?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          pharmacist_notes?: string | null
          quotation?: Json | null
          rejection_reason?: string | null
          relationship?: string | null
          repeats_left?: number | null
          script_date?: string | null
          status?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "customer"
        | "staff"
        | "pharmacist"
        | "dispatcher"
        | "cashier"
        | "inventory"
        | "manager"
        | "admin"
        | "driver"
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
      app_role: [
        "customer",
        "staff",
        "pharmacist",
        "dispatcher",
        "cashier",
        "inventory",
        "manager",
        "admin",
        "driver",
      ],
    },
  },
} as const
