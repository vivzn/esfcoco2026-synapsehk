"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { KIOSK_LOCATIONS, DISEASE_LIST, HOSPITAL_LOCATIONS, AXON_DISPENSARY_LOCATIONS } from "@/lib/diseases";
import { supabase, type NeuronTicket } from "@/lib/supabase";
import { MapPin, Activity, X, FlaskConical, AlertTriangle, CheckCircle2, Clock, RefreshCw, Building2 } from "lucide-react";

type KioskStats = {
  kiosk: (typeof KIOSK_LOCATIONS)[0];
  tickets: NeuronTicket[];
  diseases: Record<string, number>;
  total: number;
  redCount: number;
  greenCount: number;
};

type TimeRange = "day" | "week" | "month" | "year" | "all";

const TIME_LABELS: Record<TimeRange, string> = { day: "Today", week: "This Week", month: "This Month", year: "This Year", all: "All Time" };

function getCutoff(range: TimeRange): Date | null {
  const now = new Date();
  if (range === "all") return null;
  if (range === "day") { const d = new Date(now); d.setHours(0,0,0,0); return d; }
  if (range === "week") { const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d; }
  if (range === "month") { const d = new Date(now); d.setDate(1); d.setHours(0,0,0,0); return d; }
  if (range === "year") { const d = new Date(now); d.setMonth(0,1); d.setHours(0,0,0,0); return d; }
  return null;
}

function buildKioskStats(tickets: NeuronTicket[]): KioskStats[] {
  const map = new Map<string, NeuronTicket[]>();
  for (const t of tickets) {
    if (!t.kiosk_location_id) continue;
    const arr = map.get(t.kiosk_location_id) ?? [];
    arr.push(t);
    map.set(t.kiosk_location_id, arr);
  }
  return KIOSK_LOCATIONS.map((kiosk) => {
    const kt = map.get(kiosk.id) ?? [];
    const diseases: Record<string, number> = {};
    for (const t of kt) { if (t.diagnosis) diseases[t.diagnosis] = (diseases[t.diagnosis] ?? 0) + 1; }
    return {
      kiosk, tickets: kt, diseases, total: kt.length,
      redCount: kt.filter((t) => t.triage_level === "RED").length,
      greenCount: kt.filter((t) => t.triage_level === "GREEN").length,
    };
  });
}

function getMarkerColor(s: KioskStats): string {
  return s.redCount > 0 ? "#ef4444" : s.total > 0 ? "#22c55e" : "#94a3b8";
}

const RL: Record<string, string> = { HK: "Hong Kong", SZ: "Shenzhen", MAC: "Macau", GBA: "Greater Bay Area" };

