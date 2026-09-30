"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hospital, Lock, User, Eye, EyeOff, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_CREDENTIALS = [
  { username: "admin", password: "hospital2024" },
  { username: "doctor", password: "neuron123" },
  { username: "nurse", password: "triage2024" },
  { username: "demo", password: "demo" },
];

export default function HospitalLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const valid = DEMO_CREDENTIALS.some(
      (c) => c.username === username.trim().toLowerCase() && c.password === password
    );
    if (valid) {
      sessionStorage.setItem("hospital_auth", "true");
      sessionStorage.setItem("hospital_user", username.trim());
      router.push("/hospital");
    } else {
      setError("Invalid credentials. Try username: demo / password: demo");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-200 mb-4">
            <Hospital className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Hospital Portal</h1>
          <p className="text-slate-500 text-sm">Triage Dashboard — Authorised Personnel Only</p>
        </div>

        {/* Demo notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 text-sm font-semibold mb-0.5">Demo Mode</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              Any valid hospital credentials grant access. For demo: use{" "}
              <span className="font-mono font-bold">demo / demo</span>.
            </p>
          </div>
        </div>

        {/* Login card */}
        <Card className="shadow-sm">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username / Staff ID</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="pl-10 focus:ring-red-400/50 focus:border-red-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="pl-10 pr-11 focus:ring-red-400/50 focus:border-red-300"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="red"
                size="lg"
                disabled={loading || !username || !password}
                className="w-full"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                ) : (
                  <><Lock className="w-4 h-4" /> Sign In</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          Neuron Health System · Authorised Access Only
        </p>
      </div>
    </div>
  );
}
