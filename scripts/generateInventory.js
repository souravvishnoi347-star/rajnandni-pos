const fs = require('fs');
const path = require('path');

// Wholesale items parsed directly from the 19 bill photos:
const rawItems = [
  // --- 1. SURAT SILK & FANCY SAREES (Jawahar Lal Jagannath Prasad) ---
  { name: 'Dharti Stich Blouse Dola Silk Saree', cat: 'sarees', cost: 1429, stock: 4, badge: 'Stitched Blouse' },
  { name: 'Chintu Daily Floral Georgette Saree', cat: 'sarees', cost: 545, stock: 8, badge: 'Daily Wear' },
  { name: 'Mintu Printed Casual Soft Saree', cat: 'sarees', cost: 545, stock: 8, badge: 'Daily Wear' },
  { name: 'Tilak Dola Silk Zari Border Saree', cat: 'sarees', cost: 975, stock: 8, badge: 'Dola Silk' },
  { name: 'Patlu Sathin Designer Party Saree', cat: 'sarees', cost: 745, stock: 8, badge: 'Satin Silk' },
  { name: 'Nishant Stich Border Festive Saree', cat: 'sarees', cost: 925, stock: 8, badge: 'Stitched Border' },
  { name: 'Gemini Asharfi Matching Saree Set', cat: 'sarees', cost: 538, stock: 10, badge: 'Matching Set' },
  { name: 'Trends Print Asharfi Matching Set', cat: 'sarees', cost: 262, stock: 10, badge: 'Best Price' },
  { name: 'Bingo Silk K-73 Premium Surat Saree', cat: 'sarees', cost: 1355, stock: 10, badge: 'Surat Silk' },
  { name: 'Fastag Silk K-73 Surat Saree', cat: 'sarees', cost: 970, stock: 9, badge: 'Surat Silk' },
  { name: 'Kulcha Silk K-73 Surat Saree', cat: 'sarees', cost: 1130, stock: 5, badge: 'Surat Silk' },
  { name: 'Gold Coin Silk K-73 Surat Saree', cat: 'sarees', cost: 1465, stock: 4, badge: 'Zari Weave' },
  { name: 'Rubal Silk K-73 Rich Pallu Saree', cat: 'sarees', cost: 1580, stock: 15, badge: 'Bestseller' },
  { name: 'Digital Village K-245 Fancy Saree', cat: 'sarees', cost: 1259, stock: 2, badge: 'Digital Print' },
  { name: 'Laal K-108 Traditional Red Saree', cat: 'sarees', cost: 1085, stock: 6, badge: 'Pooja Special' },
  { name: 'Suhani K-108 Georgette Saree', cat: 'sarees', cost: 1085, stock: 4, badge: 'Soft Georgette' },
  { name: 'Vanshika K-139 Designer Saree', cat: 'sarees', cost: 1288, stock: 3, badge: 'Designer' },
  { name: 'Khat K-241 Traditional Weave Saree', cat: 'sarees', cost: 756, stock: 14, badge: 'Traditional' },
  { name: 'Murli K-241 Rich Silk Saree', cat: 'sarees', cost: 1490, stock: 5, badge: 'Rich Silk' },
  { name: 'Rittika Satin Gulshan Designer Saree', cat: 'sarees', cost: 1025, stock: 8, badge: 'Gulshan Satin' },
  { name: 'Dilnaaz Heavy Gulshan Saree', cat: 'sarees', cost: 1282, stock: 9, badge: 'Party Wear' },
  { name: 'Sakshi Satin Gulshan Saree', cat: 'sarees', cost: 879, stock: 5, badge: 'Satin Finish' },
  { name: 'Meena Siroski Work Gulshan Saree', cat: 'sarees', cost: 1182, stock: 10, badge: 'Siroshki Diamond' },
  { name: 'Sonakshi Satin Gulshan Saree', cat: 'sarees', cost: 1114, stock: 5, badge: 'Satin Finish' },
  { name: 'Chetan Hari 2575 Banarasi Weave Saree', cat: 'sarees', cost: 1534, stock: 3, badge: 'Banarasi Weave' },
  { name: 'Bengal Handloom Silk Anushri Saree', cat: 'sarees', cost: 650, stock: 6, badge: 'Handloom' },
  { name: 'Tana Bana Pure Cotton Saree', cat: 'sarees', cost: 661, stock: 12, badge: '100% Cotton' },
  { name: 'Tant Cotton Traditional Bengal Saree', cat: 'sarees', cost: 763, stock: 6, badge: 'Bengal Tant' },
  { name: 'Ragini K-69 Surat Designer Saree', cat: 'sarees', cost: 1238, stock: 8, badge: 'Surat Silk' },
  { name: 'Braso Queen K-69 Royal Brasso Saree', cat: 'sarees', cost: 1535, stock: 15, badge: 'Royal Brasso' },
  { name: 'Go Digit K-229 Surat Fancy Saree', cat: 'sarees', cost: 1176, stock: 5, badge: 'Surat Fancy' },
  { name: 'Digi Hub K-229 Surat Fancy Saree', cat: 'sarees', cost: 1288, stock: 5, badge: 'Surat Fancy' },
  { name: 'Mandira Waves K-69 Wave Pattern Saree', cat: 'sarees', cost: 1315, stock: 3, badge: 'Wave Pattern' },
  { name: 'Pineapple K-69 Fancy Weave Saree', cat: 'sarees', cost: 1029, stock: 11, badge: 'Fancy Weave' },
  { name: 'Cocktail K-69 Luxury Party Saree', cat: 'sarees', cost: 1975, stock: 1, badge: 'Exclusive' },
  { name: 'Miraz K-69 Satin Silk Saree', cat: 'sarees', cost: 1595, stock: 4, badge: 'Satin Silk' },
  { name: 'Shyama K-300 Everyday Surat Saree', cat: 'sarees', cost: 865, stock: 10, badge: 'Daily Wear' },
  { name: 'Rang Rasiya K-249 Festive Silk Saree', cat: 'sarees', cost: 1410, stock: 3, badge: 'Festive Silk' },
  { name: 'Trump K-293 Surat Saree', cat: 'sarees', cost: 980, stock: 5, badge: 'Surat Saree' },
  { name: 'Doll K-253 Chiffon Saree', cat: 'sarees', cost: 835, stock: 3, badge: 'Soft Chiffon' },
  { name: 'Mysore Silk K-249 Traditional Saree', cat: 'sarees', cost: 1410, stock: 2, badge: 'Mysore Silk' },
  { name: 'Flower K-293 Floral Surat Saree', cat: 'sarees', cost: 1210, stock: 4, badge: 'Floral Print' },
  { name: 'Vaari Hamza K-138 Royal Heavy Saree', cat: 'sarees', cost: 1675, stock: 4, badge: 'Royal Heavy' },
  { name: 'Gold Shazia K-138 Designer Saree', cat: 'sarees', cost: 1465, stock: 5, badge: 'Gold Zari' },
  { name: 'Gold Salim K-138 Embroidered Saree', cat: 'sarees', cost: 1612, stock: 5, badge: 'Embroidered' },
  { name: 'Maths K-138 Geometric Print Saree', cat: 'sarees', cost: 982, stock: 3, badge: 'Geometric' },
  { name: 'Gold Shahzada K-138 Premium Saree', cat: 'sarees', cost: 1465, stock: 5, badge: 'Premium Silk' },
  { name: 'Ceramic K-69 Printed Saree', cat: 'sarees', cost: 1315, stock: 2, badge: 'Printed Silk' },
  { name: 'Mandira K-69 Surat Border Saree', cat: 'sarees', cost: 1645, stock: 7, badge: 'Zari Border' },
  { name: 'Gunjesh K-228 Silk Saree', cat: 'sarees', cost: 1182, stock: 4, badge: 'Soft Silk' },
  { name: 'Digi Locker K-229 Silk Saree', cat: 'sarees', cost: 1064, stock: 5, badge: 'Designer' },
  { name: 'Daisy Flower K-69 Surat Saree', cat: 'sarees', cost: 1205, stock: 5, badge: 'Daisy Flower' },
  { name: 'Sanjana K-139 Designer Saree', cat: 'sarees', cost: 1158, stock: 3, badge: 'Designer Saree' },
  { name: 'Pepsi K-139 Surat Casual Saree', cat: 'sarees', cost: 1350, stock: 5, badge: 'Surat Silk' },
  { name: 'Heritage K-241 Traditional Saree', cat: 'sarees', cost: 985, stock: 4, badge: 'Heritage' },
  { name: 'Sufi K-241 Elegance Saree', cat: 'sarees', cost: 1155, stock: 4, badge: 'Elegance' },
  { name: 'Faluda Silk K-73 Heavy Pallu Saree', cat: 'sarees', cost: 1355, stock: 12, badge: 'Bestseller' },
  { name: 'Neha Silk K-73 Festive Saree', cat: 'sarees', cost: 1465, stock: 4, badge: 'Festive Silk' },
  { name: 'Paneri Silk K-73 Surat Saree', cat: 'sarees', cost: 1465, stock: 5, badge: 'Paneri Silk' },
  { name: 'Aaliya K-139 Boutique Silk Saree', cat: 'sarees', cost: 1237, stock: 9, badge: 'Boutique Silk' },
  { name: 'Rashmi K-139 Embroidered Saree', cat: 'sarees', cost: 1429, stock: 2, badge: 'Embroidered' },
  { name: 'Linen Silk K-179 Handloom Saree', cat: 'sarees', cost: 1281, stock: 3, badge: 'Linen Silk' },

  // --- 2. SADHVI DAILYWEAR PRINTS (Sadhvi Sarees Pvt Ltd) ---
  { name: 'Rabita Dailywear Printed Saree', cat: 'sarees', cost: 247, stock: 8, badge: 'Budget Friendly' },
  { name: 'Deepmala Elegant Printed Saree', cat: 'sarees', cost: 265, stock: 8, badge: 'Budget Friendly' },
  { name: 'Zonexa Modern Floral Print Saree', cat: 'sarees', cost: 290, stock: 8, badge: 'Floral Print' },
  { name: 'Scorpio Geometric Printed Saree', cat: 'sarees', cost: 290, stock: 8, badge: 'Geometric' },
  { name: 'Pulse Micro-Dot Print Saree', cat: 'sarees', cost: 290, stock: 8, badge: 'Daily Wear' },
  { name: 'Pushpika Blossom Print Saree', cat: 'sarees', cost: 315, stock: 8, badge: 'Flower Print' },
  { name: 'Ooty Cool Breeze Printed Saree', cat: 'sarees', cost: 330, stock: 8, badge: 'Cool Cotton' },
  { name: 'Anand Celebration Print Saree', cat: 'sarees', cost: 335, stock: 8, badge: 'Festive Print' },
  { name: 'Dev Guru Divine Temple Saree', cat: 'sarees', cost: 335, stock: 8, badge: 'Temple Border' },
  { name: 'Once Time Casual Saree', cat: 'sarees', cost: 340, stock: 8, badge: 'Casual Wear' },
  { name: 'Arpita Feather Soft Saree', cat: 'sarees', cost: 350, stock: 8, badge: 'Soft Chiffon' },
  { name: 'Zameendar Classic Border Saree', cat: 'sarees', cost: 355, stock: 8, badge: 'Classic Border' },
  { name: 'Junoon Vivid Print Saree', cat: 'sarees', cost: 365, stock: 8, badge: 'Vivid Print' },
  { name: 'Amelia Floral Print Saree', cat: 'sarees', cost: 365, stock: 8, badge: 'Floral' },
  { name: 'Dam Level Digital Print Saree', cat: 'sarees', cost: 370, stock: 8, badge: 'Digital Print' },
  { name: 'Pink App Designer Print Saree', cat: 'sarees', cost: 375, stock: 8, badge: 'Pink App' },
  { name: 'Rangeela Multicolor Leheriya Saree', cat: 'sarees', cost: 380, stock: 8, badge: 'Leheriya Print' },
  { name: 'Chunari Special Bandhani Saree', cat: 'sarees', cost: 380, stock: 8, badge: 'Bandhani' },
  { name: 'Chunari Festival Red Bandhani Saree', cat: 'sarees', cost: 390, stock: 8, badge: 'Pooja Special' },
  { name: 'Chunari Shine Foil Print Saree', cat: 'sarees', cost: 395, stock: 8, badge: 'Foil Print' },
  { name: 'Paridhan Traditional Ethnic Saree', cat: 'sarees', cost: 405, stock: 8, badge: 'Ethnic' },
  { name: 'Leela Heritage Silk Touch Saree', cat: 'sarees', cost: 410, stock: 8, badge: 'Silk Touch' },
  { name: 'Jemin Soft Crepe Printed Saree', cat: 'sarees', cost: 410, stock: 8, badge: 'Crepe' },
  { name: 'Surbhi Designer Print Saree', cat: 'sarees', cost: 415, stock: 8, badge: 'Designer Print' },
  { name: 'Shubh Labh Auspicious Puja Saree', cat: 'sarees', cost: 425, stock: 8, badge: 'Puja Special' },
  { name: 'Pranam Temple Border Saree', cat: 'sarees', cost: 430, stock: 8, badge: 'Temple Border' },
  { name: 'Mahotsav Festive Print Saree', cat: 'sarees', cost: 440, stock: 8, badge: 'Festive Print' },
  { name: 'Anuradha Fine Georgette Saree', cat: 'sarees', cost: 450, stock: 8, badge: 'Fine Georgette' },
  { name: 'Apsara Shimmer Border Saree', cat: 'sarees', cost: 460, stock: 8, badge: 'Shimmer Border' },
  { name: 'Shanaya Pastel Bloom Saree', cat: 'sarees', cost: 465, stock: 8, badge: 'Pastel Bloom' },
  { name: 'Tarang Wave Print Saree', cat: 'sarees', cost: 470, stock: 8, badge: 'Wave Print' },
  { name: 'Dhanlaxmi Shagun Festive Saree', cat: 'sarees', cost: 475, stock: 8, badge: 'Shagun Saree' },
  { name: 'Sitara Starlight Printed Saree', cat: 'sarees', cost: 485, stock: 8, badge: 'Starlight Print' },
  { name: 'Keshav Peacock Feather Saree', cat: 'sarees', cost: 490, stock: 8, badge: 'Peacock Motif' },
  { name: 'Donald Fancy Digital Print Saree', cat: 'sarees', cost: 510, stock: 8, badge: 'Fancy Print' },
  { name: 'Eco Brasso Partywear Sheer Saree', cat: 'sarees', cost: 525, stock: 8, badge: 'Eco Brasso' },
  { name: 'Aarohi Designer Touch Saree', cat: 'sarees', cost: 535, stock: 8, badge: 'Designer Touch' },
  { name: 'Creative Modern Art Saree', cat: 'sarees', cost: 540, stock: 8, badge: 'Modern Art' },
  { name: 'Mauli Brasso Red-Gold Festive Saree', cat: 'sarees', cost: 550, stock: 8, badge: 'Brasso Red-Gold' },
  { name: 'Melody Musical Print Saree', cat: 'sarees', cost: 560, stock: 8, badge: 'Melody Print' },
  { name: 'Brahm Putra Hand-feel Silk Saree', cat: 'sarees', cost: 575, stock: 8, badge: 'Hand Feel Silk' },
  { name: 'Disco Glitz Partywear Saree', cat: 'sarees', cost: 580, stock: 8, badge: 'Party Wear' },
  { name: 'Malai Soft Butter Touch Saree', cat: 'sarees', cost: 590, stock: 8, badge: 'Butter Touch' },
  { name: 'Aarvi Premium Boutique Print Saree', cat: 'sarees', cost: 610, stock: 8, badge: 'Boutique Print' },

  // --- 3. SUITS, KURTIS & DRESS MATERIALS ---
  { name: 'Parle-G Shivram Cotton Suit Pcs', cat: 'kurtis', cost: 190, stock: 4, badge: 'Pure Cotton' },
  { name: '7 Star Shivram Dailywear Suit Pcs', cat: 'kurtis', cost: 213, stock: 4, badge: 'Daily Wear' },
  { name: '5 Star Shivram Pure Cotton Suit', cat: 'kurtis', cost: 213, stock: 4, badge: 'Pure Cotton' },
  { name: 'Swift Dezire Shivram Summer Suit', cat: 'kurtis', cost: 190, stock: 4, badge: 'Summer Cool' },
  { name: 'Pan Bahar Shivram Festive Cotton Suit', cat: 'kurtis', cost: 235, stock: 4, badge: 'Festive Cotton' },
  { name: 'Pritika Aayushi Designer Suit Pcs', cat: 'kurtis', cost: 357, stock: 4, badge: 'Designer Suit' },
  { name: 'Laptop Aayushi Digital Print Suit', cat: 'kurtis', cost: 357, stock: 4, badge: 'Digital Print' },
  { name: 'Ghayal Aayushi Boutique Suit', cat: 'kurtis', cost: 420, stock: 4, badge: 'Boutique Suit' },
  { name: 'Arman Aayushi Casual Print Suit', cat: 'kurtis', cost: 436, stock: 4, badge: 'Casual Print' },
  { name: 'Cotton Savarna Jaipuri Printed Suit', cat: 'kurtis', cost: 358, stock: 4, badge: 'Jaipuri Print' },
  { name: 'BMW Savarna Heavy Gota Patti Suit', cat: 'kurtis', cost: 818, stock: 4, badge: 'Gota Patti' },
  { name: 'Kingfisher Satguru Fine Cotton Suit', cat: 'kurtis', cost: 430, stock: 4, badge: 'Fine Cotton' },
  { name: 'Netflix M-1 Trendy Casual Suit', cat: 'kurtis', cost: 407, stock: 4, badge: 'Trendy Casual' },
  { name: 'Rajjo M-1 Boutique Style Suit', cat: 'kurtis', cost: 367, stock: 8, badge: 'Boutique Style' },
  { name: 'Riya M.L.T. Fancy Work Suit', cat: 'kurtis', cost: 486, stock: 4, badge: 'Fancy Work' },
  { name: 'Billu M.L.T. Casual Chic Suit', cat: 'kurtis', cost: 486, stock: 4, badge: 'Chic Style' },
  { name: 'Vikas 568 Embroidered Heavy Suit', cat: 'kurtis', cost: 1225, stock: 4, badge: 'Heavy Embroidery' },
  { name: 'Vikas 570 Designer Party Suit', cat: 'kurtis', cost: 1156, stock: 4, badge: 'Party Wear' },
  { name: 'Vikas 9358 Handwork Festive Suit', cat: 'kurtis', cost: 1327, stock: 4, badge: 'Handwork' },
  { name: 'AK K-4139 Luxury Chanderi Suit', cat: 'kurtis', cost: 1529, stock: 4, badge: 'Chanderi' },
  { name: 'AK K-4171 Regal Zari Party Suit', cat: 'kurtis', cost: 1678, stock: 4, badge: 'Regal Zari' },
  { name: 'AK K-4172 Heavy Embroidered Suit', cat: 'kurtis', cost: 1458, stock: 4, badge: 'Heavy Embroidery' },
  { name: 'AK K-4272 Royal Silk Suit', cat: 'kurtis', cost: 1568, stock: 4, badge: 'Royal Silk' },
  { name: 'AK K-4273 Premium Organza Suit', cat: 'kurtis', cost: 1644, stock: 4, badge: 'Pure Organza' },
  { name: 'AK K-4274 Heritage Festive Suit', cat: 'kurtis', cost: 1309, stock: 4, badge: 'Heritage' },

  // --- 4. BRIDAL & PARTY LEHENGAS ---
  { name: 'LH Petty Cash Bridal Heavy Zari Lehenga', cat: 'lehengas', cost: 3950, stock: 4, badge: 'Heavy Zari' },
  { name: 'LH Vetro Inn Designer Party Lehenga', cat: 'lehengas', cost: 2865, stock: 2, badge: 'Party Wear' },
  { name: 'Royal Heritage Velvet Bridal Lehenga (Maroon)', cat: 'lehengas', cost: 9500, stock: 3, badge: 'Bestseller' },
  { name: 'Pastel Flora Mirror-Work Party Lehenga', cat: 'lehengas', cost: 5800, stock: 5, badge: 'Mirror Work' },

  // --- 5. BLOUSE PIECES, ASTERS & SAREE FALL ---
  { name: 'Designer Cut Blouse Piece (1 Metre)', cat: 'jewellery', cost: 36, stock: 60, badge: 'Cut Piece' },
  { name: 'Satin Silk Blouse Piece (1 Metre)', cat: 'jewellery', cost: 50, stock: 30, badge: 'Satin Silk' },
  { name: 'Magic Fancy Stretch Blouse Cut', cat: 'jewellery', cost: 58, stock: 30, badge: 'Fancy Stretch' },
  { name: 'Super Fine Cotton Blouse Piece', cat: 'jewellery', cost: 58, stock: 30, badge: 'Pure Cotton' },
  { name: 'Dampen Cotton Aster Lining (1m)', cat: 'jewellery', cost: 115, stock: 10, badge: 'Lining / Aster' },
  { name: 'Dampen Special Aster Lining (1m)', cat: 'jewellery', cost: 115, stock: 10, badge: 'Lining / Aster' },
  { name: 'Dampen Star Aster Lining (1m)', cat: 'jewellery', cost: 115, stock: 10, badge: 'Lining / Aster' },
  { name: 'Dampen Rubia Aster Fabric (1m)', cat: 'jewellery', cost: 120, stock: 10, badge: 'Rubia Aster' },
  { name: 'Dampen Heavy Aster Fabric (1m)', cat: 'jewellery', cost: 125, stock: 10, badge: 'Heavy Aster' },
  { name: 'Dampen Deluxe Soft Aster (1m)', cat: 'jewellery', cost: 135, stock: 10, badge: 'Deluxe Aster' },
  { name: 'Dampen 2x2 High Grade Aster (1m)', cat: 'jewellery', cost: 140, stock: 10, badge: '2x2 Premium' },
  { name: 'Saree Fall Arti Standard Cotton', cat: 'jewellery', cost: 18, stock: 20, badge: 'Saree Fall' },
  { name: 'Saree Fall Premier Soft Cotton', cat: 'jewellery', cost: 22, stock: 20, badge: 'Premier Fall' },

  // --- 6. BRIDAL JEWELLERY & ACCESSORIES ---
  { name: 'Kundan & Green Meenakari Bridal Choker Set', cat: 'jewellery', cost: 1600, stock: 5, badge: 'Bridal Set' },
  { name: 'Antique Gold Temple Mathapatti & Earrings', cat: 'jewellery', cost: 750, stock: 8, badge: 'Temple Jewellery' },

  // --- 7. FOOTWEAR ---
  { name: 'Embroidered Mojari Jutti (Golden Zari)', cat: 'footwear', cost: 450, stock: 10, badge: 'Handcrafted' },
  { name: 'Bridal Block Heel Kolhapuri Sandal', cat: 'footwear', cost: 650, stock: 6, badge: 'Cushioned' },
];

