const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://mxlkiqhhnfzuwkzeilct.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4');

async function checkSlingBags() {
  const { data: prods } = await s.from('products').select('*');
  const matched = prods.filter(p => 
    (p.name && (p.name.toLowerCase().includes('sling') || p.name.toLowerCase().includes('designer') || p.name.toLowerCase().includes('19')))
  );

  console.log('Products matching sling/designer/19:');
  matched.forEach(p => {
    console.log(`ID: ${p.id.padEnd(20)} | SKU: ${p.sku.padEnd(12)} | Barcode: ${(p.barcode || '').padEnd(10)} | Price: Rs ${String(p.price).padEnd(5)} | Cost: Rs ${String(p.purchase_cost).padEnd(4)} | Name: "${p.name}"`);
  });
}
checkSlingBags().catch(console.error);
