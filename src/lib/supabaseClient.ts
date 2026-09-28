import { createClient } from "@supabase/supabase-js";
import { ProductItem } from "@/types/pos";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("your-project-id") &&
      !supabaseAnonKey.includes("your-anon-key")
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Service to sync inventory and bills between Cloud Supabase & Local Cache
 */
export const SupabaseService = {
  async fetchProducts(): Promise<ProductItem[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetchProducts error:", error);
        return null;
      }

      if (data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          sku: row.sku,
          barcode: row.barcode,
          name: row.name,
          category: row.category,
          price: Number(row.price),
          mrp: Number(row.mrp),
          purchaseCost: Number(row.purchase_cost || 0),
          stock: Number(row.stock || 0),
          sizes: row.sizes || [],
          colors: row.colors || [],
          badge: row.badge,
          isService: row.is_service,
          serviceDuration: row.service_duration,
        }));
      }
      return null;
    } catch (err) {
      console.error("Failed to query Supabase products:", err);
      return null;
    }
  },

  async syncInitialProducts(products: ProductItem[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = products.map((p) => ({
        id: p.id,
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        price: p.price,
        mrp: p.mrp,
        purchase_cost: p.purchaseCost,
        stock: p.stock,
        sizes: p.sizes,
        colors: p.colors,
        badge: p.badge,
        is_service: Boolean(p.isService),
        service_duration: p.serviceDuration || null,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("products")
        .upsert(rows, { onConflict: "sku" });

      if (error) {
        console.error("Supabase syncInitialProducts error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Failed to upsert products to Supabase:", err);
      return false;
    }
  },

  async updateProductPrice(sku: string, price: number, mrp: number, badge?: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from("products")
        .update({ price, mrp, badge, updated_at: new Date().toISOString() })
        .eq("sku", sku);
      return !error;
    } catch {
      return false;
    }
  },

  async recordSale(bill: {
    invoiceNumber: string;
    customerName: string;
    customerPhone: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMode: string;
    items: any[];
  }): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from("bills").insert({
        invoice_number: bill.invoiceNumber,
        customer_name: bill.customerName,
        customer_phone: bill.customerPhone,
        subtotal: bill.subtotal,
        discount: bill.discount,
        tax: bill.tax,
        total: bill.total,
        payment_mode: bill.paymentMode,
        items: bill.items,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Supabase recordSale error:", error);
        return false;
      }

      // Deduct stock for physical items
      for (const item of bill.items) {
        if (!item.isService && item.id) {
          try {
            await supabase.rpc("decrement_stock", {
              p_product_id: item.id,
              p_qty: item.quantity || 1,
            });
          } catch {
            // fallback standard update
            await supabase
              .from("products")
              .update({ stock: Math.max(0, (item.stock || 1) - (item.quantity || 1)) })
              .eq("id", item.id);
          }
        }
      }

      return true;
    } catch (err) {
      console.error("Failed to record bill in Supabase:", err);
      return false;
    }
  },
};
