import { ProductItem } from "@/types/pos";

export const INITIAL_PRODUCTS: ProductItem[] = [
  // ==========================================
  // 1. LEHENGAS & BRIDAL GOWNS
  // ==========================================
  {
    id: "prod-lhg-1",
    sku: "RJ-LHG-RD01",
    barcode: "8901001",
    name: "Royal Heritage Velvet Bridal Lehenga (Maroon)",
    category: "lehengas",
    price: 18500,
    mrp: 24999,
    purchaseCost: 11000,
    stock: 4,
    sizes: ["Semi-Stitched", "Custom Tailored"],
    colors: ["Deep Maroon", "Rani Pink"],
    badge: "Bestseller"
  },
  {
    id: "prod-lhg-2",
    sku: "RJ-LHG-PK02",
    barcode: "8901002",
    name: "Pastel Flora Mirror-Work Party Lehenga",
    category: "lehengas",
    price: 9500,
    mrp: 14500,
    purchaseCost: 5800,
    stock: 6,
    sizes: ["Free Size (Waist 30-40)"],
    colors: ["Blush Pink", "Mint Green", "Lavender"]
  },
  {
    id: "prod-lhg-3",
    sku: "RJ-LHG-SL03",
    barcode: "8901003",
    name: "Pure Katan Banarasi Silk Weaving Lehenga",
    category: "lehengas",
    price: 12800,
    mrp: 18900,
    purchaseCost: 7500,
    stock: 5,
    sizes: ["Semi-Stitched"],
    colors: ["Rani Red", "Mustard Gold"]
  },
  {
    id: "prod-lhg-4",
    sku: "RJ-LHG-GW04",
    barcode: "8901004",
    name: "Indo-Western Reception Gown with Cane-Cane",
    category: "lehengas",
    price: 7800,
    mrp: 11999,
    purchaseCost: 4500,
    stock: 3,
    sizes: ["M (38)", "L (40)", "XL (42)"],
    colors: ["Wine Purple", "Emerald Green"]
  },

  // ==========================================
  // 2. SUITS, KURTIS & ETHNIC WEAR
  // ==========================================
  {
    id: "prod-krt-1",
    sku: "RJ-SUIT-AN01",
    barcode: "8902001",
    name: "Heavy Gotapatti Pure Georgette Anarkali Suit",
    category: "kurtis",
    price: 3650,
    mrp: 4999,
    purchaseCost: 2100,
    stock: 12,
    sizes: ["S (36)", "M (38)", "L (40)", "XL (42)", "XXL (44)"],
    colors: ["Peach", "Royal Navy", "Teal"]
  },
  {
    id: "prod-krt-2",
    sku: "RJ-SUIT-SH02",
    barcode: "8902002",
    name: "Mulberry Silk Embroidered Sharara Set",
    category: "kurtis",
    price: 2850,
    mrp: 3999,
    purchaseCost: 1650,
    stock: 8,
    sizes: ["M (38)", "L (40)", "XL (42)"],
    colors: ["Hot Pink", "Mustard Yellow"]
  },
  {
    id: "prod-krt-3",
    sku: "RJ-KRT-CK03",
    barcode: "8902003",
    name: "Handcrafted Lucknowi Chikankari Cotton Kurta",
    category: "kurtis",
    price: 1450,
    mrp: 2199,
    purchaseCost: 820,
    stock: 18,
    sizes: ["S (36)", "M (38)", "L (40)", "XL (42)"],
    colors: ["Pastel Lilac", "Baby Pink", "Sky Blue"]
  },
  {
    id: "prod-krt-4",
    sku: "RJ-KRT-CT04",
    barcode: "8902004",
    name: "Daily Wear Block Print Straight Kurti Pant Set",
    category: "kurtis",
    price: 1150,
    mrp: 1699,
    purchaseCost: 650,
    stock: 25,
    sizes: ["M (38)", "L (40)", "XL (42)", "XXL (44)"],
    colors: ["Indigo Blue", "Sage Green"]
  },

  // ==========================================
  // 3. BRIDAL JEWELLERY & ACCESSORIES
  // ==========================================
  {
    id: "prod-jwl-1",
    sku: "RJ-JWL-KD01",
    barcode: "8903001",
    name: "Heritage Kundan & Green Meenakari Bridal Choker Set",
    category: "jewellery",
    price: 3450,
    mrp: 4999,
    purchaseCost: 1750,
    stock: 6,
    sizes: ["Necklace + Earrings + Maangtikka"],
    colors: ["Emerald Green", "Ruby Red"],
    badge: "Trending"
  },
  {
    id: "prod-jwl-2",
    sku: "RJ-JWL-PL02",
    barcode: "8903002",
    name: "Royal Rajwadi Aad & Mathapatti Set",
    category: "jewellery",
    price: 2250,
    mrp: 3200,
    purchaseCost: 1100,
    stock: 5,
    sizes: ["Complete Set"],
    colors: ["Gold Plated"]
  },
  {
    id: "prod-jwl-3",
    sku: "RJ-JWL-JH03",
    barcode: "8903003",
    name: "Traditional Chandbali Heavy Hanging Earrings",
    category: "jewellery",
    price: 650,
    mrp: 999,
    purchaseCost: 280,
    stock: 20,
    sizes: ["Standard Pair"],
    colors: ["Antique Gold", "Silver Oxide"]
  },
  {
    id: "prod-jwl-4",
    sku: "RJ-JWL-BN04",
    barcode: "8903004",
    name: "Velvet Bridal Chooda & Latkan Bangles Set",
    category: "jewellery",
    price: 1450,
    mrp: 2100,
    purchaseCost: 750,
    stock: 9,
    sizes: ["2.4", "2.6", "2.8"],
    colors: ["Bridal Red", "Maroon"]
  },

  // ==========================================
  // 4. FOOTWEAR & BRIDAL HEELS
  // ==========================================
  {
    id: "prod-ftw-1",
    sku: "RJ-FT-JT01",
    barcode: "8904001",
    name: "Hand Embroidered Dabka Work Punjabi Jutti",
    category: "footwear",
    price: 1250,
    mrp: 1850,
    purchaseCost: 620,
    stock: 14,
    sizes: ["4 (35)", "5 (36)", "6 (37)", "7 (38)", "8 (39)"],
    colors: ["Gold Zari", "Rani Pink"]
  },
  {
    id: "prod-ftw-2",
    sku: "RJ-FT-HL02",
    barcode: "8904002",
    name: "Bridal Block Heel Platform Sandal (3 Inch)",
    category: "footwear",
    price: 1650,
    mrp: 2499,
    purchaseCost: 880,
    stock: 11,
    sizes: ["5 (36)", "6 (37)", "7 (38)", "8 (39)"],
    colors: ["Rose Gold", "Glitter Champagne"]
  },
  {
    id: "prod-ftw-3",
    sku: "RJ-FT-KL03",
    barcode: "8904003",
    name: "Ethnic Tassel Flat Kolhapuri Chappal",
    category: "footwear",
    price: 750,
    mrp: 1199,
    purchaseCost: 350,
    stock: 16,
    sizes: ["4", "5", "6", "7", "8"],
    colors: ["Tan Brown", "Multi-thread"]
  },

  // ==========================================
  // 5. BEAUTY PARLOUR & SALON SERVICES
  // ==========================================
  {
    id: "prod-par-1",
    sku: "SRV-HD-BR01",
    barcode: "9901001",
    name: "Bridal HD Airbrush Makeover & Hair Styling",
    category: "parlour",
    price: 6500,
    mrp: 8500,
    purchaseCost: 0,
    stock: 999,
    isService: true,
    serviceDuration: "2.5 Hours",
    sizes: ["Studio Service"],
    badge: "Parlour"
  },
  {
    id: "prod-par-2",
    sku: "SRV-FAC-0302",
    barcode: "9901002",
    name: "O3+ Bridal Radiant Glow Facial & D-Tan",
    category: "parlour",
    price: 1800,
    mrp: 2500,
    purchaseCost: 0,
    stock: 999,
    isService: true,
    serviceDuration: "60 Mins",
    sizes: ["Service Session"],
    badge: "Parlour"
  },
  {
    id: "prod-par-3",
    sku: "SRV-SPA-HR03",
    barcode: "9901003",
    name: "L'Oreal Mythic Oil Hair Spa & Deep Conditioning",
    category: "parlour",
    price: 950,
    mrp: 1400,
    purchaseCost: 0,
    stock: 999,
    isService: true,
    serviceDuration: "45 Mins",
    sizes: ["Service Session"],
    badge: "Parlour"
  },
  {
    id: "prod-par-4",
    sku: "SRV-MHN-BD04",
    barcode: "9901004",
    name: "Full Hand Designer Bridal Mehendi",
    category: "parlour",
    price: 2500,
    mrp: 3500,
    purchaseCost: 0,
    stock: 999,
    isService: true,
    serviceDuration: "3 Hours",
    sizes: ["Service Session"],
    badge: "Parlour"
  },
  {
    id: "prod-par-5",
    sku: "SRV-WAX-RC05",
    barcode: "9901005",
    name: "Full Body Rica White Chocolate Waxing & Threading",
    category: "parlour",
    price: 1200,
    mrp: 1600,
    purchaseCost: 0,
    stock: 999,
    isService: true,
    serviceDuration: "50 Mins",
    sizes: ["Service Session"],
    badge: "Parlour"
  }
];

export const STAFF_BEAUTICIANS = [
  "Rajnandni (Owner & Chief Artist)",
  "Pooja (Senior Beautician)",
  "Seema (Hair & Draping Specialist)",
  "Kavita (Mehendi Artist)"
];

export const TAILOR_NAMES = [
  "Master Aslam (Senior Tailor)",
  "Ramesh Ji (Fitting & Alteration)",
  "In-House Boutique Master"
];
