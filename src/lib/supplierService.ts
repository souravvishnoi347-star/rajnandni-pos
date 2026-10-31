import { ProductItem, CompletedBill, SupplierProfile, SupplierMetric } from "@/types/pos";

export const DEFAULT_SUPPLIERS: SupplierProfile[] = [
  { id: "sup-1", name: "Jawahar Lal Jagannath Prasad", city: "Surat", category: "sarees", notes: "Surat Silk & Fancy Dola Silk Sarees" },
  { id: "sup-2", name: "Sadhvi Sarees Pvt Ltd", city: "Surat", category: "sarees", notes: "Dailywear Printed Georgette & Asharfi" },
  { id: "sup-3", name: "Gulshan Sarees & Fabrics", city: "Surat", category: "sarees", notes: "Satin Silk, Party & Siroshki Work" },
  { id: "sup-4", name: "Bengal Handloom & Tant Depot", city: "Kolkata", category: "handloom", notes: "Pure Cotton, Tant & Traditional Handloom" },
  { id: "sup-5", name: "Surat K-Series Wholesale", city: "Surat", category: "sarees", notes: "Royal Brasso & Wave Pattern Fancy Sarees" },
  { id: "sup-6", name: "Jaipur Kurti & Suit Hub", city: "Jaipur", category: "kurtis", notes: "Cambric Cotton, Anarkali & Designer Suits" },
  { id: "sup-7", name: "Chandni Chowk Bridal Hub", city: "Delhi", category: "lehengas", notes: "Heavy Bridal Lehengas & Party Gowns" },
  { id: "sup-8", name: "Mumbai Fashion Accessories", city: "Mumbai", category: "handbags", notes: "Handbags, Purses, Clutches & Sling Bags" },
  { id: "sup-9", name: "Rajkot & Jaipur Jewellery", city: "Rajkot", category: "jewellery", notes: "Kundan Sets, Bangles, Kada & Rings" },
  { id: "sup-10", name: "Agra & Kanpur Footwear", city: "Agra", category: "footwear", notes: "Punjabi Juttis, Embroidered Mojaris & Heels" },
  { id: "sup-11", name: "Roop Nikha & Personi Cosmetics", city: "Delhi", category: "cosmetics", notes: "Kajal, Bindi, Lipsticks & Beauty Items" },
  { id: "sup-12", name: "Surat Aster & Blouse Depot", city: "Surat", category: "undergarments", notes: "Blouse Pieces, Aster Lining & Petticoats" },
];

const STORAGE_KEY_CUSTOM_SUPPLIERS = "rajnandni_custom_suppliers";
const STORAGE_KEY_PRODUCT_SUPPLIER_MAP = "rajnandni_product_supplier_map";

