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
  RotateCcw
} from "lucide-react";
import { ProductItem, CartItem, CustomerInfo, AlterationDetail, CompletedBill, ProductCategory } from "@/types/pos";
import { INITIAL_PRODUCTS, STAFF_BEAUTICIANS, TAILOR_NAMES } from "@/lib/sampleInventory";

export default function RajnandniPosPage() {
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

  // Load local storage on mount
  useEffect(() => {
    try {
      const savedProds = localStorage.getItem("rajnandni_products");
      if (savedProds) setProducts(JSON.parse(savedProds));

      const savedBills = localStorage.getItem("rajnandni_bills");
      if (savedBills) setCompletedBills(JSON.parse(savedBills));

      const savedAlts = localStorage.getItem("rajnandni_alterations");
      if (savedAlts) setAlterationsList(JSON.parse(savedAlts));
    } catch (e) {
      console.warn("Local storage parse notice:", e);
    }
  }, []);

  // Save changes
  const saveProductsLocally = (items: ProductItem[]) => {
    setProducts(items);
    localStorage.setItem("rajnandni_products", JSON.stringify(items));
  };

  const saveBillsLocally = (bills: CompletedBill[]) => {
    setCompletedBills(bills);
    localStorage.setItem("rajnandni_bills", JSON.stringify(bills));
  };

  const saveAlterationsLocally = (alts: AlterationDetail[]) => {
    setAlterationsList(alts);
    localStorage.setItem("rajnandni_alterations", JSON.stringify(alts));
  };

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
      const upiString = `upi://pay?pa=9897000000@upi&pn=Rajnandni+Boutique&am=${grandTotal}&cu=INR&tn=Bill+Payment`;
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

    // Save Bill
    const nextBills = [newBill, ...completedBills];
    saveBillsLocally(nextBills);

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

    const message = 
`🌸 *RAJNANDNI ETHNIC & BEAUTY STUDIO* 🌸
_Haridwar, Uttarakhand_
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
${bill.alteration ? `✂️ *ALTERATION DETAILS:*
Garment: ${bill.alteration.garmentName}
Fitting: ${bill.alteration.fittingNotes}
Tailor: ${bill.alteration.tailorName}
Ready by: ${bill.alteration.readyDate}\n------------------------------------` : ""}
💖 _Thank you for shopping with Rajnandni! Please visit again._
_Bridal Lehengas · Suits · Jewellery · Footwear · Beauty Parlour_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  // Send Alteration Ready WhatsApp alert
  const handleSendAlterationReadyWhatsApp = (alt: AlterationDetail, phone: string, name: string) => {
    const rawPhone = phone.replace(/[^0-9]/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const msg = `🌸 *RAJNANDNI BOUTIQUE - ALTERATION READY* 🌸\n\nNamaste ${name || "Ma'am"} ji! 🙏\n\nAapka garment (*${alt.garmentName}*) alteration & fitting ke baad ready hai. Aap boutique aakar trial le sakte hain.\n\n📍 *Rajnandni Ethnic Studio, Haridwar*\n📞 Support: +91 98970 00000`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Add Product Form Handler
  const handleCreateProduct = () => {
    if (!newProductForm.name?.trim()) return;

    const newId = `prod-${Date.now()}`;
    const generatedSku = newProductForm.sku?.trim() || `RJ-${newProductForm.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const generatedBarcode = newProductForm.barcode?.trim() || `${Math.floor(8900000 + Math.random() * 99999)}`;

    const prod: ProductItem = {
      id: newId,
      name: newProductForm.name.trim(),
      category: newProductForm.category as any || "kurtis",
      price: Number(newProductForm.price) || 0,
      mrp: Number(newProductForm.mrp) || Number(newProductForm.price) || 0,
      purchaseCost: Number(newProductForm.purchaseCost) || 0,
      stock: Number(newProductForm.stock) || 1,
      sku: generatedSku,
      barcode: generatedBarcode,
      sizes: newProductForm.sizes || ["Standard"],
      isService: newProductForm.category === "parlour"
    };

    const nextList = [prod, ...products];
    saveProductsLocally(nextList);
    setShowNewProductModal(false);
    setNewProductForm({
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
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* =========================================================
          TOP LUXURY OBSIDIAN & CHAMPAGNE GOLD HEADER
          ========================================================= */}
      <header className="no-print bg-stone-950 text-white shadow-lg border-b border-amber-500/20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-stone-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-wider text-white uppercase font-serif">
                Rajnandni
              </h1>
              <span className="text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                Boutique &amp; Parlour
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium">
              Ethnic Studio · Bridal Lehengas · Jewellery · Footwear · Beauty Services
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

        {/* Quick Day Stats */}
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
                onClick={() => setShowNewProductModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ New Item</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
              {[
                { id: "all", label: "✨ All Products & Services" },
                { id: "lehengas", label: "👗 Lehengas & Gowns" },
                { id: "kurtis", label: "👚 Kurtis & Suits" },
                { id: "jewellery", label: "💍 Jewellery & Sets" },
                { id: "footwear", label: "👠 Footwear & Heels" },
                { id: "parlour", label: "💄 Parlour & Beauty" }
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
                    Scan product barcode or click on any dress, footwear or parlour service to add.
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
                  Manage all ~150 boutique products, sizes, prices, and generate clothing price tags with barcodes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewProductModal(true)}
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
                          p.category === "lehengas" ? "bg-rose-100 text-rose-800" :
                          p.category === "kurtis" ? "bg-amber-100 text-amber-900" :
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
                        <button
                          onClick={() => {
                            setSelectedProductForBarcode(p);
                            setBarcodeStickerCount(4);
                          }}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Tag className="w-3 h-3 text-amber-700" />
                          <span>Print Tags</span>
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
          TAB 3: ALTERATION & FITTING DESK
          ========================================================= */}
      {activeTab === "alterations" && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900 font-serif">Alteration &amp; Fitting Desk</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track boutique alterations, tailor assignments, customer trials, and send automatic WhatsApp pickup alerts.
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
                <p className="font-bold text-sm">RAJNANDNI ETHNIC STUDIO</p>
                <p className="text-[10px] text-gray-500">Lehengas · Jewellery · Footwear · Parlour</p>
                <p className="text-[10px] text-gray-500">Haridwar, Uttarakhand</p>
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
            <div className="p-4 bg-white flex items-center gap-3">
              <button
                onClick={handlePrintThermal}
                className="flex-1 py-2.5 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Thermal Slip</span>
              </button>

              <button
                onClick={() => handleSendWhatsAppBill(lastBill)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PRINT ONLY AREA: THERMAL RECEIPT ROLL (58mm / 80mm)
          ========================================================= */}
      {lastBill && (
        <div id="thermal-receipt-area" className="hidden print:block">
          <div style={{ textAlign: "center", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>RAJNANDNI</h2>
            <p style={{ fontSize: "9px", margin: "1px 0" }}>Boutique · Jewellery · Footwear · Parlour</p>
            <p style={{ fontSize: "9px", margin: "1px 0" }}>Haridwar, Uttarakhand</p>
            <p style={{ fontSize: "9px", margin: "1px 0" }}>Ph: +91 98970 00000</p>
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
          MODAL: BARCODE STICKER LABEL GENERATOR
          ========================================================= */}
      {selectedProductForBarcode && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 font-serif text-base">Print Price &amp; Barcode Stickers</h3>
              <button
                onClick={() => setSelectedProductForBarcode(null)}
                className="p-1 text-slate-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Standard 2x1 inch adhesive price tags for garments and jewellery.
            </p>

            {/* Sticker Preview Box */}
            <div className="bg-amber-50/60 border-2 border-dashed border-amber-300 rounded-2xl p-4 text-center mb-4">
              <span className="text-[10px] font-black uppercase text-stone-950 tracking-wider">RAJNANDNI ETHNIC STUDIO</span>
              <p className="text-xs font-bold text-stone-900 mt-1 line-clamp-1">{selectedProductForBarcode.name}</p>
              
              {/* Barcode Mock Canvas */}
              <div className="my-2 py-1 bg-white border border-slate-200 rounded flex flex-col items-center">
                <div className="h-8 w-44 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px)]" />
                <span className="font-mono text-[10px] tracking-widest text-slate-700 mt-0.5">
                  *{selectedProductForBarcode.barcode}*
                </span>
              </div>

              <div className="flex justify-between items-center text-xs px-2 pt-1 font-bold">
                <span className="text-slate-600">Size: {selectedProductForBarcode.sizes?.[0] || "Std"}</span>
                <span className="text-stone-950 text-sm">MRP: ₹{selectedProductForBarcode.mrp}</span>
              </div>
            </div>

            {/* Print Quantity */}
            <div className="flex items-center justify-between text-xs mb-4">
              <span className="font-semibold text-slate-700">Number of stickers:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={barcodeStickerCount}
                onChange={e => setBarcodeStickerCount(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-slate-300 rounded text-center font-bold"
              />
            </div>

            <button
              onClick={() => {
                alert(`Printing ${barcodeStickerCount} barcode labels for ${selectedProductForBarcode.name}`);
                setSelectedProductForBarcode(null);
              }}
              className="w-full py-2.5 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print {barcodeStickerCount} Label Stickers</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADD NEW PRODUCT
          ========================================================= */}
      {showNewProductModal && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 font-serif text-lg">Add New Boutique Product / Service</h3>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="p-1 text-slate-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Product / Service Title</span>
                <input
                  type="text"
                  placeholder="e.g. Georgette Sharara Suit or Bridal Facial"
                  value={newProductForm.name}
                  onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-700">Category</span>
                  <select
                    value={newProductForm.category}
                    onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="lehengas">👗 Lehengas &amp; Gowns</option>
                    <option value="kurtis">👚 Kurtis &amp; Suits</option>
                    <option value="jewellery">💍 Jewellery &amp; Sets</option>
                    <option value="footwear">👠 Footwear &amp; Heels</option>
                    <option value="parlour">💄 Parlour &amp; Beauty</option>
                  </select>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">Stock Quantity</span>
                  <input
                    type="number"
                    value={newProductForm.stock}
                    onChange={e => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="font-semibold text-slate-700">Selling Price (₹)</span>
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
                <div>
                  <span className="font-semibold text-slate-700">Cost Price (₹)</span>
                  <input
                    type="number"
                    value={newProductForm.purchaseCost}
                    onChange={e => setNewProductForm({ ...newProductForm, purchaseCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-700">SKU Code (Auto if blank)</span>
                  <input
                    type="text"
                    placeholder="e.g. RJ-LHG-09"
                    value={newProductForm.sku}
                    onChange={e => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Barcode Number</span>
                  <input
                    type="text"
                    placeholder="e.g. 8905001"
                    value={newProductForm.barcode}
                    onChange={e => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewProductModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProduct}
                className="px-5 py-2 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
