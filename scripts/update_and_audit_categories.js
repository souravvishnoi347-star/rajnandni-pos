const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function runUpdate() {
  console.log('Fetching all products in handbags...');
  const { data: products, error } = await supabase.from('products').select('*').eq('category', 'handbags').order('barcode', { ascending: true });
  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Fetched ${products.length} products currently in handbags.`);

  const sareesBarcodes = new Set([
    '8906044', '8906045', '8906046', '8906047', '8906048', '8906049', '8906050',
    '8906051', '8906052', '8906053', '8906054', '8906055', '8906056', '8906057',
    '8906058', '8906059', '8906060', '8906061', '8906062', '8906063', '8906064',
    '8906065', '8906066', '8906067', '8906068', '8906069', '8906070', '8906071'
  ]);

  const specificCorrections = {
    '8906072': 'bangles',
    '8906073': 'footwear',
    '8906074': 'footwear',
    '8906075': 'footwear',
    '8906076': 'kurtis',
    '8906077': 'cosmetics'
  };

  const auditLog = [];
  const genuineHandbags = [];

  for (const p of products) {
    const bc = String(p.barcode || '').trim();
    let newCategory = null;
    let reason = '';

    if (sareesBarcodes.has(bc)) {
      newCategory = 'sarees';
      reason = 'Misfiled under handbags during POS barcode entry; moved to sarees';
    } else if (specificCorrections[bc]) {
      newCategory = specificCorrections[bc];
      reason = `Misfiled under handbags during POS barcode entry; moved to ${newCategory}`;
    } else {
      genuineHandbags.push(p);
    }

    if (newCategory) {
      console.log(`Updating ${bc} (${p.name}): ${p.category} -> ${newCategory}`);
      const { error: updErr } = await supabase
        .from('products')
        .update({ category: newCategory })
        .eq('id', p.id);

      if (updErr) {
        console.error(`Failed to update ${p.id}:`, updErr);
      } else {
        auditLog.push({
          productId: p.id,
          barcode: bc,
          name: p.name,
          oldCategory: p.category,
          newCategory: newCategory,
          price: p.price,
          reason: reason,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  console.log(`\nSuccessfully updated ${auditLog.length} products in database.`);
  console.log(`Genuine handbags remaining in handbags category: ${genuineHandbags.length}`);

  // Write audit log file
  const auditPath = path.join(__dirname, 'CATEGORY_CHANGE_AUDIT_LOG_2026-11-01.json');
  fs.writeFileSync(auditPath, JSON.stringify(auditLog, null, 2), 'utf8');
  console.log(`Saved audit log to ${auditPath}`);

  // Write genuine handbags list
  const handbagsListPath = path.join(__dirname, 'GENUINE_HANDBAGS_STOCK_LIST.json');
  fs.writeFileSync(handbagsListPath, JSON.stringify(genuineHandbags.map(h => ({
    barcode: h.barcode,
    name: h.name,
    price: h.price,
    selling_price: h.selling_price || h.price,
    stock: h.stock_quantity ?? 'N/A'
  })), null, 2), 'utf8');
  console.log(`Saved genuine handbags list to ${handbagsListPath}`);
}

runUpdate();
