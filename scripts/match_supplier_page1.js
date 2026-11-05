const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://mxlkiqhhnfzuwkzeilct.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4');

const supplierPage1 = [
  { itemNo: 1, qty: 3, rate: 230, amount: 690 },
  { itemNo: 2, qty: 4, rate: 350, amount: 1400 },
  { itemNo: 3, qty: 3, rate: 290, amount: 870 },
  { itemNo: 4, qty: 3, rate: 260, amount: 780 },
  { itemNo: 5, qty: 2, rate: 290, amount: 580 },
  { itemNo: 6, qty: 5, rate: 310, amount: 1550 },
  { itemNo: 7, qty: 4, rate: 260, amount: 1040 },
  { itemNo: 8, qty: 4, rate: 230, amount: 920 },
  { itemNo: 9, qty: 4, rate: 220, amount: 880 },
  { itemNo: 10, qty: 4, rate: 240, amount: 960 },
  { itemNo: 11, qty: 2, rate: 280, amount: 560 },
  { itemNo: 12, qty: 2, rate: 220, amount: 440 }
];

async function matchSupplierPage1() {
  const { data: prods } = await s.from('products').select('*').eq('category', 'handbags');
  const { data: bills } = await s.from('bills').select('*');

  console.log('Total Handbags in DB:', prods.length);

  // Print all handbags sorted by SKU
  prods.sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));

  console.log('\n--- ALL HANDBAGS IN DATABASE (SKU, Name, Purchase Cost, Stock, Price) ---');
  prods.forEach(p => {
    console.log(`SKU: ${p.sku.padEnd(12)} | Barcode: ${(p.barcode || '').padEnd(10)} | Cost: ₹${String(p.purchase_cost).padEnd(4)} | Price: ₹${String(p.price).padEnd(5)} | Stock: ${String(p.stock).padEnd(2)} | Name: "${p.name}"`);
  });

  console.log('\n--- ATTEMPTING MATCH FOR SUPPLIER PAGE 1 ---');
  supplierPage1.forEach(sup => {
    console.log(`\nSupplier Item #${sup.itemNo}: Qty ${sup.qty} pcs @ ₹${sup.rate} = ₹${sup.amount}`);
    
    // Exact cost match
    const costMatches = prods.filter(p => Number(p.purchase_cost) === sup.rate);
    console.log(`  Matching products with purchase cost ₹${sup.rate}: (${costMatches.length} found)`);
    costMatches.forEach(m => {
      console.log(`    -> SKU: ${m.sku} | Barcode: ${m.barcode} | Stock: ${m.stock} | Selling Price: ₹${m.price} | Name: "${m.name}"`);
    });
  });
}

matchSupplierPage1().catch(console.error);
