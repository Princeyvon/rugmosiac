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
      activity_log: {
        Row: {
          action: string
          actor_name: string | null
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          meta: Json
          summary: string
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json
          summary: string
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json
          summary?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      custom_requests: {
        Row: {
          admin_notes: string | null
          budget_range: string | null
          created_at: string
          customer_name: string
          deadline: string | null
          description: string
          email: string | null
          height_cm: number | null
          id: string
          lead_time_days: number | null
          phone: string | null
          preferred_colors: string[] | null
          preferred_size: string | null
          production_notes: string | null
          quote_amount: number | null
          reference_image_url: string | null
          status: Database["public"]["Enums"]["custom_status"]
          updated_at: string
          width_cm: number | null
        }
        Insert: {
          admin_notes?: string | null
          budget_range?: string | null
          created_at?: string
          customer_name: string
          deadline?: string | null
          description: string
          email?: string | null
          height_cm?: number | null
          id?: string
          lead_time_days?: number | null
          phone?: string | null
          preferred_colors?: string[] | null
          preferred_size?: string | null
          production_notes?: string | null
          quote_amount?: number | null
          reference_image_url?: string | null
          status?: Database["public"]["Enums"]["custom_status"]
          updated_at?: string
          width_cm?: number | null
        }
        Update: {
          admin_notes?: string | null
          budget_range?: string | null
          created_at?: string
          customer_name?: string
          deadline?: string | null
          description?: string
          email?: string | null
          height_cm?: number | null
          id?: string
          lead_time_days?: number | null
          phone?: string | null
          preferred_colors?: string[] | null
          preferred_size?: string | null
          production_notes?: string | null
          quote_amount?: number | null
          reference_image_url?: string | null
          status?: Database["public"]["Enums"]["custom_status"]
          updated_at?: string
          width_cm?: number | null
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          actor_name: string | null
          actor_role: string | null
          created_at: string
          delta: number
          id: string
          new_qty: number
          note: string | null
          order_id: string | null
          previous_qty: number
          product_id: string | null
          reason: string
          variant_id: string | null
        }
        Insert: {
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string
          delta: number
          id?: string
          new_qty: number
          note?: string | null
          order_id?: string | null
          previous_qty: number
          product_id?: string | null
          reason: string
          variant_id?: string | null
        }
        Update: {
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string
          delta?: number
          id?: string
          new_qty?: number
          note?: string | null
          order_id?: string | null
          previous_qty?: number
          product_id?: string | null
          reason?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt: string | null
          content_type: string | null
          created_at: string
          id: string
          path: string
          size_bytes: number | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          alt?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          path: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          alt?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          path?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          coupon_code: string | null
          created_at: string
          email: string
          id: string
          welcomed_at: string | null
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          email: string
          id?: string
          welcomed_at?: string | null
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          email?: string
          id?: string
          welcomed_at?: string | null
        }
        Relationships: []
      }
      order_events: {
        Row: {
          actor_name: string | null
          created_at: string
          event_type: string
          id: string
          message: string
          meta: Json
          order_id: string
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          event_type: string
          id?: string
          message: string
          meta?: Json
          order_id: string
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          meta?: Json
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          product_id: string | null
          product_name: string
          product_slug: string | null
          qty: number
          size_label: string | null
          sku: string | null
          unit_price_rwf: number | null
          variant_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          product_slug?: string | null
          qty?: number
          size_label?: string | null
          sku?: string | null
          unit_price_rwf?: number | null
          variant_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_slug?: string | null
          qty?: number
          size_label?: string | null
          sku?: string | null
          unit_price_rwf?: number | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          coupon_code: string | null
          created_at: string
          currency: string
          customer_name: string
          delivery_rwf: number
          discount_rwf: number
          email: string
          fulfillment_status: string
          id: string
          internal_notes: string | null
          inventory_applied: boolean
          notes: string | null
          order_number: string
          payment_method: string
          payment_reference: string | null
          payment_status: string
          phone: string
          refunded_rwf: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_rwf: number
          total_rwf: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_name: string
          delivery_rwf?: number
          discount_rwf?: number
          email: string
          fulfillment_status?: string
          id?: string
          internal_notes?: string | null
          inventory_applied?: boolean
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_reference?: string | null
          payment_status?: string
          phone: string
          refunded_rwf?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_rwf?: number
          total_rwf?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_name?: string
          delivery_rwf?: number
          discount_rwf?: number
          email?: string
          fulfillment_status?: string
          id?: string
          internal_notes?: string | null
          inventory_applied?: boolean
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_reference?: string | null
          payment_status?: string
          phone?: string
          refunded_rwf?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_rwf?: number
          total_rwf?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_collections: {
        Row: {
          collection_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          height_cm: number | null
          id: string
          label: string
          price_rwf: number | null
          price_usd: number | null
          product_id: string
          sort_order: number
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          height_cm?: number | null
          id?: string
          label: string
          price_rwf?: number | null
          price_usd?: number | null
          product_id: string
          sort_order?: number
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          height_cm?: number | null
          id?: string
          label?: string
          price_rwf?: number | null
          price_usd?: number | null
          product_id?: string
          sort_order?: number
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          cost_rwf: number | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          low_stock_threshold: number
          price_rwf: number | null
          product_id: string
          reserved_qty: number
          size_label: string | null
          sku: string | null
          sort_order: number
          stock_qty: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          cost_rwf?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          price_rwf?: number | null
          product_id: string
          reserved_qty?: number
          size_label?: string | null
          sku?: string | null
          sort_order?: number
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          cost_rwf?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          price_rwf?: number | null
          product_id?: string
          reserved_qty?: number
          size_label?: string | null
          sku?: string | null
          sort_order?: number
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          base_price_rwf: number | null
          base_price_usd: number | null
          care_instructions: string | null
          category_id: string | null
          color_palette: string[] | null
          colorways: Json
          cost_rwf: number | null
          created_at: string
          description: string | null
          design_style: string | null
          featured: boolean
          featured_order: number
          fulfilment_type: string
          hover_image_url: string | null
          id: string
          is_published: boolean
          low_stock_threshold: number
          main_image_url: string | null
          material: string | null
          name: string
          notes: string | null
          production_time: string | null
          reserved_qty: number
          seo_description: string | null
          seo_title: string | null
          shape: Database["public"]["Enums"]["rug_shape"]
          short_description: string | null
          sku: string | null
          slug: string
          stock_qty: number
          stock_status: Database["public"]["Enums"]["stock_status"]
          tags: string[] | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          archived_at?: string | null
          base_price_rwf?: number | null
          base_price_usd?: number | null
          care_instructions?: string | null
          category_id?: string | null
          color_palette?: string[] | null
          colorways?: Json
          cost_rwf?: number | null
          created_at?: string
          description?: string | null
          design_style?: string | null
          featured?: boolean
          featured_order?: number
          fulfilment_type?: string
          hover_image_url?: string | null
          id?: string
          is_published?: boolean
          low_stock_threshold?: number
          main_image_url?: string | null
          material?: string | null
          name: string
          notes?: string | null
          production_time?: string | null
          reserved_qty?: number
          seo_description?: string | null
          seo_title?: string | null
          shape?: Database["public"]["Enums"]["rug_shape"]
          short_description?: string | null
          sku?: string | null
          slug: string
          stock_qty?: number
          stock_status?: Database["public"]["Enums"]["stock_status"]
          tags?: string[] | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          archived_at?: string | null
          base_price_rwf?: number | null
          base_price_usd?: number | null
          care_instructions?: string | null
          category_id?: string | null
          color_palette?: string[] | null
          colorways?: Json
          cost_rwf?: number | null
          created_at?: string
          description?: string | null
          design_style?: string | null
          featured?: boolean
          featured_order?: number
          fulfilment_type?: string
          hover_image_url?: string | null
          id?: string
          is_published?: boolean
          low_stock_threshold?: number
          main_image_url?: string | null
          material?: string | null
          name?: string
          notes?: string | null
          production_time?: string | null
          reserved_qty?: number
          seo_description?: string | null
          seo_title?: string | null
          shape?: Database["public"]["Enums"]["rug_shape"]
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock_qty?: number
          stock_status?: Database["public"]["Enums"]["stock_status"]
          tags?: string[] | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_amount_rwf: number | null
          discount_percent: number
          discount_type: string
          expires_at: string | null
          id: string
          is_active: boolean
          min_order_rwf: number | null
          starts_at: string | null
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_amount_rwf?: number | null
          discount_percent: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_order_rwf?: number | null
          starts_at?: string | null
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_amount_rwf?: number | null
          discount_percent?: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_order_rwf?: number | null
          starts_at?: string | null
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          is_visible: boolean
          location: string | null
          quote: string
          rating: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          is_visible?: boolean
          location?: string | null
          quote: string
          rating?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          is_visible?: boolean
          location?: string | null
          quote?: string
          rating?: number
          sort_order?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      staff_accounts: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          last_login_at: string | null
          password_hash: string | null
          permissions: Json
          pin_hash: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_login_at?: string | null
          password_hash?: string | null
          permissions?: Json
          pin_hash?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_login_at?: string | null
          password_hash?: string | null
          permissions?: Json
          pin_hash?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "admin" | "customer"
      custom_status:
        | "new"
        | "reviewing"
        | "quoted"
        | "accepted"
        | "in_production"
        | "complete"
        | "declined"
        | "approved"
        | "cancelled"
      order_status:
        | "pending"
        | "confirmed"
        | "in_production"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "processing"
        | "ready"
        | "refunded"
      rug_shape: "rectangle" | "circular" | "runner" | "organic"
      staff_role: "owner" | "admin" | "manager" | "staff"
      stock_status: "in_stock" | "made_to_order" | "out_of_stock"
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
    Enums: {
      app_role: ["admin", "customer"],
      custom_status: [
        "new",
        "reviewing",
        "quoted",
        "accepted",
        "in_production",
        "complete",
        "declined",
        "approved",
        "cancelled",
      ],
      order_status: [
        "pending",
        "confirmed",
        "in_production",
        "shipped",
        "delivered",
        "cancelled",
        "processing",
        "ready",
        "refunded",
      ],
      rug_shape: ["rectangle", "circular", "runner", "organic"],
      staff_role: ["owner", "admin", "manager", "staff"],
      stock_status: ["in_stock", "made_to_order", "out_of_stock"],
    },
  },
} as const
