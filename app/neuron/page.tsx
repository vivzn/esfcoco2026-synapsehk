"use client";

import { useState, useEffect } from "react";
import { supabase, type NeuronTicket } from "@/lib/supabase";
import { getRandomDiagnosis, getRandomKioskLocation, KIOSK_LOCATIONS, hospitalsByDistance } from "@/lib/diseases";
import { QRCodeSVG } from "qrcode.react";
import {
  Activity,
  Thermometer,
  Heart,
  Pill,
  AlertTriangle,
  Loader2,
  Hospital,
  Clock,
  ArrowLeft,
  Stethoscope,
  CheckCircle2,
  CreditCard,
  ScanLine,
  User,
  Shield,
  BedDouble,
  FlaskConical,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HOSPITALS = [
  // Hong Kong — Major Public Hospitals
  "Queen Mary Hospital (HK)",
  "Prince of Wales Hospital (HK)",
  "Pamela Youde Nethersole Eastern Hospital (HK)",
  "United Christian Hospital (HK)",
  "Tuen Mun Hospital (HK)",
  "Princess Margaret Hospital (HK)",
  "Kwong Wah Hospital (HK)",
  "Queen Elizabeth Hospital (HK)",
  "Caritas Medical Centre (HK)",
  "North District Hospital (HK)",
  "Yan Chai Hospital (HK)",
  "Alice Ho Miu Ling Nethersole Hospital (HK)",
  "Pok Oi Hospital (HK)",
  "Ruttonjee Hospital (HK)",
  // Hong Kong — Private
  "Hong Kong Sanatorium & Hospital (HK)",
  "Matilda International Hospital (HK)",
  "St. Paul's Hospital (HK)",
  "Gleneagles Hospital Hong Kong (HK)",
  "Canossa Hospital (HK)",
  // Shenzhen
  "Shenzhen People's Hospital (SZ)",
  "Shenzhen University General Hospital (SZ)",
  "Peking University Shenzhen Hospital (SZ)",
  "Southern University of Science Hospital (SZ)",
  "Shenzhen Children's Hospital (SZ)",
  "Shenzhen Second People's Hospital (SZ)",
  "HK-Shenzhen Hospital (GBA)",
  // Macau
  "Kiang Wu Hospital (MAC)",
  "Centro Hospitalar Conde de São Januário (MAC)",
  "Hospital Universitário de Macau (MAC)",
  "The Macau Jockey Club Sports Medicine Centre (MAC)",
];

const TIME_SLOTS_LABELS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM",
];

// Get 7-day date window from today
function getBookingDates(): Date[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d; });
}

function formatDateKey(d: Date) { return d.toISOString().slice(0, 10); }

// time_slot stored as "YYYY-MM-DD HH:MM AM/PM"
function makeSlotKey(dateKey: string, timeLabel: string) { return `${dateKey} ${timeLabel}`; }

const SYMPTOM_OPTIONS = [
  // General
  "Fever", "Chills", "Fatigue", "Weakness", "Night Sweats", "Weight Loss",
  // Head & Neuro
  "Headache", "Migraine", "Dizziness", "Fainting", "Confusion", "Memory Loss",
  "Blurred Vision", "Ear Pain", "Ringing in Ears", "Facial Pain",
  // Respiratory
  "Cough", "Dry Cough", "Productive Cough", "Shortness of Breath",
  "Wheezing", "Sore Throat", "Runny Nose", "Nasal Congestion", "Sneezing",
  "Loss of Smell", "Loss of Taste",
  // Cardiovascular
  "Chest Pain", "Chest Tightness", "Palpitations", "Irregular Heartbeat",
  "Swollen Legs", "High Blood Pressure",
  // Gastrointestinal
  "Nausea", "Vomiting", "Diarrhoea", "Constipation", "Abdominal Pain",
  "Bloating", "Loss of Appetite", "Heartburn", "Blood in Stool",
  // Musculoskeletal
  "Body Aches", "Joint Pain", "Back Pain", "Neck Pain", "Muscle Cramps",
  "Swollen Joints", "Stiffness",
  // Skin
  "Rash", "Itching", "Hives", "Skin Discolouration", "Jaundice",
  // Urinary
  "Frequent Urination", "Painful Urination", "Blood in Urine",
  // Mental Health
  "Anxiety", "Depression", "Insomnia", "Panic Attacks",
  // Other
  "Numbness", "Tingling", "Eye Redness", "Toothache", "Difficulty Swallowing",
];