let barcodeCounter = 8901001;
let idCounter = 1;

const productItems = rawItems.map((item) => {
  const purchaseCost = item.cost;
  // Exact 50% markup formula mandated by user: Selling Price = Cost * 1.50
  const sellingPrice = Math.round(purchaseCost * 1.5);
  // MRP set to give customer perception of 20-30% discount or headroom for negotiation
  const mrp = Math.round(sellingPrice * 1.25 / 10) * 10 - 1; // e.g. 99 ending

  let sizes = ['Free Size (5.5m + Blouse)'];
  if (item.cat === 'kurtis') {
    sizes = ['Unstitched (3 Pcs Set)'];
  } else if (item.cat === 'lehengas') {
    sizes = ['Semi-Stitched'];
  } else if (item.cat === 'jewellery') {
    sizes = item.name.includes('Metre') || item.name.includes('Aster') || item.name.includes('Fall')
      ? ['Standard Size']
      : ['Free Size Box'];
  } else if (item.cat === 'footwear') {
    sizes = ['Size 36', 'Size 37', 'Size 38', 'Size 39', 'Size 40'];
  }

  const prefix = item.cat === 'sarees' ? 'SAR'
    : item.cat === 'kurtis' ? 'SUT'
    : item.cat === 'lehengas' ? 'LHG'
    : item.cat === 'jewellery' ? 'ACC'
    : 'FTW';

  const sku = `RJ-${prefix}-${String(idCounter).padStart(3, '0')}`;
  const barcode = String(barcodeCounter++);
  const id = `prod-bill-${idCounter++}`;

  return {
    id,
    sku,
    barcode,
    name: item.name,
    category: item.cat,
    price: sellingPrice,
    mrp: Math.max(mrp, sellingPrice + 50),
    purchaseCost,
    stock: item.stock,
    sizes,
    colors: ['Maroon', 'Red', 'Pink', 'Mustard Gold', 'Peacock Blue'],
    badge: item.badge
  };
});

