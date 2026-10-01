"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Sparkles,
  ShoppingBag,
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
  Layers
} from "lucide-react";
import { ProductItem, CartItem, CustomerInfo, AlterationDetail, CompletedBill, ProductCategory } from "@/types/pos";
import { INITIAL_PRODUCTS, STAFF_BEAUTICIANS, TAILOR_NAMES } from "@/lib/sampleInventory";
import { SupabaseService, isSupabaseConfigured } from "@/lib/supabaseClient";
import BarcodeSheetModal from "@/components/BarcodeSheetModal";

const INVENTORY_DATA_VERSION = "rajnandni_inventory_v3_wholesale_bills";
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
  const [activeTab, setActiveTab] = useState<"pos" | "inventory" | "alterations" | "reports">("pos");
  
  // Inventory state
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [inventoryCategory, setInventoryCategory] = useState<ProductCategory>("all");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo>({ name: "", phone: "", notes: "" });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("Owner Approved");
  const [agreedDealPrice, setAgreedDealPrice] = useState<string>("");
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [tempItemPrice, setTempItemPrice] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "khata">("upi");
  
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

  // Modals & Popups
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState<boolean>(false);
  const [lastBill, setLastBill] = useState<CompletedBill | null>(null);
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
    sizes: ["M", "L", "XL"]
  });

  // Barcode quick scan input
  const barcodeInputRef = useRef<HTMLInputElement>(null);

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

  // Load local storage & sync on mount (100% Lossless Merge — Never overwrites user-added items)
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(POS_AUTH_STORAGE_KEY);
      if (savedAuth === "authenticated_indu123") {
        setIsAuthenticated(true);
      }
      setAuthChecked(true);

      const savedProdsRaw = localStorage.getItem("rajnandni_products");
      const savedCustomRaw = localStorage.getItem("rajnandni_custom_items");

      const savedProds: ProductItem[] = savedProdsRaw ? JSON.parse(savedProdsRaw) : [];
      const savedCustom: ProductItem[] = savedCustomRaw ? JSON.parse(savedCustomRaw) : [];

      // Always keep user's custom added items at the top + existing saved products + initial 159 products
      const localMerged = mergeProductLists(
        [...savedCustom, ...(Array.isArray(savedProds) ? savedProds : [])],
        INITIAL_PRODUCTS
      );

      setProducts(localMerged);
      localStorage.setItem("rajnandni_products", JSON.stringify(localMerged));
      localStorage.setItem("rajnandni_data_version", INVENTORY_DATA_VERSION);

      const savedBills = localStorage.getItem("rajnandni_bills");
      if (savedBills) setCompletedBills(JSON.parse(savedBills));

      const savedAlts = localStorage.getItem("rajnandni_alterations");
      if (savedAlts) setAlterationsList(JSON.parse(savedAlts));

      // Check Supabase connection & merge (NEVER overwrite local items!)
      if (isSupabaseConfigured()) {
        setSupabaseConnected(true);
        SupabaseService.fetchProducts().then((remoteProds) => {
          if (remoteProds && remoteProds.length > 0) {
            // Read latest localStorage in case user added items while fetch was running
            const latestLocalRaw = localStorage.getItem("rajnandni_products");
            const latestCustomRaw = localStorage.getItem("rajnandni_custom_items");
            const latestLocal: ProductItem[] = latestLocalRaw ? JSON.parse(latestLocalRaw) : localMerged;
            const latestCustom: ProductItem[] = latestCustomRaw ? JSON.parse(latestCustomRaw) : savedCustom;

            // Keep all custom/local items + merge remote items
            const finalMerged = mergeProductLists([...latestCustom, ...latestLocal], remoteProds);
            setProducts(finalMerged);
            localStorage.setItem("rajnandni_products", JSON.stringify(finalMerged));

            // Push any local items that are missing in Supabase up to the cloud automatically
            const remoteSkus = new Set(remoteProds.map(r => r.sku));
            const unsyncedLocal = finalMerged.filter(p => !remoteSkus.has(p.sku));
            if (unsyncedLocal.length > 0) {
              SupabaseService.syncInitialProducts(unsyncedLocal).catch(() => {});
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

  // Force re-load 159 products from purchase bills (while preserving custom user-added items!)
  const handleReloadWholesaleInventory = () => {
    if (confirm("Refresh the 159 supplier bill items? (Your custom added items like Handbags will remain safe!)")) {
      const savedCustomRaw = localStorage.getItem("rajnandni_custom_items");
      const savedCustom: ProductItem[] = savedCustomRaw ? JSON.parse(savedCustomRaw) : [];
      const merged = mergeProductLists(savedCustom, INITIAL_PRODUCTS);
      saveProductsLocally(merged);
      localStorage.setItem("rajnandni_data_version", INVENTORY_DATA_VERSION);
      if (isSupabaseConfigured()) {
        SupabaseService.syncInitialProducts(merged);
      }
      alert(`✅ Inventory refreshed! All ${merged.length} items (including your custom items) are safe.`);
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

  // Save changes (saves both full catalog AND dedicated custom items backup so nothing is ever lost)
  const saveProductsLocally = (items: ProductItem[]) => {
    setProducts(items);
    localStorage.setItem("rajnandni_products", JSON.stringify(items));
    const initialSkus = new Set(INITIAL_PRODUCTS.map(ip => ip.sku));
    const customOnly = items.filter(p => !initialSkus.has(p.sku));
    localStorage.setItem("rajnandni_custom_items", JSON.stringify(customOnly));
  };

  const saveBillsLocally = (bills: CompletedBill[]) => {
    setCompletedBills(bills);
    localStorage.setItem("rajnandni_bills", JSON.stringify(bills));
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

    const updatedList = products.map(p => {
      if (p.id === editingPriceProduct.id) {
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

    // Sync to Supabase cloud in background
    if (isSupabaseConfigured()) {
      SupabaseService.updateProductPrice(
        editingPriceProduct.sku,
        updatedPrice,
        updatedMrp > 0 ? updatedMrp : Math.round(updatedPrice * 1.25),
        newOfferBadge.trim() || undefined
      ).catch(e => console.warn("Supabase update price warning:", e));
    }

    alert(`✅ Price updated! Barcode (${editingPriceProduct.barcode}) will now automatically scan at ₹${updatedPrice.toLocaleString("en-IN")}. Physical tag reprint NOT needed!`);
    setEditingPriceProduct(null);
  };

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

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      p.name.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q) || 
      p.barcode.includes(q);
    return matchesCat && matchesSearch;
  });

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

  // Complete Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const billNumber = `RJN-${new Date().getFullYear()}-${String(completedBills.length + 101).padStart(4, "0")}`;
    const newBill: CompletedBill = {
      id: `bill-${Date.now()}`,
      billNo: billNumber,
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
      createdAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      alteration: alterationEnabled ? { ...alterationData, required: true } : undefined
    };

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
    const nextBills = [newBill, ...completedBills];
    saveBillsLocally(nextBills);

    // If Supabase configured, push sale to cloud
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
          status: "Received" as const
        },
        ...alterationsList
      ];
      saveAlterationsLocally(nextAlts);
    }

    setLastBill(newBill);
    setShowCheckoutSuccess(true);

    // Reset Cart
    setCart([]);
    setCustomer({ name: "", phone: "", notes: "" });
    setDiscountAmount(0);
    setAgreedDealPrice("");
    setEditingPriceIdx(null);
    setAlterationEnabled(false);
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
Near PSC Petropump, Ranipur, Haridwar
GSTIN: 05GNZPS9902M1ZR
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
    const msg = `🌸 *RAJNANDINI - ALTERATION READY* 🌸\n\nNamaste ${name || "Ma'am"} ji! 🙏\n\nAapka garment (*${alt.garmentName}*) alteration & fitting ke baad ready hai. Aap store aakar trial le sakte hain.\n\n📍 *Rajnandini (Darshan Enterprises)*\nNear PSC Petropump, Ranipur, Haridwar - 249401\n📞 Support: +91 98970 00000`;
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
      jewellery: { skuPrefix: "RJ-JWL", barcodeBase: 8904000, defaultSizes: ["Standard Set"] },
      footwear: { skuPrefix: "RJ-FTW", barcodeBase: 8905000, defaultSizes: ["37", "38", "39", "40"] },
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
  const handleCreateProduct = async () => {
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
      id: newId,
      name: newProductForm.name.trim(),
      category: cat,
      price: Number(newProductForm.price) || 0,
      mrp: Number(newProductForm.mrp) || Number(newProductForm.price) || 0,
      purchaseCost: Number(newProductForm.purchaseCost) || 0,
      stock: Number(newProductForm.stock) || 1,
      sku: generatedSku,
      barcode: generatedBarcode,
      sizes: newProductForm.sizes && newProductForm.sizes.length > 0 ? newProductForm.sizes : autoCodes.defaultSizes,
      isService: cat === "parlour"
    };

    const nextList = [prod, ...products];
    saveProductsLocally(nextList);

    // Also sync to Supabase Cloud so new items stay permanently saved
    if (isSupabaseConfigured()) {
      SupabaseService.syncInitialProducts([prod]).catch(err => {
        console.warn("Supabase new item sync notice:", err);
      });
    }

    setShowNewProductModal(false);
  };

  // Helper for category visual theme (luxury accent colors & icons)
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "sarees":
        return { icon: "🥻", label: "Royal Sarees", strip: "from-indigo-600 via-violet-600 to-purple-600", badge: "bg-indigo-50 text-indigo-900 border-indigo-200" };
      case "lehengas":
        return { icon: "👗", label: "Bridal & Lehengas", strip: "from-rose-600 via-crimson-600 to-pink-600", badge: "bg-rose-50 text-rose-900 border-rose-200" };
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
      default:
        return { icon: "✂️", label: "Tailoring & Fitting", strip: "from-stone-700 via-stone-600 to-amber-700", badge: "bg-stone-100 text-stone-800 border-stone-300" };
    }
  };

  // Filtered products for Inventory Tab
  const filteredInventoryProducts = products.filter(p => {
    const matchesCat = inventoryCategory === "all" || p.category === inventoryCategory;
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return matchesCat;
    return (
      matchesCat &&
      (p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q))
    );
  });

  // Inventory Valuation Metrics
  const totalPhysicalPieces = products.filter(p => !p.isService).reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalRetailStockValue = products.filter(p => !p.isService).reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);
  const totalCostStockValue = products.filter(p => !p.isService).reduce((sum, p) => sum + (Number(p.purchaseCost) || 0) * (Number(p.stock) || 0), 0);
  const totalTodayRevenue = completedBills.reduce((s, b) => s + b.grandTotal, 0);

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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-[1.5px] shadow-xl shadow-amber-500/25">
                <div className="w-full h-full bg-[#120e0c] rounded-[14px] flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-400" />
                </div>
              </div>
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
              Near PSC Petropump, Ranipur, Haridwar - 249401
              <br />
              <span className="font-mono text-amber-200/80">GSTIN: 05GNZPS9902M1ZR</span>
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
    <div className="min-h-screen print:min-h-0 print:h-auto print:block showroom-canvas-bg print:bg-white text-stone-900 flex flex-col font-sans">
      {/* =========================================================
          TOP LUXURY OBSIDIAN & CHAMPAGNE GOLD COMMAND HEADER
          ========================================================= */}
      {/* MAIN SCREEN INTERACTIVE UI (HIDDEN DURING PRINTING) */}
      <div className="no-print flex-1 flex flex-col">
        <header className="bg-gradient-to-r from-[#0d0a08] via-[#17120e] to-[#0d0a08] text-white shadow-xl border-b border-amber-500/30 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 relative">
          {/* Subtle top gold highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Left: Brand Monogram & Showroom Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-[1.5px] shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-[#120e0c] rounded-[14px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black tracking-[0.14em] bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent uppercase font-serif">
                  RAJNANDINI
                </h1>
                <span className="text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Darshan Enterprises
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-medium flex items-center gap-1.5">
                <span>Near PSC Petropump, Ranipur, Haridwar - 249401</span>
                <span className="text-amber-500/60">•</span>
                <span className="font-mono text-amber-300/90">GSTIN: 05GNZPS9902M1ZR</span>
              </p>
            </div>
          </div>

          {/* Center: Executive Pill Navigation Tabs with Live Badges */}
          <div className="flex items-center bg-[#090706]/90 p-1 rounded-2xl border border-amber-500/20 text-xs shadow-inner">
            <button
              onClick={() => setActiveTab("pos")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
                activeTab === "pos"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20"
                  : "text-stone-300 hover:text-amber-200 hover:bg-stone-900"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>POS Billing</span>
              {cart.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === "pos" ? "bg-stone-950 text-amber-300" : "bg-amber-400 text-stone-950"
                }`}>
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20"
                  : "text-stone-300 hover:text-amber-200 hover:bg-stone-900"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Inventory &amp; Barcodes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "inventory" ? "bg-stone-950/20 text-stone-950" : "bg-stone-800 text-amber-300"
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("alterations")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition cursor-pointer relative ${
                activeTab === "alterations"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20"
                  : "text-stone-300 hover:text-amber-200 hover:bg-stone-900"
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Alteration Desk</span>
              {alterationsList.filter(a => a.status !== "Delivered").length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === "alterations" ? "bg-stone-950 text-amber-300" : "bg-rose-500 text-white animate-pulse"
                }`}>
                  {alterationsList.filter(a => a.status !== "Delivered").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
                activeTab === "reports"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20"
                  : "text-stone-300 hover:text-amber-200 hover:bg-stone-900"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Daily Sales</span>
              {completedBills.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === "reports" ? "bg-stone-950/20 text-stone-950" : "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                }`}>
                  {completedBills.length}
                </span>
              )}
            </button>
          </div>

          {/* Right: Cloud Sync + Live Revenue Pill + Lock Terminal */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowDbModal(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                supabaseConnected
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                  : "bg-[#120e0c] border-amber-500/25 text-stone-300 hover:border-amber-400/50 hover:text-white"
              }`}
              title="Database & Supabase Cloud Sync"
            >
              <Database className={`w-3.5 h-3.5 ${supabaseConnected ? "text-emerald-400" : "text-amber-400"}`} />
              <span className="hidden xl:inline">
                {supabaseConnected ? "Cloud Live" : "Cloud DB"}
              </span>
              <span className={`w-2 h-2 rounded-full ${supabaseConnected ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
            </button>

            <div className="hidden lg:flex items-center gap-3.5 bg-[#090706]/90 border border-amber-500/20 px-3.5 py-1.5 rounded-xl">
              <div className="text-right">
                <span className="text-[9.5px] text-stone-400 uppercase font-bold tracking-wider block">Today's Collection</span>
                <p className="text-sm font-black text-amber-400 font-mono">
                  ₹{totalTodayRevenue.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="h-6 w-px bg-stone-800" />
              <div className="text-right">
                <span className="text-[9.5px] text-stone-400 uppercase font-bold tracking-wider block">Bills</span>
                <p className="text-sm font-black text-white font-mono">{completedBills.length}</p>
              </div>
            </div>

            <button
              onClick={handleLogoutLock}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#120e0c] hover:bg-rose-950/90 border border-stone-800 hover:border-rose-500/50 text-stone-300 hover:text-rose-200 text-xs font-bold transition cursor-pointer"
              title="Lock POS Screen (Require Password)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </header>

        {/* =========================================================
            TAB 1: POS BILLING COUNTER (SHOWROOM CATALOG + VIP CART)
            ========================================================= */}
        {activeTab === "pos" && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-66px)]">
            {/* LEFT: SHOWROOM CATALOG & LASER BARCODE SCANNER BAR */}
            <div className="flex-1 flex flex-col p-4 overflow-y-auto border-r border-stone-200/80">
              {/* Top Command Bar: Barcode Gun Scanner Input + Quick Add Item */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <div className="relative flex-1 group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <ScanLine className="w-4 h-4 text-amber-600 group-focus-within:text-amber-500 transition" />
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan Barcode Gun or search Saree, Lehenga, Handbag, SKU (Press Enter)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    className="w-full pl-10 pr-36 py-3 bg-white border-2 border-stone-200/90 hover:border-amber-400/70 focus:border-amber-500 rounded-2xl text-sm font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-500/15 shadow-sm transition"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Scanner Ready
                    </span>
                  </div>
                </div>

                {/* Quick Add New Product / Handbag CTA */}
                <button
                  onClick={() => openNewProductModal(selectedCategory !== "all" ? selectedCategory : "handbags")}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#14100d] to-[#211a15] hover:from-stone-900 hover:to-stone-800 text-amber-300 border border-amber-500/40 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>+ Add New Item</span>
                </button>
              </div>

              {/* Luxury Category Showcase Pills with Live Counts */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
                {[
                  { id: "all", label: "All Collection", icon: "✨", count: products.length },
                  { id: "sarees", label: "Sarees", icon: "🥻", count: products.filter(p => p.category === "sarees").length },
                  { id: "lehengas", label: "Lehengas & Gowns", icon: "👗", count: products.filter(p => p.category === "lehengas").length },
                  { id: "kurtis", label: "Kurtis & Suits", icon: "👚", count: products.filter(p => p.category === "kurtis").length },
                  { id: "handbags", label: "Handbags & Purses", icon: "👜", count: products.filter(p => p.category === "handbags").length },
                  { id: "bangles", label: "Bangles & Kada", icon: "💫", count: products.filter(p => p.category === "bangles").length },
                  { id: "earrings", label: "Earrings & Jhumkas", icon: "💎", count: products.filter(p => p.category === "earrings").length },
                  { id: "jewellery", label: "Jewellery & Sets", icon: "💍", count: products.filter(p => p.category === "jewellery").length },
                  { id: "footwear", label: "Footwear", icon: "👠", count: products.filter(p => p.category === "footwear").length },
                  { id: "parlour", label: "Tailoring & Fitting", icon: "✂️", count: products.filter(p => p.category === "parlour").length }
                ].map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as ProductCategory)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? "bg-gradient-to-r from-[#14100d] to-[#241c16] text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/10 scale-[1.01]"
                          : "bg-white/90 text-stone-700 border-stone-200/90 hover:bg-amber-50/60 hover:border-amber-300 hover:text-stone-950"
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold ${
                          isActive
                            ? "bg-amber-400 text-stone-950"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Showroom Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white/70 rounded-3xl border border-dashed border-stone-300 p-10 text-center my-2">
                  <ShoppingBag className="w-12 h-12 text-stone-300 mb-2" />
                  <p className="text-sm font-bold text-stone-800">No matching designs found</p>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm">
                    Try clearing the search filter or click &ldquo;+ Add New Item&rdquo; to add a new Handbag, Saree, or Suit to the catalog.
                  </p>
                  <button
                    onClick={() => openNewProductModal(selectedCategory !== "all" ? selectedCategory : "handbags")}
                    className="mt-4 px-4 py-2 bg-stone-950 text-amber-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-stone-900 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Add New Product Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-6">
                  {filteredProducts.map(prod => {
                    const theme = getCategoryTheme(prod.category);
                    const discountPct = prod.mrp > prod.price ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0;

                    return (
                      <div
                        key={prod.id}
                        className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group hover:border-amber-400 overflow-hidden relative"
                      >
                        {/* Category Color Top Accent Strip */}
                        <div className={`h-1.5 w-full bg-gradient-to-r ${theme.strip}`} />

                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            {/* Top Meta Row: SKU + Offer/Discount + Stock */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="text-[10px] font-mono font-bold text-stone-700 bg-stone-100 border border-stone-200/80 px-2 py-0.5 rounded-md">
                                {prod.sku}
                              </span>

                              <div className="flex items-center gap-1">
                                {prod.badge ? (
                                  <span className="text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                    {prod.badge}
                                  </span>
                                ) : discountPct > 0 ? (
                                  <span className="text-[9.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                    {discountPct}% OFF
                                  </span>
                                ) : null}

                                {!prod.isService && (
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                      prod.stock <= 3
                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                        : "bg-stone-50 text-stone-600 border border-stone-200/70"
                                    }`}
                                  >
                                    {prod.stock} pc
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Product Title with Category Icon */}
                            <div className="flex items-start gap-1.5 mt-1">
                              <span className="text-sm shrink-0 mt-0.5" title={theme.label}>{theme.icon}</span>
                              <h3
                                onClick={() => handleAddToCart(prod)}
                                className="text-xs font-extrabold text-stone-900 line-clamp-2 leading-snug group-hover:text-amber-800 transition cursor-pointer"
                              >
                                {prod.name}
                              </h3>
                            </div>

                            {/* Quick Size / Variant Chips */}
                            {prod.sizes && prod.sizes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2.5">
                                {prod.sizes.slice(0, 3).map((sz, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleAddToCart(prod, sz)}
                                    className="text-[9.5px] px-2 py-0.5 bg-[#faf7f2] hover:bg-amber-400 text-stone-700 hover:text-stone-950 rounded-md border border-stone-200/90 hover:border-amber-500 font-semibold transition cursor-pointer"
                                  >
                                    + {sz}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Card Footer: Price + Quick Tag Print + Add to Bill */}
                          <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-black text-stone-950 font-mono">
                                  ₹{prod.price.toLocaleString("en-IN")}
                                </span>
                                {prod.mrp > prod.price && (
                                  <span className="text-[10px] text-stone-400 line-through font-mono">
                                    ₹{prod.mrp.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Direct Barcode Tag Print Button right on POS Card */}
                              <button
                                onClick={() => {
                                  setSelectedProductForBarcode(prod);
                                  setBarcodeStickerCount(4);
                                }}
                                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl transition cursor-pointer"
                                title="Print Barcode Sticker Tag"
                              >
                                <Tag className="w-3.5 h-3.5" />
                              </button>

                              {/* Add to Bill Button */}
                              <button
                                onClick={() => handleAddToCart(prod)}
                                className="px-3 py-1.5 bg-stone-950 hover:bg-amber-400 text-amber-300 hover:text-stone-950 border border-amber-500/30 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Add to Bill"
                              >
                                <Plus className="w-3.5 h-3.5" />
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

            {/* RIGHT: VIP SMART BILLING TERMINAL */}
            <div className="w-full lg:w-[440px] bg-white border-l border-stone-200/90 flex flex-col justify-between h-full shadow-2xl relative z-10">
              {/* Top Luxury Cart Header + Customer Details */}
              <div className="border-b border-stone-200">
                <div className="bg-gradient-to-r from-[#14100d] via-[#1f1813] to-[#14100d] text-white px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-widest font-serif text-amber-100">
                      VIP Billing Counter
                    </span>
                    <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                      {cart.reduce((s, i) => s + i.quantity, 0)} Pcs
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={() => setCart([])}
                      className="text-[11px] text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer font-semibold transition"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Bill
                    </button>
                  )}
                </div>

                {/* Customer Inputs */}
                <div className="p-3 bg-[#faf7f2] grid grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-amber-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customer.name}
                      onChange={e => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs font-semibold bg-white border border-stone-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="WhatsApp Mobile No"
                      value={customer.phone}
                      onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono font-semibold bg-white border border-stone-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cart Items Scroll Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-stone-50/40">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-inner">
                      <ShoppingBag className="w-8 h-8 text-amber-500/70" />
                    </div>
                    <p className="text-xs font-extrabold text-stone-700 uppercase tracking-wider">Ready for Next Bill</p>
                    <p className="text-[11px] text-stone-400 mt-1 max-w-[240px] leading-relaxed">
                      Scan any garment or handbag barcode with your laser gun, or click any item on the left.
                    </p>
                  </div>
                ) : (
                  cart.map((item, idx) => {
                    const origPrice = item.originalPrice || item.product.price;
                    const isDiscounted = item.price < origPrice;
                    const isCostLoss = !item.product.isService && item.price < item.product.purchaseCost;
                    const profitPerUnit = item.price - item.product.purchaseCost;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border transition text-xs ${
                          item.isNegotiated
                            ? "bg-gradient-to-r from-amber-50/80 to-white border-amber-300 shadow-xs"
                            : "bg-white border-stone-200/90 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-extrabold text-stone-900 truncate">{item.product.name}</p>
                              {item.isNegotiated && (
                                <span className="text-[9px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  🤝 Deal Rate
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[10.5px] text-stone-600 flex-wrap">
                              <span className="bg-stone-100 text-stone-800 border border-stone-200 px-1.5 py-0.2 rounded-md font-semibold">
                                {item.selectedSize || "Standard"}
                              </span>
                              {item.beauticianName && (
                                <span className="text-purple-700 italic">By: {item.beauticianName.split(" ")[0]}</span>
                              )}

                              {/* Unit Price display */}
                              <div className="flex items-center gap-1 font-mono">
                                {isDiscounted && (
                                  <span className="line-through text-stone-400">
                                    ₹{origPrice.toLocaleString("en-IN")}
                                  </span>
                                )}
                                <span className={`font-bold ${isDiscounted ? "text-emerald-700" : "text-stone-800"}`}>
                                  ₹{item.price.toLocaleString("en-IN")}/pc
                                </span>
                              </div>

                              {/* Inline Bargain / Negotiate Button */}
                              <button
                                onClick={() => {
                                  if (editingPriceIdx === idx) {
                                    setEditingPriceIdx(null);
                                  } else {
                                    startEditingItemPrice(idx, item.price);
                                  }
                                }}
                                className="text-[10px] font-bold text-amber-800 hover:text-stone-950 bg-amber-50 hover:bg-amber-200/70 px-1.5 py-0.5 rounded border border-amber-200/80 flex items-center gap-0.5 cursor-pointer transition"
                                title="Bargain / Negotiate unit price for this item"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>{editingPriceIdx === idx ? "Close" : "Bargain"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Quantity Stepper & Line Total */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center border border-stone-200 bg-stone-50 rounded-xl overflow-hidden">
                              <button
                                onClick={() => updateQuantity(idx, -1)}
                                className="p-1.5 text-stone-600 hover:bg-stone-200 hover:text-black cursor-pointer transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 font-mono font-extrabold text-xs text-stone-900">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(idx, 1)}
                                className="p-1.5 text-stone-600 hover:bg-stone-200 hover:text-black cursor-pointer transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right min-w-[60px] font-mono">
                              <span className="font-black text-stone-950 text-xs block">
                                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                              </span>
                              {isDiscounted && (
                                <span className="text-[9px] font-bold text-emerald-700 block">
                                  Save ₹{((origPrice - item.price) * item.quantity).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* INLINE NEGOTIATION / BARGAIN DRAWER FOR THIS ITEM */}
                        {editingPriceIdx === idx && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/80 bg-white p-2.5 rounded-xl text-xs space-y-1.5 shadow-inner">
                            <div className="flex items-center justify-between">
                              <span className="text-[10.5px] font-bold text-amber-950 flex items-center gap-1">
                                <Handshake className="w-3.5 h-3.5 text-amber-600" />
                                Set Customer Agreed Rate (Per Piece)
                              </span>
                              {item.isNegotiated && (
                                <button
                                  onClick={() => resetItemPrice(idx)}
                                  className="text-[10px] text-stone-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer font-semibold"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" /> Reset Rate
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1.5 text-stone-400 font-bold text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={tempItemPrice}
                                  onChange={e => setTempItemPrice(e.target.value)}
                                  className="w-full pl-6 pr-2 py-1 bg-stone-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                  placeholder="Agreed Rate"
                                  autoFocus
                                />
                              </div>
                              <button
                                onClick={() => saveNegotiatedItemPrice(idx)}
                                className="px-3 py-1 bg-stone-950 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-lg cursor-pointer transition"
                              >
                                Apply
                              </button>
                            </div>

                            {/* Wholesale Cost & Margin Protection Check */}
                            {!item.product.isService && (
                              <div className="flex items-center justify-between text-[9.5px] pt-0.5 font-mono">
                                <span className="text-stone-500">
                                  Cost: ₹{item.product.purchaseCost}
                                </span>
                                {isCostLoss ? (
                                  <span className="text-rose-600 font-bold">
                                    ⚠️ Below Cost (Loss: ₹{Math.abs(profitPerUnit)}/pc)
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-bold">
                                    Profit: ₹{profitPerUnit}/pc (+{Math.round((profitPerUnit / (item.product.purchaseCost || 1)) * 100)}%)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Checkout, Deal Desk & Payment Terminal */}
              <div className="p-3.5 border-t border-stone-200 bg-white space-y-2.5 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.08)]">
                {/* Alteration Toggle Checkbox */}
                <div className="bg-[#faf7f2] border border-stone-200/90 rounded-xl px-3 py-2">
                  <label className="flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={alterationEnabled}
                        onChange={e => setAlterationEnabled(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <Scissors className="w-3.5 h-3.5 text-amber-700" />
                      <span>Alteration / Fitting Required?</span>
                    </span>
                    {alterationEnabled && (
                      <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
                        Active
                      </span>
                    )}
                  </label>

                  {alterationEnabled && (
                    <div className="mt-2 pt-2 border-t border-stone-200 space-y-1.5 text-[11px]">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-stone-600 font-medium">Garment Name</span>
                          <input
                            type="text"
                            value={alterationData.garmentName}
                            onChange={e => setAlterationData({ ...alterationData, garmentName: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs"
                            placeholder="e.g. Bridal Lehenga"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-600 font-medium">Ready Date</span>
                          <input
                            type="date"
                            value={alterationData.readyDate}
                            onChange={e => setAlterationData({ ...alterationData, readyDate: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-600 font-medium">Measurements (Chest / Waist / Length)</span>
                        <input
                          type="text"
                          value={alterationData.fittingNotes}
                          onChange={e => setAlterationData({ ...alterationData, fittingNotes: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* CUSTOMER BARGAIN & DEAL DESK */}
                <div className="bg-gradient-to-br from-amber-50/90 via-[#fdfbf7] to-amber-50/50 border border-amber-300/80 rounded-2xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Handshake className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-extrabold text-stone-900">
                        Customer Bargain &amp; Deal Desk
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <button
                        onClick={() => {
                          setDiscountAmount(0);
                          setAgreedDealPrice("");
                        }}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer font-bold"
                      >
                        Reset Deal
                      </button>
                    )}
                  </div>

                  {/* Direct Agreed Deal Price & Reason */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-600 font-semibold">Final Agreed Deal (₹)</span>
                      <input
                        type="number"
                        min="0"
                        max={subtotal}
                        placeholder={`e.g. ₹${Math.floor(subtotal / 100) * 100}`}
                        value={agreedDealPrice}
                        onChange={e => handleAgreedDealPriceChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-black text-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-600 font-semibold">Deal Authorization</span>
                      <select
                        value={discountReason}
                        onChange={e => setDiscountReason(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
                      >
                        <option value="Owner Approved">👑 Owner / Madam Approved</option>
                        <option value="Regular Customer">⭐ Regular Loyal Customer</option>
                        <option value="Bulk Bridal Deal">👰 Bridal / Bulk Deal</option>
                        <option value="Rounding Off">🔄 Rounding Off Deal</option>
                        <option value="Seasonal Offer">🏷️ Festival Offer</option>
                        <option value="Fitting Adjustment">✂️ Fitting Adjustment</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Bargain Chips */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-amber-200/60 flex-wrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickRoundOff(50)}
                        className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-amber-100 text-stone-700 rounded-lg border border-stone-200 font-bold cursor-pointer transition"
                      >
                        Round ₹50
                      </button>
                      <button
                        onClick={() => handleQuickRoundOff(100)}
                        className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-amber-100 text-stone-700 rounded-lg border border-stone-200 font-bold cursor-pointer transition"
                      >
                        Round ₹100
                      </button>
                      <button
                        onClick={() => handleQuickRoundOff(500)}
                        className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-amber-100 text-stone-700 rounded-lg border border-stone-200 font-bold cursor-pointer transition"
                      >
                        Round ₹500
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickPercentDiscount(5)}
                        className="text-[9.5px] px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg font-extrabold cursor-pointer transition"
                      >
                        5%
                      </button>
                      <button
                        onClick={() => handleQuickPercentDiscount(10)}
                        className="text-[9.5px] px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg font-extrabold cursor-pointer transition"
                      >
                        10%
                      </button>
                      <button
                        onClick={() => handleQuickFlatDiscount(200)}
                        className="text-[9.5px] px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-lg font-extrabold cursor-pointer transition"
                      >
                        -₹200
                      </button>
                      <button
                        onClick={() => handleQuickFlatDiscount(500)}
                        className="text-[9.5px] px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-lg font-extrabold cursor-pointer transition"
                      >
                        -₹500
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment Mode Visual Tiles + Special Discount */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    <span>Select Payment Mode</span>
                    <span>Flat Discount: ₹{discountAmount || 0}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "upi", label: "UPI QR", icon: QrCode },
                      { id: "cash", label: "Cash", icon: Banknote },
                      { id: "card", label: "Card", icon: CreditCard },
                      { id: "khata", label: "Khata", icon: BookOpen }
                    ].map(pm => {
                      const IconComp = pm.icon;
                      const active = paymentMode === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMode(pm.id as any)}
                          className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition ${
                            active
                              ? "bg-stone-950 text-amber-300 border-amber-500/50 shadow-sm"
                              : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          <IconComp className={`w-3.5 h-3.5 ${active ? "text-amber-400" : "text-stone-500"}`} />
                          <span>{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Breakdown & Grand Total */}
                <div className="space-y-1 text-xs pt-1">
                  {catalogTotal > subtotal && (
                    <div className="flex justify-between text-stone-400 text-[11px] font-mono">
                      <span>Catalog MRP Total</span>
                      <span className="line-through">₹{catalogTotal.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600 font-semibold">
                    <span>Bill Subtotal</span>
                    <span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Special Deal Discount</span>
                      <span className="font-mono">- ₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {totalSavings > 0 && (
                    <div className="flex justify-between items-center text-amber-950 bg-gradient-to-r from-amber-100/90 to-amber-50 px-2.5 py-1 rounded-xl font-extrabold text-[11px] border border-amber-300/80">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Customer Saves Today:
                      </span>
                      <span className="font-mono">₹{totalSavings.toLocaleString("en-IN")} 🎉</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline text-base font-black text-stone-950 border-t border-stone-200 pt-1.5">
                    <span className="font-serif uppercase tracking-wide text-sm">Net Payable</span>
                    <span className="text-xl font-mono text-stone-950">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Primary Checkout CTA */}
                <button
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className="w-full py-3.5 bg-gradient-to-r from-[#120e0c] via-[#231b15] to-[#120e0c] hover:from-stone-900 hover:to-stone-800 disabled:opacity-40 text-amber-300 border border-amber-500/40 rounded-2xl font-black text-sm shadow-lg shadow-stone-950/15 transition cursor-pointer flex items-center justify-center gap-2 group uppercase tracking-wider"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Complete Bill &amp; Print · ₹{grandTotal.toLocaleString("en-IN")}</span>
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
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Executive Header & Action Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#14100d] via-[#1f1814] to-[#14100d] text-white p-6 rounded-3xl border border-amber-500/30 shadow-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400 block mb-1">
                    Showroom Stockroom &amp; Thermal Tag Studio
                  </span>
                  <h2 className="text-2xl font-black text-white font-serif tracking-wide">
                    Product Inventory &amp; Barcode Management
                  </h2>
                  <p className="text-xs text-stone-300 mt-1">
                    Add new Sarees, Lehengas, Suits, Handbags, Bangles, or Earrings — auto-generate SKU &amp; Barcodes and print 2-Across Thermal Tags.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleReloadWholesaleInventory}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-200 border border-stone-700 rounded-xl text-xs font-bold cursor-pointer transition"
                    title="Reload 159 items parsed from supplier wholesale bills"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sync 159 Supplier Items</span>
                  </button>
                  <button
                    onClick={() => setShowDbModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cloud Backup</span>
                  </button>
                  <button
                    onClick={() => openNewProductModal("handbags")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer transition uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4 text-stone-950" />
                    <span>+ Add New Product</span>
                  </button>
                </div>
              </div>

              {/* 4 Executive Stockroom KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">Catalog Designs</span>
                    <p className="text-2xl font-black text-stone-950 font-mono mt-0.5">{products.length}</p>
                    <span className="text-[10px] text-emerald-700 font-semibold">Active Barcoded SKUs</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">Total Showroom Stock</span>
                    <p className="text-2xl font-black text-stone-950 font-mono mt-0.5">{totalPhysicalPieces.toLocaleString("en-IN")} <span className="text-xs font-sans font-bold text-stone-500">pcs</span></p>
                    <span className="text-[10px] text-stone-500 font-semibold">Ready for Sale</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">Retail Stock Value</span>
                    <p className="text-2xl font-black text-stone-950 font-mono mt-0.5">₹{totalRetailStockValue.toLocaleString("en-IN")}</p>
                    <span className="text-[10px] text-amber-800 font-semibold">At Fixed Selling Price</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">Projected Margin</span>
                    <p className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                      ₹{Math.max(0, totalRetailStockValue - totalCostStockValue).toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-stone-500 font-semibold">
                      Cost: ₹{totalCostStockValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Search & Category Filter Bar inside Inventory */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search inventory by Product Name, SKU (e.g. RJ-BAG-001), or Barcode Number..."
                    value={inventorySearch}
                    onChange={e => setInventorySearch(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 bg-[#faf7f2] border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  {inventorySearch && (
                    <button
                      onClick={() => setInventorySearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: "all", label: "All" },
                    { id: "handbags", label: "👜 Handbags" },
                    { id: "bangles", label: "💫 Bangles" },
                    { id: "earrings", label: "💎 Earrings" },
                    { id: "sarees", label: "🥻 Sarees" },
                    { id: "lehengas", label: "👗 Lehengas" },
                    { id: "kurtis", label: "👚 Kurtis" },
                    { id: "jewellery", label: "💍 Jewellery" },
                    { id: "footwear", label: "👠 Footwear" }
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setInventoryCategory(c.id as ProductCategory)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition border ${
                        inventoryCategory === c.id
                          ? "bg-stone-950 text-amber-300 border-stone-950"
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-amber-50"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gradient-to-r from-stone-900 to-stone-950 text-amber-200 font-bold uppercase tracking-wider text-[10.5px]">
                      <tr>
                        <th className="px-4 py-3.5">SKU &amp; Barcode</th>
                        <th className="px-4 py-3.5">Product Title</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5">Sizes / Variants</th>
                        <th className="px-4 py-3.5">Cost Rate</th>
                        <th className="px-4 py-3.5">Fixed Price &amp; MRP</th>
                        <th className="px-4 py-3.5">Stock Qty</th>
                        <th className="px-4 py-3.5 text-right">Actions &amp; Thermal Tag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredInventoryProducts.map(p => {
                        const theme = getCategoryTheme(p.category);
                        return (
                          <tr key={p.id} className="hover:bg-amber-50/40 transition">
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-stone-950 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                {p.sku}
                              </span>
                              <p className="text-[10px] text-stone-500 font-mono mt-1">Barcode: {p.barcode}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-extrabold text-stone-900 text-xs">{p.name}</p>
                              {p.badge && (
                                <span className="inline-block mt-0.5 text-[9.5px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                                  ✨ {p.badge}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${theme.badge}`}>
                                <span>{theme.icon}</span>
                                <span>{p.category}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-stone-600 font-medium">
                              {p.sizes ? p.sizes.join(", ") : "Standard"}
                            </td>
                            <td className="px-4 py-3 font-mono text-stone-500">₹{(p.purchaseCost || 0).toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 font-mono">
                              <span className="font-black text-stone-950 text-sm">₹{p.price.toLocaleString("en-IN")}</span>
                              {p.mrp > p.price && (
                                <span className="text-[10px] text-stone-400 line-through block">MRP: ₹{p.mrp}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {p.isService ? (
                                <span className="text-purple-700 font-bold">Service</span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                  p.stock <= 3 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}>
                                  {p.stock} pcs
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditProductPrice(p)}
                                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1 border border-stone-200/80"
                                  title="Update price or add festival discount"
                                >
                                  <Edit3 className="w-3 h-3 text-stone-600" />
                                  <span>Edit Rate</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProductForBarcode(p);
                                    setBarcodeStickerCount(4);
                                  }}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-[#14100d] to-[#241c16] hover:from-amber-400 hover:to-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/30 font-extrabold rounded-xl text-[11px] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                >
                                  <Tag className="w-3 h-3" />
                                  <span>Print Tags</span>
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
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: ALTERATION & FITTING DESK
            ========================================================= */}
        {activeTab === "alterations" && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-[#14100d] via-[#1f1814] to-[#14100d] text-white p-6 rounded-3xl border border-amber-500/30 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400 block mb-1">
                    Bespoke Bridal &amp; Garment Fitting
                  </span>
                  <h2 className="text-2xl font-black text-white font-serif">Alteration &amp; Fitting Desk</h2>
                  <p className="text-xs text-stone-300 mt-1">
                    Track customer measurements, master tailor assignments, trial dates, and send 1-click WhatsApp pickup alerts.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 bg-stone-900/90 border border-amber-500/20 px-4 py-2.5 rounded-2xl">
                  <Scissors className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Pending Trials</span>
                    <span className="text-lg font-black text-white font-mono">
                      {alterationsList.filter(a => a.status !== "Delivered").length}
                    </span>
                  </div>
                </div>
              </div>

              {alterationsList.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-stone-400 shadow-xs">
                  <Scissors className="w-12 h-12 text-amber-500/60 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-800">No active alterations right now</p>
                  <p className="text-xs text-stone-500 mt-1">
                    When creating a bill on the POS tab, check &ldquo;Alteration / Fitting Required&rdquo; to record garment measurements and tailors.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alterationsList.map((alt, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm space-y-3 hover:border-amber-400 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-amber-600" />
                          {alt.garmentName}
                        </span>
                        <select
                          value={alt.status}
                          onChange={e => {
                            const next = [...alterationsList];
                            next[idx].status = e.target.value as any;
                            saveAlterationsLocally(next);
                          }}
                          className={`text-[10.5px] font-extrabold px-2.5 py-1 rounded-full border cursor-pointer ${
                            alt.status === "Ready for Trial"
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : alt.status === "Delivered"
                              ? "bg-stone-100 text-stone-700 border-stone-300"
                              : "bg-amber-100 text-amber-900 border-amber-300"
                          }`}
                        >
                          <option value="Received">Received</option>
                          <option value="In Alteration">In Alteration</option>
                          <option value="Ready for Trial">Ready for Trial</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>

                      <div className="bg-[#faf7f2] p-3 rounded-xl border border-stone-200/80 text-xs space-y-1.5">
                        <p className="font-bold text-stone-800">
                          Fitting Notes: <span className="font-medium text-stone-600">{alt.fittingNotes}</span>
                        </p>
                        <p className="font-bold text-stone-800">
                          Master Tailor: <span className="font-medium text-stone-600">{alt.tailorName}</span>
                        </p>
                        <p className="font-bold text-stone-800">
                          Trial / Delivery Date: <span className="font-bold text-amber-900 font-mono">{alt.readyDate}</span>
                        </p>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleSendAlterationReadyWhatsApp(alt, "9897000000", "Customer")}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Send WhatsApp &ldquo;Ready&rdquo; Alert</span>
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
            TAB 4: DAILY SALES & SETTLEMENT REPORT
            ========================================================= */}
        {activeTab === "reports" && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-[#14100d] via-[#1f1814] to-[#14100d] text-white p-6 rounded-3xl border border-amber-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400 block mb-1">
                    Executive Accounting &amp; Register
                  </span>
                  <h2 className="text-2xl font-black text-white font-serif">Daily Sales &amp; Settlement Report</h2>
                  <p className="text-xs text-stone-300 mt-1">
                    Complete breakdown of showroom revenue, UPI QR vs Cash collections, and digital PDF invoices.
                  </p>
                </div>
                <div className="bg-stone-900/90 border border-amber-500/30 px-4 py-2.5 rounded-2xl text-right">
                  <span className="text-[10px] text-amber-300 uppercase font-bold block">Total Register Collection</span>
                  <span className="text-xl font-black text-white font-mono">
                    ₹{totalTodayRevenue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Sales Revenue</span>
                  <p className="text-2xl font-black text-stone-950 font-mono mt-1">
                    ₹{totalTodayRevenue.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-stone-500 font-medium">{completedBills.length} Invoices Generated</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5" /> Cash In Drawer
                  </span>
                  <p className="text-2xl font-black text-stone-950 font-mono mt-1">
                    ₹{completedBills.filter(b => b.paymentMode === "cash").reduce((s, b) => s + b.grandTotal, 0).toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-medium">Physical Cash</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" /> UPI / PhonePe
                  </span>
                  <p className="text-2xl font-black text-stone-950 font-mono mt-1">
                    ₹{completedBills.filter(b => b.paymentMode === "upi").reduce((s, b) => s + b.grandTotal, 0).toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-purple-700 font-medium">Instant Bank Settlement</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Card &amp; Khata
                  </span>
                  <p className="text-2xl font-black text-stone-950 font-mono mt-1">
                    ₹{completedBills.filter(b => b.paymentMode === "card" || b.paymentMode === "khata").reduce((s, b) => s + b.grandTotal, 0).toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-amber-800 font-medium">POS Swipe / Ledger</span>
                </div>
              </div>

              {/* Recent Bills History Table */}
              <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-[#faf7f2]">
                  <h3 className="font-bold text-sm text-stone-900 font-serif uppercase tracking-wider">Completed Showroom Invoices</h3>
                  <span className="text-xs font-bold text-stone-600 bg-white px-3 py-1 rounded-full border border-stone-200">
                    {completedBills.length} Bill(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900 text-amber-200 font-bold uppercase text-[10.5px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Bill No &amp; Time</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Items Purchased</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3 text-right">Grand Total</th>
                        <th className="px-4 py-3 text-right">Invoice Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {completedBills.map(b => (
                        <tr key={b.id} className="hover:bg-amber-50/40 transition">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-stone-900">{b.billNo}</span>
                            <p className="text-[10px] text-stone-500">{b.createdAt}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-stone-900">{b.customer.name}</p>
                            <p className="text-[10px] text-stone-500 font-mono">{b.customer.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-stone-600 max-w-xs truncate font-medium">
                            {b.items.map(it => `${it.product.name} (x${it.quantity})`).join(", ")}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-0.5 bg-stone-100 text-stone-800 border border-stone-200 rounded-full font-bold text-[10px] uppercase">
                              {b.paymentMode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className="font-black text-stone-950 text-sm block">
                              ₹{b.grandTotal.toLocaleString("en-IN")}
                            </span>
                            {(b.totalSavings || b.discount) > 0 && (
                              <span className="text-[10px] text-emerald-700 font-bold block">
                                Saved: ₹{(b.totalSavings || b.discount).toLocaleString("en-IN")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => window.open(`/invoice?id=${b.billNo}`, "_blank")}
                                className="px-2.5 py-1 text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer font-bold text-[11px] flex items-center gap-1"
                                title="View / Download PDF Invoice"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-700" />
                                <span>PDF</span>
                              </button>
                              <button
                                onClick={() => handleSendWhatsAppBill(b)}
                                className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer font-bold text-[11px] flex items-center gap-1"
                                title="Send WhatsApp Bill"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                <p className="text-[9.5px] text-gray-500">Near PSC Petropump, Ranipur, Haridwar - 249401</p>
                <p className="text-[9.5px] font-semibold text-gray-700">GSTIN: 05GNZPS9902M1ZR</p>
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
                  <span>Print Slip</span>
                </button>

                <button
                  onClick={() => window.open(`/invoice?id=${lastBill.billNo}`, "_blank")}
                  className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Download PDF</span>
                </button>
              </div>

              <button
                onClick={() => handleSendWhatsAppBill(lastBill)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Send PDF &amp; Bill on WhatsApp</span>
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
          <div style={{ textAlign: "center", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "bold", margin: 0 }}>RAJNANDINI</h2>
            <p style={{ fontSize: "10px", fontWeight: "bold", margin: "1px 0" }}>Darshan Enterprises</p>
            <p style={{ fontSize: "8.5px", margin: "1px 0" }}>Near PSC Petropump, Ranipur, Haridwar - 249401</p>
            <p style={{ fontSize: "8.5px", fontWeight: "bold", margin: "1px 0" }}>GSTIN: 05GNZPS9902M1ZR · Ph: +91 98970 00000</p>
          </div>
          <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "3px 0", fontSize: "10px", margin: "4px 0" }}>
            <div>Bill No: {lastBill.billNo}</div>
            <div>Date: {lastBill.createdAt}</div>
            <div>Cust: {lastBill.customer.name} ({lastBill.customer.phone})</div>
          </div>
          <div style={{ margin: "4px 0" }}>
            {lastBill.items.map((it, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}>
                <span style={{ maxWidth: "65%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.quantity}x {it.product.name} ({it.selectedSize || "Std"})
                </span>
                <span>₹{(it.quantity * it.price).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed #000", paddingTop: "3px", fontSize: "11px", fontWeight: "bold" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal:</span>
              <span>₹{lastBill.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {lastBill.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                <span>Bargain Disc ({lastBill.discountReason || "Deal"}):</span>
                <span>-₹{lastBill.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "2px" }}>
              <span>TOTAL:</span>
              <span>₹{lastBill.grandTotal.toLocaleString("en-IN")}</span>
            </div>
            {(lastBill.totalSavings || lastBill.discount) > 0 && (
              <div style={{ textAlign: "center", fontSize: "10px", marginTop: "3px", fontWeight: "bold" }}>
                *** YOU SAVED ₹{(lastBill.totalSavings || lastBill.discount).toLocaleString("en-IN")} TODAY! ***
              </div>
            )}
            <div style={{ fontSize: "9px", marginTop: "2px" }}>Paid Via: {lastBill.paymentMode.toUpperCase()}</div>
          </div>

          {lastBill.alteration && (
            <div style={{ borderTop: "1px dashed #000", marginTop: "4px", paddingTop: "3px", fontSize: "9px" }}>
              <div style={{ fontWeight: "bold" }}>✂️ ALTERATION NOTE:</div>
              <div>Item: {lastBill.alteration.garmentName}</div>
              <div>Notes: {lastBill.alteration.fittingNotes}</div>
              <div>Ready: {lastBill.alteration.readyDate}</div>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "8px", fontSize: "9px", borderTop: "1px dashed #000", paddingTop: "4px" }}>
            Thank You! Visit Again 💖
            <br />
            Goods once sold will not be returned without bill.
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
                <h3 className="font-bold text-stone-900 font-serif text-lg">Add New Product / Handbag / Garment</h3>
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
                    <option value="handbags">👜 Handbags &amp; Purses (RJ-BAG)</option>
                    <option value="bangles">💫 Bangles &amp; Kada (RJ-BNG)</option>
                    <option value="earrings">💎 Earrings &amp; Jhumkas (RJ-EAR)</option>
                    <option value="sarees">🥻 Sarees (RJ-SAR)</option>
                    <option value="lehengas">👗 Lehengas &amp; Gowns (RJ-LHG)</option>
                    <option value="kurtis">👚 Kurtis &amp; Suits (RJ-KRT)</option>
                    <option value="jewellery">💍 Jewellery &amp; Sets (RJ-JWL)</option>
                    <option value="footwear">👠 Footwear &amp; Heels (RJ-FTW)</option>
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
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowNewProductModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProduct}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-900 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Save Only
              </button>
              <button
                onClick={async () => {
                  if (!newProductForm.name?.trim()) {
                    alert("Please enter Product Name first!");
                    return;
                  }
                  const cat = (newProductForm.category as ProductItem["category"]) || "handbags";
                  const autoCodes = getNextCodesForCategory(cat, products);
                  const prod: ProductItem = {
                    id: `prod-${Date.now()}`,
                    name: newProductForm.name.trim(),
                    category: cat,
                    price: Number(newProductForm.price) || 0,
                    mrp: Number(newProductForm.mrp) || Number(newProductForm.price) || 0,
                    purchaseCost: Number(newProductForm.purchaseCost) || 0,
                    stock: Number(newProductForm.stock) || 1,
                    sku: newProductForm.sku?.trim() || autoCodes.sku,
                    barcode: newProductForm.barcode?.trim() || autoCodes.barcode,
                    sizes: newProductForm.sizes && newProductForm.sizes.length > 0 ? newProductForm.sizes : autoCodes.defaultSizes,
                    isService: cat === "parlour",
                  };
                  const nextList = [prod, ...products];
                  saveProductsLocally(nextList);
                  if (isSupabaseConfigured()) {
                    SupabaseService.syncInitialProducts([prod]).catch(() => {});
                  }
                  setShowNewProductModal(false);
                  setSelectedProductForBarcode(prod);
                }}
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
          MODAL: EDIT PRODUCT PRICE & FESTIVAL OFFER
          ========================================================= */}
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
    </div>
  );
}
