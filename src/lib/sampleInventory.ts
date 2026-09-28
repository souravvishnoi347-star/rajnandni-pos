import { ProductItem } from "@/types/pos";

/**
 * RAJNANDNI BOUTIQUE & PARLOUR (Arya Nagar / Rajeev Nagar, Haridwar)
 * Real Wholesale Inventory parsed directly from Supplier Purchase Bills:
 * - Jawahar Lal Jagannath Prasad (Kanpur)
 * - Sadhvi Sarees Pvt. Ltd. (Kanpur)
 * - J.J. Sarees Pvt. Ltd.
 *
 * Formula Mandate:
 * Selling Price = Wholesale Cost + 50% Margin (Cost * 1.50)
 * MRP = Rounded Price with headroom for customer negotiation & festival discounts.
 */
export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    "id": "prod-bill-1",
    "sku": "RJ-SAR-001",
    "barcode": "8901001",
    "name": "Dharti Stich Blouse Dola Silk Saree",
    "category": "sarees",
    "price": 2144,
    "mrp": 2679,
    "purchaseCost": 1429,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Stitched Blouse"
  },
  {
    "id": "prod-bill-2",
    "sku": "RJ-SAR-002",
    "barcode": "8901002",
    "name": "Chintu Daily Floral Georgette Saree",
    "category": "sarees",
    "price": 818,
    "mrp": 1019,
    "purchaseCost": 545,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Daily Wear"
  },
  {
    "id": "prod-bill-3",
    "sku": "RJ-SAR-003",
    "barcode": "8901003",
    "name": "Mintu Printed Casual Soft Saree",
    "category": "sarees",
    "price": 818,
    "mrp": 1019,
    "purchaseCost": 545,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Daily Wear"
  },
  {
    "id": "prod-bill-4",
    "sku": "RJ-SAR-004",
    "barcode": "8901004",
    "name": "Tilak Dola Silk Zari Border Saree",
    "category": "sarees",
    "price": 1463,
    "mrp": 1829,
    "purchaseCost": 975,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Dola Silk"
  },
  {
    "id": "prod-bill-5",
    "sku": "RJ-SAR-005",
    "barcode": "8901005",
    "name": "Patlu Sathin Designer Party Saree",
    "category": "sarees",
    "price": 1118,
    "mrp": 1399,
    "purchaseCost": 745,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Satin Silk"
  },
  {
    "id": "prod-bill-6",
    "sku": "RJ-SAR-006",
    "barcode": "8901006",
    "name": "Nishant Stich Border Festive Saree",
    "category": "sarees",
    "price": 1388,
    "mrp": 1739,
    "purchaseCost": 925,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Stitched Border"
  },
  {
    "id": "prod-bill-7",
    "sku": "RJ-SAR-007",
    "barcode": "8901007",
    "name": "Gemini Asharfi Matching Saree Set",
    "category": "sarees",
    "price": 807,
    "mrp": 1009,
    "purchaseCost": 538,
    "stock": 10,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Matching Set"
  },
  {
    "id": "prod-bill-8",
    "sku": "RJ-SAR-008",
    "barcode": "8901008",
    "name": "Trends Print Asharfi Matching Set",
    "category": "sarees",
    "price": 393,
    "mrp": 489,
    "purchaseCost": 262,
    "stock": 10,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Best Price"
  },
  {
    "id": "prod-bill-9",
    "sku": "RJ-SAR-009",
    "barcode": "8901009",
    "name": "Bingo Silk K-73 Premium Surat Saree",
    "category": "sarees",
    "price": 2033,
    "mrp": 2539,
    "purchaseCost": 1355,
    "stock": 10,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Surat Silk"
  },
  {
    "id": "prod-bill-10",
    "sku": "RJ-SAR-010",
    "barcode": "8901010",
    "name": "Fastag Silk K-73 Surat Saree",
    "category": "sarees",
    "price": 1455,
    "mrp": 1819,
    "purchaseCost": 970,
    "stock": 9,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Surat Silk"
  },
  {
    "id": "prod-bill-11",
    "sku": "RJ-SAR-011",
    "barcode": "8901011",
    "name": "Kulcha Silk K-73 Surat Saree",
    "category": "sarees",
    "price": 1695,
    "mrp": 2119,
    "purchaseCost": 1130,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Surat Silk"
  },
  {
    "id": "prod-bill-12",
    "sku": "RJ-SAR-012",
    "barcode": "8901012",
    "name": "Gold Coin Silk K-73 Surat Saree",
    "category": "sarees",
    "price": 2198,
    "mrp": 2749,
    "purchaseCost": 1465,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Zari Weave"
  },
  {
    "id": "prod-bill-13",
    "sku": "RJ-SAR-013",
    "barcode": "8901013",
    "name": "Rubal Silk K-73 Rich Pallu Saree",
    "category": "sarees",
    "price": 2370,
    "mrp": 2959,
    "purchaseCost": 1580,
    "stock": 15,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Bestseller"
  },
  {
    "id": "prod-bill-14",
    "sku": "RJ-SAR-014",
    "barcode": "8901014",
    "name": "Digital Village K-245 Fancy Saree",
    "category": "sarees",
    "price": 1889,
    "mrp": 2359,
    "purchaseCost": 1259,
    "stock": 2,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Digital Print"
  },
  {
    "id": "prod-bill-15",
    "sku": "RJ-SAR-015",
    "barcode": "8901015",
    "name": "Laal K-108 Traditional Red Saree",
    "category": "sarees",
    "price": 1628,
    "mrp": 2039,
    "purchaseCost": 1085,
    "stock": 6,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Pooja Special"
  },
  {
    "id": "prod-bill-16",
    "sku": "RJ-SAR-016",
    "barcode": "8901016",
    "name": "Suhani K-108 Georgette Saree",
    "category": "sarees",
    "price": 1628,
    "mrp": 2039,
    "purchaseCost": 1085,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Soft Georgette"
  },
  {
    "id": "prod-bill-17",
    "sku": "RJ-SAR-017",
    "barcode": "8901017",
    "name": "Vanshika K-139 Designer Saree",
    "category": "sarees",
    "price": 1932,
    "mrp": 2419,
    "purchaseCost": 1288,
    "stock": 3,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Designer"
  },
  {
    "id": "prod-bill-18",
    "sku": "RJ-SAR-018",
    "barcode": "8901018",
    "name": "Khat K-241 Traditional Weave Saree",
    "category": "sarees",
    "price": 1134,
    "mrp": 1419,
    "purchaseCost": 756,
    "stock": 14,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Traditional"
  },
  {
    "id": "prod-bill-19",
    "sku": "RJ-SAR-019",
    "barcode": "8901019",
    "name": "Murli K-241 Rich Silk Saree",
    "category": "sarees",
    "price": 2235,
    "mrp": 2789,
    "purchaseCost": 1490,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Rich Silk"
  },
  {
    "id": "prod-bill-20",
    "sku": "RJ-SAR-020",
    "barcode": "8901020",
    "name": "Rittika Satin Gulshan Designer Saree",
    "category": "sarees",
    "price": 1538,
    "mrp": 1919,
    "purchaseCost": 1025,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Gulshan Satin"
  },
  {
    "id": "prod-bill-21",
    "sku": "RJ-SAR-021",
    "barcode": "8901021",
    "name": "Dilnaaz Heavy Gulshan Saree",
    "category": "sarees",
    "price": 1923,
    "mrp": 2399,
    "purchaseCost": 1282,
    "stock": 9,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Party Wear"
  },
  {
    "id": "prod-bill-22",
    "sku": "RJ-SAR-022",
    "barcode": "8901022",
    "name": "Sakshi Satin Gulshan Saree",
    "category": "sarees",
    "price": 1319,
    "mrp": 1649,
    "purchaseCost": 879,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Satin Finish"
  },
  {
    "id": "prod-bill-23",
    "sku": "RJ-SAR-023",
    "barcode": "8901023",
    "name": "Meena Siroski Work Gulshan Saree",
    "category": "sarees",
    "price": 1773,
    "mrp": 2219,
    "purchaseCost": 1182,
    "stock": 10,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Siroshki Diamond"
  },
  {
    "id": "prod-bill-24",
    "sku": "RJ-SAR-024",
    "barcode": "8901024",
    "name": "Sonakshi Satin Gulshan Saree",
    "category": "sarees",
    "price": 1671,
    "mrp": 2089,
    "purchaseCost": 1114,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Satin Finish"
  },
  {
    "id": "prod-bill-25",
    "sku": "RJ-SAR-025",
    "barcode": "8901025",
    "name": "Chetan Hari 2575 Banarasi Weave Saree",
    "category": "sarees",
    "price": 2301,
    "mrp": 2879,
    "purchaseCost": 1534,
    "stock": 3,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Banarasi Weave"
  },
  {
    "id": "prod-bill-26",
    "sku": "RJ-SAR-026",
    "barcode": "8901026",
    "name": "Bengal Handloom Silk Anushri Saree",
    "category": "sarees",
    "price": 975,
    "mrp": 1219,
    "purchaseCost": 650,
    "stock": 6,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Handloom"
  },
  {
    "id": "prod-bill-27",
    "sku": "RJ-SAR-027",
    "barcode": "8901027",
    "name": "Tana Bana Pure Cotton Saree",
    "category": "sarees",
    "price": 992,
    "mrp": 1239,
    "purchaseCost": 661,
    "stock": 12,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "100% Cotton"
  },
  {
    "id": "prod-bill-28",
    "sku": "RJ-SAR-028",
    "barcode": "8901028",
    "name": "Tant Cotton Traditional Bengal Saree",
    "category": "sarees",
    "price": 1145,
    "mrp": 1429,
    "purchaseCost": 763,
    "stock": 6,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Bengal Tant"
  },
  {
    "id": "prod-bill-29",
    "sku": "RJ-SAR-029",
    "barcode": "8901029",
    "name": "Ragini K-69 Surat Designer Saree",
    "category": "sarees",
    "price": 1857,
    "mrp": 2319,
    "purchaseCost": 1238,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Surat Silk"
  },
  {
    "id": "prod-bill-30",
    "sku": "RJ-SAR-030",
    "barcode": "8901030",
    "name": "Braso Queen K-69 Royal Brasso Saree",
    "category": "sarees",
    "price": 2303,
    "mrp": 2879,
    "purchaseCost": 1535,
    "stock": 15,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Royal Brasso"
  },
  {
    "id": "prod-bill-31",
    "sku": "RJ-SAR-031",
    "barcode": "8901031",
    "name": "Go Digit K-229 Surat Fancy Saree",
    "category": "sarees",
    "price": 1764,
    "mrp": 2209,
    "purchaseCost": 1176,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Surat Fancy"
  },
  {
    "id": "prod-bill-32",
    "sku": "RJ-SAR-032",
    "barcode": "8901032",
    "name": "Digi Hub K-229 Surat Fancy Saree",
    "category": "sarees",
    "price": 1932,
    "mrp": 2419,
    "purchaseCost": 1288,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Surat Fancy"
  },
  {
    "id": "prod-bill-33",
    "sku": "RJ-SAR-033",
    "barcode": "8901033",
    "name": "Mandira Waves K-69 Wave Pattern Saree",
    "category": "sarees",
    "price": 1973,
    "mrp": 2469,
    "purchaseCost": 1315,
    "stock": 3,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Wave Pattern"
  },
  {
    "id": "prod-bill-34",
    "sku": "RJ-SAR-034",
    "barcode": "8901034",
    "name": "Pineapple K-69 Fancy Weave Saree",
    "category": "sarees",
    "price": 1544,
    "mrp": 1929,
    "purchaseCost": 1029,
    "stock": 11,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Fancy Weave"
  },
  {
    "id": "prod-bill-35",
    "sku": "RJ-SAR-035",
    "barcode": "8901035",
    "name": "Cocktail K-69 Luxury Party Saree",
    "category": "sarees",
    "price": 2963,
    "mrp": 3699,
    "purchaseCost": 1975,
    "stock": 1,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Exclusive"
  },
  {
    "id": "prod-bill-36",
    "sku": "RJ-SAR-036",
    "barcode": "8901036",
    "name": "Miraz K-69 Satin Silk Saree",
    "category": "sarees",
    "price": 2393,
    "mrp": 2989,
    "purchaseCost": 1595,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Satin Silk"
  },
  {
    "id": "prod-bill-37",
    "sku": "RJ-SAR-037",
    "barcode": "8901037",
    "name": "Shyama K-300 Everyday Surat Saree",
    "category": "sarees",
    "price": 1298,
    "mrp": 1619,
    "purchaseCost": 865,
    "stock": 10,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Daily Wear"
  },
  {
    "id": "prod-bill-38",
    "sku": "RJ-SAR-038",
    "barcode": "8901038",
    "name": "Rang Rasiya K-249 Festive Silk Saree",
    "category": "sarees",
    "price": 2115,
    "mrp": 2639,
    "purchaseCost": 1410,
    "stock": 3,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Festive Silk"
  },
  {
    "id": "prod-bill-39",
    "sku": "RJ-SAR-039",
    "barcode": "8901039",
    "name": "Trump K-293 Surat Saree",
    "category": "sarees",
    "price": 1470,
    "mrp": 1839,
    "purchaseCost": 980,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Surat Saree"
  },
  {
    "id": "prod-bill-40",
    "sku": "RJ-SAR-040",
    "barcode": "8901040",
    "name": "Doll K-253 Chiffon Saree",
    "category": "sarees",
    "price": 1253,
    "mrp": 1569,
    "purchaseCost": 835,
    "stock": 3,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Soft Chiffon"
  },
  {
    "id": "prod-bill-41",
    "sku": "RJ-SAR-041",
    "barcode": "8901041",
    "name": "Mysore Silk K-249 Traditional Saree",
    "category": "sarees",
    "price": 2115,
    "mrp": 2639,
    "purchaseCost": 1410,
    "stock": 2,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Mysore Silk"
  },
  {
    "id": "prod-bill-42",
    "sku": "RJ-SAR-042",
    "barcode": "8901042",
    "name": "Flower K-293 Floral Surat Saree",
    "category": "sarees",
    "price": 1815,
    "mrp": 2269,
    "purchaseCost": 1210,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Floral Print"
  },
  {
    "id": "prod-bill-43",
    "sku": "RJ-SAR-043",
    "barcode": "8901043",
    "name": "Vaari Hamza K-138 Royal Heavy Saree",
    "category": "sarees",
    "price": 2513,
    "mrp": 3139,
    "purchaseCost": 1675,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Royal Heavy"
  },
  {
    "id": "prod-bill-44",
    "sku": "RJ-SAR-044",
    "barcode": "8901044",
    "name": "Gold Shazia K-138 Designer Saree",
    "category": "sarees",
    "price": 2198,
    "mrp": 2749,
    "purchaseCost": 1465,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Gold Zari"
  },
  {
    "id": "prod-bill-45",
    "sku": "RJ-SAR-045",
    "barcode": "8901045",
    "name": "Gold Salim K-138 Embroidered Saree",
    "category": "sarees",
    "price": 2418,
    "mrp": 3019,
    "purchaseCost": 1612,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Embroidered"
  },
  {
    "id": "prod-bill-46",
    "sku": "RJ-SAR-046",
    "barcode": "8901046",
    "name": "Maths K-138 Geometric Print Saree",
    "category": "sarees",
    "price": 1473,
    "mrp": 1839,
    "purchaseCost": 982,
    "stock": 3,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Geometric"
  },
  {
    "id": "prod-bill-47",
    "sku": "RJ-SAR-047",
    "barcode": "8901047",
    "name": "Gold Shahzada K-138 Premium Saree",
    "category": "sarees",
    "price": 2198,
    "mrp": 2749,
    "purchaseCost": 1465,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Premium Silk"
  },
  {
    "id": "prod-bill-48",
    "sku": "RJ-SAR-048",
    "barcode": "8901048",
    "name": "Ceramic K-69 Printed Saree",
    "category": "sarees",
    "price": 1973,
    "mrp": 2469,
    "purchaseCost": 1315,
    "stock": 2,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Printed Silk"
  },
  {
    "id": "prod-bill-49",
    "sku": "RJ-SAR-049",
    "barcode": "8901049",
    "name": "Mandira K-69 Surat Border Saree",
    "category": "sarees",
    "price": 2468,
    "mrp": 3089,
    "purchaseCost": 1645,
    "stock": 7,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Zari Border"
  },
  {
    "id": "prod-bill-50",
    "sku": "RJ-SAR-050",
    "barcode": "8901050",
    "name": "Gunjesh K-228 Silk Saree",
    "category": "sarees",
    "price": 1773,
    "mrp": 2219,
    "purchaseCost": 1182,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Soft Silk"
  },
  {
    "id": "prod-bill-51",
    "sku": "RJ-SAR-051",
    "barcode": "8901051",
    "name": "Digi Locker K-229 Silk Saree",
    "category": "sarees",
    "price": 1596,
    "mrp": 1999,
    "purchaseCost": 1064,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Designer"
  },
  {
    "id": "prod-bill-52",
    "sku": "RJ-SAR-052",
    "barcode": "8901052",
    "name": "Daisy Flower K-69 Surat Saree",
    "category": "sarees",
    "price": 1808,
    "mrp": 2259,
    "purchaseCost": 1205,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Daisy Flower"
  },
  {
    "id": "prod-bill-53",
    "sku": "RJ-SAR-053",
    "barcode": "8901053",
    "name": "Sanjana K-139 Designer Saree",
    "category": "sarees",
    "price": 1737,
    "mrp": 2169,
    "purchaseCost": 1158,
    "stock": 3,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Designer Saree"
  },
  {
    "id": "prod-bill-54",
    "sku": "RJ-SAR-054",
    "barcode": "8901054",
    "name": "Pepsi K-139 Surat Casual Saree",
    "category": "sarees",
    "price": 2025,
    "mrp": 2529,
    "purchaseCost": 1350,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Surat Silk"
  },
  {
    "id": "prod-bill-55",
    "sku": "RJ-SAR-055",
    "barcode": "8901055",
    "name": "Heritage K-241 Traditional Saree",
    "category": "sarees",
    "price": 1478,
    "mrp": 1849,
    "purchaseCost": 985,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Heritage"
  },
  {
    "id": "prod-bill-56",
    "sku": "RJ-SAR-056",
    "barcode": "8901056",
    "name": "Sufi K-241 Elegance Saree",
    "category": "sarees",
    "price": 1733,
    "mrp": 2169,
    "purchaseCost": 1155,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Elegance"
  },
  {
    "id": "prod-bill-57",
    "sku": "RJ-SAR-057",
    "barcode": "8901057",
    "name": "Faluda Silk K-73 Heavy Pallu Saree",
    "category": "sarees",
    "price": 2033,
    "mrp": 2539,
    "purchaseCost": 1355,
    "stock": 12,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Bestseller"
  },
  {
    "id": "prod-bill-58",
    "sku": "RJ-SAR-058",
    "barcode": "8901058",
    "name": "Neha Silk K-73 Festive Saree",
    "category": "sarees",
    "price": 2198,
    "mrp": 2749,
    "purchaseCost": 1465,
    "stock": 4,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Festive Silk"
  },
  {
    "id": "prod-bill-59",
    "sku": "RJ-SAR-059",
    "barcode": "8901059",
    "name": "Paneri Silk K-73 Surat Saree",
    "category": "sarees",
    "price": 2198,
    "mrp": 2749,
    "purchaseCost": 1465,
    "stock": 5,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Paneri Silk"
  },
  {
    "id": "prod-bill-60",
    "sku": "RJ-SAR-060",
    "barcode": "8901060",
    "name": "Aaliya K-139 Boutique Silk Saree",
    "category": "sarees",
    "price": 1856,
    "mrp": 2319,
    "purchaseCost": 1237,
    "stock": 9,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Boutique Silk"
  },
  {
    "id": "prod-bill-61",
    "sku": "RJ-SAR-061",
    "barcode": "8901061",
    "name": "Rashmi K-139 Embroidered Saree",
    "category": "sarees",
    "price": 2144,
    "mrp": 2679,
    "purchaseCost": 1429,
    "stock": 2,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Embroidered"
  },
  {
    "id": "prod-bill-62",
    "sku": "RJ-SAR-062",
    "barcode": "8901062",
    "name": "Linen Silk K-179 Handloom Saree",
    "category": "sarees",
    "price": 1922,
    "mrp": 2399,
    "purchaseCost": 1281,
    "stock": 3,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Linen Silk"
  },
  {
    "id": "prod-bill-63",
    "sku": "RJ-SAR-063",
    "barcode": "8901063",
    "name": "Rabita Dailywear Printed Saree",
    "category": "sarees",
    "price": 371,
    "mrp": 459,
    "purchaseCost": 247,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Budget Friendly"
  },
  {
    "id": "prod-bill-64",
    "sku": "RJ-SAR-064",
    "barcode": "8901064",
    "name": "Deepmala Elegant Printed Saree",
    "category": "sarees",
    "price": 398,
    "mrp": 499,
    "purchaseCost": 265,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Budget Friendly"
  },
  {
    "id": "prod-bill-65",
    "sku": "RJ-SAR-065",
    "barcode": "8901065",
    "name": "Zonexa Modern Floral Print Saree",
    "category": "sarees",
    "price": 435,
    "mrp": 539,
    "purchaseCost": 290,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Floral Print"
  },
  {
    "id": "prod-bill-66",
    "sku": "RJ-SAR-066",
    "barcode": "8901066",
    "name": "Scorpio Geometric Printed Saree",
    "category": "sarees",
    "price": 435,
    "mrp": 539,
    "purchaseCost": 290,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Geometric"
  },
  {
    "id": "prod-bill-67",
    "sku": "RJ-SAR-067",
    "barcode": "8901067",
    "name": "Pulse Micro-Dot Print Saree",
    "category": "sarees",
    "price": 435,
    "mrp": 539,
    "purchaseCost": 290,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Daily Wear"
  },
  {
    "id": "prod-bill-68",
    "sku": "RJ-SAR-068",
    "barcode": "8901068",
    "name": "Pushpika Blossom Print Saree",
    "category": "sarees",
    "price": 473,
    "mrp": 589,
    "purchaseCost": 315,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Flower Print"
  },
  {
    "id": "prod-bill-69",
    "sku": "RJ-SAR-069",
    "barcode": "8901069",
    "name": "Ooty Cool Breeze Printed Saree",
    "category": "sarees",
    "price": 495,
    "mrp": 619,
    "purchaseCost": 330,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Cool Cotton"
  },
  {
    "id": "prod-bill-70",
    "sku": "RJ-SAR-070",
    "barcode": "8901070",
    "name": "Anand Celebration Print Saree",
    "category": "sarees",
    "price": 503,
    "mrp": 629,
    "purchaseCost": 335,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Festive Print"
  },
  {
    "id": "prod-bill-71",
    "sku": "RJ-SAR-071",
    "barcode": "8901071",
    "name": "Dev Guru Divine Temple Saree",
    "category": "sarees",
    "price": 503,
    "mrp": 629,
    "purchaseCost": 335,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Temple Border"
  },
  {
    "id": "prod-bill-72",
    "sku": "RJ-SAR-072",
    "barcode": "8901072",
    "name": "Once Time Casual Saree",
    "category": "sarees",
    "price": 510,
    "mrp": 639,
    "purchaseCost": 340,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Casual Wear"
  },
  {
    "id": "prod-bill-73",
    "sku": "RJ-SAR-073",
    "barcode": "8901073",
    "name": "Arpita Feather Soft Saree",
    "category": "sarees",
    "price": 525,
    "mrp": 659,
    "purchaseCost": 350,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Soft Chiffon"
  },
  {
    "id": "prod-bill-74",
    "sku": "RJ-SAR-074",
    "barcode": "8901074",
    "name": "Zameendar Classic Border Saree",
    "category": "sarees",
    "price": 533,
    "mrp": 669,
    "purchaseCost": 355,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Classic Border"
  },
  {
    "id": "prod-bill-75",
    "sku": "RJ-SAR-075",
    "barcode": "8901075",
    "name": "Junoon Vivid Print Saree",
    "category": "sarees",
    "price": 548,
    "mrp": 689,
    "purchaseCost": 365,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Vivid Print"
  },
  {
    "id": "prod-bill-76",
    "sku": "RJ-SAR-076",
    "barcode": "8901076",
    "name": "Amelia Floral Print Saree",
    "category": "sarees",
    "price": 548,
    "mrp": 689,
    "purchaseCost": 365,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Floral"
  },
  {
    "id": "prod-bill-77",
    "sku": "RJ-SAR-077",
    "barcode": "8901077",
    "name": "Dam Level Digital Print Saree",
    "category": "sarees",
    "price": 555,
    "mrp": 689,
    "purchaseCost": 370,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Digital Print"
  },
  {
    "id": "prod-bill-78",
    "sku": "RJ-SAR-078",
    "barcode": "8901078",
    "name": "Pink App Designer Print Saree",
    "category": "sarees",
    "price": 563,
    "mrp": 699,
    "purchaseCost": 375,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Pink App"
  },
  {
    "id": "prod-bill-79",
    "sku": "RJ-SAR-079",
    "barcode": "8901079",
    "name": "Rangeela Multicolor Leheriya Saree",
    "category": "sarees",
    "price": 570,
    "mrp": 709,
    "purchaseCost": 380,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Leheriya Print"
  },
  {
    "id": "prod-bill-80",
    "sku": "RJ-SAR-080",
    "barcode": "8901080",
    "name": "Chunari Special Bandhani Saree",
    "category": "sarees",
    "price": 570,
    "mrp": 709,
    "purchaseCost": 380,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Bandhani"
  },
  {
    "id": "prod-bill-81",
    "sku": "RJ-SAR-081",
    "barcode": "8901081",
    "name": "Chunari Festival Red Bandhani Saree",
    "category": "sarees",
    "price": 585,
    "mrp": 729,
    "purchaseCost": 390,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Pooja Special"
  },
  {
    "id": "prod-bill-82",
    "sku": "RJ-SAR-082",
    "barcode": "8901082",
    "name": "Chunari Shine Foil Print Saree",
    "category": "sarees",
    "price": 593,
    "mrp": 739,
    "purchaseCost": 395,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Foil Print"
  },
  {
    "id": "prod-bill-83",
    "sku": "RJ-SAR-083",
    "barcode": "8901083",
    "name": "Paridhan Traditional Ethnic Saree",
    "category": "sarees",
    "price": 608,
    "mrp": 759,
    "purchaseCost": 405,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Ethnic"
  },
  {
    "id": "prod-bill-84",
    "sku": "RJ-SAR-084",
    "barcode": "8901084",
    "name": "Leela Heritage Silk Touch Saree",
    "category": "sarees",
    "price": 615,
    "mrp": 769,
    "purchaseCost": 410,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Silk Touch"
  },
  {
    "id": "prod-bill-85",
    "sku": "RJ-SAR-085",
    "barcode": "8901085",
    "name": "Jemin Soft Crepe Printed Saree",
    "category": "sarees",
    "price": 615,
    "mrp": 769,
    "purchaseCost": 410,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Crepe"
  },
  {
    "id": "prod-bill-86",
    "sku": "RJ-SAR-086",
    "barcode": "8901086",
    "name": "Surbhi Designer Print Saree",
    "category": "sarees",
    "price": 623,
    "mrp": 779,
    "purchaseCost": 415,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Designer Print"
  },
  {
    "id": "prod-bill-87",
    "sku": "RJ-SAR-087",
    "barcode": "8901087",
    "name": "Shubh Labh Auspicious Puja Saree",
    "category": "sarees",
    "price": 638,
    "mrp": 799,
    "purchaseCost": 425,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Puja Special"
  },
  {
    "id": "prod-bill-88",
    "sku": "RJ-SAR-088",
    "barcode": "8901088",
    "name": "Pranam Temple Border Saree",
    "category": "sarees",
    "price": 645,
    "mrp": 809,
    "purchaseCost": 430,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Temple Border"
  },
  {
    "id": "prod-bill-89",
    "sku": "RJ-SAR-089",
    "barcode": "8901089",
    "name": "Mahotsav Festive Print Saree",
    "category": "sarees",
    "price": 660,
    "mrp": 829,
    "purchaseCost": 440,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Festive Print"
  },
  {
    "id": "prod-bill-90",
    "sku": "RJ-SAR-090",
    "barcode": "8901090",
    "name": "Anuradha Fine Georgette Saree",
    "category": "sarees",
    "price": 675,
    "mrp": 839,
    "purchaseCost": 450,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Fine Georgette"
  },
  {
    "id": "prod-bill-91",
    "sku": "RJ-SAR-091",
    "barcode": "8901091",
    "name": "Apsara Shimmer Border Saree",
    "category": "sarees",
    "price": 690,
    "mrp": 859,
    "purchaseCost": 460,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Shimmer Border"
  },
  {
    "id": "prod-bill-92",
    "sku": "RJ-SAR-092",
    "barcode": "8901092",
    "name": "Shanaya Pastel Bloom Saree",
    "category": "sarees",
    "price": 698,
    "mrp": 869,
    "purchaseCost": 465,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Pastel Bloom"
  },
  {
    "id": "prod-bill-93",
    "sku": "RJ-SAR-093",
    "barcode": "8901093",
    "name": "Tarang Wave Print Saree",
    "category": "sarees",
    "price": 705,
    "mrp": 879,
    "purchaseCost": 470,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Wave Print"
  },
  {
    "id": "prod-bill-94",
    "sku": "RJ-SAR-094",
    "barcode": "8901094",
    "name": "Dhanlaxmi Shagun Festive Saree",
    "category": "sarees",
    "price": 713,
    "mrp": 889,
    "purchaseCost": 475,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Shagun Saree"
  },
  {
    "id": "prod-bill-95",
    "sku": "RJ-SAR-095",
    "barcode": "8901095",
    "name": "Sitara Starlight Printed Saree",
    "category": "sarees",
    "price": 728,
    "mrp": 909,
    "purchaseCost": 485,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Starlight Print"
  },
  {
    "id": "prod-bill-96",
    "sku": "RJ-SAR-096",
    "barcode": "8901096",
    "name": "Keshav Peacock Feather Saree",
    "category": "sarees",
    "price": 735,
    "mrp": 919,
    "purchaseCost": 490,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Peacock Motif"
  },
  {
    "id": "prod-bill-97",
    "sku": "RJ-SAR-097",
    "barcode": "8901097",
    "name": "Donald Fancy Digital Print Saree",
    "category": "sarees",
    "price": 765,
    "mrp": 959,
    "purchaseCost": 510,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Fancy Print"
  },
  {
    "id": "prod-bill-98",
    "sku": "RJ-SAR-098",
    "barcode": "8901098",
    "name": "Eco Brasso Partywear Sheer Saree",
    "category": "sarees",
    "price": 788,
    "mrp": 989,
    "purchaseCost": 525,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Eco Brasso"
  },
  {
    "id": "prod-bill-99",
    "sku": "RJ-SAR-099",
    "barcode": "8901099",
    "name": "Aarohi Designer Touch Saree",
    "category": "sarees",
    "price": 803,
    "mrp": 999,
    "purchaseCost": 535,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Designer Touch"
  },
  {
    "id": "prod-bill-100",
    "sku": "RJ-SAR-100",
    "barcode": "8901100",
    "name": "Creative Modern Art Saree",
    "category": "sarees",
    "price": 810,
    "mrp": 1009,
    "purchaseCost": 540,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Modern Art"
  },
  {
    "id": "prod-bill-101",
    "sku": "RJ-SAR-101",
    "barcode": "8901101",
    "name": "Mauli Brasso Red-Gold Festive Saree",
    "category": "sarees",
    "price": 825,
    "mrp": 1029,
    "purchaseCost": 550,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Brasso Red-Gold"
  },
  {
    "id": "prod-bill-102",
    "sku": "RJ-SAR-102",
    "barcode": "8901102",
    "name": "Melody Musical Print Saree",
    "category": "sarees",
    "price": 840,
    "mrp": 1049,
    "purchaseCost": 560,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Melody Print"
  },
  {
    "id": "prod-bill-103",
    "sku": "RJ-SAR-103",
    "barcode": "8901103",
    "name": "Brahm Putra Hand-feel Silk Saree",
    "category": "sarees",
    "price": 863,
    "mrp": 1079,
    "purchaseCost": 575,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Hand Feel Silk"
  },
  {
    "id": "prod-bill-104",
    "sku": "RJ-SAR-104",
    "barcode": "8901104",
    "name": "Disco Glitz Partywear Saree",
    "category": "sarees",
    "price": 870,
    "mrp": 1089,
    "purchaseCost": 580,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Party Wear"
  },
  {
    "id": "prod-bill-105",
    "sku": "RJ-SAR-105",
    "barcode": "8901105",
    "name": "Malai Soft Butter Touch Saree",
    "category": "sarees",
    "price": 885,
    "mrp": 1109,
    "purchaseCost": 590,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Butter Touch"
  },
  {
    "id": "prod-bill-106",
    "sku": "RJ-SAR-106",
    "barcode": "8901106",
    "name": "Aarvi Premium Boutique Print Saree",
    "category": "sarees",
    "price": 915,
    "mrp": 1139,
    "purchaseCost": 610,
    "stock": 8,
    "sizes": [
      "Free Size (5.5m + Blouse)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Boutique Print"
  },
  {
    "id": "prod-bill-107",
    "sku": "RJ-SUT-107",
    "barcode": "8901107",
    "name": "Parle-G Shivram Cotton Suit Pcs",
    "category": "kurtis",
    "price": 285,
    "mrp": 359,
    "purchaseCost": 190,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Pure Cotton"
  },
  {
    "id": "prod-bill-108",
    "sku": "RJ-SUT-108",
    "barcode": "8901108",
    "name": "7 Star Shivram Dailywear Suit Pcs",
    "category": "kurtis",
    "price": 320,
    "mrp": 399,
    "purchaseCost": 213,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Daily Wear"
  },
  {
    "id": "prod-bill-109",
    "sku": "RJ-SUT-109",
    "barcode": "8901109",
    "name": "5 Star Shivram Pure Cotton Suit",
    "category": "kurtis",
    "price": 320,
    "mrp": 399,
    "purchaseCost": 213,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Pure Cotton"
  },
  {
    "id": "prod-bill-110",
    "sku": "RJ-SUT-110",
    "barcode": "8901110",
    "name": "Swift Dezire Shivram Summer Suit",
    "category": "kurtis",
    "price": 285,
    "mrp": 359,
    "purchaseCost": 190,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Summer Cool"
  },
  {
    "id": "prod-bill-111",
    "sku": "RJ-SUT-111",
    "barcode": "8901111",
    "name": "Pan Bahar Shivram Festive Cotton Suit",
    "category": "kurtis",
    "price": 353,
    "mrp": 439,
    "purchaseCost": 235,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Festive Cotton"
  },
  {
    "id": "prod-bill-112",
    "sku": "RJ-SUT-112",
    "barcode": "8901112",
    "name": "Pritika Aayushi Designer Suit Pcs",
    "category": "kurtis",
    "price": 536,
    "mrp": 669,
    "purchaseCost": 357,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Designer Suit"
  },
  {
    "id": "prod-bill-113",
    "sku": "RJ-SUT-113",
    "barcode": "8901113",
    "name": "Laptop Aayushi Digital Print Suit",
    "category": "kurtis",
    "price": 536,
    "mrp": 669,
    "purchaseCost": 357,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Digital Print"
  },
  {
    "id": "prod-bill-114",
    "sku": "RJ-SUT-114",
    "barcode": "8901114",
    "name": "Ghayal Aayushi Boutique Suit",
    "category": "kurtis",
    "price": 630,
    "mrp": 789,
    "purchaseCost": 420,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Boutique Suit"
  },
  {
    "id": "prod-bill-115",
    "sku": "RJ-SUT-115",
    "barcode": "8901115",
    "name": "Arman Aayushi Casual Print Suit",
    "category": "kurtis",
    "price": 654,
    "mrp": 819,
    "purchaseCost": 436,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Casual Print"
  },
  {
    "id": "prod-bill-116",
    "sku": "RJ-SUT-116",
    "barcode": "8901116",
    "name": "Cotton Savarna Jaipuri Printed Suit",
    "category": "kurtis",
    "price": 537,
    "mrp": 669,
    "purchaseCost": 358,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Jaipuri Print"
  },
  {
    "id": "prod-bill-117",
    "sku": "RJ-SUT-117",
    "barcode": "8901117",
    "name": "BMW Savarna Heavy Gota Patti Suit",
    "category": "kurtis",
    "price": 1227,
    "mrp": 1529,
    "purchaseCost": 818,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Gota Patti"
  },
  {
    "id": "prod-bill-118",
    "sku": "RJ-SUT-118",
    "barcode": "8901118",
    "name": "Kingfisher Satguru Fine Cotton Suit",
    "category": "kurtis",
    "price": 645,
    "mrp": 809,
    "purchaseCost": 430,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Fine Cotton"
  },
  {
    "id": "prod-bill-119",
    "sku": "RJ-SUT-119",
    "barcode": "8901119",
    "name": "Netflix M-1 Trendy Casual Suit",
    "category": "kurtis",
    "price": 611,
    "mrp": 759,
    "purchaseCost": 407,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Trendy Casual"
  },
  {
    "id": "prod-bill-120",
    "sku": "RJ-SUT-120",
    "barcode": "8901120",
    "name": "Rajjo M-1 Boutique Style Suit",
    "category": "kurtis",
    "price": 551,
    "mrp": 689,
    "purchaseCost": 367,
    "stock": 8,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Boutique Style"
  },
  {
    "id": "prod-bill-121",
    "sku": "RJ-SUT-121",
    "barcode": "8901121",
    "name": "Riya M.L.T. Fancy Work Suit",
    "category": "kurtis",
    "price": 729,
    "mrp": 909,
    "purchaseCost": 486,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Fancy Work"
  },
  {
    "id": "prod-bill-122",
    "sku": "RJ-SUT-122",
    "barcode": "8901122",
    "name": "Billu M.L.T. Casual Chic Suit",
    "category": "kurtis",
    "price": 729,
    "mrp": 909,
    "purchaseCost": 486,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Chic Style"
  },
  {
    "id": "prod-bill-123",
    "sku": "RJ-SUT-123",
    "barcode": "8901123",
    "name": "Vikas 568 Embroidered Heavy Suit",
    "category": "kurtis",
    "price": 1838,
    "mrp": 2299,
    "purchaseCost": 1225,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Heavy Embroidery"
  },
  {
    "id": "prod-bill-124",
    "sku": "RJ-SUT-124",
    "barcode": "8901124",
    "name": "Vikas 570 Designer Party Suit",
    "category": "kurtis",
    "price": 1734,
    "mrp": 2169,
    "purchaseCost": 1156,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Party Wear"
  },
  {
    "id": "prod-bill-125",
    "sku": "RJ-SUT-125",
    "barcode": "8901125",
    "name": "Vikas 9358 Handwork Festive Suit",
    "category": "kurtis",
    "price": 1991,
    "mrp": 2489,
    "purchaseCost": 1327,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Handwork"
  },
  {
    "id": "prod-bill-126",
    "sku": "RJ-SUT-126",
    "barcode": "8901126",
    "name": "AK K-4139 Luxury Chanderi Suit",
    "category": "kurtis",
    "price": 2294,
    "mrp": 2869,
    "purchaseCost": 1529,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Chanderi"
  },
  {
    "id": "prod-bill-127",
    "sku": "RJ-SUT-127",
    "barcode": "8901127",
    "name": "AK K-4171 Regal Zari Party Suit",
    "category": "kurtis",
    "price": 2517,
    "mrp": 3149,
    "purchaseCost": 1678,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Regal Zari"
  },
  {
    "id": "prod-bill-128",
    "sku": "RJ-SUT-128",
    "barcode": "8901128",
    "name": "AK K-4172 Heavy Embroidered Suit",
    "category": "kurtis",
    "price": 2187,
    "mrp": 2729,
    "purchaseCost": 1458,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Heavy Embroidery"
  },
  {
    "id": "prod-bill-129",
    "sku": "RJ-SUT-129",
    "barcode": "8901129",
    "name": "AK K-4272 Royal Silk Suit",
    "category": "kurtis",
    "price": 2352,
    "mrp": 2939,
    "purchaseCost": 1568,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Royal Silk"
  },
  {
    "id": "prod-bill-130",
    "sku": "RJ-SUT-130",
    "barcode": "8901130",
    "name": "AK K-4273 Premium Organza Suit",
    "category": "kurtis",
    "price": 2466,
    "mrp": 3079,
    "purchaseCost": 1644,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Pure Organza"
  },
  {
    "id": "prod-bill-131",
    "sku": "RJ-SUT-131",
    "barcode": "8901131",
    "name": "AK K-4274 Heritage Festive Suit",
    "category": "kurtis",
    "price": 1964,
    "mrp": 2459,
    "purchaseCost": 1309,
    "stock": 4,
    "sizes": [
      "Unstitched (3 Pcs Set)"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Heritage"
  },
  {
    "id": "prod-bill-132",
    "sku": "RJ-LHG-132",
    "barcode": "8901132",
    "name": "LH Petty Cash Bridal Heavy Zari Lehenga",
    "category": "lehengas",
    "price": 5925,
    "mrp": 7409,
    "purchaseCost": 3950,
    "stock": 4,
    "sizes": [
      "Semi-Stitched"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Heavy Zari"
  },
  {
    "id": "prod-bill-133",
    "sku": "RJ-LHG-133",
    "barcode": "8901133",
    "name": "LH Vetro Inn Designer Party Lehenga",
    "category": "lehengas",
    "price": 4298,
    "mrp": 5369,
    "purchaseCost": 2865,
    "stock": 2,
    "sizes": [
      "Semi-Stitched"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Party Wear"
  },
  {
    "id": "prod-bill-134",
    "sku": "RJ-LHG-134",
    "barcode": "8901134",
    "name": "Royal Heritage Velvet Bridal Lehenga (Maroon)",
    "category": "lehengas",
    "price": 14250,
    "mrp": 17809,
    "purchaseCost": 9500,
    "stock": 3,
    "sizes": [
      "Semi-Stitched"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Bestseller"
  },
  {
    "id": "prod-bill-135",
    "sku": "RJ-LHG-135",
    "barcode": "8901135",
    "name": "Pastel Flora Mirror-Work Party Lehenga",
    "category": "lehengas",
    "price": 8700,
    "mrp": 10879,
    "purchaseCost": 5800,
    "stock": 5,
    "sizes": [
      "Semi-Stitched"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Mirror Work"
  },
  {
    "id": "prod-bill-136",
    "sku": "RJ-ACC-136",
    "barcode": "8901136",
    "name": "Designer Cut Blouse Piece (1 Metre)",
    "category": "jewellery",
    "price": 54,
    "mrp": 104,
    "purchaseCost": 36,
    "stock": 60,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Cut Piece"
  },
  {
    "id": "prod-bill-137",
    "sku": "RJ-ACC-137",
    "barcode": "8901137",
    "name": "Satin Silk Blouse Piece (1 Metre)",
    "category": "jewellery",
    "price": 75,
    "mrp": 125,
    "purchaseCost": 50,
    "stock": 30,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Satin Silk"
  },
  {
    "id": "prod-bill-138",
    "sku": "RJ-ACC-138",
    "barcode": "8901138",
    "name": "Magic Fancy Stretch Blouse Cut",
    "category": "jewellery",
    "price": 87,
    "mrp": 137,
    "purchaseCost": 58,
    "stock": 30,
    "sizes": [
      "Free Size Box"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Fancy Stretch"
  },
  {
    "id": "prod-bill-139",
    "sku": "RJ-ACC-139",
    "barcode": "8901139",
    "name": "Super Fine Cotton Blouse Piece",
    "category": "jewellery",
    "price": 87,
    "mrp": 137,
    "purchaseCost": 58,
    "stock": 30,
    "sizes": [
      "Free Size Box"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Pure Cotton"
  },
  {
    "id": "prod-bill-140",
    "sku": "RJ-ACC-140",
    "barcode": "8901140",
    "name": "Dampen Cotton Aster Lining (1m)",
    "category": "jewellery",
    "price": 173,
    "mrp": 223,
    "purchaseCost": 115,
    "stock": 10,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Lining / Aster"
  },
  {
    "id": "prod-bill-141",
    "sku": "RJ-ACC-141",
    "barcode": "8901141",
    "name": "Dampen Special Aster Lining (1m)",
    "category": "jewellery",
    "price": 173,
    "mrp": 223,
    "purchaseCost": 115,
    "stock": 10,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Lining / Aster"
  },
  {
    "id": "prod-bill-142",
    "sku": "RJ-ACC-142",
    "barcode": "8901142",
    "name": "Dampen Star Aster Lining (1m)",
    "category": "jewellery",
    "price": 173,
    "mrp": 223,
    "purchaseCost": 115,
    "stock": 10,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Lining / Aster"
  },
  {
    "id": "prod-bill-143",
    "sku": "RJ-ACC-143",
    "barcode": "8901143",
    "name": "Dampen Rubia Aster Fabric (1m)",
    "category": "jewellery",
    "price": 180,
    "mrp": 230,
    "purchaseCost": 120,
    "stock": 10,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Rubia Aster"
  },
  {
    "id": "prod-bill-144",
    "sku": "RJ-ACC-144",
    "barcode": "8901144",
    "name": "Dampen Heavy Aster Fabric (1m)",
    "category": "jewellery",
    "price": 188,
    "mrp": 239,
    "purchaseCost": 125,
    "stock": 10,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Heavy Aster"
  },
  {
    "id": "prod-bill-145",
    "sku": "RJ-ACC-145",
    "barcode": "8901145",
    "name": "Dampen Deluxe Soft Aster (1m)",
    "category": "jewellery",
    "price": 203,
    "mrp": 253,
    "purchaseCost": 135,
    "stock": 10,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Deluxe Aster"
  },
  {
    "id": "prod-bill-146",
    "sku": "RJ-ACC-146",
    "barcode": "8901146",
    "name": "Dampen 2x2 High Grade Aster (1m)",
    "category": "jewellery",
    "price": 210,
    "mrp": 260,
    "purchaseCost": 140,
    "stock": 10,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "2x2 Premium"
  },
  {
    "id": "prod-bill-147",
    "sku": "RJ-ACC-147",
    "barcode": "8901147",
    "name": "Saree Fall Arti Standard Cotton",
    "category": "jewellery",
    "price": 27,
    "mrp": 77,
    "purchaseCost": 18,
    "stock": 20,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Saree Fall"
  },
  {
    "id": "prod-bill-148",
    "sku": "RJ-ACC-148",
    "barcode": "8901148",
    "name": "Saree Fall Premier Soft Cotton",
    "category": "jewellery",
    "price": 33,
    "mrp": 83,
    "purchaseCost": 22,
    "stock": 20,
    "sizes": [
      "Standard Size"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Premier Fall"
  },
  {
    "id": "prod-bill-149",
    "sku": "RJ-ACC-149",
    "barcode": "8901149",
    "name": "Kundan & Green Meenakari Bridal Choker Set",
    "category": "jewellery",
    "price": 2400,
    "mrp": 2999,
    "purchaseCost": 1600,
    "stock": 5,
    "sizes": [
      "Free Size Box"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Bridal Set"
  },
  {
    "id": "prod-bill-150",
    "sku": "RJ-ACC-150",
    "barcode": "8901150",
    "name": "Antique Gold Temple Mathapatti & Earrings",
    "category": "jewellery",
    "price": 1125,
    "mrp": 1409,
    "purchaseCost": 750,
    "stock": 8,
    "sizes": [
      "Free Size Box"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Temple Jewellery"
  },
  {
    "id": "prod-bill-151",
    "sku": "RJ-FTW-151",
    "barcode": "8901151",
    "name": "Embroidered Mojari Jutti (Golden Zari)",
    "category": "footwear",
    "price": 675,
    "mrp": 839,
    "purchaseCost": 450,
    "stock": 10,
    "sizes": [
      "Size 36",
      "Size 37",
      "Size 38",
      "Size 39",
      "Size 40"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Handcrafted"
  },
  {
    "id": "prod-bill-152",
    "sku": "RJ-FTW-152",
    "barcode": "8901152",
    "name": "Bridal Block Heel Kolhapuri Sandal",
    "category": "footwear",
    "price": 975,
    "mrp": 1219,
    "purchaseCost": 650,
    "stock": 6,
    "sizes": [
      "Size 36",
      "Size 37",
      "Size 38",
      "Size 39",
      "Size 40"
    ],
    "colors": [
      "Maroon",
      "Red",
      "Pink",
      "Mustard Gold",
      "Peacock Blue"
    ],
    "badge": "Cushioned"
  },
  {
    "id": "prod-par-1",
    "sku": "SRV-HD-BR01",
    "barcode": "9901001",
    "name": "HD Bridal Airbrush Makeup & Hair Styling (Pre-Bridal Included)",
    "category": "parlour",
    "price": 8500,
    "mrp": 12000,
    "purchaseCost": 0,
    "stock": 999,
    "isService": true,
    "serviceDuration": "2.5 Hours",
    "sizes": [
      "Single Session"
    ],
    "badge": "Most Popular"
  },
  {
    "id": "prod-par-2",
    "sku": "SRV-PTY-MK02",
    "barcode": "9901002",
    "name": "Celebrity Party Makeup with Eye Lashes & Saree Draping",
    "category": "parlour",
    "price": 1800,
    "mrp": 2500,
    "purchaseCost": 0,
    "stock": 999,
    "isService": true,
    "serviceDuration": "60 Mins",
    "sizes": [
      "Single Session"
    ],
    "badge": "Parlour"
  },
  {
    "id": "prod-par-3",
    "sku": "SRV-SPA-HR03",
    "barcode": "9901003",
    "name": "L'Oreal Mythic Oil Hair Spa & Deep Conditioning",
    "category": "parlour",
    "price": 950,
    "mrp": 1400,
    "purchaseCost": 0,
    "stock": 999,
    "isService": true,
    "serviceDuration": "45 Mins",
    "sizes": [
      "Service Session"
    ],
    "badge": "Parlour"
  },
  {
    "id": "prod-par-4",
    "sku": "SRV-MHN-BD04",
    "barcode": "9901004",
    "name": "Full Hand Designer Bridal Mehendi (Organic Rajasthani Cone)",
    "category": "parlour",
    "price": 2500,
    "mrp": 3500,
    "purchaseCost": 0,
    "stock": 999,
    "isService": true,
    "serviceDuration": "3 Hours",
    "sizes": [
      "Service Session"
    ],
    "badge": "Parlour"
  },
  {
    "id": "prod-par-5",
    "sku": "SRV-WAX-RC05",
    "barcode": "9901005",
    "name": "Full Body Rica White Chocolate Waxing & Threading",
    "category": "parlour",
    "price": 1200,
    "mrp": 1600,
    "purchaseCost": 0,
    "stock": 999,
    "isService": true,
    "serviceDuration": "50 Mins",
    "sizes": [
      "Service Session"
    ],
    "badge": "Parlour"
  },
  {
    "id": "prod-par-6",
    "sku": "SRV-BLS-ST06",
    "barcode": "9901006",
    "name": "Designer Blouse Stitching (Padded / Princess Cut / Dori)",
    "category": "parlour",
    "price": 650,
    "mrp": 850,
    "purchaseCost": 0,
    "stock": 999,
    "isService": true,
    "serviceDuration": "Tailoring Delivery",
    "sizes": [
      "Standard Stitch"
    ],
    "badge": "Boutique Tailor"
  },
  {
    "id": "prod-par-7",
    "sku": "SRV-FL-PCO07",
    "barcode": "9901007",
    "name": "Saree Fall & Interlock Pico Finishing",
    "category": "parlour",
    "price": 120,
    "mrp": 150,
    "purchaseCost": 0,
    "stock": 999,
    "isService": true,
    "serviceDuration": "30 Mins",
    "sizes": [
      "Service"
    ],
    "badge": "Finishing"
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
