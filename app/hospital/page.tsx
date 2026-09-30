"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, type NeuronTicket } from "@/lib/supabase";
import { DISEASE_LIST } from "@/lib/diseases";
import DiseaseMapTab from "./disease-map";
import {
  Hospital, AlertTriangle, Thermometer, Heart, Activity, User, Clock,
  ChevronDown, ChevronUp, Stethoscope, UserCheck, RefreshCw, FileText,
  Loader2, BedDouble, Plus, Pencil, Check, X, LogIn, StickyNote,
  Shield, Calendar, LogOut, List, FlaskConical, MapPin, Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const HOSPITALS = [
  "Queen Mary Hospital (HK)", "Prince of Wales Hospital (HK)",
  "Pamela Youde Nethersole Eastern Hospital (HK)", "United Christian Hospital (HK)",
  "Tuen Mun Hospital (HK)", "Princess Margaret Hospital (HK)",
  "Kwong Wah Hospital (HK)", "Queen Elizabeth Hospital (HK)",
  "Caritas Medical Centre (HK)", "North District Hospital (HK)",
  "Yan Chai Hospital (HK)", "Alice Ho Miu Ling Nethersole Hospital (HK)",
  "Pok Oi Hospital (HK)", "Ruttonjee Hospital (HK)",
  "Hong Kong Sanatorium & Hospital (HK)", "Matilda International Hospital (HK)",
  "St. Paul's Hospital (HK)", "Gleneagles Hospital Hong Kong (HK)", "Canossa Hospital (HK)",
  "Shenzhen People's Hospital (SZ)", "Shenzhen University General Hospital (SZ)",
  "Peking University Shenzhen Hospital (SZ)", "Southern University of Science Hospital (SZ)",
  "Shenzhen Children's Hospital (SZ)", "Shenzhen Second People's Hospital (SZ)",
  "HK-Shenzhen Hospital (GBA)", "Kiang Wu Hospital (MAC)",
  "Centro Hospitalar Conde de São Januário (MAC)", "Hospital Universitário de Macau (MAC)",
  "The Macau Jockey Club Sports Medicine Centre (MAC)",
];

const DEFAULT_ROOMS = Array.from({ length: 8 }, (_, i) => `Room ${i + 1}`);

// Helper: get YYYY-MM-DD for a Date
function formatDateKey(d: Date) { return d.toISOString().slice(0, 10); }

// Week window: today + 6 days
function getWeekDates(): Date[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d; });
}

