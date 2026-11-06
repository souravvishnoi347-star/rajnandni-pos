const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function migrateBlouses() {
  console.log("=== UPDATING BLOUSES CATEGORY (8901378 TO 8901399) ===");
  
  // 1. Fetch current records
  const { data: prods, error: fetchErr } = await supabase
    .from('products')
    .select('*')
    .gte('barcode', '8901378')
    .lte('barcode', '8901399')
    .order('barcode', { ascending: true });

  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }

  console.log(`Found ${prods.length} products to migrate to 'blouses' category.`);

  let totalPcs = 0;
  let totalCostVal = 0;
  let totalRetailVal = 0;

  for (const p of prods) {
    const updatedSizes = ["Free Size / Stretchable"];
    const { error: updErr } = await supabase
      .from('products')
      .update({
        category: 'blouses',
        sizes: updatedSizes,
        badge: 'New Blouse Arrival'
      })
      .eq('id', p.id);

    if (updErr) {
      console.error(`Failed to update barcode ${p.barcode}:`, updErr);
    } else {
      totalPcs += (p.stock || 0);
      totalCostVal += (p.purchase_cost || 0) * (p.stock || 0);
      totalRetailVal += (p.price || 0) * (p.stock || 0);
      console.log(`✓ ${p.barcode} | ${p.sku} | ${p.name.padEnd(24)} | Qty: ${p.stock} pcs | Cost: ₹${p.purchase_cost} | MRP: ₹${p.price}`);
    }
  }

  console.log("\n================ SUMMARY ================");
  console.log(`Total Blouse SKUs Migrated: ${prods.length}`);
  console.log(`Total Blouse Pieces in Stock: ${totalPcs} pcs`);
  console.log(`Total Wholesale Investment: ₹${totalCostVal.toLocaleString('en-IN')}`);
  console.log(`Total Retail Valuation: ₹${totalRetailVal.toLocaleString('en-IN')}`);
  console.log(`Projected Profit Margin: ₹${(totalRetailVal - totalCostVal).toLocaleString('en-IN')}`);
}

migrateBlouses();
