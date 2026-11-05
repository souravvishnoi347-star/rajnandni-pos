const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function checkBagsStock() {
  const { data: bags, error: bErr } = await supabase.from('products').select('*').eq('category', 'handbags').order('barcode', { ascending: true });
  if (bErr) throw bErr;
  
  const { data: bills, error: billErr } = await supabase.from('bills').select('*');
  if (billErr) throw billErr;
  
  const salesMap = {};
  bills.forEach(b => {
    (b.items || []).forEach(it => {
      const bc = String(it.barcode || '').trim();
      if (bc) salesMap[bc] = (salesMap[bc] || 0) + (Number(it.quantity) || 1);
    });
  });

  console.log('Total Handbags:', bags.length);
  const rows = [];
  bags.forEach(b => {
    const curStock = Number(b.stock) || 0;
    const sold = salesMap[b.barcode] || 0;
    const initialListed = curStock + sold;
    rows.push({
      barcode: b.barcode,
      sku: b.sku,
      name: b.name,
      initialListed,
      sold,
      curStock,
      mrp: b.mrp,
      price: b.price
    });
  });

  console.table(rows);
}

checkBagsStock();