// Parlour Services
const parlourServices = [
  {
    id: "prod-par-1",
    sku: "SRV-HD-BR01",
    barcode: "9901001",
    name: "HD Bridal Airbrush Makeup & Hair Styling (Pre-Bridal Included)",
    category: "parlour",
    price: 8500,
    mrp: 12000,
    purchaseCost: 0,
    stock: 999,
    isService: true,
    serviceDuration: "2.5 Hours",
    sizes: ["Single Session"],
    badge: "Most Popular"
  },
  {
    id: "prod-par-2",
    sku: "SRV-PTY-MK02",
    barcode: "9901002",
    name: "Celebrity Party Makeup with Eye Lashes & Saree Draping",
    category: "parlour",
    price: 1800,
    mrp: 2500,
    purchaseCost: 0,
    stock: 999,
    isService: true,
    serviceDuration: "60 Mins",
    sizes: ["Single Session"],
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
    name: "Full Hand Designer Bridal Mehendi (Organic Rajasthani Cone)",
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
  },
  {
    id: "prod-par-6",
    sku: "SRV-BLS-ST06",
    barcode: "9901006",
    name: "Designer Blouse Stitching (Padded / Princess Cut / Dori)",
    category: "parlour",
    price: 650,
    mrp: 850,
    purchaseCost: 0,
    stock: 999,
    isService: true,
    serviceDuration: "Tailoring Delivery",
    sizes: ["Standard Stitch"],
    badge: "Boutique Tailor"
  },
  {
    id: "prod-par-7",
    sku: "SRV-FL-PCO07",
    barcode: "9901007",
    name: "Saree Fall & Interlock Pico Finishing",
    category: "parlour",
    price: 120,
    mrp: 150,
    purchaseCost: 0,
    stock: 999,
    isService: true,
    serviceDuration: "30 Mins",
    sizes: ["Service"],
    badge: "Finishing"
  }
];

