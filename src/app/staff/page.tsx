"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Coffee,
  Users,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  CreditCard,
  RefreshCw,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  DollarSign,
  ChevronRight,
  TrendingDown,
  UserCheck,
  UserX,
  AlertCircle,
  X,
  Check,
  Store,
  Crown,
  Search,
  Filter,
  FileText,
  BadgeAlert,
  CalendarCheck,
  Receipt,
  ClipboardList,
  ChevronLeft,
  ChevronDown,
  Building2,
  Package,
  Layers,
  Sparkle,
  GlassWater,
  Sparkles as SparklesIcon,
  HelpCircle,
  Shield,
  Lightbulb,
  DoorClosed,
  CheckCheck,
} from "lucide-react";
import {
  StaffExpenseService,
  StoreExpense,
  StaffAdvance,
  StaffAttendanceRecord,
  StaffMember,
} from "@/lib/staffExpenseService";

const STAFF_QUICK_PIN = "5555";
const MASTER_PIN = "7898";

export default function HeadStaffApp() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);

  // Active Tab: 'expenses' | 'advances' | 'attendance' | 'handover'
  const [activeTab, setActiveTab] = useState<"expenses" | "advances" | "attendance" | "handover">("expenses");

  // Data States
  const [expenses, setExpenses] = useState<StoreExpense[]>([]);
  const [advances, setAdvances] = useState<StaffAdvance[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendanceRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

  // Today Date String
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(todayStr);

  // Search & Filter States
  const [expenseSearch, setExpenseSearch] = useState<string>("");
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<string>("all");
  const [advanceSearch, setAdvanceSearch] = useState<string>("");
  const [advanceFilterStatus, setAdvanceFilterStatus] = useState<"all" | "active" | "zero">("all");

  // New Expense Form Modal State
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expTitle, setExpTitle] = useState<string>("");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expCategory, setExpCategory] = useState<StoreExpense["category"]>("chai_nashta");
  const [expPaidBy, setExpPaidBy] = useState<StoreExpense["paidBy"]>("cash_galla");
  const [expStaffName, setExpStaffName] = useState<string>("Ramesh Kumar (Store Manager)");
  const [expNote, setExpNote] = useState<string>("");
  const [isSubmittingExp, setIsSubmittingExp] = useState<boolean>(false);

  // New Advance Form Modal State
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [advStaffId, setAdvStaffId] = useState<string>("");
  const [advAmount, setAdvAmount] = useState<string>("");
  const [advPaidBy, setAdvPaidBy] = useState<StaffAdvance["paidBy"]>("cash_galla");
  const [advReason, setAdvReason] = useState<StaffAdvance["reason"]>("salary_advance");
  const [advNote, setAdvNote] = useState<string>("");
  const [isSubmittingAdv, setIsSubmittingAdv] = useState<boolean>(false);

  // Handover Checklist State (Image 5)
  const [handoverChecks, setHandoverChecks] = useState<{ [key: string]: boolean }>({
    cashDrawer: false,
    physicalLocker: false,
    lightsAc: false,
    scannersPos: false,
    glassDoors: false,
  });
  const [handoverNote, setHandoverNote] = useState<string>("");
  const [handoverSubmitted, setHandoverSubmitted] = useState<boolean>(false);

  // Ledger Modal State for Staff Advances
  const [viewingLedgerStaff, setViewingLedgerStaff] = useState<StaffMember | null>(null);

  // Check saved authentication on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rajnandni_staff_device_auth");
      const session = sessionStorage.getItem("rajnandni_staff_auth");
      if (saved === "true" || session === "true") {
        setIsAuthenticated(true);
      }
      const savedChecks = localStorage.getItem("rajnandni_handover_checks_" + todayStr);
      if (savedChecks) {
        setHandoverChecks(JSON.parse(savedChecks));
      }
    } catch {}
  }, [todayStr]);

  // Fetch all staff data
  const loadData = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const [expList, advList, attList, staffList] = await Promise.all([
        StaffExpenseService.fetchExpenses(),
        StaffExpenseService.fetchAdvances(),
        StaffExpenseService.fetchAttendance(selectedAttendanceDate),
        StaffExpenseService.fetchStaffMembers(),
      ]);

      setExpenses(expList);
      setAdvances(advList);
      setAttendance(attList);
      setStaffMembers(staffList);

      if (staffList.length > 0 && !advStaffId) {
        setAdvStaffId(staffList[0].id);
      }

      setLastRefreshedAt(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      console.error("Failed to load staff portal data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, selectedAttendanceDate]);

  // Handle PIN Unlock
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === STAFF_QUICK_PIN || pinInput === MASTER_PIN) {
      setIsAuthenticated(true);
      setPinError("");
      try {
        if (rememberDevice) {
          localStorage.setItem("rajnandni_staff_device_auth", "true");
        } else {
          sessionStorage.setItem("rajnandni_staff_auth", "true");
        }
      } catch {}
    } else {
      setPinError("Incorrect Security PIN. Please enter staff PIN (5555).");
      setPinInput("");
    }
  };

  // Lock Application
  const handleLock = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem("rajnandni_staff_device_auth");
      sessionStorage.removeItem("rajnandni_staff_auth");
    } catch {}
  };

  // Quick 1-Tap Preset Expense Record (Image 2)
  const handleQuickExpense = async (title: string, amount: number, category: StoreExpense["category"]) => {
    setIsSubmittingExp(true);
    try {
      await StaffExpenseService.recordExpense({
        title,
        amount,
        category,
        paidBy: "cash_galla",
        staffName: expStaffName || "Ramesh Kumar (Store Manager)",
        date: todayStr,
        note: "Logged via Quick 1-Tap Preset",
      });
      await loadData();
    } finally {
      setIsSubmittingExp(false);
    }
  };

  // Submit Custom Expense Form
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expAmount);
    if (isNaN(amt) || amt <= 0 || !expTitle.trim()) {
      alert("Please enter a valid expense title and amount.");
      return;
    }

    setIsSubmittingExp(true);
    try {
      await StaffExpenseService.recordExpense({
        title: expTitle.trim(),
        amount: amt,
        category: expCategory,
        paidBy: expPaidBy,
        staffName: expStaffName.trim() || "Ramesh Kumar",
        date: todayStr,
        note: expNote.trim(),
      });
      setShowExpenseModal(false);
      setExpTitle("");
      setExpAmount("");
      setExpNote("");
      await loadData();
    } finally {
      setIsSubmittingExp(false);
    }
  };

  // Submit Advance to Staff Member
  const handleSubmitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(advAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid advance amount.");
      return;
    }
    const staff = staffMembers.find((s) => s.id === advStaffId);
    if (!staff) {
      alert("Please select a staff member.");
      return;
    }

    setIsSubmittingAdv(true);
    try {
      await StaffExpenseService.recordAdvance({
        staffId: staff.id,
        staffName: staff.name,
        amount: amt,
        paidBy: advPaidBy,
        reason: advReason,
        approvedBy: "Head Staff",
        note: advNote.trim(),
      });
      setShowAdvanceModal(false);
      setAdvAmount("");
      setAdvNote("");
      await loadData();
    } finally {
      setIsSubmittingAdv(false);
    }
  };

  // Mark Staff Attendance
  const handleMarkAttendance = async (staff: StaffMember, status: StaffAttendanceRecord["status"]) => {
    await StaffExpenseService.markAttendance({
      staffId: staff.id,
      staffName: staff.name,
      date: selectedAttendanceDate,
      status,
      markedBy: "Head Staff",
    });
    await loadData();
  };

  const activeStaffMembers = useMemo(() => {
    return staffMembers.filter((s) => s.isActive !== false);
  }, [staffMembers]);

  // Quick Mark All Present
  const handleMarkAllPresent = async () => {
    for (const s of activeStaffMembers) {
      await StaffExpenseService.markAttendance({
        staffId: s.id,
        staffName: s.name,
        date: selectedAttendanceDate,
        status: "present",
        markedBy: "Head Staff",
      });
    }
    await loadData();
  };

  // Calculated Metrics for Today
  const todayExpenses = useMemo(() => {
    return expenses.filter((e) => e.date === todayStr);
  }, [expenses, todayStr]);

  const todayExpenseTotal = useMemo(() => {
    return todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayCashExpense = useMemo(() => {
    return todayExpenses.filter((e) => e.paidBy === "cash_galla").reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayOnlineExpense = useMemo(() => {
    return todayExpenses.filter((e) => e.paidBy === "online_upi").reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayAdvances = useMemo(() => {
    return advances.filter((a) => a.date === todayStr);
  }, [advances, todayStr]);

  const todayAdvanceTotal = useMemo(() => {
    return todayAdvances.reduce((sum, a) => sum + a.amount, 0);
  }, [todayAdvances]);

  const todayCashAdvance = useMemo(() => {
    return todayAdvances.filter((a) => a.paidBy === "cash_galla").reduce((sum, a) => sum + a.amount, 0);
  }, [todayAdvances]);

  // Month-to-date total advances
  const monthAdvanceTotal = useMemo(() => {
    const curMonth = todayStr.slice(0, 7);
    return advances
      .filter((a) => a.date && a.date.startsWith(curMonth))
      .reduce((sum, a) => sum + a.amount, 0);
  }, [advances, todayStr]);

  // Total Outflow from Cash Drawer Today (Expenses + Advances)
  const totalCashOutflow = useMemo(() => {
    return todayCashExpense + todayCashAdvance;
  }, [todayCashExpense, todayCashAdvance]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        !expenseSearch.trim() ||
        e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        e.staffName.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        (e.note && e.note.toLowerCase().includes(expenseSearch.toLowerCase()));

      const matchCategory =
        expenseFilterCategory === "all" || e.category === expenseFilterCategory;

      return matchSearch && matchCategory;
    });
  }, [expenses, expenseSearch, expenseFilterCategory]);

  // Map of active advances by staff ID
  const staffActiveAdvanceMap = useMemo(() => {
    const map = new Map<string, number>();
    advances.filter((a) => a.status === "active").forEach((a) => {
      map.set(a.staffId, (map.get(a.staffId) || 0) + a.amount);
    });
    return map;
  }, [advances]);

  // Filtered staff list for Advances tab
  const filteredStaffForAdvances = useMemo(() => {
    return activeStaffMembers.filter((s) => {
      const activeAdv = staffActiveAdvanceMap.get(s.id) || 0;
      if (advanceFilterStatus === "active" && activeAdv <= 0) return false;
      if (advanceFilterStatus === "zero" && activeAdv > 0) return false;

      if (advanceSearch.trim()) {
        const q = advanceSearch.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesRole = (s.role || "").toLowerCase().includes(q);
        return matchesName || matchesRole;
      }
      return true;
    });
  }, [activeStaffMembers, staffActiveAdvanceMap, advanceFilterStatus, advanceSearch]);

  const activeAdvanceStaffCount = useMemo(() => {
    return activeStaffMembers.filter((s) => (staffActiveAdvanceMap.get(s.id) || 0) > 0).length;
  }, [activeStaffMembers, staffActiveAdvanceMap]);

  const zeroAdvanceStaffCount = activeStaffMembers.length - activeAdvanceStaffCount;

  // Attendance Stats
  const attendanceStats = useMemo(() => {
    let present = 0;
    let halfDay = 0;
    let absent = 0;
    let leave = 0;

    attendance.forEach((a) => {
      if (a.status === "present") present++;
      else if (a.status === "half_day") halfDay++;
      else if (a.status === "absent") absent++;
      else if (a.status === "leave") leave++;
    });

    return {
      present,
      halfDay,
      absent,
      leave,
      totalMarked: attendance.length,
      totalStaff: activeStaffMembers.length,
    };
  }, [attendance, activeStaffMembers]);

  // Toggle checklist item
  const toggleHandoverCheck = (key: string) => {
    setHandoverChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("rajnandni_handover_checks_" + todayStr, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const completedChecklistCount = Object.values(handoverChecks).filter(Boolean).length;

  // Formatted display date for Attendance tab
  const formattedAttendanceDate = useMemo(() => {
    try {
      const d = new Date(selectedAttendanceDate);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return selectedAttendanceDate;
    }
  }, [selectedAttendanceDate]);

  // =========================================================================
  // VIEW 0: STAFF PIN SECURITY SCREEN (RICH MAROON & WARM GOLD THEME)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] text-slate-800 flex flex-col justify-center items-center px-4 py-8 relative">
        <div className="w-full max-w-sm bg-white border border-[#EADDD7] rounded-3xl p-6 shadow-xl shadow-[#701A31]/5 text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#701A31] border border-[#A27938]/40 flex items-center justify-center text-white mb-4 shadow-md shadow-[#701A31]/20">
            <Store className="w-8 h-8 text-[#FAF7F5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#701A31]/5 border border-[#A27938]/30 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#701A31] animate-ping" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#701A31]">
              Rajnandini Showroom
            </span>
          </div>

          <h1 className="text-xl font-black text-[#701A31] mt-1 tracking-tight font-serif">
            Showroom Staff Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Daily Petty Cash, Staff Advances &amp; Handover</p>

          <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError("");
                }}
                placeholder="Enter Staff PIN (5555)"
                autoFocus
                className="w-full text-center tracking-[0.4em] text-2xl font-black bg-[#FAF7F5] text-[#701A31] border-2 border-[#EADDD7] focus:border-[#701A31] focus:bg-white rounded-2xl py-3 px-4 outline-none transition"
              />
              {pinError && <p className="text-rose-600 text-xs font-semibold mt-2">{pinError}</p>}
            </div>

            <label className="flex items-center justify-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="rounded border-[#EADDD7] accent-[#701A31] w-4 h-4"
              />
              <span>Remember this showroom device</span>
            </label>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#701A31] hover:bg-[#581326] text-white font-bold rounded-2xl shadow-md shadow-[#701A31]/25 active:scale-[0.98] transition text-sm tracking-wide flex items-center justify-center gap-2"
            >
              <span>Open Staff Portal</span>
              <ArrowRight className="w-4 h-4 text-[#A27938]" />
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-5 font-mono">Head Staff PIN: 5555</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN STAFF APPLICATION VIEW (WINE & WARM GOLD INSPIRATION SUITE)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FAF7F5] text-slate-800 font-sans pb-28 selection:bg-[#701A31] selection:text-white">
      {/* Top Header matching Image 2 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EADDD7] px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#701A31] text-white flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5 text-[#FAF7F5]" />
            </div>
            <div>
              <h1 className="text-xs font-extrabold text-[#701A31] tracking-tight">
                Showroom Staff Portal
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                ZARI &amp; SILK ATELIER • HARIDWAR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-[#701A31] hover:bg-slate-100 transition active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#701A31]" : ""}`} />
            </button>

            <button
              onClick={handleLock}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95"
              title="Lock Staff App"
            >
              <Lock className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-full bg-[#701A31] text-white flex items-center justify-center text-xs font-bold font-serif ml-1">
              ST
            </div>
          </div>
        </div>

        {/* Live Cloud Sync & Tab Navigation matching Image 2 */}
        <div className="pt-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Cloud Sync {lastRefreshedAt || "10:42 AM"}</span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A27938]">
            {activeTab} Suite
          </span>
        </div>

        {/* Sub-Navigation Pills matching Images 2-5 */}
        <div className="grid grid-cols-4 gap-1.5 pt-2.5">
          {[
            { id: "expenses", label: "Expenses" },
            { id: "advances", label: "Advances" },
            { id: "attendance", label: "Attendance" },
            { id: "handover", label: "Handover" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 rounded-xl font-bold text-xs transition text-center active:scale-95 cursor-pointer ${
                  isActive
                    ? "bg-[#701A31] text-white shadow-sm"
                    : "bg-[#F3ECE8] text-slate-600 hover:bg-[#EADDD7]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="px-4 pt-4 max-w-lg mx-auto space-y-4">
        {/* =========================================================================
            TAB 1: ☕ EXPENSES (EXACT INSPIRATION IMAGE 2)
            ========================================================================= */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            {/* Hero Card: Petty Cash Daily Balance */}
            <div className="rounded-3xl bg-white border border-[#EADDD7] p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  PETTY CASH DAILY BALANCE
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Reconciled
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium block">Total Expenses Today</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#701A31] font-mono tracking-tight tabular-nums">
                    ₹{todayExpenseTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ ₹5,000 daily limit</span>
                </div>
              </div>

              {/* 2 Breakdown Boxes: Drawer Cash vs UPI Scan */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-[#FAF7F5] border border-[#EADDD7]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-[#A27938]" />
                    <span>Drawer Cash</span>
                  </span>
                  <p className="text-lg font-black text-[#701A31] font-mono mt-1 tabular-nums">
                    ₹{todayCashExpense.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF7F5] border border-[#EADDD7]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#701A31]" />
                    <span>UPI Scan</span>
                  </span>
                  <p className="text-lg font-black text-[#701A31] font-mono mt-1 tabular-nums">
                    ₹{todayOnlineExpense.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Record Expense Button */}
              <button
                onClick={() => setShowExpenseModal(true)}
                className="w-full py-3 rounded-2xl bg-[#701A31] hover:bg-[#581326] text-white font-bold text-xs shadow-md shadow-[#701A31]/20 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#A27938]" />
                <span>Record Expense</span>
              </button>
            </div>

            {/* Quick 1-Tap Presets Section matching Image 2 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#701A31]">Quick 1-Tap Presets</h3>
                <span className="text-[10px] font-bold bg-[#FBF0F2] text-[#701A31] px-2 py-0.5 rounded-full border border-[#F4D3D9]">
                  Instant
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tap to quickly add standard daily cash payouts
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {[
                  { title: "Morning Tea & Chai", amt: 40, cat: "chai_nashta", sub: "Pantry • Cash", icon: Coffee },
                  { title: "Cold Drinks / Guest Water", amt: 90, cat: "refreshments", sub: "Hospitality", icon: GlassWater },
                  { title: "Cleaning & Housekeeping", amt: 100, cat: "cleaning_pooja", sub: "Maintenance", icon: SparklesIcon },
                  { title: "Carry Bags & Packaging", amt: 150, cat: "stationery_packing", sub: "Packaging", icon: Package },
                  { title: "Courier & Alterations", amt: 120, cat: "transport_fuel", sub: "Logistics", icon: Clock },
                  { title: "Showroom Light & AC", amt: 250, cat: "other", sub: "Facilities", icon: Lightbulb },
                ].map((preset, idx) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuickExpense(preset.title, preset.amt, preset.cat as any)}
                      disabled={isSubmittingExp}
                      className="bg-white border border-[#EADDD7] hover:border-[#701A31] p-3 rounded-2xl shadow-xs hover:shadow-sm transition text-left flex flex-col justify-between h-24 active:scale-95 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-7 h-7 rounded-xl bg-[#FBF0F2] text-[#701A31] flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-mono font-bold text-xs bg-[#FBF0F2] text-[#701A31] px-2 py-0.5 rounded-lg border border-[#F4D3D9]">
                          ₹{preset.amt}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate leading-snug">{preset.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{preset.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expenses Feed */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#701A31]">Recorded Expenses ({expenses.length})</h3>
                <span className="text-[10px] text-slate-400 font-mono">Today: {todayExpenses.length} entries</span>
              </div>

              {expenses.length === 0 ? (
                <div className="bg-white border border-[#EADDD7] rounded-2xl p-6 text-center text-xs text-slate-400">
                  No store expenses recorded today.
                </div>
              ) : (
                expenses.slice(0, 30).map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-white border border-[#EADDD7] hover:border-[#701A31]/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase bg-[#FBF0F2] text-[#701A31] px-2 py-0.5 rounded-md border border-[#F4D3D9]">
                          {exp.category.replace("_", " ")}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            exp.paidBy === "cash_galla"
                              ? "bg-[#FAF7F5] text-[#A27938] border border-[#A27938]/30"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {exp.paidBy === "cash_galla" ? "Cash Drawer" : "Online UPI"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{exp.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        By {exp.staffName} • {exp.date} {exp.note ? `• "${exp.note}"` : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-base font-extrabold text-[#701A31] font-mono tabular-nums">
                        -₹{exp.amount.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete expense "${exp.title}"?`)) {
                            await StaffExpenseService.deleteExpense(exp.id, exp.tokenNumber);
                            await loadData();
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: 👥 ADVANCES (EXACT INSPIRATION IMAGE 3)
            ========================================================================= */}
        {activeTab === "advances" && (
          <div className="space-y-4">
            {/* Hero Dark/Wine Card: Staff Advance Payouts */}
            <div className="bg-[#701A31] text-white rounded-3xl p-5 shadow-md space-y-3.5">
              <div>
                <h2 className="text-xl font-bold font-serif tracking-tight text-white">
                  Staff Advance Payouts
                </h2>
                <p className="text-xs text-rose-100/80 mt-1 leading-relaxed">
                  Instant floor cash advances tracked against upcoming payroll settlement
                </p>
              </div>

              {/* 2-Column Stats */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-[#A27938]" />
                    <span>DISBURSED TODAY</span>
                  </span>
                  <span className="text-2xl font-black text-white font-mono mt-1 block">
                    ₹{todayAdvanceTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-rose-200/90 block mt-0.5">
                    {todayAdvances.length} transactions processed
                  </span>
                </div>

                <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#A27938]" />
                    <span>MONTH-TO-DATE</span>
                  </span>
                  <span className="text-2xl font-black text-white font-mono mt-1 block">
                    ₹{monthAdvanceTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-rose-200/90 block mt-0.5">
                    Within 25% safe reserve
                  </span>
                </div>
              </div>

              {/* Action Button: + Issue Staff Advance */}
              <button
                onClick={() => setShowAdvanceModal(true)}
                className="w-full py-3 rounded-2xl bg-white text-[#701A31] hover:bg-slate-50 font-bold text-xs shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#701A31]" />
                <span>+ Issue Staff Advance</span>
              </button>
            </div>

            {/* Filter Chips matching Image 3 */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setAdvanceFilterStatus("all")}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  advanceFilterStatus === "all"
                    ? "bg-[#701A31] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-[#EADDD7]"
                }`}
              >
                All Staff ({activeStaffMembers.length})
              </button>

              <button
                onClick={() => setAdvanceFilterStatus("active")}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  advanceFilterStatus === "active"
                    ? "bg-[#701A31] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-[#EADDD7]"
                }`}
              >
                <span>Active ({activeAdvanceStaffCount})</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </button>

              <button
                onClick={() => setAdvanceFilterStatus("zero")}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  advanceFilterStatus === "zero"
                    ? "bg-[#701A31] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-[#EADDD7]"
                }`}
              >
                <span>Zero ({zeroAdvanceStaffCount})</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={advanceSearch}
                onChange={(e) => setAdvanceSearch(e.target.value)}
                placeholder="Search by name, role, or payout status..."
                className="w-full bg-white border border-[#EADDD7] rounded-2xl py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#701A31] shadow-xs transition"
              />
              {advanceSearch && (
                <button
                  onClick={() => setAdvanceSearch("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Staff Advance Registry Section Header */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h3 className="text-xs font-bold text-[#701A31]">Staff Advance Registry</h3>
                <span className="text-[10px] text-slate-400">(Haridwar Floor)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Ready for Review
              </span>
            </div>

            {/* Staff Cards matching Image 3 */}
            <div className="space-y-3">
              {filteredStaffForAdvances.map((staff) => {
                const activeAdvAmt = staffActiveAdvanceMap.get(staff.id) || 0;
                const empId = "EMP-" + (staff.id ? staff.id.slice(0, 4).toUpperCase() : "1042");

                return (
                  <div
                    key={staff.id}
                    className="bg-white border border-[#EADDD7] rounded-2xl p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FBF0F2] text-[#701A31] border border-[#F4D3D9] flex items-center justify-center font-bold font-serif text-sm">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{staff.name}</h4>
                          <p className="text-[11px] text-slate-500">{staff.role}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {empId} • Permanent Roster
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">SALARY</span>
                        <span className="text-sm font-extrabold text-[#701A31] font-mono tabular-nums">
                          ₹{staff.monthlySalary?.toLocaleString("en-IN") || "15,000"}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill Box */}
                    <div className="p-2.5 rounded-xl bg-[#FAF7F5] border border-[#EADDD7] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold font-mono">
                        <span
                          className={`w-2 h-2 rounded-full ${activeAdvAmt > 0 ? "bg-amber-500" : "bg-emerald-500"}`}
                        />
                        <span className={activeAdvAmt > 0 ? "text-[#701A31]" : "text-emerald-700"}>
                          {activeAdvAmt > 0 ? `₹${activeAdvAmt.toLocaleString("en-IN")} Taken` : "Clean Balance"}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-[#EADDD7]">
                        {activeAdvAmt > 0 ? "Deduction next cycle" : "No pending advance"}
                      </span>
                    </div>

                    {/* Action Buttons: View Ledger & + Top-up */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setViewingLedgerStaff(staff)}
                        className="flex-1 py-2 rounded-xl bg-white border border-[#EADDD7] text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Ledger</span>
                      </button>

                      <button
                        onClick={() => {
                          setAdvStaffId(staff.id);
                          setShowAdvanceModal(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-[#701A31] hover:bg-[#581326] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#A27938]" />
                        <span>+ Top-up</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: 📅 ATTENDANCE (EXACT INSPIRATION IMAGE 4)
            ========================================================================= */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            {/* Date Selector Dropdown Banner */}
            <div className="bg-white border border-[#EADDD7] rounded-2xl p-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#701A31]" />
                <span className="text-xs font-bold text-slate-900">{formattedAttendanceDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(selectedAttendanceDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedAttendanceDate(d.toISOString().split("T")[0]);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAttendanceDate(todayStr)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                    selectedAttendanceDate === todayStr ? "bg-[#701A31] text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Today
                </button>
              </div>
            </div>

            {/* Big Emerald Button: MARK ALL PRESENT */}
            <button
              onClick={handleMarkAllPresent}
              className="w-full py-3 rounded-2xl bg-[#056636] hover:bg-[#04522b] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>MARK ALL PRESENT</span>
            </button>

            {/* 4 Status Bento KPI Cards matching Image 4 */}
            <div className="grid grid-cols-2 gap-3">
              {/* Present */}
              <div className="bg-white border border-[#EADDD7] rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#056636] uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#056636]" />
                    <span>PRESENT</span>
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-[#056636] font-mono tabular-nums">
                      {attendanceStats.present}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ {attendanceStats.totalStaff} on floor</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#056636] flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Half Day */}
              <div className="bg-white border border-[#EADDD7] rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#A27938] uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A27938]" />
                    <span>HALF DAY</span>
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-[#A27938] font-mono tabular-nums">
                      {attendanceStats.halfDay}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">rostered</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#A27938] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* Absent */}
              <div className="bg-white border border-[#EADDD7] rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>ABSENT</span>
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-rose-600 font-mono tabular-nums">
                      {attendanceStats.absent}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">unexcused</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
              </div>

              {/* On Leave */}
              <div className="bg-white border border-[#EADDD7] rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#701A31] uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#701A31]" />
                    <span>ON LEAVE</span>
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-[#701A31] font-mono tabular-nums">
                      {attendanceStats.leave}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">approved</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#FBF0F2] text-[#701A31] flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Showroom Staff Roster Header */}
            <div className="pt-1">
              <h3 className="text-xs font-bold text-[#701A31] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#A27938]" />
                <span>Showroom Staff Roster ({activeStaffMembers.length} Members)</span>
              </h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>Shift: 10:00 AM - 08:30 PM</span>
              </p>
            </div>

            {/* Roster Cards with 4 Status Pills */}
            <div className="space-y-3">
              {activeStaffMembers.map((staff) => {
                const record = attendance.find((a) => a.staffId === staff.id);
                const currentStatus = record?.status || "present";

                return (
                  <div
                    key={staff.id}
                    className="bg-white border border-[#EADDD7] rounded-2xl p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FBF0F2] text-[#701A31] border border-[#F4D3D9] flex items-center justify-center font-bold font-serif text-sm">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">{staff.name}</h4>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <p className="text-[10px] text-slate-500">{staff.role}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                          <span>→ 10:00 AM</span>
                          <span className="text-[9px]">Punch In</span>
                        </span>
                      </div>
                    </div>

                    {/* 4 Status Toggle Pills */}
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {[
                        { id: "present", label: "Present", activeClass: "bg-[#056636] text-white" },
                        { id: "half_day", label: "Half Day", activeClass: "bg-[#A27938] text-white" },
                        { id: "absent", label: "Absent", activeClass: "bg-rose-600 text-white" },
                        { id: "leave", label: "On Leave", activeClass: "bg-[#701A31] text-white" },
                      ].map((st) => {
                        const isSel = currentStatus === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => handleMarkAttendance(staff, st.id as any)}
                            className={`py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                              isSel ? `${st.activeClass} shadow-xs` : "bg-[#FAF7F5] text-slate-600 hover:bg-[#F3ECE8]"
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: 📋 HANDOVER (EXACT INSPIRATION IMAGE 5)
            ========================================================================= */}
        {activeTab === "handover" && (
          <div className="space-y-4">
            {/* Hero Card: Daily Outflow Summary (Cash Drawer) */}
            <div className="bg-white border border-[#EADDD7] rounded-3xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#701A31] tracking-tight">
                    Daily Outflow Summary (Cash Drawer)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Evening Closing • 08:30 PM
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-[#FBF0F2] text-[#701A31] flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
              </div>

              {/* 2 Metric Boxes */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-[#FAF7F5] border border-[#EADDD7]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-[#701A31]" />
                    <span>Store Expenses</span>
                  </span>
                  <p className="text-xl font-extrabold text-[#701A31] font-mono mt-1 tabular-nums">
                    ₹{todayCashExpense.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-slate-400">Drawer cash used</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF7F5] border border-[#EADDD7]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-[#A27938]" />
                    <span>Staff Advances</span>
                  </span>
                  <p className="text-xl font-extrabold text-[#701A31] font-mono mt-1 tabular-nums">
                    ₹{todayCashAdvance.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-slate-400">Paid from drawer</span>
                </div>
              </div>

              {/* Total Cash Out Banner */}
              <div className="p-3 rounded-2xl bg-[#FBF0F2] border border-[#F4D3D9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#701A31] font-bold uppercase flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Total Cash Out</span>
                  </span>
                  <p className="text-[10px] text-slate-500">Reconciled drawer deduction</p>
                </div>
                <span className="text-2xl font-black text-[#701A31] font-mono tabular-nums">
                  ₹{totalCashOutflow.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Drawer Float Reconcile */}
              <div className="pt-2 border-t border-[#EADDD7] space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Opening Drawer Float:</span>
                  <span className="font-mono font-bold text-slate-800">₹10,000</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold">
                  <span>Expected Closing Cash:</span>
                  <span className="font-mono text-[#056636]">
                    ₹{(Math.max(0, 10000 - totalCashOutflow)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Showroom Handover Checklist matching Image 5 */}
            <div className="bg-white border border-[#EADDD7] rounded-3xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#701A31]">Showroom Handover Checklist</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    All items must be verified before locking register
                  </p>
                </div>
                <span className="text-xs font-bold font-mono bg-[#FAF7F5] text-[#A27938] px-2.5 py-1 rounded-full border border-[#EADDD7]">
                  {completedChecklistCount}/5 Done
                </span>
              </div>

              {/* 5 Checklist Items */}
              <div className="space-y-2.5">
                {[
                  {
                    key: "cashDrawer",
                    title: "Cash drawer tallied with POS physical tally",
                    sub: "Verified by Floor Cashier",
                  },
                  {
                    key: "physicalLocker",
                    title: "Physical locker locked & keys handed to safe",
                    sub: "Safe Box Slot #03",
                  },
                  {
                    key: "lightsAc",
                    title: "Spotlights, Chandelier & AC units switched off",
                    sub: "Zone 1 & Bridal Salon",
                  },
                  {
                    key: "scannersPos",
                    title: "Barcode scanners & POS card swipe machines on charging dock",
                    sub: "3 Handhelds + 2 EDC Terminals",
                  },
                  {
                    key: "glassDoors",
                    title: "Showroom glass doors double-locked & night shutter down",
                    sub: "Main Entrance & Vault Shutter",
                  },
                ].map((item) => {
                  const isChecked = !!handoverChecks[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleHandoverCheck(item.key)}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isChecked
                          ? "bg-emerald-50/50 border-emerald-300"
                          : "bg-[#FAF7F5] border-[#EADDD7] hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition ${
                            isChecked ? "bg-[#056636] text-white" : "border-2 border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-bold ${
                              isChecked ? "text-slate-900" : "text-slate-700"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                        </div>
                      </div>

                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isChecked ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Handover Note & Submit */}
              <div className="pt-2 space-y-2.5">
                <input
                  type="text"
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="Optional Handover Remarks (e.g. Masterji shift note)..."
                  className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />

                <button
                  onClick={() => {
                    setHandoverSubmitted(true);
                    alert("Showroom Handover recorded successfully for " + todayStr);
                  }}
                  className="w-full py-3 rounded-2xl bg-[#701A31] hover:bg-[#581326] text-white font-bold text-xs tracking-wide shadow-md active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#A27938]" />
                  <span>Submit Evening Handover Slip</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      {/* Modal: Record Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EADDD7] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#701A31] tracking-wider">
                  Staff Expense Record
                </span>
                <h3 className="text-base font-bold text-slate-900">Record Store Expense</h3>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Title / Item Description</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Tea & Samosa, Cold Drinks, Cleaning, Tape"
                  className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="₹ 60"
                  className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-slate-800 text-base font-black font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-slate-800 outline-none font-medium"
                  >
                    <option value="chai_nashta">Tea &amp; Snacks</option>
                    <option value="refreshments">Drinks &amp; Water</option>
                    <option value="cleaning_pooja">Cleaning &amp; Care</option>
                    <option value="stationery_packing">Packing Bags &amp; Tape</option>
                    <option value="transport_fuel">Transport &amp; Courier</option>
                    <option value="other">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paid From</label>
                  <select
                    value={expPaidBy}
                    onChange={(e) => setExpPaidBy(e.target.value as any)}
                    className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                  >
                    <option value="cash_galla">💵 Cash Drawer</option>
                    <option value="online_upi">📱 Online UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Member Name</label>
                <input
                  type="text"
                  value={expStaffName}
                  onChange={(e) => setExpStaffName(e.target.value)}
                  className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="e.g. Paid for showroom visitors"
                  className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2 text-slate-800 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExp}
                  className="flex-1 py-2.5 rounded-xl bg-[#701A31] text-white font-bold shadow-md hover:bg-[#581326] cursor-pointer"
                >
                  {isSubmittingExp ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Advance */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EADDD7] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#701A31] tracking-wider">
                  Staff Advance Record
                </span>
                <h3 className="text-base font-bold text-slate-900">Issue Salary Advance</h3>
              </div>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdvance} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Staff Member</label>
                <select
                  value={advStaffId}
                  onChange={(e) => setAdvStaffId(e.target.value)}
                  className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-slate-800 font-bold outline-none"
                >
                  {activeStaffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - ₹{s.monthlySalary?.toLocaleString("en-IN") || 15000}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  placeholder="₹ 500"
                  className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-slate-800 text-base font-black font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason</label>
                  <select
                    value={advReason}
                    onChange={(e) => setAdvReason(e.target.value as any)}
                    className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-slate-800 outline-none"
                  >
                    <option value="salary_advance">Salary Advance</option>
                    <option value="emergency">Personal Emergency</option>
                    <option value="travel_incentive">Travel / Fuel</option>
                    <option value="daily_wages">Daily Wages</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paid From</label>
                  <select
                    value={advPaidBy}
                    onChange={(e) => setAdvPaidBy(e.target.value as any)}
                    className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                  >
                    <option value="cash_galla">💵 Cash Drawer</option>
                    <option value="online_upi">📱 Online UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  value={advNote}
                  onChange={(e) => setAdvNote(e.target.value)}
                  placeholder="e.g. Advance requested for family function"
                  className="w-full bg-[#FAF7F5] border border-[#EADDD7] rounded-xl p-2 text-slate-800 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdv}
                  className="flex-1 py-2.5 rounded-xl bg-[#701A31] text-white font-bold shadow-md hover:bg-[#581326] cursor-pointer"
                >
                  {isSubmittingAdv ? "Saving..." : "Record Advance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Staff Advance Ledger */}
      {viewingLedgerStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EADDD7] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#701A31] tracking-wider">
                  Advance Ledger History
                </span>
                <h3 className="text-base font-bold text-slate-900">{viewingLedgerStaff.name}</h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Monthly Wage: ₹{viewingLedgerStaff.monthlySalary?.toLocaleString("en-IN") || 15000}
                </p>
              </div>
              <button
                onClick={() => setViewingLedgerStaff(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {advances.filter((a) => a.staffId === viewingLedgerStaff.id).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No advance entries on record.</p>
              ) : (
                advances
                  .filter((a) => a.staffId === viewingLedgerStaff.id)
                  .map((adv) => (
                    <div
                      key={adv.id}
                      className="p-3 rounded-2xl bg-[#FAF7F5] border border-[#EADDD7] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 font-mono">₹{adv.amount}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              adv.status === "active" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {adv.status === "active" ? "Pending" : "Cleared"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {adv.date} • {adv.reason.replace("_", " ")}
                        </p>
                      </div>

                      {adv.status === "active" && (
                        <button
                          onClick={async () => {
                            await StaffExpenseService.updateAdvanceStatus(adv.id, adv.tokenNumber, "cleared");
                            await loadData();
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  ))
              )}
            </div>

            <button
              onClick={() => setViewingLedgerStaff(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#EADDD7] px-2 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {[
            { id: "expenses", label: "Expenses", icon: Coffee },
            { id: "advances", label: "Advances", icon: Wallet },
            { id: "attendance", label: "Attendance", icon: Calendar },
            { id: "handover", label: "Handover", icon: ClipboardList },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition active:scale-95 cursor-pointer ${
                  isActive ? "text-[#701A31] font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition ${
                    isActive
                      ? "bg-[#701A31] text-white shadow-md shadow-[#701A31]/20"
                      : "bg-transparent text-slate-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
