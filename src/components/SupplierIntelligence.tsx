"use client";

import React, { useState, useMemo } from "react";
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
  Boxes
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

  // Add new supplier modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSupplierName, setNewSupplierName] = useState<string>("");
  const [newSupplierCity, setNewSupplierCity] = useState<string>("");
  const [newSupplierCategory, setNewSupplierCategory] = useState<string>("sarees");
  const [newSupplierNotes, setNewSupplierNotes] = useState<string>("");

  // Calculate live supplier performance metrics
  const metrics = useMemo(() => {
    return SupplierService.calculateMetrics(products, bills);
  }, [products, bills]);

  // Executive KPI summary calculations
  const kpiSummary = useMemo(() => {
    let totalInvested = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalStockPcs = 0;
    let totalSoldPcs = 0;
    let topSupplierName = "None";
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
      topSupplierName,
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
      notes: newSupplierNotes.trim()
    });
    setNewSupplierName("");
    setNewSupplierCity("");
    setNewSupplierNotes("");
    setShowAddModal(false);
    alert(`✅ Supplier "${newSupplierName.trim()}" added to boutique roster!`);
  };

  return (
    <div className="space-y-5">
      {/* Executive Sourcing Intelligence Banner */}
      <div className="bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#111827] text-white p-5 sm:p-6 rounded-3xl border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
              Procurement &amp; Sourcing Intelligence
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {kpiSummary.supplierCount} Active Wholesale Vendors
            </span>
          </div>
          <h2 className="text-2xl font-black text-white font-serif tracking-wide">
            Supplier Performance &amp; Bestseller Scorecard
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
            Track which suppliers deliver your fastest-selling bestsellers with highest profit margins vs which suppliers create dead stock on racks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            title="Download full Supplier ROI & Performance report as CSV/Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export Supplier Report (Excel)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold text-stone-400 uppercase tracking-wider">Top Performing Supplier</span>
            <p className="text-base font-black text-stone-900 mt-0.5 truncate max-w-[170px]" title={kpiSummary.topSupplierName}>
              {kpiSummary.topSupplierName}
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold">₹{kpiSummary.maxRevenue.toLocaleString("en-IN")} Generated</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
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
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
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
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
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
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search supplier by name or city (e.g. Surat, Sadhvi, Jaipur)..."
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                        <MapPin className="w-2.5 h-2.5 text-stone-500" />
                        {sup.city} Hub
                      </span>

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
                    <span className="text-[10px] text-purple-700 font-bold">{sup.marginPct}% margin</span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expandable Bestsellers & Sourcing Recommendations */}
              {isExpanded && (
                <div className="bg-stone-50/80 p-5 border-t border-stone-200 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Column 1: Top 5 Bestsellers to Re-order */}
                    <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-emerald-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                          <Flame className="w-4 h-4 text-rose-500" />
                          Top Bestsellers to Re-Order from this Supplier
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">Proven Winners</span>
                      </div>

                      {sup.bestsellers.length > 0 ? (
                        <div className="space-y-1.5 divide-y divide-stone-100">
                          {sup.bestsellers.map((b, bIdx) => (
                            <div key={b.sku} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-stone-900">{b.name}</span>
                                <span className="ml-2 font-mono text-[10px] text-stone-500">({b.sku})</span>
                                <span className="block text-[10px] text-stone-500">
                                  Remaining Showroom Stock: <strong className={b.stock <= 2 ? "text-rose-600" : "text-stone-700"}>{b.stock} pcs</strong>
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-emerald-700 font-mono">{b.sold} Sold</span>
                                <span className="block text-[10px] text-stone-400">₹{b.revenue.toLocaleString("en-IN")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic py-2">
                          No sales recorded yet for this supplier's items.
                        </p>
                      )}
                    </div>

                    {/* Column 2: Slow Moving Items / Dead Stock Risk */}
                    <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-rose-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Slow Moving Items (Avoid Re-Ordering)
                        </span>
                        <span className="text-[10px] font-bold text-rose-700">Sitting on Racks</span>
                      </div>

                      {sup.slowMovers.length > 0 ? (
                        <div className="space-y-1.5 divide-y divide-stone-100">
                          {sup.slowMovers.map(s => (
                            <div key={s.sku} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-stone-800">{s.name}</span>
                                <span className="ml-2 font-mono text-[10px] text-stone-400">({s.sku})</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-rose-700 font-mono">{s.stock} pcs sitting</span>
                                <span className="block text-[10px] text-stone-400">{s.sold} sold</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic py-2">
                          All items from this supplier are moving well.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Supplier */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 font-serif text-base">Add New Wholesale Supplier</h3>
                  <p className="text-[11px] text-stone-500">Roster expansion (target 25+ suppliers)</p>
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
                  placeholder="e.g. Mahavir Silk Mills, Surat or Jaipur Ethnic House"
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
                <span className="font-semibold text-stone-700 block mb-1">Notes / Terms (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. 5% cash discount on 100 pcs, 30 days credit terms"
                  value={newSupplierNotes}
                  onChange={e => setNewSupplierNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-black shadow-md shadow-emerald-700/20"
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
