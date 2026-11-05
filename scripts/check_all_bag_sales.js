const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://mxlkiqhhnfzuwkzeilct.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4');

async function checkAllBagSales() {
  const { data: bills } = await s.from('bills').select('*').order('created_at', { ascending: true });
  const { data: prods } = await s.from('products').select('*');

  const bagSkus = new Set(prods.filter(p => (p.category || '').toLowerCase() === 'handbags').map(p => (p.sku || '').toUpperCase()));
  const bagIds = new Set(prods.filter(p => (p.category || '').toLowerCase() === 'handbags').map(p => p.id));

  console.log('--- ALL BAG SALES FROM BILLS ---');
  let count = 0;
  bills.forEach(b => {
    (b.items || []).forEach(it => {
      const isBagSku = it.sku && bagSkus.has(it.sku.toUpperCase().trim());
      const isBagId = it.id && bagIds.has(it.id);
      const isBagName = it.name && (it.name.toLowerCase().includes('bag') || it.name.toLowerCase().includes('purse') || it.name.toLowerCase().includes('clutch') || it.name.toLowerCase().includes('hobo'));

      if (isBagSku || isBagId || isBagName) {
        count++;
        console.log(`Bill: ${b.invoice_number.padEnd(14)} | Date: ${b.created_at.slice(0, 16)} | Item: "${it.name}" | SKU: ${it.sku || '-'} | Barcode: ${it.barcode || '-'} | Qty: ${it.quantity} | Rate: Rs ${it.price} | Cust: ${b.customer_name || 'Walk-in'} (${b.customer_phone || 'NA'})`);
      }
    });
  });
  console.log(`Total bag sales found in bills: ${count}`);
}
checkAllBagSales().catch(console.error);
