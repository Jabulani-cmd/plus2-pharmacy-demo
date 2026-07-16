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
      driver_notifications: {
        Row: {
          body: string
          created_at: string
          driver_auth_id: string
          id: string
          order_id: string
          read: boolean
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          driver_auth_id: string
          id?: string
          order_id: string
          read?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          driver_auth_id?: string
          id?: string
          order_id?: string
          read?: boolean
          title?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          auth_user_id: string | null
          branch: string
          created_at: string
          current_lat: number | null
          current_lng: number | null
          heading: number | null
          id: string
          location_updated_at: string | null
          name: string
          off_duty: boolean
          phone: string
          plate: string
          updated_at: string
          vehicle: string
        }
        Insert: {
          auth_user_id?: string | null
          branch?: string
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          heading?: number | null
          id?: string
          location_updated_at?: string | null
          name: string
          off_duty?: boolean
          phone: string
          plate: string
          updated_at?: string
          vehicle: string
        }
        Update: {
          auth_user_id?: string | null
          branch?: string
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          heading?: number | null
          id?: string
          location_updated_at?: string | null
          name?: string
          off_duty?: boolean
          phone?: string
          plate?: string
          updated_at?: string
          vehicle?: string
        }
        Relationships: []
      }
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
          created_at: string
          id: string
          kind: string | null
          link: string | null
          link_search: Json | null
          message: string | null
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          audience: string
          created_at?: string
          id?: string
          kind?: string | null
          link?: string | null
          link_search?: Json | null
          message?: string | null
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          kind?: string | null
          link?: string | null
          link_search?: Json | null
          message?: string | null
          read?: boolean
          title?: string
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
          accepted_at: string | null
          approved_at: string | null
          assigned_at: string | null
          branch_id: string | null
          branch_name: string | null
          collected_at: string | null
          collection_branch_id: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          delivery: string | null
          delivery_address: Json | null
          dispatched_at: string | null
          dispatcher_notes: string | null
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
          printed_at: string | null
          quotation: Json | null
          ready_at: string | null
          rejection_reason: string | null
          relationship: string | null
          repeats_left: number | null
          script_date: string | null
          status: string
          updated_at: string | null
          uploaded_at: string
        }
        Insert: {
          accepted_at?: string | null
          approved_at?: string | null
          assigned_at?: string | null
          branch_id?: string | null
          branch_name?: string | null
          collected_at?: string | null
          collection_branch_id?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          delivery?: string | null
          delivery_address?: Json | null
          dispatched_at?: string | null
          dispatcher_notes?: string | null
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
          printed_at?: string | null
          quotation?: Json | null
          ready_at?: string | null
          rejection_reason?: string | null
          relationship?: string | null
          repeats_left?: number | null
          script_date?: string | null
          status?: string
          updated_at?: string | null
          uploaded_at?: string
        }
        Update: {
          accepted_at?: string | null
          approved_at?: string | null
          assigned_at?: string | null
          branch_id?: string | null
          branch_name?: string | null
          collected_at?: string | null
          collection_branch_id?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          delivery?: string | null
          delivery_address?: Json | null
          dispatched_at?: string | null
          dispatcher_notes?: string | null
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
          printed_at?: string | null
          quotation?: Json | null
          ready_at?: string | null
          rejection_reason?: string | null
          relationship?: string | null
          repeats_left?: number | null
          script_date?: string | null
          status?: string
          updated_at?: string | null
          uploaded_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_address: Json | null
          last_name: string | null
          phone: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_address?: Json | null
          last_name?: string | null
          phone?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_address?: Json | null
          last_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      shared_orders: {
        Row: {
          accepted_at: string | null
          address: string
          branch_id: string | null
          branch_name: string | null
          collected_at: string | null
          created_at: string
          customer: string
          customer_email: string | null
          customer_email_lower: string | null
          customer_id: string | null
          delivered_at: string | null
          delivery_address: Json | null
          delivery_fee: number
          delivery_method: string
          delivery_slot: string | null
          discount_amount: number
          discount_code: string | null
          dispatched_at: string | null
          driver_auth_id: string | null
          driver_heading: number | null
          driver_id: string | null
          driver_lat: number | null
          driver_lng: number | null
          driver_name: string | null
          driver_phone: string | null
          driver_vehicle: string | null
          eta: string | null
          id: string
          item_count: number
          items: Json
          out_for_delivery_ts: number | null
          packed_at: string | null
          payment_method: string
          payment_ref: string
          payment_verified: boolean
          phone: string
          placed_at: string
          placed_ts: number
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          address?: string
          branch_id?: string | null
          branch_name?: string | null
          collected_at?: string | null
          created_at?: string
          customer: string
          customer_email?: string | null
          customer_email_lower?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_fee?: number
          delivery_method?: string
          delivery_slot?: string | null
          discount_amount?: number
          discount_code?: string | null
          dispatched_at?: string | null
          driver_auth_id?: string | null
          driver_heading?: number | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_vehicle?: string | null
          eta?: string | null
          id: string
          item_count?: number
          items?: Json
          out_for_delivery_ts?: number | null
          packed_at?: string | null
          payment_method?: string
          payment_ref?: string
          payment_verified?: boolean
          phone?: string
          placed_at?: string
          placed_ts?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          address?: string
          branch_id?: string | null
          branch_name?: string | null
          collected_at?: string | null
          created_at?: string
          customer?: string
          customer_email?: string | null
          customer_email_lower?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_fee?: number
          delivery_method?: string
          delivery_slot?: string | null
          discount_amount?: number
          discount_code?: string | null
          dispatched_at?: string | null
          driver_auth_id?: string | null
          driver_heading?: number | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          driver_vehicle?: string | null
          eta?: string | null
          id?: string
          item_count?: number
          items?: Json
          out_for_delivery_ts?: number | null
          packed_at?: string | null
          payment_method?: string
          payment_ref?: string
          payment_verified?: boolean
          phone?: string
          placed_at?: string
          placed_ts?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          order_id: string | null
          read: boolean
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          order_id?: string | null
          read?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          order_id?: string | null
          read?: boolean
          title?: string
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
      delete_order_by_id: { Args: { p_id: string }; Returns: undefined }
      delete_orders_bulk_by_ids: {
        Args: { p_ids: string[] }
        Returns: undefined
      }
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
