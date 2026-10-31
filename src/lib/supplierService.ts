import { ProductItem, CompletedBill, SupplierProfile, SupplierMetric } from "@/types/pos";

export const DEFAULT_SUPPLIERS: SupplierProfile[] = [];

const STORAGE_KEY_CUSTOM_SUPPLIERS = "rajnandni_custom_suppliers";
const STORAGE_KEY_PRODUCT_SUPPLIER_MAP = "rajnandni_product_supplier_map";

// List of all legacy mock/fake supplier names to strictly purge and ignore
const LEGACY_FAKE_NAMES = new Set([
  "jawahar lal jagannath prasad",
  "sadhvi sarees pvt ltd",
  "gulshan sarees & fabrics",
  "bengal handloom & tant depot",
  "surat k-series wholesale",
  "jaipur kurti & suit hub",
  "chandni chowk bridal hub",
  "mumbai fashion accessories",
  "rajkot & jaipur jewellery",
  "agra & kanpur footwear",
  "roop nikha & personi cosmetics",
  "surat aster & blouse depot",
  "general boutique supplier"
]);

export const SupplierService = {
  // Purge any legacy fake/sample data from localStorage
  purgeFakeData() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SUPPLIERS);
      if (raw) {
        const list: SupplierProfile[] = JSON.parse(raw);
        const clean = list.filter(s => s && s.name && !LEGACY_FAKE_NAMES.has(s.name.toLowerCase().trim()));
        localStorage.setItem(STORAGE_KEY_CUSTOM_SUPPLIERS, JSON.stringify(clean));
      }

      const rawMap = localStorage.getItem(STORAGE_KEY_PRODUCT_SUPPLIER_MAP);
      if (rawMap) {
        const map: Record<string, string> = JSON.parse(rawMap);
        let changed = false;
        Object.keys(map).forEach(k => {
          if (LEGACY_FAKE_NAMES.has(map[k].toLowerCase().trim())) {
            delete map[k];
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEY_PRODUCT_SUPPLIER_MAP, JSON.stringify(map));
        }
      }
    } catch {}
  },

  getSuppliers(): SupplierProfile[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SUPPLIERS);
      if (raw) {
        const list: SupplierProfile[] = JSON.parse(raw);
        return list.filter(s => s && s.name && !LEGACY_FAKE_NAMES.has(s.name.toLowerCase().trim()));
      }
    } catch {}
    return [];
  },

  addSupplier(supplier: Omit<SupplierProfile, "id">): SupplierProfile {
    const list = this.getSuppliers();
    const newSup: SupplierProfile = {
      ...supplier,
      id: `sup-${Date.now()}`
    };
    const next = [...list, newSup];
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_SUPPLIERS, JSON.stringify(next));
      } catch {}
    }
    return newSup;
  },

  deleteSupplierByName(name: string) {
    if (typeof window === "undefined") return;
    try {
      const cleanName = name.toLowerCase().trim();
      const list = this.getSuppliers().filter(s => s.name.toLowerCase().trim() !== cleanName);
      localStorage.setItem(STORAGE_KEY_CUSTOM_SUPPLIERS, JSON.stringify(list));

      const map = this.getProductSupplierMap();
      let changed = false;
      Object.keys(map).forEach(k => {
        if (map[k].toLowerCase().trim() === cleanName) {
          delete map[k];
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEY_PRODUCT_SUPPLIER_MAP, JSON.stringify(map));
      }
    } catch {}
  },

  getProductSupplierMap(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRODUCT_SUPPLIER_MAP);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  setProductSupplier(productIdOrSku: string, supplierName: string) {
    if (typeof window === "undefined") return;
    try {
      const current = this.getProductSupplierMap();
      current[productIdOrSku] = supplierName;
      localStorage.setItem(STORAGE_KEY_PRODUCT_SUPPLIER_MAP, JSON.stringify(current));
    } catch {}
  },

  // Only returns a supplier if explicitly assigned by the user. NEVER guesses fake names!
  inferSupplier(product: ProductItem): string | null {
    if (!product) return null;
    if (product.supplier && product.supplier.trim()) {
      const clean = product.supplier.trim();
      if (!LEGACY_FAKE_NAMES.has(clean.toLowerCase())) return clean;
    }

    // Check manual override map
    const map = this.getProductSupplierMap();
    if (product.id && map[product.id] && !LEGACY_FAKE_NAMES.has(map[product.id].toLowerCase())) {
      return map[product.id];
    }
    if (product.sku && map[product.sku] && !LEGACY_FAKE_NAMES.has(map[product.sku].toLowerCase())) {
      return map[product.sku];
    }

    // Check badge encoding (e.g. "SUP:Surat Mill...")
    if (product.badge && product.badge.includes("SUP:")) {
      const match = product.badge.match(/SUP:([^|]+)/);
      if (match && match[1]) {
        const clean = match[1].trim();
        if (!LEGACY_FAKE_NAMES.has(clean.toLowerCase())) return clean;
      }
    }

    // Zero fake guessing. If not explicitly assigned, return null.
    return null;
  },

  calculateMetrics(products: ProductItem[], bills: CompletedBill[]): SupplierMetric[] {
    // Purge fake data first
    this.purgeFakeData();

    const registeredSuppliers = this.getSuppliers();
    // If no real suppliers have been registered by user yet, return empty list!
    if (!registeredSuppliers || registeredSuppliers.length === 0) {
      return [];
    }

    const cleanProds = (products || []).filter(p => !p.isService);

    // Build Sales Lookup by Product ID, SKU & Name
    const salesMap = new Map<string, { unitsSold: number; revenue: number }>();

    bills.forEach(b => {
      if (!b.items || !Array.isArray(b.items)) return;
      b.items.forEach(it => {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price) || 0;
        const rev = qty * price;

        const keys = [
          it.product?.id,
          it.product?.sku?.toUpperCase().trim(),
          (it as any).id,
          (it as any).sku?.toUpperCase().trim(),
          it.product?.name?.toLowerCase().trim()
        ].filter(Boolean);

        keys.forEach(k => {
          if (!k) return;
          const curr = salesMap.get(k) || { unitsSold: 0, revenue: 0 };
          salesMap.set(k, { unitsSold: curr.unitsSold + qty, revenue: curr.revenue + rev });
        });
      });
    });

    const registeredNameMap = new Map<string, SupplierProfile>();
    registeredSuppliers.forEach(s => registeredNameMap.set(s.name.toLowerCase().trim(), s));

    const supplierGroups = new Map<string, {
      name: string;
      city?: string;
      products: ProductItem[];
      totalCostValue: number;
      totalRetailValue: number;
      totalStockPcs: number;
      totalSoldPcs: number;
      totalRevenue: number;
      grossProfit: number;
    }>();

    // Initialize an entry for every genuine registered supplier
    registeredSuppliers.forEach(s => {
      supplierGroups.set(s.name.toLowerCase().trim(), {
        name: s.name,
        city: s.city,
        products: [],
        totalCostValue: 0,
        totalRetailValue: 0,
        totalStockPcs: 0,
        totalSoldPcs: 0,
        totalRevenue: 0,
        grossProfit: 0
      });
    });

    // Populate with matching products only
    cleanProds.forEach(p => {
      const sup = this.inferSupplier(p);
      if (!sup) return;

      const key = sup.toLowerCase().trim();
      const group = supplierGroups.get(key);
      if (!group) return; // Not a registered real supplier

      group.products.push(p);

      const stock = Number(p.stock) || 0;
      const cost = Number(p.purchaseCost) || 0;
      const price = Number(p.price) || 0;

      const saleInfo =
        (p.id && salesMap.get(p.id)) ||
        (p.sku && salesMap.get(p.sku.toUpperCase().trim())) ||
        (p.name && salesMap.get(p.name.toLowerCase().trim())) ||
        { unitsSold: 0, revenue: 0 };

      const sold = saleInfo.unitsSold;
      const rev = saleInfo.revenue;
      const profit = Math.max(0, rev - (sold * cost));

      group.totalCostValue += stock * cost;
      group.totalRetailValue += stock * price;
      group.totalStockPcs += stock;
      group.totalSoldPcs += sold;
      group.totalRevenue += rev;
      group.grossProfit += profit;
    });

    const result: SupplierMetric[] = [];

    supplierGroups.forEach((group) => {
      const totalUnits = group.totalSoldPcs + group.totalStockPcs;
      const sellThrough = totalUnits > 0 ? (group.totalSoldPcs / totalUnits) * 100 : 0;
      const marginPct = group.totalRevenue > 0 ? (group.grossProfit / group.totalRevenue) * 100 : 0;

      let status: "top" | "good" | "slow" = "good";
      if (group.totalRevenue >= 50000 || sellThrough >= 20 || group.totalSoldPcs >= 40) {
        status = "top";
      } else if (sellThrough < 6 && group.totalStockPcs > 100 && group.totalSoldPcs <= 2) {
        status = "slow";
      }

      const productSales = group.products.map(p => {
        const sInfo =
          (p.id && salesMap.get(p.id)) ||
          (p.sku && salesMap.get(p.sku.toUpperCase().trim())) ||
          (p.name && salesMap.get(p.name.toLowerCase().trim())) ||
          { unitsSold: 0, revenue: 0 };
        return {
          sku: p.sku || "",
          name: p.name || "",
          sold: sInfo.unitsSold,
          stock: Number(p.stock) || 0,
          revenue: sInfo.revenue
        };
      });

      productSales.sort((a, b) => b.sold - a.sold || b.revenue - a.revenue);
      const bestsellers = productSales.filter(p => p.sold > 0).slice(0, 5);
      const slowMovers = [...productSales].sort((a, b) => a.sold - b.sold || b.stock - a.stock).slice(0, 5);

      result.push({
        name: group.name,
        city: group.city || "",
        skuCount: group.products.length,
        stockPcs: group.totalStockPcs,
        soldPcs: group.totalSoldPcs,
        totalCostValue: Math.round(group.totalCostValue),
        totalRetailValue: Math.round(group.totalRetailValue),
        totalRevenue: Math.round(group.totalRevenue),
        grossProfit: Math.round(group.grossProfit),
        marginPct: Number(marginPct.toFixed(1)),
        sellThroughRate: Number(sellThrough.toFixed(1)),
        status,
        bestsellers,
        slowMovers
      });
    });

    result.sort((a, b) => b.totalRevenue - a.totalRevenue || b.soldPcs - a.soldPcs);
    return result;
  },

  generateCsv(metrics: SupplierMetric[]): string {
    const rows: string[][] = [];
    rows.push(["RAJNANDINI BOUTIQUE - SUPPLIER PERFORMANCE & BESTSELLER REPORT"]);
    rows.push(["Generated At", new Date().toLocaleString("en-IN")]);
    rows.push([]);
    rows.push([
      "Supplier Name",
      "City / Hub",
      "Designs (SKUs)",
      "Stock in Shop (Pcs)",
      "Units Sold (Pcs)",
      "Sell-Through Rate %",
      "Stock Cost Invested (Rs)",
      "Retail Stock Value (Rs)",
      "Revenue Generated (Rs)",
      "Gross Profit (Rs)",
      "Margin %",
      "Performance Grade",
      "Top Bestsellers"
    ]);

    metrics.forEach(m => {
      const topStr = m.bestsellers.map(b => `${b.name} (${b.sold} sold)`).join("; ") || "None yet";
      const grade = m.status === "top" ? "TOP PERFORMER (Fast Mover)" : m.status === "slow" ? "SLOW MOVER (Dead Stock Risk)" : "GOOD STEADY MOVER";

      rows.push([
        m.name,
        m.city || "",
        String(m.skuCount),
        String(m.stockPcs),
        String(m.soldPcs),
        `${m.sellThroughRate}%`,
        String(m.totalCostValue),
        String(m.totalRetailValue),
        String(m.totalRevenue),
        String(m.grossProfit),
        `${m.marginPct}%`,
        grade,
        topStr
      ]);
    });

    return rows
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
  }
};
