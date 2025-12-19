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
          year_range: string | null
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
          year_range?: string | null
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
          year_range?: string | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          class_id: string
          created_at: string | null
          date: string
          id: string
          notes: string | null
          status: string
          student_id: string
          taken_by: string | null
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          status: string
          student_id: string
          taken_by?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          taken_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_sessions: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          end_time: string | null
          event_id: string | null
          headcount: number | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          notes: string | null
          session_date: string
          session_type: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event_id?: string | null
          headcount?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          notes?: string | null
          session_date?: string
          session_type?: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event_id?: string | null
          headcount?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          notes?: string | null
          session_date?: string
          session_type?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          checked_in_by: string | null
          checked_out_by: string | null
          checkin_time: string
          checkout_time: string | null
          created_at: string
          guest_name: string | null
          id: string
          is_checked_out: boolean
          member_id: string | null
          notes: string | null
          security_code: string
          session_id: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          checked_in_by?: string | null
          checked_out_by?: string | null
          checkin_time?: string
          checkout_time?: string | null
          created_at?: string
          guest_name?: string | null
          id?: string
          is_checked_out?: boolean
          member_id?: string | null
          notes?: string | null
          security_code: string
          session_id: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          checked_in_by?: string | null
          checked_out_by?: string | null
          checkin_time?: string
          checkout_time?: string | null
          created_at?: string
          guest_name?: string | null
          id?: string
          is_checked_out?: boolean
          member_id?: string | null
          notes?: string | null
          security_code?: string
          session_id?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "checkin_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      child_info: {
        Row: {
          additional_notes: string | null
          allergies: string[] | null
          authorized_pickups: string[] | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          medical_conditions: string[] | null
          photo_consent: boolean | null
          special_needs: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          allergies?: string[] | null
          authorized_pickups?: string[] | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medical_conditions?: string[] | null
          photo_consent?: boolean | null
          special_needs?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          allergies?: string[] | null
          authorized_pickups?: string[] | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medical_conditions?: string[] | null
          photo_consent?: boolean | null
          special_needs?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_info_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_name: string
          created_at: string | null
          description: string | null
          id: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
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
          year_range: string | null
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
          year_range?: string | null
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
          year_range?: string | null
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
      label_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          include_fields: string[] | null
          is_default: boolean | null
          name: string
          paper_size: string | null
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          include_fields?: string[] | null
          is_default?: boolean | null
          name: string
          paper_size?: string | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          include_fields?: string[] | null
          is_default?: boolean | null
          name?: string
          paper_size?: string | null
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_custom_field_values: {
        Row: {
          created_at: string
          field_id: string
          id: string
          member_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          member_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          member_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "member_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_custom_field_values_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_custom_fields: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          field_type: string
          id: string
          is_required: boolean
          name: string
          options: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          name: string
          options?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          name?: string
          options?: Json | null
        }
        Relationships: []
      }
      member_files: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          member_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          member_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          member_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_files_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          member_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          member_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_custom: boolean
          member_id: string
          related_member_id: string
          relationship_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_custom?: boolean
          member_id: string
          related_member_id: string
          relationship_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_custom?: boolean
          member_id?: string
          related_member_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_relationships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_relationships_related_member_id_fkey"
            columns: ["related_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_tag_assignments: {
        Row: {
          created_at: string
          id: string
          member_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_tag_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "member_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      member_tags: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          address: string | null
          baptized: boolean | null
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
          baptized?: boolean | null
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
          baptized?: boolean | null
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
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          location: string | null
          phone: string | null
          profile_image_url: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          location?: string | null
          phone?: string | null
          profile_image_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          profile_image_url?: string | null
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
      student_classes: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          student_id: string
          year: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          student_id: string
          year?: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          student_id?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_classes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          date_of_birth: string
          full_name: string
          guardian_name: string
          guardian_phone: string
          id: string
          member_id: string | null
          notes: string | null
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth: string
          full_name: string
          guardian_name: string
          guardian_phone: string
          id?: string
          member_id?: string | null
          notes?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string
          full_name?: string
          guardian_name?: string
          guardian_phone?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          member_id: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          member_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          member_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
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
      staff_biographies_public: {
        Row: {
          biography_content: string | null
          children_count: number | null
          created_at: string | null
          display_order: number | null
          hobbies: string | null
          id: string | null
          image_url: string | null
          is_published: boolean | null
          ministry_focus: string[] | null
          name: string | null
          role: string | null
          slug: string | null
          spouse_name: string | null
          updated_at: string | null
        }
        Insert: {
          biography_content?: string | null
          children_count?: number | null
          created_at?: string | null
          display_order?: number | null
          hobbies?: string | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          ministry_focus?: string[] | null
          name?: string | null
          role?: string | null
          slug?: string | null
          spouse_name?: string | null
          updated_at?: string | null
        }
        Update: {
          biography_content?: string | null
          children_count?: number | null
          created_at?: string | null
          display_order?: number | null
          hobbies?: string | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          ministry_focus?: string[] | null
          name?: string | null
          role?: string | null
          slug?: string | null
          spouse_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      get_public_staff_biographies: {
        Args: never
        Returns: {
          biography_content: string
          children_count: number
          created_at: string
          display_order: number
          email: string
          hobbies: string
          id: string
          image_url: string
          is_published: boolean
          ministry_focus: string[]
          name: string
          role: string
          slug: string
          spouse_name: string
          updated_at: string
        }[]
      }
      get_public_teachers: {
        Args: never
        Returns: {
          bio: string
          created_at: string
          full_name: string
          id: string
          photo_url: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_teacher_of_class: {
        Args: { _class_id: string; _teacher_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "staff"
        | "admin"
        | "viewer"
        | "member"
        | "editor"
        | "teacher"
        | "administrator"
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
        "staff",
        "admin",
        "viewer",
        "member",
        "editor",
        "teacher",
        "administrator",
      ],
    },
  },
} as const
