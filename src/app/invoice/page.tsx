"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Printer, Share2, ArrowLeft, CheckCircle2, Scissors, Sparkles } from "lucide-react";
import { CompletedBill } from "@/types/pos";
import { createClient } from "@supabase/supabase-js";

function InvoiceContent() {
  const searchParams = useSearchParams();
  const billId = searchParams.get("id");
  const [bill, setBill] = useState<CompletedBill | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!billId) {
      setLoading(false);
      return;
    }

    // 1. Try fetching from Supabase first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const fetchInvoice = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase
            .from("bills")
            .select("*")
            .eq("invoice_number", billId)
            .maybeSingle();

          if (!error && data) {
            const mappedBill: CompletedBill = {
              id: data.id,
              billNo: data.invoice_number,
              customer: {
                name: data.customer_name || "Customer",
                phone: data.customer_phone || "",
                notes: ""
              },
              items: (data.items || []).map((it: any) => ({
                product: {
                  id: it.id || "",
                  name: it.name || "Ethnic Garment",
                  sku: it.sku || "",
                  barcode: "",
                  category: "sarees",
                  price: it.price || 0,
                  mrp: it.price || 0,
                  purchaseCost: 0,
                  stock: 1
                },
                quantity: it.quantity || 1,
                price: it.price || 0,
                selectedSize: it.size || "Standard",
                customDiscount: 0
              })),
              subtotal: Number(data.subtotal) || 0,
              discount: Number(data.discount) || 0,
              taxGst: Number(data.tax) || 0,
              grandTotal: Number(data.total) || 0,
              paidAmount: Number(data.total) || 0,
              paymentMode: data.payment_mode || "UPI",
              createdAt: new Date(data.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
            };
            setBill(mappedBill);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Supabase fetch notice:", e);
        }
      }

      loadFromLocal();
    };

    fetchInvoice();

    function loadFromLocal() {
      try {
        const rawBills = localStorage.getItem("rajnandni_bills");
        if (rawBills) {
          const bills: CompletedBill[] = JSON.parse(rawBills);
          const found = bills.find(b => b.billNo === billId || b.id === billId);
          if (found) {
            setBill(found);
          }
        }
      } catch (e) {
        console.error("Local storage load error:", e);
      }
      setLoading(false);
    }
  }, [billId]);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!bill) return;
    const rawPhone = bill.customer.phone.replace(/[^0-9]/g, "");
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const currentUrl = window.location.href;
    const msg = `🌸 *RAJNANDNI BOUTIQUE - OFFICIAL DIGITAL BILL* 🌸\n\nNamaste ${bill.customer.name} Ji! 🙏\nAapka bill ready hai.\n\n🧾 *Bill No:* ${bill.billNo}\n💰 *Amount Paid:* ₹${bill.grandTotal.toLocaleString("en-IN")}\n📅 *Date:* ${bill.createdAt}\n\n📄 *View & Download PDF Bill:* ${currentUrl}\n\nThank you for shopping with Rajnandni! 💖`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-sm w-full">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-900">Loading Official Invoice...</p>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-stone-200">
          <h2 className="text-xl font-bold text-stone-900 font-serif">Invoice Not Found</h2>
          <p className="text-xs text-stone-500 mt-2 mb-6">
            The requested invoice (#{billId}) was not found or has expired.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-950 text-amber-300 rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Rajnandni POS</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-6 px-4 flex flex-col items-center">
      {/* Top Floating Action Bar (Hidden in Print / PDF export) */}
      <div className="no-print max-w-2xl w-full flex items-center justify-between mb-4 bg-white p-3.5 rounded-2xl shadow-xs border border-stone-200">
        <a
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to POS</span>
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share on WhatsApp</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-950 hover:bg-stone-900 text-amber-300 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition border border-amber-500/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF / Print</span>
          </button>
        </div>
      </div>

      {/* INVOICE PAPER (Styled for standard A4 and Mobile PDF viewing) */}
      <div
        id="invoice-paper"
        className="max-w-2xl w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-stone-200 text-stone-900 print:shadow-none print:border-none print:p-4 print:max-w-full"
      >
        {/* Header */}
        <div className="text-center pb-6 border-b-2 border-stone-900">
          <span className="text-[11px] font-bold tracking-widest uppercase text-amber-700 block mb-1">
            ESTD. 2026 · HARIDWAR
          </span>
          <h1 className="text-2xl md:text-3xl font-black font-serif tracking-tight text-stone-950">
            RAJNANDNI BOUTIQUE &amp; PARLOUR
          </h1>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Exclusive Bridal Lehengas · Designer Sarees · Suits · Jewellery &amp; Beauty Studio
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Arya Nagar / Rajeev Nagar, Jwalapur, Haridwar, Uttarakhand - 249407
          </p>
          <p className="text-[11px] font-bold text-stone-700 mt-1">
            GSTIN: 05GNZPS9902M1ZR · Contact: +91 98970 00000 / +91 98370 00000
          </p>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-2 gap-4 py-5 border-b border-stone-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Billed To (Customer):</span>
            <p className="text-sm font-black text-stone-950 mt-0.5">{bill.customer.name}</p>
            <p className="text-stone-600 font-medium">Phone: +91 {bill.customer.phone}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Invoice Details:</span>
            <p className="text-sm font-black font-mono text-stone-950 mt-0.5">#{bill.billNo}</p>
            <p className="text-stone-600">Date: {bill.createdAt}</p>
            <p className="text-stone-600">Payment: <strong className="uppercase text-stone-950">{bill.paymentMode}</strong></p>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-900 text-stone-950 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5">#</th>
                <th className="py-2.5">Item Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Rate</th>
                <th className="py-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bill.items.map((it, idx) => (
                <tr key={idx} className="py-2.5">
                  <td className="py-3 text-stone-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-3">
                    <p className="font-bold text-stone-950">{it.product.name}</p>
                    <p className="text-[10px] text-stone-500 font-mono">
                      SKU: {it.product.sku} {it.selectedSize && `· Size: ${it.selectedSize}`}
                    </p>
                  </td>
                  <td className="py-3 text-center font-bold">{it.quantity}</td>
                  <td className="py-3 text-right text-stone-700">₹{it.price.toLocaleString("en-IN")}</td>
                  <td className="py-3 text-right font-black text-stone-950">
                    ₹{(it.quantity * it.price).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="border-t-2 border-stone-900 pt-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal (MRP Total):</span>
            <span className="font-semibold">₹{bill.subtotal.toLocaleString("en-IN")}</span>
          </div>

          {bill.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Negotiated Store Discount {bill.discountReason && `(${bill.discountReason})`}:</span>
              <span>- ₹{bill.discount.toLocaleString("en-IN")}</span>
            </div>
          )}

          {(bill.totalSavings || bill.discount) > 0 && (
            <div className="flex justify-between items-center bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-bold text-amber-950 text-xs my-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Total Customer Savings on this Bill:
              </span>
              <span>₹{(bill.totalSavings || bill.discount).toLocaleString("en-IN")}</span>
            </div>
          )}

          <div className="flex justify-between text-base md:text-lg font-black text-stone-950 border-t border-stone-200 pt-2">
            <span>Grand Total Paid:</span>
            <span>₹{bill.grandTotal.toLocaleString("en-IN")}</span>
          </div>
          <p className="text-[10px] text-stone-500 text-right">
            Paid in Full via {bill.paymentMode.toUpperCase()}
          </p>
        </div>

        {/* Alteration Slip (If tailoring service included) */}
        {bill.alteration && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Scissors className="w-3.5 h-3.5 text-amber-700" />
              <span>Tailoring &amp; Alteration Fitting Slip</span>
            </div>
            <p className="text-stone-800"><strong>Garment:</strong> {bill.alteration.garmentName}</p>
            <p className="text-stone-800"><strong>Measurements:</strong> {bill.alteration.fittingNotes}</p>
            <p className="text-stone-800"><strong>Assigned Tailor:</strong> {bill.alteration.tailorName}</p>
            <p className="text-emerald-800 font-bold"><strong>Expected Trial / Delivery Date:</strong> {bill.alteration.readyDate}</p>
          </div>
        )}

        {/* Footer Terms */}
        <div className="mt-8 pt-4 border-t border-stone-200 text-center text-[10px] text-stone-500 space-y-1">
          <p className="font-bold text-stone-800">
            Thank you for choosing Rajnandni! Please visit again 💖
          </p>
          <p>
            • Goods once sold can be exchanged within 7 days with this bill intact.
            • Alteration orders must be picked up within 15 days of trial date.
          </p>
          <p className="font-mono text-[9px] text-stone-400 pt-1">
            Official Computer-Generated Tax &amp; Retail Invoice
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <p className="text-sm font-bold text-stone-800">Loading Invoice...</p>
      </div>
    }>
      <InvoiceContent />
    </Suspense>
  );
}
