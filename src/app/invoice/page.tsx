"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Share2, ArrowLeft } from "lucide-react";
import { CompletedBill } from "@/types/pos";
import { supabase } from "@/lib/supabaseClient";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

function InvoiceContent() {
  const searchParams = useSearchParams();
  const billId = searchParams.get("id");
  const [bill, setBill] = useState<CompletedBill | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const invoiceBarcodeSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!billId) {
      setLoading(false);
      return;
    }

    // 1. Check local storage first (instant priority for fresh POS checkout in this browser)
    try {
      const rawBills = localStorage.getItem("rajnandni_bills");
      if (rawBills) {
        const bills: CompletedBill[] = JSON.parse(rawBills);
        const found = bills.find(b => b.billNo === billId || b.id === billId);
        if (found) {
          setBill(found);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Local storage check note:", e);
    }

    // 2. Fallback to Supabase cloud database
    const fetchInvoice = async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("bills")
            .select("*")
            .eq("invoice_number", billId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            let productsMap: Map<string, any> = new Map();
            try {
              const rawProds = typeof window !== "undefined" ? localStorage.getItem("rajnandni_products") : null;
              if (rawProds) {
                const list = JSON.parse(rawProds);
                list.forEach((p: any) => {
                  if (p.id) productsMap.set(p.id, p);
                  if (p.sku) productsMap.set(p.sku.toLowerCase(), p);
                });
              }
            } catch {}

            const mappedBill: CompletedBill = {
              id: data.id,
              billNo: data.invoice_number,
              customer: {
                name: data.customer_name || "WALK-IN",
                phone: data.customer_phone || "",
                notes: ""
              },
              items: (data.items || []).map((it: any) => {
                const matched = productsMap.get(it.id) || (it.sku ? productsMap.get(it.sku.toLowerCase()) : null);
                const authenticBarcode = it.barcode || it.product?.barcode || matched?.barcode || "";
                return {
                  product: {
                    id: it.id || "",
                    name: it.name || "Ethnic Garment",
                    sku: it.sku || "",
                    barcode: authenticBarcode,
                    category: it.category || "sarees",
                    price: it.price || 0,
                    mrp: it.mrp || Math.round((it.price || 0) * 1.25),
                    purchaseCost: 0,
                    stock: 1
                  },
                  quantity: it.quantity || 1,
                  price: it.price || 0,
                  originalPrice: it.mrp || Math.round((it.price || 0) * 1.25),
                  selectedSize: it.size || "Standard",
                  customDiscount: 0
                };
              }),
              subtotal: Number(data.subtotal) || 0,
              discount: Number(data.discount) || 0,
              taxGst: Number(data.tax) || 0,
              grandTotal: Number(data.total) || 0,
              paidAmount: Number(data.total) || 0,
              paymentMode: data.payment_mode || "UPI",
              createdAt: new Date(data.created_at).toLocaleString("en-IN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
              }).replace(/\//g, "-")
            };
            setBill(mappedBill);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Supabase fetch notice:", e);
        }
      }

      setLoading(false);
    };

    fetchInvoice();
  }, [billId]);

  // Render Barcode for the invoice number (like Zudio's footer barcode)
  useEffect(() => {
    if (invoiceBarcodeSvgRef.current && bill) {
      try {
        const cleanNo = bill.billNo.replace(/[^a-zA-Z0-9]/g, "");
        JsBarcode(invoiceBarcodeSvgRef.current, `-${cleanNo}-`, {
          format: "CODE128",
          width: 1.6,
          height: 52,
          displayValue: true,
          font: "monospace",
          fontSize: 12,
          textMargin: 3,
          margin: 0
        });
      } catch (e) {
        console.error("Invoice barcode error:", e);
      }
    }
  }, [bill]);

  // Generate QR Code for Rajnandini Fanz (Feedback / Website link)
  useEffect(() => {
    if (typeof window !== "undefined" && bill) {
      QRCode.toDataURL(window.location.href, { width: 140, margin: 1 }, (err, url) => {
        if (!err && url) setQrDataUrl(url);
      });
    }
  }, [bill]);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!bill) return;
    const rawPhone = bill.customer.phone.replace(/[^0-9]/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const msg = `🌸 *RAJNANDINI - DIGITAL TAX INVOICE* 🌸\n\nNamaste ${bill.customer.name} Ji! 🙏\n\n🧾 *Invoice No:* ${bill.billNo}\n💰 *Total Amount:* ₹${bill.grandTotal.toLocaleString("en-IN")}\n📅 *Date:* ${bill.createdAt}\n\n📄 *View & Download Official PDF Bill (Zudio Style):*\n${currentUrl}\n\n*Darshan Enterprises*\nNear PSC petrolpump Ranipur goan , haridwar , Uttrakhand  249401\nGSTIN: 05GNZPS9902M1ZR\nPh: +91 7464987898\n\nThank you for shopping with Rajnandini! 💖`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-sm w-full">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-900 font-mono">Loading Tax Invoice...</p>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-stone-200">
          <h2 className="text-xl font-bold text-stone-900">Invoice Not Found</h2>
          <p className="text-xs text-stone-500 mt-2 mb-6">
            The requested invoice (#{billId}) was not found in the database.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Rajnandini POS</span>
          </a>
        </div>
      </div>
    );
  }

  // Calculate 5% GST breakdown (CGST 2.5% + SGST 2.5%) standard on apparel
  const totalAmount = bill.grandTotal;
  const taxableValue = Math.round((totalAmount / 1.05) * 100) / 100;
  const totalGst = Math.round((totalAmount - taxableValue) * 100) / 100;
  const cgstAmount = Math.round((totalGst / 2) * 100) / 100;
  const sgstAmount = Math.round((totalGst / 2) * 100) / 100;

  // Customer phone: Show full phone number per user request
  const customerPhone = bill.customer.phone && bill.customer.phone.trim() !== ""
    ? bill.customer.phone
    : "WALK-IN";

  const totalQty = bill.items.reduce((s, it) => s + it.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-200/70 py-6 px-3 flex flex-col items-center print:bg-white print:p-0">
      {/* Top Floating Action Bar (Hidden in Print / PDF export) */}
      <div className="no-print max-w-[620px] w-full flex items-center justify-between mb-4 bg-white p-3 rounded-2xl shadow-md border border-stone-200">
        <a
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to POS</span>
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp Bill</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF / Print</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          ZUDIO INSPIRATION INVOICE CONTAINER
          ======================================================== */}
      <div
        id="zudio-style-invoice"
        className="max-w-[620px] w-full bg-white p-8 md:p-10 shadow-2xl border border-stone-300 font-sans text-black print:shadow-none print:border-none print:p-2 print:max-w-full"
        style={{ color: "#000", fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {/* PAGE 1: HEADER & TAX INVOICE */}
        <div>
          {/* Brand Logo & Store details */}
          <div className="flex flex-col items-center justify-center text-center pb-3">
            <img
              src="/rajnandini-logo.jpg"
              alt="Rajnandini"
              className="w-20 h-20 rounded-full object-cover border-2 border-black mb-2 shadow-xs"
            />
            <h1 className="text-3xl font-black tracking-wider uppercase text-black" style={{ letterSpacing: "1px" }}>
              RAJNANDINI
            </h1>
            <p className="text-[11px] font-extrabold tracking-widest text-black uppercase mt-0.5">
              Fashion · Jewellery · Beauty
            </p>
            <p className="text-[11px] font-bold text-black mt-0.5">
              Rajnandini - Haridwar - Ranipur
            </p>
          </div>

          {/* Official Company Legal Details (User Mandated) */}
          <div className="text-center py-2 border-t-2 border-black text-[11px] leading-relaxed text-black">
            <p className="font-black text-sm tracking-wide">Darshan Enterprises</p>
            <p className="text-[11px] font-bold">Store Contact Number : +91 7464987898</p>
            <p className="text-[11px] font-semibold max-w-md mx-auto">
              <strong>Place Of Supply :</strong> Near PSC petrolpump Ranipur goan , haridwar , Uttrakhand  249401
            </p>
            <p className="font-black text-xs mt-0.5 tracking-wider">
              GSTIN NO : 05GNZPS9902M1ZR
            </p>
          </div>

          {/* TAX INVOICE Title */}
          <div className="text-center my-3">
            <h2 className="text-sm font-black tracking-widest uppercase inline-block border-b-2 border-black pb-0.5 text-black">
              TAX INVOICE
            </h2>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 text-[11px] font-bold py-2 border-t-2 border-dashed border-black space-y-0.5 text-black font-mono">
            <div>
              <p><strong>INVOICE NO. :</strong> {bill.billNo}</p>
              <p><strong>COUNTER :</strong> 1</p>
              <p><strong>CUSTOMER ID :</strong> {bill.customer.name.toUpperCase()}</p>
              <p><strong>MOBILE NO :</strong> {customerPhone}</p>
            </div>
            <div className="text-right">
              <p>{bill.createdAt}</p>
              <p><strong>CASHIER :</strong> 76332</p>
            </div>
          </div>

          {/* Table Header: Clean 3-section layout avoiding squishing */}
          <div className="border-t-2 border-b-2 border-black py-1.5 my-2 font-mono text-[11px] font-black uppercase text-black">
            <div className="flex justify-between items-center">
              <span className="w-[52%] text-left">ITEM &amp; CODE</span>
              <span className="w-[20%] text-center">QTY &amp; RATE</span>
              <span className="w-[28%] text-right">TOTAL AMOUNT</span>
            </div>
          </div>

          {/* Item Rows: Spacious, legible, zero overlapping */}
          <div className="space-y-3 py-1.5 text-[11.5px] font-mono text-black">
            {bill.items.map((it, idx) => {
              const itemTotal = it.price * it.quantity;
              const itemTaxable = Math.round((itemTotal / 1.05) * 100) / 100;
              const hsnCode = it.product.sku?.startsWith("RJ-SAR") ? "54075200" : "62059090";

              return (
                <div key={idx} className="border-b border-dashed border-black pb-2.5">
                  {/* Line 1: Item Name (Bold) and Item Total (Bold, Large) */}
                  <div className="flex justify-between items-start text-black font-sans font-black text-[13px]">
                    <span className="max-w-[70%] leading-tight">
                      {idx + 1}. {it.product.name}
                    </span>
                    <span className="text-right font-mono font-black text-[14px] whitespace-nowrap">
                      ₹{itemTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Line 2: Barcode / SKU + Qty x Rate */}
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-black mt-1">
                    <span>
                      HSN: {hsnCode}{(it.product?.barcode || (it as any).barcode) ? ` · Barcode: ${it.product?.barcode || (it as any).barcode}` : (it.product?.sku ? ` · SKU: ${it.product.sku}` : "")}
                    </span>
                    <span className="text-right font-black">
                      {it.quantity} PC @ ₹{it.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Line 3: Taxable Value & GST share */}
                  <div className="flex justify-between text-[10.5px] text-black font-mono font-semibold mt-0.5">
                    <span>Taxable Value: ₹{itemTaxable.toFixed(2)}</span>
                    <span>GST (5%): ₹{(itemTotal - itemTaxable).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gross Total & Total Invoice Amount */}
          <div className="border-t-2 border-b-2 border-black py-2.5 my-3 space-y-1 text-xs font-bold font-mono text-black">
            <div className="flex justify-between">
              <span>Gross Total:</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between font-bold text-black">
                <span>Special Discount ({bill.discountReason || "Deal"}):</span>
                <span>-₹{bill.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[16px] font-black pt-1.5 border-t border-black">
              <span>TOTAL INVOICE AMOUNT:</span>
              <span>₹{bill.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Tax Details Table: Detailed CGST & SGST Breakdown */}
          <div className="my-3 border-2 border-black rounded-xs p-2.5 text-black font-mono text-[11px]">
            <p className="text-[12px] font-black text-center mb-2 uppercase tracking-wider border-b-2 border-black pb-1">
              TAX DETAILS (DETAILED GST BREAKDOWN)
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span>Net Taxable Value:</span>
                <span>₹{taxableValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span>CGST (Central Tax @ 2.5%):</span>
                <span>₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span>SGST (State Tax @ 2.5%):</span>
                <span>₹{sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[12px] font-black border-t-2 border-dashed border-black pt-1.5">
                <span>TOTAL TAX AMOUNT (GST 5%):</span>
                <span>₹{totalGst.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tender Detail */}
          <div className="border-t-2 border-b-2 border-black py-2 my-3 text-[11px] font-mono text-black">
            <p className="font-black text-[11px] uppercase mb-1">Tender Detail</p>
            <div className="flex justify-between items-center font-bold">
              <span className="uppercase">
                {bill.paymentMode === "staff_salary"
                  ? `STAFF SALARY DEDUCTION ${bill.staffBuyerName ? `(${bill.staffBuyerName})` : ""}`
                  : `${bill.paymentMode} PAYMENT`}
              </span>
              <span className="font-mono">{customerPhone !== "WALK-IN" ? customerPhone : ""}</span>
              <span className="font-black text-xs">₹{bill.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* PAGE 2 / FOOTER SECTION */}
        <div className="pt-2 text-[11px] text-black">
          <div className="flex justify-between font-black font-mono py-1.5 border-b-2 border-black text-xs">
            <span>TOTAL RECEIVED AMOUNT:</span>
            <span>₹{bill.grandTotal.toFixed(2)}</span>
          </div>

          <div className="py-2 space-y-0.5 text-[10.5px] font-bold font-mono">
            <p>NO OF ITEMS : {bill.items.length}</p>
            <p>TOTAL QTY : {totalQty}.00</p>
          </div>

          {/* Terms & Conditions / Return & Exchange Policy */}
          <div className="text-[10px] text-black leading-snug my-4 p-3 border-2 border-black rounded-xs space-y-1.5 text-center font-sans">
            <p className="font-black text-[12px] uppercase tracking-wide text-black">
              ★ RETURN &amp; EXCHANGE POLICY ★
            </p>
            <p className="font-black text-[11px] text-black">
              • NO CASH REFUND / MONEY RETURN — ONLY EXCHANGE ALLOWED.
            </p>
            <p className="font-bold text-[10.5px] text-black">
              • Exchange valid within 5 DAYS ONLY with original bill &amp; price tags intact.
            </p>
            <p className="font-semibold text-[9.5px] text-black">
              • Altered, washed, worn, or damaged garments will not be exchanged.
            </p>
            <p className="font-bold text-[9px] pt-1 border-t border-dashed border-black text-black">
              * This is a computer generated tax invoice and does not require a physical signature.
            </p>
          </div>

          {/* INVOICE BARCODE MATCHING INSPIRATION */}
          <div className="my-5 flex flex-col items-center justify-center">
            <svg ref={invoiceBarcodeSvgRef} className="max-w-[280px] h-auto" />
          </div>

          {/* Social Follow & Instagram QR Code */}
          <div className="text-center my-6 border-t-2 border-black pt-4 text-black">
            <p className="text-xs font-black text-black mb-1 uppercase tracking-wider">
              Follow Us on Instagram
            </p>
            <p className="text-[11px] font-bold text-black mb-2">
              Scan to view latest ethnic collections &amp; offers
            </p>
            <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white mb-3">
              <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
            </div>

            {/* Official Instagram QR Code Card */}
            <div className="max-w-[210px] mx-auto p-2.5 rounded-xl border-2 border-black bg-white shadow-xs">
              <img
                src="/instagram-qr.png"
                alt="Instagram @RAJNANDINISTORE"
                className="w-44 h-auto mx-auto object-contain"
              />
              <p className="text-[11.5px] font-black text-black mt-1.5 tracking-wide uppercase font-mono">
                @RAJNANDINISTORE
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <p className="text-sm font-bold text-stone-800 font-mono">Loading Rajnandini Tax Invoice...</p>
      </div>
    }>
      <InvoiceContent />
    </Suspense>
  );
}