export default function DiseaseMapTab() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lmRef = useRef<any>(null);
  const [sel, setSel] = useState<KioskStats | null>(null);
  const [fDis, setFDis] = useState("");
  const [fReg, setFReg] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [allTickets, setAllTickets] = useState<NeuronTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showHospitals, setShowHospitals] = useState(false);
  const [showDispensaries, setShowDispensaries] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("neuron_tickets")
      .select("*")
      .not("kiosk_location_id", "is", null)
      .order("created_at", { ascending: false });
    if (!error && data) setAllTickets(data as NeuronTicket[]);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Apply time filter
  const cutoff = getCutoff(timeRange);
  const tickets = cutoff
    ? allTickets.filter((t) => new Date(t.created_at) >= cutoff)
    : allTickets;

  const all = buildKioskStats(tickets);
  const filt = all.filter(
    (s) => (fReg ? s.kiosk.region === fReg : true) && (fDis ? !!s.diseases[fDis] : true)
  );

  const gd: Record<string, number> = {};
  for (const s of all) for (const [d, c] of Object.entries(s.diseases)) gd[d] = (gd[d] ?? 0) + c;
  const top = Object.entries(gd).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const totCases = all.reduce((s, k) => s + k.total, 0);
  const totRed = all.reduce((s, k) => s + k.redCount, 0);
  const totGreen = all.reduce((s, k) => s + k.greenCount, 0);
  const actK = all.filter((k) => k.total > 0).length;

  useEffect(() => {
    if (!mapRef.current) return;
    let dead = false;
    async function go() {
      const L = (await import("leaflet")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      if (dead || !mapRef.current) return;
      if (lmRef.current) { lmRef.current.remove(); lmRef.current = null; }
      const map = L.map(mapRef.current, { center: [22.38, 114.1], zoom: 9, scrollWheelZoom: true });
      lmRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "\u00a9 OpenStreetMap contributors", maxZoom: 18 }).addTo(map);
      for (const stats of all) {
        const { lat, lng } = stats.kiosk;
        const color = getMarkerColor(stats);
        if (stats.total > 0) {
          const r = stats.total < 3 ? 35 : stats.total < 7 ? 55 : 80;
          L.circle([lat, lng], { radius: r * 80, color: "transparent", fillColor: color, fillOpacity: 0.09 }).addTo(map);
          L.circle([lat, lng], { radius: r * 40, color: "transparent", fillColor: color, fillOpacity: 0.15 }).addTo(map);
        }
        const ci = L.circle([lat, lng], { radius: 350 + stats.total * 80, color, weight: 2, fillColor: color, fillOpacity: 0.75 }).addTo(map);
        const ic = L.divIcon({
          html: `<div style="background:${color};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${stats.total}</div>`,
          className: "", iconSize: [28, 28], iconAnchor: [14, 14],
        });
        const mk = L.marker([lat, lng], { icon: ic }).addTo(map);
        const topDis = Object.entries(stats.diseases).sort((a,b)=>b[1]-a[1]).slice(0,5);
        const dr = topDis.length > 0
          ? `<div style="font-size:11px;font-weight:600;margin-bottom:4px">Detected:</div>${topDis.map(([d,c])=>`<div style="display:flex;justify-content:space-between;font-size:11px"><span>\u00b7 ${d}</span><span style="font-weight:700;color:#2563eb">${c}</span></div>`).join("")}`
          : `<div style="font-size:11px;color:#94a3b8;font-style:italic">No diagnoses recorded</div>`;
        const ph = `<div style="min-width:190px;font-family:sans-serif"><div style="font-weight:700;font-size:13px;margin-bottom:4px">${stats.kiosk.name}</div><div style="font-size:11px;color:#64748b;margin-bottom:8px">${stats.kiosk.district} \u00b7 ${RL[stats.kiosk.region] ?? stats.kiosk.region}</div><div style="display:flex;gap:8px;margin-bottom:8px"><span style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600">\ud83d\udd34 ${stats.redCount}</span><span style="background:#f0fdf4;color:#16a34a;border:1px solid #86efac;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600">\ud83d\udfe2 ${stats.greenCount}</span></div>${dr}</div>`;
        ci.bindPopup(ph); mk.bindPopup(ph);
        mk.on("click", () => setSel(stats));
        ci.on("click", () => setSel(stats));
      }

      // Hospital markers (optional overlay)
      if (showHospitals) {
        for (const h of HOSPITAL_LOCATIONS) {
          const hospitalIcon = L.divIcon({
            html: `<div style="background:#2563eb;color:white;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">H</div>`,
            className: "", iconSize: [26, 26], iconAnchor: [13, 13],
          });
          const hm = L.marker([h.lat, h.lng], { icon: hospitalIcon }).addTo(map);
          hm.bindPopup(`<div style="font-family:sans-serif;min-width:160px"><div style="font-weight:700;font-size:12px;margin-bottom:2px">${h.name}</div><div style="font-size:11px;color:#2563eb">Hospital</div></div>`);
        }
      }

      // Axon Dispensary markers (optional overlay)
      if (showDispensaries) {
        for (const d of AXON_DISPENSARY_LOCATIONS) {
          const dispensaryIcon = L.divIcon({
            html: `<div style="background:#059669;color:white;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">💊</div>`,
            className: "", iconSize: [26, 26], iconAnchor: [13, 13],
          });
          const dm = L.marker([d.lat, d.lng], { icon: dispensaryIcon }).addTo(map);
          dm.bindPopup(`<div style="font-family:sans-serif;min-width:170px"><div style="font-weight:700;font-size:12px;margin-bottom:2px">${d.name}</div><div style="font-size:11px;color:#059669">Axon Dispensary</div></div>`);
        }
      }
    }
    go();
    return () => { dead = true; if (lmRef.current) { lmRef.current.remove(); lmRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, showHospitals, showDispensaries]);

  function fmtTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-4">
      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border p-3 text-center bg-slate-50 border-slate-100"><p className="text-xs text-slate-500 mb-1">Total</p><p className="text-2xl font-bold text-slate-700">{loading ? "—" : totCases}</p></div>
        <div className="rounded-xl border p-3 text-center bg-red-50 border-red-100"><p className="text-xs text-red-500 mb-1">RED</p><p className="text-2xl font-bold text-red-700">{loading ? "—" : totRed}</p></div>
        <div className="rounded-xl border p-3 text-center bg-emerald-50 border-emerald-100"><p className="text-xs text-emerald-500 mb-1">GREEN</p><p className="text-2xl font-bold text-emerald-700">{loading ? "—" : totGreen}</p></div>
        <div className="rounded-xl border p-3 text-center bg-sky-50 border-sky-100"><p className="text-xs text-sky-500 mb-1">Active Kiosks</p><p className="text-2xl font-bold text-sky-700">{loading ? "—" : `${actK}/${KIOSK_LOCATIONS.length}`}</p></div>
      </div>

      {/* FILTER ROW */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Time range pills */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(Object.keys(TIME_LABELS) as TimeRange[]).map((r) => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === r ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>{TIME_LABELS[r]}</button>
          ))}
        </div>
        <select value={fReg} onChange={(e) => setFReg(e.target.value)} className="rounded-xl border border-slate-200 bg-white text-slate-700 px-3 py-2 text-sm">
          <option value="">All Regions</option><option value="HK">Hong Kong</option><option value="SZ">Shenzhen</option><option value="MAC">Macau</option><option value="GBA">Greater Bay Area</option>
        </select>
        <select value={fDis} onChange={(e) => setFDis(e.target.value)} className="rounded-xl border border-slate-200 bg-white text-slate-700 px-3 py-2 text-sm">
          <option value="">All Diseases</option>{DISEASE_LIST.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {(fReg || fDis) && (
          <button onClick={() => { setFReg(""); setFDis(""); }} className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm cursor-pointer">
            <X className="w-3.5 h-3.5" />Clear
          </button>
        )}
        <button onClick={fetchAll} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading…" : "Refresh"}
        </button>
        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/>Updated {lastRefresh.toLocaleTimeString()}</span>
      </div>

      {/* MAP + SIDE PANELS */}
      <div className="flex gap-4 flex-col lg:flex-row">
        {/* MAP */}
        <div className="flex-1">
          {/* eslint-disable-next-line @next/next/no-css-tags */}
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{height:520}}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Greater Bay Area Disease Heatmap</span>
              <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{TIME_LABELS[timeRange]}</span>
              <span className="ml-auto text-xs text-slate-400 hidden sm:block">Scroll to zoom &middot; Click markers</span>
            </div>
            <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-slate-100 text-xs text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Urgent</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Mild</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block" /> No cases</span>
              <span className="flex items-center gap-3 ml-auto flex-wrap justify-end">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showHospitals}
                    onChange={(e) => setShowHospitals(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600"
                  />
                  <Building2 className="w-3 h-3 text-blue-500" />
                  <span className="text-blue-600 font-medium">Show Hospitals</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showDispensaries}
                    onChange={(e) => setShowDispensaries(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-600"
                  />
                  <span className="text-base leading-none">💊</span>
                  <span className="text-emerald-700 font-medium">Show Axon Dispensaries</span>
                </label>
              </span>
            </div>
            <div ref={mapRef} style={{height:"calc(100% - 85px)",width:"100%"}} />
          </div>
        </div>

        {/* SIDE PANELS */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5 text-blue-500" />Top Detected Diseases</p>
            {loading ? <p className="text-sm text-slate-400 italic">Loading…</p> : top.length === 0
              ? <p className="text-sm text-slate-400 italic">No diagnoses in this period</p>
              : <div className="space-y-2">{top.map(([d, c], i) => (
                  <div key={d} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="flex-1 text-sm text-slate-700 truncate">{d}</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">{c}</span>
                  </div>
                ))}</div>}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />Kiosk Activity{(fReg || fDis) && <span className="text-blue-500 ml-1">(filtered)</span>}</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {filt.sort((a, b) => b.total - a.total).map((s) => (
                <button key={s.kiosk.id} onClick={() => setSel(s)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left cursor-pointer border ${
                    sel?.kiosk.id === s.kiosk.id ? "bg-blue-50 border-blue-200" : "border-transparent hover:bg-slate-50"
                  }`}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:getMarkerColor(s)}} />
                  <span className="flex-1 text-xs text-slate-700 truncate font-medium">{s.kiosk.name}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0">{s.total}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SELECTED KIOSK DETAIL */}
      {sel && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{sel.kiosk.name}</h3>
              <p className="text-sm text-slate-500">{sel.kiosk.district} &middot; {RL[sel.kiosk.region]} &middot; {sel.kiosk.lat.toFixed(4)}&deg;N, {sel.kiosk.lng.toFixed(4)}&deg;E</p>
            </div>
            <button onClick={() => setSel(null)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center"><p className="text-xs text-slate-500 mb-1">Total</p><p className="text-xl font-bold text-slate-800">{sel.total}</p></div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center"><p className="text-xs text-red-500 mb-1">Red</p><p className="text-xl font-bold text-red-600">{sel.redCount}</p></div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center"><p className="text-xs text-emerald-500 mb-1">Green</p><p className="text-xl font-bold text-emerald-600">{sel.greenCount}</p></div>
          </div>
          {Object.keys(sel.diseases).length > 0 ? (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5 text-blue-500" />Diagnosed at This Kiosk</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(sel.diseases).sort((a,b) => b[1]-a[1]).map(([d,c]) => (
                  <div key={d} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <span className="text-xs text-slate-700 truncate flex-1">{d}</span>
                    <span className="text-xs font-bold text-blue-700 ml-2 flex-shrink-0">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center"><p className="text-sm text-slate-400 italic">No diagnoses at this kiosk in this period</p></div>
          )}
          {sel.tickets.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />Recent Cases</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {[...sel.tickets].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 12).map((t) => (
                  <div key={t.id} className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    {t.triage_level === "RED"
                      ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{t.patient_name ?? "Anonymous"}</p>
                      <p className="text-xs text-blue-600 truncate">{t.diagnosis ?? "No diagnosis"}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-2.5 h-2.5" />{fmtTime(t.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