export const SupplierService = {
  getSuppliers(): SupplierProfile[] {
    if (typeof window === "undefined") return DEFAULT_SUPPLIERS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SUPPLIERS);
      if (raw) {
        const custom: SupplierProfile[] = JSON.parse(raw);
        const map = new Map<string, SupplierProfile>();
        DEFAULT_SUPPLIERS.forEach(s => map.set(s.name.toLowerCase().trim(), s));
        custom.forEach(s => map.set(s.name.toLowerCase().trim(), s));
        return Array.from(map.values());
      }
    } catch {}
    return DEFAULT_SUPPLIERS;
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

  inferSupplier(product: ProductItem): string {
    if (!product) return "General Boutique Supplier";
    if (product.supplier && product.supplier.trim()) return product.supplier.trim();

    // Check manual override map
    const map = this.getProductSupplierMap();
    if (product.id && map[product.id]) return map[product.id];
    if (product.sku && map[product.sku]) return map[product.sku];

    // Check badge encoding (e.g. "SUP:Jawahar Lal...")
    if (product.badge && product.badge.includes("SUP:")) {
      const match = product.badge.match(/SUP:([^|]+)/);
      if (match && match[1]) return match[1].trim();
    }

    const sku = (product.sku || "").toUpperCase().trim();
    const cat = (product.category || "").toLowerCase();
    const name = (product.name || "").toLowerCase();

    // Category / SKU Pattern Inference
    if (sku.startsWith("RJ-SAR-")) {
      const numMatch = sku.match(/RJ-SAR-(\d+)/);
      const num = numMatch ? parseInt(numMatch[1], 10) : 0;
      if (num >= 1 && num <= 34) return "Jawahar Lal Jagannath Prasad";
      if (num >= 35 && num <= 65) return "Sadhvi Sarees Pvt Ltd";
      if (num >= 66 && num <= 120) return "Gulshan Sarees & Fabrics";
      if (num >= 121 && num <= 160) return "Bengal Handloom & Tant Depot";
      return "Surat K-Series Wholesale";
    }

    if (cat === "kurtis" || sku.startsWith("RJ-KRT-")) return "Jaipur Kurti & Suit Hub";
    if (cat === "lehengas" || sku.startsWith("RJ-LHG-")) return "Chandni Chowk Bridal Hub";
    if (cat === "handbags" || sku.startsWith("RJ-BAG-") || sku.startsWith("RJ-HBG-")) return "Mumbai Fashion Accessories";
    if (cat === "jewellery" || cat === "bangles" || cat === "earrings" || sku.startsWith("RJ-JWL-") || sku.startsWith("RJ-BNG-") || sku.startsWith("RJ-EAR-")) {
      return "Rajkot & Jaipur Jewellery";
    }
    if (cat === "footwear" || sku.startsWith("RJ-FTW-")) return "Agra & Kanpur Footwear";
    if (cat === "cosmetics" || sku.startsWith("RJ-COS-")) return "Roop Nikha & Personi Cosmetics";
    if (cat === "handloom" || sku.startsWith("RJ-HDL-")) return "Bengal Handloom & Tant Depot";
    if (cat === "undergarments" || sku.startsWith("RJ-UND-") || sku.startsWith("RJ-ACC-") || name.includes("blouse piece") || name.includes("aster") || name.includes("paticote")) {
      return "Surat Aster & Blouse Depot";
    }

    return "General Boutique Supplier";
  },

  calculateMetrics(products: ProductItem[], bills: CompletedBill[]): SupplierMetric[] {
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

    const supplierGroups = new Map<string, {
      name: string;
      products: ProductItem[];
      totalCostValue: number;
      totalRetailValue: number;
      totalStockPcs: number;
      totalSoldPcs: number;
      totalRevenue: number;
      grossProfit: number;
    }>();

    cleanProds.forEach(p => {
      const sup = this.inferSupplier(p);
      if (!supplierGroups.has(sup)) {
        supplierGroups.set(sup, {
          name: sup,
          products: [],
          totalCostValue: 0,
          totalRetailValue: 0,
          totalStockPcs: 0,
          totalSoldPcs: 0,
          totalRevenue: 0,
          grossProfit: 0
        });
      }

      const group = supplierGroups.get(sup)!;
      group.products.push(p);

      const stock = Number(p.stock) || 0;
      const cost = Number(p.purchaseCost) || 0;
      const price = Number(p.price) || 0;

      // Exact sales lookup
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

    const knownList = this.getSuppliers();
    const cityMap = new Map<string, string>();
    knownList.forEach(s => cityMap.set(s.name.toLowerCase().trim(), s.city || ""));

    const result: SupplierMetric[] = [];

    supplierGroups.forEach((group, name) => {
      const totalUnits = group.totalSoldPcs + group.totalStockPcs;
      const sellThrough = totalUnits > 0 ? (group.totalSoldPcs / totalUnits) * 100 : 0;
      const marginPct = group.totalRevenue > 0 ? (group.grossProfit / group.totalRevenue) * 100 : 0;

      // Classify performance
      let status: "top" | "good" | "slow" = "good";
      if (group.totalRevenue >= 50000 || sellThrough >= 20 || group.totalSoldPcs >= 40) {
        status = "top";
      } else if (sellThrough < 6 && group.totalStockPcs > 100 && group.totalSoldPcs <= 2) {
        status = "slow";
      }

      // Calculate Bestsellers & Slow Movers
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
        name,
        city: cityMap.get(name.toLowerCase().trim()) || "Surat / Delhi",
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

    // Sort by Total Revenue descending, then by Sold Pcs
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
