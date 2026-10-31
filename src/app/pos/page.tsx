"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import {
  Sparkles,
  ShoppingBag,
  Package,
  Scissors,
  Receipt,
  Printer,
  Share2,
  Trash2,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  User,
  QrCode,
  CreditCard,
  Banknote,
  BookOpen,
  ArrowRight,
  PackageCheck,
  Tag,
  BarChart3,
  RefreshCw,
  X,
  AlertCircle,
  Handshake,
  Edit3,
  RotateCcw,
  Database,
  Cloud,
  FileText,
  Check,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Crown,
  ScanLine,
  TrendingUp,
  ShieldCheck,
  Layers,
  Download,
  Calendar,
  Filter,
  Wallet,
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  KeyRound,
  Send,
  Flame,
  Copy,
  Split,
  Zap,
  AlertTriangle,
  ArrowUpDown,
  SlidersHorizontal,
  Building2
} from "lucide-react";
import Link from "next/link";
import { ProductItem, CartItem, CustomerInfo, AlterationDetail, CompletedBill, ProductCategory, CustomerProfile, ExchangeRecord, SupplierProfile, ExchangeItemReturn, ExchangeItemIssued } from "@/types/pos";
import { INITIAL_PRODUCTS, STAFF_BEAUTICIANS, TAILOR_NAMES } from "@/lib/sampleInventory";
import { SupabaseService, isSupabaseConfigured } from "@/lib/supabaseClient";
import BarcodeSheetModal from "@/components/BarcodeSheetModal";
import ExchangeModal from "@/components/ExchangeModal";
import SupplierIntelligence from "@/components/SupplierIntelligence";
import { SupplierService } from "@/lib/supplierService";
import { ExchangeService } from "@/lib/exchangeService";
import {
  verifyOwnerOtp,
  createWhatsAppOtpRequest,
  verifyWhatsAppOtp,
  OwnerSecurityService,
  subscribeBroadcast,
  OWNER_PHONE_NUMBER,
  OWNER_NAME,
} from "@/lib/ownerSecurity";
import {
  StaffExpenseService,
  StaffMember,
  StaffProductPurchase,
  StaffDepositRecord,
  StaffAdvance,
  DEFAULT_STAFF_MEMBERS,
} from "@/lib/staffExpenseService";

const INVENTORY_DATA_VERSION = "rajnandni_inventory_v5_live_stock_6416";
const POS_ACCESS_PASSWORD = "Indu@123";
const POS_AUTH_STORAGE_KEY = "rajnandni_pos_auth_v1";

