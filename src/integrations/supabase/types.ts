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
      jadwal_mengajar: {
        Row: {
          created_at: string | null
          hari: string
          id_guru: string
          id_jadwal: string
          id_kelas: string
          id_mapel: string
          jam_mulai: string
          jam_selesai: string
        }
        Insert: {
          created_at?: string | null
          hari: string
          id_guru: string
          id_jadwal?: string
          id_kelas: string
          id_mapel: string
          jam_mulai: string
          jam_selesai: string
        }
        Update: {
          created_at?: string | null
          hari?: string
          id_guru?: string
          id_jadwal?: string
          id_kelas?: string
          id_mapel?: string
          jam_mulai?: string
          jam_selesai?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_jadwal_guru"
            columns: ["id_guru"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_jadwal_kelas"
            columns: ["id_kelas"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id_kelas"]
          },
          {
            foreignKeyName: "fk_jadwal_mapel"
            columns: ["id_mapel"]
            isOneToOne: false
            referencedRelation: "mata_pelajaran"
            referencedColumns: ["id_mapel"]
          },
        ]
      }
      kelas: {
        Row: {
          created_at: string | null
          id_kelas: string
          nama_kelas: string
        }
        Insert: {
          created_at?: string | null
          id_kelas?: string
          nama_kelas: string
        }
        Update: {
          created_at?: string | null
          id_kelas?: string
          nama_kelas?: string
        }
        Relationships: []
      }
      mata_pelajaran: {
        Row: {
          created_at: string | null
          id_mapel: string
          nama_mapel: string
        }
        Insert: {
          created_at?: string | null
          id_mapel?: string
          nama_mapel: string
        }
        Update: {
          created_at?: string | null
          id_mapel?: string
          nama_mapel?: string
        }
        Relationships: []
      }
      presensi_mengajar: {
        Row: {
          created_at: string | null
          foto_absen_url: string | null
          id_guru: string
          id_jadwal: string
          id_presensi: string
          jam: string
          keterlambatan_menit: number | null
          latitude: number | null
          longitude: number | null
          status: Database["public"]["Enums"]["attendance_status"]
          tanggal: string
        }
        Insert: {
          created_at?: string | null
          foto_absen_url?: string | null
          id_guru: string
          id_jadwal: string
          id_presensi?: string
          jam: string
          keterlambatan_menit?: number | null
          latitude?: number | null
          longitude?: number | null
          status: Database["public"]["Enums"]["attendance_status"]
          tanggal: string
        }
        Update: {
          created_at?: string | null
          foto_absen_url?: string | null
          id_guru?: string
          id_jadwal?: string
          id_presensi?: string
          jam?: string
          keterlambatan_menit?: number | null
          latitude?: number | null
          longitude?: number | null
          status?: Database["public"]["Enums"]["attendance_status"]
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_presensi_guru"
            columns: ["id_guru"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_presensi_jadwal"
            columns: ["id_jadwal"]
            isOneToOne: false
            referencedRelation: "jadwal_mengajar"
            referencedColumns: ["id_jadwal"]
          },
          {
            foreignKeyName: "presensi_mengajar_id_jadwal_fkey"
            columns: ["id_jadwal"]
            isOneToOne: false
            referencedRelation: "jadwal_mengajar"
            referencedColumns: ["id_jadwal"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          foto_url: string | null
          id: string
          nama: string
          nip: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          foto_url?: string | null
          id: string
          nama: string
          nip?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          foto_url?: string | null
          id?: string
          nama?: string
          nip?: string | null
          updated_at?: string | null
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
      app_role: "admin" | "teacher"
      attendance_status: "Hadir" | "Terlambat" | "Tidak Hadir"
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
      app_role: ["admin", "teacher"],
      attendance_status: ["Hadir", "Terlambat", "Tidak Hadir"],
    },
  },
} as const