const allProducts = [...productItems, ...parlourServices];

const fileContent = `import { ProductItem } from "@/types/pos";

/**
 * RAJNANDINI BOUTIQUE & PARLOUR (Arya Nagar / Rajeev Nagar, Haridwar)
 * Real Wholesale Inventory parsed directly from Supplier Purchase Bills:
 * - Jawahar Lal Jagannath Prasad (Kanpur)
 * - Sadhvi Sarees Pvt. Ltd. (Kanpur)
 * - J.J. Sarees Pvt. Ltd.
 *
 * Formula Mandate:
 * Selling Price = Wholesale Cost + 50% Margin (Cost * 1.50)
 * MRP = Rounded Price with headroom for customer negotiation & festival discounts.
 */
export const INITIAL_PRODUCTS: ProductItem[] = ${JSON.stringify(allProducts, null, 2)};

export const STAFF_BEAUTICIANS = [
  "Rajnandini (Owner & Chief Artist)",
  "Pooja (Senior Beautician)",
  "Seema (Hair & Draping Specialist)",
  "Kavita (Mehendi Artist)"
];

export const TAILOR_NAMES = [
  "Master Aslam (Senior Tailor)",
  "Ramesh Ji (Fitting & Alteration)",
  "In-House Boutique Master"
];
`;

const targetPath = path.resolve('src/lib/sampleInventory.ts');
fs.writeFileSync(targetPath, fileContent, 'utf-8');
console.log('Successfully written', allProducts.length, 'products to', targetPath);
