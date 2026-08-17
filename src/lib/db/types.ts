/**
 * Hand-written database types matching supabase/schema.sql.
 *
 * If you later change the schema, regenerate instead of editing by hand:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/db/types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ProfileRow = {
  id: string;
  doctor_name: string;
  qualifications: string;
  bmdc_no: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email: string;
  default_language: "en" | "bn";
  overlay_boxes: Json;
  overlay_font_max: number;
  overlay_font_min: number;
  rx_counter: number;
  created_at: string;
  updated_at: string;
};

export type PatientRow = {
  id: string;
  user_id: string;
  name: string;
  age: string;
  sex: "Male" | "Female" | "Other" | null;
  phone: string;
  mrn: string;
  weight: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type PrescriptionRow = {
  id: string;
  user_id: string;
  patient_id: string | null;
  serial: number;
  visit_date: string;
  patient_snapshot: Json;
  content: Json;
  summary: string;
  printed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  content: Json;
  use_count: number;
  created_at: string;
  updated_at: string;
};

export type MedicineRow = {
  id: string;
  user_id: string;
  name: string;
  generic: string;
  strength: string;
  form: string;
  category: string;
  default_dose: string;
  default_frequency: string;
  default_duration: string;
  default_instructions: string;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
};

export type MedicineSearchRow = {
  id: string;
  name: string;
  generic: string;
  strength: string | null;
  form: string | null;
  category: string;
  default_dose: string;
  default_frequency: string;
  default_duration: string;
  default_instructions: string;
  is_favorite: boolean;
  use_count: number;
  is_custom: boolean;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Partial<ProfileRow> & { id: string }>;
      patients: Table<PatientRow, Partial<PatientRow> & { user_id: string; name: string }>;
      prescriptions: Table<
        PrescriptionRow,
        Partial<PrescriptionRow> & { user_id: string; content: Json }
      >;
      templates: Table<
        TemplateRow,
        Partial<TemplateRow> & { user_id: string; name: string; content: Json }
      >;
      medicines: Table<MedicineRow, Partial<MedicineRow> & { user_id: string; name: string }>;
      medicine_catalog: Table<{
        id: string;
        name: string;
        generic: string;
        strength: string | null;
        form: string | null;
        category: string;
        created_at: string;
      }>;
    };
    Views: {
      medicines_all: { Row: MedicineSearchRow; Relationships: [] };
    };
    Functions: {
      search_patients: {
        Args: { q: string; lim?: number };
        Returns: PatientRow[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
