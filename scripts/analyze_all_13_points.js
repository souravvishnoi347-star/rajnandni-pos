const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://mxlkiqhhnfzuwkzeilct.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4');

async function analyzeAll13Points() {
  const { data: prods } = await s.from('products').select('*');
  const { data: bills } = await s.from('bills').select('*');

  console.log('=== DEEP ANALYSIS OF USER 13 POINTS ===\n');

  function findBy(filterFn) {
    return prods.filter(filterFn);
  }

  function getSales(p) {
    const list = [];
    bills.forEach(b => {
      (b.items || []).forEach(it => {
        if (it.id === p.id || (it.sku && it.sku.toUpperCase() === p.sku?.toUpperCase()) || (it.barcode && it.barcode === p.barcode && it.barcode !== '8901001') || (it.name && it.name.toLowerCase().trim() === p.name?.toLowerCase().trim())) {
          list.push({ bill: b.invoice_number, date: b.created_at, qty: it.quantity, price: it.price, customer: b.customer_name });
        }
      });
    });
    return list;
  }

  // Point 1: 03 -short hand bag
  console.log('--- POINT 1: 03 -short hand bag ---');
  console.log('User says: 4 pcs in store. Barcode 8906024 on 3 pcs, 8906025 on 1 pc.');
  const p1_a = findBy(p => p.barcode === '8906024');
  const p1_b = findBy(p => p.barcode === '8906025');
  console.log('DB for 8906024:', p1_a.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));
  console.log('DB for 8906025:', p1_b.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 2: 19- Designer purse (8906014) vs 19-hudda bag
  console.log('\n--- POINT 2: 19- Designer purse vs 19-hudda bag (8906014) ---');
  console.log('User says: On physical bag name is "19- Designer purse" & barcode 8906014, but sheet shows "19-hudda bag".');
  const p2 = findBy(p => p.barcode === '8906014' || (p.name && p.name.toLowerCase().includes('hudda')));
  console.log('DB for 8906014 / hudda:', p2.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));
  const p2_purse = findBy(p => p.name && p.name.toLowerCase().includes('designer purse'));
  console.log('DB for designer purse:', p2_purse.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 3: 19 – Designer bag 2
  console.log('\n--- POINT 3: 19 – Designer bag 2 ---');
  console.log('User says: In stock 2 units physically, but sheet showed 2 sold.');
  const p3 = findBy(p => p.name && (p.name.toLowerCase().includes('designer') || p.name.toLowerCase().includes('19')));
  console.log('DB items with designer / 19:', p3.filter(p => p.category === 'handbags').map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 4: 06- Shoulder bag (8906001) on 2 bags: 06-Shoulder bag & 17- Shoulder bag
  console.log('\n--- POINT 4: 06- Shoulder bag vs 17- Shoulder bag (8906001) ---');
  console.log('User says: Barcode 8906001 is physically stuck on both "06-Shoulder bag" and "17- Shoulder bag".');
  const p4_a = findBy(p => p.barcode === '8906001');
  const p4_b = findBy(p => p.name && p.name.toLowerCase().includes('17-') || (p.name && p.name.toLowerCase().includes('17 shoulder')));
  console.log('DB for barcode 8906001:', p4_a.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));
  console.log('DB for "17 shoulder":', p4_b.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));
  const allBagsNamedShoulder = findBy(p => p.category === 'handbags' && p.name && p.name.toLowerCase().includes('shoulder'));
  console.log('All shoulder bags in handbags:', allBagsNamedShoulder.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock })));

  // Point 5: 25-Shoulder bag / 20- Shoulder bag
  console.log('\n--- POINT 5: 25-Shoulder bag / 20- Shoulder bag ---');
  console.log('User says: Same duplicate barcode sticker problem on 25-Shoulder and 20-Shoulder.');
  const p5_25 = findBy(p => p.name && p.name.toLowerCase().includes('25'));
  const p5_20 = findBy(p => p.name && p.name.toLowerCase().includes('20'));
  console.log('DB for 25 bags:', p5_25.filter(p => p.category === 'handbags').map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock })));
  console.log('DB for 20 bags:', p5_20.filter(p => p.category === 'handbags').map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock })));

  // Point 6: 23 New clutch
  console.log('\n--- POINT 6: 23 New clutch ---');
  console.log('User says: 4 units physically in store, but sheet showed 2 sold.');
  const p6 = findBy(p => p.name && p.name.toLowerCase().includes('clutch'));
  console.log('DB for clutch in handbags:', p6.filter(p => p.category === 'handbags').map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 7: Hobo party (8906018)
  console.log('\n--- POINT 7: Hobo party (8906018) ---');
  console.log('User says: Stock in sheet 4, physical only 1 (3 missing).');
  const p7 = findBy(p => p.barcode === '8906018');
  console.log('DB for 8906018:', p7.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 8: 21 hobo party (8906036)
  console.log('\n--- POINT 8: 21 hobo party (8906036) ---');
  console.log('User says: Stock in sheet 4, physical only 1 (3 missing).');
  const p8 = findBy(p => p.barcode === '8906036');
  console.log('DB for 8906036:', p8.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 9: 19 sling bag (8906009)
  console.log('\n--- POINT 9: 19 sling bag (8906009) ---');
  console.log('User says: Stock in sheet 2, physical only 1.');
  const p9 = findBy(p => p.barcode === '8906009');
  console.log('DB for 8906009:', p9.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 10: 19 slider bag 3 (8906007)
  console.log('\n--- POINT 10: 19 slider bag 3 (8906007) ---');
  console.log('User says: Stock in sheet 2, physical only 1.');
  const p10 = findBy(p => p.barcode === '8906007');
  console.log('DB for 8906007:', p10.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 11: 22 shoulder bag (8906026)
  console.log('\n--- POINT 11: 22 shoulder bag (8906026) ---');
  console.log('User says: Missing all 5 pieces.');
  const p11 = findBy(p => p.barcode === '8906026');
  console.log('DB for 8906026:', p11.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 12: 21 sling bag (8906034)
  console.log('\n--- POINT 12: 21 sling bag (8906034) ---');
  console.log('User says: Physically only 1 piece, but sheet showed 4 pieces.');
  const p12 = findBy(p => p.barcode === '8906034');
  console.log('DB for 8906034:', p12.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));

  // Point 13: 21 sling bag (8906037)
  console.log('\n--- POINT 13: 21 sling bag (8906037) ---');
  console.log('User says: Physically only 1 piece, but sheet showed 2 pieces.');
  const p13 = findBy(p => p.barcode === '8906037');
  console.log('DB for 8906037:', p13.map(p => ({ sku: p.sku, name: p.name, barcode: p.barcode, stock: p.stock, sales: getSales(p) })));
}

analyzeAll13Points().catch(console.error);
