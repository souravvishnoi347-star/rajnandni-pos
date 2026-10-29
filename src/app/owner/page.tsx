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
  Users,
  Coffee,
  Trash2,
  Plus,
  Pencil,
  UserCheck,
  UserX,
  Download,
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

export default function MobileOwnerApp() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);

  // Active Bottom Nav Tab: 'sales' | 'stock' | 'bills' | 'staff' | 'security'
  const [activeNav, setActiveNav] = useState<"sales" | "stock" | "bills" | "staff" | "security">("sales");

  // Time Filter for Sales: 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [timeFilter, setTimeFilter] = useState<"today" | "yesterday" | "week" | "month" | "all">("today");

  // Data States
  const [bills, setBills] = useState<CompletedBill[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
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
      // Auto-refresh every 15 seconds for live store sales updates
      const interval = setInterval(() => {
        loadAllData(false);
      }, 15000);

      // Realtime listener for instant incoming bills from Haridwar Boutique
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

  // Export all bills to Laptop as CSV / Excel
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

  // Export all bills to Laptop as Raw JSON Vault
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
      setPinError("Incorrect Security PIN. Please enter the valid PIN (Master PIN: 7898)");
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

  // Expenses & Advances Calculation for Cash Drawer Reconciliation
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
    if (confirm(`Are you sure you want to deactivate "${staff.name}" from the staff roster?`)) {
      await StaffExpenseService.deleteStaffMember(staff.id);
      await loadAllData();
    }
  };

  const handleToggleStaffActive = async (staff: StaffMember) => {
    const nextState = !staff.isActive;
    await StaffExpenseService.toggleStaffStatus(staff.id, nextState);
    await loadAllData();
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
  // VIEW 0: PIN LOCK SCREEN (CLEAN LUXURY WHITE THEME)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center px-4 py-8 relative">
        <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
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
              onClick={handleExportBillsCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs active:scale-95 transition cursor-pointer"
              title="Download all customer bills as Excel/CSV to your laptop"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline Bills Excel</span>
            </button>

            <button
              onClick={() => loadAllData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-600 active:scale-95 transition shadow-sm"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>

            <button
              onClick={handleLock}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 active:scale-95 transition shadow-sm"
              title="Lock App"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Realtime Live Incoming Sale Toast */}
        {liveSaleToast && (
          <div className="mt-3 p-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
              <div>
                <p className="text-xs font-black">🔔 New Sale in Haridwar! Invoice: {liveSaleToast.billNo}</p>
                <p className="text-[10px] text-emerald-100">Customer: {liveSaleToast.customer} • ₹{liveSaleToast.total.toLocaleString("en-IN")} at {liveSaleToast.time}</p>
              </div>
            </div>
            <button onClick={() => setLiveSaleToast(null)} className="text-white/80 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Date Filter Chips for Sales View */}
        {activeNav === "sales" && (
          <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
            {[
              { id: "today", label: "Today" },
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
                      ? "Today's Showroom Sales"
                      : timeFilter === "yesterday"
                      ? "Yesterday's Sales"
                      : timeFilter === "week"
                      ? "Past 7 Days Sales"
                      : timeFilter === "month"
                      ? "This Month's Sales"
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
                    Gross Profit (Net Margin)
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
                    Profit Margin (%)
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

            {/* REAL NET DRAWER CASH IN HAND RECONCILIATION CARD */}
            <div className="bg-gradient-to-br from-emerald-50 via-slate-50 to-blue-50/40 border border-emerald-200 rounded-3xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Net Drawer Cash in Hand (Cash Reconciliation)
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  Realtime Drawer Cash
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
                    ₹{netGallaCashInHand.toLocaleString("en-IN")}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Counter Cash: ₹{salesStats.cashTotal.toLocaleString("en-IN")} | Store Expenses: -₹{todayCashExpense} | Advances: -₹{todayCashAdvance}
                  </p>
                </div>

                <button
                  onClick={() => setActiveNav("staff")}
                  className="text-xs font-bold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-xl shadow-sm hover:bg-blue-50 transition flex items-center gap-1"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4 Quick Stat Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Cash Collection */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Cash Collected</span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1.5 tabular-nums truncate">
                  ₹{salesStats.cashTotal.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-emerald-700 font-semibold">Counter Cash</span>
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
                <p className="text-xs text-slate-400 py-3 text-center">No sales transactions recorded for this period</p>
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

              {/* Primary Metric: Total Physical Retail Value (Accurate ~₹44.57 Lakhs) */}
              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/50 border border-blue-100 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Total Showroom Stock Retail Value
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
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Wholesale Cost (Investment)
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 font-mono tabular-nums block mt-0.5">
                    ₹{inventoryStats.totalCost.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {formatIndianCompact(inventoryStats.totalCost)}
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 shadow-sm">
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                    Estimated Gross Margin
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
                  <span className="text-[11px]">Out of Stock (0 pcs)</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-mono font-black">{inventoryStats.lowStock}</span>
                  <span className="text-[11px]">Low Stock (&le; 2 pcs)</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-mono font-black">{inventoryStats.goodStock}</span>
                  <span className="text-[11px]">Healthy Stock</span>
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
                  { id: "all", label: `All Items (${inventoryStats.totalItems})` },
                  { id: "low", label: `⚠️ Low Stock (${inventoryStats.lowStock})` },
                  { id: "out", label: `🔴 Out of Stock (${inventoryStats.outOfStock})` },
                  { id: "good", label: `🟢 Healthy Stock (${inventoryStats.goodStock})` },
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
                  "lehengas",
                  "jewellery",
                  "handbags",
                  "footwear",
                  "cosmetics",
                  "bangles",
                  "earrings",
                  "handloom",
                  "kidswear",
                  "undergarments",
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

            {/* Product Item Cards List */}
            <div className="space-y-2.5">
              <span className="text-[11px] text-slate-500 font-semibold block px-1">
                Showing {filteredProducts.length} items
              </span>

              {filteredProducts.slice(0, 50).map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= 2;

                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 shadow-sm hover:border-blue-300 transition"
                  >
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
                          isOutOfStock
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : isLowStock
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {p.stock} pcs
                      </span>
                    </div>

                    {/* Price & Cost Row with clear spacing */}
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
            {/* Offline Laptop Archive Action Card */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-4 rounded-3xl border border-blue-500/30 shadow-md space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Haridwar Boutique Live Stream</span>
                  <p className="text-sm font-black text-white">Laptop Offline Bills Vault ({bills.length} Bills Synced)</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-[10px] font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Realtime Stream Active</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Haridwar boutique mein cashier jab bhi bill banata hai, woh instant aapke laptop par sync hota hai. Niche click karke offline backup save karein:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleExportBillsCsv}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Master Excel (CSV)</span>
                </button>
                <button
                  onClick={handleExportBillsJson}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                  title="Download Raw JSON data file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON Vault</span>
                </button>
              </div>
            </div>

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
            TAB 4: ☕ STAFF & EXPENSES SUITE (OWNER CONTROL & AUDIT)
            ========================================================================= */}
        {activeNav === "staff" && (
          <div className="space-y-4">
            {/* Header & Sub-tab Bar */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Staff &amp; Store Expenses Management
                  </span>
                  <span className="text-xs text-blue-700 font-bold">
                    Connected with Head Staff App
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Expense</span>
                  </button>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold hover:bg-slate-200 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Staff</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-100 text-xs">
                {[
                  { id: "expenses", label: "☕ Expenses", count: todayExpenses.length },
                  { id: "advances", label: "👥 Advances", count: advances.length },
                  { id: "attendance", label: "📅 Attendance", count: `${attendanceStats.present}/${attendanceStats.totalStaff}` },
                  { id: "members", label: "👔 Staff", count: staffMembers.length },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStaffSubTab(st.id as any)}
                    className={`py-2 px-1 rounded-xl font-bold transition flex flex-col items-center justify-center text-[11px] ${
                      staffSubTab === st.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className={`text-[9px] font-mono ${staffSubTab === st.id ? "text-blue-100" : "text-slate-400"}`}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Tab 1: Expenses Feed */}
            {staffSubTab === "expenses" && (
              <div className="space-y-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Today's Store Expenses</span>
                    <span className="text-xl font-black text-slate-900 font-mono">₹{todayExpenseTotal}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Paid From Cash Drawer</span>
                    <span className="text-xl font-black text-rose-600 font-mono">₹{todayCashExpense}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {expenses.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                      No expenses recorded today.
                    </div>
                  ) : (
                    expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
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
                              {exp.paidBy === "cash_galla" ? "Cash Drawer" : "Online UPI"}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">{exp.title}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            By {exp.staffName} • {exp.date} {exp.note ? `• "${exp.note}"` : ""}
                          </p>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-1.5">
                          <span className="text-base font-black text-rose-600 font-mono tabular-nums mr-1">
                            -₹{exp.amount}
                          </span>
                          <button
                            onClick={() => handleOpenEditExpense(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${exp.title}"?`)) {
                                await StaffExpenseService.deleteExpense(exp.id, exp.tokenNumber);
                                await loadAllData();
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

            {/* Sub-Tab 2: Advances Feed */}
            {staffSubTab === "advances" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {advances.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                      No staff advance records found.
                    </div>
                  ) : (
                    advances.map((adv) => (
                      <div
                        key={adv.id}
                        className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
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
                            Reason: {adv.reason.replace("_", " ")} • {adv.date} • {adv.paidBy === "cash_galla" ? "Cash" : "UPI"}
                          </p>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-1.5">
                          <span className="text-base font-black text-rose-600 font-mono tabular-nums mr-1">
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Advance"
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

            {/* Sub-Tab 3: Attendance Feed */}
            {staffSubTab === "attendance" && (
              <div className="space-y-3">
                {/* Attendance Date Selector */}
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
                        ? "bg-blue-600 text-white shadow-sm"
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
                    <span className="text-[10px] text-blue-800 font-bold uppercase block">Leave</span>
                    <span className="text-lg font-black text-blue-700 font-mono">{attendanceStats.leave}</span>
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
                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
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
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {currentStatus.replace("_", " ")}
                          </span>
                        </div>

                        {/* Owner 1-Tap Status Override Buttons */}
                        <div className="grid grid-cols-4 gap-1.5 text-xs">
                          {[
                            { id: "present", label: "P", active: "bg-emerald-600 text-white" },
                            { id: "half_day", label: "HD", active: "bg-amber-500 text-white" },
                            { id: "absent", label: "A", active: "bg-rose-600 text-white" },
                            { id: "leave", label: "L", active: "bg-blue-600 text-white" },
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

            {/* Sub-Tab 4: Staff Directory & Full Edit Controls */}
            {staffSubTab === "members" && (
              <div className="space-y-3">
                {/* Staff Summary Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Active Staff Members
                    </span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {staffMembers.filter((s) => s.isActive !== false).length} / {staffMembers.length}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Total Monthly Payroll
                    </span>
                    <span className="text-xl font-black text-blue-700 font-mono">
                      ₹
                      {staffMembers
                        .filter((s) => s.isActive !== false)
                        .reduce((sum, s) => sum + s.monthlySalary, 0)
                        .toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-700">Staff List &amp; Profile Edit</span>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Staff Member</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {staffMembers.map((staff) => {
                    const activeAdv = advances
                      .filter((a) => a.staffId === staff.id && a.status === "active")
                      .reduce((sum, a) => sum + a.amount, 0);

                    const isActive = staff.isActive !== false;

                    return (
                      <div
                        key={staff.id}
                        className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition ${
                          isActive ? "border-slate-200" : "border-slate-200 bg-slate-50/70 opacity-75"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                                isActive
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {staff.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{staff.name}</h4>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    isActive
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <p className="text-xs text-blue-700 font-semibold mt-0.5">{staff.role}</p>
                              {staff.phone && (
                                <a
                                  href={`tel:${staff.phone}`}
                                  className="text-[11px] text-slate-500 hover:text-blue-600 font-mono mt-0.5 inline-block"
                                >
                                  📞 {staff.phone}
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black font-mono text-slate-900 block">
                              ₹{staff.monthlySalary.toLocaleString("en-IN")}
                              <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              ~₹{Math.round(staff.monthlySalary / 30)}/day
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-1 ${
                                activeAdv > 0
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {activeAdv > 0 ? `Adv: ₹${activeAdv}` : "No Advance"}
                            </span>
                          </div>
                        </div>

                        {/* Staff Action Buttons (Edit, Active Toggle, Delete) */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                          <button
                            type="button"
                            onClick={() => handleToggleStaffActive(staff)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                              isActive
                                ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            <span>{isActive ? "⏸ Mark Inactive" : "▶ Re-Activate"}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStaff(staff)}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold flex items-center gap-1 transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff)}
                              className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Staff Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
            TAB 5: 🛡️ SECURITY & STAFF APPROVALS
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
          MODAL: ADD EXPENSE BY OWNER
          ========================================================================= */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
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
                <label className="font-bold text-slate-700 block mb-1">Expense Title / Item Description</label>
                <input
                  type="text"
                  required
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  placeholder="e.g. Tea & Samosa, Cold Drinks, Cleaning, Tape"
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
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW STAFF MEMBER BY OWNER
          ========================================================================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
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
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone (Optional)</label>
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
                  <label className="font-bold text-slate-700 block mb-1">Designation / Role</label>
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
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT EXISTING STAFF MEMBER BY OWNER
          ========================================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
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
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone (Calling / WhatsApp)</label>
                <input
                  type="tel"
                  value={editStaffPhone}
                  onChange={(e) => setEditStaffPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={editStaffRole}
                  onChange={(e) => setEditStaffRole(e.target.value)}
                  placeholder="e.g. Head Staff / Store Manager"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                />
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  {["Head Staff", "Sales Executive", "Saree Specialist", "Lehenga Expert", "Tailor / Master", "Helper"].map((rolePreset) => (
                    <button
                      key={rolePreset}
                      type="button"
                      onClick={() => setEditStaffRole(rolePreset)}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200"
                    >
                      {rolePreset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monthly Salary (₹)</label>
                <input
                  type="number"
                  value={editStaffSalary}
                  onChange={(e) => setEditStaffSalary(e.target.value)}
                  placeholder="20000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold font-mono text-base outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Daily wage approx: ~₹{Math.round((Number(editStaffSalary) || 0) / 30)} / day
                </span>
              </div>

              {/* Status Toggle */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Employment Status</span>
                    <span className="text-[11px] text-slate-500">
                      {editStaffActive ? "Active (Currently Employed)" : "Inactive / Relieved"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editStaffActive}
                    onChange={(e) => setEditStaffActive(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                </label>
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
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT EXISTING STORE EXPENSE BY OWNER
          ========================================================================= */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
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
                  placeholder="e.g. Tea & Snacks"
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editExpCategory}
                    onChange={(e) => setEditExpCategory(e.target.value as any)}
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
                    value={editExpPaidBy}
                    onChange={(e) => setEditExpPaidBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                  >
                    <option value="cash_galla">💵 Cash Drawer</option>
                    <option value="online_upi">📱 Online UPI</option>
                    <option value="owner_personal">👑 Owner Personal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  value={editExpDate}
                  onChange={(e) => setEditExpDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={editExpNote}
                  onChange={(e) => setEditExpNote(e.target.value)}
                  placeholder="e.g. Verified by Owner"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
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
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700"
                >
                  Update Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT EXISTING STAFF ADVANCE BY OWNER
          ========================================================================= */}
      {editingAdvance && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason</label>
                  <select
                    value={editAdvReason}
                    onChange={(e) => setEditAdvReason(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                  >
                    <option value="salary_advance">Salary Advance</option>
                    <option value="daily_wages">Daily Wages</option>
                    <option value="emergency">Emergency Medical</option>
                    <option value="travel_incentive">Travel / Fuel</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paid Mode</label>
                  <select
                    value={editAdvPaidBy}
                    onChange={(e) => setEditAdvPaidBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                  >
                    <option value="cash_galla">💵 Cash Drawer</option>
                    <option value="online_upi">📱 Online UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={editAdvStatus}
                  onChange={(e) => setEditAdvStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-bold"
                >
                  <option value="active">🔴 Active Advance (Pending Settlement)</option>
                  <option value="cleared">🟢 Cleared / Deducted (Salary se kat chuka hai)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  value={editAdvDate}
                  onChange={(e) => setEditAdvDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={editAdvNote}
                  onChange={(e) => setEditAdvNote(e.target.value)}
                  placeholder="e.g. Diye gaye cash se"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
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
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700"
                >
                  Update Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    `Dear ${viewingBill.customer.name}, Thank you for shopping with Rajnandini Boutique. Your Invoice #${viewingBill.billNo} of ₹${viewingBill.grandTotal} is confirmed.`
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
          FIXED BOTTOM MOBILE NAVIGATION BAR (5 TABS IN CLEAN WHITE DOCK)
          ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-0.5">
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
                className={`flex flex-col items-center justify-center py-1 rounded-2xl transition active:scale-95 ${
                  isActive ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition ${
                    isActive ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100" : ""
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] mt-0.5 tracking-tight font-medium truncate max-w-full">
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
