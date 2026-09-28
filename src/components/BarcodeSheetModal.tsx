"use client";

import React, { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Printer, X, Check, Tag, Eye, Layers } from "lucide-react";
import { ProductItem } from "@/types/pos";

interface BarcodeSheetModalProps {
  product: ProductItem;
  onClose: () => void;
}

export type RollPreset = 
  | "tvs-50x25-2up"
  | "tvs-50x38-2up"
  | "tvs-75x50-1up"
  | "tvs-100x50-1up"
  | "tvs-100x75-1up"
  | "a4-24"
  | "a4-40";

// Single barcode label component formatted for various sticker sizes
function BarcodeTagItem({
  product,
  preset,
  showShopName,
  showMrp,
  showPrice,
  showSize,
}: {
  product: ProductItem;
  preset: RollPreset;
  showShopName: boolean;
  showMrp: boolean;
  showPrice: boolean;
  showSize: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && product.barcode) {
      try {
        let barWidth = 1.2;
        let barHeight = 22;
        let fontSize = 9;

        if (preset === "tvs-50x25-2up" || preset === "a4-40") {
          barWidth = 1.1;
          barHeight = 18;
          fontSize = 8;
        } else if (preset === "tvs-50x38-2up" || preset === "a4-24") {
          barWidth = 1.3;
          barHeight = 26;
          fontSize = 9.5;
        } else if (preset === "tvs-75x50-1up" || preset === "tvs-100x50-1up" || preset === "tvs-100x75-1up") {
          barWidth = 1.7;
          barHeight = 36;
          fontSize = 11;
        }

        JsBarcode(svgRef.current, product.barcode, {
          format: "CODE128",
          width: barWidth,
          height: barHeight,
          displayValue: true,
          font: "monospace",
          fontSize: fontSize,
          textMargin: 1,
          margin: 0,
        });
      } catch (err) {
        console.error("JsBarcode render error:", err);
      }
    }
  }, [product.barcode, preset]);

  // Dimension classes based on roll preset
  const getDimensionClass = () => {
    switch (preset) {
      case "tvs-50x25-2up":
        return "w-[49mm] h-[24mm] p-1 text-[8px]";
      case "tvs-50x38-2up":
        return "w-[49mm] h-[36mm] p-1.5 text-[9px]";
      case "tvs-75x50-1up":
        return "w-[73mm] h-[48mm] p-2 text-[10px]";
      case "tvs-100x50-1up":
        return "w-[98mm] h-[48mm] p-2 text-[11px]";
      case "tvs-100x75-1up":
        return "w-[98mm] h-[72mm] p-3 text-[12px]";
      case "a4-40":
        return "w-[48mm] h-[25mm] p-1 text-[8px]";
      case "a4-24":
      default:
        return "w-[64mm] h-[34mm] p-1.5 text-[9.5px]";
    }
  };

  return (
    <div
      className={`border border-dashed border-stone-300 print:border-none bg-white rounded-xs flex flex-col justify-between items-center text-center overflow-hidden break-inside-avoid print:rounded-none select-none ${getDimensionClass()}`}
      style={{ boxSizing: "border-box" }}
    >
      {/* Brand & Store Header */}
      {showShopName && (
        <div className="w-full border-b border-stone-200 print:border-black/40 pb-0.5 mb-0.5 leading-tight">
          <span className="font-serif font-black tracking-wider uppercase text-stone-900 block leading-tight text-[1.1em]">
            RAJNANDNI
          </span>
          <span className="text-[0.8em] text-stone-600 print:text-black tracking-tight block font-medium">
            Darshan Enterprises · Haridwar
          </span>
        </div>
      )}

      {/* Item Details */}
      <div className="w-full px-0.5 leading-snug">
        <p className="font-bold text-stone-950 truncate">
          {product.name}
        </p>
        <p className="font-mono text-stone-600 print:text-black text-[0.85em] truncate">
          SKU: {product.sku} {showSize && `· ${product.sizes?.[0] || "Std"}`}
        </p>
      </div>

      {/* Barcode Graphic */}
      <div className="my-0.5 flex justify-center items-center w-full overflow-hidden">
        <svg ref={svgRef} className="max-w-full h-auto" />
      </div>

      {/* Price & MRP Footer */}
      <div className="w-full flex items-center justify-between border-t border-stone-200 print:border-black/40 pt-0.5 px-0.5 text-[0.9em] leading-tight">
        {showMrp && (
          <span className="text-stone-500 print:text-black line-through text-[0.85em]">
            MRP: ₹{product.mrp}
          </span>
        )}
        {showPrice && (
          <span className="font-black text-stone-950 ml-auto text-[1.05em]">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}

export default function BarcodeSheetModal({ product, onClose }: BarcodeSheetModalProps) {
  // Mode: TVS 4-Inch Thermal Roll or A4 Laser Printer Sheet
  const [printerCategory, setPrinterCategory] = useState<"thermal" | "laser">("thermal");
  const [preset, setPreset] = useState<RollPreset>("tvs-50x25-2up");
  const [labelCount, setLabelCount] = useState<number>(20);

  // Content Visibility Toggles
  const [showShopName, setShowShopName] = useState<boolean>(true);
  const [showMrp, setShowMrp] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showSize, setShowSize] = useState<boolean>(true);

  // Switch presets
  const handleSelectPreset = (newPreset: RollPreset) => {
    setPreset(newPreset);
    if (newPreset === "tvs-50x25-2up" || newPreset === "tvs-50x38-2up") {
      setLabelCount(20);
    } else if (newPreset === "a4-24") {
      setLabelCount(24);
    } else if (newPreset === "a4-40") {
      setLabelCount(40);
    } else {
      setLabelCount(10);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Group labels into rows for 2-up thermal rolls
  const isTwoUp = preset === "tvs-50x25-2up" || preset === "tvs-50x38-2up";
  const numRows = isTwoUp ? Math.ceil(labelCount / 2) : labelCount;

  // Generate dynamic @page CSS rule based on active preset
  const getPageStyle = () => {
    switch (preset) {
      case "tvs-50x25-2up":
        return `
          @page {
            size: 104mm 25mm;
            margin: 0mm;
          }
          .thermal-row {
            page-break-after: always;
            break-after: page;
            height: 25mm;
            width: 104mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
            padding: 0.5mm 1mm;
          }
        `;
      case "tvs-50x38-2up":
        return `
          @page {
            size: 104mm 38mm;
            margin: 0mm;
          }
          .thermal-row {
            page-break-after: always;
            break-after: page;
            height: 38mm;
            width: 104mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
            padding: 0.5mm 1mm;
          }
        `;
      case "tvs-75x50-1up":
        return `
          @page {
            size: 75mm 50mm;
            margin: 0mm;
          }
          .thermal-single {
            page-break-after: always;
            break-after: page;
            height: 50mm;
            width: 75mm;
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
          }
        `;
      case "tvs-100x50-1up":
        return `
          @page {
            size: 100mm 50mm;
            margin: 0mm;
          }
          .thermal-single {
            page-break-after: always;
            break-after: page;
            height: 50mm;
            width: 100mm;
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
          }
        `;
      case "tvs-100x75-1up":
        return `
          @page {
            size: 100mm 75mm;
            margin: 0mm;
          }
          .thermal-single {
            page-break-after: always;
            break-after: page;
            height: 75mm;
            width: 100mm;
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
          }
        `;
      case "a4-40":
      case "a4-24":
      default:
        return `
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
        `;
    }
  };

  return (
    <>
      {/* SCREEN MODAL DIALOG */}
      <div className="no-print fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-950 text-base font-serif flex items-center gap-2">
                  <span>Barcode Sticker Printer</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                    TVS 4-Inch &amp; Laser Ready
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  {product.name} (Barcode: <span className="font-mono font-bold text-stone-900">{product.barcode}</span> · SKU: {product.sku})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-200 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Controls & Live Preview */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Controls & Presets */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Category Switcher: TVS Thermal Roll vs A4 Laser */}
              <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setPrinterCategory("thermal");
                    handleSelectPreset("tvs-50x25-2up");
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    printerCategory === "thermal"
                      ? "bg-white text-stone-950 shadow-xs border border-stone-200"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>TVS 4&quot; Roll Printer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrinterCategory("laser");
                    handleSelectPreset("a4-24");
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    printerCategory === "laser"
                      ? "bg-white text-stone-950 shadow-xs border border-stone-200"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-stone-600" />
                  <span>A4 Laser Sheet</span>
                </button>
              </div>

              {/* TVS Thermal Roll Options */}
              {printerCategory === "thermal" ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
                    <span>Select TVS LP 46 Dlite Roll Size:</span>
                    <span className="text-[10px] text-amber-700 font-normal">Max width 108mm</span>
                  </label>

                  {/* 50x25 2-Up */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("tvs-50x25-2up")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      preset === "tvs-50x25-2up"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p>50mm × 25mm (2-Up Roll)</p>
                        <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[9px]">Standard</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 ${preset === "tvs-50x25-2up" ? "text-amber-200/80" : "text-stone-500"}`}>
                        2 labels per row (Total width ~104mm) · Most popular for garments
                      </p>
                    </div>
                    {preset === "tvs-50x25-2up" && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>

                  {/* 50x38 2-Up */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("tvs-50x38-2up")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      preset === "tvs-50x38-2up"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p>50mm × 38mm (2-Up Roll)</p>
                        <span className="px-1.5 py-0.2 bg-amber-500 text-stone-950 font-bold rounded text-[9px]">Recommended</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 ${preset === "tvs-50x38-2up" ? "text-amber-200/80" : "text-stone-500"}`}>
                        Extra height for bigger barcode, brand &amp; price readability
                      </p>
                    </div>
                    {preset === "tvs-50x38-2up" && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>

                  {/* 75x50 1-Up */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("tvs-75x50-1up")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      preset === "tvs-75x50-1up"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <p>75mm × 50mm (Single 1-Up Tag)</p>
                      <p className={`text-[10px] mt-0.5 ${preset === "tvs-75x50-1up" ? "text-amber-200/80" : "text-stone-500"}`}>
                        Single label / hang tag with perforated hole
                      </p>
                    </div>
                    {preset === "tvs-75x50-1up" && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>

                  {/* 100x50 1-Up */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("tvs-100x50-1up")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      preset === "tvs-100x50-1up"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <p>100mm × 50mm (Single 1-Up Large)</p>
                      <p className={`text-[10px] mt-0.5 ${preset === "tvs-100x50-1up" ? "text-amber-200/80" : "text-stone-500"}`}>
                        Full 4-inch wide tag
                      </p>
                    </div>
                    {preset === "tvs-100x50-1up" && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>

                  {/* 100x75 1-Up */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("tvs-100x75-1up")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      preset === "tvs-100x75-1up"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <p>100mm × 75mm (Single 1-Up Shipping / Box)</p>
                      <p className={`text-[10px] mt-0.5 ${preset === "tvs-100x75-1up" ? "text-amber-200/80" : "text-stone-500"}`}>
                        Extra large garment box / parcel label
                      </p>
                    </div>
                    {preset === "tvs-100x75-1up" && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                </div>
              ) : (
                /* Laser Printer Options */
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-900 block">
                    Select A4 Sticker Sheet:
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("a4-24")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      preset === "a4-24"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <p>A4 Sheet (24 Labels · 3x8 Grid)</p>
                      <p className={`text-[10px] mt-0.5 ${preset === "a4-24" ? "text-amber-200/80" : "text-stone-500"}`}>
                        Standard 64 × 34 mm for Sarees &amp; Suits
                      </p>
                    </div>
                    {preset === "a4-24" && <Check className="w-4 h-4 text-amber-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset("a4-40")}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      preset === "a4-40"
                        ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs font-bold"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <p>A4 Sheet (40 Labels · 4x10 Grid)</p>
                      <p className={`text-[10px] mt-0.5 ${preset === "a4-40" ? "text-amber-200/80" : "text-stone-500"}`}>
                        Compact 48 × 25 mm for jewelry &amp; accessories
                      </p>
                    </div>
                    {preset === "a4-40" && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>
              )}

              {/* Total labels quantity count */}
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="font-bold text-stone-900 block">Total Stickers to Print:</span>
                  <span className="text-[10px] text-stone-500">
                    {isTwoUp ? `Prints in ${Math.ceil(labelCount / 2)} rows (2 per row)` : "Continuous print"}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={labelCount}
                  onChange={e => setLabelCount(Math.max(1, Math.min(500, Number(e.target.value))))}
                  className="w-20 px-2 py-1.5 bg-white border border-stone-300 rounded-lg text-center font-bold text-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Label Content Toggles */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Customize Tag Content:
                </span>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showShopName}
                    onChange={e => setShowShopName(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Show Brand Header (RAJNANDNI)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMrp}
                    onChange={e => setShowMrp(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Show MRP (₹{product.mrp})</span>
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

              {/* Print Action Button */}
              <button
                onClick={handlePrint}
                className="w-full py-3 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print {labelCount} Stickers on {printerCategory === "thermal" ? "TVS Printer" : "Laser"}</span>
              </button>
            </div>

            {/* RIGHT COLUMN: Live Visual Preview */}
            <div className="lg:col-span-7 bg-stone-100 p-4 rounded-2xl border border-stone-200 flex flex-col">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-600" />
                  Live Preview ({preset.toUpperCase()})
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  Vector Code-128
                </span>
              </div>

              {/* Scrollable Preview Board */}
              <div className="flex-1 bg-stone-200/60 p-4 rounded-xl shadow-inner border border-stone-300 overflow-y-auto max-h-[520px] flex justify-center">
                {isTwoUp ? (
                  /* 2-Up Roll View */
                  <div className="space-y-2 max-w-[104mm] w-full">
                    {Array.from({ length: numRows }).map((_, rIdx) => {
                      const firstIdx = rIdx * 2;
                      const hasSecond = firstIdx + 1 < labelCount;
                      return (
                        <div key={rIdx} className="flex gap-2 justify-center bg-white/70 p-1 rounded-sm border border-dashed border-stone-300">
                          <BarcodeTagItem
                            product={product}
                            preset={preset}
                            showShopName={showShopName}
                            showMrp={showMrp}
                            showPrice={showPrice}
                            showSize={showSize}
                          />
                          {hasSecond ? (
                            <BarcodeTagItem
                              product={product}
                              preset={preset}
                              showShopName={showShopName}
                              showMrp={showMrp}
                              showPrice={showPrice}
                              showSize={showSize}
                            />
                          ) : (
                            <div className="w-[49mm] h-[24mm] border border-dashed border-stone-200 rounded-xs flex items-center justify-center text-[10px] text-stone-400">
                              (Empty)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* 1-Up Single or Laser Grid View */
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Array.from({ length: labelCount }).map((_, idx) => (
                      <BarcodeTagItem
                        key={idx}
                        product={product}
                        preset={preset}
                        showShopName={showShopName}
                        showMrp={showMrp}
                        showPrice={showPrice}
                        showSize={showSize}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Calibration Helper Tip */}
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  💡 TVS Printer Dialog Settings:
                </p>
                <p className="text-stone-700 leading-relaxed">
                  In Chrome/Edge print window, Destination select karein: <strong>TVS LP 46 Dlite</strong> · Margins: <strong>None</strong> · Scale: <strong>100% (Default)</strong>.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* PRINT-ONLY CONTAINER (ACTIVATED ONLY DURING WINDOW.PRINT) */}
      <div id="barcode-print-sheet" className="hidden print:block print:w-full print:bg-white">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #barcode-print-sheet, #barcode-print-sheet * {
                visibility: visible !important;
              }
              #barcode-print-sheet {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              ${getPageStyle()}
            }
          `
        }} />

        {isTwoUp ? (
          /* Render rows for 2-Up Thermal printing */
          <div className="w-full flex flex-col items-center">
            {Array.from({ length: numRows }).map((_, rIdx) => {
              const firstIdx = rIdx * 2;
              const hasSecond = firstIdx + 1 < labelCount;
              return (
                <div key={rIdx} className="thermal-row">
                  <BarcodeTagItem
                    product={product}
                    preset={preset}
                    showShopName={showShopName}
                    showMrp={showMrp}
                    showPrice={showPrice}
                    showSize={showSize}
                  />
                  {hasSecond && (
                    <BarcodeTagItem
                      product={product}
                      preset={preset}
                      showShopName={showShopName}
                      showMrp={showMrp}
                      showPrice={showPrice}
                      showSize={showSize}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : preset.startsWith("tvs-") ? (
          /* Render single tags for 1-Up Thermal printing */
          <div className="w-full flex flex-col items-center">
            {Array.from({ length: labelCount }).map((_, idx) => (
              <div key={idx} className="thermal-single">
                <BarcodeTagItem
                  product={product}
                  preset={preset}
                  showShopName={showShopName}
                  showMrp={showMrp}
                  showPrice={showPrice}
                  showSize={showSize}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Render Grid for A4 Laser sheet */
          <div
            className={`grid gap-2 w-full justify-items-center p-2 ${
              preset === "a4-40" ? "grid-cols-4" : "grid-cols-3"
            }`}
          >
            {Array.from({ length: labelCount }).map((_, idx) => (
              <BarcodeTagItem
                key={idx}
                product={product}
                preset={preset}
                showShopName={showShopName}
                showMrp={showMrp}
                showPrice={showPrice}
                showSize={showSize}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
