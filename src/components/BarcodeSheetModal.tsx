"use client";

import React, { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Printer, X, Check, Copy, Tag, Sliders, Eye } from "lucide-react";
import { ProductItem } from "@/types/pos";

interface BarcodeSheetModalProps {
  product: ProductItem;
  onClose: () => void;
}

// Single barcode label sticker component
function SingleBarcodeLabel({
  product,
  showShopName = true,
  showMrp = true,
  showPrice = true,
  showSize = true,
  size = "standard"
}: {
  product: ProductItem;
  showShopName?: boolean;
  showMrp?: boolean;
  showPrice?: boolean;
  showSize?: boolean;
  size?: "standard" | "compact";
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && product.barcode) {
      try {
        JsBarcode(svgRef.current, product.barcode, {
          format: "CODE128",
          width: size === "compact" ? 1.2 : 1.5,
          height: size === "compact" ? 28 : 36,
          displayValue: true,
          font: "monospace",
          fontSize: size === "compact" ? 9 : 11,
          textMargin: 1,
          margin: 0,
        });
      } catch (err) {
        console.error("JsBarcode render error:", err);
      }
    }
  }, [product.barcode, size]);

  return (
    <div
      className={`border border-dashed border-stone-300 bg-white rounded-md p-2 flex flex-col justify-between items-center text-center overflow-hidden break-inside-avoid print:border-black/40 print:rounded-none ${
        size === "compact" ? "h-[32mm] w-[48mm]" : "h-[36mm] w-[64mm]"
      }`}
      style={{ boxSizing: "border-box" }}
    >
      {/* Shop Name */}
      {showShopName && (
        <div className="w-full border-b border-stone-200 print:border-black/30 pb-0.5 mb-0.5">
          <span className="font-serif font-black text-[9px] tracking-wider uppercase text-stone-900 block leading-tight">
            RAJNANDNI BOUTIQUE
          </span>
          <span className="text-[7px] text-stone-500 print:text-black tracking-tight block">
            Haridwar · Fashion &amp; Parlour
          </span>
        </div>
      )}

      {/* Item Title */}
      <div className="w-full px-1">
        <p className="text-[9.5px] font-bold text-stone-950 truncate leading-snug">
          {product.name}
        </p>
        <p className="text-[7.5px] font-mono text-stone-600 print:text-black truncate">
          SKU: {product.sku} {showSize && `· ${product.sizes?.[0] || "Std"}`}
        </p>
      </div>

      {/* Real Barcode SVG */}
      <div className="my-0.5 flex justify-center items-center w-full">
        <svg ref={svgRef} className="max-w-full h-auto" />
      </div>

      {/* Pricing Footer */}
      <div className="w-full flex items-center justify-between border-t border-stone-200 print:border-black/30 pt-0.5 px-1 text-[9px]">
        {showMrp && (
          <span className="text-stone-500 print:text-black line-through text-[8.5px]">
            MRP: ₹{product.mrp}
          </span>
        )}
        {showPrice && (
          <span className="font-extrabold text-stone-950 text-[10px] ml-auto">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}

export default function BarcodeSheetModal({ product, onClose }: BarcodeSheetModalProps) {
  // Preset options for laser printer sticker sheets
  const [sheetType, setSheetType] = useState<"a4-24" | "a4-40" | "custom">("a4-24");
  const [labelCount, setLabelCount] = useState<number>(24);
  const [showShopName, setShowShopName] = useState<boolean>(true);
  const [showMrp, setShowMrp] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showSize, setShowSize] = useState<boolean>(true);

  // Update label count when sheet type changes
  const handleSheetTypeChange = (type: "a4-24" | "a4-40" | "custom") => {
    setSheetType(type);
    if (type === "a4-24") setLabelCount(24);
    else if (type === "a4-40") setLabelCount(40);
    else setLabelCount(6);
  };

  const handlePrint = () => {
    // Trigger standard browser laser print dialog
    window.print();
  };

  return (
    <>
      {/* SCREEN DIALOG MODAL */}
      <div className="no-print fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-stone-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-950 text-base font-serif flex items-center gap-2">
                  <span>Laser Printer Barcode Sheet</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                    A4 Sticker Sheet Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {product.name} (Code: <span className="font-mono font-bold text-stone-900">{product.barcode}</span> · SKU: {product.sku})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-stone-900 rounded-lg hover:bg-slate-200 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Controls & Live Preview */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: Laser Printer Sheet Configuration */}
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-stone-800 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Tag className="w-3.5 h-3.5 text-amber-700" />
                  Laser Printer Guidelines (HP / Canon / Brother):
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Market me milne wale standard <strong>A4 Sticker Sheets (Oddy / Century)</strong> laser printer tray me dalein. Software exact size me barcode print karega jisko peel karke direct saree/suit tag par chipka sakte hain.
                </p>
              </div>

              {/* Sheet Layout Selector */}
              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1.5">
                  Select A4 Sticker Sheet Type:
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSheetTypeChange("a4-24")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      sheetType === "a4-24"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p>A4 Sheet (24 Labels · 3x8 Grid)</p>
                      <p className={`text-[10px] ${sheetType === "a4-24" ? "text-amber-200/80" : "text-slate-400"}`}>
                        Standard 64 x 34 mm (Best for Sarees &amp; Suits)
                      </p>
                    </div>
                    {sheetType === "a4-24" && <Check className="w-4 h-4 text-amber-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSheetTypeChange("a4-40")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      sheetType === "a4-40"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p>A4 Sheet (40 Labels · 4x10 Grid)</p>
                      <p className={`text-[10px] ${sheetType === "a4-40" ? "text-amber-200/80" : "text-slate-400"}`}>
                        Compact 48 x 25 mm (Best for Falls, Asters, Jewellery)
                      </p>
                    </div>
                    {sheetType === "a4-40" && <Check className="w-4 h-4 text-amber-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSheetTypeChange("custom")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      sheetType === "custom"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p>Custom Quantity</p>
                      <p className={`text-[10px] ${sheetType === "custom" ? "text-amber-200/80" : "text-slate-400"}`}>
                        Print specific number of stickers
                      </p>
                    </div>
                    {sheetType === "custom" && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>
              </div>

              {/* Number of stickers count */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-stone-800">Total Stickers to Print:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={labelCount}
                  onChange={e => setLabelCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold text-stone-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Label Content Toggles */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Label Elements:
                </span>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showShopName}
                    onChange={e => setShowShopName(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Show Shop Header (Rajnandni)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMrp}
                    onChange={e => setShowMrp(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Show Printed MRP (₹{product.mrp})</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={e => setShowPrice(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Show Selling Rate (₹{product.price})</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSize}
                    onChange={e => setShowSize(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Show Size / Options</span>
                </label>
              </div>

              {/* Big Print Button */}
              <button
                onClick={handlePrint}
                className="w-full py-3 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print {labelCount} Stickers on Laser Printer</span>
              </button>
            </div>

            {/* RIGHT: Live Visual Sheet Preview */}
            <div className="lg:col-span-2 bg-slate-100/80 p-4 rounded-2xl border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-slate-500" />
                  Live A4 Sheet Preview ({labelCount} Labels)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Scale: 1:1 Vector Code128
                </span>
              </div>

              {/* Scrollable preview container */}
              <div className="flex-1 bg-white p-4 rounded-xl shadow-inner border border-slate-300 overflow-y-auto max-h-[500px]">
                <div
                  className={`grid gap-2 justify-center ${
                    sheetType === "a4-40"
                      ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                  }`}
                >
                  {Array.from({ length: labelCount }).map((_, idx) => (
                    <SingleBarcodeLabel
                      key={idx}
                      product={product}
                      showShopName={showShopName}
                      showMrp={showMrp}
                      showPrice={showPrice}
                      showSize={showSize}
                      size={sheetType === "a4-40" ? "compact" : "standard"}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>💡 Tip: In Print dialog, set Margins to <strong>None</strong> or <strong>Minimum</strong>.</span>
                <span className="font-semibold text-stone-800">Scannable by 1D/2D Barcode Guns</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* PRINT-ONLY CSS & CONTAINER (ONLY RENDERED DURING WINDOW.PRINT) */}
      <div id="laser-barcode-print-sheet" className="hidden print:block print:w-full print:bg-white">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #laser-barcode-print-sheet, #laser-barcode-print-sheet * {
                visibility: visible;
              }
              #laser-barcode-print-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 4mm;
                background: white !important;
              }
              @page {
                size: A4 portrait;
                margin: 4mm;
              }
            }
          `
        }} />

        <div
          className={`grid gap-2 w-full justify-items-center ${
            sheetType === "a4-40" ? "grid-cols-4" : "grid-cols-3"
          }`}
          style={{ width: "100%" }}
        >
          {Array.from({ length: labelCount }).map((_, idx) => (
            <SingleBarcodeLabel
              key={idx}
              product={product}
              showShopName={showShopName}
              showMrp={showMrp}
              showPrice={showPrice}
              showSize={showSize}
              size={sheetType === "a4-40" ? "compact" : "standard"}
            />
          ))}
        </div>
      </div>
    </>
  );
}