export default function RajnandiniPosPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");

  // Navigation
  const [activeTab, setActiveTab] = useState<"pos" | "inventory" | "alterations" | "reports" | "customers" | "staff_ledger">("pos");
  
  // Customer Directory State
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [customerSortBy, setCustomerSortBy] = useState<"spend_desc" | "visits_desc" | "discount_desc" | "recent" | "name_asc">("spend_desc");
  const [customerFilter, setCustomerFilter] = useState<"all" | "vip" | "repeat" | "festive" | "negotiation">("all");
  const [showFestiveBroadcastModal, setShowFestiveBroadcastModal] = useState<boolean>(false);
  const [showZReportModal, setShowZReportModal] = useState<boolean>(false);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<CustomerProfile | null>(null);
  const [customerPage, setCustomerPage] = useState<number>(1);
  const [customerPageSize, setCustomerPageSize] = useState<number>(15);
  
  // Inventory state
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>("all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [bridalFilterActive, setBridalFilterActive] = useState<boolean>(false);
  const [ownerOverrideActive, setOwnerOverrideActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [inventoryCategory, setInventoryCategory] = useState<ProductCategory>("all");

  // Inventory Sub-Tabs (Catalog, Bestsellers Velocity, Duplicate Cleaner)
  const [inventorySubTab, setInventorySubTab] = useState<"catalog" | "bestsellers" | "suppliers" | "duplicates">("catalog");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>("all");
  const [showExchangeModal, setShowExchangeModal] = useState<boolean>(false);
  const [exchangePreselectedBill, setExchangePreselectedBill] = useState<CompletedBill | null>(null);
  const [exchangesList, setExchangesList] = useState<ExchangeRecord[]>([]);
  const [velocityFilter, setVelocityFilter] = useState<"all" | "out_of_stock" | "critical" | "fast_movers">("all");
  const [velocitySort, setVelocitySort] = useState<"sold_desc" | "revenue_desc" | "speed_asc" | "stock_asc">("sold_desc");
  const [velocitySearch, setVelocitySearch] = useState<string>("");
  const [duplicateSearch, setDuplicateSearch] = useState<string>("");
  const [quickRestockProduct, setQuickRestockProduct] = useState<ProductItem | null>(null);
  const [quickRestockQty, setQuickRestockQty] = useState<number>(5);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo>({ name: "", phone: "", notes: "" });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("Owner Approved");
  const [agreedDealPrice, setAgreedDealPrice] = useState<string>("");
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [tempItemPrice, setTempItemPrice] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "khata" | "staff_salary">("upi");
  const [selectedStaffBuyerId, setSelectedStaffBuyerId] = useState<string>("staff-1");

  // Staff Khata & Salary Deductions State
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(DEFAULT_STAFF_MEMBERS);
  const [staffPurchases, setStaffPurchases] = useState<StaffProductPurchase[]>([]);
  const [staffDeposits, setStaffDeposits] = useState<StaffDepositRecord[]>([]);
  const [staffAdvances, setStaffAdvances] = useState<StaffAdvance[]>([]);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  // Deposit Form State
  const [showStaffDepositModal, setShowStaffDepositModal] = useState<boolean>(false);
  const [depStaffId, setDepStaffId] = useState<string>("staff-1");
  const [depAmount, setDepAmount] = useState<string>("");
  const [depPaymentMode, setDepPaymentMode] = useState<"cash_galla" | "online_upi">("cash_galla");
  const [depNote, setDepNote] = useState<string>("");

  // Direct Staff Garment Issue Modal State
  const [showStaffIssueModal, setShowStaffIssueModal] = useState<boolean>(false);
  const [issStaffId, setIssStaffId] = useState<string>("staff-1");
  const [issProductSearch, setIssProductSearch] = useState<string>("");
  const [issSelectedProduct, setIssSelectedProduct] = useState<ProductItem | null>(null);
  const [issQty, setIssQty] = useState<number>(1);
  const [issPrice, setIssPrice] = useState<string>("");
  const [issNote, setIssNote] = useState<string>("");

  // Add New Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [newStaffName, setNewStaffName] = useState<string>("");
  const [newStaffPhone, setNewStaffPhone] = useState<string>("");
  const [newStaffRole, setNewStaffRole] = useState<string>("Showroom Sales Executive");
  const [newStaffSalary, setNewStaffSalary] = useState<string>("15000");

  // Edit Staff & Salary Modal State
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [editStaffName, setEditStaffName] = useState<string>("");
  const [editStaffPhone, setEditStaffPhone] = useState<string>("");
  const [editStaffRole, setEditStaffRole] = useState<string>("Sales Executive");
  const [editStaffSalary, setEditStaffSalary] = useState<string>("0");
  const [editStaffIsActive, setEditStaffIsActive] = useState<boolean>(true);

  const issFilteredProducts = useMemo(() => {
    if (!issProductSearch.trim()) return products.slice(0, 12);
    const q = issProductSearch.toLowerCase().trim();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [products, issProductSearch]);
  
  // Alteration in cart
  const [alterationEnabled, setAlterationEnabled] = useState<boolean>(false);
  const [alterationData, setAlterationData] = useState<AlterationDetail>({
    required: false,
    garmentName: "",
    fittingNotes: "Chest: , Waist: , Length: ",
    tailorName: TAILOR_NAMES[0],
    readyDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "Received"
  });

  // History & Alterations
  const [completedBills, setCompletedBills] = useState<CompletedBill[]>([]);
  const [alterationsList, setAlterationsList] = useState<AlterationDetail[]>([]);

  // Sales Report Advanced Filters & Pagination
  const [reportSearch, setReportSearch] = useState<string>("");
  const [reportPaymentFilter, setReportPaymentFilter] = useState<string>("all");
  const [reportDateFilter, setReportDateFilter] = useState<"all" | "today" | "yesterday" | "day_before" | "this_month" | "this_year" | "custom">("today");
  const [reportCustomDate, setReportCustomDate] = useState<string>(() => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  });
  const [reportSortBy, setReportSortBy] = useState<"latest" | "oldest" | "highest" | "lowest">("latest");
  const [reportExpandedBillId, setReportExpandedBillId] = useState<string | null>(null);
  const [reportPage, setReportPage] = useState<number>(1);
  const [reportPageSize, setReportPageSize] = useState<number>(15);

  // Modals & Popups
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState<boolean>(false);
  const [lastBill, setLastBill] = useState<CompletedBill | null>(null);
  const [editingBill, setEditingBill] = useState<CompletedBill | null>(null);
  const [upiQrUrl, setUpiQrUrl] = useState<string>("");
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<ProductItem | null>(null);
  const [barcodeStickerCount, setBarcodeStickerCount] = useState<number>(4);

  // Cloud & Database state
  const [showDbModal, setShowDbModal] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Edit Price / Offer Modal
  const [editingPriceProduct, setEditingPriceProduct] = useState<ProductItem | null>(null);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);
  const [newMrpPrice, setNewMrpPrice] = useState<number>(0);
  const [newOfferBadge, setNewOfferBadge] = useState<string>("");
  const [newStockQty, setNewStockQty] = useState<number>(0);

  // New Product Modal
  const [showNewProductModal, setShowNewProductModal] = useState<boolean>(false);
  const [newProductForm, setNewProductForm] = useState<Partial<ProductItem>>({
    name: "",
    category: "kurtis",
    price: 1500,
    mrp: 1999,
    purchaseCost: 800,
    stock: 10,
    sku: "",
    barcode: "",
    sizes: ["M", "L", "XL"],
    imageUrl: ""
  });

  // Manual / No-Tag Item Modal
  const [showManualItemModal, setShowManualItemModal] = useState<boolean>(false);
  const [manualItemForm, setManualItemForm] = useState<{
    name: string;
    price: string;
    quantity: number;
    category: ProductItem["category"];
    size: string;
    saveToCatalog: boolean;
  }>({
    name: "",
    price: "",
    quantity: 1,
    category: "sarees",
    size: "Standard",
    saveToCatalog: false
  });
  const manualItemNameInputRef = useRef<HTMLInputElement>(null);

  // Barcode quick scan input
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Owner Security Modal for Inventory Edits / Deletions
  const [showOwnerAuthModal, setShowOwnerAuthModal] = useState<boolean>(false);
  const [ownerAuthDetails, setOwnerAuthDetails] = useState<{
    actionType: "stock_change" | "price_change" | "product_edit" | "product_delete" | "bill_edit" | "bill_delete" | "bill_amount_change";
    productId: string;
    productName: string;
    sku: string;
    oldValue: string;
    newValue: string;
    onApprove: (reason: string, approvedVia: "otp" | "remote_click" | "master_pin") => Promise<void> | void;
  } | null>(null);
  const [ownerOtpInput, setOwnerOtpInput] = useState<string>("");
  const [ownerAuthReason, setOwnerAuthReason] = useState<string>("");
  const [ownerAuthStaffName, setOwnerAuthStaffName] = useState<string>("");
  const [ownerAuthError, setOwnerAuthError] = useState<string>("");
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isWaitingRemoteApproval, setIsWaitingRemoteApproval] = useState<boolean>(false);
  const [whatsappOtpSent, setWhatsappOtpSent] = useState<boolean>(false);

  // Helper to merge product lists without ever losing custom user-added items
  const mergeProductLists = (primary: ProductItem[], secondary: ProductItem[]): ProductItem[] => {
    const map = new Map<string, ProductItem>();
    // Put primary items first (including newly added custom items at top)
    for (const item of primary) {
      if (item && item.sku) {
        map.set(item.sku, item);
      }
    }
    // Add any missing items from secondary
    for (const item of secondary) {
      if (item && item.sku && !map.has(item.sku)) {
        map.set(item.sku, item);
      }
    }
    return Array.from(map.values());
  };

  const PURGED_PRODUCT_IDS = new Set([
    "manual-1792225948451",
    "prod-par-1",
    "prod-par-2",
    "prod-par-3",
    "prod-par-4",
    "prod-par-5",
    "prod-par-6",
    "prod-par-7"
  ]);
  const PURGED_PRODUCT_SKUS = new Set([
    "MANUAL-8451",
    "SRV-HD-BR01",
    "SRV-PTY-MK02",
    "SRV-SPA-HR03",
    "SRV-MHN-BD04",
    "SRV-WAX-RC05",
    "SRV-BLS-ST06",
    "SRV-FL-PCO07"
  ]);

  const filterPurgedProducts = (list: ProductItem[]) => (list || []).filter(p => {
    if (!p) return false;
    if (PURGED_PRODUCT_IDS.has(p.id)) return false;
    if (p.sku && PURGED_PRODUCT_SKUS.has(p.sku.toUpperCase().trim())) return false;
    if (p.isService && p.category === "parlour") return false;
    if (p.name && (p.name.toLowerCase().includes("hd beauity") || p.name.toLowerCase().includes("airbrush makeup"))) return false;
    return true;
  });

  // Load local storage & sync on mount (100% Lossless Merge — Never overwrites user-added items)
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(POS_AUTH_STORAGE_KEY);
      if (savedAuth === "authenticated_indu123") {
        setIsAuthenticated(true);
      }
      setAuthChecked(true);

      // Safe Non-Destructive Cache Loading: Never remove products upfront so UI never flashes empty/zero
      const currentVersion = localStorage.getItem("rajnandni_data_version");
      if (currentVersion !== INVENTORY_DATA_VERSION) {
        localStorage.setItem("rajnandni_data_version", INVENTORY_DATA_VERSION);
      }

      const savedProdsRaw = localStorage.getItem("rajnandni_products");
      const savedCustomRaw = localStorage.getItem("rajnandni_custom_items");

      const savedProds: ProductItem[] = savedProdsRaw ? JSON.parse(savedProdsRaw) : [];
      const savedCustom: ProductItem[] = savedCustomRaw ? JSON.parse(savedCustomRaw) : [];

      const cleanSavedProds = filterPurgedProducts(savedProds);
      const cleanSavedCustom = filterPurgedProducts(savedCustom);

      // Always keep user's custom added items at the top + existing saved products + initial 159 products
      const localMerged = filterPurgedProducts(mergeProductLists(
        [...cleanSavedCustom, ...(Array.isArray(cleanSavedProds) ? cleanSavedProds : [])],
        INITIAL_PRODUCTS
      ));

      setProducts(localMerged);
      localStorage.setItem("rajnandni_products", JSON.stringify(localMerged));
      localStorage.setItem("rajnandni_custom_items", JSON.stringify(cleanSavedCustom));
      localStorage.setItem("rajnandni_data_version", INVENTORY_DATA_VERSION);

      // Deleted fake/test bills to permanently purge from cache (only dummy test numbers 0101-0110)
      const KNOWN_PURGED_BILLS = [
        "RJN-2026-0101", "RJN-2026-0102", "RJN-2026-0103", "RJN-2026-0104", "RJN-2026-0105",
        "RJN-2026-0106", "RJN-2026-0107", "RJN-2026-0108", "RJN-2026-0109", "RJN-2026-0110"
      ];
      let allDeletedBillNos = new Set<string>(KNOWN_PURGED_BILLS);
      try {
        const userDeletedRaw = localStorage.getItem("rajnandni_deleted_bills");
        if (userDeletedRaw) {
          const list: string[] = JSON.parse(userDeletedRaw);
          list.forEach(item => {
            // CRITICAL SAFEGUARD: Never treat active legitimate bills (RJN-2026-0250, RJN-2026-0251, etc.) as deleted!
            if (item && !KNOWN_PURGED_BILLS.includes(item)) {
              const m = item.match(/RJN-\d{4}-(\d+)/);
              const num = m ? parseInt(m[1], 10) : 0;
              if (num < 250) {
                allDeletedBillNos.add(item);
              }
            }
          });
        }
      } catch {}
      // Update clean list in localStorage so valid bills (250+) are NEVER trapped in deleted list
      localStorage.setItem("rajnandni_deleted_bills", JSON.stringify(Array.from(allDeletedBillNos)));

      const savedBills = localStorage.getItem("rajnandni_bills");
      let initialBills: CompletedBill[] = [];
      if (savedBills) {
        try {
          const parsedBills: CompletedBill[] = JSON.parse(savedBills);
          initialBills = parsedBills.filter(b => !allDeletedBillNos.has(b.billNo));
        } catch {}
      }
      // Recover any un-synced bills from indestructible vault
      try {
        const vaultRaw = localStorage.getItem("rajnandni_raw_bills_vault");
        if (vaultRaw) {
          const vaultList: CompletedBill[] = JSON.parse(vaultRaw);
          vaultList.forEach(vb => {
            if (vb && vb.billNo && !initialBills.some(ib => ib.billNo === vb.billNo) && !allDeletedBillNos.has(vb.billNo)) {
              initialBills.push(vb);
            }
          });
        }
      } catch {}
      setCompletedBills(initialBills);
      localStorage.setItem("rajnandni_bills", JSON.stringify(initialBills));

      const savedExchanges = ExchangeService.getExchanges();
      if (savedExchanges) setExchangesList(savedExchanges);

      const savedAlts = localStorage.getItem("rajnandni_alterations");
      if (savedAlts) setAlterationsList(JSON.parse(savedAlts));

      // Fetch Staff Members, Garment Purchases, Deposits, and Advances
      StaffExpenseService.fetchStaffMembers().then(sm => {
        if (sm && sm.length > 0) setStaffMembers(sm);
      }).catch(() => {});
      StaffExpenseService.fetchStaffPurchases().then(sp => {
        if (sp) setStaffPurchases(sp);
      }).catch(() => {});
      StaffExpenseService.fetchStaffDeposits().then(sd => {
        if (sd) setStaffDeposits(sd);
      }).catch(() => {});
      StaffExpenseService.fetchAdvances().then(sa => {
        if (sa) setStaffAdvances(sa);
      }).catch(() => {});

      // Check Supabase connection & merge products and bills
      if (isSupabaseConfigured()) {
        setSupabaseConnected(true);
        SupabaseService.fetchProducts().then((remoteProds) => {
          if (remoteProds && remoteProds.length > 0) {
            const cleanRemote = filterPurgedProducts(remoteProds);
            // Read latest localStorage in case user added items while fetch was running
            const latestLocalRaw = localStorage.getItem("rajnandni_products");
            const latestCustomRaw = localStorage.getItem("rajnandni_custom_items");
            const latestLocal: ProductItem[] = filterPurgedProducts(latestLocalRaw ? JSON.parse(latestLocalRaw) : localMerged);
            const latestCustom: ProductItem[] = filterPurgedProducts(latestCustomRaw ? JSON.parse(latestCustomRaw) : cleanSavedCustom);

            // Authoritative remote catalog: Supabase is single source of truth for stock, cost & price
            const remoteSkuSet = new Set(cleanRemote.map((r: ProductItem) => (r.sku || "").toUpperCase().trim()).filter(Boolean));

            // CRITICAL LOSSLESS SAFEGUARD: Never drop any item that exists locally, in custom items, or in INITIAL_PRODUCTS
            const localPool = [...latestCustom, ...latestLocal, ...INITIAL_PRODUCTS];
            const missingFromRemote = filterPurgedProducts(
              localPool.filter(p => p && p.sku && !remoteSkuSet.has(p.sku.toUpperCase().trim()))
            );
            // Deduplicate missing items by SKU
            const uniqueMissing = mergeProductLists([], missingFromRemote);

            // Authoritative merge: clean remote items + any local items not yet in cloud
            const finalMerged = mergeProductLists(cleanRemote, uniqueMissing);
            setProducts(finalMerged);
            localStorage.setItem("rajnandni_products", JSON.stringify(finalMerged));

            // Preserve all custom items that aren't in INITIAL_PRODUCTS
            const initialSkus = new Set(INITIAL_PRODUCTS.map(ip => (ip.sku || "").toUpperCase().trim()));
            const allCustomItems = finalMerged.filter(p => p && p.sku && !initialSkus.has(p.sku.toUpperCase().trim()));
            localStorage.setItem("rajnandni_custom_items", JSON.stringify(allCustomItems));

            // Push any legitimate local items that are missing in Supabase up to the cloud automatically
            if (uniqueMissing.length > 0) {
              SupabaseService.syncInitialProducts(uniqueMissing).catch(err => {
                console.warn("Supabase auto-sync missing items error:", err);
              });
            }
            setSyncStatusText(`Synced (${finalMerged.length} items safe)`);
          } else {
            SupabaseService.syncInitialProducts(localMerged).then(() => {
              setSyncStatusText(`Pushed ${localMerged.length} products to Supabase`);
            });
          }
        }).catch((err) => {
          console.warn("Supabase fetch notice:", err);
        });

        // Sync recent bills from Supabase to guarantee accurate invoice sequences across devices
        SupabaseService.fetchRecentBills().then((remoteBills) => {
          if (remoteBills && remoteBills.length > 0) {
            const initialCostMap = new Map<string, number>();
            INITIAL_PRODUCTS.forEach(p => {
              if (p.purchaseCost > 0) {
                if (p.id) initialCostMap.set(p.id.toLowerCase(), p.purchaseCost);
                if (p.sku) initialCostMap.set(p.sku.toLowerCase(), p.purchaseCost);
                if (p.name) initialCostMap.set(p.name.trim().toLowerCase(), p.purchaseCost);
              }
            });
            localMerged.forEach(p => {
              if (p.purchaseCost > 0) {
                if (p.id) initialCostMap.set(p.id.toLowerCase(), p.purchaseCost);
                if (p.sku) initialCostMap.set(p.sku.toLowerCase(), p.purchaseCost);
                if (p.name) initialCostMap.set(p.name.trim().toLowerCase(), p.purchaseCost);
              }
            });

            const mappedRemote: CompletedBill[] = remoteBills
              .filter((b: any) => !allDeletedBillNos.has(b.invoice_number))
              .map((b: any) => ({
                id: b.id,
                billNo: b.invoice_number,
                customer: {
                  name: b.customer_name || "Walk-in Guest",
                  phone: b.customer_phone || "NA",
                  notes: ""
                },
                items: (b.items || []).map((it: any) => {
                  const itSku = (it.sku || it.product?.sku || "").toLowerCase();
                  const itId = (it.id || it.product?.id || "").toLowerCase();
                  const itName = (it.name || it.product?.name || "").trim().toLowerCase();
                  const pCost = Number(it.purchase_cost || it.purchaseCost || it.product?.purchaseCost) ||
                                (itSku && initialCostMap.get(itSku)) ||
                                (itId && initialCostMap.get(itId)) ||
                                (itName && initialCostMap.get(itName)) ||
                                0;
                  return {
                    product: {
                      id: it.id || "",
                      name: it.name || "Ethnic Item",
                      sku: it.sku || "",
                      barcode: it.barcode || "",
                      category: it.category || "sarees",
                      price: Number(it.price) || 0,
                      mrp: Number(it.mrp || it.price) || 0,
                      purchaseCost: pCost,
                      stock: 1
                    },
                    quantity: it.quantity || 1,
                    price: Number(it.price) || 0,
                    originalPrice: Number(it.mrp || it.price) || 0,
                    selectedSize: it.size || "Standard",
                    customDiscount: 0
                  };
                }),
                subtotal: Number(b.subtotal) || 0,
                discount: Number(b.discount) || 0,
                taxGst: Number(b.tax) || 0,
                grandTotal: Number(b.total) || 0,
                paidAmount: Number(b.total) || 0,
                paymentMode: b.payment_mode || "UPI",
                createdAt: new Date(b.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
                rawDate: b.created_at
              }));

            setCompletedBills(prev => {
              const billMap = new Map<string, CompletedBill>();
              mappedRemote.forEach(b => billMap.set(b.billNo, b));

              // Compute highest known sequence across remote bills
              let currentMaxSeq = 251;
              billMap.forEach((_, bNo) => {
                const m = (bNo || "").match(/RJN-\d{4}-(\d+)/);
                if (m) {
                  const s = parseInt(m[1], 10);
                  if (s > currentMaxSeq) currentMaxSeq = s;
                }
              });

              // Also gather all bills from vault so no local sale is ever lost
              const localCandidates: CompletedBill[] = [...prev];
              try {
                const vaultRaw = localStorage.getItem("rajnandni_raw_bills_vault");
                if (vaultRaw) {
                  const vaultBills: CompletedBill[] = JSON.parse(vaultRaw);
                  vaultBills.forEach(vb => {
                    if (vb && vb.billNo && !localCandidates.some(c => c.id === vb.id || c.billNo === vb.billNo)) {
                      localCandidates.push(vb);
                    }
                  });
                }
              } catch {}

              // Merge any valid local bills not yet in remote, and sync them to cloud
              localCandidates.forEach(b => {
                if (!b || !b.billNo) return;
                if (allDeletedBillNos.has(b.billNo) && KNOWN_PURGED_BILLS.includes(b.billNo)) return;

                if (!billMap.has(b.billNo)) {
                  // Truly new bill: add to map and push to Supabase
                  billMap.set(b.billNo, b);
                  SupabaseService.recordSale({
                    invoiceNumber: b.billNo,
                    customerName: b.customer.name,
                    customerPhone: b.customer.phone,
                    subtotal: b.subtotal,
                    discount: b.discount,
                    tax: b.taxGst || 0,
                    total: b.grandTotal,
                    paymentMode: b.paymentMode,
                    items: b.items.map(it => ({
                      id: it.product.id,
                      name: it.product.name,
                      sku: it.product.sku,
                      price: it.price,
                      quantity: it.quantity,
                      isService: it.product.isService
                    }))
                  }).catch(() => {});
                } else {
                  // Bill number exists in remote: Check if it's the exact same bill or a collided different sale
                  const remoteBill = billMap.get(b.billNo)!;
                  const isSameBill =
                    (b.customer.phone && b.customer.phone !== "NA" && b.customer.phone === remoteBill.customer.phone) ||
                    (b.customer.name.trim().toLowerCase() === remoteBill.customer.name.trim().toLowerCase() && Math.abs(b.grandTotal - remoteBill.grandTotal) < 1);

                  if (!isSameBill && (b.customer.name !== "Walk-in Guest" || b.grandTotal !== remoteBill.grandTotal)) {
                    // Different customer or total! This was a collided bill!
                    // NEVER DELETE IT! Reassign it a new sequence number and upload to cloud!
                    currentMaxSeq++;
                    const reassignedNo = `RJN-${new Date().getFullYear()}-${String(currentMaxSeq).padStart(4, "0")}`;
                    const recovered: CompletedBill = {
                      ...b,
                      billNo: reassignedNo
                    };
                    billMap.set(reassignedNo, recovered);
                    SupabaseService.recordSale({
                      invoiceNumber: reassignedNo,
                      customerName: recovered.customer.name,
                      customerPhone: recovered.customer.phone,
                      subtotal: recovered.subtotal,
                      discount: recovered.discount,
                      tax: recovered.taxGst || 0,
                      total: recovered.grandTotal,
                      paymentMode: recovered.paymentMode,
                      items: recovered.items.map(it => ({
                        id: it.product.id,
                        name: it.product.name,
                        sku: it.product.sku,
                        price: it.price,
                        quantity: it.quantity,
                        isService: it.product.isService
                      }))
                    }).catch(() => {});
                  }
                }
              });

              const parseSeq = (no: string) => {
                const m = (no || "").match(/(\d+)$/);
                return m ? parseInt(m[1], 10) : 0;
              };

              const merged = Array.from(billMap.values()).sort((a, b) => {
                const sA = parseSeq(a.billNo);
                const sB = parseSeq(b.billNo);
                if (sA !== sB) return sB - sA;
                return (b.rawDate || b.createdAt).localeCompare(a.rawDate || a.createdAt);
              });
              localStorage.setItem("rajnandni_bills", JSON.stringify(merged));

              // Also persist all merged bills to permanent vault
              try {
                const rawVault = localStorage.getItem("rajnandni_raw_bills_vault");
                const vault: CompletedBill[] = rawVault ? JSON.parse(rawVault) : [];
                merged.forEach(b => {
                  if (!vault.some(v => v.billNo === b.billNo)) {
                    vault.push(b);
                  }
                });
                localStorage.setItem("rajnandni_raw_bills_vault", JSON.stringify(vault));
              } catch {}

              return merged;
            });
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Local storage parse notice:", e);
      setAuthChecked(true);
    }
  }, []);

  // Login & Lock Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === POS_ACCESS_PASSWORD) {
      localStorage.setItem(POS_AUTH_STORAGE_KEY, "authenticated_indu123");
      setIsAuthenticated(true);
      setLoginError("");
      setPasswordInput("");
    } else {
      setLoginError("Incorrect password! Please enter valid store password.");
    }
  };

  const handleLogoutLock = () => {
    localStorage.removeItem(POS_AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setPasswordInput("");
    setLoginError("");
  };

  // Force re-load & live sync products and stock directly from Supabase Cloud
  const handleReloadWholesaleInventory = async () => {
    try {
      if (!isSupabaseConfigured()) {
        alert("Supabase keys are not configured.");
        return;
      }
      setIsSyncing(true);
      setSyncStatusText("Fetching live stock from Supabase...");
      const remoteProds = await SupabaseService.fetchProducts();
      if (remoteProds && remoteProds.length > 0) {
        const cleanRemote = filterPurgedProducts(remoteProds);
        const remoteSkuSet = new Set(cleanRemote.map((r: ProductItem) => (r.sku || "").toUpperCase().trim()).filter(Boolean));
        const savedCustomRaw = localStorage.getItem("rajnandni_custom_items");
        const savedCustom: ProductItem[] = savedCustomRaw ? JSON.parse(savedCustomRaw) : [];
        const savedProdsRaw = localStorage.getItem("rajnandni_products");
        const savedProds: ProductItem[] = savedProdsRaw ? JSON.parse(savedProdsRaw) : [];

        const localPool = [...savedCustom, ...savedProds, ...INITIAL_PRODUCTS];
        const missingFromRemote = filterPurgedProducts(
          localPool.filter(p => p && p.sku && !remoteSkuSet.has(p.sku.toUpperCase().trim()))
        );
        const uniqueMissing = mergeProductLists([], missingFromRemote);
        const finalMerged = mergeProductLists(cleanRemote, uniqueMissing);

        setProducts(finalMerged);
        saveProductsLocally(finalMerged);

        if (uniqueMissing.length > 0) {
          await SupabaseService.syncInitialProducts(uniqueMissing).catch(err => {
            console.warn("Supabase manual sync missing items error:", err);
          });
        }
        setSyncStatusText(`Synced (${finalMerged.length} items live)`);
        const totalPcs = finalMerged.filter(p => !p.isService).reduce((s, p) => s + (Number(p.stock) || 0), 0);
        alert(`✅ Live stock synchronized from Supabase!\n\n• Total Genuine Designs: ${finalMerged.length}\n• Current Showroom Stock: ${totalPcs.toLocaleString("en-IN")} pcs\n\nAll cache updated successfully.`);
      }
    } catch (e: any) {
      alert("Error refreshing from database: " + (e?.message || e));
    } finally {
      setIsSyncing(false);
    }
  };

  // Push current inventory to Supabase Cloud
  const handlePushToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      alert("Supabase keys are not configured yet.\n\nPlease add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.");
      return;
    }
    setIsSyncing(true);
    try {
      const ok = await SupabaseService.syncInitialProducts(products);
      if (ok) {
        setSupabaseConnected(true);
        setSyncStatusText(`Synced all ${products.length} items to Supabase Cloud!`);
        alert(`✅ All ${products.length} products successfully pushed to Supabase Cloud!`);
      } else {
        alert("⚠️ Cloud sync did not complete. Please check table permissions or SQL schema.");
      }
    } catch (e: any) {
      alert("Sync error: " + (e?.message || String(e)));
    } finally {
      setIsSyncing(false);
    }
  };

  // Force-sync all local bills with Cloud Supabase (bidirectional)
  const handleForceSyncBills = async () => {
    if (!isSupabaseConfigured()) {
      alert("Supabase is not configured.");
      return;
    }
    setIsSyncing(true);
    try {
      let localList: CompletedBill[] = [...completedBills];
      try {
        const raw = localStorage.getItem("rajnandni_bills");
        if (raw) {
          const parsed = JSON.parse(raw);
          const map = new Map<string, CompletedBill>();
          localList.forEach(b => map.set(b.billNo, b));
          parsed.forEach((b: CompletedBill) => map.set(b.billNo, b));
          localList = Array.from(map.values());
        }
      } catch {}

      const remoteBills = await SupabaseService.fetchRecentBills();
      const remoteMap = new Map<string, any>();
      if (remoteBills) {
        remoteBills.forEach(b => remoteMap.set(b.invoice_number, b));
      }

      let uploadedCount = 0;
      for (const b of localList) {
        if (!remoteMap.has(b.billNo)) {
          const ok = await SupabaseService.recordSale({
            invoiceNumber: b.billNo,
            customerName: b.customer?.name || "Walk-in Guest",
            customerPhone: b.customer?.phone || "NA",
            subtotal: b.subtotal || 0,
            discount: b.discount || 0,
            tax: b.taxGst || 0,
            total: b.grandTotal || 0,
            paymentMode: b.paymentMode || "UPI",
            items: (b.items || []).map(it => ({
              id: it.product?.id || "",
              name: it.product?.name || "Item",
              sku: it.product?.sku || "",
              barcode: it.product?.barcode || (it as any).barcode || it.product?.sku || "",
              category: it.product?.category || "sarees",
              price: it.price || 0,
              quantity: it.quantity || 1,
              isService: it.product?.isService || false
            }))
          });
          if (ok) uploadedCount++;
        }
      }

      const freshRemote = await SupabaseService.fetchRecentBills();
      if (freshRemote && freshRemote.length > 0) {
        const mappedRemote: CompletedBill[] = freshRemote.map((b: any) => ({
          id: b.id,
          billNo: b.invoice_number,
          customer: {
            name: b.customer_name || "Walk-in Guest",
            phone: b.customer_phone || "NA",
            notes: ""
          },
          items: (b.items || []).map((it: any) => ({
            product: {
              id: it.id || "",
              name: it.name || "Ethnic Item",
              sku: it.sku || "",
              barcode: it.barcode || "",
              category: it.category || "sarees",
              price: Number(it.price) || 0,
              mrp: Number(it.mrp || it.price) || 0,
              purchaseCost: Number(it.purchase_cost || 0),
              stock: 1
            },
            quantity: it.quantity || 1,
            price: Number(it.price) || 0,
            originalPrice: Number(it.price) || 0,
            selectedSize: "Standard",
            customDiscount: 0
          })),
          subtotal: Number(b.subtotal) || 0,
          discount: Number(b.discount) || 0,
          taxGst: Number(b.tax) || 0,
          grandTotal: Number(b.total) || 0,
          paidAmount: Number(b.total) || 0,
          paymentMode: b.payment_mode || "UPI",
          createdAt: new Date(b.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
          rawDate: b.created_at
        }));
        setCompletedBills(mappedRemote);
        localStorage.setItem("rajnandni_bills", JSON.stringify(mappedRemote));
      }
      alert(`✅ Cloud Sync Successful!\n\nUploaded ${uploadedCount} bills from this device to Cloud.\nTotal bills now active: ${freshRemote ? freshRemote.length : localList.length}`);
    } catch (e: any) {
      alert("Sync error: " + (e?.message || String(e)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(completedBills, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `rajnandini_bills_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("Could not export bills.");
    }
  };

  // Save changes (saves both full catalog AND dedicated custom items backup so nothing is ever lost)
  const saveProductsLocally = (items: ProductItem[]) => {
    setProducts(items);
    localStorage.setItem("rajnandni_products", JSON.stringify(items));
    const initialSkus = new Set(INITIAL_PRODUCTS.map(ip => ip.sku));
    const customOnly = items.filter(p => !initialSkus.has(p.sku));
    localStorage.setItem("rajnandni_custom_items", JSON.stringify(customOnly));
  };

  const VAULT_STORAGE_KEY = "rajnandni_raw_bills_vault";

  const appendBillToVault = (bill: CompletedBill) => {
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      const vault: CompletedBill[] = raw ? JSON.parse(raw) : [];
      const idx = vault.findIndex(v => v.id === bill.id || (v.billNo === bill.billNo && v.customer?.phone === bill.customer?.phone));
      if (idx >= 0) {
        vault[idx] = bill;
      } else {
        vault.push(bill);
      }
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    } catch (err) {
      console.error("Vault save notice:", err);
    }
  };

  const saveBillsLocally = (bills: CompletedBill[]) => {
    setCompletedBills(bills);
    localStorage.setItem("rajnandni_bills", JSON.stringify(bills));
    bills.forEach(b => appendBillToVault(b));
  };

  const handleClearCart = () => {
    setCart([]);
    setEditingBill(null);
    setCustomer({ name: "", phone: "", notes: "" });
    setDiscountAmount(0);
    setAgreedDealPrice("");
    setEditingPriceIdx(null);
    setAlterationEnabled(false);
  };

  const saveAlterationsLocally = (alts: AlterationDetail[]) => {
    setAlterationsList(alts);
    localStorage.setItem("rajnandni_alterations", JSON.stringify(alts));
  };

  // Open edit price modal
  const openEditProductPrice = (p: ProductItem) => {
    setEditingPriceProduct(p);
    setNewSellingPrice(p.price);
    setNewMrpPrice(p.mrp);
    setNewOfferBadge(p.badge || "");
    setNewStockQty(p.stock);
  };

  // Save updated product price / offer
  const handleSaveProductPriceChange = async () => {
    if (!editingPriceProduct) return;
    const updatedPrice = Number(newSellingPrice);
    const updatedMrp = Number(newMrpPrice);
    const updatedStock = Number(newStockQty);

    if (isNaN(updatedPrice) || updatedPrice <= 0) {
      alert("Please enter a valid selling price");
      return;
    }

    const stockChanged = updatedStock !== editingPriceProduct.stock;
    const priceChanged = updatedPrice !== editingPriceProduct.price;

    // If stock or price changed, require Owner Authorization
    if (stockChanged || priceChanged) {
      const prod = editingPriceProduct;
      setOwnerOtpInput("");
      setOwnerAuthReason("");
      setOwnerAuthError("");
      setActiveRequestId(null);
      setIsWaitingRemoteApproval(false);

      setOwnerAuthDetails({
        actionType: stockChanged ? "stock_change" : "price_change",
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        oldValue: stockChanged
          ? `Stock: ${prod.stock} pcs`
          : `Selling Rate: ₹${prod.price.toLocaleString("en-IN")}`,
        newValue: stockChanged
          ? `Stock: ${updatedStock} pcs`
          : `Selling Rate: ₹${updatedPrice.toLocaleString("en-IN")}`,
        onApprove: async (reason, approvedVia) => {
          const updatedList = products.map(p => {
            if (p.id === prod.id) {
              return {
                ...p,
                price: updatedPrice,
                mrp: updatedMrp > 0 ? updatedMrp : Math.round(updatedPrice * 1.25),
                badge: newOfferBadge.trim() || undefined,
                stock: updatedStock >= 0 ? updatedStock : p.stock,
              };
            }
            return p;
          });

          saveProductsLocally(updatedList);

          if (isSupabaseConfigured()) {
            SupabaseService.updateProductPrice(
              prod.sku,
              updatedPrice,
              updatedMrp > 0 ? updatedMrp : Math.round(updatedPrice * 1.25),
              newOfferBadge.trim() || undefined
            ).catch(e => console.warn("Supabase update price warning:", e));
          }

          alert(`✅ Price & Stock updated with Owner Approval! Barcode (${prod.barcode}) will now automatically scan at ₹${updatedPrice.toLocaleString("en-IN")}.`);
          setEditingPriceProduct(null);
        }
      });
      setShowOwnerAuthModal(true);
      return;
    }

    // Only badge changed (no stock, no price change)
    const updatedList = products.map(p => {
      if (p.id === editingPriceProduct.id) {
        return {
          ...p,
          badge: newOfferBadge.trim() || undefined,
        };
      }
      return p;
    });

    saveProductsLocally(updatedList);

    if (isSupabaseConfigured()) {
      SupabaseService.updateProductPrice(
        editingPriceProduct.sku,
        editingPriceProduct.price,
        editingPriceProduct.mrp,
        newOfferBadge.trim() || undefined
      ).catch(e => console.warn("Supabase update price warning:", e));
    }

    alert(`✅ Offer badge updated!`);
    setEditingPriceProduct(null);
  };

  // Owner Verification Handlers
  const handleSendWhatsAppOtp = () => {
    if (!ownerAuthDetails) return;
    const req = createWhatsAppOtpRequest({
      action: ownerAuthDetails.actionType === "stock_change"
        ? "Stock Adjustment"
        : ownerAuthDetails.actionType === "price_change"
        ? "Price / Rate Revision"
        : ownerAuthDetails.actionType === "product_delete"
        ? "Delete Product"
        : ownerAuthDetails.actionType === "bill_edit"
        ? "Modify Completed Bill"
        : ownerAuthDetails.actionType === "bill_delete"
        ? "Permanently Delete Bill"
        : ownerAuthDetails.actionType === "bill_amount_change"
        ? "Change Bill Total Amount"
        : "Product Edit",
      productName: ownerAuthDetails.productName,
      oldValue: ownerAuthDetails.oldValue,
      newValue: ownerAuthDetails.newValue,
      staffName: ownerAuthStaffName.trim() || "Showroom Staff",
      reason: ownerAuthReason.trim() || "Showroom Modification",
    });

    setWhatsappOtpSent(true);
    setOwnerAuthError("");

    if (typeof window !== "undefined") {
      window.open(req.whatsappUrl, "_blank");
    }
  };

  const handleVerifyOwnerOtp = async () => {
    if (!ownerAuthDetails) return;
    if (!ownerOtpInput.trim()) {
      setOwnerAuthError("Please enter the 6-digit OTP received on Owner's WhatsApp (+91 7464987898)!");
      return;
    }

    const isValid = verifyWhatsAppOtp(ownerOtpInput);
    if (!isValid) {
      setOwnerAuthError("Invalid OTP code! Please check the OTP sent to Owner's WhatsApp (+91 7464987898).");
      return;
    }

    try {
      await ownerAuthDetails.onApprove(ownerAuthReason.trim() || "WhatsApp OTP Approved", "otp");
      await OwnerSecurityService.logAuditEntry({
        actionType: ownerAuthDetails.actionType,
        productId: ownerAuthDetails.productId,
        productName: ownerAuthDetails.productName,
        sku: ownerAuthDetails.sku,
        oldValue: ownerAuthDetails.oldValue,
        newValue: ownerAuthDetails.newValue,
        reason: ownerAuthReason.trim() || "WhatsApp OTP Verified by Owner",
        staffName: ownerAuthStaffName.trim() || "Showroom Staff",
        approvedVia: "otp",
      });
      setShowOwnerAuthModal(false);
      setOwnerAuthDetails(null);
      setOwnerOtpInput("");
      setOwnerAuthReason("");
      setOwnerAuthError("");
      setActiveRequestId(null);
      setIsWaitingRemoteApproval(false);
      setWhatsappOtpSent(false);
    } catch (e) {
      console.error("Failed to approve action:", e);
      setOwnerAuthError("Error saving changes");
    }
  };

  const handleSendRemoteRequest = async () => {
    if (!ownerAuthDetails) return;
    const effectiveReason = ownerAuthReason.trim() || "Inventory Adjustment / Verification";
    setOwnerAuthError("");
    setIsWaitingRemoteApproval(true);

    try {
      const req = await OwnerSecurityService.createRequest({
        actionType: ownerAuthDetails.actionType,
        productId: ownerAuthDetails.productId,
        productName: ownerAuthDetails.productName,
        sku: ownerAuthDetails.sku,
        oldValue: ownerAuthDetails.oldValue,
        newValue: ownerAuthDetails.newValue,
        reason: effectiveReason,
        staffName: ownerAuthStaffName.trim() || "Showroom Staff",
      });
      setActiveRequestId(req.id);
    } catch (e) {
      console.error("Failed to create remote request:", e);
      setIsWaitingRemoteApproval(false);
      setOwnerAuthError("Failed to send request. Please enter the Master PIN instead.");
    }
  };

  // Poll and listen for Remote 1-Click Approval from Owner's phone
  useEffect(() => {
    if (!showOwnerAuthModal || !activeRequestId || !isWaitingRemoteApproval) return;

    const checkInterval = setInterval(async () => {
      const status = await OwnerSecurityService.getRequestStatus(activeRequestId);
      if (status === "approved") {
        clearInterval(checkInterval);
        setIsWaitingRemoteApproval(false);
        if (ownerAuthDetails) {
          await ownerAuthDetails.onApprove(ownerAuthReason.trim(), "remote_click");
          await OwnerSecurityService.logAuditEntry({
            actionType: ownerAuthDetails.actionType,
            productId: ownerAuthDetails.productId,
            productName: ownerAuthDetails.productName,
            sku: ownerAuthDetails.sku,
            oldValue: ownerAuthDetails.oldValue,
            newValue: ownerAuthDetails.newValue,
            reason: ownerAuthReason.trim() || "Remote 1-Click Approved by Owner",
            staffName: ownerAuthStaffName.trim() || "Showroom Staff",
            approvedVia: "remote_click",
          });
        }
        setShowOwnerAuthModal(false);
        setOwnerAuthDetails(null);
        setActiveRequestId(null);
        setOwnerAuthError("");
      } else if (status === "rejected") {
        clearInterval(checkInterval);
        setIsWaitingRemoteApproval(false);
        setOwnerAuthError("❌ Request was rejected by the Owner on their phone.");
      }
    }, 2000);

    const unsubscribe = subscribeBroadcast(async (event) => {
      if (event.type === "REQUEST_RESOLVED" && event.payload.id === activeRequestId) {
        if (event.payload.status === "approved") {
          setIsWaitingRemoteApproval(false);
          if (ownerAuthDetails) {
            await ownerAuthDetails.onApprove(ownerAuthReason.trim(), "remote_click");
            await OwnerSecurityService.logAuditEntry({
              actionType: ownerAuthDetails.actionType,
              productId: ownerAuthDetails.productId,
              productName: ownerAuthDetails.productName,
              sku: ownerAuthDetails.sku,
              oldValue: ownerAuthDetails.oldValue,
              newValue: ownerAuthDetails.newValue,
              reason: ownerAuthReason.trim() || "Remote 1-Click Approved by Owner",
              staffName: ownerAuthStaffName.trim() || "Showroom Staff",
              approvedVia: "remote_click",
            });
          }
          setShowOwnerAuthModal(false);
          setOwnerAuthDetails(null);
          setActiveRequestId(null);
          setOwnerAuthError("");
        } else {
          setIsWaitingRemoteApproval(false);
          setOwnerAuthError("❌ Request was rejected by the Owner on their phone.");
        }
      }
    });

    return () => {
      clearInterval(checkInterval);
      unsubscribe();
    };
  }, [showOwnerAuthModal, activeRequestId, isWaitingRemoteApproval, ownerAuthDetails, ownerAuthReason, ownerAuthStaffName]);

  // Global Barcode Scanner Gun Listener
  // Works from anywhere on screen when gun scans and sends Enter key
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "SELECT"
      );

      // Don't intercept if user is typing into search or another modal input
      if (isInputFocused && activeEl !== barcodeInputRef.current) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          const scannedCode = buffer.trim();
          const found = products.find(
            p => p.barcode === scannedCode || p.sku.toLowerCase() === scannedCode.toLowerCase()
          );
          if (found) {
            handleAddToCart(found);
            setActiveTab("pos");
          }
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [products]);

  // Calculations (Including Negotiation & Customer Bargain Totals)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const catalogTotal = cart.reduce((sum, item) => sum + (item.originalPrice || item.product.price) * item.quantity, 0);
  const itemLevelSavings = Math.max(0, catalogTotal - subtotal);
  const totalSavings = itemLevelSavings + discountAmount;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Generate Dynamic UPI QR whenever GrandTotal changes
  useEffect(() => {
    if (grandTotal > 0) {
      // Standard UPI Payment URI: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR
      // Using shop UPI handle
      const upiString = `upi://pay?pa=9897000000@upi&pn=Rajnandini&am=${grandTotal}&cu=INR&tn=Bill+Payment`;
      QRCode.toDataURL(upiString, { width: 180, margin: 1 }, (err, url) => {
        if (!err && url) setUpiQrUrl(url);
      });
    }
  }, [grandTotal]);

  // Filtered Products (Memoized for zero-lag typing & scanning)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchesStock = !inStockOnly || p.isService || p.stock > 0;
      const matchesBridal = !bridalFilterActive || 
        p.category === "lehengas" || 
        (p.badge && p.badge.toLowerCase().includes("bridal")) || 
        p.name.toLowerCase().includes("bridal") ||
        p.name.toLowerCase().includes("zardozi");
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) || 
        p.barcode.includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q));
      return matchesCat && matchesStock && matchesBridal && matchesSearch;
    });
  }, [products, selectedCategory, inStockOnly, bridalFilterActive, searchQuery]);

  // Handle Add To Cart
  const handleAddToCart = (product: ProductItem, size?: string) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => 
        item.product.id === product.id && item.selectedSize === size
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      } else {
        return [
          ...prev,
          {
            product,
            selectedSize: size || product.sizes?.[0] || "Standard",
            beauticianName: product.isService ? STAFF_BEAUTICIANS[0] : undefined,
            quantity: 1,
            price: product.price,
            originalPrice: product.price,
            isNegotiated: false,
            customDiscount: 0
          }
        ];
      }
    });

    // Auto set alteration garment name suggestion
    if (!product.isService && (product.category === "lehengas" || product.category === "kurtis")) {
      setAlterationData(d => ({ ...d, garmentName: product.name }));
    }
  };

  // Auto focus item name input when manual item modal opens
  useEffect(() => {
    if (showManualItemModal) {
      setTimeout(() => {
        manualItemNameInputRef.current?.focus();
      }, 100);
    }
  }, [showManualItemModal]);

  // Add Manual / No-Tag Custom Item to Cart
  const handleAddManualItemToCart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualItemForm.name.trim()) {
      alert("Please enter item name (e.g. Matching Latkan, Fall Pico, Extra Dupatta, etc.)");
      return;
    }
    const unitPrice = Number(manualItemForm.price);
    if (isNaN(unitPrice) || unitPrice < 0) {
      alert("Please enter a valid price (₹)");
      return;
    }
    const qty = Math.max(1, Number(manualItemForm.quantity) || 1);
    const cat = manualItemForm.category || "sarees";
    const manualProd: ProductItem = {
      id: `manual-${Date.now()}`,
      sku: `MANUAL-${Date.now().toString().slice(-4)}`,
      barcode: `NO-BARCODE`,
      name: manualItemForm.name.trim(),
      category: cat,
      price: unitPrice,
      mrp: unitPrice,
      purchaseCost: 0,
      stock: 999,
      sizes: [manualItemForm.size || "Standard"],
      isService: cat === "parlour"
    };

    setCart(prev => [
      ...prev,
      {
        product: manualProd,
        selectedSize: manualItemForm.size || "Standard",
        quantity: qty,
        price: unitPrice,
        originalPrice: unitPrice,
        isNegotiated: false,
        customDiscount: 0
      }
    ]);

    if (manualItemForm.saveToCatalog) {
      const updatedCatalog = [manualProd, ...products];
      saveProductsLocally(updatedCatalog);
      if (isSupabaseConfigured()) {
        SupabaseService.syncInitialProducts([manualProd]).catch(() => {});
      }
    }

    setShowManualItemModal(false);
    setManualItemForm({ name: "", price: "", quantity: 1, category: "sarees", size: "Standard", saveToCatalog: false });
  };

  // Item-level negotiation handlers
  const startEditingItemPrice = (idx: number, currentPrice: number) => {
    setEditingPriceIdx(idx);
    setTempItemPrice(String(currentPrice));
  };

  const saveNegotiatedItemPrice = (idx: number) => {
    const val = Number(tempItemPrice);
    if (!isNaN(val) && val >= 0) {
      setCart(prev => {
        const next = [...prev];
        const item = next[idx];
        const orig = item.originalPrice || item.product.price;
        next[idx] = {
          ...item,
          price: val,
          originalPrice: orig,
          isNegotiated: val !== orig
        };
        return next;
      });
    }
    setEditingPriceIdx(null);
  };

  const resetItemPrice = (idx: number) => {
    setCart(prev => {
      const next = [...prev];
      const item = next[idx];
      next[idx] = {
        ...item,
        price: item.product.price,
        originalPrice: item.product.price,
        isNegotiated: false
      };
      return next;
    });
    setEditingPriceIdx(null);
  };

  // Quick Round-off handler
  const handleQuickRoundOff = (roundBase: number) => {
    if (subtotal <= 0) return;
    const rounded = Math.floor(subtotal / roundBase) * roundBase;
    const discount = Math.max(0, subtotal - rounded);
    setDiscountAmount(discount);
    setAgreedDealPrice(String(rounded));
    setDiscountReason("Rounding Off");
  };

  // Quick % discount handler
  const handleQuickPercentDiscount = (percent: number) => {
    if (subtotal <= 0) return;
    const discount = Math.round(subtotal * (percent / 100));
    setDiscountAmount(discount);
    setAgreedDealPrice(String(subtotal - discount));
  };

  // Quick flat discount handler
  const handleQuickFlatDiscount = (amount: number) => {
    if (subtotal <= 0) return;
    const discount = Math.min(subtotal, amount);
    setDiscountAmount(discount);
    setAgreedDealPrice(String(subtotal - discount));
  };

  // Direct Agreed Deal Price Input handler
  const handleAgreedDealPriceChange = (valStr: string) => {
    setAgreedDealPrice(valStr);
    const num = Number(valStr);
    if (!isNaN(num) && num > 0 && num <= subtotal) {
      setDiscountAmount(subtotal - num);
    } else if (valStr === "") {
      setDiscountAmount(0);
    }
  };

  // Barcode Gun Scan handler (Enter key triggers instant add)
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const code = searchQuery.trim();
      if (!code) return;
      
      const found = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
      if (found) {
        handleAddToCart(found);
        setSearchQuery("");
      }
    }
  };

  // Modify Cart Item Quantity
  const updateQuantity = (idx: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      next[idx].quantity = newQty;
      return next;
    });
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  // Complete Checkout or Update Existing Bill
  const handleCheckout = () => {
    // If in Edit Mode, update the existing bill without generating a new bill number
    if (editingBill) {
      const updatedBill: CompletedBill = {
        ...editingBill,
        customer: {
          name: customer.name.trim() || "Walk-in Guest",
          phone: customer.phone.trim() || "NA",
          notes: customer.notes.trim()
        },
        items: [...cart],
        subtotal,
        discount: discountAmount,
        discountReason: (discountAmount > 0 || itemLevelSavings > 0) ? discountReason : undefined,
        taxGst: 0,
        grandTotal,
        paidAmount: grandTotal,
        originalTotal: catalogTotal,
        totalSavings: totalSavings,
        paymentMode,
        rawDate: editingBill.rawDate || new Date().toISOString(),
        alteration: alterationEnabled ? { ...alterationData, required: true } : undefined
      };

      const originalTotal = editingBill.grandTotal;
      const nextBills = completedBills.map(b => b.billNo === editingBill.billNo ? updatedBill : b);
      saveBillsLocally(nextBills);

      if (isSupabaseConfigured()) {
        SupabaseService.updateSale({
          invoiceNumber: editingBill.billNo,
          customerName: customer.name.trim() || "Walk-in Guest",
          customerPhone: customer.phone.trim() || "NA",
          subtotal,
          discount: discountAmount,
          tax: 0,
          total: grandTotal,
          paymentMode,
          items: cart.map(ci => ({
            id: ci.product.id,
            name: ci.product.name,
            sku: ci.product.sku,
            barcode: ci.product.barcode || ci.product.sku || "",
            category: ci.product.category || "sarees",
            price: ci.price,
            quantity: ci.quantity,
            isService: ci.product.isService
          }))
        }).catch(err => console.error("Cloud bill update error:", err));

        // ANTI-FRAUD SECURITY AUDIT: If bill amount changed, permanently log in Supabase
        if (grandTotal !== originalTotal) {
          const isReduced = grandTotal < originalTotal;
          OwnerSecurityService.logAuditEntry({
            actionType: "bill_amount_change",
            productId: editingBill.id || editingBill.billNo,
            productName: `Bill #${editingBill.billNo} Amount Changed (${editingBill.customer?.name || "Customer"})`,
            sku: editingBill.billNo,
            oldValue: `₹${originalTotal.toLocaleString("en-IN")}`,
            newValue: `₹${grandTotal.toLocaleString("en-IN")} (${isReduced ? "Reduced by" : "Increased by"} ₹${Math.abs(grandTotal - originalTotal).toLocaleString("en-IN")})`,
            reason: discountReason || "Bill amount modified by staff",
            staffName: (typeof window !== "undefined" ? localStorage.getItem("rajnandni_active_staff_name") : "") || "Showroom Staff",
            approvedVia: "master_pin",
          }).catch((err: any) => console.warn("Audit log record warning:", err));
        }
      }

      setLastBill(updatedBill);
      setShowCheckoutSuccess(true);
      setEditingBill(null);

      // Reset Cart
      setCart([]);
      setCustomer({ name: "", phone: "", notes: "" });
      setDiscountAmount(0);
      setAgreedDealPrice("");
      setEditingPriceIdx(null);
      setAlterationEnabled(false);
      return;
    }

    // Generate guaranteed unique sequential Bill Number (e.g. RJN-2026-0252)
    const existingBills: CompletedBill[] = [];
    try {
      const raw = localStorage.getItem("rajnandni_bills");
      if (raw) existingBills.push(...JSON.parse(raw));
    } catch {}
    try {
      const rawVault = localStorage.getItem("rajnandni_raw_bills_vault");
      if (rawVault) existingBills.push(...JSON.parse(rawVault));
    } catch {}
    existingBills.push(...completedBills);

    let deletedList: string[] = [];
    try {
      const deletedRaw = localStorage.getItem("rajnandni_deleted_bills");
      if (deletedRaw) {
        deletedList = JSON.parse(deletedRaw);
      }
    } catch {}

    // Floor sequence is at least 251 (as cloud already safely has RJN-2026-0250 and RJN-2026-0251)
    let maxSeq = 251;
    for (const b of existingBills) {
      if (!b || !b.billNo) continue;
      const match = b.billNo.match(/RJN-\d{4}-(\d+)/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    // Also include deleted bills in maxSeq so we NEVER reuse an invoice number
    for (const delNo of deletedList) {
      if (!delNo) continue;
      const match = delNo.match(/RJN-\d{4}-(\d+)/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }

    const currentYear = new Date().getFullYear();
    const allUsedNumbers = new Set<string>([
      ...existingBills.map(b => b?.billNo).filter(Boolean),
      ...deletedList.filter(Boolean)
    ]);

    let nextSeq = maxSeq + 1;
    let billNumber = `RJN-${currentYear}-${String(nextSeq).padStart(4, "0")}`;
    while (allUsedNumbers.has(billNumber)) {
      nextSeq++;
      billNumber = `RJN-${currentYear}-${String(nextSeq).padStart(4, "0")}`;
    }
    const selectedStaff = staffMembers.find(s => s.id === selectedStaffBuyerId);
    const staffBuyerName = selectedStaff?.name || "Staff Member";
    const effectiveCustomerName = (paymentMode === "staff_salary" && (!customer.name.trim() || customer.name.trim() === "Walk-in Guest"))
      ? `${staffBuyerName} (Staff)`
      : (customer.name.trim() || "Walk-in Guest");

    const newBill: CompletedBill = {
      id: `bill-${Date.now()}`,
      billNo: billNumber,
      customer: {
        name: effectiveCustomerName,
        phone: customer.phone.trim() || (paymentMode === "staff_salary" ? selectedStaff?.phone || "NA" : "NA"),
        notes: customer.notes.trim()
      },
      items: [...cart],
      subtotal,
      discount: discountAmount,
      discountReason: (discountAmount > 0 || itemLevelSavings > 0) ? discountReason : undefined,
      taxGst: 0,
      grandTotal,
      paidAmount: grandTotal,
      originalTotal: catalogTotal,
      totalSavings: totalSavings,
      paymentMode,
      staffBuyerId: paymentMode === "staff_salary" ? selectedStaffBuyerId : undefined,
      staffBuyerName: paymentMode === "staff_salary" ? staffBuyerName : undefined,
      createdAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      rawDate: new Date().toISOString(),
      alteration: alterationEnabled ? { ...alterationData, required: true } : undefined
    };

    // If staff salary cut, record purchases in Staff Ledger
    if (paymentMode === "staff_salary") {
      cart.forEach(ci => {
        StaffExpenseService.recordStaffPurchase({
          staffId: selectedStaffBuyerId,
          staffName: staffBuyerName,
          billNo: billNumber,
          productId: ci.product.id,
          productName: ci.product.name,
          sku: ci.product.sku,
          quantity: ci.quantity,
          price: ci.price,
          totalAmount: ci.price * ci.quantity,
          date: new Date().toISOString().split("T")[0],
          note: `Billed at POS (#${billNumber})`
        }).then(rec => {
          if (rec) {
            setStaffPurchases(prev => [rec, ...prev.filter(p => p.id !== rec.id)]);
          }
        }).catch(err => console.warn("Staff purchase record error:", err));
      });
    }

    // Update Stock for physical products
    const updatedProducts = products.map(prod => {
      const cartItem = cart.find(ci => ci.product.id === prod.id && !prod.isService);
      if (cartItem) {
        return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
      }
      return prod;
    });
    saveProductsLocally(updatedProducts);

    // Save Bill locally
    const nextBills = [newBill, ...completedBills.filter(b => b.billNo !== billNumber)];
    saveBillsLocally(nextBills);
    appendBillToVault(newBill);

    // Push sale to Supabase cloud to guarantee GST and sales records
    if (isSupabaseConfigured()) {
      SupabaseService.recordSale({
        invoiceNumber: billNumber,
        customerName: customer.name.trim() || "Walk-in Guest",
        customerPhone: customer.phone.trim() || "NA",
        subtotal,
        discount: discountAmount,
        tax: 0,
        total: grandTotal,
        paymentMode,
        items: cart.map(ci => ({
          id: ci.product.id,
          name: ci.product.name,
          sku: ci.product.sku,
          barcode: ci.product.barcode || ci.product.sku || "",
          category: ci.product.category || "sarees",
          price: ci.price,
          quantity: ci.quantity,
          isService: ci.product.isService
        }))
      }).catch(err => console.error("Cloud record error:", err));
    }

    // If alteration required, add to alteration list
    if (alterationEnabled) {
      const nextAlts = [
        {
          ...alterationData,
          required: true,
          garmentName: alterationData.garmentName || cart[0]?.product.name || "Ladies Ethnic Wear",
          customerName: customer.name || "Walk-in Guest",
          customerPhone: customer.phone || "",
          billNo: newBill.billNo,
          status: "Received" as const
        },
        ...alterationsList
      ];
      saveAlterationsLocally(nextAlts);
    }

    setLastBill(newBill);
    setShowCheckoutSuccess(true);
    setEditingBill(null);

    // Reset Cart
    setCart([]);
    setCustomer({ name: "", phone: "", notes: "" });
    setDiscountAmount(0);
    setAgreedDealPrice("");
    setEditingPriceIdx(null);
    setAlterationEnabled(false);
  };

  // Catalog Purchase Cost Map for profit & wholesale analytics
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    INITIAL_PRODUCTS.forEach(p => {
      if (p.purchaseCost > 0) {
        if (p.id) map.set(p.id.toLowerCase(), p.purchaseCost);
        if (p.sku) map.set(p.sku.toLowerCase(), p.purchaseCost);
        if (p.name) map.set(p.name.trim().toLowerCase(), p.purchaseCost);
      }
    });
    products.forEach(p => {
      if (p.purchaseCost > 0) {
        if (p.id) map.set(p.id.toLowerCase(), p.purchaseCost);
        if (p.sku) map.set(p.sku.toLowerCase(), p.purchaseCost);
        if (p.name) map.set(p.name.trim().toLowerCase(), p.purchaseCost);
      }
    });
    return map;
  }, [products]);

  // Start Editing an existing bill (re-loads into cart for bargaining or adding more items)
  // ANTI-TAMPERING: Protected by Owner Authorization (Indu Ji PIN / WhatsApp OTP)
  const handleStartEditBill = (billToEdit: CompletedBill) => {
    setOwnerAuthDetails({
      actionType: "bill_edit",
      productId: billToEdit.billNo,
      productName: `Bill #${billToEdit.billNo} (${billToEdit.customer.name})`,
      sku: billToEdit.billNo,
      oldValue: `₹${billToEdit.grandTotal.toLocaleString("en-IN")} (${billToEdit.items.length} items)`,
      newValue: "Unlock Bill for Editing & Re-negotiation",
      onApprove: async () => {
        if (cart.length > 0) {
          if (!confirm("Your current checkout cart has items. Discard current cart and edit this bill?")) {
            return;
          }
        }
        setEditingBill(billToEdit);
        const loadedCart: CartItem[] = (billToEdit.items || []).map(it => {
          const pSku = (it.product?.sku || (it as any).sku || "").toLowerCase();
          const pId = (it.product?.id || (it as any).id || "").toLowerCase();
          const pName = (it.product?.name || (it as any).name || "").trim().toLowerCase();
          const cost = Number(it.product?.purchaseCost || (it as any).purchaseCost || (it as any).purchase_cost) ||
                       (pSku && productCostMap.get(pSku)) ||
                       (pId && productCostMap.get(pId)) ||
                       (pName && productCostMap.get(pName)) ||
                       0;
          return {
            product: it.product ? {
              ...it.product,
              purchaseCost: (it.product.purchaseCost && it.product.purchaseCost > 0) ? it.product.purchaseCost : cost
            } : {
              id: (it as any).id || `prod-${Date.now()}`,
              name: (it as any).name || "Item",
              sku: (it as any).sku || "",
              barcode: (it as any).barcode || "",
              category: (it as any).category || "sarees",
              price: it.price || 0,
              mrp: it.originalPrice || it.price || 0,
              purchaseCost: cost,
              stock: 10,
              isService: (it as any).isService || false
            },
            quantity: it.quantity || 1,
            price: it.price || 0,
            originalPrice: it.originalPrice || it.price || 0,
            selectedSize: it.selectedSize || "Standard",
            customDiscount: 0
          };
        });
        setCart(loadedCart);
        setCustomer({
          name: billToEdit.customer.name === "Walk-in Guest" ? "" : billToEdit.customer.name,
          phone: billToEdit.customer.phone === "NA" ? "" : billToEdit.customer.phone,
          notes: billToEdit.customer.notes || ""
        });
        setDiscountAmount(billToEdit.discount || 0);
        setAgreedDealPrice(billToEdit.discount > 0 ? String(billToEdit.subtotal - billToEdit.discount) : "");
        setDiscountReason(billToEdit.discountReason || "Negotiated Bargain");
        setPaymentMode((billToEdit.paymentMode as any) || "upi");
        if (billToEdit.alteration) {
          setAlterationEnabled(true);
          setAlterationData(billToEdit.alteration);
        } else {
          setAlterationEnabled(false);
        }
        setShowCheckoutSuccess(false);
        setActiveTab("pos");
      }
    });
    setShowOwnerAuthModal(true);
  };

  // Cancel Editing bill
  const handleCancelEditBill = () => {
    if (confirm("Cancel editing this bill? Unsaved changes in cart will be cleared.")) {
      setEditingBill(null);
      setCart([]);
      setCustomer({ name: "", phone: "", notes: "" });
      setDiscountAmount(0);
      setAgreedDealPrice("");
      setAlterationEnabled(false);
    }
  };

  // Delete a single bill entry - ANTI-FRAUD: Hard locked behind Owner Authorization
  const handleDeleteSingleBill = (billToDelete: CompletedBill) => {
    setOwnerAuthDetails({
      actionType: "bill_delete",
      productId: billToDelete.billNo,
      productName: `Bill #${billToDelete.billNo} (${billToDelete.customer.name})`,
      sku: billToDelete.billNo,
      oldValue: `₹${billToDelete.grandTotal.toLocaleString("en-IN")}`,
      newValue: "PERMANENT BILL DELETION",
      onApprove: async () => {
        try {
          const deletedRaw = localStorage.getItem("rajnandni_deleted_bills");
          const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
          if (!deletedList.includes(billToDelete.billNo)) {
            deletedList.push(billToDelete.billNo);
            localStorage.setItem("rajnandni_deleted_bills", JSON.stringify(deletedList));
          }
        } catch {}

        const updatedBills = completedBills.filter(b => b.billNo !== billToDelete.billNo);
        saveBillsLocally(updatedBills);

        if (isSupabaseConfigured()) {
          try {
            await SupabaseService.deleteBill(billToDelete.billNo);
          } catch (err) {
            console.error("Failed to delete bill from Supabase:", err);
          }
        }
      }
    });
    setShowOwnerAuthModal(true);
  };

  // Trigger Thermal Slip Print
  const handlePrintThermal = () => {
    window.print();
  };

  // Send WhatsApp Digital Bill
  const handleSendWhatsAppBill = (bill: CompletedBill) => {
    const rawPhone = bill.customer.phone.replace(/[^0-9]/g, "");
    if (!rawPhone || rawPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number to send WhatsApp bill.");
      return;
    }
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const itemsSummary = bill.items.map((it, i) => {
      const isItemNegotiated = it.originalPrice && it.price < it.originalPrice;
      const priceText = isItemNegotiated 
        ? `~₹${it.originalPrice}~ → *₹${it.price.toLocaleString("en-IN")}* (Deal)` 
        : `₹${it.price.toLocaleString("en-IN")}`;
      return `${i + 1}. *${it.product.name}* (${it.selectedSize || "Standard"})\n   Qty: ${it.quantity} x ${priceText} = ₹${(it.quantity * it.price).toLocaleString("en-IN")}`;
    }).join("\n");

    const hasDiscount = bill.discount > 0 || (bill.totalSavings && bill.totalSavings > 0);
    const savings = bill.totalSavings || bill.discount;

    const pdfUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invoice?id=${bill.billNo}`;

    const message = 
`🌸 *RAJNANDINI* 🌸
*Darshan Enterprises*
Near PSC petrolpump Ranipur goan , haridwar , Uttrakhand  249401
GSTIN: 05GNZPS9902M1ZR
Ph: +91 7464987898
------------------------------------
*INVOICE / BILL DETAILS*
📄 *Bill No:* ${bill.billNo}
📅 *Date:* ${bill.createdAt}
👤 *Customer:* ${bill.customer.name}
📱 *Phone:* ${bill.customer.phone}
------------------------------------
*ITEMS PURCHASED:*
${itemsSummary}
------------------------------------
Subtotal: ₹${bill.subtotal.toLocaleString("en-IN")}${hasDiscount ? `
🤝 *Special Bargain / Discount:* -₹${savings.toLocaleString("en-IN")}
🏷️ *Deal Note:* ${bill.discountReason || "Negotiated Store Offer"}` : ""}
*Grand Total Paid:* ₹${bill.grandTotal.toLocaleString("en-IN")} (${bill.paymentMode.toUpperCase()})
${hasDiscount ? `🎉 *Aapki Kul Bachat (Total Savings):* ₹${savings.toLocaleString("en-IN")} ✨` : ""}
------------------------------------
📄 *View & Download Official PDF Bill (Zudio Style):*
${pdfUrl}
------------------------------------
${bill.alteration ? `✂️ *ALTERATION DETAILS:*
Garment: ${bill.alteration.garmentName}
Fitting: ${bill.alteration.fittingNotes}
Tailor: ${bill.alteration.tailorName}
Ready by: ${bill.alteration.readyDate}\n------------------------------------` : ""}
💖 _Thank you for shopping with Rajnandini! Please visit again._
_Sarees · Suits · Lehengas · Fashion & Accessories_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  // Send Alteration Ready WhatsApp alert
  const handleSendAlterationReadyWhatsApp = (alt: AlterationDetail, phone: string, name: string) => {
    const rawPhone = phone.replace(/[^0-9]/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const msg = `🌸 *RAJNANDINI - ALTERATION READY* 🌸\n\nNamaste ${name || "Ma'am"} ji! 🙏\n\nAapka garment (*${alt.garmentName}*) alteration & fitting ke baad ready hai. Aap store aakar trial le sakte hain.\n\n📍 *Rajnandini (Darshan Enterprises)*\nNear PSC petrolpump Ranipur goan , haridwar , Uttrakhand  249401\n📞 Support: +91 7464987898`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Helper: Generate next sequential SKU & Barcode per category
  const getNextCodesForCategory = (cat: string, currentList: ProductItem[] = products) => {
    const prefixMap: Record<string, { skuPrefix: string; barcodeBase: number; defaultSizes: string[] }> = {
      handbags: { skuPrefix: "RJ-BAG", barcodeBase: 8906000, defaultSizes: ["Standard", "Party Clutch", "Sling Bag"] },
      bangles: { skuPrefix: "RJ-BNG", barcodeBase: 8907000, defaultSizes: ["2.4", "2.6", "2.8", "Free Size"] },
      earrings: { skuPrefix: "RJ-EAR", barcodeBase: 8908000, defaultSizes: ["Standard", "Jhumka", "Chandbali", "Stud", "Danglers"] },
      sarees: { skuPrefix: "RJ-SAR", barcodeBase: 8901000, defaultSizes: ["Free Size (5.5m + Blouse)"] },
      kurtis: { skuPrefix: "RJ-KRT", barcodeBase: 8902000, defaultSizes: ["M", "L", "XL", "XXL"] },
      lehengas: { skuPrefix: "RJ-LHG", barcodeBase: 8903000, defaultSizes: ["Free Size (Semi-Stitched)"] },
      kidswear: { skuPrefix: "RJ-KID", barcodeBase: 8912000, defaultSizes: ["2-3 Yrs", "4-5 Yrs", "6-7 Yrs", "8-9 Yrs", "10-12 Yrs"] },
      jewellery: { skuPrefix: "RJ-JWL", barcodeBase: 8904000, defaultSizes: ["Standard Set"] },
      footwear: { skuPrefix: "RJ-FTW", barcodeBase: 8905000, defaultSizes: ["37", "38", "39", "40"] },
      cosmetics: { skuPrefix: "RJ-COS", barcodeBase: 8910000, defaultSizes: ["Standard", "Pack"] },
      handloom: { skuPrefix: "RJ-HDL", barcodeBase: 8911000, defaultSizes: ["Standard", "Double Bed", "Single Bed"] },
      undergarments: { skuPrefix: "RJ-UND", barcodeBase: 8913000, defaultSizes: ["28", "30", "32", "34", "36", "38", "40", "Free Size"] },
      parlour: { skuPrefix: "RJ-SRV", barcodeBase: 8909000, defaultSizes: ["Standard"] },
    };

    const cfg = prefixMap[cat] || prefixMap.handbags;
    const catItems = currentList.filter(p => p.category === cat || p.sku.startsWith(cfg.skuPrefix));
    const nextNum = catItems.length + 1;
    const padded = String(nextNum).padStart(3, "0");

    let candidateBarcode = String(cfg.barcodeBase + nextNum);
    while (currentList.some(p => p.barcode === candidateBarcode)) {
      candidateBarcode = String(Number(candidateBarcode) + 1);
    }

    return {
      sku: `${cfg.skuPrefix}-${padded}`,
      barcode: candidateBarcode,
      defaultSizes: cfg.defaultSizes,
    };
  };

  const openNewProductModal = (defaultCat: ProductItem["category"] = "handbags") => {
    const nextCodes = getNextCodesForCategory(defaultCat, products);
    setNewProductForm({
      name: "",
      category: defaultCat,
      price: 999,
      mrp: 1299,
      purchaseCost: 650,
      stock: 5,
      sku: nextCodes.sku,
      barcode: nextCodes.barcode,
      sizes: nextCodes.defaultSizes,
    });
    setShowNewProductModal(true);
  };

  // Add Product Form Handler
  const handleCreateProduct = async (options?: { printBarcode?: boolean }) => {
    if (!newProductForm.name?.trim()) {
      alert("Please enter Product Name (e.g. Bridal Golden Clutch or Designer Sling Bag)");
      return;
    }

    const cat = (newProductForm.category as ProductItem["category"]) || "handbags";
    const autoCodes = getNextCodesForCategory(cat, products);
    const newId = `prod-${Date.now()}`;
    const generatedSku = newProductForm.sku?.trim() || autoCodes.sku;
    const generatedBarcode = newProductForm.barcode?.trim() || autoCodes.barcode;

    const prod: ProductItem = {
      id: newProductForm.id || newId,
      name: newProductForm.name.trim(),
      category: cat,
      price: Number(newProductForm.price) || 0,
      mrp: Number(newProductForm.mrp) || Number(newProductForm.price) || 0,
      purchaseCost: Number(newProductForm.purchaseCost) || 0,
      stock: Number(newProductForm.stock) || 1,
      sku: generatedSku,
      barcode: generatedBarcode,
      sizes: newProductForm.sizes && newProductForm.sizes.length > 0 ? newProductForm.sizes : autoCodes.defaultSizes,
      isService: cat === "parlour",
      imageUrl: newProductForm.imageUrl?.trim()
    };

    let nextList: ProductItem[];
    if (newProductForm.id) {
      const existing = products.find(p => p.id === newProductForm.id);
      const stockChanged = existing && existing.stock !== prod.stock;
      const priceChanged = existing && existing.price !== prod.price;

      if (existing && (stockChanged || priceChanged)) {
        setOwnerOtpInput("");
        setOwnerAuthReason("");
        setOwnerAuthError("");
        setActiveRequestId(null);
        setIsWaitingRemoteApproval(false);
        setWhatsappOtpSent(false);

        setOwnerAuthDetails({
          actionType: stockChanged ? "stock_change" : "price_change",
          productId: existing.id,
          productName: existing.name,
          sku: existing.sku,
          oldValue: stockChanged
            ? `Stock: ${existing.stock} pcs`
            : `Price: ₹${existing.price.toLocaleString("en-IN")}`,
          newValue: stockChanged
            ? `Stock: ${prod.stock} pcs`
            : `Price: ₹${prod.price.toLocaleString("en-IN")}`,
          onApprove: async (reason, approvedVia) => {
            const updated = products.map(p => (p.id === newProductForm.id ? prod : p));
            saveProductsLocally(updated);
            if (isSupabaseConfigured()) {
              SupabaseService.syncInitialProducts([prod]).catch(err => {
                console.warn("Supabase new item sync notice:", err);
              });
            }
            setShowNewProductModal(false);
            if (options?.printBarcode) {
              setSelectedProductForBarcode(prod);
            }
            alert(`✅ Product details updated with Owner Approval!`);
          },
        });
        setShowOwnerAuthModal(true);
        return;
      }

      nextList = products.map(p => (p.id === newProductForm.id ? prod : p));
    } else {
      nextList = [prod, ...products];
    }
    saveProductsLocally(nextList);

    // Also sync to Supabase Cloud so new items stay permanently saved
    if (isSupabaseConfigured()) {
      SupabaseService.syncInitialProducts([prod]).catch(err => {
        console.warn("Supabase new item sync notice:", err);
      });
    }

    setShowNewProductModal(false);
    if (options?.printBarcode) {
      setSelectedProductForBarcode(prod);
    }
  };

  // Helper for category visual theme (luxury accent colors & icons)
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "sarees":
        return { icon: "🥻", label: "Royal Sarees", strip: "from-indigo-600 via-violet-600 to-purple-600", badge: "bg-indigo-50 text-indigo-900 border-indigo-200" };
      case "lehengas":
        return { icon: "👗", label: "Bridal & Lehengas", strip: "from-rose-600 via-crimson-600 to-pink-600", badge: "bg-rose-50 text-rose-900 border-rose-200" };
      case "kidswear":
        return { icon: "🧸", label: "Kids Wear & Ethnic", strip: "from-orange-500 via-amber-400 to-yellow-400", badge: "bg-orange-50 text-orange-900 border-orange-200" };
      case "kurtis":
        return { icon: "👚", label: "Kurtis & Suits", strip: "from-amber-500 via-orange-500 to-yellow-500", badge: "bg-amber-50 text-amber-900 border-amber-200" };
      case "handbags":
        return { icon: "👜", label: "Handbags & Clutches", strip: "from-teal-600 via-emerald-600 to-cyan-600", badge: "bg-teal-50 text-teal-900 border-teal-200" };
      case "bangles":
        return { icon: "💫", label: "Bangles & Kada", strip: "from-amber-600 via-orange-500 to-amber-700", badge: "bg-amber-50 text-amber-900 border-amber-200" };
      case "earrings":
        return { icon: "💎", label: "Earrings & Jhumkas", strip: "from-pink-600 via-rose-500 to-amber-600", badge: "bg-pink-50 text-pink-900 border-pink-200" };
      case "jewellery":
        return { icon: "💍", label: "Jewellery & Sets", strip: "from-purple-600 via-fuchsia-600 to-pink-500", badge: "bg-purple-50 text-purple-900 border-purple-200" };
      case "footwear":
        return { icon: "👠", label: "Footwear & Heels", strip: "from-emerald-600 via-green-600 to-teal-500", badge: "bg-emerald-50 text-emerald-900 border-emerald-200" };
      case "cosmetics":
        return { icon: "💄", label: "Cosmetics & Beauty", strip: "from-pink-500 via-rose-400 to-red-400", badge: "bg-pink-50 text-pink-900 border-pink-200" };
      case "handloom":
        return { icon: "🧵", label: "Handloom & Bedsheets", strip: "from-blue-600 via-indigo-500 to-cyan-600", badge: "bg-blue-50 text-blue-900 border-blue-200" };
      case "undergarments":
        return { icon: "👙", label: "Lingerie & Undergarments", strip: "from-rose-500 via-pink-500 to-fuchsia-500", badge: "bg-rose-50 text-rose-900 border-rose-200" };
      default:
        return { icon: "✂️", label: "Tailoring & Fitting", strip: "from-stone-700 via-stone-600 to-amber-700", badge: "bg-stone-100 text-stone-800 border-stone-300" };
    }
  };

  // Filtered products for Inventory Tab (Memoized)
  const filteredInventoryProducts = useMemo(() => {
    const q = inventorySearch.trim().toLowerCase();
    return products.filter(p => {
      const matchesCat = inventoryCategory === "all" || p.category === inventoryCategory;
      if (!q) return matchesCat;
      return (
        matchesCat &&
        (p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q))
      );
    });
  }, [products, inventoryCategory, inventorySearch]);

  // Inventory Valuation Metrics (Memoized)
  const totalPhysicalPieces = useMemo(() => products.filter(p => !p.isService).reduce((sum, p) => sum + (Number(p.stock) || 0), 0), [products]);
  const totalRetailStockValue = useMemo(() => products.filter(p => !p.isService).reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0), [products]);
  const totalCostStockValue = useMemo(() => products.filter(p => !p.isService).reduce((sum, p) => sum + (Number(p.purchaseCost) || 0) * (Number(p.stock) || 0), 0), [products]);
  const totalTodayRevenue = useMemo(() => completedBills.reduce((s, b) => s + b.grandTotal, 0), [completedBills]);
  const totalUnitsSold = useMemo(() => {
    return completedBills.reduce((acc, b) => {
      if (!b.items || !Array.isArray(b.items)) return acc;
      return acc + b.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
    }, 0);
  }, [completedBills]);

  // Helper: Extract accurate YYYY-MM-DD in Indian Standard Time (Asia/Kolkata)
  const getBillDateString = useCallback((bill: CompletedBill): string => {
    if (bill.rawDate) {
      try {
        const d = new Date(bill.rawDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        }
      } catch {}
    }
    if (bill.createdAt) {
      const d = new Date(bill.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      }
      const dmyMatch = bill.createdAt.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dmyMatch) {
        return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
      }
      const monthNames: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
      };
      const namedMatch = bill.createdAt.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
      if (namedMatch) {
        const month = monthNames[namedMatch[2].slice(0, 3).toLowerCase()] || "01";
        return `${namedMatch[3]}-${month}-${namedMatch[1].padStart(2, "0")}`;
      }
    }
    return "";
  }, []);

  // Helper: Calculate total wholesale procurement cost for all items in a completed bill
  const getBillPurchaseCost = useCallback((bill: CompletedBill): number => {
    return (bill.items || []).reduce((sum, it) => {
      const qty = it.quantity || 1;
      let cost = it.product?.purchaseCost || 0;
      if (cost <= 0) {
        const itAny = it as any;
        if (itAny.purchaseCost) cost = Number(itAny.purchaseCost);
        else if (itAny.purchase_cost) cost = Number(itAny.purchase_cost);
      }
      if (cost <= 0) {
        const pSku = (it.product?.sku || (it as any).sku || "").toLowerCase();
        const pId = (it.product?.id || (it as any).id || "").toLowerCase();
        const pName = (it.product?.name || (it as any).name || "").trim().toLowerCase();
        cost = (pSku && productCostMap.get(pSku)) ||
               (pId && productCostMap.get(pId)) ||
               (pName && productCostMap.get(pName)) ||
               0;
      }
      return sum + (cost * qty);
    }, 0);
  }, [productCostMap]);

  // =========================================================================
  // BESTSELLER & VELOCITY ANALYTICS ENGINE
  // =========================================================================
  const productVelocityAnalytics = useMemo(() => {
    const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

    type ProductSalesStats = {
      qty: number;
      revenue: number;
      firstDate: number;
      lastDate: number;
      count: number;
    };

    const statsMap = new Map<string, ProductSalesStats>();
    const byId = new Set<string>();
    const bySku = new Map<string, string>();
    const byBarcode = new Map<string, string>();
    const byName = new Map<string, string>();

    products.filter(p => !p.isService).forEach(p => {
      statsMap.set(p.id, {
        qty: 0,
        revenue: 0,
        firstDate: 0,
        lastDate: 0,
        count: 0
      });
      byId.add(p.id);
      if (p.sku && p.sku.trim()) {
        bySku.set(p.sku.toUpperCase().trim(), p.id);
      }
      if (p.barcode && p.barcode.trim() && p.barcode.trim() !== "8901001" && p.barcode.trim() !== "NO-BARCODE") {
        byBarcode.set(p.barcode.trim(), p.id);
      }
      const n = norm(p.name);
      if (n.length >= 3) {
        byName.set(n, p.id);
      }
    });

    const now = Date.now();

    completedBills.forEach(bill => {
      const billDateStr = getBillDateString(bill);
      const billTime = billDateStr ? new Date(billDateStr).getTime() : 0;

      (bill.items || []).forEach(it => {
        const itId = it.product?.id || (it as any).id || "";
        const itSku = (it.product?.sku || (it as any).sku || "").toUpperCase().trim();
        const rawBarcode = (it.product?.barcode || (it as any).barcode || "").trim();
        const itBarcode = (rawBarcode === "8901001" || rawBarcode === "NO-BARCODE") ? "" : rawBarcode;
        const itName = it.product?.name || (it as any).name || "";
        const itNorm = norm(itName);
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price || (it as any).negotiatedPrice || it.product?.price || 0);

        // Match priority: 1. Exact ID, 2. Exact SKU, 3. Exact Barcode, 4. Exact Name
        let matchedProdId: string | null = null;
        if (itId && byId.has(itId)) {
          matchedProdId = itId;
        } else if (itSku && bySku.has(itSku)) {
          matchedProdId = bySku.get(itSku)!;
        } else if (itBarcode && byBarcode.has(itBarcode)) {
          matchedProdId = byBarcode.get(itBarcode)!;
        } else if (itNorm && byName.has(itNorm)) {
          matchedProdId = byName.get(itNorm)!;
        }

        if (matchedProdId && statsMap.has(matchedProdId)) {
          const st = statsMap.get(matchedProdId)!;
          st.qty += qty;
          st.revenue += qty * price;
          st.count += 1;
          if (billTime > 0) {
            if (st.firstDate === 0 || billTime < st.firstDate) st.firstDate = billTime;
            if (billTime > st.lastDate) st.lastDate = billTime;
          }
        }
      });
    });

    return products.filter(p => !p.isService).map(p => {
      const st = statsMap.get(p.id) || { qty: 0, revenue: 0, firstDate: 0, lastDate: 0, count: 0 };
      const totalQtySold = st.qty;
      const totalRevenue = st.revenue;
      const firstDate = st.firstDate || now;
      const lastDate = st.lastDate || now;
      const billCount = st.count;

      const stock = Number(p.stock) || 0;
      const isOutOfStock = stock <= 0;
      const isCritical = stock > 0 && stock <= 3;

      let daysSpan = 1;
      if (totalQtySold > 0 && st.lastDate > 0) {
        daysSpan = Math.max(1, Math.round((Math.max(lastDate, now) - firstDate) / (1000 * 60 * 60 * 24)));
      }
      const unitsPerDay = totalQtySold > 0 ? Number((totalQtySold / daysSpan).toFixed(2)) : 0;

      let selloutSpeedText = "No sales yet";
      if (isOutOfStock && totalQtySold > 0) {
        selloutSpeedText = daysSpan <= 1 ? "Sold out in 24 Hours!" : `Sold out in ~${daysSpan} days`;
      } else if (stock > 0 && totalQtySold > 0) {
        const estDays = Math.max(1, Math.round(stock / Math.max(0.1, unitsPerDay)));
        selloutSpeedText = estDays <= 3 ? `Urgent: Runout in ~${estDays} days!` : `~${estDays} days stock remaining`;
      } else if (stock > 0) {
        selloutSpeedText = "In Stock (Ready)";
      }

      return {
        product: p,
        totalQtySold,
        totalRevenue,
        unitsPerDay,
        daysSpan,
        isOutOfStock,
        isCritical,
        selloutSpeedText,
        billCount
      };
    });
  }, [products, completedBills, getBillDateString]);

  // Velocity KPI Counts
  const soldOutBestsellerCount = useMemo(() => {
    return productVelocityAnalytics.filter(v => v.isOutOfStock && v.totalQtySold > 0).length;
  }, [productVelocityAnalytics]);

  const highVelocityCount = useMemo(() => {
    return productVelocityAnalytics.filter(v => v.unitsPerDay >= 0.5 || v.totalQtySold >= 5).length;
  }, [productVelocityAnalytics]);

  const criticalStockCount = useMemo(() => {
    return productVelocityAnalytics.filter(v => v.isCritical).length;
  }, [productVelocityAnalytics]);

  const topMoversTotalRevenue = useMemo(() => {
    return productVelocityAnalytics.reduce((sum, v) => sum + v.totalRevenue, 0);
  }, [productVelocityAnalytics]);

  // Fast lookup map for sold quantity of every product across showroom bills
  const productSoldMap = useMemo(() => {
    const map = new Map<string, number>();
    productVelocityAnalytics.forEach((v) => {
      map.set(v.product.id, v.totalQtySold);
      if (v.product.sku) {
        map.set(v.product.sku.toUpperCase().trim(), v.totalQtySold);
      }
    });
    return map;
  }, [productVelocityAnalytics]);

  // Filtered & Sorted Velocity Products
  const filteredVelocityProducts = useMemo(() => {
    let list = [...productVelocityAnalytics];

    if (velocityFilter === "out_of_stock") {
      list = list.filter(v => v.isOutOfStock && v.totalQtySold > 0);
    } else if (velocityFilter === "critical") {
      list = list.filter(v => v.isCritical);
    } else if (velocityFilter === "fast_movers") {
      list = list.filter(v => v.unitsPerDay >= 0.5 || v.totalQtySold >= 3);
    }

    if (velocitySearch.trim()) {
      const q = velocitySearch.toLowerCase().trim();
      list = list.filter(v =>
        v.product.name.toLowerCase().includes(q) ||
        v.product.sku.toLowerCase().includes(q) ||
        v.product.category.toLowerCase().includes(q) ||
        v.product.barcode.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (velocitySort === "sold_desc") return b.totalQtySold - a.totalQtySold;
      if (velocitySort === "revenue_desc") return b.totalRevenue - a.totalRevenue;
      if (velocitySort === "speed_asc") return b.unitsPerDay - a.unitsPerDay;
      if (velocitySort === "stock_asc") return (Number(a.product.stock) || 0) - (Number(b.product.stock) || 0);
      return b.totalQtySold - a.totalQtySold;
    });

    return list;
  }, [productVelocityAnalytics, velocityFilter, velocitySearch, velocitySort]);

  // =========================================================================
  // DUPLICATE PRODUCTS DETECTOR & RESOLUTION ENGINE
  // =========================================================================
  const duplicateGroups = useMemo(() => {
    const normalize = (name: string) => {
      return (name || "")
        .toLowerCase()
        .replace(/^(a|the|rj|d\.no|dno)[\s\.\-_]+/i, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
    };

    const groupMap = new Map<string, ProductItem[]>();

    products.filter(p => !p.isService).forEach((p, idx) => {
      const normName = normalize(p.name);
      const rawBarcode = (p.barcode || "").trim();
      const hasBarcode = rawBarcode && rawBarcode !== "NO-BARCODE" && rawBarcode !== "8901001";
      const groupKey = normName.length >= 3 ? normName : (hasBarcode ? `barcode:${rawBarcode}` : `single:${p.id || idx}`);
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(p);
    });

    const clusters: { key: string; displayName: string; items: ProductItem[] }[] = [];
    groupMap.forEach((items, key) => {
      if (items.length > 1) {
        clusters.push({
          key,
          displayName: items[0]?.name || "Unnamed Item",
          items: [...items].sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0))
        });
      }
    });

    return clusters.sort((a, b) => b.items.length - a.items.length);
  }, [products]);

  const filteredDuplicateGroups = useMemo(() => {
    if (!duplicateSearch.trim()) return duplicateGroups;
    const q = duplicateSearch.toLowerCase().trim();
    return duplicateGroups.filter(g =>
      (g.displayName || "").toLowerCase().includes(q) ||
      g.items.some(it =>
        (it.sku || "").toLowerCase().includes(q) ||
        (it.barcode || "").toLowerCase().includes(q) ||
        (it.name || "").toLowerCase().includes(q)
      )
    );
  }, [duplicateGroups, duplicateSearch]);

  // Quick Restock Handlers
  const handleOpenQuickRestock = (prod: ProductItem) => {
    setQuickRestockProduct(prod);
    setQuickRestockQty(5);
  };

  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockProduct) return;
    const addQty = Math.max(1, Number(quickRestockQty) || 1);
    const newStock = (Number(quickRestockProduct.stock) || 0) + addQty;

    const updated = products.map(p => p.id === quickRestockProduct.id ? { ...p, stock: newStock } : p);
    saveProductsLocally(updated);

    if (isSupabaseConfigured()) {
      SupabaseService.updateProductStock(quickRestockProduct.id, newStock).catch(err => {
        console.warn("Supabase restock update warning:", err);
      });
    }

    alert(`✅ Restocked! Added ${addQty} pcs to ${quickRestockProduct.sku} (${quickRestockProduct.name}). New stock is ${newStock} pcs.`);
    setQuickRestockProduct(null);
  };

  // Duplicate Cleaner Handlers
  const handleDeleteDuplicateItem = async (prodId: string, prodName: string, sku: string) => {
    const ok = window.confirm(`Permanently delete duplicate "${prodName}" (SKU: ${sku})? This cannot be undone.`);
    if (!ok) return;

    const updated = products.filter(p => p.id !== prodId);
    saveProductsLocally(updated);

    if (isSupabaseConfigured()) {
      SupabaseService.deleteProduct(prodId).catch(err => {
        console.warn("Supabase delete product warning:", err);
      });
    }

    alert(`🗑️ Removed duplicate item "${prodName}" (${sku}).`);
  };

  const handleMergeDuplicate = async (primary: ProductItem, duplicate: ProductItem) => {
    const primaryStock = Number(primary.stock) || 0;
    const dupStock = Number(duplicate.stock) || 0;
    const combinedStock = primaryStock + dupStock;

    const ok = window.confirm(
      `Merge "${duplicate.sku}" into "${primary.sku}"?\n\n` +
      `• "${primary.sku}" stock will increase from ${primaryStock} to ${combinedStock} pcs.\n` +
      `• Duplicate "${duplicate.sku}" will be deleted permanently.`
    );
    if (!ok) return;

    const updated = products
      .filter(p => p.id !== duplicate.id)
      .map(p => p.id === primary.id ? { ...p, stock: combinedStock } : p);

    saveProductsLocally(updated);

    if (isSupabaseConfigured()) {
      SupabaseService.updateProductStock(primary.id, combinedStock).catch(err => {
        console.warn("Supabase stock update warning:", err);
      });
      SupabaseService.deleteProduct(duplicate.id).catch(err => {
        console.warn("Supabase delete duplicate warning:", err);
      });
    }

    alert(`✅ Merged successfully!\n\nAdded ${dupStock} pcs to ${primary.sku}. New stock: ${combinedStock} pcs.\nDuplicate ${duplicate.sku} has been removed.`);
  };

  const handleAutoCleanZeroStockDuplicates = async () => {
    const toDelete: ProductItem[] = [];

    duplicateGroups.forEach(group => {
      if (group.items.length <= 1) return;
      const [primary, ...others] = group.items;
      others.forEach(other => {
        const stock = Number(other.stock) || 0;
        if (stock === 0) {
          toDelete.push(other);
        }
      });
    });

    if (toDelete.length === 0) {
      alert("No 0-stock redundant duplicates found to clean!");
      return;
    }

    const ok = window.confirm(
      `Found ${toDelete.length} redundant duplicate product(s) with 0 stock.\n\n` +
      toDelete.slice(0, 5).map(p => `• ${p.sku}: ${p.name}`).join("\n") +
      (toDelete.length > 5 ? `\n...and ${toDelete.length - 5} more` : "") +
      `\n\nDelete these 0-stock duplicates now?`
    );
    if (!ok) return;

    const deleteIds = new Set(toDelete.map(p => p.id));
    const nextProducts = products.filter(p => !deleteIds.has(p.id));
    saveProductsLocally(nextProducts);

    if (isSupabaseConfigured()) {
      for (const p of toDelete) {
        SupabaseService.deleteProduct(p.id).catch(err => console.warn(err));
      }
    }

    alert(`🎉 Successfully cleaned ${toDelete.length} redundant 0-stock duplicate items!`);
  };

    // Handler for Customer Product Exchange & Replacement
  const handleExchangeCompleted = async (record: ExchangeRecord, updatedProducts: ProductItem[]) => {
    try {
      // 1. Update product state and localStorage
      setProducts(updatedProducts);
      localStorage.setItem("rajnandni_products", JSON.stringify(updatedProducts));

      // 2. Add to exchanges list state
      setExchangesList(prev => [record, ...prev]);

      // 3. Sync affected stock to Supabase
      if (isSupabaseConfigured()) {
        for (const it of record.returnedItems) {
          if (it.condition !== "damaged") {
            const p = updatedProducts.find(x => x.id === it.productId || x.sku === it.sku);
            if (p) {
              SupabaseService.updateProductStock(p.id, p.stock).catch(e =>
                console.warn("Supabase restock failed:", e)
              );
            }
          }
        }
        for (const it of record.issuedItems) {
          const p = updatedProducts.find(x => x.id === it.productId || x.sku === it.sku);
          if (p) {
            SupabaseService.updateProductStock(p.id, p.stock).catch(e =>
              console.warn("Supabase issue stock update failed:", e)
            );
          }
        }
      }

      alert(
        "✅ Exchange " + record.exchangeNo + " Processed Successfully!\n\n" +
        "• Customer: " + record.customer.name + " (" + record.customer.phone + ")\n" +
        "• Original Bill: " + record.originalBillNo + "\n" +
        "• Returned: " + record.returnedItems.length + " item(s) (+restocked)\n" +
        "• Issued: " + record.issuedItems.length + " item(s) (-deducted)\n" +
        "• Settlement: " + (
          record.settlementType === "even_exchange"
            ? "Even Exchange (₹0)"
            : record.settlementType === "customer_paid"
            ? "Customer Paid ₹" + record.differenceAmount.toLocaleString("en-IN") + " via " + record.paymentMode.toUpperCase()
            : "Store Credit Issued: ₹" + Math.abs(record.differenceAmount).toLocaleString("en-IN")
        )
      );
    } catch (err: any) {
      console.error("Exchange completion error:", err);
      alert("Failed to finalize exchange: " + (err?.message || String(err)));
    }
  };

  // =========================================================
  // STAFF KHATA, SALARY DEDUCTIONS & CASH/UPI DEPOSITS HELPERS
  // =========================================================
  const getStaffSummary = (staffId: string, baseSalary: number) => {
    const purchases = staffPurchases.filter(p => p.staffId === staffId);
    const deposits = staffDeposits.filter(d => d.staffId === staffId);
    const advances = staffAdvances.filter(a => a.staffId === staffId);

    const garmentTotal = purchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    const depositTotal = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const advanceTotal = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    const netDeduction = (garmentTotal + advanceTotal) - depositTotal;
    const netPayable = Math.max(0, baseSalary - netDeduction);

    return {
      purchases,
      deposits,
      advances,
      garmentTotal,
      depositTotal,
      advanceTotal,
      netDeduction,
      netPayable,
    };
  };

  const handleSaveStaffDeposit = async () => {
    const num = Number(depAmount);
    if (isNaN(num) || num <= 0) {
      alert("Please enter a valid deposit amount in ₹");
      return;
    }
    const staff = staffMembers.find(s => s.id === depStaffId);
    const staffName = staff?.name || "Staff Member";

    const rec = await StaffExpenseService.recordStaffDeposit({
      staffId: depStaffId,
      staffName,
      amount: num,
      paymentMode: depPaymentMode,
      receivedBy: localStorage.getItem("rajnandni_active_staff_name") || "Galla Cashier",
      note: depNote.trim(),
    });

    if (rec) {
      setStaffDeposits(prev => [rec, ...prev.filter(d => d.id !== rec.id)]);
      setShowStaffDepositModal(false);
      setDepAmount("");
      setDepNote("");
      alert(`✅ Deposit of ₹${num.toLocaleString("en-IN")} recorded for ${staffName}! Net salary deduction updated.`);
    }
  };

  const handleDeleteStaffDeposit = async (dep: StaffDepositRecord) => {
    if (!confirm(`Delete deposit of ₹${dep.amount.toLocaleString("en-IN")} received from ${dep.staffName}?`)) return;
    await StaffExpenseService.deleteStaffDeposit(dep.id, dep.tokenNumber);
    setStaffDeposits(prev => prev.filter(d => d.id !== dep.id && (!dep.tokenNumber || d.tokenNumber !== dep.tokenNumber)));
  };

  const handleSaveDirectIssue = async () => {
    if (!issSelectedProduct) {
      alert("Please select a garment from the catalog");
      return;
    }
    const qty = Math.max(1, Number(issQty) || 1);
    const prc = Number(issPrice) > 0 ? Number(issPrice) : issSelectedProduct.price;
    const total = qty * prc;

    const staff = staffMembers.find(s => s.id === issStaffId);
    const staffName = staff?.name || "Staff Member";

    // Deduct local product stock
    const updatedProducts = products.map(p => {
      if (p.id === issSelectedProduct.id) {
        return { ...p, stock: Math.max(0, p.stock - qty) };
      }
      return p;
    });
    saveProductsLocally(updatedProducts);

    if (isSupabaseConfigured()) {
      const newStock = Math.max(0, issSelectedProduct.stock - qty);
      SupabaseService.updateProductStock(issSelectedProduct.id, newStock).catch(err => {
        console.warn("Direct issue stock update warning:", err);
      });
    }

    const rec = await StaffExpenseService.recordStaffPurchase({
      staffId: issStaffId,
      staffName,
      productId: issSelectedProduct.id,
      productName: issSelectedProduct.name,
      sku: issSelectedProduct.sku,
      quantity: qty,
      price: prc,
      totalAmount: total,
      note: issNote.trim() || "Direct Garment Issue (Salary Cut)",
    });

    if (rec) {
      setStaffPurchases(prev => [rec, ...prev.filter(p => p.id !== rec.id)]);
      setShowStaffIssueModal(false);
      setIssSelectedProduct(null);
      setIssProductSearch("");
      setIssQty(1);
      setIssPrice("");
      setIssNote("");
      alert(`✅ ${issSelectedProduct.name} (₹${total.toLocaleString("en-IN")}) issued to ${staffName}! Salary deduction booked.`);
    }
  };

  const handleDeleteStaffPurchase = async (pur: StaffProductPurchase) => {
    if (!confirm(`Remove garment purchase "${pur.productName}" (₹${pur.totalAmount.toLocaleString("en-IN")}) from ${pur.staffName}'s salary deduction?`)) return;
    await StaffExpenseService.deleteStaffPurchase(pur.id, pur.tokenNumber);
    setStaffPurchases(prev => prev.filter(p => p.id !== pur.id && (!pur.tokenNumber || p.tokenNumber !== pur.tokenNumber)));
  };

  // Handlers for Adding, Editing Salary & Managing Staff Members
  const handleSaveNewStaff = async () => {
    if (!newStaffName.trim()) {
      alert("Please enter staff member's full name");
      return;
    }
    const salaryNum = Number(newStaffSalary);
    if (isNaN(salaryNum) || salaryNum < 0) {
      alert("Please enter a valid monthly salary in ₹");
      return;
    }

    const created = await StaffExpenseService.addStaffMember({
      name: newStaffName.trim(),
      phone: newStaffPhone.trim() || "NA",
      role: newStaffRole.trim() || "Showroom Sales Executive",
      monthlySalary: salaryNum,
    });

    setStaffMembers(prev => [...prev.filter(s => s.id !== created.id), created]);
    setShowAddStaffModal(false);
    setNewStaffName("");
    setNewStaffPhone("");
    setNewStaffRole("Showroom Sales Executive");
    setNewStaffSalary("15000");
    alert(`🎉 Staff member "${created.name}" added successfully with monthly salary ₹${created.monthlySalary.toLocaleString("en-IN")}!`);
  };

  const handleOpenEditStaffModal = (staff: StaffMember) => {
    setEditingStaffMember(staff);
    setEditStaffName(staff.name);
    setEditStaffPhone(staff.phone || "");
    setEditStaffRole(staff.role || "Sales Executive");
    setEditStaffSalary(String(staff.monthlySalary || 0));
    setEditStaffIsActive(staff.isActive !== false);
  };

  const handleSaveEditStaff = async () => {
    if (!editingStaffMember) return;
    if (!editStaffName.trim()) {
      alert("Please enter staff member's name");
      return;
    }
    const salaryNum = Number(editStaffSalary);
    if (isNaN(salaryNum) || salaryNum < 0) {
      alert("Please enter a valid monthly salary in ₹");
      return;
    }

    const updates = {
      name: editStaffName.trim(),
      phone: editStaffPhone.trim() || "NA",
      role: editStaffRole.trim() || "Sales Executive",
      monthlySalary: salaryNum,
      isActive: editStaffIsActive,
    };

    await StaffExpenseService.updateStaffMember(editingStaffMember.id, updates);

    setStaffMembers(prev =>
      prev.map(s => (s.id === editingStaffMember.id ? { ...s, ...updates } : s))
    );
    setEditingStaffMember(null);
    alert(`✅ Staff "${updates.name}" updated successfully! New monthly salary is ₹${updates.monthlySalary.toLocaleString("en-IN")}.`);
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    const ok = confirm(`Are you sure you want to remove staff member "${staffName}"?\n\nTheir past bill and deposit records will be preserved in records.`);
    if (!ok) return;

    await StaffExpenseService.deleteStaffMember(staffId);
    setStaffMembers(prev => prev.filter(s => s.id !== staffId));
    setEditingStaffMember(null);
    alert(`Staff member "${staffName}" has been removed.`);
  };

  // Advanced Filtered Completed Bills for Sales Report Tab
  const filteredReportBills = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yest.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const parso = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const parsoStr = parso.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const currentYearMonth = todayStr.slice(0, 7);
    const currentYear = todayStr.slice(0, 4);

    const parseSeq = (no: string) => {
      const m = (no || "").match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    };

    return completedBills.filter(bill => {
      // Payment filter
      if (reportPaymentFilter !== "all" && bill.paymentMode !== reportPaymentFilter) {
        return false;
      }

      // Date filter
      const bDate = getBillDateString(bill);
      if (reportDateFilter === "today") {
        if (bDate !== todayStr) return false;
      } else if (reportDateFilter === "yesterday") {
        if (bDate !== yesterdayStr) return false;
      } else if (reportDateFilter === "day_before") {
        if (bDate !== parsoStr) return false;
      } else if (reportDateFilter === "this_month") {
        if (!bDate.startsWith(currentYearMonth)) return false;
      } else if (reportDateFilter === "this_year") {
        if (!bDate.startsWith(currentYear)) return false;
      } else if (reportDateFilter === "custom") {
        if (reportCustomDate && bDate !== reportCustomDate) return false;
      }

      // Search query
      if (q) {
        const matchesBillNo = bill.billNo.toLowerCase().includes(q);
        const matchesCust = bill.customer.name.toLowerCase().includes(q) || bill.customer.phone.includes(q);
        const matchesItems = bill.items.some(it => it.product.name.toLowerCase().includes(q) || it.product.sku.toLowerCase().includes(q));
        if (!matchesBillNo && !matchesCust && !matchesItems) return false;
      }
      return true;
    }).sort((a, b) => {
      if (reportSortBy === "highest") return b.grandTotal - a.grandTotal;
      if (reportSortBy === "lowest") return a.grandTotal - b.grandTotal;
      if (reportSortBy === "oldest") {
        const sA = parseSeq(a.billNo);
        const sB = parseSeq(b.billNo);
        if (sA !== sB) return sA - sB;
        return (a.rawDate || a.createdAt).localeCompare(b.rawDate || b.createdAt);
      }
      // Default: "latest" (Highest bill number first: e.g. RJN-2026-0162, 0161, 0160...)
      const sA = parseSeq(a.billNo);
      const sB = parseSeq(b.billNo);
      if (sA !== sB) return sB - sA;
      return (b.rawDate || b.createdAt).localeCompare(a.rawDate || a.createdAt);
    });
  }, [completedBills, reportSearch, reportPaymentFilter, reportDateFilter, reportCustomDate, reportSortBy, getBillDateString]);

  // Advanced Sales Report Analytics with Cost & Net Profit
  const reportAnalytics = useMemo(() => {
    const list = filteredReportBills;
    const totalRev = list.reduce((s, b) => s + b.grandTotal, 0);
    const totalCash = list.filter(b => b.paymentMode === "cash").reduce((s, b) => s + b.grandTotal, 0);
    const totalUpi = list.filter(b => b.paymentMode === "upi").reduce((s, b) => s + b.grandTotal, 0);
    const totalCard = list.filter(b => b.paymentMode === "card").reduce((s, b) => s + b.grandTotal, 0);
    const totalKhata = list.filter(b => b.paymentMode === "khata").reduce((s, b) => s + b.grandTotal, 0);
    const totalDiscounts = list.reduce((s, b) => s + (b.totalSavings || b.discount || 0), 0);
    const totalItemsSold = list.reduce((s, b) => s + b.items.reduce((is, it) => is + it.quantity, 0), 0);
    const avgBillValue = list.length > 0 ? Math.round(totalRev / list.length) : 0;

    // Wholesale Cost & Profit
    const totalCost = list.reduce((s, b) => s + getBillPurchaseCost(b), 0);
    const totalProfit = totalRev - totalCost;
    const profitMarginPct = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;

    // Category Sales Breakdown
    const catBreakdown: Record<string, { count: number; revenue: number; cost: number; profit: number }> = {};
    for (const bill of list) {
      for (const item of bill.items) {
        const cat = item.product.category || "other";
        if (!catBreakdown[cat]) catBreakdown[cat] = { count: 0, revenue: 0, cost: 0, profit: 0 };
        const qty = item.quantity || 1;
        const rev = item.price * qty;
        
        let itemCost = item.product?.purchaseCost || 0;
        if (itemCost <= 0) {
          const skuKey = item.product?.sku ? item.product.sku.toLowerCase() : "";
          const idKey = item.product?.id ? item.product.id.toLowerCase() : "";
          const nameKey = item.product?.name ? item.product.name.trim().toLowerCase() : "";
          itemCost = (skuKey && productCostMap.get(skuKey)) ||
                     (idKey && productCostMap.get(idKey)) ||
                     (nameKey && productCostMap.get(nameKey)) ||
                     0;
        }
        const totalItemCost = itemCost * qty;
        catBreakdown[cat].count += qty;
        catBreakdown[cat].revenue += rev;
        catBreakdown[cat].cost += totalItemCost;
        catBreakdown[cat].profit += (rev - totalItemCost);
      }
    }

    return {
      totalRev,
      totalCost,
      totalProfit,
      profitMarginPct,
      totalCash,
      totalUpi,
      totalCard,
      totalKhata,
      totalDiscounts,
      totalItemsSold,
      avgBillValue,
      catBreakdown,
      billCount: list.length
    };
  }, [filteredReportBills, getBillPurchaseCost, productCostMap]);

  // Multipage Pagination calculation
  const totalReportPages = useMemo(() => {
    if (reportPageSize >= 9999) return 1;
    return Math.max(1, Math.ceil(filteredReportBills.length / reportPageSize));
  }, [filteredReportBills.length, reportPageSize]);

  const paginatedReportBills = useMemo(() => {
    if (reportPageSize >= 9999) return filteredReportBills;
    const start = (reportPage - 1) * reportPageSize;
    return filteredReportBills.slice(start, start + reportPageSize);
  }, [filteredReportBills, reportPage, reportPageSize]);

  // Friendly date label for UI
  const reportDateFilterLabel = useMemo(() => {
    switch (reportDateFilter) {
      case "today": return "Aaj (Today)";
      case "yesterday": return "Kal (Yesterday)";
      case "day_before": return "Parso (2 Days Ago)";
      case "this_month": return "Iss Mahine (This Month)";
      case "this_year": return "Iss Saal (This Year)";
      case "custom": return reportCustomDate ? `Tareekh: ${reportCustomDate}` : "Custom Tareekh";
      default: return "All Time (Opening Se Ab Tak)";
    }
  }, [reportDateFilter, reportCustomDate]);

  // Export Sales Report to CSV (with Wholesale Cost & Net Profit)
  const handleExportReportCSV = () => {
    if (filteredReportBills.length === 0) {
      alert("No bills available to export!");
      return;
    }
    const headers = [
      "Bill No", "Date", "Customer Name", "Phone", "Items Sold",
      "Payment Mode", "Subtotal", "Bargain Discount", "Wholesale Cost",
      "Net Profit", "Grand Total"
    ];
    const rows = filteredReportBills.map(b => {
      const bCost = getBillPurchaseCost(b);
      const bProfit = b.grandTotal - bCost;
      return [
        `"${b.billNo}"`,
        `"${b.createdAt}"`,
        `"${b.customer.name.replace(/"/g, '""')}"`,
        `"${b.customer.phone}"`,
        `"${b.items.map(it => `${it.product.name} (x${it.quantity})`).join(", ").replace(/"/g, '""')}"`,
        `"${b.paymentMode.toUpperCase()}"`,
        b.subtotal,
        b.totalSavings || b.discount || 0,
        bCost,
        bProfit,
        b.grandTotal
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rajnandini_Sales_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================
  // CUSTOMER DIRECTORY & VIP RELATIONSHIP INTELLIGENCE (CRM)
  // =========================================================

  // Group all bills by customer phone number or name
  const customerDirectory = useMemo<CustomerProfile[]>(() => {
    const map = new Map<string, CustomerProfile>();

    for (const bill of completedBills) {
      const rawPhone = (bill.customer?.phone || "").trim();
      const rawName = (bill.customer?.name || "").trim();

      const cleanDigits = rawPhone.replace(/\D/g, "");
      // Unique key: last 10 digits of phone if available, or cleaned phone, or trimmed lower name
      let key = "";
      if (cleanDigits.length >= 10) {
        key = cleanDigits.slice(-10);
      } else if (cleanDigits.length > 0) {
        key = cleanDigits;
      } else if (rawName && rawName.toLowerCase() !== "walk-in guest") {
        key = rawName.toLowerCase();
      } else {
        key = `guest-${bill.id}`;
      }

      const displayPhone = rawPhone && rawPhone !== "NA" ? rawPhone : (cleanDigits || "NA");
      const displayName = rawName && rawName.toLowerCase() !== "walk-in guest"
        ? rawName
        : (displayPhone !== "NA" ? `Customer ${displayPhone.slice(-4)}` : "Walk-in Guest");

      const savings = bill.totalSavings || bill.discount || 0;
      const itemsCount = (bill.items || []).reduce((s, it) => s + (it.quantity || 1), 0);

      const existing = map.get(key);
      if (existing) {
        existing.totalSpend += bill.grandTotal;
        existing.totalDiscount += savings;
        existing.visitCount += 1;
        existing.bills.push(bill);
        existing.purchasedItemsCount += itemsCount;
        if (displayName && displayName !== "Walk-in Guest" && (!existing.name || existing.name === "Walk-in Guest" || existing.name.startsWith("Customer "))) {
          existing.name = displayName;
        }
        if (displayPhone && displayPhone !== "NA" && existing.phone === "NA") {
          existing.phone = displayPhone;
        }
      } else {
        map.set(key, {
          id: key,
          phone: displayPhone,
          name: displayName,
          totalSpend: bill.grandTotal,
          totalDiscount: savings,
          visitCount: 1,
          firstVisit: bill.createdAt,
          lastVisit: bill.createdAt,
          lastVisitRaw: bill.rawDate,
          avgBillValue: bill.grandTotal,
          bills: [bill],
          purchasedItemsCount: itemsCount,
          topCategories: []
        });
      }
    }

    return Array.from(map.values()).map(c => {
      c.avgBillValue = c.visitCount > 0 ? Math.round(c.totalSpend / c.visitCount) : 0;
      // Sort bills newest first for each customer
      c.bills.sort((a, b) => (b.rawDate || b.createdAt).localeCompare(a.rawDate || a.createdAt));
      // Top categories
      const catCount: Record<string, number> = {};
      c.bills.forEach(b => {
        b.items.forEach(it => {
          const cat = it.product?.category || "ethnic";
          catCount[cat] = (catCount[cat] || 0) + (it.quantity || 1);
        });
      });
      c.topCategories = Object.keys(catCount).sort((a, b) => catCount[b] - catCount[a]).slice(0, 3);
      return c;
    });
  }, [completedBills]);

    // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");

    return customerDirectory.filter(c => {
      if (customerFilter === "repeat" && c.visitCount < 2) return false;
      if (customerFilter === "vip" && c.totalSpend < 5000) return false;
      if (customerFilter === "festive" && (!c.lastVisit || c.visitCount < 1)) return false;
      if (customerFilter === "negotiation" && c.totalDiscount <= 0) return false;

      if (q) {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.replace(/\D/g, "").includes(qDigits) || c.phone.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    }).sort((a, b) => {
      if (customerSortBy === "visits_desc") return b.visitCount - a.visitCount;
      if (customerSortBy === "discount_desc") return b.totalDiscount - a.totalDiscount;
      if (customerSortBy === "name_asc") return a.name.localeCompare(b.name);
      if (customerSortBy === "recent") {
        return (b.lastVisitRaw || b.lastVisit).localeCompare(a.lastVisitRaw || a.lastVisit);
      }
      return b.totalSpend - a.totalSpend;
    });
  }, [customerDirectory, customerSearch, customerFilter, customerSortBy]);

  // Customer Directory Metrics
  const customerAnalytics = useMemo(() => {
    const totalCustomers = customerDirectory.length;
    const totalSpend = customerDirectory.reduce((s, c) => s + c.totalSpend, 0);
    const totalDiscounts = customerDirectory.reduce((s, c) => s + c.totalDiscount, 0);
    const repeatCustomers = customerDirectory.filter(c => c.visitCount > 1).length;
    const vipCustomers = customerDirectory.filter(c => c.totalSpend >= 5000).length;
    const vipRevenue = customerDirectory.filter(c => c.totalSpend >= 5000).reduce((s, c) => s + c.totalSpend, 0);
    const vipRevenuePct = totalSpend > 0 ? Math.round((vipRevenue / totalSpend) * 100) : 0;
    const avgSpendPerCust = totalCustomers > 0 ? Math.round(totalSpend / totalCustomers) : 0;
    const avgDiscountPct = totalSpend > 0 ? ((totalDiscounts / (totalSpend + totalDiscounts)) * 100).toFixed(1) : "0.0";
    return {
      totalCustomers,
      totalSpend,
      totalDiscounts,
      repeatCustomers,
      vipCustomers,
      vipRevenue,
      vipRevenuePct,
      avgSpendPerCust,
      avgDiscountPct
    };
  }, [customerDirectory]);

  // Customer Pagination
  const totalCustomerPages = useMemo(() => {
    if (customerPageSize >= 9999) return 1;
    return Math.max(1, Math.ceil(filteredCustomers.length / customerPageSize));
  }, [filteredCustomers.length, customerPageSize]);

  const paginatedCustomers = useMemo(() => {
    if (customerPageSize >= 9999) return filteredCustomers;
    const start = (customerPage - 1) * customerPageSize;
    return filteredCustomers.slice(start, start + customerPageSize);
  }, [filteredCustomers, customerPage, customerPageSize]);

  // Match customer in POS checkout when typing mobile number
  const matchedCustomer = useMemo(() => {
    const cleanDigits = (customer.phone || "").replace(/\D/g, "");
    if (cleanDigits.length < 5) return null;
    const lastDigits = cleanDigits.slice(-10);
    return customerDirectory.find(c => {
      const cDigits = c.phone.replace(/\D/g, "");
      return cDigits.endsWith(lastDigits) || (cDigits.length >= 10 && lastDigits.endsWith(cDigits.slice(-10)));
    }) || null;
  }, [customer.phone, customerDirectory]);

  // Export Customers to CSV
  const handleExportCustomersCSV = () => {
    if (filteredCustomers.length === 0) {
      alert("No customer records to export!");
      return;
    }
    const headers = [
      "Customer Name", "Phone Number", "Total Spend (INR)", "Total Bargain Discount (INR)",
      "Total Visits", "Average Bill Value", "Last Visit Date", "Top Categories"
    ];
    const rows = filteredCustomers.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      c.totalSpend,
      c.totalDiscount,
      c.visitCount,
      c.avgBillValue,
      `"${c.lastVisit}"`,
      `"${c.topCategories.join(", ")}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rajnandini_Customer_Directory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Connect with Customer
  const handleOpenWhatsAppCustomer = (c: CustomerProfile) => {
    const digits = c.phone.replace(/\D/g, "");
    if (!digits || digits.length < 10) {
      alert("Customer phone number is invalid or not available.");
      return;
    }
    const phoneWithCountry = digits.length === 10 ? `91${digits}` : digits;
    const msg = encodeURIComponent(
      `Namaste ${c.name === "Walk-in Guest" ? "ji" : c.name + " ji"}! 🙏\n\nGreetings from *Rajnandini Boutique & Parlour*, Haridwar.\nThank you for shopping with us! We have exciting new bridal and festive arrivals in sarees, lehengas & suits.\n\n📍 Near PSC petrolpump, Ranipur Goan, Haridwar\n📞 +91 7464987898`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, "_blank");
  };

  // Switch to POS and autofill this customer for billing
  const handleStartBillForCustomer = (c: CustomerProfile) => {
    setCustomer({
      name: c.name === "Walk-in Guest" ? "" : c.name,
      phone: c.phone === "NA" ? "" : c.phone,
      notes: ""
    });
    setActiveTab("pos");
  };

  // Show Royal Flagship Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen royal-pattern-bg text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Ambient Champagne Gold Light Orbs */}
        <div className="absolute -top-40 -left-40 w-[480px] h-[480px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-gradient-to-b from-[#181310]/95 to-[#0e0b09]/98 border border-amber-500/35 rounded-3xl p-8 shadow-[0_25px_70px_-15px_rgba(245,158,11,0.22)] relative z-10 backdrop-blur-xl">
          {/* Ornate Top Gold Hairline Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" />

          {/* Royal Crest & Brand Identity */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-3.5">
              <img src="/logo.png" alt="Rajnandini Logo" className="w-16 h-16 object-contain bg-white p-1.5 rounded-2xl shadow-xl shadow-amber-500/10" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#120e0c] flex items-center justify-center" title="Security Active">
                <ShieldCheck className="w-3 h-3 text-stone-950" />
              </span>
            </div>

            <span className="text-[10px] font-bold tracking-[0.28em] text-amber-400/90 uppercase mb-1">
              Flagship Retail &amp; Billing Suite
            </span>
            <h1 className="text-3xl font-black tracking-[0.16em] bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent uppercase font-serif">
              RAJNANDINI
            </h1>
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-stone-950 font-black text-[10.5px] px-3.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>Darshan Enterprises</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-2.5 leading-relaxed">
              Near PSC petrolpump Ranipur goan , haridwar , Uttrakhand  249401
              <br />
              <span className="font-mono text-amber-200/80">GSTIN: 05GNZPS9902M1ZR · Ph: +91 7464987898</span>
            </p>
          </div>

          {/* Mini Feature Badges */}
          <div className="grid grid-cols-3 gap-2 mb-6 text-center">
            <div className="bg-stone-900/90 border border-stone-800/90 rounded-xl py-2 px-1.5">
              <ScanLine className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="text-[9.5px] font-semibold text-stone-300 block">Instant Barcode</span>
            </div>
            <div className="bg-stone-900/90 border border-stone-800/90 rounded-xl py-2 px-1.5">
              <Tag className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="text-[9.5px] font-semibold text-stone-300 block">Thermal Tags</span>
            </div>
            <div className="bg-stone-900/90 border border-stone-800/90 rounded-xl py-2 px-1.5">
              <Share2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <span className="text-[9.5px] font-semibold text-stone-300 block">WhatsApp Bill</span>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="flex items-center justify-between text-[11px] font-bold text-amber-300/90 uppercase tracking-wider mb-1.5">
                <span>Executive Store Password</span>
                <span className="text-[10px] text-emerald-400 font-normal flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Protected
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  placeholder="Enter showroom password..."
                  autoFocus
                  className="w-full px-4 py-3.5 pr-11 bg-[#090706] border border-amber-500/30 focus:border-amber-400 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400/25 font-medium tracking-wide transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-300 cursor-pointer p-1.5 rounded-lg hover:bg-stone-800/60 transition"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginError && (
                <p className="text-xs text-rose-400 font-semibold mt-2 flex items-center gap-1.5 bg-rose-950/50 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:via-amber-400 hover:to-amber-300 text-stone-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Showroom Terminal</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-800/80 text-center">
            <p className="text-[10.5px] text-stone-400 font-medium tracking-wide">
              Sarees · Bridal Lehengas · Designer Suits · Handbags · Bangles · Earrings · Jewellery
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen print:min-h-0 print:h-auto print:block bg-[#fef8f7] print:bg-white text-[#1d1b1b] flex flex-col font-sans">
      {/* =========================================================
          TOP LUXURY OBSIDIAN & CHAMPAGNE GOLD COMMAND HEADER
          ========================================================= */}
      {/* MAIN SCREEN INTERACTIVE UI (HIDDEN DURING PRINTING) */}
      <div className="no-print flex-1 flex flex-col">
        <header className="sticky top-0 z-40 bg-[#fef8f7]/95 backdrop-blur-xl border-b border-[#e7e1e1] shadow-[0_1px_8px_rgba(90,30,45,0.05)] px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Haute Couture Monogram & Cloud Sync */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Rajnandini Logo" className="h-10 w-auto object-contain bg-white rounded-xl p-1 shadow-xs border border-[#e7e1e1] shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[#5a1e2d] uppercase font-outfit leading-none">
                  RAJNANDINI
                </h1>
                <span className="text-[9.5px] uppercase tracking-widest text-[#7c5641] font-semibold bg-[#fdc9af]/40 px-2 py-0.5 rounded-full border border-[#c99a82]/30">
                  Haute Couture
                </span>
              </div>
              <span className="text-[10px] text-[#534345] font-medium mt-0.5">
                Darshan Enterprises • Near PSC petrolpump, Ranipur Goan, Haridwar
              </span>
            </div>

            {/* Cloud Live Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3ecec] border border-[#e7e1e1] shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#cba72f] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
              </span>
              <span className="text-[10.5px] text-[#1d1b1b] font-semibold">Cloud Live</span>
              <span className="text-[10px] text-[#534345] font-mono">• {products.length} SKUs Synced</span>
            </div>
          </div>

          {/* Center: Executive Atelier Pill Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 rounded-2xl bg-[#f8f2f2] border border-[#e7e1e1] text-xs shadow-inner">
            <button
              onClick={() => setActiveTab("pos")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                activeTab === "pos"
                  ? "bg-[#5a1e2d] text-white font-bold shadow-md shadow-[#5a1e2d]/25"
                  : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>POS Billing</span>
              {cart.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono ${
                  activeTab === "pos" ? "bg-[#ffd9de] text-[#3b0616]" : "bg-[#ede7e6] text-[#534345]"
                }`}>
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-[#5a1e2d] text-white font-bold shadow-md shadow-[#5a1e2d]/25"
                  : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "inventory" ? "bg-[#ffd9de] text-[#3b0616]" : "bg-[#ede7e6] text-[#534345]"
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                setReportDateFilter("today");
                setReportPage(1);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                activeTab === "reports"
                  ? "bg-[#5a1e2d] text-white font-bold shadow-md shadow-[#5a1e2d]/25"
                  : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Daily Sales</span>
              {completedBills.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === "reports" ? "bg-[#ffd9de] text-[#3b0616]" : "bg-[#ede7e6] text-[#534345]"
                }`}>
                  {completedBills.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("customers");
                setCustomerSearch("");
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                activeTab === "customers"
                  ? "bg-[#5a1e2d] text-white font-bold shadow-md shadow-[#5a1e2d]/25"
                  : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "customers" ? "bg-[#ffd9de] text-[#3b0616]" : "bg-[#ede7e6] text-[#534345]"
              }`}>
                {customerDirectory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("alterations")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer relative ${
                activeTab === "alterations"
                  ? "bg-[#5a1e2d] text-white font-bold shadow-md shadow-[#5a1e2d]/25"
                  : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Alterations</span>
              {alterationsList.filter(a => a.status !== "Delivered").length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === "alterations" ? "bg-[#ffd9de] text-[#3b0616]" : "bg-rose-100 text-rose-700 animate-pulse"
                }`}>
                  {alterationsList.filter(a => a.status !== "Delivered").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("staff_ledger")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer relative ${
                activeTab === "staff_ledger"
                  ? "bg-[#5a1e2d] text-white font-bold shadow-md shadow-[#5a1e2d]/25"
                  : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
              }`}
              title="Staff Product Purchases, Salary Deductions & Cash/UPI Repayments"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff Khata</span>
              {(staffPurchases.length > 0 || staffDeposits.length > 0) && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === "staff_ledger" ? "bg-[#ffd9de] text-[#3b0616]" : "bg-[#ede7e6] text-[#534345]"
                }`}>
                  {staffPurchases.length + staffDeposits.length}
                </span>
              )}
            </button>
          </nav>

          {/* Right: Quick Exchange, Register Info, Cashier Profile & Lock */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setExchangePreselectedBill(null);
                setShowExchangeModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5a1e2d] hover:bg-[#3f0819] text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
              title="Customer Product Exchange Studio (5-Day Window)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span>Exchange</span>
            </button>

            <div className="hidden 2xl:flex items-center gap-2 bg-[#f8f2f2] border border-[#ede7e6] px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[#534345] font-semibold">Register #01 - Haridwar</span>
            </div>

            <div className="flex items-center gap-2 bg-white border border-[#ede7e6] px-3 py-1 rounded-xl shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-[#fdc9af] flex items-center justify-center text-[#5a1e2d] font-bold text-xs">
                IS
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[11px] font-bold text-[#1d1b1b] leading-tight block">Indu Sharma</span>
                <span className="text-[9px] text-[#d4af37] font-semibold uppercase tracking-wider block">Floor Lead (Owner)</span>
              </div>
            </div>

            <button
              onClick={handleLogoutLock}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-[#ede7e6] hover:border-rose-200 text-[#534345] hover:text-rose-700 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Lock Screen"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </header>

        {/* =========================================================
            TAB 1: POS BILLING COUNTER (SHOWROOM CATALOG + VIP CART)
            ========================================================= */}
        {activeTab === "pos" && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-66px)]">
            {/* LEFT: SHOWROOM CATALOG & LASER BARCODE SCANNER BAR (60% split) */}
            <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto border-r border-[#e7e1e1]">
              {/* Top Barcode Quick-Scan & Search Action Strip */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#ede7e6] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                {/* Live Barcode Gun Scanner Input with F2 Badge */}
                <div className="relative w-full sm:w-1/2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ScanLine className="w-4 h-4 text-[#5a1e2d]" />
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan RFID / Barcode SKU..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    className="w-full pl-9 pr-14 py-2 font-medium text-xs sm:text-sm bg-[#f8f2f2] text-[#1d1b1b] rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5a1e2d]/20 border border-[#ede7e6] transition"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="p-1 text-[#534345] hover:text-black rounded-full cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-[10px] font-bold bg-[#ede7e6] text-[#534345] px-1.5 py-0.5 rounded shadow-2xs font-mono">F2</span>
                  </div>
                </div>

                {/* Keyword Search Input */}
                <div className="relative w-full sm:w-1/2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-[#857275]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search silhouettes, weaves, motifs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 font-medium text-xs sm:text-sm bg-[#f8f2f2] text-[#1d1b1b] rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5a1e2d]/20 border border-[#ede7e6] transition"
                  />
                </div>

                {/* Filter Toggles & Action CTAs */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                      inStockOnly
                        ? "bg-[#5a1e2d] text-white shadow-sm"
                        : "bg-[#f8f2f2] text-[#534345] hover:bg-[#ede7e6] border border-[#ede7e6]"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>In-Stock Only</span>
                  </button>

                  <button
                    onClick={() => setBridalFilterActive(!bridalFilterActive)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                      bridalFilterActive
                        ? "bg-[#fdc9af] text-[#79533e] border border-[#c99a82] shadow-sm"
                        : "bg-[#f8f2f2] text-[#534345] hover:bg-[#ede7e6] border border-[#ede7e6]"
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Bridal '26</span>
                  </button>

                  <button
                    onClick={() => {
                      setManualItemForm({ name: "", price: "", quantity: 1, category: "sarees", size: "Standard", saveToCatalog: false });
                      setShowManualItemModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-[#f3ecec] hover:bg-[#ede7e6] text-[#5a1e2d] rounded-xl text-xs font-bold transition cursor-pointer border border-[#d8c1c4]"
                    title="Add manual custom item without barcode"
                  >
                    + No-Tag
                  </button>

                  <button
                    onClick={() => openNewProductModal(selectedCategory !== "all" ? selectedCategory : "handbags")}
                    className="px-3 py-1.5 bg-[#5a1e2d] hover:bg-[#3f0819] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>SKU</span>
                  </button>
                </div>
              </div>

              {/* Luxury Category Navigation Pills with Exact Live Counts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 no-scrollbar">
                {[
                  { id: "all", label: "All Items", count: products.length },
                  { id: "sarees", label: "Kanjivaram & Banarasi Sarees", count: products.filter(p => p.category === "sarees").length },
                  { id: "lehengas", label: "Bridal Lehengas & Gowns", count: products.filter(p => p.category === "lehengas").length },
                  { id: "kurtis", label: "Designer Kurtis & Suits", count: products.filter(p => p.category === "kurtis").length },
                  { id: "handbags", label: "Luxury Handbags & Purses", count: products.filter(p => p.category === "handbags").length },
                  { id: "jewellery", label: "Bridal Jewellery & Sets", count: products.filter(p => p.category === "jewellery").length },
                  { id: "bangles", label: "Bangles & Kada", count: products.filter(p => p.category === "bangles").length },
                  { id: "earrings", label: "Earrings & Jhumkas", count: products.filter(p => p.category === "earrings").length },
                  { id: "footwear", label: "Footwear", count: products.filter(p => p.category === "footwear").length },
                  { id: "kidswear", label: "Kids Wear", count: products.filter(p => p.category === "kidswear").length },
                  { id: "undergarments", label: "Undergarments", count: products.filter(p => p.category === "undergarments").length },
                  { id: "handloom", label: "Handloom Fabrics", count: products.filter(p => p.category === "handloom").length },
                  { id: "cosmetics", label: "Cosmetics & Beauty", count: products.filter(p => p.category === "cosmetics").length },
                  { id: "parlour", label: "Tailoring & Fitting", count: products.filter(p => p.category === "parlour").length }
                ].map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as ProductCategory)}
                      className={`px-3.5 py-1.5 rounded-full font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#5a1e2d] text-white shadow-sm"
                          : "bg-white text-[#534345] hover:bg-[#f3ecec] border border-[#ede7e6]"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive ? "bg-white/20 text-white font-bold" : "bg-[#f3ecec] text-[#7c5641]"
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Showroom Catalog Grid: 3-column Tactile Luxury Cards (Image 3) */}
              {filteredProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-[#d8c1c4] p-10 text-center my-2">
                  <ShoppingBag className="w-12 h-12 text-[#d8c1c4] mb-2" />
                  <p className="text-sm font-bold text-[#1d1b1b]">No matching boutique garments found</p>
                  <p className="text-xs text-[#534345] mt-1 max-w-sm">
                    Try clearing the search filter, toggle in-stock filter off, or click &ldquo;+ SKU&rdquo; to add a new design.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setInStockOnly(false);
                      setBridalFilterActive(false);
                    }}
                    className="mt-4 px-4 py-2 bg-[#5a1e2d] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#3f0819] transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pb-6">
                  {filteredProducts.map(prod => {
                    const discountPct = prod.mrp > prod.price ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0;
                    const inCart = cart.find(i => i.product.id === prod.id);

                    // Determine craft tag
                    const craftTag = prod.badge || (
                      prod.category === "sarees" ? "Pure Gold Zari" :
                      prod.category === "lehengas" ? "Hand Zardozi Work" :
                      prod.category === "kurtis" ? "Mukaish Detailing" :
                      prod.category === "handbags" ? "Genuine Leather" :
                      prod.category === "jewellery" ? "Kundan & Polki" :
                      "Atelier Pure Weave"
                    );

                    return (
                      <div
                        key={prod.id}
                        className="bg-white rounded-2xl border border-[#ede7e6] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden relative"
                      >
                        {/* 4:5 Aspect Ratio Preview Shell */}
                        <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#f8f2f2] flex flex-col items-center justify-center p-3 border-b border-[#ede7e6]">
                          {/* Top-Left Craft Tag */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ede7e6] text-[#1d1b1b] shadow-2xs">
                              {craftTag}
                            </span>
                          </div>

                          {/* Top-Right Discount Tag */}
                          <div className="absolute top-2 right-2 z-10">
                            {discountPct > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdbca] text-[#2f1405] shadow-2xs">
                                {discountPct}% Off
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ede7e6] text-[#534345]">
                                Standard MRP
                              </span>
                            )}
                          </div>

                          {/* Center Artwork / Icon / Monogram */}
                          <div className="w-16 h-16 rounded-full bg-[#fdc9af]/50 flex items-center justify-center text-[#5a1e2d] mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                            {prod.imageUrl ? (
                              <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span className="font-serif font-black text-xl text-[#5a1e2d]">
                                {prod.category === "sarees" ? "🥻" : prod.category === "lehengas" ? "👗" : prod.category === "kurtis" ? "👚" : "✨"}
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#534345]">
                            {prod.category}
                          </span>
                          <span className="text-[10px] text-[#857275] mt-0.5 truncate max-w-[90%] font-medium">
                            {prod.sizes && prod.sizes.length > 0 ? prod.sizes.join(", ") : "Free Size Boutique Edition"}
                          </span>

                          {/* Bottom-Left In Stock / Added to Cart Tag */}
                          <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-sm ${
                            inCart
                              ? "bg-[#5a1e2d] text-white"
                              : prod.stock <= 2
                              ? "bg-rose-100 text-rose-800"
                              : "bg-[#1d1b1b]/80 text-white"
                          }`}>
                            {inCart ? `Added to Cart (${inCart.quantity})` : `In Stock: ${prod.stock} pcs`}
                          </div>
                        </div>

                        {/* Card Info & Pricing Body */}
                        <div className="p-3 flex flex-col flex-grow justify-between gap-1.5">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-[#857275] tracking-wider uppercase block">
                              {prod.sku}
                            </span>
                            <h3
                              onClick={() => handleAddToCart(prod)}
                              className="text-xs font-bold text-[#1d1b1b] line-clamp-1 leading-snug cursor-pointer hover:text-[#5a1e2d] transition"
                              title={prod.name}
                            >
                              {prod.name}
                            </h3>
                          </div>

                          <div className="flex items-baseline justify-between pt-1 border-t border-[#ede7e6]">
                            <div className="flex flex-col">
                              {prod.mrp > prod.price && (
                                <span className="text-[10px] text-[#857275] line-through font-mono">
                                  ₹{prod.mrp.toLocaleString("en-IN")}
                                </span>
                              )}
                              <span className="text-sm font-black text-[#5a1e2d] font-mono tabular-nums">
                                ₹{prod.price.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedProductForBarcode(prod);
                                  setBarcodeStickerCount(4);
                                }}
                                className="p-1.5 rounded-lg bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#5a1e2d] border border-[#ede7e6] transition cursor-pointer"
                                title="Print Barcode Tag"
                              >
                                <Tag className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleAddToCart(prod)}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer ${
                                  inCart
                                    ? "bg-[#5a1e2d] text-white"
                                    : "bg-[#5a1e2d] text-white hover:bg-[#3f0819] shadow-2xs"
                                }`}
                                title="Add to Bill"
                              >
                                {inCart ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: VIP BILLING COUNTER & CHECKOUT LEDGER (40% split - Image 3) */}
            <div className="w-full lg:w-[460px] bg-white border-l border-[#ede7e6] flex flex-col justify-between h-full shadow-xl relative z-10 p-3 lg:p-4 gap-3 overflow-y-auto">
              <div className="flex flex-col gap-3">
                {/* 1. VIP Customer Profile Card */}
                <div className="bg-[#fef8f7] border border-[#ede7e6] p-3.5 rounded-2xl shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#fdc9af] flex items-center justify-center text-[#79533e] font-bold text-sm shrink-0 shadow-2xs font-serif">
                        {customer.name && customer.name !== "Walk-in Guest" 
                          ? customer.name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                          : <User className="w-5 h-5 text-[#79533e]" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-[#1d1b1b] truncate">
                            {customer.name || "Walk-in Guest"}
                          </h4>
                          {matchedCustomer ? (
                            matchedCustomer.totalSpend >= 25000 ? (
                              <span className="bg-[#ffe088] text-[#241a00] px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 shadow-2xs">
                                <Crown className="w-3 h-3 text-[#735c00]" /> Platinum VIP
                              </span>
                            ) : matchedCustomer.totalSpend >= 5000 || matchedCustomer.visitCount >= 2 ? (
                              <span className="bg-[#ffe088] text-[#241a00] px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 shadow-2xs">
                                <Crown className="w-3 h-3 text-[#735c00]" /> Gold VIP
                              </span>
                            ) : (
                              <span className="bg-[#fdc9af]/50 text-[#7c5641] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Registered Client
                              </span>
                            )
                          ) : (
                            <span className="bg-[#ede7e6] text-[#534345] px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              Walk-in Guest
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#534345] truncate font-medium">
                          {matchedCustomer 
                            ? `+91 ${customer.phone} • ${matchedCustomer.visitCount} orders recorded` 
                            : customer.phone 
                            ? `+91 ${customer.phone} • New Guest` 
                            : "Counter Billing • Haridwar"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("customers")}
                      className="p-1.5 rounded-xl bg-white border border-[#ede7e6] text-[#534345] hover:text-[#5a1e2d] hover:bg-[#ede7e6] transition cursor-pointer"
                      title="Search Customer in CRM Directory"
                    >
                      <User className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Customer Quick Inputs */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#ede7e6]">
                    <input
                      type="text"
                      placeholder="Guest / Client Name"
                      value={customer.name}
                      onChange={e => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-[#ede7e6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a1e2d]/20 text-[#1d1b1b]"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp Mobile (+91)"
                      value={customer.phone}
                      onChange={e => {
                        const newPhone = e.target.value;
                        const cleanDigits = newPhone.replace(/\D/g, "");
                        let nextName = customer.name;
                        if (cleanDigits.length >= 10 && (!nextName || nextName === "Walk-in Guest")) {
                          const last10 = cleanDigits.slice(-10);
                          const found = customerDirectory.find(c => c.phone.replace(/\D/g, "").endsWith(last10));
                          if (found && found.name && found.name !== "Walk-in Guest") {
                            nextName = found.name;
                          }
                        }
                        setCustomer({ ...customer, phone: newPhone, name: nextName });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-[#ede7e6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a1e2d]/20 text-[#1d1b1b]"
                    />
                  </div>

                  {/* VIP Metrics Bar (Real Data Only) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 bg-white p-2.5 rounded-xl border border-[#ede7e6] text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#857275] uppercase font-bold tracking-wider">Lifetime Spend</span>
                      <span className="font-bold text-[#5a1e2d] font-mono">
                        {matchedCustomer 
                          ? `₹${matchedCustomer.totalSpend.toLocaleString("en-IN")} (${matchedCustomer.visitCount} Orders)`
                          : "₹0 (0 Orders)"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#857275] uppercase font-bold tracking-wider">Client Status</span>
                      <span className="font-bold text-[#735c00] font-mono">
                        {matchedCustomer 
                          ? (matchedCustomer.totalDiscount > 0 ? `₹${matchedCustomer.totalDiscount.toLocaleString("en-IN")} Savings` : "Verified Client")
                          : "New Walk-in"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Alteration & Fitting Work Order Desk */}
                <div className="bg-[#fef8f7] border border-[#ede7e6] p-3 rounded-2xl shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alterationEnabled}
                        onChange={e => setAlterationEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-[#5a1e2d] accent-[#5a1e2d] cursor-pointer"
                      />
                      <span className="font-bold text-xs text-[#1d1b1b]">Alteration &amp; Fitting Work Order</span>
                    </label>
                    <span className="text-[9.5px] font-bold bg-[#ffdbca] text-[#2f1405] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Priority Atelier
                    </span>
                  </div>

                  {alterationEnabled && (
                    <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-[#ede7e6] animate-in fade-in">
                      <textarea
                        rows={2}
                        value={alterationData.fittingNotes}
                        onChange={e => setAlterationData({ ...alterationData, fittingNotes: e.target.value })}
                        placeholder="Fitting instructions, waistline ease, fall/pico, blouse hook adjustments..."
                        className="w-full p-2 bg-white text-[#1d1b1b] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5a1e2d]/20 border border-[#ede7e6] resize-none"
                      />
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#ede7e6] text-[11px]">
                        <div>
                          <label className="text-[10px] font-bold text-[#7c5641] block mb-0.5">Assigned Tailor</label>
                          <select
                            value={alterationData.tailorName}
                            onChange={e => setAlterationData({ ...alterationData, tailorName: e.target.value })}
                            className="w-full p-1.5 bg-white text-[#1d1b1b] rounded-lg text-xs border border-[#ede7e6] focus:outline-none"
                          >
                            {TAILOR_NAMES.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#7c5641] block mb-0.5">Trial / Ready Date</label>
                          <input
                            type="date"
                            value={alterationData.readyDate}
                            onChange={e => setAlterationData({ ...alterationData, readyDate: e.target.value })}
                            className="w-full p-1.5 bg-white text-[#1d1b1b] rounded-lg text-xs border border-[#ede7e6] focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Bill Matrix (Active Slip Line Items) */}
                <div className="bg-white border border-[#ede7e6] p-3 rounded-2xl shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#ede7e6]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#1d1b1b]">Bill Matrix</span>
                      <span className="bg-[#f3ecec] text-[#5a1e2d] font-mono font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {cart.reduce((s, i) => s + i.quantity, 0)} Items
                      </span>
                    </div>
                    {cart.length > 0 && (
                      <button
                        onClick={handleClearCart}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Clear All
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar">
                    {cart.length === 0 ? (
                      <div className="py-6 text-center text-[#857275]">
                        <ShoppingBag className="w-7 h-7 mx-auto mb-1 text-[#d8c1c4]" />
                        <p className="text-xs font-bold text-[#534345]">Cart is currently empty</p>
                        <p className="text-[10px] text-[#857275] mt-0.5">Click any design on the left or scan barcode gun</p>
                      </div>
                    ) : (
                      cart.map((item, idx) => {
                        const origPrice = item.originalPrice || item.product.price;
                        const isDiscounted = item.price < origPrice;

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-[#fef8f7] rounded-xl border border-[#ede7e6] gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-[#fdc9af]/60 flex items-center justify-center text-[#5a1e2d] font-black text-xs shrink-0 font-serif">
                                {item.product.category === "sarees" ? "🥻" : item.product.category === "lehengas" ? "👗" : "✨"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-[#1d1b1b] truncate text-xs">
                                  {item.product.name}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-[#857275]">
                                  <span className="bg-[#ede7e6] text-[#1d1b1b] px-1.5 py-0.2 rounded font-semibold">
                                    {item.selectedSize || "Standard"}
                                  </span>
                                  <span>• Fall &amp; Pico Marked</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0 font-mono">
                              <span className="font-black text-xs text-[#1d1b1b]">
                                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                              </span>
                              <div className="flex items-center gap-1 text-[10.5px]">
                                <div className="flex items-center border border-[#ede7e6] bg-white rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => updateQuantity(idx, -1)}
                                    className="px-1.5 py-0.5 text-[#534345] hover:bg-[#ede7e6]"
                                  >
                                    -
                                  </button>
                                  <span className="px-1.5 font-bold">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(idx, 1)}
                                    className="px-1.5 py-0.5 text-[#534345] hover:bg-[#ede7e6]"
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeFromCart(idx)}
                                  className="text-rose-500 hover:text-rose-700 ml-1 p-0.5"
                                  title="Remove Item"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 4. VIP Bargain & Deal Desk (Client Favorite Feature - Image 3) */}
                <div className="bg-[#fef8f7] border border-[#ede7e6] p-3 rounded-2xl shadow-2xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Handshake className="w-4 h-4 text-[#735c00]" />
                      <span className="font-bold text-xs text-[#5a1e2d] font-serif uppercase tracking-wide">
                        VIP Bargain &amp; Deal Desk
                      </span>
                    </div>
                    <span className="text-[9.5px] font-bold bg-[#ffe088] text-[#241a00] px-2 py-0.5 rounded font-mono">
                      Negotiation Protocol Active
                    </span>
                  </div>

                  {/* Special VIP Agreed Rate Input Box with Owner Override */}
                  <div className="bg-white p-2.5 rounded-xl border border-[#ede7e6] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10.5px] font-medium text-[#534345]">Special VIP Agreed Price</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#5a1e2d]">Owner Override</span>
                        <button
                          type="button"
                          onClick={() => setOwnerOverrideActive(!ownerOverrideActive)}
                          className={`w-7 h-4 rounded-full relative flex items-center p-0.5 transition cursor-pointer ${
                            ownerOverrideActive ? "bg-[#5a1e2d]" : "bg-[#ded9d8]"
                          }`}
                        >
                          <div className={`w-3 h-3 bg-white rounded-full shadow-xs transition-transform ${
                            ownerOverrideActive ? "translate-x-3" : "translate-x-0"
                          }`} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center font-bold text-sm text-[#5a1e2d] font-mono">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={subtotal}
                          placeholder={subtotal > 0 ? String(subtotal) : "0"}
                          value={agreedDealPrice}
                          onChange={e => handleAgreedDealPriceChange(e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 bg-[#f8f2f2] font-black text-sm text-[#5a1e2d] rounded-lg focus:outline-none focus:bg-white border border-[#ede7e6] font-mono"
                        />
                      </div>
                      <div className="shrink-0 flex items-center gap-1 bg-[#ede7e6] px-2 py-1 rounded text-[#534345] text-[10px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#5a1e2d]" />
                        <span>PIN Verified</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-[#534345] pt-0.5">
                      <span>
                        Discretionary Reduction:{" "}
                        <strong className="text-[#5a1e2d] font-mono">
                          {discountAmount > 0 ? `-₹${discountAmount.toLocaleString("en-IN")}` : "₹0"}
                        </strong>
                      </span>
                      <span className="text-[#735c00] font-bold">Special Boutique Courtesy</span>
                    </div>

                    {/* Quick Rounding Chips */}
                    <div className="flex items-center gap-1 pt-1 border-t border-[#ede7e6] overflow-x-auto no-scrollbar">
                      <button
                        onClick={() => handleQuickRoundOff(50)}
                        className="px-2 py-0.5 bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#1d1b1b] rounded text-[10px] font-bold font-mono transition"
                      >
                        Round ₹50
                      </button>
                      <button
                        onClick={() => handleQuickRoundOff(100)}
                        className="px-2 py-0.5 bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#1d1b1b] rounded text-[10px] font-bold font-mono transition"
                      >
                        Round ₹100
                      </button>
                      <button
                        onClick={() => handleQuickPercentDiscount(5)}
                        className="px-2 py-0.5 bg-[#ffdbca] text-[#2f1405] rounded text-[10px] font-bold font-mono transition"
                      >
                        5%
                      </button>
                      <button
                        onClick={() => handleQuickPercentDiscount(10)}
                        className="px-2 py-0.5 bg-[#ffdbca] text-[#2f1405] rounded text-[10px] font-bold font-mono transition"
                      >
                        10%
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. Financial Breakdown Matrix */}
                <div className="flex flex-col gap-1 text-[#534345] text-xs pt-1">
                  <div className="flex justify-between">
                    <span>Catalogue Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="font-mono text-[#1d1b1b] font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[#7c5641]">
                    <span>Standard Catalogue Promo Discount</span>
                    <span>-₹0.00 (Superseded)</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#5a1e2d] font-bold">
                      <span>VIP Special Agreed Rate</span>
                      <span className="font-mono">₹{(subtotal - discountAmount).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (5% Apparels - HSN 6204)</span>
                    <span className="font-mono text-[#1d1b1b]">₹0 (Included / Retail Net)</span>
                  </div>

                  {/* Grand Payable Bento Highlight */}
                  <div className="flex justify-between items-center bg-[#f8f2f2] p-3 rounded-xl border border-[#ede7e6] mt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-[#857275] tracking-wider">
                        Grand Payable Amount
                      </span>
                      {totalSavings > 0 && (
                        <span className="text-[10px] text-[#735c00] font-bold font-mono">
                          Total Client Savings: ₹{totalSavings.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-black text-[#5a1e2d] font-mono tabular-nums">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* 6. Tender Allocation (Split Mode) */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-[#857275] tracking-wider">
                    Tender Allocation (Payment Mode)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setPaymentMode("cash")}
                      className={`p-2 rounded-xl border flex flex-col text-left transition cursor-pointer ${
                        paymentMode === "cash"
                          ? "bg-[#5a1e2d] text-white border-[#5a1e2d] shadow-2xs"
                          : "bg-[#f8f2f2] text-[#1d1b1b] border-[#ede7e6] hover:bg-[#ede7e6]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-sans font-medium">Cash Drawer</span>
                        <Banknote className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-xs mt-1">
                        {paymentMode === "cash" ? `₹${grandTotal.toLocaleString("en-IN")}` : "₹0"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode("card")}
                      className={`p-2 rounded-xl border flex flex-col text-left transition cursor-pointer ${
                        paymentMode === "card"
                          ? "bg-[#5a1e2d] text-white border-[#5a1e2d] shadow-2xs"
                          : "bg-[#f8f2f2] text-[#1d1b1b] border-[#ede7e6] hover:bg-[#ede7e6]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-sans font-medium">HDFC Card</span>
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-xs mt-1">
                        {paymentMode === "card" ? `₹${grandTotal.toLocaleString("en-IN")}` : "₹0"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode("upi")}
                      className={`p-2 rounded-xl border flex flex-col text-left transition cursor-pointer ${
                        paymentMode === "upi"
                          ? "bg-[#5a1e2d] text-white border-[#5a1e2d] shadow-2xs"
                          : "bg-[#f8f2f2] text-[#1d1b1b] border-[#ede7e6] hover:bg-[#ede7e6]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-sans font-medium">Instant UPI</span>
                        <QrCode className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-xs mt-1">
                        {paymentMode === "upi" ? `₹${grandTotal.toLocaleString("en-IN")}` : "₹0"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode("staff_salary")}
                      className={`p-2 rounded-xl border flex flex-col text-left transition cursor-pointer ${
                        paymentMode === "staff_salary"
                          ? "bg-[#5a1e2d] text-white border-[#5a1e2d] shadow-2xs"
                          : "bg-[#f8f2f2] text-[#1d1b1b] border-[#ede7e6] hover:bg-[#ede7e6]"
                      }`}
                      title="Staff taking garment - deduct from monthly salary"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-sans font-medium">Salary Cut</span>
                        <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <span className="font-black text-xs mt-1">
                        {paymentMode === "staff_salary" ? `₹${grandTotal.toLocaleString("en-IN")}` : "₹0"}
                      </span>
                    </button>
                  </div>

                  {/* Staff Selection Dropdown when Staff Salary Cut is selected */}
                  {paymentMode === "staff_salary" && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 mt-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-950 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                          Select Staff Taking Garment:
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded">
                          Salary Deduction
                        </span>
                      </div>
                      <select
                        value={selectedStaffBuyerId}
                        onChange={(e) => setSelectedStaffBuyerId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-stone-900 focus:outline-hidden focus:border-amber-600"
                      >
                        {staffMembers.filter(s => s.isActive).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role}) - Base Salary: ₹{s.monthlySalary.toLocaleString("en-IN")}/mo
                          </option>
                        ))}
                      </select>
                      <p className="text-[10.5px] text-amber-900/90 leading-tight">
                        💡 ₹{grandTotal.toLocaleString("en-IN")} will be cut from {staffMembers.find(s => s.id === selectedStaffBuyerId)?.name || "staff"}&apos;s salary and tracked in <strong>Staff Khata</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Sticky Execution CTAs */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#ede7e6] mt-2">
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="px-3.5 py-2.5 bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#1d1b1b] rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition"
                  title="Hold Bill [F4]"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hold [F4]</span>
                </button>

                <button
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className="flex-grow py-3 px-4 bg-[#5a1e2d] hover:bg-[#3f0819] text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-40 cursor-pointer uppercase tracking-wider font-outfit"
                >
                  <Printer className="w-4 h-4 text-[#d4af37]" />
                  <span>Complete Billing &amp; Print Tag [↵]</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: INVENTORY & BARCODE TAG STUDIO
            ========================================================= */}
        {activeTab === "inventory" && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-[1720px] mx-auto space-y-5">
              {/* Top Action & Executive Header (Image 2) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#ede7e6] shadow-sm">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a1e2d] px-2.5 py-0.5 rounded-full bg-[#ffd9de]">
                      Atelier Ledger
                    </span>
                    <span className="text-[11px] text-[#534345] flex items-center gap-1 font-medium">
                      <ScanLine className="w-3.5 h-3.5 text-[#d4af37]" /> RFID / Barcode Synced • Floor Terminal A1
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-black text-[#5a1e2d] font-outfit tracking-tight">
                    Inventory Master &amp; Garment Catalog
                  </h1>
                  <p className="text-xs text-[#534345] mt-1 font-medium">
                    Real-time stock valuation, RFID tags &amp; multi-branch warehouse tracking for Rajnandini (Darshan Enterprises)
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <a
                    href="/RAJNANDINI_GENUINE_INVENTORY_MASTER.csv"
                    download="RAJNANDINI_GENUINE_INVENTORY_MASTER.csv"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#5a1e2d] font-bold text-xs transition border border-[#ede7e6] shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Master CSV</span>
                  </a>

                  <button
                    onClick={() => openNewProductModal("handbags")}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5a1e2d] text-white hover:bg-[#3f0819] font-bold text-xs transition shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Garment SKU</span>
                  </button>
                </div>
              </div>

              {/* 4 Luxury Metric Bento Cards (Image 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Active SKUs */}
                <div className="bg-white p-5 rounded-2xl border border-[#ede7e6] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#857275]">Active SKUs</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black text-[#5a1e2d] font-mono tabular-nums">
                          {products.length.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#ffd9de]/60 flex items-center justify-center text-[#5a1e2d]">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-1 flex items-center gap-1.5 text-[11px] text-[#534345]">
                    <span className="font-bold text-[#735c00] bg-[#ffe088]/40 px-1.5 py-0.5 rounded font-mono">
                      {products.filter(p => (p.stock || 0) > 0).length} In Stock
                    </span>
                    <span>• {products.filter(p => (p.stock || 0) <= 0).length} Sold Out</span>
                  </div>
                </div>

                {/* Metric 2: Available Stock */}
                <div className="bg-white p-5 rounded-2xl border border-[#ede7e6] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#857275]">Available Stock</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black text-[#5a1e2d] font-mono tabular-nums">
                          {totalPhysicalPieces.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs font-bold text-[#857275]">Units</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#fdc9af]/60 flex items-center justify-center text-[#79533e]">
                      <PackageCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-1 flex flex-col gap-1 text-[11px] text-[#534345]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5a1e2d] font-mono">{totalPhysicalPieces.toLocaleString("en-IN")} Pcs</span>
                      <span className="text-[#857275]">Showroom Racks</span>
                    </div>
                    <div className="text-[10px] text-[#7c5641]">
                      {products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 2).length} critical low stock (≤2 pcs)
                    </div>
                  </div>
                </div>

                {/* Metric 3: Units Sold */}
                <div className="bg-white p-5 rounded-2xl border border-[#ede7e6] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#857275]">Units Sold (MTD)</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black text-[#5a1e2d] font-mono tabular-nums">
                          {totalUnitsSold.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs font-bold text-[#857275]">Units</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#ede7e6] flex items-center justify-center text-[#5a1e2d]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-1 flex items-center justify-between text-[11px] text-[#534345]">
                    <span className="font-bold text-[#5a1e2d] font-mono">
                      {completedBills.length} Bills Settled
                    </span>
                    <span className="text-[#857275]">All Showroom Sales</span>
                  </div>
                </div>

                {/* Metric 4: Stock Valuation */}
                <div className="bg-white p-5 rounded-2xl border border-[#ede7e6] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#857275]">Stock Retail Value</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-bold text-[#5a1e2d] font-mono tabular-nums">
                          ₹{totalRetailStockValue.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#ffd9de] flex items-center justify-center text-[#5a1e2d]">
                      <Banknote className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-1 flex items-center justify-between text-[11px] text-[#534345]">
                    <span>Cost: ₹{totalCostStockValue.toLocaleString("en-IN")}</span>
                    <span className="font-bold text-[#7c5641]">
                      Margin: {totalRetailStockValue > 0 ? Math.round(((totalRetailStockValue - totalCostStockValue) / totalRetailStockValue) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Catalog, Bestsellers, Suppliers, Duplicate Cleaner */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#f8f2f2] rounded-2xl border border-[#ede7e6]">
                <button
                  onClick={() => setInventorySubTab("catalog")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    inventorySubTab === "catalog"
                      ? "bg-[#5a1e2d] text-white shadow-sm"
                      : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Garment Catalog &amp; Tags</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    inventorySubTab === "catalog" ? "bg-white/20 text-white" : "bg-[#ede7e6] text-[#534345]"
                  }`}>
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => setInventorySubTab("bestsellers")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    inventorySubTab === "bestsellers"
                      ? "bg-[#5a1e2d] text-white shadow-sm"
                      : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Bestseller &amp; Velocity</span>
                </button>

                <button
                  onClick={() => setInventorySubTab("suppliers")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    inventorySubTab === "suppliers"
                      ? "bg-[#5a1e2d] text-white shadow-sm"
                      : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Wholesale Suppliers</span>
                </button>

                <button
                  onClick={() => setInventorySubTab("duplicates")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    inventorySubTab === "duplicates"
                      ? "bg-[#5a1e2d] text-white shadow-sm"
                      : "text-[#534345] hover:text-[#1d1b1b] hover:bg-[#ede7e6]"
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate Finder &amp; Cleaner</span>
                </button>
              </div>

              {inventorySubTab === "catalog" && (
                <>
                  {/* Search, Filter & Quick Scanning Suite (Image 2) */}
                  <div className="bg-white p-4 rounded-2xl border border-[#ede7e6] shadow-sm flex flex-col gap-3">
                    {/* Top Row: Scanner input, Huge search bar, and batch buttons */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                      {/* Live RFID / Scanner Input */}
                      <div className="lg:col-span-4 relative flex items-center">
                        <ScanLine className="w-4 h-4 absolute left-3.5 text-[#5a1e2d]" />
                        <input
                          type="text"
                          placeholder="Scan RFID Tag or Enter SKU (e.g. RJ-LHG)..."
                          value={inventorySearch}
                          onChange={e => setInventorySearch(e.target.value)}
                          className="w-full pl-10 pr-8 py-2.5 bg-[#f8f2f2] rounded-xl text-[#1d1b1b] text-xs font-semibold focus:outline-none focus:bg-white border border-[#ede7e6] focus:ring-2 focus:ring-[#5a1e2d]/20 transition"
                        />
                        {inventorySearch && (
                          <button onClick={() => setInventorySearch("")} className="absolute right-3 text-[#857275] hover:text-black">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Comprehensive Search Bar (prominent & wide!) */}
                      <div className="lg:col-span-5 relative flex items-center">
                        <Search className="w-4 h-4 absolute left-3.5 text-[#857275]" />
                        <input
                          type="text"
                          placeholder="Search by Fabric (Raw Silk, Organza), Weave, Karigari style, Title..."
                          value={inventorySearch}
                          onChange={e => setInventorySearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#f8f2f2] rounded-xl text-[#1d1b1b] text-xs font-semibold focus:outline-none focus:bg-white border border-[#ede7e6] focus:ring-2 focus:ring-[#5a1e2d]/20 transition"
                        />
                      </div>

                      {/* Action Bar Shortcuts */}
                      <div className="lg:col-span-3 flex items-center justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            if (filteredInventoryProducts.length > 0) {
                              setSelectedProductForBarcode(filteredInventoryProducts[0]);
                              setBarcodeStickerCount(4);
                            }
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#1d1b1b] font-bold text-xs flex items-center gap-1.5 transition border border-[#ede7e6] cursor-pointer"
                        >
                          <Tag className="w-3.5 h-3.5 text-[#5a1e2d]" />
                          <span>Batch Tags</span>
                        </button>
                        <button
                          onClick={handleReloadWholesaleInventory}
                          className="px-3 py-2.5 rounded-xl bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#534345] font-bold text-xs flex items-center gap-1.5 transition border border-[#ede7e6] cursor-pointer"
                          title="Cloud Live Sync"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Sync</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Badges & Quick Chips */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#ede7e6]">
                      {/* Categories */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <span className="text-[11px] text-[#857275] font-bold mr-1">Category:</span>
                        {[
                          { id: "all", label: `All Garments (${products.length})` },
                          { id: "lehengas", label: `Bridal Heavy (${products.filter(p => p.category === "lehengas").length})` },
                          { id: "sarees", label: `Heritage Sarees (${products.filter(p => p.category === "sarees").length})` },
                          { id: "kurtis", label: `Designer Kurtis (${products.filter(p => p.category === "kurtis").length})` },
                          { id: "handbags", label: `Luxury Handbags (${products.filter(p => p.category === "handbags").length})` },
                          { id: "jewellery", label: `Jewellery (${products.filter(p => p.category === "jewellery").length})` },
                          { id: "undergarments", label: `Undergarments (${products.filter(p => p.category === "undergarments").length})` }
                        ].map(cat => {
                          const isSel = inventoryCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setInventoryCategory(cat.id as ProductCategory)}
                              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                                isSel
                                  ? "bg-[#5a1e2d] text-white shadow-2xs"
                                  : "bg-[#f8f2f2] text-[#534345] hover:bg-[#ede7e6] border border-[#ede7e6]"
                              }`}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Stock Status Filters */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#857275] font-bold mr-1">Status:</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#f8f2f2] text-[11px] font-bold text-[#1d1b1b] flex items-center gap-1.5 border border-[#ede7e6]">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Low Stock (&lt;3)
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#f8f2f2] text-[11px] font-bold text-[#1d1b1b] flex items-center gap-1.5 border border-[#ede7e6]">
                          <span className="w-2 h-2 rounded-full bg-[#d4af37]"></span>
                          Ready for Display
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Master Inventory Table Card (Image 2) */}
                  <div className="bg-white rounded-2xl border border-[#ede7e6] shadow-sm overflow-hidden flex flex-col">
                    {/* Table Header Bar with Select Stats */}
                    <div className="px-4 py-3 bg-[#f8f2f2] flex items-center justify-between border-b border-[#ede7e6]">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded text-[#5a1e2d] accent-[#5a1e2d] cursor-pointer" />
                          <span className="text-xs font-bold text-[#1d1b1b]">Select All Current View</span>
                        </label>
                        <span className="text-[11px] text-[#857275]">
                          • Showing {filteredInventoryProducts.length} of {products.length} boutique garments
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#534345]">
                        <span>Default Currency: <strong className="text-[#1d1b1b]">INR (₹)</strong></span>
                      </div>
                    </div>

                    {/* Table Elements */}
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white font-bold text-[10.5px] uppercase tracking-wider text-[#857275] border-b border-[#ede7e6]">
                            <th className="py-3 px-3 w-10 text-center"></th>
                            <th className="py-3 px-4">SKU &amp; RFID Tag</th>
                            <th className="py-3 px-4">Garment Title &amp; Stock / Sold</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Available Sizes</th>
                            <th className="py-3 px-4 text-right">Cost Rate</th>
                            <th className="py-3 px-4 text-right">MRP / Selling</th>
                            <th className="py-3 px-4">Stock &amp; Sold Velocity</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ede7e6] text-[#1d1b1b]">
                          {filteredInventoryProducts.map(p => {
                            const discountPct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                            const markupPct = p.purchaseCost > 0 ? Math.round(((p.price - p.purchaseCost) / p.purchaseCost) * 100) : 45;
                            const soldQty = productSoldMap.get(p.id) ?? (p.sku ? productSoldMap.get(p.sku.toUpperCase().trim()) : undefined) ?? 0;
                            const totalTrackedUnits = (p.stock || 0) + soldQty;
                            const sellThroughPct = totalTrackedUnits > 0 ? Math.round((soldQty / totalTrackedUnits) * 100) : 0;

                            return (
                              <tr key={p.id} className="hover:bg-[#fef8f7] transition group">
                                <td className="py-3 px-3 text-center">
                                  <input type="checkbox" className="w-4 h-4 rounded text-[#5a1e2d] accent-[#5a1e2d] cursor-pointer" />
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="font-mono font-bold text-[#5a1e2d] text-xs">
                                      {p.sku}
                                    </span>
                                    <span className="text-[10px] text-[#857275] font-mono flex items-center gap-1">
                                      <ScanLine className="w-3 h-3 text-[#d4af37]" /> RF: {p.barcode.slice(-8)}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 min-w-[280px]">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-14 rounded-lg bg-[#f8f2f2] overflow-hidden flex-shrink-0 relative shadow-2xs border border-[#ede7e6] flex items-center justify-center text-xl font-serif">
                                      {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span>{p.category === "sarees" ? "🥻" : p.category === "lehengas" ? "👗" : "✨"}</span>
                                      )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-xs text-[#1d1b1b] truncate">
                                          {p.name}
                                        </span>
                                        {/* Dynamic Stock & Sold Pills right beside the item title */}
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                          p.stock <= 2
                                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                                            : "bg-[#f8f2f2] text-[#1d1b1b] border border-[#ede7e6]"
                                        }`}>
                                          Stock: {p.stock} pcs
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                          soldQty > 0
                                            ? "bg-[#ffd9de] text-[#3b0616] border border-[#ffd9de]"
                                            : "bg-slate-100 text-slate-500 border border-slate-200"
                                        }`}>
                                          Sold: {soldQty} pcs
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-[#857275] truncate mt-0.5">
                                        {p.badge || "Handloom Pure Raw Silk • Intricate Zardozi"}
                                      </span>
                                      <span className="text-[10px] text-[#735c00] font-semibold mt-0.5">
                                        Karigar: Haridwar Atelier Guild
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ffd9de] text-[#3b0616] uppercase">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10.5px] bg-[#f8f2f2] font-semibold text-[#1d1b1b] border border-[#ede7e6]">
                                    {p.sizes && p.sizes.length > 0 ? p.sizes.join(", ") : "Free Size"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[#857275] whitespace-nowrap">
                                  ₹{(p.purchaseCost || 0).toLocaleString("en-IN")}
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="flex flex-col items-end">
                                    <span className="font-black font-mono text-[#5a1e2d] text-xs">
                                      ₹{p.price.toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-[10px] text-[#7c5641] font-bold font-mono">
                                      {markupPct}% Markup
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex flex-col gap-1 min-w-[140px]">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-extrabold text-[#1d1b1b] font-mono">
                                        {p.stock} in stock
                                      </span>
                                      <span className="font-extrabold text-[#5a1e2d] bg-[#ffd9de]/90 px-2 py-0.5 rounded-full font-mono text-[10px]">
                                        {soldQty} sold
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-[#857275]">
                                      <span className={`font-semibold ${p.stock <= 2 ? "text-rose-600" : "text-emerald-700"}`}>
                                        {p.stock <= 0 ? "Out of Stock" : p.stock <= 2 ? "Low Stock (≤2)" : "Healthy"}
                                      </span>
                                      <span className="font-mono text-[#7c5641] font-bold">
                                        {sellThroughPct}% sold
                                      </span>
                                    </div>
                                    <div className="w-full bg-[#f3ecec] h-1.5 rounded-full overflow-hidden flex">
                                      <div
                                        className="bg-[#5a1e2d] h-full transition-all"
                                        style={{ width: `${sellThroughPct}%` }}
                                        title={`${soldQty} units sold`}
                                      />
                                      <div
                                        className={`h-full transition-all ${p.stock <= 2 ? "bg-rose-500" : "bg-[#735c00]"}`}
                                        style={{ width: `${100 - sellThroughPct}%` }}
                                        title={`${p.stock} units in stock`}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setSelectedProductForBarcode(p);
                                        setBarcodeStickerCount(4);
                                      }}
                                      className="p-1.5 rounded-lg bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#5a1e2d] border border-[#ede7e6] transition"
                                      title="Print Barcode Tag"
                                    >
                                      <Tag className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setNewProductForm({ ...p });
                                        setShowNewProductModal(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#534345] border border-[#ede7e6] transition"
                                      title="Edit Product"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}


          {/* =========================================================
              SUB-VIEW: BESTSELLER & VELOCITY STUDIO
              ========================================================= */}
          {inventorySubTab === "bestsellers" && (
            <>
              {/* 4 Velocity Hero KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-rose-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-rose-500 uppercase tracking-wider">Sold Out Bestsellers</span>
                    <p className="text-2xl font-black text-rose-700 font-mono mt-0.5">{soldOutBestsellerCount}</p>
                    <span className="text-[10px] text-rose-600 font-semibold">0 stock — urgent restock</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-amber-600 uppercase tracking-wider">High Velocity Winners</span>
                    <p className="text-2xl font-black text-amber-800 font-mono mt-0.5">{highVelocityCount}</p>
                    <span className="text-[10px] text-amber-700 font-semibold">&gt; 0.5 pcs/day or 5+ sold</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Flame className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-orange-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-orange-500 uppercase tracking-wider">Critical Stock</span>
                    <p className="text-2xl font-black text-orange-700 font-mono mt-0.5">{criticalStockCount}</p>
                    <span className="text-[10px] text-orange-600 font-semibold">1 to 3 pieces remaining</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider">Top Movers Revenue</span>
                    <p className="text-2xl font-black text-emerald-700 font-mono mt-0.5">₹{topMoversTotalRevenue.toLocaleString("en-IN")}</p>
                    <span className="text-[10px] text-stone-500 font-semibold">From completed bill history</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Filter Chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setVelocityFilter("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        velocityFilter === "all"
                          ? "bg-stone-900 text-white shadow-xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      All Products ({productVelocityAnalytics.length})
                    </button>
                    <button
                      onClick={() => setVelocityFilter("out_of_stock")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        velocityFilter === "out_of_stock"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Sold Out / Stock 0 ({soldOutBestsellerCount})</span>
                    </button>
                    <button
                      onClick={() => setVelocityFilter("critical")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        velocityFilter === "critical"
                          ? "bg-orange-600 text-white shadow-xs"
                          : "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Critical &lt; 3 pcs ({criticalStockCount})</span>
                    </button>
                    <button
                      onClick={() => setVelocityFilter("fast_movers")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        velocityFilter === "fast_movers"
                          ? "bg-amber-500 text-stone-950 shadow-xs"
                          : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Fast Movers ({highVelocityCount})</span>
                    </button>
                  </div>

                  {/* Sort Selector */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-stone-400" />
                    <span className="text-xs font-bold text-stone-500">Sort by:</span>
                    <select
                      value={velocitySort}
                      onChange={e => setVelocitySort(e.target.value as any)}
                      aria-label="Sort bestsellers by"
                      className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      <option value="sold_desc">Units Sold (High to Low)</option>
                      <option value="revenue_desc">Revenue Generated (High to Low)</option>
                      <option value="speed_asc">Velocity Speed (Fastest First)</option>
                      <option value="stock_asc">Current Stock (Lowest First)</option>
                    </select>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={velocitySearch}
                    onChange={e => setVelocitySearch(e.target.value)}
                    placeholder="Search fast movers by name, SKU, category, or barcode..."
                    className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
                  />
                  {velocitySearch && (
                    <button
                      onClick={() => setVelocitySearch("")}
                      className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Bestseller Velocity Table */}
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
                      Sales Velocity &amp; Stockout Analysis ({filteredVelocityProducts.length} items)
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-semibold">
                    Calculated from real POS bill transactions
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-stone-100/75 border-b border-stone-200 text-stone-600 uppercase text-[10px] font-black tracking-wider">
                        <th className="px-4 py-3">Product / SKU</th>
                        <th className="px-4 py-3">Stock Status</th>
                        <th className="px-4 py-3">Units Sold &amp; Velocity</th>
                        <th className="px-4 py-3">Sell-Out Speed / Pace</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredVelocityProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-stone-400">
                            <Flame className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                            <p className="font-bold text-sm text-stone-600">No matching products found</p>
                            <p className="text-xs text-stone-400 mt-1">Try clearing your search or switching the filter.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredVelocityProducts.map(v => {
                          const p = v.product;
                          const stock = Number(p.stock) || 0;
                          return (
                            <tr key={p.id} className="hover:bg-amber-50/30 transition">
                              {/* Product / SKU */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-start gap-2.5">
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono font-black text-stone-950 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                        {p.sku}
                                      </span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-50 border border-stone-200 text-stone-700 capitalize">
                                        {p.category}
                                      </span>
                                    </div>
                                    <p className="font-extrabold text-stone-900 text-xs mt-1">{p.name}</p>
                                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">Barcode: {p.barcode}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Stock Status */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {v.isOutOfStock ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                    <AlertTriangle className="w-3 h-3 text-rose-700" />
                                    <span>OUT OF STOCK (0)</span>
                                  </span>
                                ) : v.isCritical ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                    <Zap className="w-3 h-3 text-amber-700" />
                                    <span>CRITICAL ({stock} left)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <span>In Stock ({stock} pcs)</span>
                                  </span>
                                )}
                              </td>

                              {/* Units Sold & Velocity */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-mono font-black text-stone-950 text-sm">
                                    {v.totalQtySold} sold
                                  </span>
                                  {v.totalQtySold > 0 ? (
                                    <span className="text-[10.5px] font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                                      <Flame className="w-3 h-3 text-amber-600" />
                                      <span>{v.unitsPerDay} pcs / day</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-stone-400">0 bill transactions</span>
                                  )}
                                </div>
                              </td>

                              {/* Sell-Out Speed / Pace */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {v.isOutOfStock && v.totalQtySold > 0 ? (
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 inline-block w-fit">
                                      ⚡ {v.selloutSpeedText}
                                    </span>
                                    <span className="text-[10px] text-rose-600 font-semibold mt-0.5">Urgent restock needed!</span>
                                  </div>
                                ) : v.totalQtySold > 0 ? (
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-extrabold ${v.isCritical ? "text-amber-800" : "text-stone-700"}`}>
                                      {v.selloutSpeedText}
                                    </span>
                                    <span className="text-[10px] text-stone-400">Over {v.daysSpan} days period</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-stone-400 italic">No sales recorded yet</span>
                                )}
                              </td>

                              {/* Revenue */}
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <p className="font-mono font-black text-stone-900 text-sm">
                                  ₹{v.totalRevenue.toLocaleString("en-IN")}
                                </p>
                                <p className="text-[10px] text-stone-400">₹{p.price.toLocaleString("en-IN")} / pc</p>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenQuickRestock(p)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="Instantly add restock pieces"
                                  >
                                    <Plus className="w-3 h-3 text-stone-950" />
                                    <span>+ Restock</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedProductForBarcode(p);
                                      setBarcodeStickerCount(4);
                                    }}
                                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 font-bold rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1"
                                    title="Print Thermal Barcode Stickers"
                                  >
                                    <Tag className="w-3 h-3 text-stone-600" />
                                    <span>Tags</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =========================================================
              SUB-VIEW: DUPLICATE FINDER & CLEANER STUDIO
              ========================================================= */}
          
          {inventorySubTab === "suppliers" && (
            <SupplierIntelligence products={products} bills={completedBills} />
          )}
{inventorySubTab === "duplicates" && (
            <>
              {/* Duplicate Finder Header & Action Bar */}
              <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Copy className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-base font-black text-stone-900">
                        Duplicate Product Resolution Studio
                      </h3>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Found <strong className="text-stone-900">{duplicateGroups.length} duplicate clusters</strong> ({duplicateGroups.reduce((s, g) => s + g.items.length, 0)} total duplicate variations). Review side-by-side to merge stock or delete redundant clones.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={handleAutoCleanZeroStockDuplicates}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 cursor-pointer transition"
                      title="Instantly delete redundant clones that have 0 stock"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Auto-Clean 0-Stock Clones</span>
                    </button>
                  </div>
                </div>

                {/* Search Duplicate Groups */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={duplicateSearch}
                    onChange={e => setDuplicateSearch(e.target.value)}
                    placeholder="Filter duplicate groups by product title, SKU, or barcode..."
                    className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition"
                  />
                  {duplicateSearch && (
                    <button
                      onClick={() => setDuplicateSearch("")}
                      className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Duplicate Clusters List */}
              {filteredDuplicateGroups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                  <PackageCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-base font-black text-stone-900">No Duplicate Products Found!</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                    Your inventory catalog is clean with no duplicate names or barcodes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDuplicateGroups.map((group, gIdx) => {
                    const primary = group.items[0];
                    return (
                      <div
                        key={`${group.key}-${gIdx}`}
                        className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-indigo-300 transition"
                      >
                        {/* Group Title Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-stone-100 gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <h4 className="font-extrabold text-stone-900 text-sm">
                              {group.displayName || "Item Group"}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-100 text-stone-700 border border-stone-200">
                              {group.items.length} records
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 font-mono">
                            Total Cluster Stock: {group.items.reduce((s, it) => s + (Number(it.stock) || 0), 0)} pcs
                          </span>
                        </div>

                        {/* Side-by-Side Comparison Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3.5">
                          {group.items.map((it, idx) => {
                            const isPrimary = idx === 0;
                            const stock = Number(it.stock) || 0;
                            const price = Number(it.price || 0);
                            return (
                              <div
                                key={`${it.id || idx}-${idx}`}
                                className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                                  isPrimary
                                    ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/20"
                                    : "bg-stone-50/70 border-stone-200"
                                }`}
                              >
                                <div>
                                  {/* Top Badge */}
                                  <div className="flex items-center justify-between mb-2">
                                    {isPrimary ? (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white">
                                        Primary Item (Keep)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-200 text-stone-700">
                                        Duplicate Variation #{idx}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-mono text-stone-500 font-bold uppercase">
                                      {it.category || "General"}
                                    </span>
                                  </div>

                                  {/* Product Info */}
                                  <p className="font-bold text-stone-900 text-xs line-clamp-1">{it.name || "Unnamed"}</p>
                                  
                                  <div className="mt-2 space-y-1 text-xs">
                                    <div className="flex items-center justify-between font-mono text-[11px]">
                                      <span className="text-stone-400">SKU:</span>
                                      <span className="font-black text-stone-900 bg-white px-1.5 py-0.2 rounded border border-stone-200">
                                        {it.sku || "NO-SKU"}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-stone-400">Current Stock:</span>
                                      <span className={`font-black ${stock === 0 ? "text-rose-600 font-extrabold" : "text-stone-900"}`}>
                                        {stock} pcs
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-stone-400">Selling Price:</span>
                                      <span className="font-bold text-stone-900">
                                        ₹{price.toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between font-mono text-[10px] text-stone-400">
                                      <span>Barcode:</span>
                                      <span>{it.barcode || "NO-BARCODE"}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-3.5 pt-3 border-t border-stone-200/70 flex items-center gap-2">
                                  {isPrimary ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewProductForm({ ...it });
                                        setShowNewProductModal(true);
                                      }}
                                      className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-200 font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      <Edit3 className="w-3 h-3 text-amber-400" />
                                      <span>Edit Primary</span>
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleMergeDuplicate(primary, it)}
                                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                                        title="Merge stock into Primary and remove this duplicate"
                                      >
                                        <Split className="w-3 h-3" />
                                        <span>Merge Stock</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDuplicateItem(it.id, it.name, it.sku)}
                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs transition cursor-pointer flex items-center justify-center"
                                        title="Permanently delete this duplicate"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: ALTERATION & FITTING DESK
            ========================================================= */}
        {activeTab === "alterations" && (
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#fef8f7]">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Atelier Alterations Header */}
              <div className="bg-white p-6 rounded-2xl border border-[#ede7e6] shadow-[0_2px_12px_rgba(90,30,45,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#7c5641]">
                      Bespoke Bridal &amp; Garment Fitting Desk
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffe088]/40 text-[#735c00] border border-[#d4af37]/30">
                      Floor Terminal #01
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-[#3f0819] tracking-tight">
                    Alteration &amp; Fitting Work Orders
                  </h2>
                  <p className="text-xs text-[#534345] mt-1">
                    Track customer bespoke measurements, assigned master tailors, trial dates, and 1-click WhatsApp trial alerts.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#f8f2f2] border border-[#ede7e6]">
                    <div className="w-8 h-8 rounded-lg bg-[#5a1e2d] text-white flex items-center justify-center">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#7c5641] block">Pending Trials</span>
                      <span className="text-base font-bold text-[#3f0819] font-mono">
                        {alterationsList.filter(a => a.status !== "Delivered").length} Garments
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {alterationsList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#ede7e6] p-12 text-center text-[#534345] shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#ffd9de]/30 text-[#5a1e2d] flex items-center justify-center mx-auto mb-3">
                    <Scissors className="w-7 h-7" />
                  </div>
                  <p className="text-base font-serif font-bold text-[#1d1b1b]">No Active Alteration Work Orders</p>
                  <p className="text-xs text-[#534345] mt-1 max-w-md mx-auto">
                    When billing bridal lehengas, sarees, or suits on the POS tab, check &ldquo;Alteration / Fitting Required&rdquo; to assign master tailors and record trial dates.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alterationsList.map((alt, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-[#ede7e6] p-5 shadow-[0_2px_12px_rgba(90,30,45,0.04)] space-y-3 hover:border-[#c99a82] transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#1d1b1b] flex items-center gap-2 font-serif">
                          <Scissors className="w-4 h-4 text-[#5a1e2d]" />
                          {alt.garmentName}
                        </span>
                        <select
                          value={alt.status}
                          onChange={e => {
                            const next = [...alterationsList];
                            next[idx].status = e.target.value as any;
                            saveAlterationsLocally(next);
                          }}
                          className={`text-[10.5px] font-bold px-3 py-1 rounded-full border cursor-pointer focus:outline-none ${
                            alt.status === "Ready for Trial"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : alt.status === "Delivered"
                              ? "bg-[#f3ecec] text-[#534345] border-[#ede7e6]"
                              : "bg-[#ffe088]/40 text-[#735c00] border-[#d4af37]/40"
                          }`}
                        >
                          <option value="Received">Received in Atelier</option>
                          <option value="In Alteration">In Alteration (With Tailor)</option>
                          <option value="Ready for Trial">Ready for Trial</option>
                          <option value="Delivered">Delivered &amp; Handed Over</option>
                        </select>
                      </div>

                      <div className="bg-[#f8f2f2] p-3.5 rounded-xl border border-[#ede7e6] text-xs space-y-1.5">
                        <p className="font-semibold text-[#1d1b1b]">
                          Fitting Notes: <span className="font-normal text-[#534345]">{alt.fittingNotes || "Standard fit adjustments"}</span>
                        </p>
                        <p className="font-semibold text-[#1d1b1b]">
                          Master Tailor: <span className="font-medium text-[#7c5641]">{alt.tailorName || TAILOR_NAMES[0]}</span>
                        </p>
                        <p className="font-semibold text-[#1d1b1b]">
                          Trial / Delivery Date: <span className="font-bold text-[#5a1e2d] font-mono">{alt.readyDate}</span>
                        </p>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleSendAlterationReadyWhatsApp(alt, "9897000000", "Customer")}
                          className="px-3.5 py-2 bg-[#5a1e2d] hover:bg-[#3f0819] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Send WhatsApp &ldquo;Ready for Trial&rdquo; Alert</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: DAILY SALES AUDIT & REGISTER SETTLEMENT SUITE
            ========================================================= */}
        {activeTab === "reports" && (
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#fef8f7]">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Page Header & Global Shift Context */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label-sm text-[11px] uppercase tracking-wider text-[#7c5641] font-bold">
                      Financial Control &amp; Balances • Store Terminal: Register #01
                    </span>
                  </div>
                  <h1 className="text-3xl font-serif text-[#3f0819] font-bold tracking-tight">
                    Daily Sales Audit &amp; Register Settlement
                  </h1>
                  <div className="flex flex-wrap items-center gap-2.5 mt-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3ecec] border border-[#ede7e6] text-[#534345] text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#5a1e2d]" />
                      <span className="font-semibold text-[#1d1b1b]">{reportDateFilterLabel}</span>
                      <span className="text-[#857275]">• Shift #1: 10:00 AM - 09:30 PM</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdc9af]/30 border border-[#c99a82]/40 text-[#7c5641] text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Register Live • Day Open</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleExportReportCSV}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#ede7e6] bg-white hover:bg-[#f8f2f2] text-[#1d1b1b] text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Export Sales Data with Wholesale Cost & Net Profit to Excel/CSV"
                  >
                    <Download className="w-4 h-4 text-[#7c5641]" />
                    <span>Export Tally / Excel ERP</span>
                  </button>

                  <button
                    onClick={() => setShowZReportModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#ede7e6] bg-white hover:bg-[#f8f2f2] text-[#1d1b1b] text-xs font-bold transition shadow-xs cursor-pointer"
                    title="View & Print End-of-Day Z-Report Slip"
                  >
                    <Receipt className="w-4 h-4 text-[#5a1e2d]" />
                    <span>Z-Report Slip</span>
                  </button>

                  <button
                    onClick={handleForceSyncBills}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5a1e2d] hover:bg-[#3f0819] text-white text-xs font-bold transition shadow-md shadow-[#5a1e2d]/20 cursor-pointer disabled:opacity-50"
                    title="Upload local bills to Supabase Cloud & perform register settlement"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#ffd9de]" />
                    <span>{isSyncing ? "Syncing..." : "Day-End Register Close & Handover"}</span>
                  </button>
                </div>
              </div>

              {/* 5 High-Level Metric Bento Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Total Net Revenue */}
                <div className="rounded-xl bg-white p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(90,30,45,0.04)] border border-[#ede7e6] relative overflow-hidden">
                  <div className="flex items-center justify-between text-[#534345]">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold text-[#7c5641]">
                      Total Net Revenue
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-[#f8f2f2] text-[#5a1e2d] flex items-center justify-center font-bold">
                      ₹
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl lg:text-3xl text-[#5a1e2d] tracking-tight font-bold font-mono">
                      ₹{reportAnalytics.totalRev.toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[#534345] text-xs">
                      <span className="text-[#735c00] font-bold flex items-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" /> {reportAnalytics.billCount} Bills
                      </span>
                      <span>• Avg ₹{reportAnalytics.avgBillValue.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-[#fdc9af]/20 pointer-events-none"></div>
                </div>

                {/* 2. Wholesale COGS Rate */}
                <div className="rounded-xl bg-white p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(90,30,45,0.04)] border border-[#ede7e6] relative overflow-hidden">
                  <div className="flex items-center justify-between text-[#534345]">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold text-[#7c5641]">
                      Wholesale COGS Rate
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-[#f8f2f2] text-[#7c5641] flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl lg:text-3xl text-[#1d1b1b] tracking-tight font-bold font-mono">
                      ₹{reportAnalytics.totalCost.toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[#534345] text-xs">
                      <span className="font-semibold text-[#1d1b1b]">Artisan Master Tariffs</span>
                      <span>• Live Karigar Sync</span>
                    </div>
                  </div>
                </div>

                {/* 3. Net Gross Profit (HERO #5a1e2d) */}
                <div className="rounded-xl bg-[#5a1e2d] text-white p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] uppercase tracking-wider text-[#ffd9de] font-bold">
                      Net Gross Profit
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#cba72f] text-[#241a00] text-xs font-bold flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3 h-3" /> {reportAnalytics.profitMarginPct}% Margin
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl lg:text-3xl tracking-tight font-bold text-white font-mono">
                      ₹{reportAnalytics.totalProfit.toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[#ffd9de] text-xs">
                      <span>Gross Profit on {reportAnalytics.billCount} bills</span>
                      {reportAnalytics.totalDiscounts > 0 && (
                        <span className="text-[#ffe088] font-bold">
                          (₹{reportAnalytics.totalDiscounts.toLocaleString("en-IN")} discounts)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none"></div>
                </div>

                {/* 4. Physical Cash Drawer */}
                <div className="rounded-xl bg-white p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(90,30,45,0.04)] border border-[#ede7e6] relative overflow-hidden">
                  <div className="flex items-center justify-between text-[#534345]">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold text-[#7c5641]">
                      Physical Cash Drawer
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-[#f8f2f2] text-[#735c00] flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl lg:text-3xl text-[#5a1e2d] tracking-tight font-bold font-mono">
                      ₹{reportAnalytics.totalCash.toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                      <span className="px-2 py-0.5 rounded bg-[#f3ecec] text-[#5a1e2d] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ₹0 Variance
                      </span>
                      <span className="text-[#534345]">Strict match</span>
                    </div>
                  </div>
                </div>

                {/* 5. UPI & Card Collections */}
                <div className="rounded-xl bg-white p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(90,30,45,0.04)] border border-[#ede7e6] relative overflow-hidden">
                  <div className="flex items-center justify-between text-[#534345]">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold text-[#7c5641]">
                      UPI &amp; Card Machine
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-[#f8f2f2] text-[#7c5641] flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl lg:text-3xl text-[#1d1b1b] tracking-tight font-bold font-mono">
                      ₹{(reportAnalytics.totalUpi + reportAnalytics.totalCard).toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[#534345] text-xs font-mono">
                      <span>UPI: ₹{reportAnalytics.totalUpi.toLocaleString("en-IN")}</span>
                      <span>• Card: ₹{reportAnalytics.totalCard.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shift Metrics Mini Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-[#ede7e6] shadow-[0_2px_8px_rgba(90,30,45,0.03)] text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[#7c5641] font-bold uppercase text-[10px] tracking-wider">
                    Shift Metrics:
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f8f2f2] text-[#1d1b1b] font-medium border border-[#ede7e6]">
                    <Scissors className="w-3.5 h-3.5 text-[#5a1e2d]" />
                    <span>Alteration Advance:</span>
                    <span className="font-bold font-mono">
                      ₹{(alterationsList.filter(a => a.status !== 'Delivered').length * 500).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[#857275]">({alterationsList.length} Slips)</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f8f2f2] text-[#1d1b1b] font-medium border border-[#ede7e6]">
                    <Sparkles className="w-3.5 h-3.5 text-[#cba72f]" />
                    <span>Approved Bargains:</span>
                    <span className="font-bold text-[#5a1e2d] font-mono">
                      ₹{reportAnalytics.totalDiscounts.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[#857275]">({reportAnalytics.totalItemsSold} Items)</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f8f2f2] text-[#1d1b1b] font-medium border border-[#ede7e6]">
                    <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                    <span>Exchanges Settled:</span>
                    <span className="font-bold font-mono">{exchangesList.length}</span>
                    <span className="text-[#857275]">(Clean Audit)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadBackup}
                    className="text-[11px] font-bold text-[#7c5641] hover:text-[#5a1e2d] flex items-center gap-1 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Raw JSON Backup</span>
                  </button>
                </div>
              </div>

              {/* Date Presets Filter Bar & Search Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-[#ede7e6] shadow-[0_2px_8px_rgba(90,30,45,0.03)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c5641] mr-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#5a1e2d]" /> Tareekh Filter:
                    </span>
                    {[
                      { id: "today", label: "Aaj (Today)" },
                      { id: "yesterday", label: "Kal (Yesterday)" },
                      { id: "day_before", label: "Parso (2 Days Ago)" },
                      { id: "this_month", label: "Iss Mahine (Month)" },
                      { id: "this_year", label: "Iss Saal (Year)" },
                      { id: "all", label: "All Time (Saare Bill)" },
                      { id: "custom", label: "Custom Tareekh" },
                    ].map(tab => {
                      const isActive = reportDateFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setReportDateFilter(tab.id as any);
                            setReportPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? "bg-[#5a1e2d] text-white shadow-xs"
                              : "bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#534345]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {reportDateFilter === "custom" && (
                    <div className="flex items-center gap-2 bg-[#f8f2f2] border border-[#ede7e6] px-3 py-1.5 rounded-xl">
                      <span className="text-xs font-bold text-[#5a1e2d]">Select Date:</span>
                      <input
                        type="date"
                        value={reportCustomDate}
                        onChange={e => {
                          setReportCustomDate(e.target.value);
                          setReportPage(1);
                        }}
                        className="bg-white border border-[#ede7e6] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1d1b1b] focus:outline-none focus:ring-1 focus:ring-[#5a1e2d] cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Search & Mode Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#ede7e6]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#857275] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search bill no (e.g. RJN-2026-0155), client name, mobile, or SKU..."
                      value={reportSearch}
                      onChange={e => {
                        setReportSearch(e.target.value);
                        setReportPage(1);
                      }}
                      className="w-full pl-10 pr-8 py-2.5 bg-[#f8f2f2] border border-[#ede7e6] rounded-xl text-xs font-semibold text-[#1d1b1b] placeholder:text-[#857275] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5a1e2d]/30"
                    />
                    {reportSearch && (
                      <button
                        onClick={() => {
                          setReportSearch("");
                          setReportPage(1);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#857275] hover:text-[#1d1b1b] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={reportPaymentFilter}
                      onChange={e => {
                        setReportPaymentFilter(e.target.value);
                        setReportPage(1);
                      }}
                      className="px-3 py-2.5 bg-[#f8f2f2] border border-[#ede7e6] rounded-xl text-xs font-bold text-[#1d1b1b] focus:outline-none focus:ring-2 focus:ring-[#5a1e2d]/30 cursor-pointer"
                    >
                      <option value="all">All Modes (Sabhi)</option>
                      <option value="cash">Cash Counter</option>
                      <option value="upi">Instant UPI QR</option>
                      <option value="card">HDFC / PineLabs Card</option>
                      <option value="khata">VIP Khata</option>
                    </select>

                    <select
                      value={reportSortBy}
                      onChange={e => {
                        setReportSortBy(e.target.value as any);
                        setReportPage(1);
                      }}
                      className="px-3 py-2.5 bg-[#f8f2f2] border border-[#ede7e6] rounded-xl text-xs font-bold text-[#1d1b1b] focus:outline-none focus:ring-2 focus:ring-[#5a1e2d]/30 cursor-pointer"
                    >
                      <option value="date_desc">Newest First</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="amount_desc">Highest Amount</option>
                      <option value="amount_asc">Lowest Amount</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Settled Transactions Audit Ledger */}
              <div className="w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(90,30,45,0.04)] border border-[#ede7e6] overflow-hidden flex flex-col">
                <div className="px-5 py-3.5 bg-[#f8f2f2] border-b border-[#ede7e6] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-serif text-base font-bold text-[#3f0819]">
                      Settled Transactions Audit Ledger
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[#534345] border border-[#ede7e6] text-[11px] font-bold">
                      {filteredReportBills.length} Records Complete
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#534345]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Instant Cloud Settled
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#cba72f]"></span> Tailoring Pending
                    </span>
                  </div>
                </div>

                {filteredReportBills.length === 0 ? (
                  <div className="p-12 text-center text-[#534345]">
                    <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30 text-[#5a1e2d]" />
                    <p className="text-sm font-bold text-[#1d1b1b] font-serif">No Bills Found for This Period</p>
                    <p className="text-xs text-[#534345] mt-1">Try switching to &ldquo;All Time&rdquo; or clearing the search query.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f8f2f2] text-[#7c5641] font-bold uppercase text-[10px] tracking-wider border-b border-[#ede7e6]">
                          <th className="py-3 px-4">Bill No. &amp; Time</th>
                          <th className="py-3 px-4">Customer Dossier</th>
                          <th className="py-3 px-4">Couture Ensembles</th>
                          <th className="py-3 px-4">Subtotal &amp; Negotiated Disc.</th>
                          <th className="py-3 px-4">Payment Tender</th>
                          <th className="py-3 px-4 text-right">Net Margin Yield</th>
                          <th className="py-3 px-4 text-center">Fulfillment</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ede7e6]">
                        {paginatedReportBills.map(b => {
                          const billCost = getBillPurchaseCost(b);
                          const billProfit = b.grandTotal - billCost;
                          const billMargin = b.grandTotal > 0 ? Math.round((billProfit / b.grandTotal) * 100) : 0;
                          const isExpanded = reportExpandedBillId === b.id;
                          const hasAlteration = !!b.alteration;
                          const isVIP = (b.grandTotal >= 5000) || (b.customer.phone && b.customer.phone.length > 0);

                          return (
                            <React.Fragment key={b.id}>
                              <tr className="hover:bg-[#fef8f7] transition-colors">
                                <td className="py-3 px-4 align-top">
                                  <div className="font-bold text-sm text-[#5a1e2d] font-mono">
                                    {b.billNo}
                                  </div>
                                  <div className="text-[#857275] text-[10.5px] mt-0.5 flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3" />
                                    <span>{b.createdAt}</span>
                                  </div>
                                </td>

                                <td className="py-3 px-4 align-top">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[#1d1b1b] text-xs">
                                      {b.customer.name || "Walk-in Guest"}
                                    </span>
                                    {isVIP && (
                                      <span className="px-1.5 py-0.2 rounded-full bg-[#ffe088]/40 text-[#735c00] text-[9.5px] font-bold border border-[#d4af37]/30">
                                        ★ VIP
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[#534345] text-[10.5px] mt-0.5 font-mono">
                                    {b.customer.phone ? `+91 ${b.customer.phone}` : "Haridwar Walk-in"}
                                  </div>
                                </td>

                                <td className="py-3 px-4 align-top max-w-xs">
                                  <button
                                    onClick={() => setReportExpandedBillId(isExpanded ? null : b.id)}
                                    className="text-left hover:underline cursor-pointer group"
                                  >
                                    <span className="font-bold text-[#1d1b1b] text-xs block">
                                      {b.items.reduce((s, it) => s + it.quantity, 0)} Items:{" "}
                                      {b.items.map(it => it.product.name).slice(0, 2).join(", ")}
                                      {b.items.length > 2 ? ` + ${b.items.length - 2} more` : ""}
                                    </span>
                                    <span className="text-[10px] text-[#7c5641] font-semibold mt-0.5 inline-block">
                                      {b.items[0]?.product.category || "Couture Garments"}
                                    </span>
                                  </button>
                                </td>

                                <td className="py-3 px-4 align-top">
                                  <div className="font-bold text-[#1d1b1b] text-sm font-mono">
                                    ₹{b.grandTotal.toLocaleString("en-IN")}
                                  </div>
                                  {(b.totalSavings || b.discount) > 0 ? (
                                    <div className="text-[10px] text-rose-700 font-semibold font-mono">
                                      Saved: -₹{(b.totalSavings || b.discount).toLocaleString("en-IN")}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-[#857275]">Standard Rate</div>
                                  )}
                                </td>

                                <td className="py-3 px-4 align-top">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                                    b.paymentMode === "cash"
                                      ? "bg-[#fdc9af]/30 text-[#7c5641] border-[#c99a82]/40"
                                      : b.paymentMode === "upi"
                                      ? "bg-[#ffd9de]/40 text-[#5a1e2d] border-[#ffd9de]"
                                      : "bg-[#ffe088]/30 text-[#735c00] border-[#d4af37]/30"
                                  }`}>
                                    {b.paymentMode === "cash" && <Banknote className="w-3 h-3" />}
                                    {b.paymentMode === "upi" && <QrCode className="w-3 h-3" />}
                                    {b.paymentMode === "card" && <CreditCard className="w-3 h-3" />}
                                    <span>{b.paymentMode}</span>
                                  </span>
                                </td>

                                <td className="py-3 px-4 align-top text-right font-mono">
                                  <span className={`font-bold text-xs block ${billProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                    +₹{billProfit.toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-[10px] text-[#534345] font-semibold">
                                    {billMargin}% Yield
                                  </span>
                                </td>

                                <td className="py-3 px-4 align-top text-center">
                                  {hasAlteration ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#ffe088]/40 text-[#735c00] border border-[#d4af37]/30">
                                      <Scissors className="w-2.5 h-2.5" /> Tailoring
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Settled
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 align-top text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setExchangePreselectedBill(b);
                                        setShowExchangeModal(true);
                                      }}
                                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-bold text-[10.5px] transition cursor-pointer"
                                      title="Process 5-Day Product Replacement"
                                    >
                                      Exchange
                                    </button>
                                    <button
                                      onClick={() => handleStartEditBill(b)}
                                      className="px-2 py-1 bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#1d1b1b] border border-[#ede7e6] rounded-lg font-bold text-[10.5px] transition cursor-pointer"
                                      title="Edit Bill (Bargain, add more items)"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => window.open(`/invoice?id=${b.billNo}`, "_blank")}
                                      className="p-1 text-[#5a1e2d] hover:bg-[#ffd9de]/30 rounded-lg transition cursor-pointer"
                                      title="View / Download PDF Invoice"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Bill Item Breakdown */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={8} className="p-4 bg-[#f8f2f2] border-y border-[#ede7e6]">
                                    <div className="space-y-2 max-w-4xl">
                                      <div className="flex items-center justify-between text-xs font-bold text-[#5a1e2d]">
                                        <span>Ensemble Items Breakdown ({b.items.length} SKUs)</span>
                                        <span>Total Landed Cost: ₹{billCost.toLocaleString("en-IN")}</span>
                                      </div>
                                      <div className="bg-white rounded-xl p-3 border border-[#ede7e6] space-y-2">
                                        {b.items.map((it, idx) => {
                                          const itQty = it.quantity || 1;
                                          const itRev = (it.price || 0) * itQty;
                                          let itCost = it.product?.purchaseCost || (it.product as any)?.costPrice || 0;
                                          const totalItemCost = itCost * itQty;
                                          const itProfit = itRev - totalItemCost;
                                          return (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                              <span className="text-[#1d1b1b] font-medium">
                                                {itQty}x {it.product.name} ({it.selectedSize || "Standard"}) • SKU: {it.product.sku}
                                              </span>
                                              <div className="flex items-center gap-3 font-mono text-[11px]">
                                                <span className="text-[#534345]">Cost: ₹{totalItemCost.toLocaleString("en-IN")}</span>
                                                <span className="text-emerald-700 font-bold">Profit: ₹{itProfit.toLocaleString("en-IN")}</span>
                                                <span className="font-bold text-[#1d1b1b]">₹{itRev.toLocaleString("en-IN")}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Multipage Pagination Controls */}
                {filteredReportBills.length > 0 && (
                  <div className="p-4 border-t border-[#ede7e6] bg-[#f8f2f2] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-[#534345] font-medium">
                      Showing <span className="font-bold text-[#1d1b1b]">{reportPageSize >= 9999 ? 1 : Math.min((reportPage - 1) * reportPageSize + 1, filteredReportBills.length)}</span> to <span className="font-bold text-[#1d1b1b]">{reportPageSize >= 9999 ? filteredReportBills.length : Math.min(reportPage * reportPageSize, filteredReportBills.length)}</span> of <span className="font-bold text-[#1d1b1b]">{filteredReportBills.length}</span> bills • <span className="text-[#857275]">Page {reportPage} of {totalReportPages}</span>
                    </div>

                    {totalReportPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setReportPage(1)}
                          disabled={reportPage === 1}
                          className="px-2.5 py-1.5 rounded-lg border border-[#ede7e6] bg-white text-[#1d1b1b] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f8f2f2] transition cursor-pointer"
                        >
                          « First
                        </button>
                        <button
                          onClick={() => setReportPage(p => Math.max(1, p - 1))}
                          disabled={reportPage === 1}
                          className="px-2.5 py-1.5 rounded-lg border border-[#ede7e6] bg-white text-[#1d1b1b] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f8f2f2] transition cursor-pointer"
                        >
                          ‹ Prev
                        </button>
                        {Array.from({ length: totalReportPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalReportPages || Math.abs(p - reportPage) <= 2)
                          .reduce<(number | string)[]>((acc, curr, idx, arr) => {
                            if (idx > 0 && (curr as number) - (arr[idx - 1] as number) > 1) {
                              acc.push("...");
                            }
                            acc.push(curr);
                            return acc;
                          }, [])
                          .map((p, idx) => {
                            if (p === "...") {
                              return <span key={`ellipsis-${idx}`} className="px-1 text-[#857275] font-bold text-xs">...</span>;
                            }
                            const isCurrent = p === reportPage;
                            return (
                              <button
                                key={p}
                                onClick={() => setReportPage(Number(p))}
                                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  isCurrent
                                    ? "bg-[#5a1e2d] text-white shadow-xs"
                                    : "bg-white hover:bg-[#f8f2f2] text-[#1d1b1b] border border-[#ede7e6]"
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}
                        <button
                          onClick={() => setReportPage(p => Math.min(totalReportPages, p + 1))}
                          disabled={reportPage === totalReportPages}
                          className="px-2.5 py-1.5 rounded-lg border border-[#ede7e6] bg-white text-[#1d1b1b] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f8f2f2] transition cursor-pointer"
                        >
                          Next ›
                        </button>
                        <button
                          onClick={() => setReportPage(totalReportPages)}
                          disabled={reportPage === totalReportPages}
                          className="px-2.5 py-1.5 rounded-lg border border-[#ede7e6] bg-white text-[#1d1b1b] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f8f2f2] transition cursor-pointer"
                        >
                          Last »
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Exchanges & Product Replacement Register */}
              <div className="bg-white rounded-xl border border-[#ede7e6] shadow-[0_2px_8px_rgba(90,30,45,0.03)] overflow-hidden space-y-4 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ede7e6] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                        5-Day Exchange Policy Register
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 font-mono">
                        {exchangesList.length} Vouchers
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1d1b1b] font-serif">Customer Product Exchange &amp; Return Register</h3>
                    <p className="text-xs text-[#534345] mt-0.5">
                      Audited log of 5-day customer garment replacements, returned restocked pieces, and difference settlements.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {exchangesList.length > 0 && (
                      <button
                        onClick={() => {
                          const csv = ExchangeService.exportCsv(exchangesList);
                          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `RAJNANDINI_EXCHANGES_${new Date().toISOString().slice(0, 10)}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3.5 py-2 bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#1d1b1b] border border-[#ede7e6] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Exchanges CSV</span>
                      </button>
                    )}
                  </div>
                </div>

                {exchangesList.length === 0 ? (
                  <div className="p-8 text-center text-[#534345]">
                    <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-700" />
                    <p className="text-sm font-bold text-[#1d1b1b]">No Product Exchanges Recorded</p>
                    <p className="text-xs text-[#534345] mt-1">
                      When a customer returns a piece for replacement within 5 days, click &ldquo;Exchange&rdquo; on their invoice in the table above.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f8f2f2] text-[#7c5641] font-bold uppercase text-[10px] tracking-wider border-b border-[#ede7e6]">
                          <th className="px-4 py-2.5">Exchange ID</th>
                          <th className="px-4 py-2.5">Customer &amp; Original Bill</th>
                          <th className="px-4 py-2.5">Returned Garment</th>
                          <th className="px-4 py-2.5">Issued Replacement</th>
                          <th className="px-4 py-2.5 text-right">Settlement</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ede7e6]">
                        {exchangesList.map((exc) => {
                          const isEven = exc.settlementType === "even_exchange";
                          const isCustomerPays = exc.settlementType === "customer_paid";
                          return (
                            <tr key={exc.id} className="hover:bg-[#fef8f7] transition">
                              <td className="px-4 py-3 align-top font-mono">
                                <span className="font-bold text-purple-900 block">{exc.exchangeNo}</span>
                                <span className="text-[10px] text-[#857275]">{exc.createdAt}</span>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <span className="font-bold text-[#1d1b1b] block">{exc.customer.name}</span>
                                <span className="text-[11px] text-[#534345] font-mono block">Ph: {exc.customer.phone}</span>
                                <span className="text-[10px] text-purple-700 font-mono font-bold block mt-0.5">
                                  Bill: {exc.originalBillNo}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-top max-w-xs">
                                <div className="space-y-1">
                                  {exc.returnedItems.map((r: ExchangeItemReturn, i: number) => (
                                    <div key={i} className="text-[11px] text-[#1d1b1b] flex items-start gap-1">
                                      <span className="text-rose-600 font-bold shrink-0">↵</span>
                                      <div>
                                        <span className="font-medium text-[#1d1b1b]">{r.name}</span>
                                        <span className="text-[10px] text-[#857275] block">
                                          SKU: {r.sku} • ₹{r.originalPrice} • {r.condition === "restockable" ? "Restocked" : "Damaged"} • {r.reason}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top max-w-xs">
                                <div className="space-y-1">
                                  {exc.issuedItems.map((iss: ExchangeItemIssued, i: number) => (
                                    <div key={i} className="text-[11px] text-[#1d1b1b] flex items-start gap-1">
                                      <span className="text-emerald-600 font-bold shrink-0">→</span>
                                      <div>
                                        <span className="font-medium text-[#1d1b1b]">{iss.name}</span>
                                        <span className="text-[10px] text-[#857275] block">
                                          SKU: {iss.sku} • ₹{iss.price} {iss.selectedSize ? `• Size: ${iss.selectedSize}` : ""}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top text-right font-mono">
                                {isEven ? (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f3ecec] text-[#534345] border border-[#ede7e6]">
                                    Even (₹0)
                                  </span>
                                ) : isCustomerPays ? (
                                  <div className="text-right">
                                    <span className="text-xs font-bold text-emerald-700 block">
                                      +₹{exc.differenceAmount.toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-[9.5px] uppercase font-bold text-[#857275] block">
                                      Paid via {exc.paymentMode}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-right">
                                    <span className="text-xs font-bold text-amber-700 block">
                                      -₹{Math.abs(exc.differenceAmount).toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-[9.5px] font-bold text-amber-800 block">
                                      Store Credit Due
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 align-top text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      const slipText = ExchangeService.generateSlipText(exc);
                                      const printWin = window.open("", "_blank", "width=380,height=600");
                                      if (printWin) {
                                        printWin.document.write(`
                                          <!DOCTYPE html>
                                          <html>
                                            <head><title>Exchange ${exc.exchangeNo}</title><style>@page{size:80mm auto;margin:4mm;}body{font-family:monospace;font-size:11px;white-space:pre-wrap;margin:0;padding:6px;line-height:1.35;}</style></head>
                                            <body>${slipText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body>
                                          </html>
                                        `);
                                        printWin.document.close();
                                        printWin.focus();
                                        setTimeout(() => printWin.print(), 250);
                                      }
                                    }}
                                    className="p-1.5 text-[#534345] hover:text-[#1d1b1b] bg-[#f8f2f2] hover:bg-[#ede7e6] rounded-lg cursor-pointer transition shadow-xs"
                                    title="Print Thermal Exchange Voucher"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const phone = exc.customer.phone.replace(/[^0-9]/g, "");
                                      if (!phone || phone === "NA") {
                                        alert("Customer phone number not available.");
                                        return;
                                      }
                                      const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
                                      const msg = encodeURIComponent(ExchangeService.generateSlipText(exc));
                                      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
                                    }}
                                    className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition shadow-xs"
                                    title="Send WhatsApp Voucher to Customer"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: CUSTOMER DIRECTORY & VIP INTELLIGENCE (CRM)
            ========================================================= */}
        {activeTab === "customers" && (
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#fef8f7]">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Executive Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label-sm text-[11px] uppercase tracking-wider text-[#7c5641] font-bold">
                      Wedding Season &apos;26 Active • VIP Intelligence
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffe088]/40 text-[#735c00] border border-[#d4af37]/30">
                      Total Customer Spend: ₹{customerAnalytics.totalSpend.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <h1 className="text-3xl font-serif text-[#3f0819] font-bold tracking-tight">
                    Customer Directory &amp; Spend Profiles
                  </h1>
                  <p className="text-xs text-[#534345] mt-1 max-w-2xl">
                    High-value bridal clientele, bespoke measurement dossiers, and historical negotiation intelligence for boutique sales directors.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setShowFestiveBroadcastModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#ede7e6] bg-white hover:bg-[#f8f2f2] text-[#1d1b1b] text-xs font-bold transition shadow-xs cursor-pointer"
                    title="Send Festive Broadcast Message to VIP Clients on WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 text-[#7c5641]" />
                    <span>Festive Broadcast</span>
                  </button>

                  <button
                    onClick={handleExportCustomersCSV}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5a1e2d] hover:bg-[#3f0819] text-white text-xs font-bold transition shadow-md shadow-[#5a1e2d]/20 cursor-pointer"
                    title="Download Master Customer Directory CSV"
                  >
                    <Download className="w-4 h-4 text-[#ffd9de]" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {/* 4 VIP Analytics Bento Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Registered Clients */}
                <div className="bg-white p-5 rounded-xl border border-[#ede7e6] shadow-[0_2px_12px_rgba(90,30,45,0.04)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_20px_rgba(90,30,45,0.08)] transition-all">
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10.5px] uppercase tracking-wider text-[#7c5641] font-bold">
                      Total Registered Clients
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#f8f2f2] flex items-center justify-center text-[#5a1e2d]">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3 z-10">
                    <div className="text-3xl text-[#1d1b1b] font-bold tracking-tight font-mono">
                      {customerAnalytics.totalCustomers}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-[#735c00] font-bold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> {customerAnalytics.repeatCustomers} Repeat Visitors
                      </span>
                      <span className="text-xs text-[#857275]">• {Math.max(0, customerAnalytics.totalCustomers - customerAnalytics.repeatCustomers)} single visits</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#534345] z-10 pt-2 border-t border-[#ede7e6]">
                    <span>Ranipur &amp; Haridwar</span>
                    <span className="font-semibold text-[#5a1e2d]">Active CRM</span>
                  </div>
                </div>

                {/* Card 2: Repeat VIP Visitors */}
                <div className="bg-gradient-to-br from-white via-white to-[#ffe088]/20 p-5 rounded-xl border border-[#d4af37]/40 shadow-[0_2px_12px_rgba(115,92,0,0.06)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_24px_rgba(115,92,0,0.12)] transition-all">
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-[#d4af37]" />
                      <span className="text-[10.5px] uppercase tracking-wider text-[#735c00] font-bold">
                        Repeat VIP Visitors
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#cba72f] text-[#241a00] text-[10px] font-bold rounded">
                      TOP REVENUE
                    </span>
                  </div>
                  <div className="my-3 z-10">
                    <div className="text-3xl text-[#5a1e2d] font-bold tracking-tight font-mono">
                      {customerAnalytics.repeatCustomers} VIPs
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      <span className="text-[#534345]">Generates</span>
                      <span className="font-bold text-[#735c00]">{customerAnalytics.vipRevenuePct}% of Showroom Revenue</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#534345] z-10 pt-2 border-t border-[#ede7e6] bg-[#f8f2f2]/60 px-2 rounded-lg">
                    <span>VIP Revenue Share:</span>
                    <span className="font-bold text-[#5a1e2d] font-mono">
                      ₹{customerAnalytics.vipRevenue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Card 3: Bargain Negotiations */}
                <div className="bg-white p-5 rounded-xl border border-[#ede7e6] shadow-[0_2px_12px_rgba(90,30,45,0.04)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_20px_rgba(90,30,45,0.08)] transition-all">
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10.5px] uppercase tracking-wider text-[#7c5641] font-bold">
                      Bargain Negotiations
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#f8f2f2] flex items-center justify-center text-[#7c5641]">
                      <Handshake className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3 z-10">
                    <div className="text-3xl text-[#1d1b1b] font-bold tracking-tight font-mono">
                      ₹{customerAnalytics.totalDiscounts.toLocaleString("en-IN")}
                    </div>
                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-[#fdc9af]/30 text-[#7c5641] text-[11px] font-bold">
                      Avg {customerAnalytics.avgDiscountPct}% negotiated per VIP checkout
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#534345] z-10 pt-2 border-t border-[#ede7e6]">
                    <span>Customer Savings Given:</span>
                    <span className="text-[#735c00] font-bold">₹{customerAnalytics.totalDiscounts.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Card 4: Avg Customer LTV */}
                <div className="bg-white p-5 rounded-xl border border-[#ede7e6] shadow-[0_2px_12px_rgba(90,30,45,0.04)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_20px_rgba(90,30,45,0.08)] transition-all">
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10.5px] uppercase tracking-wider text-[#7c5641] font-bold">
                      Avg Customer LTV
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#ffe088]/40 flex items-center justify-center text-[#735c00]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3 z-10">
                    <div className="text-3xl text-[#1d1b1b] font-bold tracking-tight font-mono">
                      ₹{customerAnalytics.avgSpendPerCust.toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-[#534345]">
                      <span>Average Order Value per Registered Client</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#534345] z-10 pt-2 border-t border-[#ede7e6]">
                    <span>Total Client Spend:</span>
                    <span className="font-bold text-[#5a1e2d] font-mono">₹{customerAnalytics.totalSpend.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Search Controls & VIP Segment Chips */}
              <div className="bg-white p-5 rounded-xl border border-[#ede7e6] shadow-[0_2px_8px_rgba(90,30,45,0.03)] flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#857275]" />
                    <input
                      type="text"
                      placeholder="Search by Customer Name, WhatsApp (+91), or City..."
                      value={customerSearch}
                      onChange={e => {
                        setCustomerSearch(e.target.value);
                        setCustomerPage(1);
                      }}
                      className="w-full bg-[#f8f2f2] pl-10 pr-8 py-2.5 rounded-xl text-xs font-semibold text-[#1d1b1b] placeholder:text-[#857275] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5a1e2d]/30"
                    />
                    {customerSearch && (
                      <button
                        onClick={() => {
                          setCustomerSearch("");
                          setCustomerPage(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#857275] hover:text-[#1d1b1b] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#7c5641] uppercase tracking-wider shrink-0">
                      Sort by:
                    </span>
                    <select
                      value={customerSortBy}
                      onChange={e => {
                        setCustomerSortBy(e.target.value as any);
                        setCustomerPage(1);
                      }}
                      className="px-3 py-2 bg-[#f8f2f2] border border-[#ede7e6] rounded-xl text-xs font-bold text-[#1d1b1b] focus:outline-none focus:ring-2 focus:ring-[#5a1e2d]/30 cursor-pointer"
                    >
                      <option value="spend_desc">Highest Spend VIP First</option>
                      <option value="visits_desc">Most Frequent Visitors</option>
                      <option value="discount_desc">Highest Bargain Taken</option>
                      <option value="recent">Most Recent Visit</option>
                      <option value="name_asc">Name (A-Z)</option>
                    </select>

                    <select
                      value={customerPageSize}
                      onChange={e => {
                        setCustomerPageSize(Number(e.target.value));
                        setCustomerPage(1);
                      }}
                      className="px-3 py-2 bg-[#f8f2f2] border border-[#ede7e6] rounded-xl text-xs font-bold text-[#1d1b1b] focus:outline-none focus:ring-2 focus:ring-[#5a1e2d]/30 cursor-pointer"
                    >
                      <option value={15}>15 per page</option>
                      <option value={30}>30 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={99999}>View All</option>
                    </select>
                  </div>
                </div>

                {/* Segment Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ede7e6]">
                  {[
                    { id: "all", label: `All Clients (${customerDirectory.length})` },
                    { id: "vip", label: `Bridal Tier (${customerAnalytics.vipCustomers})` },
                    { id: "repeat", label: `High Frequency (${customerAnalytics.repeatCustomers})` },
                    { id: "festive", label: "Festive Regulars" },
                    { id: "negotiation", label: "Negotiation Alert (>10%)" }
                  ].map(chip => {
                    const isActive = customerFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        onClick={() => {
                          setCustomerFilter(chip.id as any);
                          setCustomerPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isActive
                            ? "bg-[#5a1e2d] text-white shadow-xs"
                            : "bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#534345]"
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Master Customer Dossier Table */}
              <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(90,30,45,0.04)] border border-[#ede7e6] overflow-hidden flex flex-col">
                <div className="px-5 py-3.5 bg-[#f8f2f2] border-b border-[#ede7e6] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-serif text-base font-bold text-[#3f0819]">
                      Client Dossier &amp; VIP Spend Ledger
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[#534345] border border-[#ede7e6] text-[11px] font-bold">
                      {filteredCustomers.length} Clients Matched
                    </span>
                  </div>
                  <div className="text-xs text-[#534345]">
                    Click <strong>&ldquo;New Bill&rdquo;</strong> to start checkout with client profile loaded
                  </div>
                </div>

                {filteredCustomers.length === 0 ? (
                  <div className="p-12 text-center text-[#534345]">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30 text-[#5a1e2d]" />
                    <p className="text-sm font-bold text-[#1d1b1b] font-serif">No Matching Clients Found</p>
                    <p className="text-xs text-[#534345] mt-1">Try clearing your search query or switching segment filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f8f2f2] text-[#7c5641] font-bold uppercase text-[10px] tracking-wider border-b border-[#ede7e6]">
                          <th className="py-3 px-4">Customer Details</th>
                          <th className="py-3 px-4">WhatsApp / Mobile</th>
                          <th className="py-3 px-4 text-center">Visits</th>
                          <th className="py-3 px-4 text-right">Total Spend</th>
                          <th className="py-3 px-4 text-right">Total Bargain Taken</th>
                          <th className="py-3 px-4 text-right">Avg Bill Value</th>
                          <th className="py-3 px-4">Last Visit</th>
                          <th className="py-3 px-4 text-right">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ede7e6]">
                        {paginatedCustomers.map((c, idx) => {
                          const initials = c.name
                            ? c.name
                                .split(" ")
                                .map(n => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            : "VIP";
                          const isGold = c.totalSpend >= 10000 || c.visitCount >= 3;
                          const isPlatinum = c.totalSpend >= 25000;
                          const bargainPct = c.totalSpend > 0 ? Math.round((c.totalDiscount / (c.totalSpend + c.totalDiscount)) * 100) : 0;

                          return (
                            <tr key={c.phone || idx} className="hover:bg-[#fef8f7] transition-colors">
                              <td className="py-3 px-4 align-top">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[#fdc9af]/40 text-[#7c5641] font-bold flex items-center justify-center font-serif text-xs border border-[#c99a82]/40 shrink-0">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[#1d1b1b] text-sm">
                                        {c.name}
                                      </span>
                                      {isPlatinum ? (
                                        <span className="px-1.5 py-0.2 rounded-full bg-[#ffe088]/40 text-[#735c00] text-[9.5px] font-bold border border-[#d4af37]/40 flex items-center gap-0.5">
                                          <Crown className="w-2.5 h-2.5" /> Platinum VIP
                                        </span>
                                      ) : isGold ? (
                                        <span className="px-1.5 py-0.2 rounded-full bg-[#fdc9af]/40 text-[#7c5641] text-[9.5px] font-bold border border-[#c99a82]/40">
                                          Gold VIP
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="text-[10.5px] text-[#857275] mt-0.5">
                                      {c.topCategories && c.topCategories.length > 0
                                        ? c.topCategories.slice(0, 2).join(", ")
                                        : "Boutique Patron"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 align-top font-mono">
                                <span className="font-bold text-[#1d1b1b] text-xs block">
                                  +91 {c.phone}
                                </span>
                                <span className="text-[10px] text-[#857275] block mt-0.5">
                                  Ranipur • Haridwar
                                </span>
                              </td>

                              <td className="py-3 px-4 align-top text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#f8f2f2] text-[#1d1b1b] font-bold text-xs border border-[#ede7e6] font-mono">
                                  {c.visitCount}
                                </span>
                              </td>

                              <td className="py-3 px-4 align-top text-right font-mono">
                                <span className="font-bold text-[#5a1e2d] text-sm block">
                                  ₹{c.totalSpend.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[10px] text-[#735c00] font-semibold block">
                                  {isPlatinum ? "Verified HNI Client" : "Loyal Patron"}
                                </span>
                              </td>

                              <td className="py-3 px-4 align-top text-right font-mono">
                                <span className="font-bold text-[#1d1b1b] text-xs block">
                                  ₹{c.totalDiscount.toLocaleString("en-IN")}
                                </span>
                                {c.totalDiscount > 0 ? (
                                  <span className="inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-[#ffd9de]/50 text-[#5a1e2d]">
                                    {bargainPct}% negotiated
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#857275]">Standard</span>
                                )}
                              </td>

                              <td className="py-3 px-4 align-top text-right font-mono">
                                <span className="font-bold text-[#1d1b1b] text-xs block">
                                  ₹{c.avgBillValue.toLocaleString("en-IN")}
                                </span>
                              </td>

                              <td className="py-3 px-4 align-top">
                                <span className="font-semibold text-[#1d1b1b] block text-xs">
                                  {c.lastVisit || "Recent"}
                                </span>
                                <span className="text-[10px] text-[#857275] block">
                                  Showroom Floor
                                </span>
                              </td>

                              <td className="py-3 px-4 align-top text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedCustomerForModal(c)}
                                    className="px-2.5 py-1 text-[#534345] hover:text-[#1d1b1b] bg-[#f8f2f2] hover:bg-[#ede7e6] border border-[#ede7e6] rounded-lg cursor-pointer font-bold text-[11px] transition shadow-xs"
                                    title="View Client Profile & Past Invoices"
                                  >
                                    View Bills
                                  </button>
                                  <button
                                    onClick={() => {
                                      const cleanPhone = c.phone.replace(/[^0-9]/g, "");
                                      if (!cleanPhone) {
                                        alert("No mobile number recorded for this client.");
                                        return;
                                      }
                                      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                                      const msg = encodeURIComponent(
                                        `Namaste ${c.name}! Greetings from Rajnandini Boutique (Darshan Enterprises), Haridwar. We have new festive and bridal arrivals waiting for you at our showroom Near PSC petrolpump Ranipur goan. We would love to welcome you!`
                                      );
                                      window.open(`https://wa.me/${fullPhone}?text=${msg}`, "_blank");
                                    }}
                                    className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                                    title="Open WhatsApp Chat with Client"
                                  >
                                    <Share2 className="w-3 h-3" />
                                    <span>Chat</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCustomer({ name: c.name, phone: c.phone, notes: "" });
                                      setActiveTab("pos");
                                    }}
                                    className="px-2.5 py-1 bg-[#5a1e2d] hover:bg-[#3f0819] text-white rounded-lg cursor-pointer font-bold text-[11px] transition shadow-xs"
                                    title="Create New Bill for this Client on POS Register"
                                  >
                                    New Bill
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Multipage Customer Pagination Controls */}
                {filteredCustomers.length > 0 && (
                  <div className="p-4 border-t border-[#ede7e6] bg-[#f8f2f2] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-[#534345] font-medium">
                      Showing <span className="font-bold text-[#1d1b1b]">{customerPageSize >= 9999 ? 1 : Math.min((customerPage - 1) * customerPageSize + 1, filteredCustomers.length)}</span> to <span className="font-bold text-[#1d1b1b]">{customerPageSize >= 9999 ? filteredCustomers.length : Math.min(customerPage * customerPageSize, filteredCustomers.length)}</span> of <span className="font-bold text-[#1d1b1b]">{filteredCustomers.length}</span> clients • <span className="text-[#857275]">Page {customerPage} of {totalCustomerPages}</span>
                    </div>

                    {totalCustomerPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCustomerPage(1)}
                          disabled={customerPage === 1}
                          className="px-2.5 py-1.5 rounded-lg border border-[#ede7e6] bg-white text-[#1d1b1b] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f8f2f2] transition cursor-pointer"
                        >
                          « First
                        </button>
                        <button
                          onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                          disabled={customerPage === 1}
                          className="px-2.5 py-1.5 rounded-lg border border-[#ede7e6] bg-white text-[#1d1b1b] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f8f2f2] transition cursor-pointer"
                        >
                          ‹ Prev
                        </button>
                        {Array.from({ length: totalCustomerPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalCustomerPages || Math.abs(p - customerPage) <= 2)
                          .reduce<(number | string)[]>((acc, curr, idx, arr) => {
                            if (idx > 0 && (curr as number) - (arr[idx - 1] as number) > 1) {
                              acc.push("...");
                            }
                            acc.push(curr);
                            return acc;
                          }, [])
                          .map((p, idx) => {
                            if (p === "...") {
                              return <span key={`c-ellipsis-${idx}`} className="px-1 text-[#857275] font-bold text-xs">...</span>;
                            }
                            const isCurrent = p === customerPage;
                            return (
                              <button
                                key={p}
                                onClick={() => setCustomerPage(Number(p))}
                                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  isCurrent
                                    ? "bg-[#5a1e2d] text-white shadow-xs"
                                    : "bg-white hover:bg-[#f8f2f2] text-[#1d1b1b] border border-[#ede7e6]"
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}
                        <button
                          onClick={() => setCustomerPage(p => Math.min(totalCustomerPages, p + 1))}
                          disabled={customerPage === totalCustomerPages}
                          className="px-2.5 py-1.5 rounded-lg border border-[#ede7e6] bg-white text-[#1d1b1b] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f8f2f2] transition cursor-pointer"
                        >
                          Next ›
                        </button>
                        <button
                          onClick={() => setCustomerPage(totalCustomerPages)}
                          disabled={customerPage === totalCustomerPages}
                          className="px-2.5 py-1.5 rounded-lg border border-[#ede7e6] bg-white text-[#1d1b1b] text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f8f2f2] transition cursor-pointer"
                        >
                          Last »
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STAFF KHATA & SALARY DEDUCTIONS TAB
            ========================================================= */}
        {activeTab === "staff_ledger" && (
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#fef8f7]">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Header Title & Action CTAs */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#ede7e6] shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[#5a1e2d] text-white">
                      <UserCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="font-serif font-black text-xl text-[#3f0819] uppercase tracking-wide">
                        Staff Khata &amp; Monthly Salary Deductions
                      </h2>
                      <p className="text-xs text-[#534345] font-medium">
                        Showroom staff taking products &amp; garments • Auto salary deductions • Cash into counter galla &amp; Online UPI repayments
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setDepStaffId(staffMembers[0]?.id || "staff-1");
                      setDepAmount("");
                      setDepNote("");
                      setShowStaffDepositModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Banknote className="w-4 h-4 text-emerald-200" />
                    <span>+ Record Staff Deposit (Cash / UPI)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIssStaffId(staffMembers[0]?.id || "staff-1");
                      setIssSelectedProduct(null);
                      setIssProductSearch("");
                      setIssQty(1);
                      setIssPrice("");
                      setIssNote("");
                      setShowStaffIssueModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#5a1e2d] hover:bg-[#3f0819] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-300" />
                    <span>+ Issue Garment (Salary Cut)</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewStaffName("");
                      setNewStaffPhone("");
                      setNewStaffRole("Showroom Sales Executive");
                      setNewStaffSalary("15000");
                      setShowAddStaffModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-stone-950" />
                    <span>+ Add New Staff</span>
                  </button>

                  <button
                    onClick={async () => {
                      const sp = await StaffExpenseService.fetchStaffPurchases();
                      if (sp) setStaffPurchases(sp);
                      const sd = await StaffExpenseService.fetchStaffDeposits();
                      if (sd) setStaffDeposits(sd);
                      const sa = await StaffExpenseService.fetchAdvances();
                      if (sa) setStaffAdvances(sa);
                      alert("✅ Staff Khata data refreshed from Cloud & Local cache!");
                    }}
                    className="p-2.5 rounded-xl bg-white border border-[#ede7e6] hover:bg-[#f8f2f2] text-[#534345] transition cursor-pointer"
                    title="Refresh Staff Data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* KPI Metrics Summary Grid */}
              {(() => {
                const totalGarmentsAmount = staffPurchases.reduce((s, p) => s + (Number(p.totalAmount) || 0), 0);
                const totalDepositsAmount = staffDeposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
                const totalAdvancesAmount = staffAdvances.reduce((s, a) => s + (Number(a.amount) || 0), 0);
                const netPendingDeductions = (totalGarmentsAmount + totalAdvancesAmount) - totalDepositsAmount;
                const totalBaseSalaries = staffMembers.filter(s => s.isActive).reduce((s, m) => s + m.monthlySalary, 0);

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                    <div className="bg-white p-4 rounded-2xl border border-[#ede7e6] shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-[#857275] tracking-wider block">Total Active Staff</span>
                      <span className="text-xl font-black text-[#1d1b1b] mt-1 block">
                        {staffMembers.filter(s => s.isActive).length} Members
                      </span>
                      <span className="text-[10px] text-[#534345] mt-0.5 block">
                        Base: ₹{totalBaseSalaries.toLocaleString("en-IN")}/mo
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#ede7e6] shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">Garments Taken (₹)</span>
                      <span className="text-xl font-black text-amber-900 font-mono mt-1 block">
                        ₹{totalGarmentsAmount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-[#534345] mt-0.5 block">
                        {staffPurchases.length} items logged
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Cash / UPI Repaid</span>
                      <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
                        ₹{totalDepositsAmount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-emerald-800/80 mt-0.5 block">
                        {staffDeposits.length} deposits recorded
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#ede7e6] shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">Cash Advances</span>
                      <span className="text-xl font-black text-purple-900 font-mono mt-1 block">
                        ₹{totalAdvancesAmount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-[#534345] mt-0.5 block">
                        {staffAdvances.length} salary advances
                      </span>
                    </div>

                    <div className="bg-gradient-to-br from-[#5a1e2d] to-[#3f0819] text-white p-4 rounded-2xl shadow-sm col-span-2 lg:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">Net Pending Deductions</span>
                      <span className="text-xl font-black text-white font-mono mt-1 block">
                        ₹{Math.max(0, netPendingDeductions).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-amber-200/80 mt-0.5 block">
                        To be cut across all payrolls
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Staff Member Cards with Individual Passbooks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-[#3f0819] uppercase tracking-wide">
                    Showroom Staff Passbooks &amp; Net Salary Payable
                  </h3>
                  <span className="text-xs text-[#534345]">
                    Click any staff card to expand itemized ledger &amp; repayment history
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {staffMembers.map((staff) => {
                    const summary = getStaffSummary(staff.id, staff.monthlySalary);
                    const isExpanded = expandedStaffId === staff.id;

                    return (
                      <div
                        key={staff.id}
                        className="bg-white rounded-2xl border border-[#ede7e6] shadow-xs overflow-hidden transition"
                      >
                        {/* Main Staff Header Row */}
                        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-white via-[#fef8f7] to-white">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-[#5a1e2d] text-white font-black flex items-center justify-center text-base shrink-0 shadow-xs">
                              {staff.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-stone-900 text-base">
                                  {staff.name}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fdc9af]/40 text-[#7c5641] border border-[#c99a82]/30">
                                  {staff.role}
                                </span>
                                {!staff.isActive && (
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-gray-100 text-gray-500">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-[#534345] mt-1">
                                <span>📞 {staff.phone}</span>
                                <span>• Base Salary: <strong>₹{staff.monthlySalary.toLocaleString("en-IN")}/mo</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Financial Summary Badges */}
                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
                            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                              <span className="text-[10px] uppercase font-bold text-amber-800 block">Garments Taken</span>
                              <span className="font-mono font-black text-sm">₹{summary.garmentTotal.toLocaleString("en-IN")}</span>
                              <span className="text-[9.5px] text-amber-800 ml-1">({summary.purchases.length} pcs)</span>
                            </div>

                            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Repaid (Cash/UPI)</span>
                              <span className="font-mono font-black text-sm">₹{summary.depositTotal.toLocaleString("en-IN")}</span>
                            </div>

                            {summary.advanceTotal > 0 && (
                              <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950">
                                <span className="text-[10px] uppercase font-bold text-purple-800 block">Advance</span>
                                <span className="font-mono font-black text-sm">₹{summary.advanceTotal.toLocaleString("en-IN")}</span>
                              </div>
                            )}

                            <div className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-white shadow-xs">
                              <span className="text-[10px] uppercase font-bold text-amber-400 block">Net Salary Payable</span>
                              <span className="font-mono font-black text-base text-white">₹{summary.netPayable.toLocaleString("en-IN")}</span>
                            </div>

                            {/* Actions on Staff Card */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                onClick={() => {
                                  setDepStaffId(staff.id);
                                  setDepAmount("");
                                  setDepNote("");
                                  setShowStaffDepositModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                                title="Staff paid cash into galla or UPI"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Repay</span>
                              </button>

                              <button
                                onClick={() => {
                                  setIssStaffId(staff.id);
                                  setIssSelectedProduct(null);
                                  setIssProductSearch("");
                                  setIssQty(1);
                                  setIssPrice("");
                                  setIssNote("");
                                  setShowStaffIssueModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                                title="Issue a garment directly to this staff member"
                              >
                                <Tag className="w-3.5 h-3.5" />
                                <span>+ Garment</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditStaffModal(staff)}
                                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                title="Edit staff member's salary, role & details"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                                <span>Edit Salary</span>
                              </button>

                              <button
                                onClick={() => setExpandedStaffId(isExpanded ? null : staff.id)}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] border transition cursor-pointer flex items-center gap-1 ${
                                  isExpanded
                                    ? "bg-[#5a1e2d] text-white border-[#5a1e2d]"
                                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                                }`}
                              >
                                <span>{isExpanded ? "Hide Passbook ▲" : `Passbook (${summary.purchases.length + summary.deposits.length}) ▼`}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Itemized Passbook */}
                        {isExpanded && (
                          <div className="border-t border-[#ede7e6] p-4 sm:p-5 bg-stone-50/60 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* 1. Garments Taken (Salary Cut) */}
                              <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider">
                                    <ShoppingBag className="w-4 h-4 text-amber-800" />
                                    <span>Garments Taken ({summary.purchases.length})</span>
                                  </div>
                                  <span className="font-mono font-bold text-xs text-amber-900">
                                    Total: ₹{summary.garmentTotal.toLocaleString("en-IN")}
                                  </span>
                                </div>

                                {summary.purchases.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-stone-400 italic bg-stone-50 rounded-lg">
                                    No garments taken by {staff.name} this cycle.
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {summary.purchases.map((pur) => (
                                      <div
                                        key={pur.id}
                                        className="p-2.5 rounded-lg bg-amber-50/40 border border-amber-100 flex items-center justify-between text-xs gap-2"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-stone-900 truncate">
                                              {pur.productName}
                                            </span>
                                            <span className="text-[10px] font-mono text-stone-500">
                                              {pur.sku}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10.5px] text-stone-600 mt-0.5">
                                            <span>Qty: <strong>{pur.quantity}</strong></span>
                                            <span>• @ ₹{pur.price.toLocaleString("en-IN")}</span>
                                            <span>• {pur.date}</span>
                                            {pur.billNo && (
                                              <span className="text-amber-800 font-mono">Bill #{pur.billNo}</span>
                                            )}
                                          </div>
                                          {pur.note && (
                                            <p className="text-[10px] text-stone-500 italic mt-0.5">
                                              Note: {pur.note}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right flex items-center gap-2">
                                          <span className="font-mono font-black text-stone-900 text-xs">
                                            ₹{pur.totalAmount.toLocaleString("en-IN")}
                                          </span>
                                          <button
                                            onClick={() => handleDeleteStaffPurchase(pur)}
                                            className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer transition"
                                            title="Delete this purchase entry"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* 2. Repayments / Deposits Made (Cash or UPI) */}
                              <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                                    <Banknote className="w-4 h-4 text-emerald-700" />
                                    <span>Cash &amp; UPI Repayments ({summary.deposits.length})</span>
                                  </div>
                                  <span className="font-mono font-bold text-xs text-emerald-800">
                                    Total: ₹{summary.depositTotal.toLocaleString("en-IN")}
                                  </span>
                                </div>

                                {summary.deposits.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-stone-400 italic bg-stone-50 rounded-lg">
                                    No repayments/deposits recorded yet.
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {summary.deposits.map((dep) => (
                                      <div
                                        key={dep.id}
                                        className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100 flex items-center justify-between text-xs gap-2"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-emerald-950">
                                              ₹{dep.amount.toLocaleString("en-IN")}
                                            </span>
                                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                              {dep.paymentMode === "cash_galla" ? "Cash (In Galla)" : "Online UPI"}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10.5px] text-stone-600 mt-0.5">
                                            <span>Date: {dep.date}</span>
                                            <span>• Received By: <strong>{dep.receivedBy}</strong></span>
                                          </div>
                                          {dep.note && (
                                            <p className="text-[10px] text-stone-500 italic mt-0.5">
                                              Note: {dep.note}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <button
                                            onClick={() => handleDeleteStaffDeposit(dep)}
                                            className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer transition"
                                            title="Delete this deposit entry"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* =========================================================
          MODAL: RECORD STAFF REPAYMENT / DEPOSIT (CASH / UPI)
          ========================================================= */}
      {showStaffDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-700 text-white">
                  <Banknote className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Record Staff Deposit</h3>
                  <span className="text-xs text-stone-500">Repay garment purchase or salary deduction</span>
                </div>
              </div>
              <button
                onClick={() => setShowStaffDepositModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Showroom Staff Member *
                </label>
                <select
                  value={depStaffId}
                  onChange={(e) => setDepStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold focus:outline-hidden focus:border-emerald-600"
                >
                  {staffMembers.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - Base Salary: ₹{s.monthlySalary.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Deposit Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-bold text-base focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepPaymentMode("cash_galla")}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                      depPaymentMode === "cash_galla"
                        ? "bg-emerald-700 text-white border-emerald-700 font-bold"
                        : "bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <span>Cash (In Galla)</span>
                    <Banknote className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepPaymentMode("online_upi")}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                      depPaymentMode === "online_upi"
                        ? "bg-emerald-700 text-white border-emerald-700 font-bold"
                        : "bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <span>Online UPI</span>
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Notes / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={depNote}
                  onChange={(e) => setDepNote(e.target.value)}
                  placeholder="e.g. Repayment for Saree taken on Diwali"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowStaffDepositModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStaffDeposit}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                Save Deposit &amp; Update Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: DIRECT STAFF GARMENT ISSUE (SALARY CUT)
          ========================================================= */}
      {showStaffIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#5a1e2d] text-white">
                  <ShoppingBag className="w-5 h-5 text-amber-300" />
                </span>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Direct Staff Garment Issue</h3>
                  <span className="text-xs text-stone-500">Pick product from catalog • Deducts from salary</span>
                </div>
              </div>
              <button
                onClick={() => setShowStaffIssueModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Showroom Staff Member *
                </label>
                <select
                  value={issStaffId}
                  onChange={(e) => setIssStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold focus:outline-hidden focus:border-[#5a1e2d]"
                >
                  {staffMembers.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - Base Salary: ₹{s.monthlySalary.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Garment Search and Selector */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Select Product / Garment from Catalog *
                </label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={issProductSearch}
                    onChange={(e) => setIssProductSearch(e.target.value)}
                    placeholder="Search saree, suit, lehenga, SKU..."
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-hidden focus:border-[#5a1e2d]"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
                </div>

                {issSelectedProduct ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 text-xs block">{issSelectedProduct.name}</span>
                      <span className="text-[10px] text-stone-500 font-mono">SKU: {issSelectedProduct.sku} • Stock: {issSelectedProduct.stock} pcs</span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-900 text-xs">
                        ₹{issSelectedProduct.price.toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIssSelectedProduct(null);
                          setIssPrice("");
                        }}
                        className="px-2 py-0.5 rounded text-[10px] bg-white border border-stone-300 hover:bg-stone-100 font-semibold cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-stone-100">
                    {issFilteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setIssSelectedProduct(p);
                          setIssPrice(String(p.price));
                        }}
                        className="p-2 hover:bg-stone-50 cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <div className="truncate pr-2">
                          <span className="font-medium text-stone-900">{p.name}</span>
                          <span className="text-[10px] text-stone-400 block font-mono">{p.sku} • Stock: {p.stock}</span>
                        </div>
                        <span className="font-mono font-bold text-stone-800 shrink-0">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity and Price override */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={issQty}
                    onChange={(e) => setIssQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-bold focus:outline-hidden focus:border-[#5a1e2d]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={issPrice}
                    onChange={(e) => setIssPrice(e.target.value)}
                    placeholder="Price"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-bold focus:outline-hidden focus:border-[#5a1e2d]"
                  />
                </div>
              </div>

              {issSelectedProduct && (
                <div className="p-2.5 rounded-xl bg-stone-900 text-white flex items-center justify-between font-mono">
                  <span className="text-xs text-amber-300 font-sans font-medium">Total Deducted from Salary:</span>
                  <span className="text-base font-black">
                    ₹{((Number(issQty) || 1) * (Number(issPrice) || issSelectedProduct.price)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={issNote}
                  onChange={(e) => setIssNote(e.target.value)}
                  placeholder="e.g. Wedding dress for cousin"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-hidden focus:border-[#5a1e2d]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowStaffIssueModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!issSelectedProduct}
                onClick={handleSaveDirectIssue}
                className="px-5 py-2 bg-[#5a1e2d] hover:bg-[#3f0819] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition disabled:opacity-40"
              >
                Issue Garment &amp; Deduct Salary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD NEW SHOWROOM STAFF MEMBER
          ========================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#5a1e2d] text-white">
                  <UserPlus className="w-5 h-5 text-amber-300" />
                </span>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Add New Staff Member</h3>
                  <span className="text-xs text-stone-500">Showroom employee profile &amp; monthly base salary</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Simran Kaur"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold focus:outline-hidden focus:border-[#5a1e2d]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="e.g. 9897123456"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-hidden focus:border-[#5a1e2d]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Role / Designation *
                </label>
                <div className="space-y-1.5">
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:outline-hidden focus:border-[#5a1e2d]"
                  >
                    <option value="Showroom Sales Executive">Showroom Sales Executive</option>
                    <option value="Senior Sales Executive">Senior Sales Executive</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Saree & Bridal Specialist">Saree &amp; Bridal Specialist</option>
                    <option value="Tailor & Alteration Master">Tailor &amp; Alteration Master</option>
                    <option value="Counter Cashier & Billing">Counter Cashier &amp; Billing</option>
                    <option value="Showroom Helper & Inventory">Showroom Helper &amp; Inventory</option>
                    <option value="Custom">Other (Type Custom Role)</option>
                  </select>
                  {newStaffRole === "Custom" && (
                    <input
                      type="text"
                      placeholder="Enter custom role title..."
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-hidden focus:border-[#5a1e2d]"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Monthly Base Salary (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={newStaffSalary}
                  onChange={(e) => setNewStaffSalary(e.target.value)}
                  placeholder="e.g. 18000"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-bold text-base focus:outline-hidden focus:border-[#5a1e2d]"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Garment purchases and advances will be deducted from this base salary.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewStaff}
                className="px-5 py-2 bg-[#5a1e2d] hover:bg-[#3f0819] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                Save Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: EDIT STAFF DETAILS & UPDATE MONTHLY SALARY
          ========================================================= */}
      {editingStaffMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#5a1e2d] text-white">
                  <Edit3 className="w-5 h-5 text-amber-300" />
                </span>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Edit Staff &amp; Salary</h3>
                  <span className="text-xs text-stone-500">Update salary, role, contact info or status</span>
                </div>
              </div>
              <button
                onClick={() => setEditingStaffMember(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold focus:outline-hidden focus:border-[#5a1e2d]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={editStaffPhone}
                  onChange={(e) => setEditStaffPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-hidden focus:border-[#5a1e2d]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Role / Designation
                </label>
                <input
                  type="text"
                  value={editStaffRole}
                  onChange={(e) => setEditStaffRole(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-hidden focus:border-[#5a1e2d]"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                  Monthly Base Salary (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={editStaffSalary}
                  onChange={(e) => setEditStaffSalary(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-stone-900 font-mono font-black text-lg focus:outline-hidden focus:border-amber-600"
                />
                <span className="text-[10px] text-amber-900/80 block leading-tight">
                  💡 Updating salary will immediately recalculate this month&apos;s Net Salary Payable.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStaffIsActive(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      editStaffIsActive
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Active Member</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStaffIsActive(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      !editStaffIsActive
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <span>Inactive / Left</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => handleDeleteStaff(editingStaffMember.id, editingStaffMember.name)}
                className="px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                title="Remove staff member"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaffMember(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditStaff}
                  className="px-5 py-2 bg-[#5a1e2d] hover:bg-[#3f0819] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Festive Broadcast Quick Modal */}
      {showFestiveBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#ede7e6] space-y-4">
            <div className="flex items-center justify-between border-b border-[#ede7e6] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#5a1e2d] text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#3f0819]">Festive &amp; Wedding Broadcast</h3>
                  <span className="text-[11px] text-[#7c5641] font-semibold">Broadcast to Registered VIP Showroom Clients</span>
                </div>
              </div>
              <button
                onClick={() => setShowFestiveBroadcastModal(false)}
                className="text-[#857275] hover:text-[#1d1b1b] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#f8f2f2] p-4 rounded-xl border border-[#ede7e6] text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#7c5641] tracking-wider block">Default Broadcast Message:</span>
              <p className="text-[#1d1b1b] leading-relaxed italic">
                &ldquo;Namaste! Greetings from Rajnandini (Darshan Enterprises), Haridwar. Our new Bridal &amp; Festive Wedding Couture 2026 Collection has arrived at our showroom Near PSC petrolpump Ranipur goan. We invite you for an exclusive preview! Call: +91 7464987898.&rdquo;
              </p>
            </div>
            <p className="text-xs text-[#534345]">
              You have <strong>{customerAnalytics.totalCustomers}</strong> registered clients and <strong>{customerAnalytics.repeatCustomers}</strong> VIPs ready to receive this update.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowFestiveBroadcastModal(false)}
                className="px-4 py-2 bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#534345] rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    "Namaste! Greetings from Rajnandini (Darshan Enterprises), Haridwar. Our new Bridal & Festive Wedding Couture 2026 Collection has arrived at our showroom Near PSC petrolpump Ranipur goan. We invite you for an exclusive preview! Call: +91 7464987898."
                  );
                  alert("Broadcast message copied to clipboard! You can paste and send it to your WhatsApp Broadcast List.");
                  setShowFestiveBroadcastModal(false);
                }}
                className="px-4 py-2 bg-[#5a1e2d] hover:bg-[#3f0819] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#5a1e2d]/20"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Message for WhatsApp Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Z-Report Slip Modal */}
      {showZReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#ede7e6] space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ede7e6] pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#3f0819]">END-OF-DAY Z-REPORT</h3>
                <span className="text-[10px] text-[#7c5641]">Terminal Register #01 • Rajnandini</span>
              </div>
              <button
                onClick={() => setShowZReportModal(false)}
                className="text-[#857275] hover:text-[#1d1b1b] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#f8f2f2] p-4 rounded-xl border border-[#ede7e6] space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-bold">{new Date().toLocaleDateString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Shift Lead:</span>
                <span className="font-bold">Indu Sharma</span>
              </div>
              <div className="flex justify-between border-t border-[#ede7e6] pt-1.5">
                <span>Total Invoices Settled:</span>
                <span className="font-bold">{reportAnalytics.billCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Net Revenue:</span>
                <span className="font-bold text-[#5a1e2d]">₹{reportAnalytics.totalRev.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Wholesale Cost (COGS):</span>
                <span>₹{reportAnalytics.totalCost.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Gross Profit:</span>
                <span className="font-bold text-emerald-700">₹{reportAnalytics.totalProfit.toLocaleString("en-IN")} ({reportAnalytics.profitMarginPct}%)</span>
              </div>
              <div className="flex justify-between border-t border-[#ede7e6] pt-1.5">
                <span>Cash Drawer Balance:</span>
                <span className="font-bold">₹{reportAnalytics.totalCash.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>UPI Collections:</span>
                <span>₹{reportAnalytics.totalUpi.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Card Collections:</span>
                <span>₹{reportAnalytics.totalCard.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Bargain Given:</span>
                <span className="text-rose-700">₹{reportAnalytics.totalDiscounts.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowZReportModal(false)}
                className="px-4 py-2 bg-[#f8f2f2] hover:bg-[#ede7e6] text-[#534345] rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-[#5a1e2d] hover:bg-[#3f0819] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Z-Report Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CUSTOMER PROFILE & PURCHASE HISTORY
          ========================================================= */}
      {selectedCustomerForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#181310] via-[#241c17] to-[#181310] text-white p-5 border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black flex items-center justify-center text-lg">
                  {selectedCustomerForModal.name.charAt(0).toUpperCase() || "G"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-serif">{selectedCustomerForModal.name}</h3>
                    {(selectedCustomerForModal.totalSpend >= 3000 || selectedCustomerForModal.visitCount >= 2) && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black rounded-md flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-300" /> VIP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-300 font-mono mt-0.5">
                    📱 {selectedCustomerForModal.phone || "No Mobile Number"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedCustomerForModal.phone && selectedCustomerForModal.phone !== "NA" && (
                  <button
                    onClick={() => handleOpenWhatsAppCustomer(selectedCustomerForModal)}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer transition shadow-xs"
                    title="Send WhatsApp Message"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedCustomerForModal(null)}
                  className="p-2 text-stone-400 hover:text-white rounded-xl cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="bg-stone-50 p-4 border-b border-stone-200 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Total Spend</span>
                <span className="font-mono font-black text-sm text-stone-900 block mt-0.5">
                  ₹{selectedCustomerForModal.totalSpend.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-rose-600 uppercase font-bold block">Bargain Taken</span>
                <span className="font-mono font-black text-sm text-rose-700 block mt-0.5">
                  ₹{selectedCustomerForModal.totalDiscount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Visits / Bills</span>
                <span className="font-mono font-black text-sm text-stone-900 block mt-0.5">
                  {selectedCustomerForModal.visitCount}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Avg Bill</span>
                <span className="font-mono font-black text-sm text-stone-900 block mt-0.5">
                  ₹{selectedCustomerForModal.avgBillValue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Purchase History Bills List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-serif">
                All Showroom Bills ({selectedCustomerForModal.bills.length})
              </h4>
              <div className="space-y-2.5">
                {selectedCustomerForModal.bills.map(b => (
                  <div key={b.id} className="bg-white border border-stone-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-stone-900 text-sm">{b.billNo}</span>
                        <p className="text-[10px] text-stone-500">{b.createdAt}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-stone-900 text-sm">
                          ₹{b.grandTotal.toLocaleString("en-IN")}
                        </span>
                        {(b.totalSavings || b.discount) > 0 && (
                          <span className="text-[10.5px] text-rose-600 font-bold block">
                            Discount: ₹{(b.totalSavings || b.discount).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items Purchased */}
                    <div className="bg-stone-50 rounded-xl p-2.5 space-y-1 text-xs text-stone-700">
                      {b.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="font-medium">
                            {it.quantity}x {it.product.name} ({it.selectedSize || "Standard"})
                          </span>
                          <span className="font-mono font-bold">
                            ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
                      <button
                        onClick={() => window.open(`/invoice?id=${b.billNo}`, "_blank")}
                        className="px-2.5 py-1 text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-700" />
                        <span>View PDF</span>
                      </button>
                      <button
                        onClick={() => handleSendWhatsAppBill(b)}
                        className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Slip</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <button
                onClick={() => {
                  handleStartBillForCustomer(selectedCustomerForModal);
                  setSelectedCustomerForModal(null);
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Create New Bill for this Customer</span>
              </button>
              <button
                onClick={() => setSelectedCustomerForModal(null)}
                className="px-3.5 py-2 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CHECKOUT SUCCESS & THERMAL RECEIPT PREVIEW
          ========================================================= */}
      {showCheckoutSuccess && lastBill && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-stone-950 text-white p-5 text-center relative border-b border-amber-500/30">
              <button
                onClick={() => setShowCheckoutSuccess(false)}
                className="absolute top-4 right-4 p-1 text-stone-400 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Payment Completed!</h3>
              <p className="text-xs text-amber-400 font-medium">
                Bill #{lastBill.billNo} · ₹{lastBill.grandTotal.toLocaleString("en-IN")}
              </p>
            </div>

            {/* Dynamic UPI QR Display if UPI mode */}
            {lastBill.paymentMode === "upi" && upiQrUrl && (
              <div className="p-4 bg-purple-50 text-center border-b border-purple-100 flex flex-col items-center">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-2">
                  Customer Scan &amp; Pay QR (PhonePe / GPay)
                </span>
                <img src={upiQrUrl} alt="UPI QR" className="w-36 h-36 border-2 border-purple-300 rounded-xl shadow-xs" />
                <span className="text-[10px] text-gray-500 mt-1">Amount: ₹{lastBill.grandTotal.toLocaleString("en-IN")}</span>
              </div>
            )}

            {/* Receipt Preview Box */}
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-gray-800 bg-gray-50 border-b border-gray-200">
              <div className="text-center pb-2 border-b border-gray-300">
                <p className="font-bold text-sm">RAJNANDINI</p>
                <p className="text-[10.5px] font-bold text-stone-700">Darshan Enterprises</p>
                <p className="text-[9.5px] text-gray-500">Near PSC petrolpump Ranipur goan , haridwar , Uttrakhand  249401</p>
                <p className="text-[9.5px] font-semibold text-gray-700">GSTIN: 05GNZPS9902M1ZR · Ph: +91 7464987898</p>
              </div>

              <div className="py-2 border-b border-gray-300 text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Bill: {lastBill.billNo}</span>
                  <span>{lastBill.createdAt.split(",")[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer: {lastBill.customer.name}</span>
                  <span>{lastBill.customer.phone}</span>
                </div>
              </div>

              <div className="py-2 border-b border-gray-300 space-y-1">
                {lastBill.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">
                      {it.quantity}x {it.product.name} ({it.selectedSize || "Std"})
                    </span>
                    <span>₹{(it.quantity * it.price).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="py-2 space-y-0.5 font-bold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{lastBill.subtotal.toLocaleString("en-IN")}</span>
                </div>
                {lastBill.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Negotiated Discount:</span>
                    <span>-₹{lastBill.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {lastBill.discountReason && (
                  <div className="text-[10px] text-slate-500 font-normal italic">
                    Note: {lastBill.discountReason}
                  </div>
                )}
                {(lastBill.totalSavings || lastBill.discount) > 0 && (
                  <div className="flex justify-between text-amber-800 text-[11px] bg-amber-50 px-1.5 py-0.5 rounded">
                    <span>You Saved:</span>
                    <span>₹{(lastBill.totalSavings || lastBill.discount).toLocaleString("en-IN")} 🎉</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-400">
                  <span>Total Paid:</span>
                  <span>₹{lastBill.grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {lastBill.alteration && (
                <div className="mt-2 pt-2 border-t border-dashed border-gray-400 text-[10px] text-amber-900">
                  <p className="font-bold">✂️ ALTERATION SLIP:</p>
                  <p>Garment: {lastBill.alteration.garmentName}</p>
                  <p>Fitting: {lastBill.alteration.fittingNotes}</p>
                  <p>Ready Date: {lastBill.alteration.readyDate}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-white flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintThermal}
                  className="flex-1 py-2.5 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Print Slip (80mm)</span>
                </button>

                <button
                  onClick={() => window.open(`/invoice?id=${lastBill.billNo}`, "_blank")}
                  className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Full Tax Invoice (PDF)</span>
                </button>
              </div>

              <button
                onClick={() => handleSendWhatsAppBill(lastBill)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Send PDF &amp; Bill on WhatsApp</span>
              </button>

              <button
                onClick={() => handleStartEditBill(lastBill)}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Customer wants to bargain or buy more items"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                <span>Edit This Bill (Add More Items / Bargain)</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* =========================================================
          PRINT ONLY AREA: THERMAL RECEIPT ROLL (58mm / 80mm)
          ========================================================= */}
      {lastBill && (
        <div id="thermal-receipt-area" className="hidden print:block">
          {/* Brand Header */}
          <div style={{ textAlign: "center", marginBottom: "4px", paddingBottom: "3px" }}>
            <img
              src="/rajnandini-logo.jpg"
              alt="Rajnandini"
              style={{ width: "42px", height: "42px", borderRadius: "50%", margin: "0 auto 3px auto", display: "block", border: "1.5px solid #000" }}
            />
            <h1 style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "1px", margin: "0 0 1px 0", textTransform: "uppercase" }}>
              RAJNANDINI
            </h1>
            <p style={{ fontSize: "10px", fontWeight: "800", margin: "1px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Fashion · Jewellery · Beauty
            </p>
            <p style={{ fontSize: "12px", fontWeight: "900", margin: "1px 0", letterSpacing: "0.5px", color: "#000" }}>
              Darshan Enterprises
            </p>
            <p style={{ fontSize: "11px", fontWeight: "700", margin: "1px 0", color: "#000" }}>
              Near PSC petrolpump Ranipur goan , haridwar , Uttrakhand  249401
            </p>
            <p style={{ fontSize: "11.5px", fontWeight: "800", margin: "1px 0", color: "#000" }}>
              GSTIN: 05GNZPS9902M1ZR · Ph: +91 7464987898
            </p>
          </div>

          {/* Meta Info Section */}
          <div style={{ borderTop: "2px dashed #000", borderBottom: "2px dashed #000", padding: "4px 0", margin: "5px 0", fontSize: "12px", color: "#000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
              <span style={{ fontWeight: "800" }}>Bill No: <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "900" }}>{lastBill.billNo}</span></span>
              <span style={{ fontWeight: "800" }}>{lastBill.createdAt.split(",")[0]}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px", fontSize: "11.5px", color: "#000", fontWeight: "800" }}>
              <span>Time: {lastBill.createdAt.split(",")[1] || ""}</span>
              <span style={{ textTransform: "uppercase" }}>
                Pay: {lastBill.paymentMode === "staff_salary" ? `STAFF SALARY CUT (${lastBill.staffBuyerName || "STAFF"})` : lastBill.paymentMode}
              </span>
            </div>
            <div style={{ marginTop: "3px", paddingTop: "3px", borderTop: "1.5px dashed #000" }}>
              <span style={{ fontWeight: "800" }}>Customer: </span>
              <span style={{ fontWeight: "700" }}>{lastBill.customer.name} {lastBill.customer.phone !== "NA" && `(${lastBill.customer.phone})`}</span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div style={{ margin: "5px 0", color: "#000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", fontSize: "12px", paddingBottom: "3px", borderBottom: "2px solid #000", textTransform: "uppercase" }}>
              <span>Item Description</span>
              <span>Amount</span>
            </div>
            {lastBill.items.map((it, idx) => (
              <div key={idx} style={{ padding: "4px 0", borderBottom: "1px dashed #000" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "800", color: "#000" }}>
                  <span style={{ maxWidth: "70%", wordBreak: "break-word" }}>
                    {it.quantity}x {it.product.name}
                  </span>
                  <span style={{ fontWeight: "900", whiteSpace: "nowrap" }}>
                    ₹{(it.quantity * it.price).toLocaleString("en-IN")}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#000", fontWeight: "800", marginTop: "1px" }}>
                  <span>SKU: {it.product.sku}</span>
                  {it.selectedSize && <span style={{ marginLeft: "6px" }}>Size: {it.selectedSize}</span>}
                  <span style={{ marginLeft: "6px" }}>@ ₹{it.price.toLocaleString("en-IN")}/pc</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals & Savings */}
          <div style={{ borderTop: "2px dashed #000", paddingTop: "4px", marginTop: "5px", color: "#000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: "700", marginBottom: "2px" }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: "800" }}>₹{lastBill.subtotal.toLocaleString("en-IN")}</span>
            </div>

            {lastBill.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "800", color: "#000", marginBottom: "2px" }}>
                <span>Discount ({lastBill.discountReason || "Special Deal"}):</span>
                <span>-₹{lastBill.discount.toLocaleString("en-IN")}</span>
              </div>
            )}

            {/* Detailed GST Breakdown (5% Apparel: CGST 2.5% + SGST 2.5%) */}
            <div style={{ borderTop: "1.5px dashed #000", borderBottom: "1.5px dashed #000", padding: "3px 0", margin: "4px 0", fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5px", fontWeight: "700" }}>
                <span>Net Taxable Value:</span>
                <span style={{ fontWeight: "800" }}>₹{(Math.round((lastBill.grandTotal / 1.05) * 100) / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5px", fontWeight: "700" }}>
                <span>CGST @ 2.5%:</span>
                <span style={{ fontWeight: "800" }}>₹{(Math.round(((lastBill.grandTotal - Math.round((lastBill.grandTotal / 1.05) * 100) / 100) / 2) * 100) / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5px", fontWeight: "700" }}>
                <span>SGST @ 2.5%:</span>
                <span style={{ fontWeight: "800" }}>₹{(Math.round(((lastBill.grandTotal - Math.round((lastBill.grandTotal / 1.05) * 100) / 100) / 2) * 100) / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", borderTop: "1px dashed #000", paddingTop: "2px", marginTop: "1.5px" }}>
                <span>Total GST (5%):</span>
                <span>₹{(Math.round((lastBill.grandTotal - Math.round((lastBill.grandTotal / 1.05) * 100) / 100) * 100) / 100).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "900", marginTop: "4px", paddingTop: "4px", borderTop: "2px solid #000" }}>
              <span>TOTAL PAID:</span>
              <span>₹{lastBill.grandTotal.toLocaleString("en-IN")}</span>
            </div>

            {(lastBill.totalSavings || lastBill.discount) > 0 && (
              <div style={{ textAlign: "center", fontSize: "11.5px", marginTop: "4px", padding: "3px", fontWeight: "900", border: "1.5px dashed #000", borderRadius: "3px", color: "#000" }}>
                *** AAPKI KUL BACHAT: ₹{(lastBill.totalSavings || lastBill.discount).toLocaleString("en-IN")} ***
              </div>
            )}

            <div style={{ fontSize: "11px", marginTop: "3px", textAlign: "right", fontWeight: "800", color: "#000" }}>
              Payment Mode: {lastBill.paymentMode === "staff_salary" ? `STAFF SALARY CUT (${lastBill.staffBuyerName || "STAFF"})` : lastBill.paymentMode.toUpperCase()}
            </div>
          </div>

          {/* Alteration Note if present */}
          {lastBill.alteration && (
            <div style={{ borderTop: "2px dashed #000", marginTop: "6px", paddingTop: "4px", fontSize: "11.5px", color: "#000" }}>
              <div style={{ fontWeight: "900", fontSize: "12px", marginBottom: "2px" }}>✂️ ALTERATION / FITTING SLIP:</div>
              <div><strong>Garment:</strong> {lastBill.alteration.garmentName}</div>
              <div><strong>Fitting:</strong> {lastBill.alteration.fittingNotes}</div>
              <div><strong>Ready Date:</strong> {lastBill.alteration.readyDate}</div>
            </div>
          )}

          {/* Footer Note / Return Policy */}
          <div style={{ textAlign: "center", marginTop: "8px", fontSize: "10.5px", border: "2px solid #000", padding: "5px 3px", lineHeight: "1.35", color: "#000", borderRadius: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "900", display: "block", marginBottom: "1px", textTransform: "uppercase" }}>
              ★ RETURN &amp; EXCHANGE POLICY ★
            </span>
            <span style={{ fontWeight: "900", display: "block", fontSize: "10.5px" }}>
              NO CASH REFUND / MONEY RETURN — ONLY EXCHANGE ALLOWED.
            </span>
            <span style={{ fontSize: "10px", fontWeight: "800", display: "block", marginTop: "1px" }}>
              Exchange allowed within 5 DAYS ONLY with original bill &amp; tags intact.
            </span>
            <span style={{ fontSize: "9px", fontWeight: "700", display: "block", marginTop: "1px" }}>
              Altered, washed, or damaged garments will not be exchanged.
            </span>
            <span style={{ fontSize: "11.5px", fontWeight: "900", display: "block", marginTop: "3px" }}>
              Thank You! Visit Again 🙏
            </span>
          </div>

          {/* Instagram Follow QR for Thermal Roll */}
          <div style={{ marginTop: "6px", textAlign: "center", borderTop: "1.5px dashed #000", paddingTop: "6px" }}>
            <p style={{ fontSize: "10.5px", fontWeight: "900", margin: "0 0 1px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              📸 FOLLOW US ON INSTAGRAM
            </p>
            <p style={{ fontSize: "9.5px", fontWeight: "700", margin: "0 0 3px 0" }}>
              Scan for new arrivals &amp; festive deals
            </p>
            <img
              src="/instagram-qr.png"
              alt="Instagram @RAJNANDINISTORE"
              style={{ width: "90px", height: "auto", margin: "0 auto", display: "block" }}
            />
            <p style={{ fontSize: "11px", fontWeight: "900", margin: "2px 0 0 0", fontFamily: "monospace" }}>
              @RAJNANDINISTORE
            </p>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: LASER PRINTER BARCODE STICKER SHEET GENERATOR
          ========================================================= */}
      {selectedProductForBarcode && (
        <BarcodeSheetModal
          product={selectedProductForBarcode}
          onClose={() => setSelectedProductForBarcode(null)}
        />
      )}

      {/* =========================================================
          MODAL: ADD NEW PRODUCT
          ========================================================= */}
      {showNewProductModal && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 font-serif text-lg">
                  {newProductForm.id ? "Edit Product Details" : "Add New Product / Handbag / Garment"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  SKU aur Barcode apne aap generate ho jayenge — aap seedha Save &amp; Print Tag kar sakte hain!
                </p>
              </div>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="p-1 text-slate-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Product Title / Item Name *</span>
                <input
                  type="text"
                  placeholder="e.g. Bridal Golden Clutch, Leather Sling Handbag, or Dola Silk Saree"
                  value={newProductForm.name}
                  onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-700">Category</span>
                  <select
                    value={newProductForm.category}
                    onChange={e => {
                      const nextCat = e.target.value as ProductItem["category"];
                      const nextCodes = getNextCodesForCategory(nextCat, products);
                      setNewProductForm({
                        ...newProductForm,
                        category: nextCat,
                        sku: nextCodes.sku,
                        barcode: nextCodes.barcode,
                        sizes: nextCodes.defaultSizes,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs font-bold focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="kidswear">🧸 Kids Wear &amp; Ethnic (RJ-KID)</option>
                    <option value="handbags">👜 Handbags &amp; Purses (RJ-BAG)</option>
                    <option value="bangles">💫 Bangles &amp; Kada (RJ-BNG)</option>
                    <option value="earrings">💎 Earrings &amp; Jhumkas (RJ-EAR)</option>
                    <option value="sarees">🥻 Sarees (RJ-SAR)</option>
                    <option value="lehengas">👗 Lehengas &amp; Gowns (RJ-LHG)</option>
                    <option value="kurtis">👚 Kurtis &amp; Suits (RJ-KRT)</option>
                    <option value="jewellery">💍 Jewellery &amp; Sets (RJ-JWL)</option>
                    <option value="footwear">👠 Footwear &amp; Heels (RJ-FTW)</option>
                    <option value="cosmetics">💄 Cosmetics &amp; Beauty (RJ-COS)</option>
                    <option value="undergarments">👙 Undergarments &amp; Lingerie (RJ-UND)</option>
                    <option value="handloom">🧵 Handloom &amp; Bedsheets (RJ-HDL)</option>
                    <option value="parlour">✂️ Tailoring &amp; Services (RJ-SRV)</option>
                  </select>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">Stock Quantity (Pcs)</span>
                  <input
                    type="number"
                    value={newProductForm.stock}
                    onChange={e => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs font-bold focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="font-semibold text-slate-700">Cost Price (₹)</span>
                  <input
                    type="number"
                    value={newProductForm.purchaseCost}
                    onChange={e => {
                      const cost = Number(e.target.value);
                      setNewProductForm({
                        ...newProductForm,
                        purchaseCost: cost,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cost = Number(newProductForm.purchaseCost) || 0;
                      if (cost > 0) {
                        const sell = Math.round(cost * 1.5);
                        const mrp = Math.round(sell * 1.25);
                        setNewProductForm({ ...newProductForm, price: sell, mrp });
                      }
                    }}
                    className="mt-1 text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded font-bold cursor-pointer"
                  >
                    ⚡ Auto +50% Rate
                  </button>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Selling Price (₹) *</span>
                  <input
                    type="number"
                    value={newProductForm.price}
                    onChange={e => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs font-bold text-stone-950 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Printed MRP (₹)</span>
                  <input
                    type="number"
                    value={newProductForm.mrp}
                    onChange={e => setNewProductForm({ ...newProductForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div>
                  <span className="font-bold text-emerald-950">SKU Code (Auto-Filled)</span>
                  <input
                    type="text"
                    placeholder="e.g. RJ-BAG-001"
                    value={newProductForm.sku}
                    onChange={e => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl mt-1 text-xs font-mono font-bold text-stone-950 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <span className="font-bold text-emerald-950">Barcode Number (Auto-Filled)</span>
                  <input
                    type="text"
                    placeholder="e.g. 8906001"
                    value={newProductForm.barcode}
                    onChange={e => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl mt-1 text-xs font-mono font-bold text-stone-950 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Sizes / Variants (Comma separated)</span>
                <input
                  type="text"
                  placeholder="e.g. Standard, Party Clutch, Sling Bag"
                  value={(newProductForm.sizes || []).join(", ")}
                  onChange={e =>
                    setNewProductForm({
                      ...newProductForm,
                      sizes: e.target.value
                        .split(",")
                        .map(s => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Product Image (Website)</label>
                <div className="flex items-center gap-2 mt-1">
                  {newProductForm.imageUrl && (
                    <img 
                      src={newProductForm.imageUrl} 
                      alt="Preview" 
                      className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewProductForm({ ...newProductForm, imageUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowNewProductModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateProduct({ printBarcode: false })}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-900 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Save Only
              </button>
              <button
                onClick={() => handleCreateProduct({ printBarcode: true })}
                className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Save &amp; Print Barcode Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: QUICK MANUAL / UN-TAGGED ITEM TO BILL
          ========================================================= */}
      {showManualItemModal && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#14100d] via-[#211a15] to-[#14100d] text-white p-5 flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider font-serif">
                    Add Manual / No-Tag Item
                  </h3>
                  <p className="text-[11px] text-amber-300 font-medium">
                    Add any un-barcoded item, alteration, or custom accessory directly to bill
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualItemModal(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="bg-[#faf7f2] p-3 border-b border-stone-200/80">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                ⚡ Quick Presets (Click to autofill)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "Saree Fall & Pico", cat: "sarees", price: 80 },
                  { name: "Alteration / Fitting", cat: "kurtis", price: 100 },
                  { name: "Matching Latkan / Tassels", cat: "lehengas", price: 150 },
                  { name: "Matching Dupatta", cat: "kurtis", price: 250 },
                  { name: "Blouse Astaar / Lining", cat: "sarees", price: 120 },
                  { name: "Fancy Jewellery / Bangles", cat: "jewellery", price: 200 },
                  { name: "Hair Accessories / Pin", cat: "cosmetics", price: 60 },
                  { name: "Un-tagged Kurti / Top", cat: "kurtis", price: 499 },
                  { name: "Un-tagged Saree", cat: "sarees", price: 999 },
                  { name: "Kids Ethnic Wear", cat: "kidswear", price: 599 },
                  { name: "Handbag / Clutches", cat: "handbags", price: 350 },
                  { name: "Bridal Mehendi / Service", cat: "parlour", price: 500 }
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setManualItemForm({
                        ...manualItemForm,
                        name: preset.name,
                        category: preset.cat as any,
                        price: String(preset.price)
                      });
                    }}
                    className="text-[10.5px] px-2.5 py-1 bg-white hover:bg-amber-100 border border-stone-200 hover:border-amber-400 text-stone-700 hover:text-stone-950 font-bold rounded-lg cursor-pointer transition shadow-2xs"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddManualItemToCart} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Item Name */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Item Description / Name <span className="text-rose-600">*</span>
                </label>
                <input
                  ref={manualItemNameInputRef}
                  type="text"
                  required
                  placeholder="e.g. Matching Latkan, Extra Dupatta, Saree Fall & Pico..."
                  value={manualItemForm.name}
                  onChange={e => setManualItemForm({ ...manualItemForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              {/* Price, Quantity, Category in Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Price */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Price (₹) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="e.g. 250"
                      value={manualItemForm.price}
                      onChange={e => setManualItemForm({ ...manualItemForm, price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-black text-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={manualItemForm.quantity}
                    onChange={e => setManualItemForm({ ...manualItemForm, quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Category</label>
                  <select
                    value={manualItemForm.category}
                    onChange={e => setManualItemForm({ ...manualItemForm, category: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
                  >
                    <option value="sarees">👗 Sarees &amp; Falls</option>
                    <option value="lehengas">✨ Lehengas &amp; Latkans</option>
                    <option value="kurtis">👘 Kurtis &amp; Suits</option>
                    <option value="kidswear">👶 Kids Wear</option>
                    <option value="handbags">👜 Handbags &amp; Purses</option>
                    <option value="jewellery">💍 Jewellery &amp; Bangles</option>
                    <option value="cosmetics">💄 Cosmetics &amp; Pins</option>
                    <option value="undergarments">👙 Undergarments &amp; Lingerie</option>
                    <option value="parlour">💅 Parlour &amp; Stitching</option>
                    <option value="handloom">🧵 Handloom &amp; Fabrics</option>
                  </select>
                </div>
              </div>

              {/* Size / Variant / Note */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Size / Color / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Free Size, Golden, Red, Regular Fitting"
                  value={manualItemForm.size}
                  onChange={e => setManualItemForm({ ...manualItemForm, size: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Optional: Checkbox to save to catalog */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={manualItemForm.saveToCatalog}
                    onChange={e => setManualItemForm({ ...manualItemForm, saveToCatalog: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Also save this product into store catalog inventory</span>
                </label>
                <p className="text-[10px] text-stone-500 pl-5 mt-0.5">
                  Keep unchecked if this is a one-time bill item (like alteration or loose accessories).
                </p>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowManualItemModal(false)}
                  className="px-4 py-2.5 border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl font-bold text-xs hover:bg-stone-50 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-stone-950" />
                  <span>Add to Current Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: SUPABASE CLOUD DATABASE & LIVE BACKUP
          ========================================================= */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-950 text-base font-serif">Cloud Database &amp; Multi-Device Sync</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      supabaseConnected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                    }`}>
                      {supabaseConnected ? "● Connected (Live Sync)" : "● Offline Local Mode"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Powered by PostgreSQL (Supabase) for cloud backups, phone billing, and multi-counter sync.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sync status info banner */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${supabaseConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className="font-semibold text-stone-800">
                  {syncStatusText || (supabaseConnected ? "All data syncing to Supabase Cloud" : "Running on secure browser storage (159 items loaded)")}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">{products.length} Products in Catalog</span>
            </div>

            {/* Quick Answer: Should I create a Supabase Project? */}
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold">
                <Cloud className="w-4 h-4 text-amber-700" />
                <span>Supabase Setup Guide for Rajnandini</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                <strong>Haan! Supabase me free project banana bilkul best hai.</strong> Isse shop owner laptop band hone par bhi phone ya kisi doosre computer se real-time stock, bills, aur Udhaar (Khata) check kar sakte hain.
              </p>
            </div>

            {/* 3 Step Setup Guide */}
            <div className="mt-4 space-y-3 text-xs">
              <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-slate-400">
                Easy 3-Step Setup Instructions:
              </h4>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <div>
                  <p className="font-bold text-stone-900">Create Free Supabase Project</p>
                  <p className="text-slate-500 text-[11px]">Go to <span className="font-mono text-amber-700">supabase.com</span>, sign in and click <strong>New Project</strong> (e.g. name it <code>rajnandini-pos</code>).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <div className="flex-1">
                  <p className="font-bold text-stone-900">Run the Database Schema</p>
                  <p className="text-slate-500 text-[11px]">In Supabase Dashboard, open <strong>SQL Editor</strong>, paste and run the provided file: <code className="font-mono text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">supabase-schema.sql</code>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <div className="flex-1">
                  <p className="font-bold text-stone-900">Add Keys to .env.local</p>
                  <p className="text-slate-500 text-[11px]">Under Project Settings → API, copy your Project URL &amp; Anon Key into your <code className="bg-slate-100 px-1 py-0.5 rounded">.env.local</code> file:</p>
                  <pre className="mt-1.5 p-2 bg-stone-900 text-amber-200 rounded-lg font-mono text-[10px] overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReloadWholesaleInventory}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-stone-800 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                  <span>Reset 159 Bill Items</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePushToSupabase}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isSyncing ? "Syncing..." : "Push 159 Items to Supabase"}</span>
                </button>
                <button
                  onClick={() => setShowDbModal(false)}
                  className="px-4 py-2 bg-stone-950 hover:bg-stone-900 text-amber-300 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: QUICK RESTOCK PRODUCT
          ========================================================= */}
      {quickRestockProduct && (
        <div className="no-print fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Flame className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-stone-900 text-base">
                    Quick Restock Inventory
                  </h3>
                  <p className="text-[11px] text-stone-500 font-mono">
                    SKU: {quickRestockProduct.sku}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickRestockProduct(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary */}
            <div className="mt-4 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
              <p className="font-extrabold text-stone-900 text-xs line-clamp-1">{quickRestockProduct.name}</p>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-stone-500">Current Stock:</span>
                <span className={`font-mono font-black ${Number(quickRestockProduct.stock) <= 0 ? "text-rose-600" : "text-stone-900"}`}>
                  {quickRestockProduct.stock} pcs
                </span>
              </div>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Quantity to Add (+ pcs)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quickRestockQty}
                    onChange={e => setQuickRestockQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base font-black text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    autoFocus
                  />
                </div>

                {/* Preset quick buttons */}
                <div className="flex items-center gap-2 mt-2">
                  {[2, 5, 10, 20, 50].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setQuickRestockQty(qty)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        quickRestockQty === qty
                          ? "bg-amber-500 text-stone-950 border-amber-600 shadow-xs"
                          : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
                      }`}
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Preview */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800">New Total Stock Preview:</span>
                <span className="font-mono font-black text-emerald-900 text-base">
                  {(Number(quickRestockProduct.stock) || 0) + (Number(quickRestockQty) || 0)} pcs
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setQuickRestockProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer transition uppercase tracking-wider"
                >
                  Confirm &amp; Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingPriceProduct && (
        <div className="no-print fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-stone-950 text-base font-serif flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>Update Price &amp; Festival Offer</span>
                </h3>
                <p className="text-xs font-semibold text-stone-900 mt-1 line-clamp-1">
                  {editingPriceProduct.name}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Barcode: <strong className="text-stone-900">{editingPriceProduct.barcode}</strong> · SKU: {editingPriceProduct.sku}
                </p>
              </div>
              <button
                onClick={() => setEditingPriceProduct(null)}
                className="p-1 text-slate-400 hover:text-stone-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation box answering user's question directly */}
            <div className="my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Physical Barcode Tag Reprint Karne Ki Zaroorat Nahi Hai!
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Aap kapde par jo barcode sticker laga chuke hain, usme sirf code (<strong>{editingPriceProduct.barcode}</strong>) scan hota hai. Naya price save karte hi scanner gun counter par automatically naye rate par bill karegi!
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3 text-xs">
              {/* Cost vs Selling */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Wholesale Cost Price</span>
                  <span className="text-sm font-bold text-stone-900">₹{editingPriceProduct.purchaseCost || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Current Selling Rate</span>
                  <span className="text-sm font-bold text-amber-700">₹{editingPriceProduct.price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Quick Offer Buttons */}
              <div>
                <span className="font-semibold text-slate-700 block mb-1.5">Quick Festival Offer Preset:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const disc = Math.round(editingPriceProduct.price * 0.90);
                      setNewSellingPrice(disc);
                      setNewOfferBadge("Festival 10% Off");
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    🎉 10% Off
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const disc = Math.round(editingPriceProduct.price * 0.85);
                      setNewSellingPrice(disc);
                      setNewOfferBadge("Special 15% Off");
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    🔥 15% Off
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const disc = Math.max(editingPriceProduct.purchaseCost || 0, editingPriceProduct.price - 200);
                      setNewSellingPrice(disc);
                      setNewOfferBadge("Flat ₹200 Off");
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    🏷️ Flat ₹200 Off
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSellingPrice(editingPriceProduct.price);
                      setNewOfferBadge("");
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-stone-700 rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Price & MRP Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-700">New Selling Rate (₹) *</span>
                  <input
                    type="number"
                    min="1"
                    value={newSellingPrice}
                    onChange={e => setNewSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl mt-1 text-sm font-bold text-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Printed MRP (₹)</span>
                  <input
                    type="number"
                    min="1"
                    value={newMrpPrice}
                    onChange={e => setNewMrpPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl mt-1 text-sm font-bold text-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Offer Badge & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-700">Festival Badge / Tag</span>
                  <input
                    type="text"
                    placeholder="e.g. Karva Chauth Special"
                    value={newOfferBadge}
                    onChange={e => setNewOfferBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl mt-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Stock Qty (Pieces)</span>
                  <input
                    type="number"
                    min="0"
                    value={newStockQty}
                    onChange={e => setNewStockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl mt-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Live Profit Margin Calculation */}
              {editingPriceProduct.purchaseCost > 0 && (
                <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] flex justify-between items-center font-bold">
                  <span className="text-amber-950">New Profit per Piece:</span>
                  <span className={newSellingPrice - editingPriceProduct.purchaseCost < 0 ? "text-rose-600" : "text-emerald-700"}>
                    ₹{(newSellingPrice - editingPriceProduct.purchaseCost).toLocaleString("en-IN")} ({Math.round(((newSellingPrice - editingPriceProduct.purchaseCost) / editingPriceProduct.purchaseCost) * 100)}% Margin)
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingPriceProduct(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProductPriceChange}
                className="px-5 py-2 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
              >
                Save &amp; Update Barcode Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          OWNER SECURITY & DYNAMIC OTP VERIFICATION MODAL
          ========================================================= */}
      {showOwnerAuthModal && ownerAuthDetails && (
        <div className="no-print fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Rajnandini Security Desk
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Protected Action
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base font-serif">
                    Owner Authorization Required
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOwnerAuthModal(false);
                  setOwnerAuthDetails(null);
                  setActiveRequestId(null);
                  setIsWaitingRemoteApproval(false);
                  setOwnerAuthError("");
                }}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-4 text-xs relative z-10">
              {/* Context Summary Box */}
              <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 font-medium">Action:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {ownerAuthDetails.actionType === "stock_change"
                      ? "Stock Adjustment"
                      : ownerAuthDetails.actionType === "price_change"
                      ? "Price Revision"
                      : ownerAuthDetails.actionType === "product_delete"
                      ? "Delete Product"
                      : ownerAuthDetails.actionType === "bill_edit"
                      ? "Modify Completed Bill"
                      : ownerAuthDetails.actionType === "bill_delete"
                      ? "Delete Bill Record"
                      : ownerAuthDetails.actionType === "bill_amount_change"
                      ? "Bill Amount Change"
                      : "Product Edit"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">
                    {ownerAuthDetails.actionType.startsWith("bill_") ? "Bill Details" : "Product"}
                  </span>
                  <p className="text-white font-bold text-sm">
                    {ownerAuthDetails.productName}
                  </p>
                  <p className="text-[11px] font-mono text-stone-400">
                    {ownerAuthDetails.actionType.startsWith("bill_") ? `Bill Ref: ${ownerAuthDetails.sku}` : `SKU: ${ownerAuthDetails.sku}`}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-800/80">
                  <div className="text-stone-400 text-[11px]">
                    Current: <strong className="text-stone-200 line-through">{ownerAuthDetails.oldValue}</strong>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  <div className="text-emerald-400 font-bold text-[11px]">
                    New: {ownerAuthDetails.newValue}
                  </div>
                </div>
              </div>

              {/* Staff Reason & Staff Name Inputs */}
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1">
                    Reason for Modification (Staff Reason) *
                  </label>
                  <input
                    type="text"
                    value={ownerAuthReason}
                    onChange={(e) => {
                      setOwnerAuthReason(e.target.value);
                      setOwnerAuthError("");
                    }}
                    placeholder="e.g. Physical stock count check, damaged piece return, discount approved"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    Staff Name / Counter Person
                  </label>
                  <input
                    type="text"
                    value={ownerAuthStaffName}
                    onChange={(e) => setOwnerAuthStaffName(e.target.value)}
                    placeholder="e.g. Pooja / Riya / Counter Staff"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-hidden focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Error Message */}
              {ownerAuthError && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{ownerAuthError}</span>
                </div>
              )}

              {/* SOLUTION 1: REAL-TIME REMOTE OWNER APPROVAL */}
              <div className="space-y-3 pt-2">
                {isWaitingRemoteApproval ? (
                  <div className="p-5 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 text-center space-y-3 animate-in fade-in">
                    <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                        <span>Approval Request Sent to Indu ji!</span>
                      </h4>
                      <p className="text-xs text-amber-300/90 mt-1 max-w-sm mx-auto leading-relaxed">
                        Indu ji ke phone (<span className="text-amber-200 font-mono font-bold">+91 7464987898</span>) par notification chala gaya hai. Phone par <strong>[Approve]</strong> karte hi screen apne aap unlock ho kar save ho jayegi.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[11px] text-stone-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Cloud Sync Waiting for Owner...</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendRemoteRequest}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                  >
                    <Send className="w-4 h-4" />
                    <span>📲 Send Approval Request to Owner's Phone (+91 7464987898)</span>
                  </button>
                )}

                {/* Counter OTP / Master PIN Unlock */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-stone-950 to-stone-900 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Enter 6-Digit Code from Phone OR Master PIN</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">Instant Unlock</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={10}
                      value={ownerOtpInput}
                      onChange={(e) => {
                        setOwnerOtpInput(e.target.value);
                        setOwnerAuthError("");
                      }}
                      placeholder="e.g. 884655 or 7898"
                      className="flex-1 px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-white font-mono font-black text-center text-base tracking-widest focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOwnerOtp}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/20 whitespace-nowrap"
                    >
                      Verify &amp; Unlock
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400 text-center">
                    👉 Phone screen par dikh raha 6-digit OTP ya Master PIN (<strong className="text-amber-300">7898</strong>) daal kar Unlock karein.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* Customer Product Exchange & Replacement Studio Modal */}
      {showExchangeModal && (
        <ExchangeModal
          isOpen={showExchangeModal}
          onClose={() => {
            setShowExchangeModal(false);
            setExchangePreselectedBill(null);
          }}
          completedBills={completedBills}
          products={products}
          preselectedBill={exchangePreselectedBill}
          onExchangeCompleted={handleExchangeCompleted}
        />
      )}
</div>
  );
}
