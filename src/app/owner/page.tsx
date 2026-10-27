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
  Crown,
  Percent,
  BadgePercent,
  ArrowUpRight,
  Info,
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

// Helper for Indian currency compact representation (e.g. ₹44.57 Lakh, ₹28.04 Lakh)
function formatIndianCompact(val: number): string {
  if (!val || isNaN(val)) return "₹0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} Lakh`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

// Helper to identify salon/parlor services (labor/services with 999 dummy stock)
function isServiceItem(p: { sku?: string; category?: string; stock?: number; purchaseCost?: number }): boolean {
  const sku = (p.sku || "").toUpperCase();
  const category = (p.category || "").toLowerCase();
  const stock = Number(p.stock) || 0;
  const cost = Number(p.purchaseCost) || 0;

  if (sku.startsWith("SRV-") || category === "services") {
    return true;
  }
  // Dummy high stock services with no purchase cost
  if (stock >= 900 && cost === 0) {
    return true;
  }
  return false;
}

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

  // Accurate Physical Inventory Analytics (Filtering out 999 dummy stock services)
  const inventoryStats = useMemo(() => {
    let totalPcs = 0;
    let totalRetail = 0;
    let totalCost = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let physicalItemsCount = 0;
    let servicesCount = 0;

    products.forEach((p) => {
      if (isServiceItem(p)) {
        servicesCount++;
        return; // Exclude salon dummy 999 stock from showroom physical stock valuation
      }

      physicalItemsCount++;
      const s = Number(p.stock) || 0;
      totalPcs += s;
      totalRetail += s * (Number(p.price) || 0);
      totalCost += s * (Number(p.purchaseCost) || 0);

      if (s <= 0) outOfStock++;
      else if (s <= 2) lowStock++;
    });

    const potentialMargin = totalRetail - totalCost;
    const potentialMarginPct = totalRetail > 0 ? ((potentialMargin / totalRetail) * 100).toFixed(1) : "0.0";

    return {
      totalItems: physicalItemsCount,
      servicesCount,
      totalPcs,
      totalRetail,
      totalCost,
      potentialMargin,
      potentialMarginPct,
      outOfStock,
      lowStock,
      goodStock: Math.max(0, physicalItemsCount - outOfStock - lowStock),
    };
  }, [products]);

  // Filtered Products for Inventory View
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "services") {
          if (!isServiceItem(p)) return false;
        } else if (p.category !== selectedCategory) {
          return false;
        }
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
  // VIEW 0: PIN LOCK SCREEN (CLEAN LUXURY WHITE THEME)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center px-4 py-8 relative">
        <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
          {/* Top Royal Blue Insignia */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
            <Crown className="w-8 h-8 text-blue-600" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-700">
              Rajnandini Boutique
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
            Owner Executive Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Haridwar Showroom Realtime Portal</p>

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
                className="w-full text-center tracking-[0.4em] text-2xl font-black bg-slate-50 text-blue-700 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl py-3 px-4 outline-none placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-400 transition"
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
              <span>Remember this phone (Direct Unlock)</span>
            </label>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-600/25 active:scale-[0.98] transition text-sm tracking-wide"
            >
              Open Owner Dashboard →
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-5 font-mono">Default PIN: 7898 or Indu@123</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN MOBILE APPLICATION VIEW (CLEAN WHITE & ROYAL SAPPHIRE BLUE THEME)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-28 selection:bg-blue-600 selection:text-white">
      {/* Top Mobile App Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 font-black">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                  Rajnandini
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-600 font-mono tracking-tight">LIVE SYNC</span>
              </div>
              <h1 className="text-xs font-bold text-slate-900">Owner Executive Suite</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAllData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition shadow-sm"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>

            <button
              onClick={handleLock}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition shadow-sm"
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
                    ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/30"
                    : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
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
            {/* Primary Executive Sales Card */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    {timeFilter === "today"
                      ? "Aaj Ki Showroom Sales"
                      : timeFilter === "yesterday"
                      ? "Kal Ki Sales"
                      : timeFilter === "week"
                      ? "Pichhle 7 Din Ki Sales"
                      : timeFilter === "month"
                      ? "October Mahine Ki Sales"
                      : "All Time Showroom Sales"}
                  </span>
                </div>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                  {salesStats.count} Invoices
                </span>
              </div>

              {/* Total Revenue in tabular bold numbers */}
              <div className="mt-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight tabular-nums block">
                  ₹{salesStats.revenue.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                  {formatIndianCompact(salesStats.revenue)} Total Collection • {salesStats.itemsCount} Pcs Sold
                </span>
              </div>

              {/* Profit & Margin Row with clean separate boxes */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-2.5">
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                    Gross Profit (शुद्ध मुनाफा)
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 font-mono tabular-nums block mt-0.5">
                    +₹{salesStats.grossProfit.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {formatIndianCompact(salesStats.grossProfit)} Net
                  </span>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-2.5 text-right">
                  <span className="text-[10px] text-blue-800 uppercase font-semibold block">
                    Profit Margin (मार्जिन)
                  </span>
                  <span className="text-base sm:text-lg font-black text-blue-700 font-mono tabular-nums block mt-0.5">
                    {salesStats.marginPct}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Cost: {formatIndianCompact(salesStats.wholesaleCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Quick Stat Metric Cards (Crisp White & Distinct Accents) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Cash Collection */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Cash In Hand</span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1.5 tabular-nums truncate">
                  ₹{salesStats.cashTotal.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-emerald-700 font-semibold">Galla Cash</span>
                  <span className="text-slate-400 font-mono">{formatIndianCompact(salesStats.cashTotal)}</span>
                </div>
              </div>

              {/* UPI / Online */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">UPI / Online</span>
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                </div>
                <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1.5 tabular-nums truncate">
                  ₹{salesStats.upiTotal.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-blue-700 font-semibold">PhonePe / QR</span>
                  <span className="text-slate-400 font-mono">{formatIndianCompact(salesStats.upiTotal)}</span>
                </div>
              </div>

              {/* Total Discount Given */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Discount Given</span>
                  <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                </div>
                <p className="text-base sm:text-lg font-black text-rose-600 font-mono mt-1.5 tabular-nums truncate">
                  -₹{salesStats.discount.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-slate-500 font-semibold">Bargain Given</span>
                  <span className="text-rose-600 font-mono">
                    {salesStats.revenue > 0 ? ((salesStats.discount / (salesStats.revenue + salesStats.discount)) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Average Bill Value */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Avg Bill Value</span>
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                </div>
                <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1.5 tabular-nums truncate">
                  ₹{salesStats.avgBill.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-slate-500 font-semibold">Per Customer</span>
                  <span className="text-blue-600 font-mono">{salesStats.count} bills</span>
                </div>
              </div>
            </div>

            {/* Payment Mode Visual Split Bar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-800">Payment Breakdown</span>
                <span className="text-slate-500 text-[11px] font-mono">
                  Cash: {salesStats.revenue > 0 ? Math.round((salesStats.cashTotal / salesStats.revenue) * 100) : 0}% | UPI:{" "}
                  {salesStats.revenue > 0 ? Math.round((salesStats.upiTotal / salesStats.revenue) * 100) : 0}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${salesStats.revenue > 0 ? (salesStats.cashTotal / salesStats.revenue) * 100 : 50}%`,
                  }}
                  title="Cash"
                />
                <div
                  className="bg-blue-600 h-full transition-all"
                  style={{
                    width: `${salesStats.revenue > 0 ? (salesStats.upiTotal / salesStats.revenue) * 100 : 50}%`,
                  }}
                  title="UPI"
                />
              </div>
            </div>

            {/* Top 10 Fast-Selling Items */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Fast-Selling Showroom Items
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ranked by Revenue</span>
              </div>

              {topSellingItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Is samay me koi sale record nahi hui</p>
              ) : (
                <div className="space-y-2">
                  {topSellingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                        <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 font-mono">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.sku} • <span className="text-blue-600 font-bold">{item.qty} pcs</span> sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 font-mono tabular-nums block">
                          ₹{item.revenue.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {formatIndianCompact(item.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: 📦 FULL STOCK & INVENTORY STATUS (ACCURATE ~₹44.57 LAKH PHYSICAL VALUATION)
            ========================================================================= */}
        {activeNav === "stock" && (
          <div className="space-y-4">
            {/* Stock Overview Hero Card with Clean White Layout */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-4">
              {/* Title & Total Pcs Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Showroom Physical Stock Valuation
                  </span>
                </div>
                <span className="text-xs font-bold font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                  {inventoryStats.totalPcs.toLocaleString("en-IN")} Physical Pcs
                </span>
              </div>

              {/* Primary Metric: Total Physical Retail Value (Accurate ~₹44.57 Lakhs, No Services dummy) */}
              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/50 border border-blue-100 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Total Showroom Stock Retail Value (दुकान का कुल स्टॉक बिक्री मूल्य)
                </span>
                <div className="flex items-baseline gap-2 flex-wrap mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
                    ₹{inventoryStats.totalRetail.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200 font-mono">
                    {formatIndianCompact(inventoryStats.totalRetail)} Physical Stock
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1 font-medium">
                  {inventoryStats.totalItems} physical products • {inventoryStats.totalPcs} total items on hangers/shelves
                </span>
              </div>

              {/* Wholesale Cost & Profit Potential in distinct cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Wholesale Cost */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Wholesale Cost (खरीद लागत)
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 font-mono tabular-nums block mt-0.5">
                    ₹{inventoryStats.totalCost.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {formatIndianCompact(inventoryStats.totalCost)}
                  </span>
                </div>

                {/* Potential Margin */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 shadow-sm">
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                    Estimated Profit (संभावित मुनाफा)
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 font-mono tabular-nums block mt-0.5">
                    +₹{inventoryStats.potentialMargin.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono mt-0.5 block">
                    {formatIndianCompact(inventoryStats.potentialMargin)} ({inventoryStats.potentialMarginPct}%)
                  </span>
                </div>
              </div>

              {/* Stock Status Badges */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-semibold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-mono font-black">{inventoryStats.outOfStock}</span>
                  <span className="text-[11px]">Khatam (0 pcs)</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-mono font-black">{inventoryStats.lowStock}</span>
                  <span className="text-[11px]">Low Stock (&le; 2 pcs)</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-mono font-black">{inventoryStats.goodStock}</span>
                  <span className="text-[11px]">Good Stock</span>
                </div>
              </div>
            </div>

            {/* Search & Stock Filter Bar */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Search item name, SKU, or Barcode..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 shadow-sm transition"
                />
                {stockSearch && (
                  <button
                    onClick={() => setStockSearch("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Stock Health Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                {[
                  { id: "all", label: `Sabhi Items (${inventoryStats.totalItems})` },
                  { id: "low", label: `⚠️ Low Stock (${inventoryStats.lowStock})` },
                  { id: "out", label: `🔴 Khatam (${inventoryStats.outOfStock})` },
                  { id: "good", label: `🟢 Good Stock (${inventoryStats.goodStock})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStockStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                      stockStatusFilter === f.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
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
                  "services",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? "bg-slate-800 text-white font-bold"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Item Cards List (Clean White Cards with Zero Squishing) */}
            <div className="space-y-2.5">
              <span className="text-[11px] text-slate-500 font-semibold block px-1">
                Showing {filteredProducts.length} items
              </span>

              {filteredProducts.slice(0, 50).map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= 2;
                const isService = isServiceItem(p);

                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 shadow-sm hover:border-blue-300 transition"
                  >
                    {/* Top Row: Category, SKU, and Stock Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 tracking-wider">
                            {p.category}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {p.sku}
                          </span>
                          {p.badge && (
                            <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">{p.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Barcode: {p.barcode}</p>
                      </div>

                      {/* Stock Quantity Badge */}
                      <span
                        className={`text-[11px] font-bold font-mono px-2.5 py-1 rounded-xl shrink-0 shadow-sm ${
                          isService
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : isOutOfStock
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : isLowStock
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isService ? "Service" : `${p.stock} pcs`}
                      </span>
                    </div>

                    {/* Price & Cost Row with clear spacing and zero overlap */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-blue-700 font-mono tabular-nums">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                        {p.mrp > p.price && (
                          <span className="text-[10px] text-slate-400 line-through font-mono">
                            ₹{p.mrp.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500">
                          Cost: <span className="font-mono text-slate-700 font-bold">₹{p.purchaseCost || 0}</span>
                        </span>
                        {p.price > p.purchaseCost && (
                          <span className="text-[10px] text-emerald-600 font-bold ml-1.5 font-mono">
                            (+₹{p.price - (p.purchaseCost || 0)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length > 50 && (
                <p className="text-center text-xs text-slate-400 py-3 font-mono">
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
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={billsSearch}
                  onChange={(e) => setBillsSearch(e.target.value)}
                  placeholder="Search Bill #, Customer Name, or Phone..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 shadow-sm transition"
                />
                {billsSearch && (
                  <button
                    onClick={() => setBillsSearch("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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
                        ? "bg-blue-600 text-white font-bold shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200"
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
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-3.5 space-y-2 transition cursor-pointer active:scale-[0.99] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-700">{bill.billNo}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-md font-mono ${
                        bill.paymentMode === "cash"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {bill.paymentMode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{bill.customer?.name || "Walk-in Guest"}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {bill.customer?.phone && bill.customer.phone !== "NA" ? bill.customer.phone : "No Phone"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black text-slate-900 font-mono tabular-nums">
                        ₹{bill.grandTotal.toLocaleString("en-IN")}
                      </p>
                      <span className="text-[10px] text-slate-400">{bill.createdAt}</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[220px]">
                      {bill.items?.length || 0} items:{" "}
                      {bill.items?.map((it) => it.product?.name).filter(Boolean).slice(0, 2).join(", ")}
                      {(bill.items?.length || 0) > 2 ? "..." : ""}
                    </span>
                    <span className="text-blue-600 text-[10px] font-bold flex items-center gap-0.5 shrink-0">
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
            <div className="bg-white border border-slate-200 rounded-3xl p-5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Staff Override Dynamic OTP
                </span>
              </div>
              <h2 className="text-xs text-slate-500 mt-0.5">Tell this code to counter staff for price override</h2>

              <div className="my-5">
                <span className="font-mono text-4xl sm:text-5xl font-black text-blue-700 tracking-[0.25em] tabular-nums">
                  {otpData.otp}
                </span>
              </div>

              {/* Progress Bar & Timer */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2 border border-slate-200">
                <div
                  className="bg-blue-600 h-full transition-all duration-1000"
                  style={{ width: `${(otpData.secondsRemaining / otpData.totalSeconds) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Changes in {otpData.secondsRemaining} seconds
              </span>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(otpData.otp);
                    setCopiedOtp(true);
                    setTimeout(() => setCopiedOtp(false), 2000);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition"
                >
                  {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedOtp ? "Copied!" : "Copy Code"}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Rajnandini Store Approval OTP: *${otpData.otp}* (Valid for ${otpData.secondsRemaining}s)`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-slate-900 tracking-wider">
                  Pending Staff Price Requests ({pendingRequests.length})
                </h3>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Koi pending request nahi hai</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{req.productName}</span>
                        <span className="text-[10px] text-blue-700 font-mono">{req.sku}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-400 line-through">₹{req.oldValue}</span>
                        <span className="text-emerald-700 font-bold">New: ₹{req.newValue}</span>
                        <span className="text-slate-500 text-[10px]">Reason: {req.reason}</span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleResolveRequest(req, "approved")}
                          disabled={isProcessingId === req.id}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleResolveRequest(req, "rejected")}
                          disabled={isProcessingId === req.id}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-sm"
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
            <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Recent Audit History
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="text-xs border-b border-slate-100 pb-2">
                    <p className="font-bold text-slate-800">
                      {log.productName} ({log.sku})
                    </p>
                    <p className="text-[10px] text-slate-500">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                  Tax Invoice Slip
                </span>
                <h3 className="text-base font-bold font-mono text-slate-900">{viewingBill.billNo}</h3>
              </div>
              <button
                onClick={() => setViewingBill(null)}
                className="p-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900">Customer: {viewingBill.customer?.name}</p>
              <p className="text-slate-600 font-mono">Mobile: {viewingBill.customer?.phone || "NA"}</p>
              <p className="text-[10px] text-slate-400">Date: {viewingBill.createdAt}</p>
              <p className="text-[10px] text-emerald-700 font-bold uppercase font-mono">
                Payment Mode: {viewingBill.paymentMode}
              </p>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Items Purchased</span>
              {viewingBill.items?.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-slate-800 truncate">{it.product?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {it.quantity} pc @ ₹{it.price}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Math */}
            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>₹{viewingBill.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {viewingBill.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-₹{viewingBill.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-100">
                <span className="font-sans font-bold">Grand Total:</span>
                <span className="tabular-nums">₹{viewingBill.grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setViewingBill(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold"
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
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
          FIXED BOTTOM MOBILE NAVIGATION BAR (CLEAN WHITE DOCK)
          ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-3 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
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
                  isActive ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition ${
                    isActive ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
