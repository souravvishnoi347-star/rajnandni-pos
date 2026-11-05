const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://mxlkiqhhnfzuwkzeilct.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4');

async function inspectItems() {
  const { data: prods, error: pErr } = await s.from('products').select('*');
  const { data: bills, error: bErr } = await s.from('bills').select('*');

  if (pErr || bErr) {
    console.error('Error fetching data:', pErr || bErr);
    return;
  }

  const handbags = prods.filter(p => (p.category || '').toLowerCase() === 'handbags');
  console.log('Total products:', prods.length, 'Total handbags:', handbags.length, 'Total bills:', bills.length);

  function getSales(p) {
    const sales = [];
    bills.forEach(b => {
      (b.items || []).forEach(it => {
        const idMatch = it.id && it.id === p.id;
        const skuMatch = it.sku && p.sku && it.sku.toUpperCase().trim() === p.sku.toUpperCase().trim();
        const barcodeMatch = it.barcode && p.barcode && it.barcode.trim() === p.barcode.trim() && it.barcode !== '8901001';
        const nameMatch = it.name && p.name && it.name.toLowerCase().trim() === p.name.toLowerCase().trim();

        if (idMatch || skuMatch || barcodeMatch || nameMatch) {
          sales.push({
            bill: b.invoice_number,
            date: b.created_at,
            qty: Number(it.quantity) || 1,
            price: it.price,
            customer: b.customer_name,
            phone: b.customer_phone,
            payMode: b.payment_mode
          });
        }
      });
    });
    return sales;
  }

  // Also check all barcodes in handbags to see if any barcode exists on multiple products!
  const barcodeMap = new Map();
  handbags.forEach(h => {
    const b = (h.barcode || '').trim();
    if (!barcodeMap.has(b)) barcodeMap.set(b, []);
    barcodeMap.get(b).push(h);
  });

  console.log('\n=============================================');
  console.log('--- CHECKING DUPLICATE BARCODES IN HANDBAGS ---');
  console.log('=============================================');
  for (const [code, items] of barcodeMap.entries()) {
    if (items.length > 1 && code) {
      console.log(`\nDuplicate barcode: ${code}`);
      items.forEach(it => console.log(`  -> ID: ${it.id} | SKU: ${it.sku} | Name: "${it.name}" | Stock: ${it.stock}`));
    }
  }

  // Now check the 13 points specifically:
  console.log('\n=============================================');
  console.log('--- CHECKING THE 13 USER POINTS IN DETAIL ---');
  console.log('=============================================');

  const checkList = [
    { pt: 1, desc: '03 -short hand bag (8906024 & 8906025)', barcodes: ['8906024', '8906025'], names: ['03', 'short hand'] },
    { pt: 2, desc: '19- Designer purse vs 19-hudda bag (8906014)', barcodes: ['8906014'], names: ['designer purse', 'hudda'] },
    { pt: 3, desc: '19 – Designer bag 2 (stock in DB vs 2 sold)', barcodes: [], names: ['designer bag 2', 'designer bag'] },
    { pt: 4, desc: '06- Shoulder bag vs 17- Shoulder bag (8906001)', barcodes: ['8906001'], names: ['06- shoulder', '17- shoulder'] },
    { pt: 5, desc: '25-Shoulder bag vs 20- Shoulder bag', barcodes: [], names: ['25-shoulder', '20-shoulder'] },
    { pt: 6, desc: '23 New clutch (4 physically vs 2 sold)', barcodes: [], names: ['23 new clutch', 'new clutch'] },
    { pt: 7, desc: 'Hobo party (8906018 - stock in sheet 4 vs 1 physical)', barcodes: ['8906018'], names: ['hobo party'] },
    { pt: 8, desc: '21 hobo party (8906036 - stock 4 vs 1 physical)', barcodes: ['8906036'], names: ['8906036', '21 hobo'] },
    { pt: 9, desc: '19 sling bag (8906009 - stock 2 vs 1 physical)', barcodes: ['8906009'], names: ['19 sling'] },
    { pt: 10, desc: '19 slider bag 3 (8906007 - stock 2 vs 1 physical)', barcodes: ['8906007'], names: ['8906007', 'slider bag'] },
    { pt: 11, desc: '22 shoulder bag (8906026 - missing all 5)', barcodes: ['8906026'], names: ['22 shoulder'] },
    { pt: 12, desc: '21 sling bag (8906034 - stock 4 vs 1 physical)', barcodes: ['8906034'], names: ['8906034'] },
    { pt: 13, desc: '21 sling bag (8906037 - stock 2 vs 1 physical)', barcodes: ['8906037'], names: ['8906037'] }
  ];

  for (const item of checkList) {
    console.log(`\n>>> POINT ${item.pt}: ${item.desc}`);
    // find in all products (or handbags)
    const matches = prods.filter(p => {
      const bMatch = item.barcodes.some(b => p.barcode && p.barcode.trim() === b);
      const nMatch = item.names.some(n => p.name && p.name.toLowerCase().includes(n.toLowerCase()));
      return bMatch || nMatch;
    });

    if (matches.length === 0) {
      console.log('  No matching product found in products table!');
    } else {
      matches.forEach(m => {
        const sales = getSales(m);
        const soldQty = sales.reduce((acc, c) => acc + c.qty, 0);
        console.log(`  Product: [${m.sku}] "${m.name}" | Barcode: ${m.barcode} | Cat: ${m.category} | Current DB Stock: ${m.stock} | Total Sold: ${soldQty} pcs in ${sales.length} bills`);
        if (sales.length > 0) {
          sales.forEach(s => {
            console.log(`    -> Bill: ${s.bill} | Date: ${s.date} | Qty: ${s.qty} | Price: Rs ${s.price} | Cust: ${s.customer} (${s.phone}) | Mode: ${s.payMode}`);
          });
        }
      });
    }
  }
}

inspectItems().catch(console.error);
