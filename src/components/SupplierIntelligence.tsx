"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Download,
  Plus,
  Search,
  Sparkles,
  Flame,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Phone,
  MapPin,
  ArrowUpRight,
  Boxes,
  Trash2
} from "lucide-react";
import { ProductItem, CompletedBill, SupplierMetric, SupplierProfile } from "@/types/pos";
import { SupplierService } from "@/lib/supplierService";

interface SupplierIntelligenceProps {
  products: ProductItem[];
  bills: CompletedBill[];
  isOwnerView?: boolean;
}

export default function SupplierIntelligence({
  products,
  bills,
  isOwnerView = false
}: SupplierIntelligenceProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "top" | "good" | "slow">("all");
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Add new supplier modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSupplierName, setNewSupplierName] = useState<string>("");
  const [newSupplierCity, setNewSupplierCity] = useState<string>("");
  const [newSupplierCategory, setNewSupplierCategory] = useState<string>("sarees");
  const [newSupplierPhone, setNewSupplierPhone] = useState<string>("");
  const [newSupplierNotes, setNewSupplierNotes] = useState<string>("");

  // Purge any legacy fake/sample data on initial render
  useEffect(() => {
    SupplierService.purgeFakeData();
    setRefreshKey(k => k + 1);
  }, []);

  // Calculate live supplier performance metrics (zero fake data)
  const metrics = useMemo(() => {
    return SupplierService.calculateMetrics(products, bills);
  }, [products, bills, refreshKey]);

  // Executive KPI summary calculations
  const kpiSummary = useMemo(() => {
    let totalInvested = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalStockPcs = 0;
    let totalSoldPcs = 0;
    let topSupplierName = "None (No Suppliers Added)";
    let maxRevenue = 0;
    let slowCount = 0;

    metrics.forEach(m => {
      totalInvested += m.totalCostValue;
      totalRevenue += m.totalRevenue;
      totalProfit += m.grossProfit;
      totalStockPcs += m.stockPcs;
      totalSoldPcs += m.soldPcs;
      if (m.totalRevenue > maxRevenue) {
        maxRevenue = m.totalRevenue;
        topSupplierName = m.name;
      }
      if (m.status === "slow") slowCount++;
    });

    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const overallSellThrough = (totalSoldPcs + totalStockPcs) > 0 ? (totalSoldPcs / (totalSoldPcs + totalStockPcs)) * 100 : 0;

    return {
      supplierCount: metrics.length,
      totalInvested,
      totalRevenue,
      totalProfit,
      totalStockPcs,
      totalSoldPcs,
      topSupplierName: metrics.length > 0 ? topSupplierName : "None (No Suppliers Added)",
      maxRevenue,
      slowCount,
      overallMargin: overallMargin.toFixed(1),
      overallSellThrough: overallSellThrough.toFixed(1)
    };
  }, [metrics]);

  // Filtered metrics
  const filteredMetrics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return metrics.filter(m => {
      const matchesSearch = !q || m.name.toLowerCase().includes(q) || (m.city && m.city.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [metrics, searchQuery, statusFilter]);

  const handleDownloadCsv = () => {
    if (metrics.length === 0) {
      alert("No suppliers added to export.");
      return;
    }
    const csvStr = SupplierService.generateCsv(metrics);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RAJNANDINI_SUPPLIER_PERFORMANCE_AUDIT_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) {
      alert("Please enter Supplier Name.");
      return;
    }
    SupplierService.addSupplier({
      name: newSupplierName.trim(),
      city: newSupplierCity.trim() || "Surat",
      category: newSupplierCategory,
      phone: newSupplierPhone.trim(),
      notes: newSupplierNotes.trim()
    });
    setNewSupplierName("");
    setNewSupplierCity("");
    setNewSupplierPhone("");
    setNewSupplierNotes("");
    setShowAddModal(false);
    setRefreshKey(k => k + 1);
    alert(`✅ Supplier "${newSupplierName.trim()}" added to your boutique roster!`);
  };

  const handleDeleteSupplier = (supName: string) => {
    if (confirm(`Are you sure you want to remove supplier "${supName}"?`)) {
      SupplierService.deleteSupplierByName(supName);
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <div className="space-y-5">
      {/* Executive Sourcing Intelligence Banner */}
      <div className="bg-gradient-to-r from-[#5a1e2d] via-[#3f0819] to-[#5a1e2d] text-white p-5 sm:p-6 rounded-2xl border border-[#c99a82]/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ffd9de]">
              Procurement &amp; Sourcing Intelligence
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#ffe088]/30 text-[#ffe088] border border-[#d4af37]/40">
              {kpiSummary.supplierCount} Genuine Wholesale Vendors
            </span>
          </div>
          <h2 className="text-2xl font-black text-white font-serif tracking-wide">
            Supplier Performance &amp; Bestseller Scorecard
          </h2>
          <p className="text-xs text-[#ffd9de]/80 mt-1 max-w-2xl leading-relaxed">
            Track which suppliers deliver your fastest-selling bestsellers with highest profit margins vs which suppliers create dead stock on racks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {metrics.length > 0 && (
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#cba72f] hover:bg-[#d4af37] text-[#241a00] rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              title="Download full Supplier ROI & Performance report as CSV/Excel"
            >
              <Download className="w-4 h-4" />
              <span>Export Supplier Report (Excel)</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#ffe088]" />
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#ede7e6] shadow-[0_2px_12px_rgba(90,30,45,0.04)] flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">Top Performing Supplier</span>
            <p className="text-base font-black text-stone-900 mt-0.5 truncate max-w-[170px]" title={kpiSummary.topSupplierName}>
              {kpiSummary.topSupplierName}
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold">
              {kpiSummary.maxRevenue > 0 ? `₹${kpiSummary.maxRevenue.toLocaleString("en-IN")} Generated` : "No sales recorded yet"}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#ffe088]/40 border border-[#d4af37]/30 flex items-center justify-center text-[#735c00]">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">Total Capital Invested</span>
            <p className="text-xl font-black text-stone-900 font-mono mt-0.5">
              ₹{kpiSummary.totalInvested.toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-stone-500 font-semibold">{kpiSummary.totalStockPcs.toLocaleString("en-IN")} pcs currently on racks</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#fdc9af]/30 border border-[#c99a82]/40 flex items-center justify-center text-[#7c5641]">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">Total Sales from Suppliers</span>
            <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">
              ₹{kpiSummary.totalRevenue.toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold">{kpiSummary.totalSoldPcs} pcs sold ({kpiSummary.overallSellThrough}% sell-through)</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#f8f2f2] border border-[#ede7e6] flex items-center justify-center text-[#5a1e2d]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">Realized Gross Margin</span>
            <p className="text-xl font-black text-purple-700 font-mono mt-0.5">
              ₹{kpiSummary.totalProfit.toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-purple-700 font-semibold">{kpiSummary.overallMargin}% avg profit margin</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#ffe088]/40 border border-[#d4af37]/30 flex items-center justify-center text-[#735c00]">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-stone-200 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#ffd9de]/30 text-[#5a1e2d] mx-auto flex items-center justify-center border border-[#ffd9de]">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 font-serif">No Wholesale Suppliers Added Yet</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            All fake sample data has been completely cleared. Please click <strong>"+ Add Supplier"</strong> above to register your real wholesale suppliers (Surat, Delhi, Jaipur, Agra, Mumbai etc.) and track their true sales velocity and showroom inventory.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[#5a1e2d] hover:bg-[#3f0819] text-white rounded-xl text-xs font-bold transition shadow-md shadow-[#5a1e2d]/20 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Your First Wholesale Supplier</span>
          </button>
        </div>
      ) : (
        <>
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search supplier by name or city..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto overflow-x-auto">
              {[
                { id: "all", label: `All Suppliers (${metrics.length})` },
                { id: "top", label: `🌟 Top Performers (${metrics.filter(m => m.status === "top").length})` },
                { id: "good", label: `🟢 Steady Movers (${metrics.filter(m => m.status === "good").length})` },
                { id: "slow", label: `⚠️ Slow Movers (${metrics.filter(m => m.status === "slow").length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Supplier Ranking List / Cards */}
          <div className="space-y-3">
            {filteredMetrics.map((sup, idx) => {
              const isExpanded = expandedSupplier === sup.name;
              return (
                <div
                  key={sup.name}
                  className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden ${
                    sup.status === "top"
                      ? "border-emerald-300/80"
                      : sup.status === "slow"
                      ? "border-rose-200"
                      : "border-stone-200"
                  }`}
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedSupplier(isExpanded ? null : sup.name)}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/70 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/30"
                          : idx === 1
                          ? "bg-stone-200 text-stone-800"
                          : idx === 2
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100 text-stone-600"
                      }`}>
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-stone-900 text-sm font-serif">{sup.name}</h3>
                          {sup.city && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                              <MapPin className="w-2.5 h-2.5 text-stone-500" />
                              {sup.city} Hub
                            </span>
                          )}

                          {/* Performance Grade Badge */}
                          {sup.status === "top" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              🌟 TOP PERFORMER (Fast Mover)
                            </span>
                          ) : sup.status === "slow" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              ⚠️ SLOW MOVER (Dead Stock Risk)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              🟢 STEADY MOVER
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-stone-500 mt-1.5 flex-wrap">
                          <span><strong>{sup.skuCount}</strong> Catalog Designs</span>
                          <span>•</span>
                          <span><strong>{sup.stockPcs}</strong> pcs in Showroom</span>
                          <span>•</span>
                          <span>Cost Invested: <strong className="font-mono text-stone-800">₹{sup.totalCostValue.toLocaleString("en-IN")}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Stats on Right */}
                    <div className="flex items-center justify-between lg:justify-end gap-6 text-xs shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Total Sales</span>
                        <p className="text-base font-black text-emerald-700 font-mono">
                          ₹{sup.totalRevenue.toLocaleString("en-IN")}
                        </p>
                        <span className="text-[10px] text-stone-500">{sup.soldPcs} units sold</span>
                      </div>

                      <div className="text-left lg:text-right">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Sell-Through</span>
                        <p className="text-base font-black text-stone-900 font-mono">
                          {sup.sellThroughRate}%
                        </p>
                        <span className="text-[10px] text-stone-500">Margin: {sup.marginPct}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSupplier(sup.name);
                          }}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title={`Delete supplier "${sup.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="p-1 rounded-full bg-stone-100 text-stone-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Drawer: Bestsellers & Dead Stock Details */}
                  {isExpanded && (
                    <div className="bg-stone-50/70 p-5 border-t border-stone-100 space-y-4 text-xs animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Top Bestsellers to Re-order */}
                        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-800 font-bold">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <span>Top 5 Fast-Moving Bestsellers (Repeat Order)</span>
                          </div>
                          {sup.bestsellers.length === 0 ? (
                            <p className="text-stone-400 text-[11px] italic py-2">No items sold yet from this vendor.</p>
                          ) : (
                            <div className="divide-y divide-stone-100 space-y-1">
                              {sup.bestsellers.map(b => (
                                <div key={b.sku} className="pt-1.5 flex items-center justify-between text-stone-700">
                                  <div className="truncate max-w-[200px]">
                                    <span className="font-bold text-stone-900">{b.name}</span>
                                    <span className="text-[10px] text-stone-400 block font-mono">SKU: {b.sku} • Stock: {b.stock} pcs</span>
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="font-bold text-emerald-700">{b.sold} sold</span>
                                    <span className="text-[10px] text-stone-500 block">₹{b.revenue.toLocaleString("en-IN")}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Slow Movers / Dead Stock Risk */}
                        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 space-y-2">
                          <div className="flex items-center gap-2 text-rose-800 font-bold">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>Slow Movers / Overstocked (Clearance / Discount)</span>
                          </div>
                          {sup.slowMovers.length === 0 ? (
                            <p className="text-stone-400 text-[11px] italic py-2">No slow moving stock detected.</p>
                          ) : (
                            <div className="divide-y divide-stone-100 space-y-1">
                              {sup.slowMovers.map(s => (
                                <div key={s.sku} className="pt-1.5 flex items-center justify-between text-stone-700">
                                  <div className="truncate max-w-[200px]">
                                    <span className="font-bold text-stone-900">{s.name}</span>
                                    <span className="text-[10px] text-stone-400 block font-mono">SKU: {s.sku} • {s.stock} pcs in shop</span>
                                  </div>
                                  <div className="text-right font-mono">
                                    <span className="font-bold text-rose-700">{s.sold} sold</span>
                                    <span className="text-[10px] text-stone-400 block">Low velocity</span>
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
        </>
      )}

      {/* Add New Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 font-serif text-base">Add New Wholesale Supplier</h3>
                  <p className="text-[11px] text-stone-500">Genuine vendor roster (Target 10 to 25+ suppliers)</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="space-y-3.5 text-xs">
              <div>
                <span className="font-semibold text-stone-700 block mb-1">Supplier / Firm Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahavir Silk Mills, Surat"
                  value={newSupplierName}
                  onChange={e => setNewSupplierName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-stone-700 block mb-1">City / Sourcing Hub</span>
                  <input
                    type="text"
                    placeholder="e.g. Surat, Delhi, Jaipur"
                    value={newSupplierCity}
                    onChange={e => setNewSupplierCity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <span className="font-semibold text-stone-700 block mb-1">Primary Category</span>
                  <select
                    value={newSupplierCategory}
                    onChange={e => setNewSupplierCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="sarees">🥻 Sarees</option>
                    <option value="kurtis">👚 Kurtis &amp; Suits</option>
                    <option value="lehengas">👗 Lehengas &amp; Bridal</option>
                    <option value="handbags">👜 Handbags &amp; Clutches</option>
                    <option value="jewellery">💍 Jewellery &amp; Bangles</option>
                    <option value="footwear">👠 Footwear &amp; Heels</option>
                    <option value="cosmetics">💄 Cosmetics</option>
                    <option value="handloom">🧵 Handloom</option>
                    <option value="undergarments">👙 Blouse &amp; Undergarments</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="font-semibold text-stone-700 block mb-1">Contact Phone (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. 98200XXXXX"
                  value={newSupplierPhone}
                  onChange={e => setNewSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <span className="font-semibold text-stone-700 block mb-1">Notes / Terms (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. 5% cash discount on bulk orders, 30-day payment cycle"
                  value={newSupplierNotes}
                  onChange={e => setNewSupplierNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-black shadow-md shadow-emerald-700/20 cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
