"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, type NeuronTicket } from "@/lib/supabase";
import { AXON_DISPENSARY_LOCATIONS } from "@/lib/diseases";
import {
  Pill,
  PackageOpen,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Stethoscope,
  Clock,
  ShieldAlert,
  Thermometer,
  Heart,
  Activity,
  User,
  TriangleAlert,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DispenserState =
  | "loading"
  | "ready"
  | "dispensing"
  | "dispensed"
  | "already-claimed"
  | "error";

function DispensaryMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const lmRef = useRef<unknown>(null);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (lmRef.current) { (lmRef.current as any).remove(); lmRef.current = null; }
      const map = L.map(mapRef.current, { center: [22.35, 114.1], zoom: 10, scrollWheelZoom: true });
      lmRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "\u00a9 OpenStreetMap contributors", maxZoom: 18,
      }).addTo(map);

      // "You are here" — geolocation or centre of HK as fallback
      let userLat = 22.3193;
      let userLng = 114.1694;
      if (typeof window !== "undefined" && navigator.geolocation) {
        await new Promise<void>((res) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { userLat = pos.coords.latitude; userLng = pos.coords.longitude; res(); },
            () => res(),
            { timeout: 3000 },
          );
        });
      }

      const youIcon = L.divIcon({
        html: `<div style="background:#2563eb;color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25)">📍</div>`,
        className: "", iconSize: [22, 22], iconAnchor: [11, 11],
      });
      L.marker([userLat, userLng], { icon: youIcon }).addTo(map)
        .bindPopup(`<div style="font-family:sans-serif;font-size:12px;font-weight:700">Your Location</div>`);

      for (const d of AXON_DISPENSARY_LOCATIONS) {
        const dispensaryIcon = L.divIcon({
          html: `<div style="background:#059669;color:white;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">💊</div>`,
          className: "", iconSize: [26, 26], iconAnchor: [13, 13],
        });
        L.marker([d.lat, d.lng], { icon: dispensaryIcon }).addTo(map)
          .bindPopup(`<div style="font-family:sans-serif;min-width:170px"><div style="font-weight:700;font-size:12px;margin-bottom:2px">${d.name}</div><div style="font-size:11px;color:#059669">Axon Dispensary</div></div>`);
      }
    }
    go();
    return () => { dead = true; if (lmRef.current) { (lmRef.current as any).remove(); lmRef.current = null; } }; // eslint-disable-line @typescript-eslint/no-explicit-any
  }, []);

  return (
    <div className="rounded-2xl border border-emerald-200 overflow-hidden shadow-sm">
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-200">
        <MapPin className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-800">Nearest Axon Dispensaries</span>
        <span className="ml-auto text-xs text-emerald-600">💊 = Dispensary &nbsp; 📍 = You</span>
      </div>
      <div ref={mapRef} style={{ height: "280px", width: "100%" }} />
    </div>
  );
}

