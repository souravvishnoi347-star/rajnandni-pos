"use client";

import React, { useState, useMemo } from "react";
import {
  RotateCcw,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Share2,
  Calendar,
  Phone,
  User,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  ShieldCheck,
  PackageCheck
} from "lucide-react";
import { ProductItem, CompletedBill, ExchangeRecord, ExchangeItemReturn, ExchangeItemIssued } from "@/types/pos";
import { ExchangeService } from "@/lib/exchangeService";

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedBills: CompletedBill[];
  products: ProductItem[];
  preselectedBill?: CompletedBill | null;
  onExchangeCompleted: (record: ExchangeRecord, updatedProducts: ProductItem[]) => void;
}

export default function ExchangeModal({
  isOpen,
  onClose,
  completedBills,
  products,
  preselectedBill,
  onExchangeCompleted
}: ExchangeModalProps) {
  const [billSearchQuery, setBillSearchQuery] = useState<string>("");
  const [selectedBill, setSelectedBill] = useState<CompletedBill | null>(preselectedBill || null);

  // Return selection state: cartItemIndex -> { selected, quantity, reason, condition }
  const [returnItemsState, setReturnItemsState] = useState<Record<number, {
    selected: boolean;
    quantity: number;
    reason: ExchangeItemReturn["reason"];
    condition: ExchangeItemReturn["condition"];
  }>>({});

  // Replacement items picked by cashier
  const [issuedItems, setIssuedItems] = useState<ExchangeItemIssued[]>([]);
  const [productSearch, setProductSearch] = useState<string>("");
  const [selectedReplacementSize, setSelectedReplacementSize] = useState<string>("Standard");

  // Financial settlement
  const [paymentMode, setPaymentMode] = useState<ExchangeRecord["paymentMode"]>("upi");
  const [notes, setNotes] = useState<string>("");

  // Post-exchange slip state
  const [completedExchange, setCompletedExchange] = useState<ExchangeRecord | null>(null);

  // Filter bills by search query
  const matchingBills = useMemo(() => {
    const q = billSearchQuery.trim().toLowerCase();
    if (!q) return completedBills.slice(0, 10);
    return completedBills.filter(b => {
      const bNo = (b.billNo || "").toLowerCase();
      const cName = (b.customer?.name || "").toLowerCase();
      const cPhone = (b.customer?.phone || "").toLowerCase();
      return bNo.includes(q) || cName.includes(q) || cPhone.includes(q);
    }).slice(0, 15);
  }, [completedBills, billSearchQuery]);

  // Eligibility check for selected bill
  const eligibility = useMemo(() => {
    if (!selectedBill) return null;
    return ExchangeService.checkEligibility(selectedBill.rawDate || selectedBill.createdAt);
  }, [selectedBill]);

  // Catalog search for replacement products
  const matchingReplacementProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return [];
    return products.filter(p => !p.isService && (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )).slice(0, 8);
  }, [products, productSearch]);

  // Calculation of Return Credit
  const selectedReturnItemsList: ExchangeItemReturn[] = useMemo(() => {
    if (!selectedBill || !selectedBill.items) return [];
    const list: ExchangeItemReturn[] = [];
    selectedBill.items.forEach((it, idx) => {
      const state = returnItemsState[idx];
      if (state && state.selected) {
        list.push({
          productId: it.product?.id || `item-${idx}`,
          sku: it.product?.sku || "",
          name: it.product?.name || "Boutique Item",
          category: it.product?.category || "sarees",
          originalPrice: Number(it.price) || 0,
          quantity: Math.max(1, Math.min(Number(it.quantity) || 1, state.quantity || 1)),
          reason: state.reason || "size_fitting",
          condition: state.condition || "restockable"
        });
      }
    });
    return list;
  }, [selectedBill, returnItemsState]);

  const totalReturnCredit = useMemo(() => {
    return selectedReturnItemsList.reduce((sum, it) => sum + (it.originalPrice * it.quantity), 0);
  }, [selectedReturnItemsList]);

  const totalNewItemsValue = useMemo(() => {
    return issuedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  }, [issuedItems]);

  const differenceAmount = totalNewItemsValue - totalReturnCredit;

  if (!isOpen) return null;

  const handleSelectBill = (b: CompletedBill) => {
    setSelectedBill(b);
    setReturnItemsState({});
    setIssuedItems([]);
  };

  const handleToggleReturnItem = (idx: number, item: any) => {
    const current = returnItemsState[idx] || {
      selected: false,
      quantity: 1,
      reason: "size_fitting",
      condition: "restockable"
    };
    setReturnItemsState({
      ...returnItemsState,
      [idx]: {
        ...current,
        selected: !current.selected
      }
    });
  };

  const handleAddReplacementProduct = (prod: ProductItem) => {
    const existingIdx = issuedItems.findIndex(x => x.productId === prod.id && x.selectedSize === selectedReplacementSize);
    if (existingIdx >= 0) {
      const next = [...issuedItems];
      next[existingIdx].quantity += 1;
      setIssuedItems(next);
    } else {
      setIssuedItems([
        ...issuedItems,
        {
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          quantity: 1,
          selectedSize: selectedReplacementSize !== "Standard" ? selectedReplacementSize : (prod.sizes && prod.sizes[0]) || "Standard"
        }
      ]);
    }
    setProductSearch("");
  };

  const handleRemoveIssuedItem = (idx: number) => {
    setIssuedItems(issuedItems.filter((_, i) => i !== idx));
  };

  const handleExecuteExchange = () => {
    if (!selectedBill) {
      alert("Please select a customer bill to exchange.");
      return;
    }
    if (selectedReturnItemsList.length === 0) {
      alert("Please select at least 1 item that customer is returning.");
      return;
    }
    if (issuedItems.length === 0) {
      alert("Please select at least 1 new replacement item from catalog.");
      return;
    }

    const { record } = ExchangeService.createExchange({
      originalBill: selectedBill,
      returnedItems: selectedReturnItemsList,
      issuedItems,
      paymentMode,
      notes,
      staffName: "Counter Staff"
    });

    const updatedProducts = ExchangeService.applyStockAdjustment(record, products);
    setCompletedExchange(record);
    onExchangeCompleted(record, updatedProducts);
  };

  const handlePrintSlip = () => {
    if (!completedExchange) {
      window.print();
      return;
    }
    const slipText = ExchangeService.generateSlipText(completedExchange);
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Exchange Slip ${completedExchange.exchangeNo}</title>
            <style>
              @page { size: 80mm auto; margin: 4mm; }
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 11px;
                white-space: pre-wrap;
                margin: 0;
                padding: 6px;
                line-height: 1.35;
                color: #000;
              }
            </style>
          </head>
          <body>${slipText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    } else {
      window.print();
    }
  };

  const handleShareWhatsApp = () => {
    if (!completedExchange) return;
    const phone = completedExchange.customer.phone.replace(/[^0-9]/g, "");
    if (!phone || phone === "NA") {
      alert("Customer mobile number not available on this bill.");
      return;
    }
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = encodeURIComponent(ExchangeService.generateSlipText(completedExchange));
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-5 flex items-center justify-between shrink-0 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                  Rajnandini Boutique
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  5-Day Return &amp; Exchange Policy
                </span>
              </div>
              <h2 className="text-xl font-black text-white font-serif">Customer Product Exchange Studio</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {!completedExchange ? (
            <>
              {/* STEP 1: BILL SELECTION */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black flex items-center justify-center text-xs">
                      1
                    </span>
                    <span className="font-bold text-stone-900 text-sm">Find Customer Purchase Bill</span>
                  </div>
                  {selectedBill && (
                    <button
                      onClick={() => setSelectedBill(null)}
                      className="text-xs text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                    >
                      Change Bill
                    </button>
                  )}
                </div>

                {!selectedBill ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by Bill Number (e.g. RJN-2026-0301), Customer Mobile or Name..."
                        value={billSearchQuery}
                        onChange={e => setBillSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-stone-100 bg-white rounded-xl border border-stone-200 p-2">
                      {matchingBills.map(b => (
                        <div
                          key={b.id || b.billNo}
                          onClick={() => handleSelectBill(b)}
                          className="pt-1.5 first:pt-0 flex items-center justify-between p-2 hover:bg-amber-50/60 rounded-lg cursor-pointer transition"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black font-mono text-stone-900">{b.billNo}</span>
                              <span className="text-[10px] text-stone-500">{b.rawDate?.slice(0, 10) || b.createdAt}</span>
                            </div>
                            <p className="text-[11px] text-stone-600">
                              {b.customer.name} ({b.customer.phone || "No phone"}) • {b.items?.length || 0} items
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-emerald-700 font-mono text-xs">₹{b.grandTotal}</span>
                            <span className="block text-[10px] text-amber-700 font-bold">Select ➔</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                          {selectedBill.billNo}
                        </span>
                        <span className="text-xs font-bold text-stone-800">{selectedBill.customer.name}</span>
                        <span className="text-xs text-stone-500">({selectedBill.customer.phone})</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
                        <span>Paid: ₹{selectedBill.grandTotal} via {selectedBill.paymentMode?.toUpperCase()}</span>
                        <span>•</span>
                        <span>Date: {selectedBill.rawDate ? new Date(selectedBill.rawDate).toLocaleDateString("en-IN") : selectedBill.createdAt}</span>
                      </p>
                    </div>

                    {eligibility && (
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                        eligibility.eligible
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {eligibility.eligible ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        <span>{eligibility.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedBill && (
                <>
                  {/* STEP 2: SELECT RETURNED ITEMS */}
                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-xs">
                          2
                        </span>
                        <span className="font-bold text-stone-900 text-sm">Select Item(s) Being Returned by Customer</span>
                      </div>
                      <span className="text-xs font-black text-rose-700 font-mono">
                        Return Credit: ₹{totalReturnCredit}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedBill.items?.map((it, idx) => {
                        const state = returnItemsState[idx] || {
                          selected: false,
                          quantity: 1,
                          reason: "size_fitting",
                          condition: "restockable"
                        };
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border transition ${
                              state.selected
                                ? "bg-white border-rose-400 shadow-sm"
                                : "bg-white/60 border-stone-200 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={state.selected}
                                  onChange={() => handleToggleReturnItem(idx, it)}
                                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                                />
                                <div>
                                  <p className="font-bold text-stone-900 text-xs">
                                    {it.product?.name || "Item"}
                                    <span className="ml-2 font-mono text-[10px] text-stone-500 font-normal">
                                      ({it.product?.sku})
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-stone-500">
                                    Purchased at ₹{it.price} • Qty on Bill: {it.quantity}
                                  </p>
                                </div>
                              </label>

                              <span className="font-bold font-mono text-xs text-stone-900 shrink-0">
                                ₹{it.price * (state.quantity || 1)}
                              </span>
                            </div>

                            {state.selected && (
                              <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                                <div>
                                  <span className="font-semibold text-stone-600 block mb-1">Return Reason:</span>
                                  <select
                                    value={state.reason}
                                    onChange={e => setReturnItemsState({
                                      ...returnItemsState,
                                      [idx]: { ...state, reason: e.target.value as any }
                                    })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1.5 font-medium"
                                  >
                                    <option value="size_fitting">📏 Size / Fitting Issue</option>
                                    <option value="color_choice">🎨 Color / Shade Choice</option>
                                    <option value="defect_damage">⚠️ Defective Piece / Cut</option>
                                    <option value="customer_mind">💭 Changed Mind / Gift</option>
                                    <option value="other">📝 Other Reason</option>
                                  </select>
                                </div>

                                <div>
                                  <span className="font-semibold text-stone-600 block mb-1">Garment Condition:</span>
                                  <select
                                    value={state.condition}
                                    onChange={e => setReturnItemsState({
                                      ...returnItemsState,
                                      [idx]: { ...state, condition: e.target.value as any }
                                    })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1.5 font-medium"
                                  >
                                    <option value="restockable">🟢 Good (Restock to Showroom +1)</option>
                                    <option value="damaged">🔴 Defective (Do NOT Restock)</option>
                                  </select>
                                </div>

                                <div>
                                  <span className="font-semibold text-stone-600 block mb-1">Qty Returning:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max={it.quantity || 1}
                                    value={state.quantity}
                                    onChange={e => setReturnItemsState({
                                      ...returnItemsState,
                                      [idx]: { ...state, quantity: Math.max(1, Math.min(it.quantity || 1, parseInt(e.target.value) || 1)) }
                                    })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-1.5 font-bold font-mono"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 3: PICK REPLACEMENT ITEM */}
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                          3
                        </span>
                        <span className="font-bold text-stone-900 text-sm">Select New Replacement Garment / Item</span>
                      </div>
                      <span className="text-xs font-black text-indigo-700 font-mono">
                        New Items Total: ₹{totalNewItemsValue}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search replacement by Title, SKU (e.g. RJ-SAR-002) or Scan Barcode..."
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <select
                          value={selectedReplacementSize}
                          onChange={e => setSelectedReplacementSize(e.target.value)}
                          className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700"
                        >
                          <option value="Standard">Standard Size</option>
                          <option value="M">Size M</option>
                          <option value="L">Size L</option>
                          <option value="XL">Size XL</option>
                          <option value="XXL">Size XXL</option>
                          <option value="Free Size">Free Size (5.5m)</option>
                        </select>
                      </div>

                      {/* Matching Products Search Dropdown */}
                      {matchingReplacementProducts.length > 0 && (
                        <div className="bg-white border border-indigo-200 rounded-xl p-2 shadow-lg divide-y divide-stone-100 max-h-48 overflow-y-auto">
                          {matchingReplacementProducts.map(p => (
                            <div
                              key={p.id}
                              onClick={() => handleAddReplacementProduct(p)}
                              className="p-2 hover:bg-indigo-50 rounded-lg flex items-center justify-between cursor-pointer transition"
                            >
                              <div>
                                <span className="font-bold text-stone-900 text-xs">{p.name}</span>
                                <span className="ml-2 font-mono text-[10px] text-stone-500">({p.sku})</span>
                                <span className="block text-[10px] text-stone-500">
                                  Stock: {p.stock} pcs • {p.category}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-indigo-700 font-mono text-xs">₹{p.price}</span>
                                <span className="block text-[10px] text-indigo-600 font-bold">+ Pick Item</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Picked Replacement Items List */}
                      {issuedItems.length > 0 ? (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                            Issued Replacement Items:
                          </span>
                          {issuedItems.map((iss, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-2.5 rounded-xl border border-indigo-200 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[10px]">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="font-bold text-stone-900 text-xs">
                                    {iss.name} ({iss.sku})
                                    <span className="ml-2 px-1.5 py-0.2 rounded bg-stone-100 text-[10px] text-stone-600">
                                      {iss.selectedSize}
                                    </span>
                                  </p>
                                  <p className="text-[10px] text-stone-500">Qty: {iss.quantity} pcs</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-black font-mono text-stone-900 text-xs">
                                  ₹{iss.price * iss.quantity}
                                </span>
                                <button
                                  onClick={() => handleRemoveIssuedItem(idx)}
                                  className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Remove item"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic text-center py-2">
                          Search product above or scan barcode to add replacement garment.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* STEP 4: FINANCIAL DIFFERENCE & SETTLEMENT */}
                  <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white p-5 rounded-2xl border border-amber-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          Step 4: Financial Balance &amp; Settlement
                        </span>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span>Return Credit: <strong className="text-rose-300 font-mono">₹{totalReturnCredit}</strong></span>
                          <span>•</span>
                          <span>New Items: <strong className="text-indigo-300 font-mono">₹{totalNewItemsValue}</strong></span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Net Settlement Difference</span>
                        <p className={`text-2xl font-black font-mono ${
                          differenceAmount > 0
                            ? "text-emerald-400"
                            : differenceAmount < 0
                            ? "text-rose-400"
                            : "text-amber-300"
                        }`}>
                          {differenceAmount > 0
                            ? `+₹${differenceAmount}`
                            : differenceAmount < 0
                            ? `-₹${Math.abs(differenceAmount)}`
                            : "₹0 (Even Exchange)"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <span className="text-stone-300 text-[11px] font-bold block mb-1">
                          {differenceAmount > 0
                            ? "Payment Mode (Customer Pays Difference):"
                            : differenceAmount < 0
                            ? "Refund / Credit Mode (Store to Customer):"
                            : "Settlement Type:"}
                        </span>

                        {differenceAmount > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {(["upi", "cash", "card"] as const).map(mode => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setPaymentMode(mode)}
                                className={`py-2 px-3 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                                  paymentMode === mode
                                    ? "bg-amber-400 text-stone-950 border-amber-300 shadow-md font-black"
                                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                                }`}
                              >
                                {mode === "upi" ? <QrCode className="w-3.5 h-3.5" /> : mode === "cash" ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                                <span>{mode}</span>
                              </button>
                            ))}
                          </div>
                        ) : differenceAmount < 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPaymentMode("cash")}
                              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border ${
                                paymentMode === "cash" ? "bg-amber-400 text-stone-950 border-amber-300 font-black" : "bg-white/10 text-white border-white/20"
                              }`}
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Cash Refund</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMode("credit_note")}
                              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border ${
                                paymentMode === "credit_note" ? "bg-amber-400 text-stone-950 border-amber-300 font-black" : "bg-white/10 text-white border-white/20"
                              }`}
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span>Store Credit Note</span>
                            </button>
                          </div>
                        ) : (
                          <div className="px-3 py-2 bg-white/10 rounded-xl text-stone-300 text-xs font-semibold">
                            ✅ Even Exchange — No money transaction required.
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-stone-300 text-[11px] font-bold block mb-1">Exchange Notes / Reason:</span>
                        <input
                          type="text"
                          placeholder="e.g. Size L replaced with Size XL at customer request"
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleExecuteExchange}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <PackageCheck className="w-5 h-5 text-stone-950" />
                      <span>Complete Exchange &amp; Update Inventory Stock</span>
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* STEP 5: SUCCESS & EXCHANGE RECEIPT SLIP */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-emerald-950">Exchange Processed Successfully!</h3>
                    <p className="text-xs text-emerald-700">
                      Voucher #{completedExchange.exchangeNo} • Stock updated in Showroom &amp; Cloud.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintSlip}
                    className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Thermal Slip</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Printable Receipt Preview */}
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 font-mono text-xs max-w-lg mx-auto shadow-inner text-stone-800 whitespace-pre leading-relaxed overflow-x-auto">
                {ExchangeService.generateSlipText(completedExchange)}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setCompletedExchange(null);
                    setSelectedBill(null);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Done &amp; Return to POS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
