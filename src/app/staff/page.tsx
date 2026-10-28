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

  // Active Tab: 'expenses' | 'advances' | 'attendance'
  const [activeTab, setActiveTab] = useState<"expenses" | "advances" | "attendance">("expenses");

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

  // New Expense Form Modal State
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expTitle, setExpTitle] = useState<string>("");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expCategory, setExpCategory] = useState<StoreExpense["category"]>("chai_nashta");
  const [expPaidBy, setExpPaidBy] = useState<StoreExpense["paidBy"]>("cash_galla");
  const [expStaffName, setExpStaffName] = useState<string>("Ramesh (Head Staff)");
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
      console.error("Error loading staff data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(() => {
        loadData(false);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, selectedAttendanceDate]);

  // Handle PIN Unlock
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pinInput.trim();
    if (clean === STAFF_QUICK_PIN || clean === MASTER_PIN || clean === "1234") {
      setIsAuthenticated(true);
      if (rememberDevice) {
        localStorage.setItem("rajnandni_staff_device_auth", "true");
      }
      sessionStorage.setItem("rajnandni_staff_auth", "true");
      setPinError("");
      setPinInput("");
    } else {
      setPinError("Galat PIN! Kripya Staff PIN dalein (Default: 5555)");
    }
  };

  const handleLock = () => {
    localStorage.removeItem("rajnandni_staff_device_auth");
    sessionStorage.removeItem("rajnandni_staff_auth");
    setIsAuthenticated(false);
    setPinInput("");
  };

  // Quick Preset Expense Creation
  const handleQuickExpense = async (title: string, amount: number, category: StoreExpense["category"]) => {
    const created = await StaffExpenseService.recordExpense({
      title,
      amount,
      category,
      paidBy: "cash_galla",
      staffName: "Head Staff",
      note: "Quick 1-Tap Entry",
    });
    if (created) {
      await loadData();
    }
  };

  // Submit Custom Expense
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expAmount);
    if (!expTitle.trim() || isNaN(amt) || amt <= 0) {
      alert("Kripya sahi kharche ka naam aur amount dalein");
      return;
    }
    setIsSubmittingExp(true);
    try {
      await StaffExpenseService.recordExpense({
        title: expTitle,
        amount: amt,
        category: expCategory,
        paidBy: expPaidBy,
        staffName: expStaffName,
        note: expNote,
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
      alert("Kripya sahi advance amount dalein");
      return;
    }
    const staff = staffMembers.find((s) => s.id === advStaffId);
    if (!staff) {
      alert("Kripya staff member select karein");
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
        note: advNote,
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

  const todayAdvances = useMemo(() => {
    return advances.filter((a) => a.date === todayStr);
  }, [advances, todayStr]);

  const todayAdvanceTotal = useMemo(() => {
    return todayAdvances.reduce((sum, a) => sum + a.amount, 0);
  }, [todayAdvances]);

  const todayCashAdvance = useMemo(() => {
    return todayAdvances.filter((a) => a.paidBy === "cash_galla").reduce((sum, a) => sum + a.amount, 0);
  }, [todayAdvances]);

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
  // VIEW 0: STAFF PIN LOCK SCREEN
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
            Staff Manager Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Daily Expenses, Advances &amp; Attendance</p>

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
              <span>Remember this counter phone</span>
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
  // MAIN STAFF APPLICATION VIEW (WHITE & ROYAL SAPPHIRE THEME)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-28 selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 font-black">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                  Rajnandini
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-600 font-mono tracking-tight">LIVE SYNC</span>
              </div>
              <h1 className="text-xs font-bold text-slate-900">Head Staff Manager Suite</h1>
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

        {/* 3 Main Tabs */}
        <div className="grid grid-cols-3 gap-1.5 pt-3">
          {[
            { id: "expenses", label: "☕ Daily Kharcha", count: todayExpenses.length },
            { id: "advances", label: "👥 Staff Advance", count: todayAdvances.length },
            { id: "attendance", label: "📅 Daily Haajiri", count: `${attendanceStats.present}/${attendanceStats.totalStaff}` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-2 rounded-xl font-bold text-xs transition flex flex-col items-center justify-center ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{tab.label}</span>
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
            TAB 1: ☕ DAILY SHOWROOM EXPENSES (Chai, Nashta, Cold Drinks, etc.)
            ========================================================================= */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            {/* Today's Expense KPI Hero Card */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Aaj Ke Kul Kharch (Today's Expenses)
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
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">
                    Galla Cash se diya: <b className="text-rose-600 font-mono">₹{todayCashExpense}</b>
                  </span>
                </div>

                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kharcha Dalein</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Tap Preset Buttons */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-sm">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                ⚡ Quick 1-Tap Entry (Aksar Hone Wale Kharch)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleQuickExpense("Chai & Rusk (Staff)", 40, "chai_nashta")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">☕ Chai &amp; Rusk</span>
                  <span className="font-mono font-bold text-blue-700">₹40</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("Cold Drinks & Snacks", 90, "refreshments")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">🥤 Cold Drinks</span>
                  <span className="font-mono font-bold text-blue-700">₹90</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("Drinking Water Can", 30, "refreshments")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">💧 Water Can</span>
                  <span className="font-mono font-bold text-blue-700">₹30</span>
                </button>

                <button
                  onClick={() => handleQuickExpense("Pooja Samagri & Broom", 100, "cleaning_pooja")}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition text-left"
                >
                  <span className="font-semibold text-slate-800">🧹 Pooja / Safai</span>
                  <span className="font-mono font-bold text-blue-700">₹100</span>
                </button>
              </div>
            </div>

            {/* Expenses List */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block px-1">
                Recent Expenses List ({expenses.length})
              </span>

              {expenses.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                  Abhi tak koi kharcha enter nahi hua hai. Upar diye button se enter karein.
                </div>
              ) : (
                expenses.slice(0, 30).map((exp) => (
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
                          {exp.paidBy === "cash_galla" ? "Cash Galla" : "Online UPI"}
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
                          if (confirm(`Kya aap "${exp.title}" kharche ko delete karna chahte hain?`)) {
                            await StaffExpenseService.deleteExpense(exp.id, exp.tokenNumber);
                            await loadData();
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
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
            TAB 2: 👥 STAFF ADVANCES & SALARY PAYOUTS
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
                    Aaj Galla se advance diya: <b className="text-amber-700 font-mono">₹{todayCashAdvance}</b>
                  </span>
                </div>

                <button
                  onClick={() => setShowAdvanceModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Advance Dalein</span>
                </button>
              </div>
            </div>

            {/* Staff Directory with Advance Totals */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-slate-800 block">
                Showroom Staff Members ({activeStaffMembers.length})
              </span>
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
                          {staffAdvTotal > 0 ? `Advance: ₹${staffAdvTotal}` : "Koi Advance Nahi"}
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                  Koi advance record nahi hai.
                </div>
              ) : (
                advances.slice(0, 20).map((adv) => (
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
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Date: {adv.date} • Paid via {adv.paidBy === "cash_galla" ? "Cash Galla" : "UPI"}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-base font-black text-rose-600 font-mono tabular-nums">
                        ₹{adv.amount.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm(`Kya aap ${adv.staffName} ke is advance ko delete karna chahte hain?`)) {
                            await StaffExpenseService.deleteAdvance(adv.id, adv.tokenNumber);
                            await loadData();
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
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
            TAB 3: 📅 DAILY STAFF ATTENDANCE (HAAJIRI)
            ========================================================================= */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            {/* Date Bar & Mark All Present */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Staff Attendance (हाजिरी)
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Date: <b className="text-blue-700">{selectedAttendanceDate}</b>
                  </span>
                </div>

                <button
                  onClick={handleMarkAllPresent}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition flex items-center gap-1.5"
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
                  <span className="text-[10px] text-blue-800 font-bold uppercase block">Leave</span>
                  <span className="text-base font-black text-blue-700 font-mono">{attendanceStats.leave}</span>
                </div>
              </div>
            </div>

            {/* Individual Staff Attendance Rows */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block px-1">
                Mark Staff Attendance
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
                        { id: "half_day", label: "Half (HD)", activeColor: "bg-amber-500 text-white" },
                        { id: "absent", label: "Absent (A)", activeColor: "bg-rose-600 text-white" },
                        { id: "leave", label: "Leave (L)", activeColor: "bg-blue-600 text-white" },
                      ].map((s) => {
                        const isSel = currentStatus === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => handleMarkAttendance(staff, s.id as any)}
                            className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition ${
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
                <h3 className="text-base font-bold text-slate-900">Naya Kharcha Dalein</h3>
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
                <label className="font-bold text-slate-700 block mb-1">Kharcha Naam / Item</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Chai Samosa, Cold Drinks, Cleaning, Tape"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹ Rupaye)</label>
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
                    <option value="chai_nashta">Chai &amp; Nashta</option>
                    <option value="refreshments">Cold Drinks / Water</option>
                    <option value="cleaning_pooja">Cleaning &amp; Pooja</option>
                    <option value="stationery_packing">Packing Tape / Bags</option>
                    <option value="transport_fuel">Transport / Auto</option>
                    <option value="other">Other Misc</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paid From</label>
                  <select
                    value={expPaidBy}
                    onChange={(e) => setExpPaidBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                  >
                    <option value="cash_galla">💵 Cash Galla</option>
                    <option value="online_upi">📱 Online UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kisne Kharch Kiya (Staff Name)</label>
                <input
                  type="text"
                  value={expStaffName}
                  onChange={(e) => setExpStaffName(e.target.value)}
                  placeholder="Ramesh (Head Staff)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="e.g. 4 cup chai counter ke liye"
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
                  {isSubmittingExp ? "Saving..." : "Save Kharcha"}
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
                <h3 className="text-base font-bold text-slate-900">Karmachari Ko Advance Dein</h3>
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
                      {s.name} ({s.role}) - Salary ₹{s.monthlySalary}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Advance Amount (₹ Rupaye)</label>
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
                    <option value="emergency">Emergency Help</option>
                    <option value="travel_incentive">Travel / Fuel</option>
                    <option value="daily_wages">Daily Wages</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={advPaidBy}
                    onChange={(e) => setAdvPaidBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                  >
                    <option value="cash_galla">💵 Cash Galla</option>
                    <option value="online_upi">📱 Online UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={advNote}
                  onChange={(e) => setAdvNote(e.target.value)}
                  placeholder="e.g. Month end salary se katega"
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
