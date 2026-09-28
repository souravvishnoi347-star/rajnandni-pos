const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://mxlkiqhhnfzuwkzeilct.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  console.log("Connecting to Supabase at:", SUPABASE_URL);

  // Extract products from sampleInventory.ts
  const filePath = path.join(__dirname, '../src/lib/sampleInventory.ts');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Match the INITIAL_PRODUCTS array JSON block
  const match = fileContent.match(/export const INITIAL_PRODUCTS: ProductItem\[\] = (\[[\s\S]*?\]);\s*export const STAFF_BEAUTICIANS/);
  if (!match) {
    console.error("Could not parse INITIAL_PRODUCTS from sampleInventory.ts");
    return;
  }

  const products = JSON.parse(match[1]);
  console.log(`Parsed ${products.length} products from sampleInventory.ts`);

  // Transform to Supabase schema columns
  const rows = products.map(p => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    category: p.category,
    price: p.price,
    mrp: p.mrp,
    purchase_cost: p.purchaseCost || 0,
    stock: p.stock || 0,
    sizes: p.sizes || [],
    colors: p.colors || [],
    badge: p.badge || null,
    is_service: p.isService || false,
    service_duration: p.serviceDuration || null,
    updated_at: new Date().toISOString()
  }));

  // Batch insert in chunks of 50
  const CHUNK_SIZE = 50;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    console.log(`Uploading chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} items)...`);
    const { data, error } = await supabase
      .from('products')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error("Supabase upsert error:", error);
      return;
    }
  }

  console.log(`\n SUCCESS! All ${rows.length} wholesale products successfully uploaded to Supabase!`);

  // Verify count
  const { count, error: countErr } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error("Count check error:", countErr);
  } else {
    console.log(`Total live products in Supabase 'products' table: ${count}`);
  }
}

seed().catch(console.error);