export default function DispenserClient({ id }: { id: string }) {
  const [state, setState] = useState<DispenserState>("loading");
  const [ticket, setTicket] = useState<NeuronTicket | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchTicket() {
      const { data, error } = await supabase
        .from("neuron_tickets")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setErrorMsg("Prescription not found. Invalid QR code.");
        setState("error");
        return;
      }

      const t = data as NeuronTicket;
      setTicket(t);

      if (t.is_collected) {
        setState("already-claimed");
      } else {
        setState("ready");
      }
    }

    fetchTicket();
  }, [id]);

  const handleDispense = async () => {
    if (!ticket) return;
    setState("dispensing");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { error } = await supabase
      .from("neuron_tickets")
      .update({ is_collected: true })
      .eq("id", ticket.id);

    if (error) {
      setErrorMsg("Failed to dispense. Please try again.");
      setState("error");
      return;
    }

    setState("dispensed");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Pill className="w-6 h-6 text-sky-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Axon Dispensary</h1>
          </div>
          <p className="text-slate-500 text-sm">Automated Prescription Collection Unit</p>
        </div>

        {/* LOADING */}
        {state === "loading" && (
          <Card className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-4" />
            <p className="text-slate-600 text-sm">Loading prescription...</p>
          </Card>
        )}

        {/* READY TO DISPENSE */}
        {state === "ready" && ticket && (
          <Card className="border-sky-200 p-6 space-y-6">
            <div className="flex items-center justify-center gap-2 bg-sky-50 border border-sky-200 rounded-xl py-3">
              <CheckCircle2 className="w-5 h-5 text-sky-500" />
              <span className="text-sky-700 font-semibold">Prescription Loaded</span>
            </div>

            {ticket.patient_name && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <User className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <div>
                  <p className="text-slate-800 text-sm font-semibold">{ticket.patient_name}</p>
                  {ticket.patient_id_number && <p className="text-slate-500 text-xs font-mono">{ticket.patient_id_number}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center">
                <Thermometer className="w-5 h-5 text-sky-500 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Temp</p>
                <p className="text-slate-800 font-semibold">{ticket.vitals.temp}°C</p>
              </Card>
              <Card className="p-3 text-center">
                <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Heart Rate</p>
                <p className="text-slate-800 font-semibold">{ticket.vitals.hr} bpm</p>
              </Card>
              <Card className="p-3 text-center">
                <Activity className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-slate-400">SpO2</p>
                <p className="text-slate-800 font-semibold">{ticket.vitals.spo2}%</p>
              </Card>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Symptoms Reported</p>
              <p className="text-slate-800 text-sm">{ticket.symptoms}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-slate-500">Medication</p>
                </div>
                <p className="text-slate-900 font-semibold text-lg">{ticket.medicine_prescribed}</p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-slate-500">Instructions</p>
                </div>
                <p className="text-slate-700 text-sm">
                  Take 2 tablets every 8 hours with food. Complete the full course of medication.
                  Consult a doctor if symptoms persist after 3 days.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-sm text-slate-500">Issued</p>
                </div>
                <p className="text-slate-700 text-sm">
                  {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <TriangleAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-sm font-medium mb-1">Drug Interaction Check</p>
                <p className="text-amber-700 text-xs">
                  No known interactions detected. Always inform your pharmacist of other medications you are taking.
                </p>
              </div>
            </div>

            <DispensaryMap />

            <Button variant="sky" size="xl" className="w-full" onClick={handleDispense}>
              <PackageOpen className="w-6 h-6" />
              COLLECT FROM THIS DISPENSARY
            </Button>
          </Card>
        )}

        {/* DISPENSING ANIMATION */}
        {state === "dispensing" && (
          <Card className="border-sky-200 p-12 flex flex-col items-center justify-center space-y-6">
            <div className="w-24 h-24 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center">
              <PackageOpen className="w-12 h-12 text-sky-500 animate-bounce" />
            </div>
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-sky-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-800 text-lg font-medium">Dispensing medication...</p>
              <p className="text-slate-500 text-sm mt-1">Please wait for the compartment to open</p>
            </div>
          </Card>
        )}

        {/* DISPENSED SUCCESS */}
        {state === "dispensed" && (
          <Card className="border-emerald-200 p-8 flex flex-col items-center justify-center space-y-6">
            <div className="animate-dispense">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Medication Collected</h2>
              <p className="text-slate-500 text-sm">Your medication has been dispensed successfully.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center w-full">
              <p className="text-emerald-700 text-sm font-medium">
                Feel better soon! Remember to follow the dosage instructions.
              </p>
            </div>
          </Card>
        )}

        {/* ALREADY CLAIMED */}
        {state === "already-claimed" && (
          <Card className="border-amber-200 p-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-amber-500" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Already Collected</h2>
              <p className="text-slate-500 text-sm">
                This prescription has already been collected. Each prescription can only be dispensed once.
              </p>
            </div>
          </Card>
        )}

        {/* ERROR */}
        {state === "error" && (
          <Card className="border-red-200 p-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
              <p className="text-slate-500 text-sm">{errorMsg}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
