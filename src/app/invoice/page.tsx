"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Share2, ArrowLeft } from "lucide-react";
import { CompletedBill } from "@/types/pos";
import { createClient } from "@supabase/supabase-js";
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
                name: data.customer_name || "WALK-IN",
                phone: data.customer_phone || "",
                notes: ""
              },
              items: (data.items || []).map((it: any) => ({
                product: {
                  id: it.id || "",
                  name: it.name || "Ethnic Garment",
                  sku: it.sku || "",
                  barcode: it.barcode || "8901001",
                  category: "sarees",
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
              })),
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

  // Generate QR Code for Rajnandni Fanz (Feedback / Website link)
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
    const msg = `🌸 *RAJNANDNI - DIGITAL TAX INVOICE* 🌸\n\nNamaste ${bill.customer.name} Ji! 🙏\n\n🧾 *Invoice No:* ${bill.billNo}\n💰 *Total Amount:* ₹${bill.grandTotal.toLocaleString("en-IN")}\n📅 *Date:* ${bill.createdAt}\n\n📄 *View & Download Official PDF Bill (Zudio Style):*\n${currentUrl}\n\n*Darshan Enterprises*\nNear PSC Petropump, Ranipur, Haridwar\nGSTIN: 05GNZPS9902M1ZR\n\nThank you for shopping with Rajnandni! 💖`;
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
            <span>Return to Rajnandni POS</span>
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

  // Mask customer phone like Zudio: ******5639
  const maskedPhone = bill.customer.phone && bill.customer.phone.length >= 10
    ? `******${bill.customer.phone.slice(-4)}`
    : (bill.customer.phone || "WALK-IN");

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
          <div className="flex items-start justify-between pb-4">
            <div>
              {/* Clean lowercase bold brand font matching Zudio style */}
              <h1 className="text-3xl font-black tracking-tight leading-none" style={{ letterSpacing: "-1px" }}>
                rajnandni
              </h1>
            </div>
            <div className="text-right text-[11px] leading-tight">
              <p className="font-semibold text-stone-900">Rajnandni - Haridwar - Ranipur</p>
              <p className="text-[10px] text-stone-500 cursor-pointer">Store Details &gt;</p>
            </div>
          </div>

          {/* Feedback smiley row matching inspiration */}
          <div className="border-t border-b border-stone-200 py-3 my-2 text-center">
            <p className="text-xs text-stone-700 font-medium mb-1.5">
              Tell us about your overall experience
            </p>
            <div className="flex justify-center items-center gap-4 text-xl">
              <span className="cursor-pointer hover:scale-125 transition-transform" title="Good">😊</span>
              <span className="cursor-pointer hover:scale-125 transition-transform" title="Neutral">😐</span>
              <span className="cursor-pointer hover:scale-125 transition-transform" title="Bad">☹️</span>
            </div>
          </div>

          {/* Official Company Legal Details (User Mandated) */}
          <div className="text-center py-2 text-[11px] leading-relaxed">
            <p className="font-bold text-sm tracking-wide">Darshan Enterprises</p>
            <p className="text-[10.5px]">Store Contact Number : +91 98970 00000</p>
            <p className="text-[10.5px] max-w-md mx-auto">
              <strong>Place Of Supply :</strong> Near PSC Petropump, Ranipur, Haridwar, Uttarakhand - 249401
            </p>
            <p className="font-bold text-xs mt-0.5 tracking-wider">
              GSTIN NO : 05GNZPS9902M1ZR
            </p>
          </div>

          {/* TAX INVOICE Title */}
          <div className="text-center my-3">
            <h2 className="text-sm font-black tracking-widest uppercase inline-block border-b-2 border-black pb-0.5">
              TAX INVOICE
            </h2>
          </div>

          {/* Meta Grid matching inspiration */}
          <div className="grid grid-cols-2 text-[10.5px] py-2 border-t border-dashed border-stone-300 space-y-0.5">
            <div>
              <p><strong>INVOICE NO. :</strong> {bill.billNo}</p>
              <p><strong>COUNTER :</strong> 1</p>
              <p><strong>CUSTOMER ID :</strong> {bill.customer.name.toUpperCase()}</p>
              <p><strong>MOBILE NO :</strong> {maskedPhone}</p>
            </div>
            <div className="text-right">
              <p>{bill.createdAt}</p>
              <p><strong>CASHIER :</strong> 76332</p>
            </div>
          </div>

          {/* Table Header matching inspiration */}
          <div className="border-t border-b border-black py-1.5 my-2">
            <div className="grid grid-cols-12 text-[10px] font-black uppercase">
              <div className="col-span-5">Item<br />Description</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-center">QTY/Unit<br />HSN-SAC</div>
              <div className="col-span-1 text-right">Disc.Amt</div>
              <div className="col-span-2 text-right">Net.Amt<br />Taxable</div>
            </div>
          </div>

          {/* Tax rate subheader */}
          <div className="text-[10px] font-bold py-1">
            A) CGST@2.5% SGST@2.5%
          </div>

          {/* Item Rows */}
          <div className="space-y-3 py-1 text-[10.5px]">
            {bill.items.map((it, idx) => {
              const itemTotal = it.price * it.quantity;
              const itemTaxable = Math.round((itemTotal / 1.05) * 100) / 100;
              const discAmt = it.originalPrice && it.originalPrice > it.price
                ? (it.originalPrice - it.price) * it.quantity
                : 0;

              return (
                <div key={idx} className="border-b border-stone-100 pb-2">
                  <div className="grid grid-cols-12 items-start">
                    <div className="col-span-5 font-mono text-[10px] font-bold">
                      {it.product.barcode || `3009${idx}8794`}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      ₹{it.price.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-center font-mono">
                      {it.quantity} PC
                    </div>
                    <div className="col-span-1 text-right font-mono text-stone-600">
                      ₹{discAmt.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-bold font-mono">
                      ₹{itemTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 text-[10px] text-stone-700 mt-0.5">
                    <div className="col-span-5 font-bold uppercase truncate pr-1">
                      {it.product.name}
                    </div>
                    <div className="col-span-2"></div>
                    <div className="col-span-2 text-center font-mono text-[9px] text-stone-500">
                      {it.product.sku?.startsWith("RJ-SAR") ? "54075200" : "62059090"}
                    </div>
                    <div className="col-span-1"></div>
                    <div className="col-span-2 text-right font-mono text-[9.5px] text-stone-600">
                      ₹{itemTaxable.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gross Total & Total Invoice Amount matching inspiration */}
          <div className="border-t border-b border-black py-2 my-3 space-y-1 text-xs font-bold font-mono">
            <div className="flex justify-between">
              <span>Gross Total:</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-stone-600 font-normal">
                <span>Special Discount:</span>
                <span>-₹{bill.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-stone-200">
              <span>Total Invoice Amount:</span>
              <span>₹{bill.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Tax Details Table matching inspiration */}
          <div className="my-4">
            <p className="text-[11px] font-bold text-center mb-1 uppercase tracking-wide">
              Tax Details
            </p>
            <div className="border border-stone-300 text-[9.5px] font-mono">
              <div className="grid grid-cols-6 bg-stone-100 p-1.5 font-bold border-b border-stone-300 text-center">
                <div>GST IND</div>
                <div>Taxable Value</div>
                <div>CGST</div>
                <div>SGST</div>
                <div>CESS</div>
                <div>Total Amount</div>
              </div>
              <div className="grid grid-cols-6 p-1.5 text-center border-b border-stone-200">
                <div>A)</div>
                <div>₹{taxableValue.toFixed(2)}</div>
                <div>₹{cgstAmount.toFixed(2)}</div>
                <div>₹{sgstAmount.toFixed(2)}</div>
                <div>₹0.00</div>
                <div>₹{totalAmount.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-6 p-1.5 font-bold text-center bg-stone-50">
                <div>Total</div>
                <div>₹{taxableValue.toFixed(2)}</div>
                <div>₹{cgstAmount.toFixed(2)}</div>
                <div>₹{sgstAmount.toFixed(2)}</div>
                <div>₹0.00</div>
                <div>₹{totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Tender Detail matching inspiration */}
          <div className="border-t border-b border-black py-2 my-3 text-[11px] font-mono">
            <p className="font-bold text-[10px] uppercase mb-1">Tender Detail</p>
            <div className="flex justify-between items-center">
              <span className="uppercase font-bold">{bill.paymentMode} PAYMENT</span>
              <span className="text-stone-500 font-mono">************{maskedPhone.slice(-4)}</span>
              <span className="font-bold">₹{bill.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* PAGE 2 / FOOTER SECTION MATCHING INSPIRATION */}
        <div className="pt-2 text-[10.5px]">
          <div className="flex justify-between font-bold font-mono py-1 border-b border-stone-300">
            <span>TOTAL RECEIVED AMOUNT</span>
            <span>₹{bill.grandTotal.toFixed(2)}</span>
          </div>

          <div className="py-2 space-y-0.5 text-[10px] font-bold">
            <p>NO OF ITEMS : {bill.items.length}</p>
            <p>TOTAL QTY : {totalQty}.00</p>
          </div>

          {/* Terms & Conditions matching inspiration */}
          <div className="text-[9.5px] text-stone-600 leading-normal my-4 space-y-1 text-center border-t border-stone-200 pt-3">
            <p>* All Offers are subject to applicable T&amp;C.</p>
            <p>* No return / Exchange / Refund on Altered, Washed or Damaged garments.</p>
            <p>* Please retain the product label to be eligible to return/ exchange the product within 7 days.</p>
            <p className="font-bold text-stone-800">* This is computer generated invoice and hence does not require any signature.</p>
          </div>

          {/* INVOICE BARCODE MATCHING INSPIRATION */}
          <div className="my-5 flex flex-col items-center justify-center">
            <svg ref={invoiceBarcodeSvgRef} className="max-w-[280px] h-auto" />
          </div>

          {/* Social Follow & Rajnandni Fanz QR matching inspiration */}
          <div className="text-center my-6 border-t border-stone-200 pt-4">
            <p className="text-xs font-bold text-stone-900 mb-2">
              Love what's in? Follow to know more
            </p>
            <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white mb-4">
              <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
            </div>

            {/* QR Code Container matching Zudio Fanz card */}
            <div className="max-w-[220px] mx-auto p-4 rounded-2xl border border-stone-300 bg-white shadow-xs">
              <p className="font-black text-xs uppercase tracking-wider mb-2">
                rajnandni <span className="text-amber-500 font-extrabold">FANZ</span>
              </p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Rajnandni Fanz QR" className="w-28 h-28 mx-auto border border-stone-200 rounded-lg p-1" />
              ) : (
                <div className="w-28 h-28 mx-auto bg-stone-100 flex items-center justify-center text-[10px] text-stone-400">
                  QR Loading...
                </div>
              )}
              <p className="text-[9px] font-bold text-stone-900 mt-2 lowercase">
                rajnandni
              </p>
            </div>
            <p className="text-[9.5px] text-stone-600 underline cursor-pointer mt-2">
              Download your Rajnandni Fanz QR
            </p>
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
        <p className="text-sm font-bold text-stone-800 font-mono">Loading Rajnandni Tax Invoice...</p>
      </div>
    }>
      <InvoiceContent />
    </Suspense>
  );
}
