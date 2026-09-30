import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-3">
            Neuron
          </h1>
          <p className="text-slate-500 text-lg">
            AI-Powered Health Kiosk &amp; Triage System
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/neuron" className="group">
            <Card className="border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <span className="text-2xl">🩺</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Kiosk</h2>
                <p className="text-slate-500 text-sm">
                  Symptom checker &amp; biometric scan simulator
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/hospital/login" className="group">
            <Card className="border-red-200 hover:border-red-400 hover:shadow-md transition-all h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-200">
                  <span className="text-2xl">🏥</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Hospital</h2>
                <p className="text-slate-500 text-sm">
                  Triage dashboard — login required
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-sky-200 h-full">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mx-auto mb-4 border border-sky-200">
                <span className="text-2xl">💊</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Axon Dispensary</h2>
              <p className="text-slate-500 text-sm">
                Scan a GREEN QR code to collect your prescription
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