// ── Demo ID pool ───────────────────────────────────────────────
// Pick a stable demo kiosk for the whole session (simulates a physical machine location)
const SESSION_KIOSK = getRandomKioskLocation();

const DEMO_IDS = [
  { name: "Chan Tai Man",       id: "A123456(7)",  dob: "1985-03-12", gender: "M" },
  { name: "Li Mei Ling",        id: "B234567(8)",  dob: "1992-07-24", gender: "F" },
  { name: "Wong Siu Fong",      id: "C345678(9)",  dob: "1978-11-01", gender: "F" },
  { name: "Lam Kwok Wai",       id: "D456789(0)",  dob: "2001-05-17", gender: "M" },
  { name: "Ng Ka Po",           id: "E567890(1)",  dob: "1965-09-30", gender: "M" },
  { name: "Cheung Wai Ying",    id: "F678901(2)",  dob: "1999-02-08", gender: "F" },
  { name: "Zhang Wei",          id: "G789012(3)",  dob: "1988-12-20", gender: "M" },
  { name: "Liu Xiaohui",        id: "H890123(4)",  dob: "1994-06-15", gender: "F" },
  { name: "Ho Man Kit",         id: "J901234(5)",  dob: "1971-08-03", gender: "M" },
  { name: "Yuen Shuk Han",      id: "K012345(6)",  dob: "2003-04-22", gender: "F" },
];

type KioskStep = "id-scan" | "id-scanning" | "input" | "scanning" | "result-green" | "result-red" | "red-ticket";

type PatientId = { name: string; id: string; dob: string; gender: string };