// Which date does a ticket belong to? Prefer date prefix in time_slot, fallback to created_at
function getTicketDateKey(ticket: NeuronTicket): string {
  if (ticket.time_slot) {
    const m = ticket.time_slot.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  return ticket.created_at.slice(0, 10);
}

type DashboardTab = "queue" | "rooms" | "calendar" | "map";

export default function HospitalDashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState("");
  const [selectedHospital, setSelectedHospital] = useState(HOSPITALS[0]);
  const [tickets, setTickets] = useState<NeuronTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [doctorInputs, setDoctorInputs] = useState<Record<string, string>>({});
  const [savingDoctor, setSavingDoctor] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [roomsByHospital, setRoomsByHospital] = useState<Record<string, string[]>>({});
  const [editingRoom, setEditingRoom] = useState<{ idx: number; val: string } | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("queue");
  const [markingArrived, setMarkingArrived] = useState<string | null>(null);
  const [diagnosisInputs, setDiagnosisInputs] = useState<Record<string, string>>({});
  const [savingDiagnosis, setSavingDiagnosis] = useState<string | null>(null);

  const weekDates = getWeekDates();
  const todayKey = formatDateKey(weekDates[0]);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Auth check
  useEffect(() => {
    const auth = sessionStorage.getItem("hospital_auth");
    const user = sessionStorage.getItem("hospital_user") ?? "";
    if (auth === "true") { setAuthed(true); setCurrentUser(user); }
    else { router.replace("/hospital/login"); }
  }, [router]);

  const currentRooms: string[] = roomsByHospital[selectedHospital] ?? DEFAULT_ROOMS;
  const setCurrentRooms = (rooms: string[]) =>
    setRoomsByHospital((prev) => ({ ...prev, [selectedHospital]: rooms }));

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("neuron_tickets")
      .select("*")
      .eq("assigned_hospital", selectedHospital)
      .eq("triage_level", "RED")
      .order("time_slot", { ascending: true });
    if (!error && data) setTickets(data as NeuronTicket[]);
    setLoading(false);
  }, [selectedHospital]);

  useEffect(() => { if (authed) fetchTickets(); }, [fetchTickets, authed]);

  useEffect(() => {
    if (!authed) return;
    const channel = supabase
      .channel("neuron_tickets_realtime_v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "neuron_tickets", filter: `assigned_hospital=eq.${selectedHospital}` }, () => { fetchTickets(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedHospital, fetchTickets, authed]);

  const handleAssignDoctor = async (ticketId: string) => {
    const doctor = doctorInputs[ticketId]?.trim();
    if (!doctor) return;
    setSavingDoctor(ticketId);
    await supabase.from("neuron_tickets").update({ doctor_assigned: doctor }).eq("id", ticketId);
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, doctor_assigned: doctor } : t));
    setDoctorInputs((prev) => ({ ...prev, [ticketId]: "" }));
    setSavingDoctor(null);
  };

  const handleSaveNote = async (ticketId: string) => {
    const note = noteInputs[ticketId]?.trim();
    if (!note) return;
    setSavingNote(ticketId);
    await supabase.from("neuron_tickets").update({ notes: note }).eq("id", ticketId);
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, notes: note } : t));
    setNoteInputs((prev) => ({ ...prev, [ticketId]: "" }));
    setSavingNote(null);
  };

  const handleMarkArrived = async (ticketId: string) => {
    setMarkingArrived(ticketId);
    await supabase.from("neuron_tickets").update({ arrived: true }).eq("id", ticketId);
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, arrived: true } : t));
    setMarkingArrived(null);
  };

  const handleSaveDiagnosis = async (ticketId: string) => {
    const diagnosis = diagnosisInputs[ticketId]?.trim();
    if (!diagnosis) return;
    setSavingDiagnosis(ticketId);
    await supabase.from("neuron_tickets").update({ diagnosis }).eq("id", ticketId);
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, diagnosis } : t));
    setDiagnosisInputs((prev) => ({ ...prev, [ticketId]: "" }));
    setSavingDiagnosis(null);
  };

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const handleLogout = () => {
    sessionStorage.removeItem("hospital_auth");
    sessionStorage.removeItem("hospital_user");
    router.push("/hospital/login");
  };

  // Filter tickets to the selected date
  const dayTickets = tickets.filter((t) => getTicketDateKey(t) === selectedDateKey);

  // Stats for selected day
  const totalQueue = dayTickets.length;
  const arrivedCount = dayTickets.filter((t) => t.arrived).length;
  const assignedCount = dayTickets.filter((t) => t.doctor_assigned).length;
  const unassignedCount = totalQueue - assignedCount;

  // Room occupancy map for selected day only
  const roomOccupancy: Record<string, NeuronTicket[]> = {};
  for (const t of dayTickets) {
    if (t.room_assigned) {
      if (!roomOccupancy[t.room_assigned]) roomOccupancy[t.room_assigned] = [];
      roomOccupancy[t.room_assigned].push(t);
    }
  }
  const occupiedCount = Object.keys(roomOccupancy).length;

  // Per-day count across entire fetched dataset
  const countPerDay: Record<string, number> = {};
  for (const t of tickets) {
    const dk = getTicketDateKey(t);
    countPerDay[dk] = (countPerDay[dk] ?? 0) + 1;
  }

  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
              <Hospital className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Triage Dashboard</h1>
              <p className="text-xs text-slate-500">RED Code Patient Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <PulseBadge />
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger className="max-w-xs focus:ring-red-400/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOSPITALS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchTickets} aria-label="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-600 font-medium">{currentUser}</span>
            </div>
            <Button variant="outline" size="icon" onClick={handleLogout} title="Logout" className="hover:text-red-500 hover:border-red-200">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Date strip */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Select Date</span>
            <span className="text-xs text-slate-400">— 7-day booking window</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((d) => {
              const dk = formatDateKey(d);
              const isToday = dk === todayKey;
              const isSelected = dk === selectedDateKey;
              const cnt = countPerDay[dk] ?? 0;
              return (
                <button key={dk} onClick={() => setSelectedDateKey(dk)}
                  className={`flex flex-col items-center rounded-xl py-2.5 px-1 text-center transition-all border cursor-pointer ${isSelected ? "bg-red-500 border-red-500 text-white shadow-sm" : isToday ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                  type="button">
                  <span className="text-xs font-medium">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                  <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                  <span className="text-xs">{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                  {cnt > 0 && <span className={`mt-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>{cnt}</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Viewing: <span className="font-semibold text-slate-600">{weekDates.find((d) => formatDateKey(d) === selectedDateKey)?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span>
            {selectedDateKey === todayKey && <span className="ml-2 text-red-500 font-medium">— Today</span>}
          </p>
        </Card>

        {/* Stats for selected day */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Bookings" value={String(totalQueue)} color="red" />
          <StatCard label="Arrived" value={String(arrivedCount)} color="emerald" />
          <StatCard label="Awaiting" value={String(totalQueue - arrivedCount)} color="amber" />
          <StatCard label="Doctor Assigned" value={String(assignedCount)} color="sky" />
          <StatCard label="Unassigned" value={String(unassignedCount)} color="violet" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 flex-wrap">
          {([["queue", "Queue"], ["rooms", "Room Map"], ["calendar", "Calendar"], ["map", "Disease Map"]] as [DashboardTab, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all cursor-pointer ${activeTab === tab ? "border-red-500 text-red-600 bg-red-50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
              {tab === "map" && <Map className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>

        {/* QUEUE TAB */}
        {activeTab === "queue" && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-red-400 animate-spin" /></div>
            ) : dayTickets.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No bookings for this date</p>
                <p className="text-slate-400 text-sm mt-1">{selectedDateKey === todayKey ? "No patients booked today." : "No patients booked for this day."}</p>
              </Card>
            ) : (
              dayTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  expanded={expandedId === ticket.id}
                  onToggle={() => toggleExpand(ticket.id)}
                  doctorInput={doctorInputs[ticket.id] ?? ""}
                  onDoctorInputChange={(v) => setDoctorInputs((p) => ({ ...p, [ticket.id]: v }))}
                  onAssignDoctor={() => handleAssignDoctor(ticket.id)}
                  savingDoctor={savingDoctor === ticket.id}
                  noteInput={noteInputs[ticket.id] ?? ""}
                  onNoteInputChange={(v) => setNoteInputs((p) => ({ ...p, [ticket.id]: v }))}
                  onSaveNote={() => handleSaveNote(ticket.id)}
                  savingNote={savingNote === ticket.id}
                  onMarkArrived={() => handleMarkArrived(ticket.id)}
                  markingArrived={markingArrived === ticket.id}
                  diagnosisInput={diagnosisInputs[ticket.id] ?? ""}
                  onDiagnosisInputChange={(v) => setDiagnosisInputs((p) => ({ ...p, [ticket.id]: v }))}
                  onSaveDiagnosis={() => handleSaveDiagnosis(ticket.id)}
                  savingDiagnosis={savingDiagnosis === ticket.id}
                />
              ))
            )}
          </div>
        )}

        {/* ROOMS TAB */}
        {activeTab === "rooms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Room Occupancy</h2>
                <p className="text-sm text-slate-500">{occupiedCount} of {currentRooms.length} rooms occupied · {weekDates.find((d) => formatDateKey(d) === selectedDateKey)?.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
              </div>
              <Button variant="sky" size="sm" onClick={() => { const name = newRoomName.trim() || `Room ${currentRooms.length + 1}`; setCurrentRooms([...currentRooms, name]); setNewRoomName(""); }}>
                <Plus className="w-4 h-4" /> Add Room
              </Button>
            </div>
            <Input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="New room name (optional)…"
              className="focus:ring-sky-400/50"
              onKeyDown={(e) => { if (e.key === "Enter") { const name = newRoomName.trim() || `Room ${currentRooms.length + 1}`; setCurrentRooms([...currentRooms, name]); setNewRoomName(""); }}}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentRooms.map((room, idx) => {
                const occupants = roomOccupancy[room] ?? [];
                const isEditing = editingRoom?.idx === idx;
                return (
                  <Card key={idx} className={`p-4 space-y-3 ${occupants.length > 0 ? "border-red-200 shadow-sm" : ""}`}>
                    <div className="flex items-center justify-between">
                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input autoFocus type="text" value={editingRoom.val}
                            onChange={(e) => setEditingRoom({ idx, val: e.target.value })}
                            className="flex-1 h-7 text-sm px-2 py-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { const updated = [...currentRooms]; updated[idx] = editingRoom.val.trim() || room; setCurrentRooms(updated); setEditingRoom(null); }
                              if (e.key === "Escape") setEditingRoom(null);
                            }} />
                          <Button variant="ghost" size="icon-sm" onClick={() => { const updated = [...currentRooms]; updated[idx] = editingRoom.val.trim() || room; setCurrentRooms(updated); setEditingRoom(null); }} className="text-emerald-500"><Check className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingRoom(null)} className="text-slate-400"><X className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <BedDouble className={`w-4 h-4 ${occupants.length > 0 ? "text-red-400" : "text-sky-400"}`} />
                            <span className="text-slate-800 text-sm font-medium">{room}</span>
                          </div>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingRoom({ idx, val: room })} className="text-slate-400 hover:text-slate-600"><Pencil className="w-3.5 h-3.5" /></Button>
                        </>
                      )}
                    </div>
                    {occupants.length > 0 ? (
                      <div className="space-y-2">
                        {occupants.map((t) => (
                          <div key={t.id} className="text-xs bg-red-50 border border-red-100 rounded-lg p-2">
                            <p className="text-slate-800 font-medium">{t.patient_name ?? "Unknown Patient"}</p>
                            <p className="text-slate-500">{t.time_slot}</p>
                            {t.doctor_assigned && <p className="text-emerald-600">Dr. {t.doctor_assigned}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs">Available</p>
                    )}
                    <div className={`text-xs px-2 py-1 rounded-lg text-center font-medium ${
                      occupants.length > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {occupants.length > 0 ? `${occupants.length} patient(s)` : "Free"}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === "calendar" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">7-Day Calendar Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {weekDates.map((d) => {
                const dk = formatDateKey(d);
                const isToday = dk === todayKey;
                const isSelected = dk === selectedDateKey;
                const dayT = tickets.filter((t) => getTicketDateKey(t) === dk);
                const arrivedDay = dayT.filter((t) => t.arrived).length;
                const assignedDay = dayT.filter((t) => t.doctor_assigned).length;
                return (
                  <Card key={dk} onClick={() => { setSelectedDateKey(dk); setActiveTab("queue"); }}
                    className={`p-4 text-left transition-all cursor-pointer hover:shadow-md ${isSelected ? "border-red-300 bg-red-50 shadow-sm" : isToday ? "border-red-200" : "hover:border-slate-300"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                      {isToday && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Today</span>}
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-0.5">{d.getDate()}</p>
                    <p className="text-xs text-slate-400 mb-3">{d.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
                    {dayT.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No bookings</p>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Bookings</span><span className="font-bold text-red-600">{dayT.length}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Arrived</span><span className="font-semibold text-emerald-600">{arrivedDay}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Assigned</span><span className="font-semibold text-sky-600">{assignedDay}</span></div>
                        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, (dayT.length / 16) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 text-center">Click any day to view its queue</p>
          </div>
        )}

        {/* DISEASE MAP TAB */}
        {activeTab === "map" && (
          <DiseaseMapTab />
        )}

      </main>
    </div>
  );
}

function PulseBadge() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      Live · {time}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const cMap: Record<string, string> = { red: "text-red-600", emerald: "text-emerald-600", amber: "text-amber-600", sky: "text-sky-600", violet: "text-violet-600" };
  const bgMap: Record<string, string> = { red: "bg-red-50 border-red-100", emerald: "bg-emerald-50 border-emerald-100", amber: "bg-amber-50 border-amber-100", sky: "bg-sky-50 border-sky-100", violet: "bg-violet-50 border-violet-100" };
  return (
    <div className={`rounded-xl border p-4 ${color ? bgMap[color] ?? "bg-white border-slate-200" : "bg-white border-slate-200"}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ? cMap[color] ?? "text-slate-800" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function TicketCard({
  ticket, expanded, onToggle, doctorInput, onDoctorInputChange, onAssignDoctor, savingDoctor,
  noteInput, onNoteInputChange, onSaveNote, savingNote, onMarkArrived, markingArrived,
  diagnosisInput, onDiagnosisInputChange, onSaveDiagnosis, savingDiagnosis,
}: {
  ticket: NeuronTicket; expanded: boolean; onToggle: () => void;
  doctorInput: string; onDoctorInputChange: (v: string) => void; onAssignDoctor: () => void; savingDoctor: boolean;
  noteInput: string; onNoteInputChange: (v: string) => void; onSaveNote: () => void; savingNote: boolean;
  onMarkArrived: () => void; markingArrived: boolean;
  diagnosisInput: string; onDiagnosisInputChange: (v: string) => void; onSaveDiagnosis: () => void; savingDiagnosis: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {ticket.patient_name && (
              <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                <User className="w-3.5 h-3.5 text-sky-500" />{ticket.patient_name}
              </span>
            )}
            {ticket.patient_id_number && (
              <span className="text-xs text-slate-400 font-mono">{ticket.patient_id_number}</span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />{ticket.time_slot}
            </span>
            {ticket.room_assigned && (
              <span className="flex items-center gap-1 text-xs text-sky-600 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
                <BedDouble className="w-3 h-3" />{ticket.room_assigned}
              </span>
            )}
            {ticket.arrived && (
              <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">✓ Arrived</span>
            )}
            {ticket.doctor_assigned && (
              <span className="flex items-center gap-1 text-xs text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                <UserCheck className="w-3 h-3" />Dr. {ticket.doctor_assigned}
              </span>
            )}
            {ticket.diagnosis && (
              <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                <FlaskConical className="w-3 h-3" />{ticket.diagnosis}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate max-w-md">{ticket.symptoms}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-full px-2.5 py-1">
            <AlertTriangle className="w-3 h-3" /> RED
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-5 space-y-5">
          {ticket.patient_name && (
            <div className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl p-3">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-sky-500" />
              </div>
              <div className="flex-1">
                <p className="text-slate-800 text-sm font-semibold">{ticket.patient_name}</p>
                {ticket.patient_id_number && <p className="text-slate-400 text-xs font-mono">{ticket.patient_id_number}</p>}
              </div>
              <Shield className="w-4 h-4 text-emerald-500" />
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> Vitals</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <Thermometer className="w-5 h-5 text-sky-500 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Temp</p>
                <p className={`font-semibold text-sm ${ticket.vitals.temp > 38.5 ? "text-red-500" : "text-slate-800"}`}>{ticket.vitals.temp}°C</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Heart Rate</p>
                <p className={`font-semibold text-sm ${ticket.vitals.hr > 110 ? "text-red-500" : "text-slate-800"}`}>{ticket.vitals.hr} bpm</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <Activity className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-slate-400">SpO2</p>
                <p className="text-slate-800 font-semibold text-sm">{ticket.vitals.spo2}%</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Symptoms</p>
            <p className="text-slate-700 text-sm bg-slate-50 border border-slate-100 rounded-xl p-3">{ticket.symptoms}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Ticket ID</p>
              <p className="text-slate-600 font-mono text-xs truncate">{ticket.id}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Created</p>
              <p className="text-slate-600 text-xs">{new Date(ticket.created_at).toLocaleString()}</p>
            </div>
          </div>

          {!ticket.arrived ? (
            <Button variant="outline-violet" className="w-full" onClick={onMarkArrived} disabled={markingArrived}>
              {markingArrived ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Mark as Arrived
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <LogIn className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-700 text-sm font-medium">Patient has arrived</span>
            </div>
          )}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5" /> Clinical Notes</p>
            {ticket.notes && <p className="text-slate-700 text-sm bg-white border border-slate-200 rounded-xl p-3 mb-3">{ticket.notes}</p>}
            <div className="flex gap-2">
              <Textarea value={noteInput} onChange={(e) => onNoteInputChange(e.target.value)} placeholder="Add a clinical note…" rows={2} className="flex-1 focus:ring-sky-400/50" />
              <Button variant="sky" size="icon" onClick={onSaveNote} disabled={savingNote || !noteInput.trim()} className="self-end">
                {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Assign Doctor</p>
            {ticket.doctor_assigned ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-700 font-medium text-sm">Assigned to {ticket.doctor_assigned}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input type="text" value={doctorInput} onChange={(e) => onDoctorInputChange(e.target.value)} placeholder="e.g. Dr. Smith"
                  className="flex-1 focus:ring-emerald-400/50"
                  onKeyDown={(e) => { if (e.key === "Enter") onAssignDoctor(); }} />
                <Button variant="emerald" onClick={onAssignDoctor} disabled={savingDoctor || !doctorInput.trim()}>
                  {savingDoctor ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Assign
                </Button>
              </div>
            )}
          </div>

          {/* DIAGNOSIS (hospital-assigned for RED) */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5 text-blue-500" /> Clinical Diagnosis</p>
            {ticket.diagnosis ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-xl p-3">
                  <FlaskConical className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 font-semibold text-sm">{ticket.diagnosis}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Select value={diagnosisInput} onValueChange={onDiagnosisInputChange}>
                    <SelectTrigger className="flex-1 border-blue-200 focus:ring-blue-400/50"><SelectValue placeholder="— Override diagnosis —" /></SelectTrigger>
                    <SelectContent>{DISEASE_LIST.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="blue" size="icon" onClick={onSaveDiagnosis} disabled={savingDiagnosis || !diagnosisInput}>
                    {savingDiagnosis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select value={diagnosisInput} onValueChange={onDiagnosisInputChange}>
                  <SelectTrigger className="flex-1 border-blue-200 focus:ring-blue-400/50"><SelectValue placeholder="— Select diagnosis —" /></SelectTrigger>
                  <SelectContent>{DISEASE_LIST.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="blue" onClick={onSaveDiagnosis} disabled={savingDiagnosis || !diagnosisInput}>
                  {savingDiagnosis ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Set</>}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
