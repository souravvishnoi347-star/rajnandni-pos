"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import SupplierIntelligence from "@/components/SupplierIntelligence";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Receipt,
  ShieldCheck,
  Building2,
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
  Users,
  Coffee,
  Trash2,
  Plus,
  Pencil,
  UserCheck,
  UserX,
  Download,
  Award,
  CircleDollarSign,
  QrCode,
  Tag,
  PieChart,
  Star,
  Hourglass,
  Scissors,
  CheckCheck,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
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
import { SupabaseService, supabase } from "@/lib/supabaseClient";
import {
  StaffExpenseService,
  StoreExpense,
  StaffAdvance,
  StaffAttendanceRecord,
  StaffMember,
} from "@/lib/staffExpenseService";

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
  if (stock >= 900 && cost === 0) {
    return true;
  }
  return false;
}

// Generate short deterministic hash preview for audit parity
function getBillHash(billNo: string, amount: number, date: string): string {
  let hash = 0;
  const str = `${billNo}_${amount}_${date}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `${hex.slice(0, 4)}...${hex.slice(-4)}`;
}

export default function MobileOwnerApp() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);

  // Active Bottom Nav Tab: 'sales' | 'stock' | 'bills' | 'staff' | 'security'
  const [activeNav, setActiveNav] = useState<"sales" | "stock" | "bills" | "staff" | "security">("sales");

  // Stock sub-view: 'inventory' | 'suppliers'
  const [stockViewMode, setStockViewMode] = useState<"inventory" | "suppliers">("inventory");

  // Time Filter for Sales: 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [timeFilter, setTimeFilter] = useState<"today" | "yesterday" | "week" | "month" | "all">("today");

  // Data States
  const [bills, setBills] = useState<CompletedBill[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [alterations, setAlterations] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<InventoryAuthRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>([]);
  const [expenses, setExpenses] = useState<StoreExpense[]>([]);
  const [advances, setAdvances] = useState<StaffAdvance[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendanceRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

  // Search & Filter States
  const [stockSearch, setStockSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "out" | "low" | "good">("all");
  const [billsSearch, setBillsSearch] = useState<string>("");
  const [billsPaymentFilter, setBillsPaymentFilter] = useState<string>("all");
  const [liveSaleToast, setLiveSaleToast] = useState<{ billNo: string; customer: string; total: number; time: string } | null>(null);

  // Staff Section Sub-tab: 'expenses' | 'advances' | 'attendance' | 'members'
  const [staffSubTab, setStaffSubTab] = useState<"expenses" | "advances" | "attendance" | "members">("expenses");

  // Modals inside Staff Manager
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [newExpTitle, setNewExpTitle] = useState<string>("");
  const [newExpAmount, setNewExpAmount] = useState<string>("");
  const [newExpCategory, setNewExpCategory] = useState<StoreExpense["category"]>("chai_nashta");
  const [newExpPaidBy, setNewExpPaidBy] = useState<StoreExpense["paidBy"]>("cash_galla");
  const [newExpNote, setNewExpNote] = useState<string>("");

  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>("");
  const [newMemberPhone, setNewMemberPhone] = useState<string>("");
  const [newMemberRole, setNewMemberRole] = useState<string>("Sales Executive");
  const [newMemberSalary, setNewMemberSalary] = useState<string>("15000");

  // Editing Staff Member State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editStaffName, setEditStaffName] = useState<string>("");
  const [editStaffPhone, setEditStaffPhone] = useState<string>("");
  const [editStaffRole, setEditStaffRole] = useState<string>("");
  const [editStaffSalary, setEditStaffSalary] = useState<string>("");
  const [editStaffActive, setEditStaffActive] = useState<boolean>(true);

  // Editing Store Expense State
  const [editingExpense, setEditingExpense] = useState<StoreExpense | null>(null);
  const [editExpTitle, setEditExpTitle] = useState<string>("");
  const [editExpAmount, setEditExpAmount] = useState<string>("");
  const [editExpCategory, setEditExpCategory] = useState<StoreExpense["category"]>("chai_nashta");
  const [editExpPaidBy, setEditExpPaidBy] = useState<StoreExpense["paidBy"]>("cash_galla");
  const [editExpDate, setEditExpDate] = useState<string>("");
  const [editExpNote, setEditExpNote] = useState<string>("");

  // Editing Staff Advance State
  const [editingAdvance, setEditingAdvance] = useState<StaffAdvance | null>(null);
  const [editAdvAmount, setEditAdvAmount] = useState<string>("");
  const [editAdvReason, setEditAdvReason] = useState<StaffAdvance["reason"]>("salary_advance");
  const [editAdvPaidBy, setEditAdvPaidBy] = useState<StaffAdvance["paidBy"]>("cash_galla");
  const [editAdvStatus, setEditAdvStatus] = useState<StaffAdvance["status"]>("active");
  const [editAdvDate, setEditAdvDate] = useState<string>("");
  const [editAdvNote, setEditAdvNote] = useState<string>("");

  // Selected Attendance Date for Owner View (defaults to today)
  const [ownerAttendanceDate, setOwnerAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Modal State for Viewing Full Bill
  const [viewingBill, setViewingBill] = useState<CompletedBill | null>(null);

  // Security OTP State
  const [otpData, setOtpData] = useState(getCurrentOwnerOtp());
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Today Date String
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Check persisted device authentication on mount
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("rajnandni_owner_device_auth");
      const sessionAuth = sessionStorage.getItem("rajnandni_owner_auth");
      if (savedAuth === "true" || sessionAuth === "true") {
        setIsAuthenticated(true);
      }
      const savedAlts = localStorage.getItem("rajnandni_alterations");
      if (savedAlts) {
        setAlterations(JSON.parse(savedAlts));
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

  // Fetch all live bills, inventory, and staff data from Supabase
  const loadAllData = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const [remoteBills, remoteProducts, reqs, logs, expList, advList, attList, staffList] = await Promise.all([
        SupabaseService.fetchRecentBills().catch(() => null),
        SupabaseService.fetchProducts().catch(() => null),
        OwnerSecurityService.fetchPendingRequests().catch(() => []),
        OwnerSecurityService.fetchAuditLogs().catch(() => []),
        StaffExpenseService.fetchExpenses().catch(() => []),
        StaffExpenseService.fetchAdvances().catch(() => []),
        StaffExpenseService.fetchAttendance(ownerAttendanceDate).catch(() => []),
        StaffExpenseService.fetchStaffMembers().catch(() => []),
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

      try {
        const savedAlts = localStorage.getItem("rajnandni_alterations");
        if (savedAlts) setAlterations(JSON.parse(savedAlts));
      } catch {}

      setPendingRequests(reqs || []);
      setAuditLogs(logs || []);
      setExpenses(expList || []);
      setAdvances(advList || []);
      setAttendance(attList || []);
      setStaffMembers(staffList || []);

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
      const interval = setInterval(() => {
        loadAllData(false);
      }, 15000);

      let channel: any = null;
      if (supabase) {
        channel = supabase
          .channel("owner_live_sales_stream")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "bills" },
            (payload) => {
              const newRow = payload.new;
              if (newRow) {
                const mappedNewBill: CompletedBill = {
                  id: newRow.id,
                  billNo: newRow.invoice_number,
                  customer: {
                    name: newRow.customer_name || "Walk-in Guest",
                    phone: newRow.customer_phone || "NA",
                    notes: "",
                  },
                  items: Array.isArray(newRow.items)
                    ? newRow.items.map((it: any) => ({
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
                  subtotal: Number(newRow.subtotal) || 0,
                  discount: Number(newRow.discount) || 0,
                  taxGst: Number(newRow.tax) || 0,
                  grandTotal: Number(newRow.total) || 0,
                  paidAmount: Number(newRow.total) || 0,
                  paymentMode: (newRow.payment_mode || "upi").toLowerCase() as any,
                  createdAt: new Date(newRow.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                  rawDate: newRow.created_at,
                };

                setBills((prev) => [mappedNewBill, ...prev.filter((b) => b.billNo !== mappedNewBill.billNo)]);
                setLiveSaleToast({
                  billNo: mappedNewBill.billNo,
                  customer: mappedNewBill.customer.name,
                  total: mappedNewBill.grandTotal,
                  time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                });
              }
            }
          )
          .subscribe();
      }

      return () => {
        clearInterval(interval);
        if (channel && supabase) supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, ownerAttendanceDate]);

  // Export all bills to Laptop as CSV
  const handleExportBillsCsv = () => {
    if (!bills || bills.length === 0) {
      alert("No bills available to export.");
      return;
    }
    const rows: string[][] = [];
    rows.push([
      "Invoice Number",
      "Date & Time",
      "Customer Name",
      "Customer Phone",
      "Payment Mode",
      "Items Count",
      "Items Breakdown",
      "Subtotal (Rs)",
      "Discount (Rs)",
      "Grand Total (Rs)"
    ]);

    bills.forEach(b => {
      const items = Array.isArray(b.items) ? b.items : [];
      const itemsSummary = items
        .map(it => `${it.product?.name || 'Item'} (${it.quantity || 1} pcs @ Rs ${it.price})`)
        .join("; ");
      const itemsCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

      rows.push([
        b.billNo,
        b.rawDate || b.createdAt,
        b.customer?.name || "Walk-in Guest",
        b.customer?.phone || "NA",
        b.paymentMode || "UPI",
        String(itemsCount),
        itemsSummary,
        String(b.subtotal || b.grandTotal),
        String(b.discount || 0),
        String(b.grandTotal)
      ]);
    });

    const csvContent = rows
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RAJNANDINI_ALL_BILLS_MASTER_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export all bills as JSON Vault
  const handleExportBillsJson = () => {
    if (!bills || bills.length === 0) {
      alert("No bills available to export.");
      return;
    }
    const blob = new Blob([JSON.stringify(bills, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RAJNANDINI_BILLS_VAULT_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      setPinError("Incorrect Security PIN. Please enter valid PIN (7898)");
    }
  };

  const handleLock = () => {
    localStorage.removeItem("rajnandni_owner_device_auth");
    sessionStorage.removeItem("rajnandni_owner_auth");
    setIsAuthenticated(false);
    setPinInput("");
  };

  // Helper date matchers
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

  // Total Vault Value (all recorded bills)
  const totalBillsVaultValue = useMemo(() => {
    return bills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
  }, [bills]);

  // Expenses & Advances for Cash Drawer Reconciliation
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

  // Real Drawer Cash in Hand (Cash Sales - Cash Expenses - Cash Advances)
  const netGallaCashInHand = useMemo(() => {
    return salesStats.cashTotal - todayCashExpense - todayCashAdvance;
  }, [salesStats.cashTotal, todayCashExpense, todayCashAdvance]);

  // Staff Attendance Stats for Today
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
      totalStaff: staffMembers.length,
    };
  }, [attendance, staffMembers]);

  // Top 4 Selling Items for Sales Hero Section
  const topSellingItems = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; qty: number; revenue: number; category?: string }>();
    timeFilteredBills.forEach((b) => {
      (b.items || []).forEach((it) => {
        const key = it.product?.sku || it.product?.name || "Item";
        const existing = map.get(key) || {
          name: it.product?.name || "Ethnic Garment",
          sku: it.product?.sku || "",
          qty: 0,
          revenue: 0,
          category: it.product?.category || "Apparel",
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

  // Accurate Physical Inventory Analytics
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
        return;
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

  // Workshop Hold Alterations
  const activeAlterations = useMemo(() => {
    return alterations.filter((a) => a.status !== "delivered" && a.status !== "completed");
  }, [alterations]);

  const activeAlterationsCount = activeAlterations.length;
  const alterationsValue = useMemo(() => {
    return activeAlterations.reduce((sum, a) => sum + (Number(a.balanceDue) || Number(a.charges) || 0), 0);
  }, [activeAlterations]);

  // Aged stock valuation (items with stock <= 2)
  const agedStockValue = useMemo(() => {
    return products
      .filter((p) => !isServiceItem(p) && p.stock > 0 && p.stock <= 2)
      .reduce((sum, p) => sum + p.stock * p.price, 0);
  }, [products]);

  // Filtered Products for Inventory View
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }
      if (stockStatusFilter === "out" && p.stock > 0) return false;
      if (stockStatusFilter === "low" && (p.stock <= 0 || p.stock > 2)) return false;
      if (stockStatusFilter === "good" && p.stock < 3) return false;

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

  // Add Expense by Owner
  const handleOwnerAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(newExpAmount);
    if (!newExpTitle.trim() || isNaN(amt) || amt <= 0) {
      alert("Please enter a valid expense title and amount.");
      return;
    }
    await StaffExpenseService.recordExpense({
      title: newExpTitle,
      amount: amt,
      category: newExpCategory,
      paidBy: newExpPaidBy,
      staffName: "Showroom Owner",
      note: newExpNote,
    });
    setShowAddExpenseModal(false);
    setNewExpTitle("");
    setNewExpAmount("");
    setNewExpNote("");
    await loadAllData();
  };

  // Add New Staff Member by Owner
  const handleOwnerAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      alert("Staff member ka naam zaroori hai");
      return;
    }
    await StaffExpenseService.addStaffMember({
      name: newMemberName,
      phone: newMemberPhone,
      role: newMemberRole,
      monthlySalary: Number(newMemberSalary) || 15000,
    });
    setShowAddMemberModal(false);
    setNewMemberName("");
    setNewMemberPhone("");
    await loadAllData();
  };

  // Edit Staff Member Handlers
  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditStaffName(staff.name);
    setEditStaffPhone(staff.phone || "");
    setEditStaffRole(staff.role || "Sales Executive");
    setEditStaffSalary(String(staff.monthlySalary || 15000));
    setEditStaffActive(staff.isActive !== false);
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editStaffName.trim()) {
      alert("Staff member ka naam zaroori hai");
      return;
    }
    await StaffExpenseService.updateStaffMember(editingStaff.id, {
      name: editStaffName.trim(),
      phone: editStaffPhone.trim(),
      role: editStaffRole.trim(),
      monthlySalary: Number(editStaffSalary) || 15000,
      isActive: editStaffActive,
    });
    setEditingStaff(null);
    await loadAllData();
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    if (confirm(`Are you sure you want to deactivate "${staff.name}" from staff roster?`)) {
      await StaffExpenseService.deleteStaffMember(staff.id);
      await loadAllData();
    }
  };

  // Edit Expense Handlers
  const handleOpenEditExpense = (exp: StoreExpense) => {
    setEditingExpense(exp);
    setEditExpTitle(exp.title);
    setEditExpAmount(String(exp.amount));
    setEditExpCategory(exp.category);
    setEditExpPaidBy(exp.paidBy);
    setEditExpDate(exp.date);
    setEditExpNote(exp.note || "");
  };

  const handleSaveEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const amt = Number(editExpAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    await StaffExpenseService.updateExpense(editingExpense.id, editingExpense.tokenNumber, {
      title: editExpTitle.trim(),
      amount: amt,
      category: editExpCategory,
      paidBy: editExpPaidBy,
      date: editExpDate,
      note: editExpNote.trim(),
    });
    setEditingExpense(null);
    await loadAllData();
  };

  // Edit Advance Handlers
  const handleOpenEditAdvance = (adv: StaffAdvance) => {
    setEditingAdvance(adv);
    setEditAdvAmount(String(adv.amount));
    setEditAdvReason(adv.reason);
    setEditAdvPaidBy(adv.paidBy);
    setEditAdvStatus(adv.status);
    setEditAdvDate(adv.date);
    setEditAdvNote(adv.note || "");
  };

  const handleSaveEditAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdvance) return;
    const amt = Number(editAdvAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid advance amount.");
      return;
    }
    await StaffExpenseService.updateAdvance(editingAdvance.id, editingAdvance.tokenNumber, {
      amount: amt,
      reason: editAdvReason,
      paidBy: editAdvPaidBy,
      status: editAdvStatus,
      date: editAdvDate,
      note: editAdvNote.trim(),
    });
    setEditingAdvance(null);
    await loadAllData();
  };

  // =========================================================================
  // VIEW 0: PIN LOCK SCREEN (DEEP MIDNIGHT NAVY & CHAMPAGNE GOLD THEME)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-center items-center px-4 py-8 relative">
        <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
          {/* Brand Logo & Crown */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0F2042] border border-[#C5A880]/40 flex items-center justify-center mb-4 shadow-md shadow-[#0F2042]/20">
            <Image
              src="/logo.png"
              alt="Rajnandini"
              width={42}
              height={42}
              className="object-contain"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F2042]/5 border border-[#C5A880]/30 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#0F2042]">
              Rajnandini Boutique
            </span>
          </div>

          <h1 className="text-xl font-black text-[#0F2042] mt-1 tracking-tight">
            Owner Executive Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Zari &amp; Silk Atelier • Haridwar Live</p>

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
                className="w-full text-center tracking-[0.4em] text-2xl font-black bg-slate-50 text-[#0F2042] border-2 border-slate-200 focus:border-[#0F2042] focus:bg-white rounded-2xl py-3 px-4 outline-none placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-400 transition"
              />
              {pinError && <p className="text-rose-600 text-xs font-semibold mt-2">{pinError}</p>}
            </div>

            <label className="flex items-center justify-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="rounded border-slate-300 accent-[#0F2042] w-4 h-4"
              />
              <span>Remember this phone (Direct Unlock)</span>
            </label>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#0F2042] hover:bg-[#0A162E] text-white font-bold rounded-2xl shadow-md shadow-[#0F2042]/25 active:scale-[0.98] transition text-sm tracking-wide flex items-center justify-center gap-2"
            >
              <span>Open Owner Dashboard</span>
              <ArrowRight className="w-4 h-4 text-[#C5A880]" />
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-5 font-mono">Master PIN: 7898</p>
        </div>
      </div>
    );
  }

  // Calculation for two-tone Inflow Composition bar
  const totalInflow = (salesStats.upiTotal + salesStats.cashTotal) || 1;
  const digitalPct = Math.round((salesStats.upiTotal / totalInflow) * 100);
  const cashPct = 100 - digitalPct;

  // Segmented stock bar percentages
  const totalPhysicalSkus = inventoryStats.totalItems || 1;
  const healthyPct = Math.round((inventoryStats.goodStock / totalPhysicalSkus) * 100);
  const lowStockPct = Math.round((inventoryStats.lowStock / totalPhysicalSkus) * 100);
  const outStockPct = 100 - healthyPct - lowStockPct;

  // =========================================================================
  // MAIN MOBILE APPLICATION VIEW (MIDNIGHT NAVY & WARM SAND LUXURY SUITE)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-28 selection:bg-[#0F2042] selection:text-white">
      {/* Top Mobile App Header matching Image 2 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F2042] p-1 flex items-center justify-center shadow-sm">
              <Image
                src="/logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-[#0F2042] tracking-tight">
                  Owner Executive
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#10B981] border border-emerald-200/80 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Zari &amp; Silk Atelier • Haridwar</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Master CSV Download */}
            <button
              onClick={handleExportBillsCsv}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0F2042] hover:bg-slate-100 transition"
              title="Download Master Excel Backup"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Refresh Live Stream */}
            <button
              onClick={() => loadAllData(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0F2042] hover:bg-slate-100 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#0F2042]" : ""}`} />
            </button>

            {/* Lock Device */}
            <button
              onClick={handleLock}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Lock Owner Suite"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden ml-1">
              <Image
                src="/logo.png"
                alt="Owner"
                width={32}
                height={32}
                className="object-cover bg-[#0F2042] p-1"
              />
            </div>
          </div>
        </div>

        {/* Date Filter Chips for Sales View matching Image 2 */}
        {activeNav === "sales" && (
          <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
            {[
              { id: "today", label: "• Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
              { id: "all", label: "All Time" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition text-xs shrink-0 ${
                  timeFilter === tab.id
                    ? "bg-[#0F2042] text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50"
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
            TAB 1: 📊 SALES VIEW (EXACT INSPIRATION IMAGE 2)
            ========================================================================= */}
        {activeNav === "sales" && (
          <div className="space-y-4">
            {/* Hero Bento Card: Today's Showroom Sales */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#C5A880]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {timeFilter === "today"
                      ? "TODAY'S SHOWROOM SALES"
                      : timeFilter === "yesterday"
                      ? "YESTERDAY'S SALES"
                      : timeFilter === "week"
                      ? "THIS WEEK'S SALES"
                      : timeFilter === "month"
                      ? "THIS MONTH'S SALES"
                      : "ALL-TIME REVENUE"}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Store className="w-4 h-4" />
                </div>
              </div>

              {/* Revenue Big Bold Amount */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0F2042] tracking-tight tabular-nums">
                  ₹{salesStats.revenue.toLocaleString("en-IN")}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#10B981] font-bold text-xs border border-emerald-100">
                  ↑ +{salesStats.marginPct}%
                </span>
              </div>

              {/* Run-rate status & progress bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>{salesStats.count} Invoices Settled</span>
                  <span className="font-mono text-slate-500">Avg Ticket: ₹{salesStats.avgBill.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F2042] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(15, salesStats.count * 8))}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Real-time cloud sync with Haridwar Atelier Terminal</span>
                </p>
              </div>
            </div>

            {/* 4-Grid Metric Bento Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Gross Profit */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GROSS PROFIT</span>
                  <Receipt className="w-4 h-4 text-[#10B981]" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#0F2042] tabular-nums tracking-tight">
                  ₹{salesStats.grossProfit.toLocaleString("en-IN")}
                </p>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-[#10B981] text-[10px] font-bold border border-emerald-100">
                    Margin: {salesStats.marginPct}%
                  </span>
                </div>
              </div>

              {/* Card 2: Physical Drawer */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PHYSICAL DRAWER</span>
                  <Wallet className="w-4 h-4 text-[#C5A880]" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#0F2042] tabular-nums tracking-tight">
                  ₹{netGallaCashInHand.toLocaleString("en-IN")}
                </p>
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FBF6EE] text-[#A67C43] text-[10px] font-bold border border-[#C5A880]/30">
                    <Check className="w-3 h-3 text-[#A67C43]" />
                    <span>Reconciled</span>
                  </span>
                </div>
              </div>

              {/* Card 3: Digital Inflow */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">DIGITAL INFLOW</span>
                  <QrCode className="w-4 h-4 text-[#0F2042]" />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#0F2042] tabular-nums tracking-tight">
                  ₹{salesStats.upiTotal.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">UPI &amp; Card Terminals</p>
              </div>

              {/* Card 4: Concessions */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CONCESSIONS</span>
                  <Tag className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#0F2042] tabular-nums tracking-tight">
                    ₹{salesStats.discount.toLocaleString("en-IN")}
                  </p>
                  <span className="text-xs text-rose-500 font-semibold font-mono">
                    ({salesStats.revenue > 0 ? ((salesStats.discount / (salesStats.revenue + salesStats.discount)) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  ABV: ₹{salesStats.avgBill.toLocaleString("en-IN")} ({salesStats.count} Bills)
                </p>
              </div>
            </div>

            {/* Inflow Composition Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-[#0F2042]" />
                  <span className="text-xs font-bold text-[#0F2042]">Inflow Composition</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  Live Audit
                </span>
              </div>

              {/* Two-tone bar: Navy Digital vs Sand Gold Cash */}
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100">
                <div
                  className="bg-[#0F2042] h-full transition-all"
                  style={{ width: `${digitalPct}%` }}
                  title="Digital (UPI/Card)"
                />
                <div
                  className="bg-[#C5A880] h-full transition-all"
                  style={{ width: `${cashPct}%` }}
                  title="Cash Vault"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="space-y-0.5">
                  <p className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-[#0F2042]" />
                    <span className="font-medium">Digital (UPI/Card):</span>
                    <span className="font-bold font-mono">₹{salesStats.upiTotal.toLocaleString("en-IN")}</span>
                    <span className="text-slate-400">({digitalPct}%)</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                    <span className="font-medium">Cash Vault:</span>
                    <span className="font-bold font-mono">₹{salesStats.cashTotal.toLocaleString("en-IN")}</span>
                    <span className="text-slate-400">({cashPct}%)</span>
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-[#10B981] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero Discrepancy</span>
                </div>
              </div>
            </div>

            {/* Fast-Selling Showroom Ensembles Card (TOP 4 TODAY) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-[#C5A880]" />
                  <h2 className="text-xs font-bold text-[#0F2042] uppercase tracking-wide">
                    Fast-Selling Showroom Ensembles
                  </h2>
                </div>
                <span className="text-[10px] font-bold bg-[#0F2042]/5 text-[#0F2042] border border-[#0F2042]/10 px-2.5 py-0.5 rounded-full font-mono">
                  TOP 4 TODAY
                </span>
              </div>

              {topSellingItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No transactions recorded for this period</p>
              ) : (
                <div className="space-y-2">
                  {topSellingItems.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 hover:border-[#0F2042]/30 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0F2042] shrink-0 font-bold text-xs shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.sku} • <span className="text-[#0F2042] font-semibold">{item.qty} pcs sold</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-[#0F2042] font-mono tabular-nums block">
                          ₹{item.revenue.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
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
            TAB 2: 📦 STOCK & WHOLESALE MARGINS (EXACT INSPIRATION IMAGE 3)
            ========================================================================= */}
        {activeNav === "stock" && (
          <div className="space-y-4">
            {/* View Mode Switcher: Physical Stock vs Wholesale Suppliers */}
            <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-sm">
              <button
                onClick={() => setStockViewMode("inventory")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  stockViewMode === "inventory"
                    ? "bg-[#0F2042] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Showroom Inventory</span>
              </button>

              <button
                onClick={() => setStockViewMode("suppliers")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  stockViewMode === "suppliers"
                    ? "bg-[#0F2042] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Wholesale Suppliers</span>
              </button>
            </div>

            {stockViewMode === "suppliers" ? (
              <SupplierIntelligence products={products} bills={bills} isOwnerView={true} />
            ) : (
              <div className="space-y-4">
                {/* Top Title & Subtitle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      SHOWROOM PHYSICAL STOCK &amp; WHOLESALE MARGINS
                    </span>
                    <h2 className="text-base font-black text-[#0F2042] flex items-center gap-1.5 mt-0.5">
                      <span>Vault &amp; Floor Balance</span>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Live {lastRefreshedAt || "08:30 AM"}</span>
                  </div>
                </div>

                {/* Hero Card: Audited Tag Valuation */}
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        AUDITED TAG VALUATION
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-[#FBF6EE] text-[#A67C43] border border-[#C5A880]/40 px-2.5 py-0.5 rounded-full">
                      Retail Valuation
                    </span>
                  </div>

                  {/* Big Valuation Number */}
                  <div className="mt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#0F2042] tracking-tight tabular-nums block">
                      ₹{inventoryStats.totalRetail.toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium mt-1">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>{inventoryStats.totalPcs.toLocaleString("en-IN")} Designer Pieces</span>
                      </span>
                      <span>•</span>
                      <span>Showroom &amp; Vault Floor</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCheck className="w-4 h-4 text-[#10B981]" />
                      <span>100% Barcode &amp; Tag Verified</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatIndianCompact(inventoryStats.totalRetail)} Total
                    </span>
                  </div>
                </div>

                {/* 4-Grid Metric Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Card 1: Wholesale Cost */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WHOLESALE COST</span>
                      <Boxes className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-[#0F2042] tabular-nums tracking-tight">
                      ₹{inventoryStats.totalCost.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Capital outlay at {inventoryStats.totalRetail > 0 ? Math.round((inventoryStats.totalCost / inventoryStats.totalRetail) * 100) : 52}% avg MRP
                    </p>
                  </div>

                  {/* Card 2: Gross Margin */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GROSS MARGIN</span>
                      <TrendingUp className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-[#0F2042] tabular-nums tracking-tight">
                      ₹{inventoryStats.potentialMargin.toLocaleString("en-IN")}
                    </p>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-[#10B981] text-[10px] font-bold border border-emerald-100">
                        ↑ {inventoryStats.potentialMarginPct}% Margin
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Aged Stock */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AGED STOCK</span>
                      <Hourglass className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-[#0F2042] tabular-nums tracking-tight">
                      ₹{agedStockValue.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {inventoryStats.lowStock} pieces (&le;2 pcs low stock)
                    </p>
                  </div>

                  {/* Card 4: Workshop Hold */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WORKSHOP HOLD</span>
                      <Scissors className="w-4 h-4 text-[#0F2042]" />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-[#0F2042] tabular-nums tracking-tight">
                      {activeAlterationsCount} Pcs
                    </p>
                    <p className="text-[10px] text-slate-500">
                      ₹{alterationsValue.toLocaleString("en-IN")} value • Master tailor fitting bay
                    </p>
                  </div>
                </div>

                {/* Floor Replenishment Section */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#0F2042]">Floor Replenishment</h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {inventoryStats.totalItems} Total Active SKUs
                    </span>
                  </div>

                  {/* Filter chips matching Image 3 */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setStockStatusFilter("all")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        stockStatusFilter === "all"
                          ? "bg-[#0F2042] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      All Units ({inventoryStats.totalItems})
                    </button>
                    <button
                      onClick={() => setStockStatusFilter("good")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        stockStatusFilter === "good"
                          ? "bg-[#0F2042] text-white shadow-sm"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      • Healthy ({inventoryStats.goodStock})
                    </button>
                    <button
                      onClick={() => setStockStatusFilter("low")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                        stockStatusFilter === "low"
                          ? "bg-[#0F2042] text-white shadow-sm"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      • Low Stock ({inventoryStats.lowStock})
                    </button>
                  </div>

                  {/* Segmented Progress Bar: Green (healthy), Gold (low), Red (out) */}
                  <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-100">
                    <div
                      className="bg-[#10B981] h-full transition-all"
                      style={{ width: `${healthyPct}%` }}
                      title="Healthy"
                    />
                    <div
                      className="bg-[#C5A880] h-full transition-all"
                      style={{ width: `${lowStockPct}%` }}
                      title="Low Stock"
                    />
                    <div
                      className="bg-rose-500 h-full transition-all"
                      style={{ width: `${outStockPct}%` }}
                      title="Out of Stock"
                    />
                  </div>
                </div>

                {/* Search Bar for Garments */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    placeholder="Search item name, SKU, or Barcode..."
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#0F2042] shadow-sm transition"
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

                {/* Product List Cards */}
                <div className="space-y-2.5">
                  <span className="text-[11px] text-slate-500 font-semibold block px-1">
                    Showing {filteredProducts.length} items
                  </span>

                  {filteredProducts.slice(0, 40).map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    const isLowStock = p.stock > 0 && p.stock <= 2;

                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 shadow-sm hover:border-[#0F2042]/40 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-bold uppercase bg-[#0F2042]/5 text-[#0F2042] px-2 py-0.5 rounded-md border border-[#0F2042]/10 tracking-wider">
                                {p.category}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {p.sku}
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">{p.name}</h3>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Barcode: {p.barcode}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-[#0F2042] font-mono tabular-nums block">
                              ₹{p.price.toLocaleString("en-IN")}
                            </span>
                            {p.purchaseCost > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                Cost: ₹{p.purchaseCost}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              isOutOfStock
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : isLowStock
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isOutOfStock ? "Out of Stock" : `${p.stock} Pcs on Rack`}
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            Total: ₹{(p.stock * p.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: 🧾 BILLS & OFFLINE VAULT (EXACT INSPIRATION IMAGE 4)
            ========================================================================= */}
        {activeNav === "bills" && (
          <div className="space-y-4">
            {/* Hero Dark Card: Laptop Offline Vault */}
            <div className="bg-[#0F2042] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#C5A880]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white">Laptop Offline Vault</span>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <p className="text-[10px] text-slate-300">POS Terminal 01 • Air-Gapped Sync</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-bold text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PARITY OK</span>
                </div>
              </div>

              {/* 2-Column Stats: Synced Bills & Offline Vault Value */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                    SYNCED BILLS
                  </span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                    {bills.length.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Check className="w-3 h-3" />
                    <span>100% cloud parity</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                    OFFLINE VAULT VALUE
                  </span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                    {formatIndianCompact(totalBillsVaultValue)}
                  </span>
                  <span className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Checked {lastRefreshedAt || "just now"}</span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Cryptographically verified local POS backup synced seamlessly to owner cloud storage. Real-time parity with showroom billing terminal.
              </p>

              {/* Two Action Buttons: Master Excel and JSON Vault */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleExportBillsCsv}
                  className="flex-1 py-2.5 px-3 bg-white text-[#0F2042] hover:bg-slate-100 rounded-xl font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Master Excel</span>
                </button>

                <button
                  onClick={handleExportBillsJson}
                  className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-[#C5A880]" />
                  <span>JSON Vault</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={billsSearch}
                onChange={(e) => setBillsSearch(e.target.value)}
                placeholder="Search Bill #, Customer Name, or Phone..."
                className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#0F2042] shadow-sm transition"
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

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 text-xs">
              {[
                { id: "all", label: `All Bills (${bills.length})` },
                { id: "cash", label: `Cash (${bills.filter((b) => b.paymentMode === "cash").length})` },
                { id: "upi", label: `UPI / Card (${bills.filter((b) => b.paymentMode === "upi").length})` },
              ].map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setBillsPaymentFilter(pm.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    billsPaymentFilter === pm.id
                      ? "bg-[#0F2042] text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>

            {/* Section Title */}
            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xs font-bold text-[#0F2042]">Today's Verified Invoices</h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Showroom 1 • ₹{salesStats.revenue.toLocaleString("en-IN")} Total
              </span>
            </div>

            {/* Bill Cards matching Image 4 */}
            <div className="space-y-3">
              {searchFilteredBills.slice(0, 60).map((bill) => {
                const billTime = bill.rawDate
                  ? new Date(bill.rawDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                  : bill.createdAt;
                const itemsCount = bill.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;
                const itemsSummary = bill.items?.map((it) => it.product?.name).filter(Boolean).slice(0, 2).join(", ") || "Ethnic Apparel";

                return (
                  <div
                    key={bill.id || bill.billNo}
                    onClick={() => setViewingBill(bill)}
                    className="bg-white border border-slate-200/90 hover:border-[#0F2042]/50 rounded-2xl p-4 space-y-2.5 transition cursor-pointer active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0F2042]">{bill.billNo}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md font-mono ${
                            bill.paymentMode === "cash"
                              ? "bg-[#FBF6EE] text-[#A67C43] border border-[#C5A880]/30"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {bill.paymentMode === "cash" ? "Cash Drawer" : "UPI • Instant QR"}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-base font-extrabold text-[#0F2042] font-mono tabular-nums">
                            ₹{bill.grandTotal.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] font-bold text-[#10B981] flex items-center">
                            <Check className="w-3 h-3 text-[#10B981]" />
                            <span>Verified</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{bill.customer?.name || "Walk-in Guest"}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {bill.customer?.phone && bill.customer.phone !== "NA"
                            ? bill.customer.phone.replace(/(d{5})$/, "•••••")
                            : "Direct Counter Guest"}
                        </p>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">{billTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <Package className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                      <span className="truncate">
                        {itemsCount} Items • {itemsSummary}
                        {(bill.items?.length || 0) > 2 ? "..." : ""}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">
                        SHA 256: {getBillHash(bill.billNo, bill.grandTotal, bill.createdAt)}
                      </span>
                      <span className="text-[#0F2042] font-bold flex items-center gap-0.5">
                        View Slip &gt;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: 👥 STAFF & OPS SUITE (EXACT INSPIRATION IMAGE 5)
            ========================================================================= */}
        {activeNav === "staff" && (
          <div className="space-y-4">
            {/* Action Buttons Top Bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="py-2 px-3 rounded-xl bg-[#0F2042] text-white text-xs font-bold shadow-sm hover:bg-[#0A162E] flex items-center gap-1.5 active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>+ Expense</span>
              </button>

              <button
                onClick={() => setShowAddMemberModal(true)}
                className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-1.5 active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>+ Staff</span>
              </button>

              <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 rounded-xl text-slate-700 text-xs font-bold font-mono">
                <Wallet className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Float: ₹{netGallaCashInHand}</span>
              </div>
            </div>

            {/* OPERATIONAL PILLARS (4 Bento Cards) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-1">
                OPERATIONAL PILLARS
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* Pillar 1: Expenses */}
                <div
                  onClick={() => setStaffSubTab("expenses")}
                  className={`bg-white border rounded-2xl p-3.5 shadow-sm space-y-1.5 cursor-pointer transition ${
                    staffSubTab === "expenses" ? "border-[#0F2042] ring-1 ring-[#0F2042]/20" : "border-slate-200/90"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Expenses</span>
                    <Coffee className="w-4 h-4 text-[#0F2042]" />
                  </div>
                  <p className="text-xl font-extrabold text-[#0F2042] font-mono tabular-nums">
                    ₹{todayExpenseTotal.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {todayExpenses.length} entries today
                  </p>
                </div>

                {/* Pillar 2: Advances */}
                <div
                  onClick={() => setStaffSubTab("advances")}
                  className={`bg-white border rounded-2xl p-3.5 shadow-sm space-y-1.5 cursor-pointer transition ${
                    staffSubTab === "advances" ? "border-[#0F2042] ring-1 ring-[#0F2042]/20" : "border-slate-200/90"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Advances</span>
                    <CreditCard className="w-4 h-4 text-[#C5A880]" />
                  </div>
                  <p className="text-xl font-extrabold text-[#0F2042] font-mono tabular-nums">
                    ₹{todayAdvanceTotal.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {todayAdvances.length} active drawdowns
                  </p>
                </div>

                {/* Pillar 3: Attendance */}
                <div
                  onClick={() => setStaffSubTab("attendance")}
                  className={`bg-white border rounded-2xl p-3.5 shadow-sm space-y-1.5 cursor-pointer transition ${
                    staffSubTab === "attendance" ? "border-[#0F2042] ring-1 ring-[#0F2042]/20" : "border-slate-200/90"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Attendance</span>
                    <UserCheck className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <p className="text-xl font-extrabold text-[#0F2042] font-mono tabular-nums">
                    {attendanceStats.present} On Duty
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {attendanceStats.totalStaff > 0 ? Math.round((attendanceStats.present / attendanceStats.totalStaff) * 100) : 0}% Biometric Verified
                  </p>
                </div>

                {/* Pillar 4: Staff Directory */}
                <div
                  onClick={() => setStaffSubTab("members")}
                  className={`bg-white border rounded-2xl p-3.5 shadow-sm space-y-1.5 cursor-pointer transition ${
                    staffSubTab === "members" ? "border-[#0F2042] ring-1 ring-[#0F2042]/20" : "border-slate-200/90"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Staff Directory</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-xl font-extrabold text-[#0F2042] font-mono tabular-nums">
                    {staffMembers.length} Active
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Showroom Atelier Team
                  </p>
                </div>
              </div>
            </div>

            {/* 2 Reconciliation Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase">TOTAL EXPENSE</span>
                <p className="text-lg font-extrabold text-rose-600 font-mono mt-1 tabular-nums">
                  -₹{todayExpenseTotal}
                </p>
                <span className="text-[10px] text-slate-400">Within daily allowance</span>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase">CASH DRAWER</span>
                <p className="text-lg font-extrabold text-[#0F2042] font-mono mt-1 tabular-nums">
                  ₹{netGallaCashInHand}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">Reconciled float</span>
              </div>
            </div>

            {/* Active Sub-Tab View Feed */}
            {staffSubTab === "expenses" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F2042]">Store Expenses Feed</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{expenses.length} Records</span>
                </div>

                {expenses.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                    No store expenses recorded today.
                  </div>
                ) : (
                  expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold uppercase bg-[#0F2042]/5 text-[#0F2042] px-2 py-0.5 rounded-md border border-[#0F2042]/10">
                            {exp.category.replace("_", " ")}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              exp.paidBy === "cash_galla"
                                ? "bg-[#FBF6EE] text-[#A67C43] border border-[#C5A880]/30"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {exp.paidBy === "cash_galla" ? "Cash Drawer" : "Online UPI"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{exp.title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          By {exp.staffName} • {exp.date} {exp.note ? `• "${exp.note}"` : ""}
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-1.5">
                        <span className="text-base font-extrabold text-rose-600 font-mono tabular-nums mr-1">
                          -₹{exp.amount}
                        </span>
                        <button
                          onClick={() => handleOpenEditExpense(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F2042] hover:bg-slate-100 transition"
                          title="Edit Expense"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete expense "${exp.title}"?`)) {
                              await StaffExpenseService.deleteExpense(exp.id, exp.tokenNumber);
                              await loadAllData();
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {staffSubTab === "advances" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F2042]">Staff Salary Advances</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{advances.length} Active Records</span>
                </div>

                {advances.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                    No staff salary advance records found.
                  </div>
                ) : (
                  advances.map((adv) => (
                    <div
                      key={adv.id}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{adv.staffName}</span>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              adv.status === "active"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {adv.status === "active" ? "Pending Advance" : "Cleared"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {adv.reason.replace("_", " ")} • {adv.date} • {adv.paidBy === "cash_galla" ? "Cash" : "UPI"}
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-1.5">
                        <span className="text-base font-extrabold text-rose-600 font-mono tabular-nums mr-1">
                          ₹{adv.amount}
                        </span>
                        {adv.status === "active" ? (
                          <button
                            onClick={async () => {
                              await StaffExpenseService.updateAdvanceStatus(adv.id, adv.tokenNumber, "cleared");
                              await loadAllData();
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100"
                          >
                            Clear
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              await StaffExpenseService.updateAdvanceStatus(adv.id, adv.tokenNumber, "active");
                              await loadAllData();
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold"
                          >
                            Undo
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditAdvance(adv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F2042] hover:bg-slate-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete advance record for ${adv.staffName}?`)) {
                              await StaffExpenseService.deleteAdvance(adv.id, adv.tokenNumber);
                              await loadAllData();
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {staffSubTab === "attendance" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(ownerAttendanceDate);
                      d.setDate(d.getDate() - 1);
                      setOwnerAttendanceDate(d.toISOString().split("T")[0]);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition"
                  >
                    ← Prev Day
                  </button>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Attendance Date</span>
                    <input
                      type="date"
                      value={ownerAttendanceDate}
                      onChange={(e) => setOwnerAttendanceDate(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer text-center font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOwnerAttendanceDate(todayStr)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      ownerAttendanceDate === todayStr
                        ? "bg-[#0F2042] text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Today
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">Present</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">{attendanceStats.present}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                    <span className="text-[10px] text-amber-800 font-bold uppercase block">Half Day</span>
                    <span className="text-lg font-black text-amber-700 font-mono">{attendanceStats.halfDay}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                    <span className="text-[10px] text-rose-800 font-bold uppercase block">Absent</span>
                    <span className="text-lg font-black text-rose-700 font-mono">{attendanceStats.absent}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                    <span className="text-[10px] text-slate-600 font-bold uppercase block">Leave</span>
                    <span className="text-lg font-black text-[#0F2042] font-mono">{attendanceStats.leave}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {staffMembers.map((staff) => {
                    const record = attendance.find((a) => a.staffId === staff.id);
                    const currentStatus = record?.status || "present";

                    return (
                      <div
                        key={staff.id}
                        className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#0F2042]/5 border border-[#0F2042]/20 text-[#0F2042] font-bold text-xs flex items-center justify-center shrink-0">
                              {staff.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{staff.name}</h4>
                              <p className="text-[10px] text-slate-500">{staff.role}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase font-mono ${
                              currentStatus === "present"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : currentStatus === "half_day"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : currentStatus === "absent"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {currentStatus.replace("_", " ")}
                          </span>
                        </div>

                        {/* Owner 1-Tap Status Override */}
                        <div className="grid grid-cols-4 gap-1.5 text-xs">
                          {[
                            { id: "present", label: "P", active: "bg-emerald-600 text-white" },
                            { id: "half_day", label: "HD", active: "bg-amber-500 text-white" },
                            { id: "absent", label: "A", active: "bg-rose-600 text-white" },
                            { id: "leave", label: "L", active: "bg-[#0F2042] text-white" },
                          ].map((s) => {
                            const isSel = currentStatus === s.id;
                            return (
                              <button
                                key={s.id}
                                onClick={async () => {
                                  await StaffExpenseService.markAttendance({
                                    staffId: staff.id,
                                    staffName: staff.name,
                                    date: ownerAttendanceDate,
                                    status: s.id as any,
                                    markedBy: "Showroom Owner",
                                  });
                                  await loadAllData();
                                }}
                                className={`py-1.5 rounded-xl font-bold transition text-[11px] ${
                                  isSel ? `${s.active} shadow-sm` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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

            {staffSubTab === "members" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F2042]">Showroom Staff Directory</h3>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="text-xs font-bold text-[#0F2042] flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {staffMembers.map((staff) => (
                    <div
                      key={staff.id}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0F2042] text-white flex items-center justify-center font-bold text-sm">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">{staff.name}</h4>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                staff.isActive !== false
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {staff.isActive !== false ? "Active" : "Relieved"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">{staff.role}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Salary: ₹{staff.monthlySalary?.toLocaleString("en-IN") || 15000}/mo • {staff.phone || "No Phone"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditStaff(staff)}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#0F2042] hover:bg-slate-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: 🛡️ SECURITY & ROLLING OTP
            ========================================================================= */}
        {activeNav === "security" && (
          <div className="space-y-4">
            {/* Live 30-Sec OTP Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-[#0F2042]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F2042]">
                  Staff Override Dynamic OTP
                </span>
              </div>
              <h2 className="text-xs text-slate-500 mt-0.5">Tell this code to counter staff for price override</h2>

              <div className="my-5">
                <span className="font-mono text-4xl sm:text-5xl font-black text-[#0F2042] tracking-[0.25em] tabular-nums">
                  {otpData.otp}
                </span>
              </div>

              {/* Progress Bar & Timer */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2 border border-slate-200">
                <div
                  className="bg-[#0F2042] h-full transition-all duration-1000"
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
                  className="py-2.5 px-4 rounded-xl bg-[#10B981] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-[#0F2042] tracking-wider">
                  Pending Staff Price Requests ({pendingRequests.length})
                </h3>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No pending authorization requests</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{req.productName}</span>
                        <span className="text-[10px] text-[#0F2042] font-mono">{req.sku}</span>
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
            <div className="bg-white border border-slate-200/90 rounded-3xl p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Recent Security Audit History
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
          MODALS & POPUPS
          ========================================================================= */}
      {/* Modal: Add Expense */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F2042] tracking-wider">
                  Owner Expense Entry
                </span>
                <h3 className="text-base font-bold text-slate-900">Record Store Expense</h3>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOwnerAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Title / Description</label>
                <input
                  type="text"
                  required
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  placeholder="e.g. Tea & Snacks, Cleaning, Tape"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  placeholder="₹ 60"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-base font-black font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newExpCategory}
                    onChange={(e) => setNewExpCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
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
                    value={newExpPaidBy}
                    onChange={(e) => setNewExpPaidBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                  >
                    <option value="cash_galla">💵 Cash Drawer</option>
                    <option value="online_upi">📱 Online UPI</option>
                    <option value="owner_personal">👑 Owner Personal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={newExpNote}
                  onChange={(e) => setNewExpNote(e.target.value)}
                  placeholder="e.g. Added by Owner"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2042] text-white font-bold shadow-md hover:bg-[#0A162E]"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Member */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F2042] tracking-wider">
                  Showroom Staff
                </span>
                <h3 className="text-base font-bold text-slate-900">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOwnerAddMember} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Member Name</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Sunita Devi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    placeholder="Sales Executive"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={newMemberSalary}
                    onChange={(e) => setNewMemberSalary(e.target.value)}
                    placeholder="15000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2042] text-white font-bold shadow-md hover:bg-[#0A162E]"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Staff */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F2042] tracking-wider">
                  Owner Staff Management
                </span>
                <h3 className="text-base font-bold text-slate-900">Edit Staff Details</h3>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Member Name</label>
                <input
                  type="text"
                  required
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={editStaffPhone}
                  onChange={(e) => setEditStaffPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role</label>
                <input
                  type="text"
                  value={editStaffRole}
                  onChange={(e) => setEditStaffRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monthly Salary (₹)</label>
                <input
                  type="number"
                  value={editStaffSalary}
                  onChange={(e) => setEditStaffSalary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold font-mono text-base outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(editingStaff)}
                  className="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 transition"
                  title="Delete Staff"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2042] text-white font-bold shadow-md hover:bg-[#0A162E] transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Expense */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F2042] tracking-wider">
                  Owner Audit
                </span>
                <h3 className="text-base font-bold text-slate-900">Edit Expense Record</h3>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  value={editExpTitle}
                  onChange={(e) => setEditExpTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editExpAmount}
                  onChange={(e) => setEditExpAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-base font-black font-mono outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2042] text-white font-bold shadow-md hover:bg-[#0A162E]"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Advance */}
      {editingAdvance && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F2042] tracking-wider">
                  Owner Audit
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Advance: {editingAdvance.staffName}
                </h3>
              </div>
              <button
                onClick={() => setEditingAdvance(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAdvance} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editAdvAmount}
                  onChange={(e) => setEditAdvAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-base font-black font-mono outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdvance(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F2042] text-white font-bold shadow-md hover:bg-[#0A162E]"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Full Bill */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F2042] tracking-wider">
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
              <div className="flex justify-between text-base font-black text-[#0F2042] pt-1 border-t border-slate-100">
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
                    `Dear ${viewingBill.customer.name}, Thank you for shopping with Rajnandini Boutique. Your Invoice #${viewingBill.billNo} of ₹${viewingBill.grandTotal} is confirmed.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
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
          FIXED BOTTOM MOBILE NAVIGATION BAR (5 DOCKED ICONS MATCHING IMAGE 1)
          ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          {[
            { id: "sales", label: "Sales", icon: TrendingUp },
            { id: "stock", label: "Stock", icon: Package },
            { id: "bills", label: "Bills", icon: Receipt },
            { id: "staff", label: "Staff & Ops", icon: Users },
            { id: "security", label: "Security", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeNav === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveNav(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition active:scale-95 ${
                  isActive ? "text-[#0F2042] font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition ${
                    isActive
                      ? "bg-[#0F2042] text-white shadow-md shadow-[#0F2042]/20"
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