export default function NeuronKiosk() {
  const [step, setStep] = useState<KioskStep>("id-scan");
  const [patient, setPatient] = useState<PatientId | null>(null);
  const [idScanProgress, setIdScanProgress] = useState(0);
  const [symptoms, setSymptoms] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [vitals, setVitals] = useState<{ temp: number; hr: number; spo2: number } | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [medicine, setMedicine] = useState<string>("");
  const [selectedHospital, setSelectedHospital] = useState(() => {
    // Default to closest hospital to the session kiosk
    const sorted = hospitalsByDistance(SESSION_KIOSK.lat, SESSION_KIOSK.lng);
    return sorted[0]?.name ?? HOSPITALS[0];
  });
  const bookingDates = getBookingDates();
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(bookingDates[0]));
  const [selectedTimeLabel, setSelectedTimeLabel] = useState(TIME_SLOTS_LABELS[0]);
  const [redTicket, setRedTicket] = useState<NeuronTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [symptomSearch, setSymptomSearch] = useState("");
  const [greenDiagnosis, setGreenDiagnosis] = useState<string>("");
  const [kioskLocationId, setKioskLocationId] = useState<string>("");

  const selectedTimeSlot = makeSlotKey(selectedDateKey, selectedTimeLabel);

  // Fetch booked slots whenever hospital/date changes (for RED flow)
  useEffect(() => {
    if (step !== "result-red") return;
    const fetchBookings = async () => {
      const { data } = await supabase
        .from("neuron_tickets")
        .select("time_slot")
        .eq("assigned_hospital", selectedHospital)
        .eq("triage_level", "RED");
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((t) => { if (t.time_slot) counts[t.time_slot] = (counts[t.time_slot] || 0) + 1; });
        const fullSlots = new Set(Object.entries(counts).filter(([, c]) => c >= 8).map(([s]) => s));
        setBookedSlots(fullSlots);
        const currentKey = makeSlotKey(selectedDateKey, selectedTimeLabel);
        if (fullSlots.has(currentKey)) {
          for (const tl of TIME_SLOTS_LABELS) {
            const k = makeSlotKey(selectedDateKey, tl);
            if (!fullSlots.has(k)) { setSelectedTimeLabel(tl); break; }
          }
        }
      }
    };
    fetchBookings();
  }, [selectedHospital, selectedDateKey, step, selectedTimeLabel]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const allSymptoms = [
    ...selectedSymptoms,
    ...(symptoms.trim() ? [symptoms.trim()] : []),
  ].join(", ");

  // ── ID Scan simulation ──
  const handleIdScan = () => {
    setStep("id-scanning");
    setIdScanProgress(0);
    const picked = DEMO_IDS[Math.floor(Math.random() * DEMO_IDS.length)];
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.floor(Math.random() * 18) + 8;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setTimeout(() => {
          setPatient(picked);
          setStep("input");
        }, 400);
      }
      setIdScanProgress(prog);
    }, 200);
  };

  const handleScan = async () => {
    if (!allSymptoms) {
      setError("Please select at least one symptom or describe your symptoms.");
      return;
    }
    setError(null);
    setStep("scanning");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const temp = +(Math.random() * (40.5 - 36.0) + 36.0).toFixed(1);
    const hr = Math.floor(Math.random() * (130 - 60 + 1)) + 60;
    const spo2 = Math.floor(Math.random() * (100 - 90 + 1)) + 90;
    const generatedVitals = { temp, hr, spo2 };
    setVitals(generatedVitals);

    const isRed = temp > 38.5 || hr > 110;

    if (!isRed) {
      const prescribedMedicine = "Amoxicillin 500mg & Ibuprofen 200mg";
      setMedicine(prescribedMedicine);
      const diagnosis = getRandomDiagnosis();
      setGreenDiagnosis(diagnosis);
      setKioskLocationId(SESSION_KIOSK.id);

      const { data, error: dbError } = await supabase
        .from("neuron_tickets")
        .insert({
          triage_level: "GREEN",
          symptoms: allSymptoms,
          vitals: generatedVitals,
          medicine_prescribed: prescribedMedicine,
          patient_name: patient?.name ?? null,
          patient_id_number: patient?.id ?? null,
          diagnosis,
          kiosk_location_id: SESSION_KIOSK.id,
        })
        .select("id")
        .single();

      if (dbError || !data) {
        setError("Failed to save ticket. Please try again.");
        setStep("input");
        return;
      }

      setTicketId(data.id);
      setStep("result-green");
    } else {
      setKioskLocationId(SESSION_KIOSK.id);
      // Auto-select the hospital closest to this kiosk
      const sorted = hospitalsByDistance(SESSION_KIOSK.lat, SESSION_KIOSK.lng);
      if (sorted.length > 0) setSelectedHospital(sorted[0].name);
      setStep("result-red");
    }
  };

  const handleRedSubmit = async () => {
    if (bookedSlots.has(selectedTimeSlot)) {
      setError("That time slot is fully booked. Please select another.");
      return;
    }
    const { data: existingSlot } = await supabase
      .from("neuron_tickets")
      .select("room_assigned")
      .eq("assigned_hospital", selectedHospital)
      .eq("time_slot", selectedTimeSlot)
      .eq("triage_level", "RED");

    const takenRooms = new Set((existingSlot ?? []).map((t: {room_assigned: string|null}) => t.room_assigned));
    let assignedRoom: string | null = null;
    for (let i = 1; i <= 8; i++) {
      if (!takenRooms.has(`Room ${i}`)) { assignedRoom = `Room ${i}`; break; }
    }

    const { data, error: dbError } = await supabase
      .from("neuron_tickets")
      .insert({
        triage_level: "RED",
        symptoms: allSymptoms,
        vitals: vitals,
        assigned_hospital: selectedHospital,
        time_slot: selectedTimeSlot,
        room_assigned: assignedRoom,
        patient_name: patient?.name ?? null,
        patient_id_number: patient?.id ?? null,
        kiosk_location_id: kioskLocationId || null,
      })
      .select()
      .single();

    if (dbError || !data) {
      setError("Failed to save ticket. Please try again.");
      return;
    }

    setRedTicket(data as NeuronTicket);
    setStep("red-ticket");
  };

  const handleReset = () => {
    setStep("id-scan");
    setPatient(null);
    setSymptoms("");
    setSelectedSymptoms([]);
    setVitals(null);
    setTicketId(null);
    setMedicine("");
    setSelectedHospital(hospitalsByDistance(SESSION_KIOSK.lat, SESSION_KIOSK.lng)[0]?.name ?? HOSPITALS[0]);
    setSelectedDateKey(formatDateKey(bookingDates[0]));
    setSelectedTimeLabel(TIME_SLOTS_LABELS[0]);
    setRedTicket(null);
    setError(null);
    setSymptomSearch("");
    setGreenDiagnosis("");
    setKioskLocationId("");
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const filteredSymptoms = symptomSearch.trim()
    ? SYMPTOM_OPTIONS.filter((s) => s.toLowerCase().includes(symptomSearch.toLowerCase()))
    : SYMPTOM_OPTIONS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Neuron</h1>
          </div>
          <p className="text-slate-500 text-sm">AI Health Kiosk</p>
        </div>

        {/* ID SCAN */}
        {step === "id-scan" && (
          <Card className="p-8 flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-200">
              <CreditCard className="w-10 h-10 text-sky-500" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Identity Verification</h2>
              <p className="text-slate-500 text-sm">Please insert your HKID or travel document into the scanner to begin.</p>
            </div>
            {/* Kiosk location always visible on first page */}
            <div className="w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">This Kiosk</p>
                <p className="text-sm font-semibold text-slate-800">{SESSION_KIOSK.name}</p>
                <p className="text-xs text-slate-400">{SESSION_KIOSK.district} · {SESSION_KIOSK.region}</p>
              </div>
            </div>
            <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center gap-3">
              <ScanLine className="w-8 h-8 text-slate-400 animate-pulse" />
              <p className="text-slate-500 text-sm">Card Scanner Ready</p>
            </div>
            <Button variant="sky" size="xl" className="w-full" onClick={handleIdScan}>
              <ScanLine className="w-5 h-5" /> Scan Identity Card
            </Button>
          </Card>
        )}

        {/* ID SCANNING */}
        {step === "id-scanning" && (
          <Card className="p-12 flex flex-col items-center gap-8">
            <div className="relative w-40 h-24 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center overflow-hidden">
              <CreditCard className="w-10 h-10 text-sky-500" />
              <div className="absolute left-0 right-0 h-0.5 bg-sky-400" style={{ top: `${idScanProgress}%`, transition: "top 0.15s linear" }} />
            </div>
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs text-slate-500"><span>Reading card data…</span><span>{idScanProgress}%</span></div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 transition-all duration-200 rounded-full" style={{ width: `${idScanProgress}%` }} />
              </div>
            </div>
            <p className="text-slate-500 text-sm text-center">Verifying identity — do not remove card</p>
          </Card>
        )}

        {/* INPUT SCREEN */}
        {step === "input" && (
          <Card className="p-6 space-y-5">
            {patient && (
              <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl p-4">
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm">Hi, {patient.name} 👋</p>
                  <p className="text-slate-500 text-xs">ID: {patient.id} · DOB: {patient.dob} · {patient.gender === "M" ? "Male" : "Female"}</p>
                </div>
                <Shield className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
              </div>
            )}
            {/* Always show kiosk location */}
            <KioskLocationChip />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                What are your symptoms today{patient ? `, ${patient.name.split(" ")[0]}` : ""}?
              </label>
              <Input type="text" value={symptomSearch} onChange={(e) => setSymptomSearch(e.target.value)} placeholder="Search symptoms…" className="mb-3 focus:ring-emerald-400/50" />
              <div className="flex flex-wrap gap-2 mb-3 max-h-52 overflow-y-auto pr-1">
                {filteredSymptoms.map((symptom) => (
                  <button key={symptom} onClick={() => toggleSymptom(symptom)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border ${selectedSymptoms.includes(symptom) ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                    {symptom}
                  </button>
                ))}
              </div>
              {selectedSymptoms.length > 0 && (
                <div className="mb-3 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                  <p className="text-xs text-slate-500 mb-1">Selected ({selectedSymptoms.length}):</p>
                  <p className="text-emerald-700 text-sm">{selectedSymptoms.join(", ")}</p>
                </div>
              )}
              <Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Describe any additional symptoms…" rows={2} className="focus:ring-emerald-400/50 resize-none" />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <Button variant="emerald" size="xl" className="w-full" onClick={handleScan}>
              <Activity className="w-5 h-5" /> Initiate Biometric Scan
            </Button>
          </Card>
        )}

        {/* SCANNING SCREEN */}
        {step === "scanning" && (
          <Card className="p-12 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Activity className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-pulse-ring" />
              <div className="absolute inset-[-8px] rounded-full border-2 border-emerald-400/20 animate-pulse-ring [animation-delay:0.4s]" />
            </div>
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-800 text-lg font-medium">Scanning vitals{patient ? `, ${patient.name.split(" ")[0]}` : ""}…</p>
              <p className="text-slate-500 text-sm mt-1">Please remain still</p>
            </div>
          </Card>
        )}

        {/* GREEN RESULT */}
        {step === "result-green" && vitals && (
          <GreenResult vitals={vitals} medicine={medicine} ticketId={ticketId} baseUrl={baseUrl} patient={patient} diagnosis={greenDiagnosis} kioskLocationId={kioskLocationId} onReset={handleReset} />
        )}

        {/* RED RESULT */}
        {step === "result-red" && vitals && (
          <RedSelection vitals={vitals} patient={patient} selectedHospital={selectedHospital} setSelectedHospital={setSelectedHospital}
            selectedDateKey={selectedDateKey} setSelectedDateKey={setSelectedDateKey}
            selectedTimeLabel={selectedTimeLabel} setSelectedTimeLabel={setSelectedTimeLabel}
            bookedSlots={bookedSlots} error={error} onSubmit={handleRedSubmit} onReset={handleReset}
            bookingDates={bookingDates} kioskLocationId={kioskLocationId} />
        )}

        {/* RED TICKET */}
        {step === "red-ticket" && redTicket && vitals && (
          <RedTicketView ticket={redTicket} vitals={vitals} patient={patient} kioskLocationId={kioskLocationId} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function GreenResult({
  vitals, medicine, ticketId, baseUrl, patient, diagnosis, kioskLocationId, onReset,
}: {
  vitals: { temp: number; hr: number; spo2: number }; medicine: string; ticketId: string | null;
  baseUrl: string; patient: PatientId | null; diagnosis: string; kioskLocationId: string; onReset: () => void;
}) {
  const kioskLoc = KIOSK_LOCATIONS.find((k) => k.id === kioskLocationId);
  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 p-6 space-y-6">
        {patient && (
          <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl p-3">
            <User className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <div>
              <p className="text-slate-800 text-sm font-semibold">{patient.name}</p>
              <p className="text-slate-500 text-xs">ID: {patient.id}</p>
            </div>
          </div>
        )}
        <VitalsGrid vitals={vitals} />
        <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-700 font-semibold">GREEN — Mild Illness Detected</span>
        </div>
        {diagnosis && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-slate-700 font-medium">AI Preliminary Diagnosis</p>
            </div>
            <p className="text-blue-900 font-semibold text-base">{diagnosis}</p>
            <p className="text-xs text-blue-600 mt-1">Based on reported symptoms and vitals — not a clinical diagnosis</p>
          </div>
        )}
        {kioskLoc && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Kiosk Location</p>
              <p className="text-slate-700 text-sm font-medium">{kioskLoc.name}</p>
              <p className="text-xs text-slate-400">{kioskLoc.district} · {kioskLoc.region}</p>
            </div>
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-slate-700 font-medium">Prescribed Medication</p>
          </div>
          <p className="text-slate-900 font-semibold">{medicine}</p>
        </div>
        {ticketId && (
          <div className="flex flex-col items-center gap-4">
            <CopyTicketIdButton ticketId={ticketId ?? ""} />
            <a href={`${baseUrl}/dispenser/${ticketId}`} target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-2xl p-4 cursor-pointer border border-slate-200 hover:shadow-lg transition-shadow">
              <QRCodeSVG value={`${baseUrl}/dispenser/${ticketId}`} size={180} level="H" />
            </a>
            <p className="text-slate-600 text-sm text-center max-w-xs">
              Scan this QR code or{" "}
              <a href={`${baseUrl}/dispenser/${ticketId}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-medium underline underline-offset-2">click here</a>{" "}
              to visit the nearest Axon Dispensary and collect your prescription.
            </p>
          </div>
        )}
      </Card>
      <ResetButton onReset={onReset} />
    </div>
  );
}

function RedSelection({
  vitals, patient, selectedHospital, setSelectedHospital,
  selectedDateKey, setSelectedDateKey, selectedTimeLabel, setSelectedTimeLabel,
  bookedSlots, error, onSubmit, onReset, bookingDates, kioskLocationId,
}: {
  vitals: { temp: number; hr: number; spo2: number }; patient: PatientId | null;
  selectedHospital: string; setSelectedHospital: (v: string) => void;
  selectedDateKey: string; setSelectedDateKey: (v: string) => void;
  selectedTimeLabel: string; setSelectedTimeLabel: (v: string) => void;
  bookedSlots: Set<string>; error: string | null; onSubmit: () => void; onReset: () => void;
  bookingDates: Date[]; kioskLocationId: string;
}) {
  const todayKey = formatDateKey(bookingDates[0]);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [showHospitalList, setShowHospitalList] = useState(false);

  const kioskLoc = KIOSK_LOCATIONS.find((k) => k.id === kioskLocationId);
  const sortedHospitals = kioskLoc
    ? hospitalsByDistance(kioskLoc.lat, kioskLoc.lng)
    : HOSPITALS.map((name) => ({ name, distKm: 0, lat: 0, lng: 0, region: "HK" as const }));

  const filtered = hospitalSearch.trim()
    ? sortedHospitals.filter((h) => h.name.toLowerCase().includes(hospitalSearch.toLowerCase()))
    : sortedHospitals;

  const closestName = sortedHospitals[0]?.name ?? "";
  const selectedDist = sortedHospitals.find((h) => h.name === selectedHospital)?.distKm;

  return (
    <div className="space-y-4">
      <Card className="border-red-200 p-6 space-y-6">
        <VitalsGrid vitals={vitals} showDanger />
        <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-xl py-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 font-semibold">RED — Urgent Attention Required</span>
        </div>
        {/* Kiosk location chip */}
        {kioskLoc && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Your Kiosk Location</p>
              <p className="text-sm font-semibold text-slate-800">{kioskLoc.name}</p>
              <p className="text-xs text-slate-400">{kioskLoc.district} · {kioskLoc.region}</p>
            </div>
          </div>
        )}
        {/* Hospital selector */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Hospital className="w-4 h-4" /> Select Hospital
          </label>
          {/* Selected hospital display */}
          <button
            type="button"
            onClick={() => setShowHospitalList((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 text-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 cursor-pointer hover:border-slate-300 text-left"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{selectedHospital}</p>
              {selectedDist !== undefined && kioskLoc && (
                <p className="text-xs text-slate-400">{selectedDist < 1 ? `${Math.round(selectedDist * 1000)} m` : `${selectedDist.toFixed(1)} km`} from kiosk{selectedHospital === closestName ? " · ✨ Closest" : ""}</p>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-2 transition-transform ${showHospitalList ? "rotate-180" : ""}`} />
          </button>
          {showHospitalList && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-slate-100">
                <Input
                  type="text"
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  placeholder="Search hospitals…"
                  className="focus:ring-red-400/50"
                  autoFocus
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filtered.map((h, idx) => (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => { setSelectedHospital(h.name); setShowHospitalList(false); setHospitalSearch(""); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm cursor-pointer hover:bg-slate-50 transition-colors ${h.name === selectedHospital ? "bg-red-50" : ""}`}
                  >
                    <span className={`truncate flex-1 ${h.name === selectedHospital ? "font-semibold text-red-700" : "text-slate-800"}`}>{h.name}</span>
                    <span className="flex-shrink-0 ml-3 text-xs text-slate-400 flex items-center gap-1">
                      {kioskLoc && h.distKm > 0 && <span>{h.distKm < 1 ? `${Math.round(h.distKm * 1000)}m` : `${h.distKm.toFixed(1)}km`}</span>}
                      {idx === 0 && kioskLoc && <span className="text-emerald-500 font-semibold">Closest</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Date selector */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <ArrowLeft className="w-4 h-4 rotate-180" /> Select Date
          </label>
          <div className="grid grid-cols-7 gap-1">
            {bookingDates.map((d) => {
              const dk = formatDateKey(d);
              const isToday = dk === todayKey;
              const isSelected = dk === selectedDateKey;
              return (
                <button key={dk} onClick={() => setSelectedDateKey(dk)}
                  className={`flex flex-col items-center rounded-xl py-2 px-0.5 text-center transition-all border cursor-pointer ${isSelected ? "bg-red-500 border-red-500 text-white" : isToday ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                  <span className="text-xs">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                  <span className="text-sm font-bold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Time slot selector */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Clock className="w-4 h-4" /> Select Time Slot
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS_LABELS.map((t) => {
              const slotKey = makeSlotKey(selectedDateKey, t);
              const full = bookedSlots.has(slotKey);
              return (
                <button key={t} onClick={() => !full && setSelectedTimeLabel(t)} disabled={full}
                  className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all ${
                    full ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through" :
                    selectedTimeLabel === t ? "bg-red-500 border-red-500 text-white" :
                    "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer"
                  }`}>
                  {full ? "Full" : t}
                </button>
              );
            })}
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        <Button variant="red" size="xl" className="w-full" onClick={onSubmit}>
          <Hospital className="w-5 h-5" /> Book Hospital Appointment
        </Button>
      </Card>
      <ResetButton onReset={onReset} />
    </div>
  );
}

function RedTicketView({ ticket, vitals, patient, kioskLocationId, onReset }: {
  ticket: NeuronTicket; vitals: { temp: number; hr: number; spo2: number };
  patient: PatientId | null; kioskLocationId: string; onReset: () => void;
}) {
  const kioskLoc = KIOSK_LOCATIONS.find((k) => k.id === kioskLocationId);
  return (
    <div className="space-y-4">
      <Card className="border-red-200 p-6 space-y-6">
        <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-xl py-3">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-red-700 font-semibold">URGENT — Hospital Referral</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="text-center border-b border-slate-200 pb-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Digital Ticket</p>
            <p className="text-xs text-slate-400 font-mono">{ticket.id}</p>
          </div>
          {patient && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <div>
                <p className="text-slate-900 font-semibold text-sm">{patient.name}</p>
                <p className="text-slate-500 text-xs">ID: {patient.id}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-slate-500 mb-1">Hospital</p><p className="text-slate-900 font-semibold text-sm">{ticket.assigned_hospital}</p></div>
            <div><p className="text-xs text-slate-500 mb-1">Time Slot</p><p className="text-slate-900 font-semibold text-sm">{ticket.time_slot}</p></div>
            {ticket.room_assigned && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><BedDouble className="w-3 h-3" /> Assigned Room</p>
                <p className="text-emerald-600 font-bold text-base">{ticket.room_assigned}</p>
              </div>
            )}
            <div><p className="text-xs text-slate-500 mb-1">Temperature</p><p className="text-slate-900 font-semibold text-sm">{vitals.temp}°C</p></div>
            <div><p className="text-xs text-slate-500 mb-1">Heart Rate</p><p className="text-slate-900 font-semibold text-sm">{vitals.hr} bpm</p></div>
          </div>
          <div><p className="text-xs text-slate-500 mb-1">Symptoms</p><p className="text-slate-800 text-sm">{ticket.symptoms}</p></div>
          {kioskLoc && (
            <div className="flex items-center gap-2 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-500">{kioskLoc.name} · {kioskLoc.district}</p>
            </div>
          )}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-800 text-sm font-medium">
            ⚠️ Please proceed to the hospital immediately. Your pre-diagnostics have been sent to the medical team.
          </p>
        </div>
      </Card>
      <ResetButton onReset={onReset} />
    </div>
  );
}

function KioskLocationChip() {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
      <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-500">This Kiosk</p>
        <p className="text-sm font-semibold text-slate-800">{SESSION_KIOSK.name}</p>
        <p className="text-xs text-slate-400">{SESSION_KIOSK.district} · {SESSION_KIOSK.region}</p>
      </div>
    </div>
  );
}

function VitalsGrid({ vitals, showDanger }: { vitals: { temp: number; hr: number; spo2: number }; showDanger?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="p-3 text-center">
        <Thermometer className="w-5 h-5 text-sky-500 mx-auto mb-1" />
        <p className="text-xs text-slate-500">Temp</p>
        <p className={`font-semibold text-sm ${showDanger && vitals.temp > 38.5 ? "text-red-500" : "text-slate-800"}`}>{vitals.temp}°C</p>
      </Card>
      <Card className="p-3 text-center">
        <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
        <p className="text-xs text-slate-500">Heart Rate</p>
        <p className={`font-semibold text-sm ${showDanger && vitals.hr > 110 ? "text-red-500" : "text-slate-800"}`}>{vitals.hr} bpm</p>
      </Card>
      <Card className="p-3 text-center">
        <Activity className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
        <p className="text-xs text-slate-500">SpO2</p>
        <p className="text-slate-800 font-semibold text-sm">{vitals.spo2}%</p>
      </Card>
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <Button variant="outline-slate" className="w-full" onClick={onReset}>
      <ArrowLeft className="w-4 h-4" /> New Consultation
    </Button>
  );
}

function CopyTicketIdButton({ ticketId }: { ticketId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!ticketId) return;
    navigator.clipboard.writeText(ticketId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button variant="outline" size="sm" onClick={copy} className="font-mono text-xs">
      {copied ? (
        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
      ) : (
        <><CreditCard className="w-3.5 h-3.5" /> {ticketId.slice(0, 8)}…</>
      )}
    </Button>
  );
}
