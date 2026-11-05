const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://mxlkiqhhnfzuwkzeilct.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4');

async function checkAllBags() {
  const { data: prods } = await s.from('products').select('*');
  const bagProds = prods.filter(p => 
    (p.category && p.category.toLowerCase().includes('bag')) ||
    (p.sku && p.sku.toUpperCase().includes('BAG')) ||
    (p.barcode && p.barcode.startsWith('8906'))
  );
  console.log('Total bag-related products:', bagProds.length);
  bagProds.forEach(p => {
    console.log(`SKU: ${p.sku.padEnd(12)} | Barcode: ${(p.barcode || '').padEnd(10)} | Cat: ${(p.category || '').padEnd(12)} | Stock: ${String(p.stock).padEnd(3)} | Name: "${p.name}"`);
  });
}
checkAllBags().catch(console.error);
