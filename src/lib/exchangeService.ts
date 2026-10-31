import { ProductItem, CompletedBill, ExchangeRecord, ExchangeItemReturn, ExchangeItemIssued, CustomerInfo } from "@/types/pos";

const STORAGE_KEY_EXCHANGES = "rajnandni_exchanges";

export const ExchangeService = {
  getExchanges(): ExchangeRecord[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EXCHANGES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveExchanges(list: ExchangeRecord[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_EXCHANGES, JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save exchanges locally:", e);
    }
  },

  checkEligibility(rawDate?: string): { eligible: boolean; daysAgo: number; message: string } {
    if (!rawDate) return { eligible: true, daysAgo: 0, message: "Valid for exchange" };
    try {
      const purchaseTime = new Date(rawDate).getTime();
      const now = Date.now();
      const diffDays = Math.floor((now - purchaseTime) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 5) {
        return {
          eligible: true,
          daysAgo: Math.max(0, diffDays),
          message: diffDays === 0 ? "Purchased Today (Within 5-day Policy) ✅" : `Purchased ${diffDays} day(s) ago (Within 5-day Policy) ✅`
        };
      } else {
        return {
          eligible: false,
          daysAgo: diffDays,
          message: `Purchased ${diffDays} days ago (Exceeds 5-day standard policy window). Owner approval needed ⚠️`
        };
      }
    } catch {
      return { eligible: true, daysAgo: 0, message: "Date unverified" };
    }
  },

  generateNextExchangeNo(existing: ExchangeRecord[]): string {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    existing.forEach(e => {
      const match = (e.exchangeNo || "").match(/EXC-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
    return `EXC-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
  },

  createExchange(params: {
    originalBill: CompletedBill;
    returnedItems: ExchangeItemReturn[];
    issuedItems: ExchangeItemIssued[];
    paymentMode?: "cash" | "upi" | "card" | "credit_note";
    notes?: string;
    staffName?: string;
  }): { record: ExchangeRecord; nextExchanges: ExchangeRecord[] } {
    const list = this.getExchanges();
    const exchangeNo = this.generateNextExchangeNo(list);

    const totalReturnCredit = params.returnedItems.reduce(
      (sum, it) => sum + (Number(it.originalPrice) || 0) * (Number(it.quantity) || 1),
      0
    );

    const totalNewItemsValue = params.issuedItems.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );

    const differenceAmount = totalNewItemsValue - totalReturnCredit;

    let settlementType: ExchangeRecord["settlementType"] = "even_exchange";
    if (differenceAmount > 0) settlementType = "customer_paid";
    else if (differenceAmount < 0) settlementType = "store_refund";

    const record: ExchangeRecord = {
      id: `exc-${Date.now()}`,
      exchangeNo,
      originalBillNo: params.originalBill.billNo,
      originalBillDate: params.originalBill.rawDate || params.originalBill.createdAt,
      customer: {
        name: params.originalBill.customer.name || "Walk-in Guest",
        phone: params.originalBill.customer.phone || "NA",
        notes: params.originalBill.customer.notes || ""
      },
      returnedItems: params.returnedItems,
      issuedItems: params.issuedItems,
      totalReturnCredit,
      totalNewItemsValue,
      differenceAmount,
      settlementType,
      paymentMode: params.paymentMode || (differenceAmount > 0 ? "upi" : "cash"),
      notes: params.notes || "",
      staffName: params.staffName || "Counter Staff",
      createdAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      rawDate: new Date().toISOString()
    };

    const nextExchanges = [record, ...list];
    this.saveExchanges(nextExchanges);

    return { record, nextExchanges };
  },

  applyStockAdjustment(
    record: ExchangeRecord,
    currentProducts: ProductItem[]
  ): ProductItem[] {
    const productMap = new Map<string, ProductItem>();
    currentProducts.forEach(p => productMap.set(p.id, { ...p }));

    // 1. Returned items: Add back to stock IF condition is restockable
    record.returnedItems.forEach(ret => {
      if (ret.condition === "restockable") {
        let p = productMap.get(ret.productId);
        if (!p && ret.sku) {
          p = Array.from(productMap.values()).find(x => x.sku === ret.sku);
        }
        if (p) {
          p.stock = (Number(p.stock) || 0) + (Number(ret.quantity) || 1);
        }
      }
    });

    // 2. Issued items: Deduct from stock
    record.issuedItems.forEach(iss => {
      let p = productMap.get(iss.productId);
      if (!p && iss.sku) {
        p = Array.from(productMap.values()).find(x => x.sku === iss.sku);
      }
      if (p) {
        p.stock = Math.max(0, (Number(p.stock) || 0) - (Number(iss.quantity) || 1));
      }
    });

    return Array.from(productMap.values());
  },

  generateSlipText(r: ExchangeRecord): string {
    let t = "";
    t += "================================================\n";
    t += "            RAJNANDINI BOUTIQUE                 \n";
    t += "        OFFICIAL EXCHANGE / RETURN VOUCHER      \n";
    t += "================================================\n";
    t += `Exchange No   : ${r.exchangeNo}\n`;
    t += `Date & Time   : ${r.createdAt}\n`;
    t += `Original Bill : ${r.originalBillNo} (Dated: ${r.originalBillDate?.slice(0, 10) || "N/A"})\n`;
    t += `Customer Name : ${r.customer.name}\n`;
    t += `Phone Number  : ${r.customer.phone}\n`;
    t += "------------------------------------------------\n";
    t += "ITEM(S) RETURNED:\n";
    r.returnedItems.forEach((it, idx) => {
      const reasonLabel = it.reason === "size_fitting" ? "Size / Fitting Issue"
        : it.reason === "color_choice" ? "Color Preference"
        : it.reason === "defect_damage" ? "Defective Piece"
        : "Customer Choice";
      t += `${idx + 1}. ${it.name} (${it.sku})\n`;
      t += `   ${it.quantity} pc @ Rs ${it.originalPrice} | Reason: ${reasonLabel}\n`;
      t += `   Condition: ${it.condition === "restockable" ? "Restocked to Shop" : "Damaged / Defective"}\n`;
    });
    t += `Total Return Credit: Rs ${r.totalReturnCredit}\n`;
    t += "------------------------------------------------\n";
    t += "NEW REPLACEMENT ITEM(S) ISSUED:\n";
    r.issuedItems.forEach((it, idx) => {
      t += `${idx + 1}. ${it.name} (${it.sku})\n`;
      t += `   ${it.quantity} pc @ Rs ${it.price} ${it.selectedSize ? "(Size: " + it.selectedSize + ")" : ""}\n`;
    });
    t += `Total New Items Value: Rs ${r.totalNewItemsValue}\n`;
    t += "================================================\n";
    if (r.differenceAmount > 0) {
      t += `DIFFERENCE PAID BY CUSTOMER: Rs ${r.differenceAmount} (${r.paymentMode.toUpperCase()})\n`;
    } else if (r.differenceAmount < 0) {
      t += `REFUND / STORE CREDIT ISSUED: Rs ${Math.abs(r.differenceAmount)}\n`;
    } else {
      t += `EVEN EXCHANGE (DIFFERENCE Rs 0)\n`;
    }
    t += "================================================\n";
    t += "Thank you for shopping at Rajnandini Boutique!\n";
    t += "Note: Exchanged items are not eligible for\nfurther exchange without manager approval.\n";
    return t;
  },

  exportCsv(records: ExchangeRecord[]): string {
    const rows: string[][] = [];
    rows.push(["RAJNANDINI BOUTIQUE - CUSTOMER EXCHANGES & REPLACEMENTS AUDIT REGISTER"]);
    rows.push(["Export Date", new Date().toLocaleString("en-IN")]);
    rows.push([]);
    rows.push([
      "Exchange Voucher #",
      "Date & Time",
      "Original Bill #",
      "Customer Name",
      "Customer Phone",
      "Returned Items",
      "Return Reasons",
      "Returned Items Credit (Rs)",
      "Replacement Items",
      "Replacement Value (Rs)",
      "Difference Amount (Rs)",
      "Settlement Mode",
      "Payment Mode",
      "Staff Handler",
      "Notes"
    ]);

    records.forEach(r => {
      const retStr = r.returnedItems.map(it => `${it.name} x${it.quantity} (Rs ${it.originalPrice})`).join("; ");
      const retReasons = r.returnedItems.map(it => it.reason).join("; ");
      const issStr = r.issuedItems.map(it => `${it.name} x${it.quantity} (Rs ${it.price})`).join("; ");

      rows.push([
        r.exchangeNo,
        r.createdAt,
        r.originalBillNo,
        r.customer.name,
        r.customer.phone,
        retStr,
        retReasons,
        String(r.totalReturnCredit),
        issStr,
        String(r.totalNewItemsValue),
        String(r.differenceAmount),
        r.settlementType,
        r.paymentMode,
        r.staffName || "Staff",
        r.notes || ""
      ]);
    });

    return rows
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
  }
};
