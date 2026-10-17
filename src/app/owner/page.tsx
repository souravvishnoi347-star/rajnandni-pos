"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Unlock,
  ChevronRight,
  Package,
  History,
  TrendingDown,
  ArrowRight,
  Smartphone,
  Info,
  Sliders,
  Search,
} from "lucide-react";
import {
  getCurrentOwnerOtp,
  verifyOwnerOtp,
  OwnerSecurityService,
  InventoryAuthRequest,
  InventoryAuditLog,
  subscribeBroadcast,
  MASTER_OWNER_PIN,
  QUICK_OWNER_PIN,
  OWNER_PHONE_NUMBER,
  OWNER_NAME,
} from "@/lib/ownerSecurity";
import { ProductItem } from "@/types/pos";
import { SupabaseService } from "@/lib/supabaseClient";

export default function OwnerSecurityPortal() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // Live OTP State
  const [otpData, setOtpData] = useState(getCurrentOwnerOtp());
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  // Active View Tab: 'approvals' | 'audit' | 'inventory'
  const [activeTab, setActiveTab] = useState<"approvals" | "audit" | "inventory">("approvals");

  // Requests and Logs
  const [pendingRequests, setPendingRequests] = useState<InventoryAuthRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Search filter for audit log
  const [auditSearch, setAuditSearch] = useState<string>("");

  // Audio ref for notification bell chime
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play subtle high-quality bell alert
  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio not permitted or user hasn't interacted yet
    }
  };

  // Check persisted authentication on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("rajnandni_owner_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Live OTP Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setOtpData(getCurrentOwnerOtp());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [reqs, logs, prods] = await Promise.all([
        OwnerSecurityService.fetchPendingRequests(),
        OwnerSecurityService.fetchAuditLogs(),
        SupabaseService.fetchProducts().catch(() => null),
      ]);
      setPendingRequests(reqs);
      setAuditLogs(logs);

      if (prods && prods.length > 0) {
        setProducts(prods);
      } else {
        try {
          const raw = localStorage.getItem("rajnandni_inventory");
          if (raw) setProducts(JSON.parse(raw));
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.warn("Failed fetching owner data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();

      // Poll every 3 seconds for new staff requests
      const pollTimer = setInterval(async () => {
        const reqs = await OwnerSecurityService.fetchPendingRequests();
        setPendingRequests((prev) => {
          if (reqs.length > prev.length) {
            playAlertSound();
          }
          return reqs;
        });
      }, 3000);

      // Listen to cross-tab broadcast events
      const unsubscribe = subscribeBroadcast((event) => {
        if (event.type === "NEW_REQUEST") {
          playAlertSound();
          refreshData();
        } else if (event.type === "REQUEST_RESOLVED" || event.type === "NEW_AUDIT_LOG") {
          refreshData();
        }
      });

      return () => {
        clearInterval(pollTimer);
        unsubscribe();
      };
    }
  }, [isAuthenticated]);

  // Handle PIN Unlock
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pinInput.trim();
    if (clean === MASTER_OWNER_PIN || clean === QUICK_OWNER_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem("rajnandni_owner_auth", "true");
      setPinError("");
      playAlertSound();
    } else {
      setPinError("Invalid PIN! Please enter the correct Master Owner PIN.");
    }
  };

  // Handle Owner 1-Click Action
  const handleResolve = async (req: InventoryAuthRequest, status: "approved" | "rejected") => {
    setIsProcessingId(req.id);
    try {
      await OwnerSecurityService.resolveRequest(req.id, status, "remote_click");

      if (status === "approved") {
        await OwnerSecurityService.logAuditEntry({
          actionType: req.actionType,
          productId: req.productId,
          productName: req.productName,
          sku: req.sku,
          oldValue: req.oldValue,
          newValue: req.newValue,
          reason: req.reason,
          staffName: req.staffName || "Showroom Staff",
          approvedVia: "remote_click",
        });
      }

      await refreshData();
    } catch (err) {
      console.error("Resolve error:", err);
      alert("Error resolving request");
    } finally {
      setIsProcessingId(null);
    }
  };

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.productName.toLowerCase().includes(q) ||
      log.sku.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q)
    );
  });

  // Calculate percentage of OTP remaining
  const progressPercent = Math.round(
    (otpData.secondsRemaining / otpData.totalSeconds) * 100
  );

  const mins = Math.floor(otpData.secondsRemaining / 60);
  const secs = otpData.secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-50 bg-stone-900/90 backdrop-blur-md border-b border-amber-500/20 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20 font-black">
              <ShieldCheck className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Rajnandini Showroom
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Owner Desk
                </span>
              </div>
              <h1 className="text-sm font-bold text-stone-200">
                Owner Security &amp; Stock Approval Desk
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pos"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition flex items-center gap-1.5"
            >
              <span>POS Billing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {isAuthenticated && (
              <button
                onClick={() => {
                  sessionStorage.removeItem("rajnandni_owner_auth");
                  setIsAuthenticated(false);
                }}
                className="p-1.5 text-stone-400 hover:text-rose-400 transition"
                title="Lock Portal"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* =========================================================================
            PIN VERIFICATION SCREEN (If not unlocked)
            ========================================================================= */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto my-12 bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white font-serif">
                Owner Authentication Required
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                This desk is strictly protected for Store Owner (<strong className="text-amber-300">Indu ji</strong>). Enter Master PIN to access live OTP and stock approval controls.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Enter Master PIN / Quick Key
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError("");
                    }}
                    placeholder="Master PIN (e.g. Indu@123 or 7898)"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-sm"
                  />
                </div>
                {pinError && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-black rounded-xl shadow-lg shadow-amber-500/25 transition cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Owner Desk</span>
              </button>

              <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl p-3 text-center">
                <p className="text-[11px] text-stone-400">
                  📱 Registered Owner Phone: <span className="text-amber-400 font-mono font-bold">{OWNER_PHONE_NUMBER}</span>
                </p>
              </div>
            </form>
          </div>
        ) : (
          /* =========================================================================
              AUTHENTICATED OWNER DASHBOARD
              ========================================================================= */
          <div className="space-y-6">
            {/* Quick Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("approvals")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "approvals"
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Live OTP &amp; Approvals</span>
                {pendingRequests.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("audit")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "audit"
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Stock Audit Trail</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                  {auditLogs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("inventory")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "inventory"
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Showroom Stock Status</span>
              </button>
            </div>

            {/* =====================================================================
                TAB 1: LIVE OTP & REAL-TIME APPROVALS
                ===================================================================== */}
            {activeTab === "approvals" && (
              <div className="space-y-6">
                {/* 1. DYNAMIC OTP DISPLAY CARD */}
                <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                          Live Active OTP
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white">
                        Showroom Inventory Security Code
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5">
                        When showroom staff requests to edit stock or prices, share this 6-digit rolling code:
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block">Refreshes in</span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {timeFormatted} min
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* OTP NUMBER VISUAL */}
                  <div className="my-6 text-center">
                    <div className="inline-block relative">
                      <div className="bg-stone-950 border-2 border-amber-500/60 rounded-2xl px-8 py-5 shadow-inner">
                        <span className="font-mono text-4xl sm:text-5xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 drop-shadow-md">
                          {otpData.formattedOtp}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-2 font-medium">
                        🛡️ Auto-rotates every 5 minutes. No staff stock tampering or theft possible.
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-xs mx-auto mt-4 bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-800">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(otpData.otp);
                        setCopiedOtp(true);
                        setTimeout(() => setCopiedOtp(false), 2000);
                      }}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedOtp ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-stone-400" />
                          <span>Copy 6-Digit OTP</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `*Rajnandini Boutique Owner Security OTP*: ${otpData.otp}\nValid for inventory modification at showroom POS for next ${timeFormatted} minutes.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Share on WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* 2. LIVE PENDING APPROVAL REQUESTS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider">
                        Pending Showroom Modification Requests
                      </h3>
                    </div>
                    <button
                      onClick={refreshData}
                      className="text-xs text-stone-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-8 text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-stone-300">
                        No Pending Requests (All Clear)
                      </h4>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        Whenever showroom staff attempts to adjust stock, edit rates, or delete items, requests will appear here for instant 1-Click Approval.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-stone-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  req.actionType === "stock_change"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : req.actionType === "product_delete"
                                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {req.actionType === "stock_change"
                                  ? "Stock Adjustment"
                                  : req.actionType === "product_delete"
                                  ? "Delete Item Request"
                                  : "Price Modification"}
                              </span>
                              <span className="text-xs text-stone-400 font-mono">
                                SKU: {req.sku}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(req.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10px] text-stone-500 block uppercase font-bold">
                                Product Name
                              </span>
                              <h4 className="text-sm font-bold text-white">
                                {req.productName}
                              </h4>
                            </div>

                            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-stone-400 block">
                                  Current Value
                                </span>
                                <span className="text-xs font-mono font-bold text-stone-300 line-through">
                                  {req.oldValue}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-amber-500" />
                              <div className="text-right">
                                <span className="text-[10px] text-amber-400 block font-bold">
                                  Proposed Value
                                </span>
                                <span className="text-xs font-mono font-black text-emerald-400">
                                  {req.newValue}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Reason Given by Staff */}
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-xs">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
                              Staff Reason for Modification:
                            </span>
                            <p className="text-stone-300 font-medium italic">
                              "{req.reason || "No explicit reason specified"}"
                            </p>
                            <span className="text-[10px] text-stone-500 mt-1 block">
                              Staff: {req.staffName || "Showroom Counter Staff"}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => handleResolve(req, "rejected")}
                              disabled={isProcessingId === req.id}
                              className="px-4 py-2 bg-stone-800 hover:bg-rose-950/40 text-stone-300 hover:text-rose-300 border border-stone-700 hover:border-rose-800/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4 text-rose-400" />
                              <span>Reject</span>
                            </button>

                            <button
                              onClick={() => handleResolve(req, "approved")}
                              disabled={isProcessingId === req.id}
                              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve (1-Click)</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =====================================================================
                TAB 2: INVENTORY AUDIT TRAIL
                ===================================================================== */}
            {activeTab === "audit" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 p-4 rounded-2xl border border-stone-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Permanent Inventory Audit Log</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Complete chronological record of all showroom stock adjustments, price revisions, and deletions:
                    </p>
                  </div>

                  <div className="relative min-w-[240px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Search product, SKU, reason..."
                      className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                {filteredAuditLogs.length === 0 ? (
                  <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-8 text-center text-xs text-stone-500">
                    No audit records found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAuditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 hover:border-stone-700 transition space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                log.actionType === "stock_change"
                                  ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                                  : log.actionType === "product_delete"
                                  ? "bg-red-500/10 text-red-300 border border-red-500/20"
                                  : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              }`}
                            >
                              {log.actionType}
                            </span>
                            <span className="font-bold text-white">{log.productName}</span>
                            <span className="text-stone-500 font-mono text-[11px]">
                              ({log.sku})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                            <span>
                              {new Date(log.timestamp).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 text-[10px]">
                              Via {log.approvedVia}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-stone-800/60">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-stone-400">{log.oldValue}</span>
                            <ArrowRight className="w-3 h-3 text-stone-500" />
                            <span className="text-amber-400 font-bold">{log.newValue}</span>
                          </div>

                          <div className="text-stone-300 italic text-[11px]">
                            Reason: "{log.reason || "Authorized by owner"}"
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                TAB 3: SHOWROOM INVENTORY OVERVIEW
                ===================================================================== */}
            {activeTab === "inventory" && (
              <div className="space-y-4">
                {/* Executive Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Total SKUs
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      {products.length}
                    </span>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Total Showroom Stock
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {products.reduce((acc, p) => acc + (p.stock || 0), 0)} pcs
                    </span>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Total Retail Value
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      ₹
                      {products
                        .reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0)
                        .toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Low Stock Alerts (&lt;3 pcs)
                    </span>
                    <span className="text-2xl font-black text-rose-400 font-mono">
                      {products.filter((p) => !p.isService && p.stock <= 3).length}
                    </span>
                  </div>
                </div>

                <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-2xl text-xs text-stone-400 space-y-1">
                  <p className="font-bold text-stone-300">💡 Owner Security Note:</p>
                  <p>
                    Showroom staff cannot modify inventory stock, change rates, or delete items without your dynamic 6-digit rolling OTP or live 1-Click Approval. Every change is permanently tracked with staff reason in the audit log.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
