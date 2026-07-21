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
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          industry: string | null
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string
          google_calendar_id: string | null
          google_event_id: string | null
          id: string
          location: string | null
          start_at: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at: string
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          location?: string | null
          start_at: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          location?: string | null
          start_at?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          tenant_id: string
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          tenant_id: string
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          tenant_id?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          provider: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          provider: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          provider?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          tenant_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          tenant_id: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          tenant_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
        }
        Insert: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
        }
        Update: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          base_price_cents: number
          base_seats: number
          created_at: string
          extra_seat_price_cents: number
          id: string
          name: string
        }
        Insert: {
          base_price_cents: number
          base_seats: number
          created_at?: string
          extra_seat_price_cents: number
          id: string
          name: string
        }
        Update: {
          base_price_cents?: number
          base_seats?: number
          created_at?: string
          extra_seat_price_cents?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_stock: number
          name: string
          sale_price: number
          sku: string | null
          stock_quantity: number
          tenant_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock?: number
          name: string
          sale_price?: number
          sku?: string | null
          stock_quantity?: number
          tenant_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock?: number
          name?: string
          sale_price?: number
          sku?: string | null
          stock_quantity?: number
          tenant_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          active: boolean
          base_price: number
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_clients: {
        Row: {
          created_at: string
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string
          quantity: number
          service_id: string | null
          subtotal: number | null
          tenant_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id: string
          quantity?: number
          service_id?: string | null
          subtotal?: number | null
          tenant_id: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          quantity?: number
          service_id?: string | null
          subtotal?: number | null
          tenant_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          assignee_id: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          notes: string | null
          number: string | null
          opened_at: string
          status: Database["public"]["Enums"]["service_order_status"]
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          number?: string | null
          opened_at?: string
          status?: Database["public"]["Enums"]["service_order_status"]
          tenant_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          number?: string | null
          opened_at?: string
          status?: Database["public"]["Enums"]["service_order_status"]
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "service_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          seats: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          seats?: number
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          seats?: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          role: string
          team_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          team_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          team_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_admin: {
        Args: { _tenant: string; _user: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "member"
      service_order_status: "open" | "in_progress" | "completed" | "cancelled"
      stock_movement_type: "in" | "out" | "adjust"
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
      app_role: ["admin", "manager", "member"],
      service_order_status: ["open", "in_progress", "completed", "cancelled"],
      stock_movement_type: ["in", "out", "adjust"],
    },
  },
} as const
