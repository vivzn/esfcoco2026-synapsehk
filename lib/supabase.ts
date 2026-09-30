import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type NeuronTicket = {
  id: string;
  triage_level: "GREEN" | "RED";
  symptoms: string;
  vitals: { temp: number; hr: number; spo2: number };
  assigned_hospital: string | null;
  time_slot: string | null;
  room_assigned: string | null;
  medicine_prescribed: string | null;
  is_collected: boolean;
  doctor_assigned: string | null;
  patient_name: string | null;
  patient_id_number: string | null;
  notes: string | null;
  arrived: boolean;
  diagnosis: string | null;
  kiosk_location_id: string | null;
  created_at: string;
};
