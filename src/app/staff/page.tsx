"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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

  // Today Date String
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(todayStr);

  // Search & Filter States
  const [expenseSearch, setExpenseSearch] = useState<string>("");
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<string>("all");

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

  // Handover Note State
  const [handoverCashChecked, setHandoverCashChecked] = useState<boolean>(false);
  const [handoverLightsChecked, setHandoverLightsChecked] = useState<boolean>(false);
  const [handoverLocksChecked, setHandoverLocksChecked] = useState<boolean>(false);
  const [handoverTerminalChecked, setHandoverTerminalChecked] = useState<boolean>(false);
  const [handoverNote, setHandoverNote] = useState<string>("");
  const [handoverSubmitted, setHandoverSubmitted] = useState<boolean>(false);

  // Check saved authentication on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rajnandni_staff_device_auth");
      const session = sessionStorage.getItem("rajnandni_staff_auth");
      if (saved === "true" || session === "true") {
        setIsAuthenticated(true);
      }
    } catch {}
  }, []);

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
      setPinError("Incorrect Security PIN. Please enter the valid staff PIN.");
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

  // Quick 1-Tap Preset Expense Record
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

  // =========================================================================
  // VIEW 0: STAFF PIN SECURITY SCREEN
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center px-4 py-8 relative">
        <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
            <Store className="w-8 h-8 text-blue-600" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-blue-700">
              Rajnandini Showroom
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
            Staff Operations Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Daily Store Expenses, Staff Advances &amp; Attendance</p>

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
                placeholder="Staff PIN (5555)"
                autoFocus
                className="w-full text-center tracking-[0.4em] text-2xl font-black bg-slate-50 text-blue-700 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl py-3 px-4 outline-none transition"
              />
              {pinError && <p className="text-rose-600 text-xs font-semibold mt-2">{pinError}</p>}
            </div>

            <label className="flex items-center justify-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="rounded border-slate-300 accent-blue-600 w-4 h-4"
              />
              <span>Remember this showroom device</span>
            </label>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-600/25 active:scale-[0.98] transition text-sm tracking-wide"
            >
              Open Staff Portal →
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-5 font-mono">Head Staff PIN: 5555</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN STAFF APPLICATION VIEW (WHITE & SAPPHIRE BLUE THEME)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-28 selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 font-black">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                  Rajnandini
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-600 font-mono tracking-tight">LIVE CLOUD SYNC</span>
              </div>
              <h1 className="text-xs font-bold text-slate-900">Showroom Staff Portal</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-600 active:scale-95 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>

            <button
              onClick={handleLock}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 active:scale-95 transition"
              title="Lock App"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Main Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1.5 pt-3">
          {[
            { id: "expenses", label: "Expenses", icon: Coffee, count: todayExpenses.length },
            { id: "advances", label: "Advances", icon: Wallet, count: todayAdvances.length },
            { id: "attendance", label: "Attendance", icon: Calendar, count: `${attendanceStats.present}/${attendanceStats.totalStaff}` },
            { id: "handover", label: "Handover", icon: ClipboardList, count: "EOD" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs transition flex flex-col items-center justify-center ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <div className="flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{tab.label}</span>
                </div>
                <span
                  className={`text-[10px] font-mono mt-0.5 ${
                    isActive ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-4 max-w-lg mx-auto space-y-4">
        {/* =========================================================================
            TAB 1: DAILY SHOWROOM EXPENSES (Tea, Snacks, Water, Supplies, etc.)
            ========================================================================= */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            {/* Today's Expense KPI Hero Card */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Expenses Today
                </span>
                <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                  {todayExpenses.length} Records
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
                    ₹{todayExpenseTotal.toLocaleString("en-IN")}
                  </span>
                  <div className="flex items-center gap-3 mt-1 text-xs font-medium">
                    <span className="text-slate-500">
                      Drawer Cash: <b className="text-rose-600 font-mono">₹{todayCashExpense}</b>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      UPI / Online: <b className="text-emerald-600 font-mono">₹{todayOnlineExpense}</b>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Expense</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Tap Preset Buttons (8 Frequent Operational Items) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                ⚡ Quick 1-Tap Presets (Frequent Daily Expenses)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleQuickExpense("Morning Tea & Biscuits", 40, "chai_nashta")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">☕ Morning Tea</span>
                  <span className="font-mono font-bold text-blue-700">₹40</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("Evening Tea & Snacks", 60, "chai_nashta")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">☕ Evening Snacks</span>
                  <span className="font-mono font-bold text-blue-700">₹60</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("Cold Drinks & Juices", 90, "refreshments")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">🥤 Cold Drinks</span>
                  <span className="font-mono font-bold text-blue-700">₹90</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("20L Drinking Water Jar", 30, "refreshments")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">💧 Water Can</span>
                  <span className="font-mono font-bold text-blue-700">₹30</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("Cleaning & Store Care", 100, "cleaning_pooja")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">🧹 Cleaning / Care</span>
                  <span className="font-mono font-bold text-blue-700">₹100</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("Packaging Tape & Bags", 150, "stationery_packing")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">📦 Packing Bags</span>
                  <span className="font-mono font-bold text-blue-700">₹150</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("Customer Delivery / Auto", 80, "transport_fuel")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">🛵 Courier / Auto</span>
                  <span className="font-mono font-bold text-blue-700">₹80</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("Minor Store Maintenance", 120, "other")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">💡 Maintenance</span>
                  <span className="font-mono font-bold text-blue-700">₹120</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Search expense title or staff..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={expenseFilterCategory}
                onChange={(e) => setExpenseFilterCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none font-medium"
              >
                <option value="all">All Categories</option>
                <option value="chai_nashta">Tea &amp; Snacks</option>
                <option value="refreshments">Drinks &amp; Water</option>
                <option value="cleaning_pooja">Cleaning &amp; Care</option>
                <option value="stationery_packing">Packing Bags</option>
                <option value="transport_fuel">Transport / Auto</option>
                <option value="other">Miscellaneous</option>
              </select>
            </div>

            {/* Expenses List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700">
                  Recorded Expenses ({filteredExpenses.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Today: {todayExpenses.length} entries
                </span>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-500">No matching expense records found.</p>
                  <p className="text-[11px]">Use the quick buttons above or tap "Record Expense" to add a new entry.</p>
                </div>
              ) : (
                filteredExpenses.slice(0, 40).map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-blue-300 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                          {exp.category.replace("_", " ")}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            exp.paidBy === "cash_galla"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {exp.paidBy === "cash_galla" ? "Cash Drawer" : "UPI / Online"}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 mt-1 truncate">{exp.title}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        By {exp.staffName} • {exp.date} {exp.note ? `• "${exp.note}"` : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-base font-black text-rose-600 font-mono tabular-nums">
                        -₹{exp.amount.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${exp.title}"?`)) {
                            await StaffExpenseService.deleteExpense(exp.id, exp.tokenNumber);
                            await loadData();
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
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
            TAB 2: STAFF ADVANCES & SALARY PAYOUTS
            ========================================================================= */}
        {activeTab === "advances" && (
          <div className="space-y-4">
            {/* Advance KPI Hero Card */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Staff Advance Payouts
                </span>
                <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                  {advances.filter((a) => a.status === "active").length} Active Advances
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
                    ₹{todayAdvanceTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">
                    Disbursed from Drawer today: <b className="text-amber-700 font-mono">₹{todayCashAdvance}</b>
                  </span>
                </div>

                <button
                  onClick={() => setShowAdvanceModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue Advance</span>
                </button>
              </div>
            </div>

            {/* Staff Directory with Advance Balances */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Showroom Staff Members ({activeStaffMembers.length})
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Monthly Payroll</span>
              </div>

              <div className="space-y-2">
                {activeStaffMembers.map((staff) => {
                  const staffAdvTotal = advances
                    .filter((a) => a.staffId === staff.id && a.status === "active")
                    .reduce((sum, a) => sum + a.amount, 0);

                  return (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{staff.name}</p>
                        <p className="text-[10px] text-slate-500">{staff.role}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono block">
                          Salary: ₹{staff.monthlySalary.toLocaleString("en-IN")}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            staffAdvTotal > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {staffAdvTotal > 0 ? `Active Advance: ₹${staffAdvTotal}` : "Zero Advance"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Advances Log */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block px-1">
                Recent Advance Records ({advances.length})
              </span>

              {advances.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
                  <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-500">No staff advance records found.</p>
                  <p className="text-[11px]">Tap "Issue Advance" when disbursing a salary advance to an employee.</p>
                </div>
              ) : (
                advances.slice(0, 30).map((adv) => (
                  <div
                    key={adv.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{adv.staffName}</span>
                        <span className="text-[9px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                          {adv.reason.replace("_", " ")}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            adv.status === "active"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {adv.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Date: {adv.date} • Paid via {adv.paidBy === "cash_galla" ? "Cash Drawer" : "UPI"}
                        {adv.note ? ` • "${adv.note}"` : ""}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-base font-black text-rose-600 font-mono tabular-nums">
                        ₹{adv.amount.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete the advance for ${adv.staffName}?`)) {
                            await StaffExpenseService.deleteAdvance(adv.id, adv.tokenNumber);
                            await loadData();
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Advance"
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
            TAB 3: DAILY STAFF ATTENDANCE
            ========================================================================= */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            {/* Date Bar & Mark All Present */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Daily Staff Attendance
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="date"
                      value={selectedAttendanceDate}
                      onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                      className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none font-mono"
                    />
                    {selectedAttendanceDate !== todayStr && (
                      <button
                        onClick={() => setSelectedAttendanceDate(todayStr)}
                        className="text-[10px] font-bold text-slate-500 underline"
                      >
                        Today
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark All Present</span>
                </button>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-100">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Present</span>
                  <span className="text-base font-black text-emerald-700 font-mono">{attendanceStats.present}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">Half Day</span>
                  <span className="text-base font-black text-amber-700 font-mono">{attendanceStats.halfDay}</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2">
                  <span className="text-[10px] text-rose-800 font-bold uppercase block">Absent</span>
                  <span className="text-base font-black text-rose-700 font-mono">{attendanceStats.absent}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
                  <span className="text-[10px] text-blue-800 font-bold uppercase block">On Leave</span>
                  <span className="text-base font-black text-blue-700 font-mono">{attendanceStats.leave}</span>
                </div>
              </div>
            </div>

            {/* Individual Staff Attendance Rows */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block px-1">
                Staff Members Attendance Roster ({activeStaffMembers.length})
              </span>

              {activeStaffMembers.map((staff) => {
                const record = attendance.find((a) => a.staffId === staff.id);
                const currentStatus = record?.status || "present";

                return (
                  <div
                    key={staff.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{staff.name}</h4>
                        <p className="text-[10px] text-slate-500">{staff.role}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono ${
                          currentStatus === "present"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : currentStatus === "half_day"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : currentStatus === "absent"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {currentStatus.replace("_", " ")}
                      </span>
                    </div>

                    {/* 4 Status Selection Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {[
                        { id: "present", label: "Present (P)", activeColor: "bg-emerald-600 text-white" },
                        { id: "half_day", label: "Half Day", activeColor: "bg-amber-500 text-white" },
                        { id: "absent", label: "Absent (A)", activeColor: "bg-rose-600 text-white" },
                        { id: "leave", label: "On Leave", activeColor: "bg-blue-600 text-white" },
                      ].map((s) => {
                        const isSel = currentStatus === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => handleMarkAttendance(staff, s.id as any)}
                            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition ${
                              isSel
                                ? `${s.activeColor} shadow-sm`
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {s.label}
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
            TAB 4: DAILY SHIFT HANDOVER & CASH DRAWER RECONCILIATION
            ========================================================================= */}
        {activeTab === "handover" && (
          <div className="space-y-4">
            {/* Daily Drawer Outflow Summary Card */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Daily Outflow Summary (Cash Drawer)
              </span>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Store Expenses</span>
                  <span className="text-sm font-black text-slate-800 font-mono">₹{todayCashExpense}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Staff Advances</span>
                  <span className="text-sm font-black text-slate-800 font-mono">₹{todayCashAdvance}</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Total Cash Out</span>
                  <span className="text-sm font-black text-rose-700 font-mono">₹{totalCashOutflow}</span>
                </div>
              </div>
            </div>

            {/* End of Day Store Closing Checklist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  End of Day Closing Checklist
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Shift Closing
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={handoverCashChecked}
                    onChange={(e) => setHandoverCashChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span className="font-medium text-slate-700">Cash drawer tallied with sales &amp; expenses</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={handoverLocksChecked}
                    onChange={(e) => setHandoverLocksChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span className="font-medium text-slate-700">Physical cash drawer &amp; safety locker locked</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={handoverLightsChecked}
                    onChange={(e) => setHandoverLightsChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span className="font-medium text-slate-700">Showroom spotlights, display racks &amp; AC switched off</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={handoverTerminalChecked}
                    onChange={(e) => setHandoverTerminalChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span className="font-medium text-slate-700">Barcode scanner &amp; billing terminal placed on charging</span>
                </label>
              </div>

              {/* Handover Note to Owner */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Closing Note for Showroom Owner (Optional)
                </label>
                <textarea
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Counter cash tallied, all pending alterations packed."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-600"
                />
              </div>

              <button
                onClick={() => {
                  setHandoverSubmitted(true);
                  alert("Shift Handover & Store Closing successfully submitted!");
                }}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition ${
                  handoverSubmitted
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{handoverSubmitted ? "Shift Handover Logged ✓" : "Complete Shift Handover"}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: ADD NEW CUSTOM EXPENSE
          ========================================================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                  Showroom Expense
                </span>
                <h3 className="text-base font-bold text-slate-900">Record Store Expense</h3>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-base font-black font-mono outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                  >
                    <option value="chai_nashta">Tea &amp; Snacks</option>
                    <option value="refreshments">Drinks &amp; Water</option>
                    <option value="cleaning_pooja">Cleaning &amp; Care</option>
                    <option value="stationery_packing">Packing Bags &amp; Tape</option>
                    <option value="transport_fuel">Transport / Delivery</option>
                    <option value="other">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={expPaidBy}
                    onChange={(e) => setExpPaidBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                  >
                    <option value="cash_galla">💵 Cash Drawer</option>
                    <option value="online_upi">📱 Online UPI / Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Incurred By (Staff Member)</label>
                <input
                  type="text"
                  value={expStaffName}
                  onChange={(e) => setExpStaffName(e.target.value)}
                  placeholder="Ramesh Kumar (Store Manager)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Optional Note / Remark</label>
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="e.g. 4 cups tea for showroom counter"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExp}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700"
                >
                  {isSubmittingExp ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW STAFF ADVANCE
          ========================================================================= */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                  Staff Advance Record
                </span>
                <h3 className="text-base font-bold text-slate-900">Issue Salary Advance</h3>
              </div>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold outline-none"
                >
                  {activeStaffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - Monthly Salary ₹{s.monthlySalary.toLocaleString("en-IN")}
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-base font-black font-mono outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason</label>
                  <select
                    value={advReason}
                    onChange={(e) => setAdvReason(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                  >
                    <option value="salary_advance">Salary Advance</option>
                    <option value="emergency">Personal Emergency</option>
                    <option value="travel_incentive">Travel / Fuel</option>
                    <option value="daily_wages">Daily Wages</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={advPaidBy}
                    onChange={(e) => setAdvPaidBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                  >
                    <option value="cash_galla">💵 Cash Drawer</option>
                    <option value="online_upi">📱 Online UPI / Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deduction / Remarks Note (Optional)</label>
                <input
                  type="text"
                  value={advNote}
                  onChange={(e) => setAdvNote(e.target.value)}
                  placeholder="e.g. To be deducted from end-of-month salary"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdv}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700"
                >
                  {isSubmittingAdv ? "Saving..." : "Record Advance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
