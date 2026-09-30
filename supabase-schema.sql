-- Run this SQL in your Supabase SQL Editor to create the neuron_tickets table

CREATE TABLE IF NOT EXISTS neuron_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triage_level TEXT NOT NULL CHECK (triage_level IN ('GREEN', 'RED')),
  symptoms TEXT NOT NULL,
  vitals JSONB NOT NULL DEFAULT '{}',
  assigned_hospital TEXT,
  time_slot TEXT,
  medicine_prescribed TEXT,
  is_collected BOOLEAN NOT NULL DEFAULT false,
  doctor_assigned TEXT,
  patient_name TEXT,
  patient_id_number TEXT,
  notes TEXT,
  arrived BOOLEAN NOT NULL DEFAULT false,
  room_assigned TEXT,
  diagnosis TEXT,
  kiosk_location_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to existing table if upgrading
ALTER TABLE neuron_tickets ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE neuron_tickets ADD COLUMN IF NOT EXISTS kiosk_location_id TEXT;

-- Enable Row Level Security (optional, for demo allow all)
ALTER TABLE neuron_tickets ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon users (demo only — restrict in production)
CREATE POLICY "Allow all for anon" ON neuron_tickets
  FOR ALL
  USING (true)
  WITH CHECK (true);
