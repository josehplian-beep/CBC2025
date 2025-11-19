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
      albums: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      department_members: {
        Row: {
          created_at: string | null
          department: string
          display_order: number | null
          id: string
          name: string
          profile_image_url: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          display_order?: number | null
          id?: string
          name: string
          profile_image_url?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          display_order?: number | null
          id?: string
          name?: string
          profile_image_url?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          date_obj: string
          description: string | null
          id: string
          image_url: string | null
          is_recurring_parent: boolean | null
          location: string
          parent_event_id: string | null
          recurring_end_date: string | null
          recurring_pattern: string | null
          time: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          date_obj: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_recurring_parent?: boolean | null
          location: string
          parent_event_id?: string | null
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          time: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          date_obj?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_recurring_parent?: boolean | null
          location?: string
          parent_event_id?: string | null
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          time?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          city: string
          county: string
          created_at: string | null
          family_name: string
          id: string
          postal_code: string
          state: string
          street_address: string
          street_address_line2: string | null
          updated_at: string | null
        }
        Insert: {
          city: string
          county: string
          created_at?: string | null
          family_name: string
          id?: string
          postal_code: string
          state: string
          street_address: string
          street_address_line2?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string
          county?: string
          created_at?: string | null
          family_name?: string
          id?: string
          postal_code?: string
          state?: string
          street_address?: string
          street_address_line2?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      members: {
        Row: {
          address: string | null
          church_groups: string[] | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          family_id: string | null
          gender: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
          profile_image_url: string | null
          service_year: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          church_groups?: string[] | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          family_id?: string | null
          gender?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          service_year?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          church_groups?: string[] | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          family_id?: string | null
          gender?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          service_year?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          image_url: string
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          image_url: string
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          author_id: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          is_answered: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_answered?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_answered?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_biographies: {
        Row: {
          biography_content: string
          children_count: number | null
          created_at: string | null
          display_order: number | null
          email: string | null
          hobbies: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          ministry_focus: string[] | null
          name: string
          phone: string | null
          role: string
          slug: string
          spouse_name: string | null
          updated_at: string | null
        }
        Insert: {
          biography_content: string
          children_count?: number | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          hobbies?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          ministry_focus?: string[] | null
          name: string
          phone?: string | null
          role: string
          slug: string
          spouse_name?: string | null
          updated_at?: string | null
        }
        Update: {
          biography_content?: string
          children_count?: number | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          hobbies?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          ministry_focus?: string[] | null
          name?: string
          phone?: string | null
          role?: string
          slug?: string
          spouse_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_name: string
          author_role?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          title?: string
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_recurring_events: {
        Args: {
          p_created_by?: string
          p_description: string
          p_end_date: string
          p_event_id: string
          p_image_url?: string
          p_location: string
          p_recurring_pattern: string
          p_start_date: string
          p_time: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      get_album_photo_count: { Args: { album_uuid: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "staff" | "admin" | "viewer" | "member"
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
      app_role: ["staff", "admin", "viewer", "member"],
    },
  },
} as const
