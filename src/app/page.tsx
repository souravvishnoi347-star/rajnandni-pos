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
  LogOut
} from "lucide-react";
import { ProductItem, CartItem, CustomerInfo, AlterationDetail, CompletedBill, ProductCategory } from "@/types/pos";
import { INITIAL_PRODUCTS, STAFF_BEAUTICIANS, TAILOR_NAMES } from "@/lib/sampleInventory";
import { SupabaseService, isSupabaseConfigured } from "@/lib/supabaseClient";
import BarcodeSheetModal from "@/components/BarcodeSheetModal";

const INVENTORY_DATA_VERSION = "rajnandni_inventory_v3_wholesale_bills";
const POS_ACCESS_PASSWORD = "Indu@123";
const POS_AUTH_STORAGE_KEY = "rajnandni_pos_auth_v1";

export default function RajnandniPosPage() {
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
      const upiString = `upi://pay?pa=9897000000@upi&pn=Rajnandni&am=${grandTotal}&cu=INR&tn=Bill+Payment`;
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
`🌸 *RAJNANDNI* 🌸
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
💖 _Thank you for shopping with Rajnandni! Please visit again._
_Sarees · Suits · Lehengas · Fashion & Accessories_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  // Send Alteration Ready WhatsApp alert
  const handleSendAlterationReadyWhatsApp = (alt: AlterationDetail, phone: string, name: string) => {
    const rawPhone = phone.replace(/[^0-9]/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const msg = `🌸 *RAJNANDNI - ALTERATION READY* 🌸\n\nNamaste ${name || "Ma'am"} ji! 🙏\n\nAapka garment (*${alt.garmentName}*) alteration & fitting ke baad ready hai. Aap store aakar trial le sakte hain.\n\n📍 *Rajnandni (Darshan Enterprises)*\nNear PSC Petropump, Ranipur, Haridwar - 249401\n📞 Support: +91 98970 00000`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Helper: Generate next sequential SKU & Barcode per category
  const getNextCodesForCategory = (cat: string, currentList: ProductItem[] = products) => {
    const prefixMap: Record<string, { skuPrefix: string; barcodeBase: number; defaultSizes: string[] }> = {
      handbags: { skuPrefix: "RJ-BAG", barcodeBase: 8906000, defaultSizes: ["Standard", "Party Clutch", "Sling Bag"] },
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

  // Show sleek login screen if not authenticated (prevents any unauthenticated flash)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Subtle Gold Radial Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-stone-900/95 border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative z-10">
          {/* Brand Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20 mb-3">
              <Lock className="w-7 h-7 text-stone-950" />
            </div>
            <h1 className="text-2xl font-black tracking-widest text-white uppercase font-serif">
              RAJNANDNI
            </h1>
            <span className="mt-1 text-[11px] bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
              Darshan Enterprises
            </span>
            <p className="text-xs text-stone-400 mt-2">
              Near PSC Petropump, Ranipur, Haridwar · GSTIN: 05GNZPS9902M1ZR
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">
                Store Login Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  placeholder="Enter store password..."
                  autoFocus
                  className="w-full px-4 py-3 pr-11 bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-300 cursor-pointer p-1"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginError && (
                <p className="text-xs text-rose-400 font-semibold mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock POS &amp; Inventory</span>
            </button>
          </form>

          <p className="text-[11px] text-stone-500 text-center mt-5">
            Authorized Counter Access Only · Sarees · Suits · Lehengas · Handbags
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen print:min-h-0 print:h-auto print:block bg-slate-50 print:bg-white text-slate-900 flex flex-col font-sans">
      {/* =========================================================
          TOP LUXURY OBSIDIAN & CHAMPAGNE GOLD HEADER
          ========================================================= */}
      {/* MAIN SCREEN INTERACTIVE UI (HIDDEN DURING PRINTING) */}
      <div className="no-print flex-1 flex flex-col">
        <header className="bg-stone-950 text-white shadow-lg border-b border-amber-500/20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-stone-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black tracking-wider text-white uppercase font-serif">
                Rajnandni
              </h1>
              <span className="text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                Darshan Enterprises
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium">
              Near PSC Petropump, Ranipur, Haridwar - 249401 · GSTIN: 05GNZPS9902M1ZR
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-stone-900/90 p-1 rounded-xl border border-stone-800 text-xs">
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === "pos"
                ? "bg-amber-400 text-stone-950 font-bold shadow-sm"
                : "text-stone-300 hover:text-white hover:bg-stone-800"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>POS Billing</span>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === "inventory"
                ? "bg-amber-400 text-stone-950 font-bold shadow-sm"
                : "text-stone-300 hover:text-white hover:bg-stone-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Inventory &amp; Barcodes</span>
          </button>
          <button
            onClick={() => setActiveTab("alterations")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer relative ${
              activeTab === "alterations"
                ? "bg-amber-400 text-stone-950 font-bold shadow-sm"
                : "text-stone-300 hover:text-white hover:bg-stone-800"
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Alteration Desk</span>
            {alterationsList.filter(a => a.status !== "Delivered").length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === "reports"
                ? "bg-amber-400 text-stone-950 font-bold shadow-sm"
                : "text-stone-300 hover:text-white hover:bg-stone-800"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Daily Sales</span>
          </button>
        </div>

        {/* Database & Cloud Sync Status + Quick Day Stats + Lock Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDbModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              supabaseConnected
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                : "bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800"
            }`}
            title="Database & Supabase Cloud Sync"
          >
            <Database className={`w-3.5 h-3.5 ${supabaseConnected ? "text-emerald-400" : "text-amber-400"}`} />
            <span className="hidden sm:inline">
              {supabaseConnected ? "Cloud Synced" : "Database & Cloud"}
            </span>
            <span className={`w-2 h-2 rounded-full ${supabaseConnected ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
          </button>

          <div className="hidden lg:flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Today's Revenue</span>
              <p className="text-sm font-bold text-amber-400">
                ₹{completedBills.reduce((s, b) => s + b.grandTotal, 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="h-7 w-px bg-stone-800" />
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Bills Issued</span>
              <p className="text-sm font-bold text-white">{completedBills.length}</p>
            </div>
          </div>

          <button
            onClick={handleLogoutLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-rose-950/80 border border-stone-800 hover:border-rose-500/40 text-stone-300 hover:text-rose-300 text-xs font-semibold transition cursor-pointer"
            title="Lock POS Screen (Require Password)"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </header>

      {/* =========================================================
          TAB 1: POS BILLING COUNTER
          ========================================================= */}
      {activeTab === "pos" && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-62px)]">
          {/* LEFT: PRODUCTS CATALOG & SEARCH */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto border-r border-slate-200">
            {/* Search and Barcode Gun Input */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan Barcode Gun or Type Product / SKU Name (Press Enter to Quick Add)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-xs transition"
                />
              </div>

              {/* Quick Add Product Button */}
              <button
                onClick={() => openNewProductModal(selectedCategory !== "all" ? selectedCategory : "handbags")}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ New Item</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
              {[
                { id: "all", label: "✨ All Products" },
                { id: "sarees", label: "🥻 Sarees (Surat & Prints)" },
                { id: "lehengas", label: "👗 Lehengas & Gowns" },
                { id: "kurtis", label: "👚 Kurtis & Suits" },
                { id: "handbags", label: "👜 Handbags & Purses" },
                { id: "jewellery", label: "💍 Jewellery & Blouse Pcs" },
                { id: "footwear", label: "👠 Footwear & Heels" },
                { id: "parlour", label: "✂️ Tailoring & Fitting" }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as ProductCategory)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                    selectedCategory === cat.id
                      ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs ring-1 ring-amber-400/40"
                      : "bg-white text-stone-700 border-slate-200 hover:bg-slate-100 hover:text-stone-900"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(prod => (
                <div
                  key={prod.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs hover:shadow-md transition flex flex-col justify-between group hover:border-amber-400/80"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        {prod.sku}
                      </span>
                      {prod.badge && (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          {prod.badge}
                        </span>
                      )}
                      {!prod.isService && (
                        <span className={`text-[10px] font-semibold ${prod.stock <= 3 ? "text-rose-600 font-bold" : "text-emerald-700"}`}>
                          Stock: {prod.stock}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-stone-900 line-clamp-2 mt-1 leading-snug group-hover:text-amber-800 transition">
                      {prod.name}
                    </h3>

                    {/* Sizes / Options selector */}
                    {prod.sizes && prod.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prod.sizes.slice(0, 3).map((sz, i) => (
                          <button
                            key={i}
                            onClick={() => handleAddToCart(prod, sz)}
                            className="text-[9.5px] px-1.5 py-0.5 bg-stone-50 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded border border-slate-200 font-medium transition cursor-pointer"
                          >
                            + {sz}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-stone-950">
                        ₹{prod.price.toLocaleString("en-IN")}
                      </span>
                      {prod.mrp > prod.price && (
                        <span className="text-[10px] text-slate-400 line-through ml-1.5">
                          ₹{prod.mrp}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="p-1.5 bg-slate-100 hover:bg-stone-900 text-slate-700 hover:text-amber-300 rounded-lg transition cursor-pointer"
                      title="Add to Bill"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: ACTIVE BILLING CART */}
          <div className="w-full lg:w-[420px] bg-white border-l border-slate-200 flex flex-col justify-between h-full shadow-lg">
            {/* Customer Information Header */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  Customer Details
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customer.name}
                  onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp Mobile No"
                  value={customer.phone}
                  onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Bill is empty</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Scan product barcode or click on any saree, suit or garment to add.
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
                      className={`p-2.5 rounded-xl border transition text-xs ${
                        item.isNegotiated 
                          ? "bg-amber-50/50 border-amber-300 shadow-xs" 
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-stone-900 truncate">{item.product.name}</p>
                            {item.isNegotiated && (
                              <span className="text-[9px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                                🤝 Bargain Rate
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-600 flex-wrap">
                            <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-medium">
                              {item.selectedSize || "Standard"}
                            </span>
                            {item.beauticianName && (
                              <span className="text-purple-700 italic">By: {item.beauticianName.split(" ")[0]}</span>
                            )}
                            
                            {/* Price display with strike-through if bargained */}
                            <div className="flex items-center gap-1">
                              {isDiscounted && (
                                <span className="line-through text-slate-400">
                                  ₹{origPrice.toLocaleString("en-IN")}
                                </span>
                              )}
                              <span className={`font-bold ${isDiscounted ? "text-emerald-700" : "text-slate-800"}`}>
                                ₹{item.price.toLocaleString("en-IN")} /pc
                              </span>
                            </div>

                            {/* Button to toggle inline negotiate rate */}
                            <button
                              onClick={() => {
                                if (editingPriceIdx === idx) {
                                  setEditingPriceIdx(null);
                                } else {
                                  startEditingItemPrice(idx, item.price);
                                }
                              }}
                              className="text-[10px] font-semibold text-amber-800 hover:text-stone-950 underline flex items-center gap-0.5 cursor-pointer ml-1"
                              title="Bargain / Negotiate unit price for this item"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>{editingPriceIdx === idx ? "Close" : "Negotiate Rate"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Quantity Selector & Item Total */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                            <button
                              onClick={() => updateQuantity(idx, -1)}
                              className="p-1 text-slate-600 hover:text-black cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-mono font-bold text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(idx, 1)}
                              className="p-1 text-slate-600 hover:text-black cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right min-w-[55px]">
                            <span className="font-bold text-stone-950 block">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                            {isDiscounted && (
                              <span className="text-[9px] font-semibold text-emerald-700 block">
                                -₹{((origPrice - item.price) * item.quantity).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* INLINE NEGOTIATION / BARGAIN BOX FOR THIS ITEM */}
                      {editingPriceIdx === idx && (
                        <div className="mt-2 pt-2 border-t border-amber-200/80 bg-white p-2 rounded-lg text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold text-amber-950 flex items-center gap-1">
                              <Handshake className="w-3.5 h-3.5 text-amber-600" />
                              Negotiate Item Rate (Bargain)
                            </span>
                            {item.isNegotiated && (
                              <button
                                onClick={() => resetItemPrice(idx)}
                                className="text-[10px] text-slate-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer font-medium"
                              >
                                <RotateCcw className="w-2.5 h-2.5" /> Revert
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={tempItemPrice}
                                onChange={e => setTempItemPrice(e.target.value)}
                                className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-amber-300 rounded text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                placeholder="Enter Agreed Rate"
                                autoFocus
                              />
                            </div>
                            <button
                              onClick={() => saveNegotiatedItemPrice(idx)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded cursor-pointer transition"
                            >
                              Apply Rate
                            </button>
                          </div>

                          {/* Profit / Cost Check */}
                          {!item.product.isService && (
                            <div className="flex items-center justify-between text-[9.5px] pt-0.5">
                              <span className="text-slate-500">
                                Cost: ₹{item.product.purchaseCost}
                              </span>
                              {isCostLoss ? (
                                <span className="text-rose-600 font-bold flex items-center gap-0.5">
                                  ⚠️ Selling Below Cost (Loss: ₹{Math.abs(profitPerUnit)}/pc)
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">
                                  Margin: ₹{profitPerUnit}/pc (+{Math.round((profitPerUnit / (item.product.purchaseCost || 1)) * 100)}%)
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

            {/* Bottom Checkout & Payment Section */}
            <div className="p-3.5 border-t border-slate-200 bg-white space-y-2.5">
              {/* Alteration Toggle Checkbox */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alterationEnabled}
                    onChange={e => setAlterationEnabled(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <Scissors className="w-3.5 h-3.5 text-amber-700" />
                  <span>Alteration / Fitting Required?</span>
                </label>

                {alterationEnabled && (
                  <div className="mt-2 pt-2 border-t border-amber-200/80 space-y-1.5 text-[11px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-stone-600 font-medium">Garment Name</span>
                        <input
                          type="text"
                          value={alterationData.garmentName}
                          onChange={e => setAlterationData({ ...alterationData, garmentName: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-amber-200 rounded text-xs"
                          placeholder="e.g. Maroon Bridal Lehenga"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-600 font-medium">Trial / Ready Date</span>
                        <input
                          type="date"
                          value={alterationData.readyDate}
                          onChange={e => setAlterationData({ ...alterationData, readyDate: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-amber-200 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 font-medium">Fitting Measurements (Chest / Waist / Length)</span>
                      <input
                        type="text"
                        value={alterationData.fittingNotes}
                        onChange={e => setAlterationData({ ...alterationData, fittingNotes: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-amber-200 rounded text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* NEGOTIATION & BARGAIN DESK */}
              <div className="bg-gradient-to-r from-amber-50/70 to-stone-50 border border-amber-200/90 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Handshake className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-stone-900">
                      Customer Bargain &amp; Deal Desk
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <button
                      onClick={() => {
                        setDiscountAmount(0);
                        setAgreedDealPrice("");
                      }}
                      className="text-[10px] text-slate-500 hover:text-rose-600 underline cursor-pointer font-medium"
                    >
                      Clear Deal
                    </button>
                  )}
                </div>

                {/* Direct Agreed Deal Price Input (Bargain Total) */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-600 font-medium">Final Agreed Deal (₹)</span>
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      placeholder={`e.g. ₹${Math.floor(subtotal / 100) * 100}`}
                      value={agreedDealPrice}
                      onChange={e => handleAgreedDealPriceChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-stone-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-600 font-medium">Bargain Reason / Auth</span>
                    <select
                      value={discountReason}
                      onChange={e => setDiscountReason(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none cursor-pointer"
                    >
                      <option value="Owner Approved">👑 Owner / Madam Approved</option>
                      <option value="Regular Customer">⭐ Regular Loyal Customer</option>
                      <option value="Bulk Bridal Deal">👰 Bridal / Bulk Order Deal</option>
                      <option value="Rounding Off">🔄 Rounding Off Deal</option>
                      <option value="Seasonal Offer">🏷️ Festival / Season Offer</option>
                      <option value="Fitting Adjustment">✂️ Alteration / Fitting Adjust</option>
                    </select>
                  </div>
                </div>

                {/* Quick Round-off and % Discount Buttons */}
                <div className="pt-1 border-t border-amber-200/50">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>Quick Round-off:</span>
                    <span>Quick % Discounts:</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickRoundOff(50)}
                        className="text-[9.5px] px-1.5 py-0.5 bg-white hover:bg-amber-100 text-stone-700 rounded border border-slate-200 font-semibold cursor-pointer transition"
                        title="Round to nearest 50"
                      >
                        Round ₹50
                      </button>
                      <button
                        onClick={() => handleQuickRoundOff(100)}
                        className="text-[9.5px] px-1.5 py-0.5 bg-white hover:bg-amber-100 text-stone-700 rounded border border-slate-200 font-semibold cursor-pointer transition"
                        title="Round to nearest 100"
                      >
                        Round ₹100
                      </button>
                      <button
                        onClick={() => handleQuickRoundOff(500)}
                        className="text-[9.5px] px-1.5 py-0.5 bg-white hover:bg-amber-100 text-stone-700 rounded border border-slate-200 font-semibold cursor-pointer transition"
                        title="Round to nearest 500"
                      >
                        Round ₹500
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickPercentDiscount(5)}
                        className="text-[9.5px] px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold cursor-pointer transition"
                      >
                        5%
                      </button>
                      <button
                        onClick={() => handleQuickPercentDiscount(10)}
                        className="text-[9.5px] px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold cursor-pointer transition"
                      >
                        10%
                      </button>
                      <button
                        onClick={() => handleQuickFlatDiscount(200)}
                        className="text-[9.5px] px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-bold cursor-pointer transition"
                      >
                        -₹200
                      </button>
                      <button
                        onClick={() => handleQuickFlatDiscount(500)}
                        className="text-[9.5px] px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-bold cursor-pointer transition"
                      >
                        -₹500
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">Special Discount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="₹0"
                    value={discountAmount || ""}
                    onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">Payment Mode</span>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
                  >
                    <option value="upi">📱 UPI QR / PhonePe</option>
                    <option value="cash">💵 Cash In Hand</option>
                    <option value="card">💳 Debit / Credit Card</option>
                    <option value="khata">📒 Khata / Udhaar</option>
                  </select>
                </div>
              </div>

              {/* Price Summary Breakdown */}
              <div className="space-y-1 text-xs pt-1">
                {catalogTotal > subtotal && (
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Original Catalog Total</span>
                    <span className="line-through">₹{catalogTotal.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Cart Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Negotiated Bargain Discount</span>
                    <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {totalSavings > 0 && (
                  <div className="flex justify-between text-amber-900 bg-amber-50 px-2 py-1 rounded font-bold text-[11px] border border-amber-200/80">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Customer Total Savings:
                    </span>
                    <span>₹{totalSavings.toLocaleString("en-IN")} 🎉</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-stone-950 border-t border-slate-200 pt-1.5">
                  <span>Final Deal Payable</span>
                  <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-3 bg-stone-950 hover:bg-stone-900 disabled:opacity-40 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 group"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Complete Bill · ₹{grandTotal.toLocaleString("en-IN")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: INVENTORY & BARCODE GENERATOR
          ========================================================= */}
      {activeTab === "inventory" && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900 font-serif">Product Inventory &amp; Barcode Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage all ~160 retail products, sizes, prices, and generate clothing price tags with barcodes.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleReloadWholesaleInventory}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold cursor-pointer transition"
                  title="Reload 159 items parsed from supplier wholesale bills"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reload 159 Bill Items</span>
                </button>
                <button
                  onClick={() => setShowDbModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  <Database className="w-3.5 h-3.5 text-stone-700" />
                  <span>Cloud DB</span>
                </button>
                <button
                  onClick={() => openNewProductModal("handbags")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-950 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold shadow-xs hover:bg-stone-900 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 text-stone-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">SKU &amp; Barcode</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Sizes / Options</th>
                    <th className="px-4 py-3">Cost Price</th>
                    <th className="px-4 py-3">Selling Price</th>
                    <th className="px-4 py-3">Stock Qty</th>
                    <th className="px-4 py-3 text-right">Barcode Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-stone-900">{p.sku}</span>
                        <p className="text-[10px] text-slate-500 font-mono">Code: {p.barcode}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-stone-900">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.category === "sarees" ? "bg-indigo-100 text-indigo-900" :
                          p.category === "lehengas" ? "bg-rose-100 text-rose-800" :
                          p.category === "kurtis" ? "bg-amber-100 text-amber-900" :
                          p.category === "handbags" ? "bg-teal-100 text-teal-900" :
                          p.category === "jewellery" ? "bg-purple-100 text-purple-900" :
                          p.category === "footwear" ? "bg-emerald-100 text-emerald-900" :
                          "bg-pink-100 text-pink-900"
                        }`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600">
                        {p.sizes ? p.sizes.join(", ") : "Standard"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">₹{p.purchaseCost || 0}</td>
                      <td className="px-4 py-3 font-bold text-stone-950">₹{p.price.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 font-semibold">
                        {p.isService ? (
                          <span className="text-purple-700">Service</span>
                        ) : (
                          <span className={p.stock <= 3 ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>
                            {p.stock} pcs
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditProductPrice(p)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                            title="Update price or add festival discount (Barcode automatically updates!)"
                          >
                            <Edit3 className="w-3 h-3 text-stone-600" />
                            <span>Edit Rate / Offer</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProductForBarcode(p);
                              setBarcodeStickerCount(4);
                            }}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3 text-amber-700" />
                            <span>Print Tags</span>
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
      )}

      {/* =========================================================
          TAB 3: ALTERATION & FITTING DESK
          ========================================================= */}
      {activeTab === "alterations" && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900 font-serif">Alteration &amp; Fitting Desk</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track alterations, tailor assignments, customer trials, and send automatic WhatsApp pickup alerts.
                </p>
              </div>
            </div>

            {alterationsList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <Scissors className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No active alterations right now</p>
                <p className="text-xs text-slate-400 mt-1">
                  When creating a bill, check "Alteration / Fitting Required" to record garment measurements and tailors.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alterationsList.map((alt, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-amber-600" />
                        {alt.garmentName}
                      </span>
                      <select
                        value={alt.status}
                        onChange={e => {
                          const next = [...alterationsList];
                          next[idx].status = e.target.value as any;
                          saveAlterationsLocally(next);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                          alt.status === "Ready for Trial"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : alt.status === "Delivered"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-amber-100 text-amber-900 border-amber-300"
                        }`}
                      >
                        <option value="Received">Received</option>
                        <option value="In Alteration">In Alteration</option>
                        <option value="Ready for Trial">Ready for Trial</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                      <p className="font-semibold text-slate-800">
                        Fitting Notes: <span className="font-normal text-slate-600">{alt.fittingNotes}</span>
                      </p>
                      <p className="font-semibold text-slate-800">
                        Assigned Tailor: <span className="font-normal text-slate-600">{alt.tailorName}</span>
                      </p>
                      <p className="font-semibold text-slate-800">
                        Expected Ready Date: <span className="font-bold text-amber-900">{alt.readyDate}</span>
                      </p>
                    </div>

                    {/* WhatsApp Action Button */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleSendAlterationReadyWhatsApp(alt, "9897000000", "Customer")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Send WhatsApp "Ready" Alert</span>
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
          TAB 4: DAILY SALES REPORTS
          ========================================================= */}
      {activeTab === "reports" && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-serif">Daily Sales &amp; Settlement Report</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Summary of all bills issued, payment breakdowns (Cash vs UPI vs Card), and total collection.
              </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Sales Revenue</span>
                <p className="text-2xl font-black text-stone-950 mt-1">
                  ₹{completedBills.reduce((s, b) => s + b.grandTotal, 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" /> Cash Collected
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ₹{completedBills.filter(b => b.paymentMode === "cash").reduce((s, b) => s + b.grandTotal, 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-purple-600 uppercase flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> UPI Received
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ₹{completedBills.filter(b => b.paymentMode === "upi").reduce((s, b) => s + b.grandTotal, 0).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-blue-600 uppercase flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Card / Khata
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ₹{completedBills.filter(b => b.paymentMode === "card" || b.paymentMode === "khata").reduce((s, b) => s + b.grandTotal, 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Recent Bills History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900">Recent Completed Bills</h3>
                <span className="text-xs text-slate-500">{completedBills.length} Bill(s)</span>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-stone-800 font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Bill No &amp; Time</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Items Summary</th>
                    <th className="px-4 py-2.5">Payment</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedBills.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-stone-900">{b.billNo}</span>
                        <p className="text-[10px] text-slate-500">{b.createdAt}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-stone-900">{b.customer.name}</p>
                        <p className="text-[10px] text-slate-500">{b.customer.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {b.items.map(it => `${it.product.name} (x${it.quantity})`).join(", ")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[10px] uppercase">
                          {b.paymentMode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-black text-stone-950 text-sm block">
                          ₹{b.grandTotal.toLocaleString("en-IN")}
                        </span>
                        {(b.totalSavings || b.discount) > 0 && (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Saved: ₹{(b.totalSavings || b.discount).toLocaleString("en-IN")}
                            {b.discountReason && ` (${b.discountReason.split(" ")[0]})`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSendWhatsAppBill(b)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          title="Resend WhatsApp Bill"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <p className="font-bold text-sm">RAJNANDNI</p>
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
            <h2 style={{ fontSize: "15px", fontWeight: "bold", margin: 0 }}>RAJNANDNI</h2>
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
                <span>Supabase Setup Guide for Rajnandni</span>
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
                  <p className="text-slate-500 text-[11px]">Go to <span className="font-mono text-amber-700">supabase.com</span>, sign in and click <strong>New Project</strong> (e.g. name it <code>rajnandni-pos</code>).</p>
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
