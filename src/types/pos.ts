export type ProductCategory = 
  | "all"
  | "sarees"
  | "lehengas" 
  | "kurtis" 
  | "jewellery" 
  | "footwear" 
  | "parlour";

export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: "sarees" | "lehengas" | "kurtis" | "jewellery" | "footwear" | "parlour";
  price: number;
  mrp: number;
  purchaseCost: number;
  stock: number;
  sizes?: string[];
  colors?: string[];
  isService?: boolean;
  serviceDuration?: string;
  badge?: string;
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
  alteration?: AlterationDetail;
}
