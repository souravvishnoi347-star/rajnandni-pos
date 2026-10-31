export type ProductCategory = 
  | "all"
  | "sarees"
  | "lehengas" 
  | "kurtis" 
  | "kidswear"
  | "handbags"
  | "bangles"
  | "earrings"
  | "jewellery" 
  | "footwear" 
  | "cosmetics"
  | "handloom"
  | "undergarments"
  | "parlour";

export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: "sarees" | "lehengas" | "kurtis" | "kidswear" | "handbags" | "bangles" | "earrings" | "jewellery" | "footwear" | "cosmetics" | "handloom" | "undergarments" | "parlour";
  price: number;
  mrp: number;
  purchaseCost: number;
  stock: number;
  sizes?: string[];
  colors?: string[];
  isService?: boolean;
  serviceDuration?: string;
  badge?: string;
  imageUrl?: string;
  supplier?: string;
}

export interface SupplierProfile {
  id: string;
  name: string;
  phone?: string;
  city?: string;
  category?: string;
  notes?: string;
}

export interface SupplierMetric {
  name: string;
  city?: string;
  skuCount: number;
  stockPcs: number;
  soldPcs: number;
  totalCostValue: number;
  totalRetailValue: number;
  totalRevenue: number;
  grossProfit: number;
  marginPct: number;
  sellThroughRate: number;
  status: "top" | "good" | "slow";
  bestsellers: { sku: string; name: string; sold: number; stock: number; revenue: number }[];
  slowMovers: { sku: string; name: string; sold: number; stock: number }[];
}

export interface ExchangeItemReturn {
  productId: string;
  sku: string;
  name: string;
  category: string;
  originalPrice: number;
  quantity: number;
  reason: "size_fitting" | "color_choice" | "defect_damage" | "customer_mind" | "other";
  condition: "restockable" | "damaged";
}

export interface ExchangeItemIssued {
  productId: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface ExchangeRecord {
  id: string;
  exchangeNo: string;
  originalBillNo: string;
  originalBillDate: string;
  customer: CustomerInfo;
  returnedItems: ExchangeItemReturn[];
  issuedItems: ExchangeItemIssued[];
  totalReturnCredit: number;
  totalNewItemsValue: number;
  differenceAmount: number;
  settlementType: "customer_paid" | "store_refund" | "even_exchange" | "store_credit";
  paymentMode: "cash" | "upi" | "card" | "credit_note";
  notes?: string;
  staffName?: string;
  createdAt: string;
  rawDate: string;
}

export interface CartItem {
  product: ProductItem;
  selectedSize?: string;
  selectedColor?: string;
  beauticianName?: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  isNegotiated?: boolean;
  customDiscount: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  notes: string;
}

export interface AlterationDetail {
  required: boolean;
  garmentName: string;
  fittingNotes: string;
  tailorName: string;
  readyDate: string;
  status: "Received" | "In Alteration" | "Ready for Trial" | "Delivered";
}

export interface CompletedBill {
  id: string;
  billNo: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  taxGst: number;
  grandTotal: number;
  paidAmount: number;
  originalTotal?: number;
  totalSavings?: number;
  paymentMode: "cash" | "upi" | "card" | "khata";
  createdAt: string;
  rawDate?: string;
  alteration?: AlterationDetail;
}

export interface CustomerProfile {
  id: string;
  phone: string;
  name: string;
  totalSpend: number;
  totalDiscount: number;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  lastVisitRaw?: string;
  avgBillValue: number;
  bills: CompletedBill[];
  purchasedItemsCount: number;
  topCategories: string[];
}
