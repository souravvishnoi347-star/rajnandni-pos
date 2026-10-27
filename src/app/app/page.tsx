"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Users,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Receipt,
  Coffee,
  CheckCircle2,
  ChevronRight,
  AlertCircle
} from "lucide-react";

const OWNER_PIN = "7898";
const STAFF_PIN = "5555";

export default function MobileAppGateway() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"owner" | "staff" | null>(null);
  const [pin, setPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem("rajnandni_device_role");
      if (savedRole === "owner") {
        window.location.replace("/owner");
        return;
      } else if (savedRole === "staff") {
        window.location.replace("/staff");
        return;
      }
    } catch {
      // ignore
    }
    setCheckingAuth(false);
  }, []);

  const handleSelectRole = (role: "owner" | "staff") => {
    setSelectedRole(role);
    setPin("");
    setErrorMsg("");
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (selectedRole === "owner") {
      if (pin === OWNER_PIN) {
        if (rememberDevice) {
          localStorage.setItem("rajnandni_device_role", "owner");
          localStorage.setItem("rajnandni_owner_device_auth", "true");
        }
        window.location.replace("/owner");
      } else {
        setErrorMsg("Incorrect Owner PIN. (Default: 7898)");
      }
    } else if (selectedRole === "staff") {
      if (pin === STAFF_PIN || pin === OWNER_PIN) {
        if (rememberDevice) {
          localStorage.setItem("rajnandni_device_role", "staff");
          localStorage.setItem("rajnandni_staff_device_auth", "true");
        }
        window.location.replace("/staff");
      } else {
        setErrorMsg("Incorrect Staff PIN. (Default: 5555)");
      }
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-bounce">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <div className="text-slate-800 font-bold text-lg">Rajnandini Boutique</div>
        <div className="text-slate-400 text-sm mt-1 animate-pulse">Launching mobile suite...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="pt-4 pb-2 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 shadow-xl shadow-indigo-950/20 mb-3 border border-amber-400/30">
          <Crown className="w-9 h-9 text-amber-400" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">RAJNANDINI</h1>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mt-0.5">
          Executive Mobile Suite
        </p>
        <p className="text-xs text-slate-500 mt-2 px-4">
          Select device role for this phone to start.
        </p>
      </div>

      {/* Main Choice or PIN Entry */}
      <div className="my-auto py-4 space-y-4">
        {!selectedRole ? (
          <>
            {/* Owner Suite Card */}
            <button
              onClick={() => handleSelectRole("owner")}
              className="w-full text-left bg-white hover:bg-slate-50/80 active:scale-[0.99] border-2 border-indigo-100 hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                  <Crown className="w-6 h-6 text-amber-300" />
                </div>
                <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Owner / Director
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">
                Owner Executive Suite
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Live Sales, Galla Cash in hand, 6,477+ piece inventory stock, Kharcha audit & profit reports.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                <span>Select Owner App</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            {/* Staff Manager Card */}
            <button
              onClick={() => handleSelectRole("staff")}
              className="w-full text-left bg-white hover:bg-slate-50/80 active:scale-[0.99] border-2 border-emerald-100 hover:border-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Floor Head Staff
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-3 group-hover:text-emerald-600 transition-colors">
                Staff Daily Kharcha & Attendance
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                1-tap Chai/Nashta entries, staff advance payouts, and daily showroom staff attendance.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Select Staff App</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          </>
        ) : (
          /* PIN Verification Form */
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                    selectedRole === "owner"
                      ? "bg-indigo-600"
                      : "bg-emerald-600"
                  }`}
                >
                  {selectedRole === "owner" ? (
                    <Crown className="w-5 h-5 text-amber-300" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {selectedRole === "owner" ? "Owner Suite" : "Staff Manager"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Security PIN Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Enter 4-Digit Security PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    autoFocus
                    className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3.5 px-4 rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-slate-400">
                    {selectedRole === "owner" ? "PIN: 7898" : "PIN: 5555"}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Remember this phone toggle */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">
                    Always open directly on this phone
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Next time, this app will open directly without asking again.
                  </p>
                </div>
              </label>

              <button
                type="submit"
                className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                  selectedRole === "owner"
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                }`}
              >
                <span>Launch {selectedRole === "owner" ? "Owner Suite" : "Staff App"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="pt-4 text-center text-slate-400 text-[11px]">
        Rajnandini Boutique POS • Cloud Realtime Connected
      </div>
    </div>
  );
}
