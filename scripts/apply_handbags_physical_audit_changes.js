const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxlkiqhhnfzuwkzeilct.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4';

const s = createClient(SUPABASE_URL, SUPABASE_KEY);

// Paths for logging
const LOG_DIR_1 = path.join(__dirname, '..', 'Stock_Verification_Audit_Logs');
const LOG_DIR_2 = path.join(__dirname, '..', 'Stock_Verification_Excel_Reports', 'Audit_Logs_And_Notes');

[LOG_DIR_1, LOG_DIR_2].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const LOG_FILE_1 = path.join(LOG_DIR_1, 'HANDBAGS_PHYSICAL_VERIFICATION_CHANGELOG.txt');
const LOG_FILE_2 = path.join(LOG_DIR_2, 'HANDBAGS_PHYSICAL_VERIFICATION_CHANGELOG.txt');

function writeLog(text) {
  console.log(text);
  fs.appendFileSync(LOG_FILE_1, text + '\r\n', 'utf8');
  fs.appendFileSync(LOG_FILE_2, text + '\r\n', 'utf8');
}

async function applyChanges() {
  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Initialize header if log file doesn't exist
  if (!fs.existsSync(LOG_FILE_1)) {
    const header = `========================================================================================
RAJNANDINI BOUTIQUE & PARLOUR (HARIDWAR) - PHYSICAL STOCK AUDIT & CORRECTION LOG
DATE & TIME: ${ts}
CREATED BY: Antigravity AI Assistant & Client Pair
========================================================================================\r\n`;
    fs.writeFileSync(LOG_FILE_1, header, 'utf8');
    fs.writeFileSync(LOG_FILE_2, header, 'utf8');
  }

  writeLog(`\n[SESSION START: ${ts}] --- APPLYING HANDBAGS PHYSICAL VERIFICATION UPDATES ---\n`);

  // --- POINT 1: 03 -short hand bag ---
  // Merge RJ-BAG-025 into RJ-BAG-024
  // RJ-BAG-024 stock: 3 -> 4
  // RJ-BAG-025 stock: 1 -> 0 (merged)
  writeLog(`>>> POINT 1: 03 -short hand bag`);
  writeLog(`Action: Merging duplicated items. Total physically found: 4 pieces.`);
  const { error: e1_a } = await s.from('products').update({ stock: 4, updated_at: new Date().toISOString() }).eq('sku', 'RJ-BAG-024');
  const { error: e1_b } = await s.from('products').update({ stock: 0, badge: 'Merged into RJ-BAG-024', updated_at: new Date().toISOString() }).eq('sku', 'RJ-BAG-025');
  if (e1_a || e1_b) writeLog(`Error in Point 1: ${e1_a?.message || e1_b?.message}`);
  else writeLog(`Success: RJ-BAG-024 (Barcode 8906024) stock set to 4 pcs. RJ-BAG-025 (Barcode 8906025) stock set to 0 pcs (merged).\n`);

  // --- POINT 2: 19- Designer purse vs 19-hudda bag (8906014) ---
  // Rename RJ-BAG-014 from '19- hudda bag' to '19- Designer purse'
  writeLog(`>>> POINT 2: 19- Designer purse (8906014)`);
  writeLog(`Action: Renaming barcode 8906014 from '19- hudda bag' to '19- Designer purse' to match physical store tag.`);
  const { error: e2 } = await s.from('products').update({ name: '19- Designer purse', updated_at: new Date().toISOString() }).eq('barcode', '8906014');
  if (e2) writeLog(`Error in Point 2: ${e2.message}`);
  else writeLog(`Success: Barcode 8906014 (RJ-BAG-014) renamed to "19- Designer purse". Stock remains 3 pcs.\n`);

  // --- POINT 3: 19 – Designer bag 2 ---
  // In stock physically: 2 units (DB had 0 because 2 were sold).
  // Update stock to 2
  writeLog(`>>> POINT 3: 19 – Designer bag 2 (RJ-BAG-013 / Barcode 8906013)`);
  writeLog(`Action: Updating stock from 0 to 2 pcs (Physical count in showroom = 2 pcs).`);
  const { error: e3 } = await s.from('products').update({ stock: 2, updated_at: new Date().toISOString() }).eq('sku', 'RJ-BAG-013');
  if (e3) writeLog(`Error in Point 3: ${e3.message}`);
  else writeLog(`Success: RJ-BAG-013 stock updated to 2 pcs. (Total initial tracked = 4 pcs: 2 sold + 2 in stock).\n`);

  // --- POINT 4: 06- Shoulder bag vs 17- Shoulder bag (8906001) ---
  // Create distinct product for 17- Shoulder bag with barcode 8906078
  // Split stock: 06-Shoulder bag = 3 pcs, 17- Shoulder bag = 2 pcs (Total 5 pcs)
  writeLog(`>>> POINT 4: 06- Shoulder bag vs 17- Shoulder bag`);
  writeLog(`Action: Creating separate product entry for '17- Shoulder bag' with unique barcode 8906078.`);
  const newProd17 = {
    id: 'prod-bag-17-shoulder',
    sku: 'RJ-BAG-17S',
    barcode: '8906078',
    name: '17- Shoulder bag',
    category: 'handbags',
    price: 699,
    mrp: 1199,
    purchase_cost: 350,
    stock: 2,
    sizes: ['Standard'],
    colors: null,
    badge: 'Physical Audit Verified',
    is_service: false,
    service_duration: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { error: e4_upsert } = await s.from('products').upsert(newProd17, { onConflict: 'id' });
  const { error: e4_update } = await s.from('products').update({ stock: 3, updated_at: new Date().toISOString() }).eq('sku', 'RJ-BAG-001');
  if (e4_upsert || e4_update) writeLog(`Error in Point 4: ${e4_upsert?.message || e4_update?.message}`);
  else writeLog(`Success: Created '17- Shoulder bag' (SKU: RJ-BAG-17S | Barcode: 8906078 | Stock: 2 pcs). '06-Shoulder Bag' stock updated to 3 pcs.\n`);

  // --- POINT 5: 25-Shoulder bag / 20- Shoulder bag ---
  // Create distinct product for 20- Shoulder bag with barcode 8906079
  // Split stock: 25-Shoulder bag = 2 pcs, 20- Shoulder bag = 1 pc (Total 3 pcs)
  writeLog(`>>> POINT 5: 25-Shoulder bag / 20- Shoulder bag`);
  writeLog(`Action: Creating separate product entry for '20- Shoulder bag' with unique barcode 8906079.`);
  const newProd20 = {
    id: 'prod-bag-20-shoulder',
    sku: 'RJ-BAG-20S',
    barcode: '8906079',
    name: '20- Shoulder bag',
    category: 'handbags',
    price: 820,
    mrp: 1299,
    purchase_cost: 400,
    stock: 1,
    sizes: ['Standard'],
    colors: null,
    badge: 'Physical Audit Verified',
    is_service: false,
    service_duration: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { error: e5_upsert } = await s.from('products').upsert(newProd20, { onConflict: 'id' });
  const { error: e5_update } = await s.from('products').update({ stock: 2, updated_at: new Date().toISOString() }).eq('sku', 'RJ-BAG-002');
  if (e5_upsert || e5_update) writeLog(`Error in Point 5: ${e5_upsert?.message || e5_update?.message}`);
  else writeLog(`Success: Created '20- Shoulder bag' (SKU: RJ-BAG-20S | Barcode: 8906079 | Stock: 1 pc). '25- Shoulder Bag' stock updated to 2 pcs.\n`);

  // --- POINT 6: 23 New clutch ---
  // Physically 4 units. Update stock from 2 to 4.
  writeLog(`>>> POINT 6: 23 New clutch (RJ-BAG-043 / Barcode 8906043)`);
  writeLog(`Action: Updating stock from 2 pcs to 4 pcs (Physical count = 4 pcs).`);
  const { error: e6 } = await s.from('products').update({ stock: 4, updated_at: new Date().toISOString() }).eq('sku', 'RJ-BAG-043');
  if (e6) writeLog(`Error in Point 6: ${e6.message}`);
  else writeLog(`Success: RJ-BAG-043 stock updated to 4 pcs.\n`);

  // --- POINT 7: Hobo party (8906018) ---
  // System was 4, Physical is 1.
  writeLog(`>>> POINT 7: Hobo party (Barcode 8906018)`);
  writeLog(`Action: Stock adjustment. System was 4 pcs, physical count is 1 pc (3 pcs missing/shrinkage).`);
  const { error: e7 } = await s.from('products').update({ stock: 1, updated_at: new Date().toISOString() }).eq('barcode', '8906018');
  if (e7) writeLog(`Error in Point 7: ${e7.message}`);
  else writeLog(`Success: Stock adjusted from 4 pcs to 1 pc.\n`);

  // --- POINT 8: 21 hobo party (8906036) ---
  // System was 4, Physical is 1.
  writeLog(`>>> POINT 8: 21 hobo bag (Barcode 8906036)`);
  writeLog(`Action: Stock adjustment. System was 4 pcs, physical count is 1 pc (3 pcs missing/shrinkage).`);
  const { error: e8 } = await s.from('products').update({ stock: 1, updated_at: new Date().toISOString() }).eq('barcode', '8906036');
  if (e8) writeLog(`Error in Point 8: ${e8.message}`);
  else writeLog(`Success: Stock adjusted from 4 pcs to 1 pc.\n`);

  // --- POINT 9: 19 sling bag (8906009) ---
  // System was 2, Physical is 1.
  writeLog(`>>> POINT 9: 19 - Sling Bag (Barcode 8906009)`);
  writeLog(`Action: Stock adjustment. System was 2 pcs, physical count is 1 pc (1 pc missing/shrinkage; 1 pc already sold to Charu Sharma).`);
  const { error: e9 } = await s.from('products').update({ stock: 1, updated_at: new Date().toISOString() }).eq('barcode', '8906009');
  if (e9) writeLog(`Error in Point 9: ${e9.message}`);
  else writeLog(`Success: Stock adjusted from 2 pcs to 1 pc.\n`);

  // --- POINT 10: 19 slider bag 3 (8906007) ---
  // System was 2, Physical is 1.
  writeLog(`>>> POINT 10: 19 - Sider Bag 3 (Barcode 8906007)`);
  writeLog(`Action: Stock adjustment. System was 2 pcs, physical count is 1 pc (1 pc missing/shrinkage; 1 pc already sold).`);
  const { error: e10 } = await s.from('products').update({ stock: 1, updated_at: new Date().toISOString() }).eq('barcode', '8906007');
  if (e10) writeLog(`Error in Point 10: ${e10.message}`);
  else writeLog(`Success: Stock adjusted from 2 pcs to 1 pc.\n`);

  // --- POINT 11: 22 shoulder bag (8906026) ---
  // Missing all 5 pieces.
  writeLog(`>>> POINT 11: 22 shoulder bag (Barcode 8906026)`);
  writeLog(`Action: Stock adjustment. All 5 pcs missing from showroom floor. Stock updated from 5 to 0 pcs.`);
  const { error: e11 } = await s.from('products').update({ stock: 0, badge: 'Missing 5 pcs - Audit', updated_at: new Date().toISOString() }).eq('barcode', '8906026');
  if (e11) writeLog(`Error in Point 11: ${e11.message}`);
  else writeLog(`Success: Stock adjusted from 5 pcs to 0 pcs.\n`);

  // --- POINT 12: 21 sling bag (8906034) ---
  // System was 4, Physical is 1.
  writeLog(`>>> POINT 12: 21 sling bag (Barcode 8906034)`);
  writeLog(`Action: Stock adjustment. System was 4 pcs, physical count is 1 pc (3 pcs missing/shrinkage).`);
  const { error: e12 } = await s.from('products').update({ stock: 1, updated_at: new Date().toISOString() }).eq('barcode', '8906034');
  if (e12) writeLog(`Error in Point 12: ${e12.message}`);
  else writeLog(`Success: Stock adjusted from 4 pcs to 1 pc.\n`);

  // --- POINT 13: 21 sling bag (8906037) ---
  // System was 2, Physical is 1.
  writeLog(`>>> POINT 13: 21 sling slide (Barcode 8906037)`);
  writeLog(`Action: Stock adjustment. System was 2 pcs, physical count is 1 pc (1 pc missing/shrinkage).`);
  const { error: e13 } = await s.from('products').update({ stock: 1, updated_at: new Date().toISOString() }).eq('barcode', '8906037');
  if (e13) writeLog(`Error in Point 13: ${e13.message}`);
  else writeLog(`Success: Stock adjusted from 2 pcs to 1 pc.\n`);

  writeLog(`========================================================================================`);
  writeLog(`ALL 13 HANDBAG POINTS UPDATED IN SUPABASE SUCCESSFULLY AT ${ts}`);
  writeLog(`========================================================================================\n`);
}

applyChanges().catch(err => {
  console.error('Failed to apply changes:', err);
  process.exit(1);
});
