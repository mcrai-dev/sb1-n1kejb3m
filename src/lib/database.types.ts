export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          type: string
          email: string
          phone: string
          address: string
          city: string
          postal_code: string
          director_name: string
          created_at: string
          ai_preferences: Json
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          email: string
          phone: string
          address: string
          city: string
          postal_code: string
          director_name: string
          created_at?: string
          ai_preferences?: Json
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          email?: string
          phone?: string
          address?: string
          city?: string
          postal_code?: string
          director_name?: string
          created_at?: string
          ai_preferences?: Json
          user_id?: string
        }
      }
      classes: {
        Row: {
          id: string
          school_id: string
          name: string
          student_count: number
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          student_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          student_count?: number
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          class_id: string
          first_name: string
          last_name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          first_name: string
          last_name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          first_name?: string
          last_name?: string
          email?: string
          created_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          user_id: string | null
          first_name: string
          last_name: string
          email: string
          phone: string | null
          bio: string | null
          created_at: string
          school_id: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          bio?: string | null
          created_at?: string
          school_id: string
        }
        Update: {
          id?: string
          user_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          bio?: string | null
          created_at?: string
          school_id?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          description: string | null
          school_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          school_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          school_id?: string
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          subject_id: string
          teacher_id: string
          class_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          teacher_id: string
          class_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          teacher_id?: string
          class_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
    }
  }
}