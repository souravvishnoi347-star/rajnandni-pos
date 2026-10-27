"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Receipt,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Phone,
  MessageCircle,
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
  ChevronDown,
  Sparkles,
  Store,
  DollarSign,
  CreditCard,
  Wallet,
  Layers,
  Boxes,
  Eye,
  X,
  Share2,
  ArrowRight,
  SlidersHorizontal,
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
import { ProductItem, CompletedBill, ProductCategory } from "@/types/pos";
import { SupabaseService } from "@/lib/supabaseClient";

export default function MobileOwnerApp() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);

  // Active Bottom Nav Tab: 'sales' | 'stock' | 'bills' | 'security'
  const [activeNav, setActiveNav] = useState<"sales" | "stock" | "bills" | "security">("sales");

  // Time Filter for Sales: 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [timeFilter, setTimeFilter] = useState<"today" | "yesterday" | "week" | "month" | "all">("today");

  // Data States
  const [bills, setBills] = useState<CompletedBill[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<InventoryAuthRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

  // Search & Filter States
  const [stockSearch, setStockSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "out" | "low" | "good">("all");
  const [billsSearch, setBillsSearch] = useState<string>("");
  const [billsPaymentFilter, setBillsPaymentFilter] = useState<string>("all");

  // Modal State for Viewing Full Bill
  const [viewingBill, setViewingBill] = useState<CompletedBill | null>(null);

  // Security OTP State
  const [otpData, setOtpData] = useState(getCurrentOwnerOtp());
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Check persisted device authentication on mount
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("rajnandni_owner_device_auth");
      const sessionAuth = sessionStorage.getItem("rajnandni_owner_auth");
      if (savedAuth === "true" || sessionAuth === "true") {
        setIsAuthenticated(true);
      }
    } catch {}
  }, []);

  // Live OTP Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setOtpData(getCurrentOwnerOtp());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all live bills & inventory from Supabase
  const loadAllData = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const [remoteBills, remoteProducts, reqs, logs] = await Promise.all([
        SupabaseService.fetchRecentBills().catch(() => null),
        SupabaseService.fetchProducts().catch(() => null),
        OwnerSecurityService.fetchPendingRequests().catch(() => []),
        OwnerSecurityService.fetchAuditLogs().catch(() => []),
      ]);

      if (remoteBills && Array.isArray(remoteBills)) {
        const mapped: CompletedBill[] = remoteBills.map((b: any) => ({
          id: b.id,
          billNo: b.invoice_number,
          customer: {
            name: b.customer_name || "Walk-in Guest",
            phone: b.customer_phone || "NA",
            notes: "",
          },
          items: Array.isArray(b.items)
            ? b.items.map((it: any) => ({
                product: {
                  id: it.id || "",
                  name: it.name || "Ethnic Item",
                  sku: it.sku || "",
                  barcode: it.barcode || "",
                  category: it.category || "sarees",
                  price: Number(it.price) || 0,
                  mrp: Number(it.mrp || it.price) || 0,
                  purchaseCost: Number(it.purchaseCost || it.purchase_cost || 0),
                  stock: 1,
                },
                quantity: it.quantity || 1,
                price: Number(it.price) || 0,
                customDiscount: 0,
              }))
            : [],
          subtotal: Number(b.subtotal) || 0,
          discount: Number(b.discount) || 0,
          taxGst: Number(b.tax) || 0,
          grandTotal: Number(b.total) || 0,
          paidAmount: Number(b.total) || 0,
          paymentMode: (b.payment_mode || "upi").toLowerCase() as any,
          createdAt: new Date(b.created_at).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          rawDate: b.created_at,
        }));
        setBills(mapped);
      }

      if (remoteProducts && Array.isArray(remoteProducts)) {
        setProducts(remoteProducts);
      }

      setPendingRequests(reqs || []);
      setAuditLogs(logs || []);
      setLastRefreshedAt(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      console.error("Error loading owner data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
      // Auto-refresh every 15 seconds for live store sales updates
      const interval = setInterval(() => {
        loadAllData(false);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Handle PIN Unlock
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pinInput.trim();
    if (clean === MASTER_OWNER_PIN || clean === QUICK_OWNER_PIN) {
      setIsAuthenticated(true);
      if (rememberDevice) {
        localStorage.setItem("rajnandni_owner_device_auth", "true");
      }
      sessionStorage.setItem("rajnandni_owner_auth", "true");
      setPinError("");
      setPinInput("");
    } else {
      setPinError("Galat PIN! Kripya sahi PIN dalein (Quick PIN: 7898)");
    }
  };

  const handleLock = () => {
    localStorage.removeItem("rajnandni_owner_device_auth");
    sessionStorage.removeItem("rajnandni_owner_auth");
    setIsAuthenticated(false);
    setPinInput("");
  };

  // Helper date matchers
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const yest = new Date(Date.now() - 86400000);
    const year = yest.getFullYear();
    const month = String(yest.getMonth() + 1).padStart(2, "0");
    const day = String(yest.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const sevenDaysAgoDate = useMemo(() => new Date(Date.now() - 7 * 86400000), []);

  // Filtered bills by time
  const timeFilteredBills = useMemo(() => {
    return bills.filter((b) => {
      const raw = b.rawDate || "";
      if (!raw) return true;
      if (timeFilter === "today") {
        return raw.startsWith(todayStr);
      } else if (timeFilter === "yesterday") {
        return raw.startsWith(yesterdayStr);
      } else if (timeFilter === "week") {
        return new Date(raw) >= sevenDaysAgoDate;
      } else if (timeFilter === "month") {
        return raw.startsWith("2026-10");
      }
      return true;
    });
  }, [bills, timeFilter, todayStr, yesterdayStr, sevenDaysAgoDate]);

  // Product purchase cost mapping
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      if (p.purchaseCost > 0) {
        if (p.id) map.set(p.id.toLowerCase(), p.purchaseCost);
        if (p.sku) map.set(p.sku.toLowerCase(), p.purchaseCost);
        if (p.name) map.set(p.name.trim().toLowerCase(), p.purchaseCost);
      }
    });
    return map;
  }, [products]);

  // Sales Analytics for selected time
  const salesStats = useMemo(() => {
    let revenue = 0;
    let discount = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let itemsCount = 0;
    let wholesaleCost = 0;

    timeFilteredBills.forEach((b) => {
      revenue += b.grandTotal;
      discount += b.discount || 0;
      if (b.paymentMode === "cash") {
        cashTotal += b.grandTotal;
      } else {
        upiTotal += b.grandTotal;
      }

      (b.items || []).forEach((it) => {
        const qty = it.quantity || 1;
        itemsCount += qty;
        const pSku = (it.product?.sku || "").toLowerCase();
        const pId = (it.product?.id || "").toLowerCase();
        const pName = (it.product?.name || "").trim().toLowerCase();
        const cost =
          Number(it.product?.purchaseCost) ||
          (pSku && productCostMap.get(pSku)) ||
          (pId && productCostMap.get(pId)) ||
          (pName && productCostMap.get(pName)) ||
          0;
        wholesaleCost += cost * qty;
      });
    });

    const grossProfit = revenue - wholesaleCost;
    const marginPct = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : "0.0";
    const avgBill = timeFilteredBills.length > 0 ? Math.round(revenue / timeFilteredBills.length) : 0;

    return {
      revenue,
      discount,
      cashTotal,
      upiTotal,
      itemsCount,
      wholesaleCost,
      grossProfit,
      marginPct,
      avgBill,
      count: timeFilteredBills.length,
    };
  }, [timeFilteredBills, productCostMap]);

  // Top Selling Items in selected time
  const topSellingItems = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
    timeFilteredBills.forEach((b) => {
      (b.items || []).forEach((it) => {
        const key = it.product?.sku || it.product?.name || "Item";
        const existing = map.get(key) || {
          name: it.product?.name || "Item",
          sku: it.product?.sku || "",
          qty: 0,
          revenue: 0,
        };
        existing.qty += it.quantity || 1;
        existing.revenue += (it.price || 0) * (it.quantity || 1);
        map.set(key, existing);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [timeFilteredBills]);

  // Inventory Analytics
  const inventoryStats = useMemo(() => {
    let totalPcs = 0;
    let totalRetail = 0;
    let totalCost = 0;
    let outOfStock = 0;
    let lowStock = 0;

    products.forEach((p) => {
      const s = p.stock || 0;
      totalPcs += s;
      totalRetail += s * (p.price || 0);
      totalCost += s * (p.purchaseCost || 0);
      if (s <= 0) outOfStock++;
      else if (s <= 2) lowStock++;
    });

    return {
      totalItems: products.length,
      totalPcs,
      totalRetail,
      totalCost,
      outOfStock,
      lowStock,
    };
  }, [products]);

  // Filtered Products for Inventory View
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }
      // Stock status filter
      if (stockStatusFilter === "out" && p.stock > 0) return false;
      if (stockStatusFilter === "low" && (p.stock <= 0 || p.stock > 2)) return false;
      if (stockStatusFilter === "good" && p.stock < 3) return false;
      // Search filter
      if (stockSearch.trim()) {
        const q = stockSearch.toLowerCase().trim();
        const matchesName = (p.name || "").toLowerCase().includes(q);
        const matchesSku = (p.sku || "").toLowerCase().includes(q);
        const matchesBarcode = (p.barcode || "").toLowerCase().includes(q);
        return matchesName || matchesSku || matchesBarcode;
      }
      return true;
    });
  }, [products, selectedCategory, stockStatusFilter, stockSearch]);

  // Filtered Bills for Invoices View
  const searchFilteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (billsPaymentFilter !== "all" && b.paymentMode !== billsPaymentFilter) {
        return false;
      }
      if (billsSearch.trim()) {
        const q = billsSearch.toLowerCase().trim();
        const matchesNo = (b.billNo || "").toLowerCase().includes(q);
        const matchesName = (b.customer?.name || "").toLowerCase().includes(q);
        const matchesPhone = (b.customer?.phone || "").toLowerCase().includes(q);
        return matchesNo || matchesName || matchesPhone;
      }
      return true;
    });
  }, [bills, billsPaymentFilter, billsSearch]);

  // Handle staff request approval / rejection
  const handleResolveRequest = async (req: InventoryAuthRequest, status: "approved" | "rejected") => {
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
      await loadAllData();
    } catch (err) {
      alert("Error resolving request");
    } finally {
      setIsProcessingId(null);
    }
  };

  // =========================================================================
  // VIEW 0: PIN LOCK SCREEN (If not unlocked on device)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d0907] text-amber-50 flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-sm bg-gradient-to-b from-[#1c1511] to-[#0f0b09] border border-amber-500/30 rounded-3xl p-6 shadow-2xl shadow-amber-950/40 relative overflow-hidden text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <span className="text-[10px] uppercase tracking-widest font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Rajnandini Showroom
          </span>

          <h1 className="text-xl font-black text-white mt-3 font-serif">Owner Executive App</h1>
          <p className="text-xs text-stone-400 mt-1">Daily Sales, Live Stock &amp; Reports</p>

          <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError("");
                }}
                placeholder="Enter Quick PIN (7898)"
                autoFocus
                className="w-full text-center tracking-[0.4em] text-2xl font-black bg-stone-900/90 text-amber-300 border-2 border-amber-500/40 focus:border-amber-400 rounded-2xl py-3 px-4 outline-none placeholder:tracking-normal placeholder:text-xs placeholder:text-stone-500"
              />
              {pinError && <p className="text-rose-400 text-xs font-semibold mt-2">{pinError}</p>}
            </div>

            <label className="flex items-center justify-center gap-2 text-xs text-stone-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="rounded border-amber-500/40 accent-amber-500 w-4 h-4"
              />
              <span>Remember this mobile (Direct Open)</span>
            </label>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition font-sans text-sm tracking-wide"
            >
              Open Owner Dashboard →
            </button>
          </form>

          <p className="text-[11px] text-stone-500 mt-5">Default Master PIN: 7898 or Indu@123</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN MOBILE APPLICATION VIEW (AUTHENTICATED)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#0c0908] text-stone-100 font-sans pb-28 selection:bg-amber-500 selection:text-black">
      {/* Top Mobile App Header */}
      <header className="sticky top-0 z-40 bg-[#140e0b]/95 backdrop-blur-md border-b border-amber-500/20 px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-500 flex items-center justify-center text-stone-950 shadow-md font-black">
              <Store className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                  Rajnandini
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-400">LIVE</span>
              </div>
              <h1 className="text-xs font-bold text-stone-200">Owner Mobile Suite</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAllData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400 active:scale-95 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            </button>

            <button
              onClick={handleLock}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 active:scale-95 transition"
              title="Lock App"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Filter Chips for Sales View */}
        {activeNav === "sales" && (
          <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
            {[
              { id: "today", label: "⚡ Aaj (Today)" },
              { id: "yesterday", label: "Kal (Yesterday)" },
              { id: "week", label: "7 Din (Week)" },
              { id: "month", label: "Is Mahine (Oct)" },
              { id: "all", label: "All Time" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition text-xs shrink-0 ${
                  timeFilter === tab.id
                    ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20"
                    : "bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Tab Content */}
      <main className="px-4 pt-4 max-w-lg mx-auto space-y-4">
        {/* =========================================================================
            TAB 1: 📊 DAILY SALES & REVENUE REPORT
            ========================================================================= */}
        {activeNav === "sales" && (
          <div className="space-y-4">
            {/* Primary Gold Hero Card: Revenue & Profit */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#261b14] via-[#1a120d] to-[#120c09] border border-amber-500/40 p-5 shadow-xl shadow-amber-950/30">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  {timeFilter === "today"
                    ? "Aaj Ki Total Sales"
                    : timeFilter === "yesterday"
                    ? "Kal Ki Sales"
                    : timeFilter === "week"
                    ? "Pichhle 7 Din Ki Sales"
                    : timeFilter === "month"
                    ? "October Mahine Ki Sales"
                    : "All Time Showroom Sales"}
                </span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {salesStats.count} Invoices
                </span>
              </div>

              <div className="mt-2">
                <span className="text-3xl font-black text-white font-mono tracking-tight">
                  ₹{salesStats.revenue.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Profit & Margin Row */}
              <div className="mt-4 pt-3.5 border-t border-amber-500/20 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                    Gross Profit (Munafa)
                  </span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    +₹{salesStats.grossProfit.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                    Profit Margin
                  </span>
                  <span className="text-base font-black text-amber-300 font-mono">
                    {salesStats.marginPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Quick Stat Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Cash Collection */}
              <div className="bg-[#17100c] border border-amber-500/20 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Cash In Hand</span>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-lg font-black text-stone-100 font-mono mt-1">
                  ₹{salesStats.cashTotal.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-emerald-400 font-semibold">Galla Cash</span>
              </div>

              {/* UPI / Online */}
              <div className="bg-[#17100c] border border-amber-500/20 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">UPI / Online</span>
                  <CreditCard className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-lg font-black text-stone-100 font-mono mt-1">
                  ₹{salesStats.upiTotal.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-blue-400 font-semibold">PhonePe / QR</span>
              </div>

              {/* Total Discount Given */}
              <div className="bg-[#17100c] border border-amber-500/20 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Total Discount</span>
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-lg font-black text-rose-400 font-mono mt-1">
                  -₹{salesStats.discount.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-stone-500 font-semibold">Bargain Given</span>
              </div>

              {/* Average Bill Value */}
              <div className="bg-[#17100c] border border-amber-500/20 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Avg Bill Value</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-lg font-black text-amber-300 font-mono mt-1">
                  ₹{salesStats.avgBill.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-stone-500 font-semibold">Per Customer</span>
              </div>
            </div>

            {/* Payment Mode Visual Split Bar */}
            <div className="bg-[#17100c] border border-stone-800 rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-stone-300">Payment Breakdown</span>
                <span className="text-stone-400 text-[11px]">
                  Cash: {salesStats.revenue > 0 ? Math.round((salesStats.cashTotal / salesStats.revenue) * 100) : 0}% | UPI:{" "}
                  {salesStats.revenue > 0 ? Math.round((salesStats.upiTotal / salesStats.revenue) * 100) : 0}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-stone-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${salesStats.revenue > 0 ? (salesStats.cashTotal / salesStats.revenue) * 100 : 50}%`,
                  }}
                  title="Cash"
                />
                <div
                  className="bg-blue-500 h-full"
                  style={{
                    width: `${salesStats.revenue > 0 ? (salesStats.upiTotal / salesStats.revenue) * 100 : 50}%`,
                  }}
                  title="UPI"
                />
              </div>
            </div>

            {/* Top 10 Fast-Selling Items */}
            <div className="bg-[#17100c] border border-amber-500/20 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Fast-Selling Products
                  </h2>
                </div>
                <span className="text-[10px] text-stone-400">By Revenue</span>
              </div>

              {topSellingItems.length === 0 ? (
                <p className="text-xs text-stone-500 py-3 text-center">Is samay me koi sale nahi hui</p>
              ) : (
                <div className="space-y-2">
                  {topSellingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/80"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-stone-200 truncate">{item.name}</p>
                        <p className="text-[10px] text-stone-500 font-mono">{item.sku} • {item.qty} pcs sold</p>
                      </div>
                      <span className="text-xs font-black text-amber-300 font-mono shrink-0">
                        ₹{item.revenue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: 📦 FULL STOCK & INVENTORY STATUS
            ========================================================================= */}
        {activeNav === "stock" && (
          <div className="space-y-4">
            {/* Stock Overview Hero Card */}
            <div className="bg-gradient-to-br from-[#1d140e] to-[#120c09] border border-amber-500/30 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Total Showroom Inventory
                </span>
                <span className="text-xs font-black font-mono bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {inventoryStats.totalPcs} Total Pcs
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Total Retail Value</span>
                  <span className="text-lg font-black text-white font-mono">
                    ₹{inventoryStats.totalRetail.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Total Wholesale Cost</span>
                  <span className="text-lg font-black text-stone-300 font-mono">
                    ₹{inventoryStats.totalCost.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Alert Counts */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-800 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  {inventoryStats.outOfStock} Out of Stock
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {inventoryStats.lowStock} Low Stock (&le; 2 pcs)
                </span>
              </div>
            </div>

            {/* Search & Stock Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Search item name, SKU, or Barcode..."
                  className="w-full bg-[#17100c] border border-stone-800 rounded-2xl py-2.5 pl-9 pr-9 text-xs text-stone-200 placeholder:text-stone-500 outline-none focus:border-amber-400"
                />
                {stockSearch && (
                  <button
                    onClick={() => setStockSearch("")}
                    className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Stock Health Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                {[
                  { id: "all", label: `Sabhi (${products.length})` },
                  { id: "low", label: `⚠️ Low Stock (${inventoryStats.lowStock})` },
                  { id: "out", label: `🔴 Khatam (${inventoryStats.outOfStock})` },
                  { id: "good", label: `🟢 Good Stock` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStockStatusFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                      stockStatusFilter === f.id
                        ? "bg-amber-400 text-stone-950 font-black"
                        : "bg-stone-900 text-stone-400 border border-stone-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                {[
                  "all",
                  "sarees",
                  "kurtis",
                  "handbags",
                  "lehengas",
                  "jewellery",
                  "kidswear",
                  "footwear",
                  "cosmetics",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? "bg-stone-200 text-stone-950"
                        : "bg-stone-900/60 text-stone-400 border border-stone-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Item Cards List */}
            <div className="space-y-2">
              <span className="text-[11px] text-stone-400 font-semibold block px-1">
                Showing {filteredProducts.length} items
              </span>

              {filteredProducts.slice(0, 50).map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= 2;
                return (
                  <div
                    key={p.id}
                    className="bg-[#17100c] border border-stone-800 rounded-2xl p-3 flex flex-col justify-between gap-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase bg-stone-800 text-amber-400 px-1.5 py-0.5 rounded">
                            {p.category}
                          </span>
                          <span className="text-[9px] font-mono text-stone-400">{p.sku}</span>
                          {p.badge && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-stone-200 mt-1 leading-snug">{p.name}</h3>
                        <p className="text-[10px] text-stone-500 font-mono mt-0.5">Barcode: {p.barcode}</p>
                      </div>

                      {/* Stock Badge */}
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${
                          isOutOfStock
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : isLowStock
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {p.stock} pcs
                      </span>
                    </div>

                    {/* Price & Cost Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-amber-400 font-mono">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                        {p.mrp > p.price && (
                          <span className="text-[10px] text-stone-500 line-through font-mono">
                            ₹{p.mrp.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400">
                          Cost: <span className="font-mono text-stone-300">₹{p.purchaseCost || 0}</span>
                        </span>
                        {p.price > p.purchaseCost && (
                          <span className="text-[10px] text-emerald-400 font-semibold ml-1.5">
                            (+₹{p.price - (p.purchaseCost || 0)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length > 50 && (
                <p className="text-center text-xs text-stone-500 py-3">
                  Showing first 50 items. Use search bar to find specific products.
                </p>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: 🧾 LIVE INVOICES & BILLS
            ========================================================================= */}
        {activeNav === "bills" && (
          <div className="space-y-4">
            {/* Search & Payment Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  type="text"
                  value={billsSearch}
                  onChange={(e) => setBillsSearch(e.target.value)}
                  placeholder="Search Bill #, Customer Name, or Phone..."
                  className="w-full bg-[#17100c] border border-stone-800 rounded-2xl py-2.5 pl-9 pr-9 text-xs text-stone-200 placeholder:text-stone-500 outline-none focus:border-amber-400"
                />
                {billsSearch && (
                  <button
                    onClick={() => setBillsSearch("")}
                    className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Payment Mode Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                {[
                  { id: "all", label: `All Bills (${bills.length})` },
                  { id: "cash", label: `💵 Cash (${bills.filter((b) => b.paymentMode === "cash").length})` },
                  { id: "upi", label: `📱 UPI (${bills.filter((b) => b.paymentMode === "upi").length})` },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setBillsPaymentFilter(pm.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                      billsPaymentFilter === pm.id
                        ? "bg-amber-400 text-stone-950 font-black"
                        : "bg-stone-900 text-stone-400 border border-stone-800"
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bills Feed List */}
            <div className="space-y-2.5">
              {searchFilteredBills.slice(0, 60).map((bill) => (
                <div
                  key={bill.id || bill.billNo}
                  onClick={() => setViewingBill(bill)}
                  className="bg-[#17100c] border border-amber-500/20 hover:border-amber-400 rounded-2xl p-3.5 space-y-2 transition cursor-pointer active:scale-[0.99] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-amber-300">{bill.billNo}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        bill.paymentMode === "cash"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {bill.paymentMode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{bill.customer?.name || "Walk-in Guest"}</p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        {bill.customer?.phone && bill.customer.phone !== "NA" ? bill.customer.phone : "No Phone"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black text-amber-400 font-mono">
                        ₹{bill.grandTotal.toLocaleString("en-IN")}
                      </p>
                      <span className="text-[10px] text-stone-500">{bill.createdAt}</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                    <span className="truncate max-w-[240px]">
                      {bill.items?.length || 0} items:{" "}
                      {bill.items?.map((it) => it.product?.name).filter(Boolean).slice(0, 2).join(", ")}
                      {(bill.items?.length || 0) > 2 ? "..." : ""}
                    </span>
                    <span className="text-amber-400 text-[10px] font-semibold flex items-center gap-0.5">
                      View Slip →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: 🛡️ SECURITY & STAFF APPROVALS
            ========================================================================= */}
        {activeNav === "security" && (
          <div className="space-y-4">
            {/* Live 30-Sec OTP Card */}
            <div className="bg-gradient-to-br from-[#261b14] to-[#140e0b] border border-amber-500/40 rounded-3xl p-5 text-center shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Staff Override OTP
              </span>
              <h2 className="text-xs text-stone-400 mt-0.5">Tell this code to counter staff for special discount</h2>

              <div className="my-4">
                <span className="font-mono text-4xl font-black text-amber-300 tracking-[0.25em]">
                  {otpData.otp}
                </span>
              </div>

              {/* Progress Bar & Timer */}
              <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-amber-400 h-full transition-all duration-1000"
                  style={{ width: `${(otpData.secondsRemaining / otpData.totalSeconds) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-400 font-mono">
                Changes in {otpData.secondsRemaining} seconds
              </span>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(otpData.otp);
                    setCopiedOtp(true);
                    setTimeout(() => setCopiedOtp(false), 2000);
                  }}
                  className="flex-1 py-2 rounded-xl bg-stone-900 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {copiedOtp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOtp ? "Copied!" : "Copy Code"}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Rajnandini Store Approval OTP: *${otpData.otp}* (Valid for ${otpData.secondsRemaining}s)`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-[#17100c] border border-amber-500/20 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  Pending Staff Price Requests ({pendingRequests.length})
                </h3>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-xs text-stone-500 py-3 text-center">Koi pending request nahi hai</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-stone-900 p-3 rounded-2xl border border-amber-500/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{req.productName}</span>
                        <span className="text-[10px] text-amber-400 font-mono">{req.sku}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-stone-400 line-through">₹{req.oldValue}</span>
                        <span className="text-emerald-400 font-bold">New: ₹{req.newValue}</span>
                        <span className="text-stone-500 text-[10px]">Reason: {req.reason}</span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleResolveRequest(req, "approved")}
                          disabled={isProcessingId === req.id}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleResolveRequest(req, "rejected")}
                          disabled={isProcessingId === req.id}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600/80 text-white text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log */}
            <div className="bg-[#17100c] border border-stone-800 rounded-3xl p-4 space-y-3">
              <h3 className="text-xs font-black uppercase text-stone-400 tracking-wider">
                Recent Audit History
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="text-xs border-b border-stone-800/60 pb-2">
                    <p className="font-bold text-stone-300">
                      {log.productName} ({log.sku})
                    </p>
                    <p className="text-[10px] text-stone-500">
                      ₹{log.oldValue} &rarr; ₹{log.newValue} • {log.reason} • by {log.staffName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          VIEW BILL MODAL POPUP
          ========================================================================= */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17100c] border border-amber-500/40 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">
                  Tax Invoice
                </span>
                <h3 className="text-base font-black font-mono text-white">{viewingBill.billNo}</h3>
              </div>
              <button
                onClick={() => setViewingBill(null)}
                className="p-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="text-xs bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-1">
              <p className="font-bold text-white">Customer: {viewingBill.customer?.name}</p>
              <p className="text-stone-400 font-mono">Mobile: {viewingBill.customer?.phone || "NA"}</p>
              <p className="text-[10px] text-stone-500">Date: {viewingBill.createdAt}</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase">
                Payment: {viewingBill.paymentMode}
              </p>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-stone-400">Items Purchased</span>
              {viewingBill.items?.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-stone-800/60"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-stone-200 truncate">{it.product?.name}</p>
                    <p className="text-[10px] text-stone-500 font-mono">
                      {it.quantity} pc @ ₹{it.price}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-stone-100">
                    ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Math */}
            <div className="pt-2 border-t border-stone-800 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal:</span>
                <span>₹{viewingBill.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {viewingBill.discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Discount:</span>
                  <span>-₹{viewingBill.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-amber-400 pt-1 border-t border-stone-800">
                <span className="font-sans">Grand Total:</span>
                <span>₹{viewingBill.grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setViewingBill(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 text-xs font-bold"
              >
                Close
              </button>
              {viewingBill.customer?.phone && viewingBill.customer.phone !== "NA" && (
                <a
                  href={`https://wa.me/91${viewingBill.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Namaste ${viewingBill.customer.name}! Thank you for shopping with Rajnandini Boutique. Your Invoice #${viewingBill.billNo} of ₹${viewingBill.grandTotal} is confirmed.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FIXED BOTTOM MOBILE NAVIGATION BAR (Native App Feel)
          ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#120c09]/95 backdrop-blur-lg border-t border-amber-500/30 px-3 py-2 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {[
            { id: "sales", label: "Daily Sales", icon: TrendingUp },
            { id: "stock", label: "Full Stock", icon: Package },
            { id: "bills", label: "All Bills", icon: Receipt },
            { id: "security", label: "Security & OTP", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeNav === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveNav(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition active:scale-95 ${
                  isActive ? "text-amber-400 font-bold" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition ${
                    isActive ? "bg-amber-400/15 shadow-sm shadow-amber-400/20" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
