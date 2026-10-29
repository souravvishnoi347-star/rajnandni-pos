const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxlkiqhhnfzuwkzeilct.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4';

const s = createClient(SUPABASE_URL, SUPABASE_KEY);

const VAULT_DIR = path.join(__dirname, '..', 'offline_bills_vault');
const JSON_DIR = path.join(VAULT_DIR, 'bills_json');
const RECEIPTS_DIR = path.join(VAULT_DIR, 'bills_receipts');
const CSV_FILE = path.join(VAULT_DIR, 'MASTER_BILLS_REGISTER.csv');
const LOG_FILE = path.join(VAULT_DIR, 'SYNC_LOG.txt');

// Ensure directories exist
[VAULT_DIR, JSON_DIR, RECEIPTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function log(msg) {
  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\r\n', 'utf8');
  } catch {}
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  return `"${str}"`;
}

function generateReceiptText(b) {
  const items = Array.isArray(b.items) ? b.items : [];
  let txt = '';
  txt += '===================================================\n';
  txt += '          RAJNANDINI BOUTIQUE - HARIDWAR           \n';
  txt += '          OFFLINE BILL ARCHIVE RECEIPT             \n';
  txt += '===================================================\n';
  txt += `Invoice Number : ${b.invoice_number || b.billNo}\n`;
  txt += `Date & Time    : ${b.created_at || new Date().toISOString()}\n`;
  txt += `Customer Name  : ${b.customer_name || b.customer?.name || 'Walk-in Guest'}\n`;
  txt += `Phone Number   : ${b.customer_phone || b.customer?.phone || 'NA'}\n`;
  txt += `Payment Mode   : ${b.payment_mode || b.paymentMode || 'UPI'}\n`;
  txt += '---------------------------------------------------\n';
  txt += 'ITEMS PURCHASED:\n';
  items.forEach((it, idx) => {
    const name = it.name || it.product?.name || 'Item';
    const sku = it.sku || it.product?.sku || '';
    const qty = it.quantity || 1;
    const price = it.price || 0;
    const total = qty * price;
    txt += `${idx + 1}. ${name} ${sku ? '(' + sku + ')' : ''}\n`;
    txt += `   ${qty} pcs @ Rs ${price} = Rs ${total}\n`;
  });
  txt += '---------------------------------------------------\n';
  txt += `Subtotal       : Rs ${b.subtotal || 0}\n`;
  txt += `Discount       : Rs ${b.discount || 0}\n`;
  txt += `Grand Total    : Rs ${b.total || b.grandTotal || 0}\n`;
  txt += '===================================================\n';
  return txt;
}

function saveBillLocally(bill) {
  const billNo = bill.invoice_number || bill.billNo || `bill-${Date.now()}`;
  const safeName = billNo.replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. Save Full JSON
  const jsonPath = path.join(JSON_DIR, `${safeName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(bill, null, 2), 'utf8');

  // 2. Save Receipt Text
  const receiptPath = path.join(RECEIPTS_DIR, `${safeName}.txt`);
  fs.writeFileSync(receiptPath, generateReceiptText(bill), 'utf8');

  return jsonPath;
}

function rebuildMasterCsv(allBills) {
  const rows = [];
  rows.push([
    'Invoice Number',
    'Date & Time (IST)',
    'Customer Name',
    'Customer Phone',
    'Payment Mode',
    'Items Count',
    'Items Summary',
    'Subtotal (Rs)',
    'Discount (Rs)',
    'Grand Total (Rs)'
  ]);

  allBills.forEach(b => {
    const items = Array.isArray(b.items) ? b.items : [];
    const itemsSummary = items
      .map(it => `${it.name || it.product?.name || 'Item'} x${it.quantity || 1}`)
      .join('; ');
    const itemsCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

    rows.push([
      b.invoice_number || b.billNo || '',
      b.created_at || '',
      b.customer_name || b.customer?.name || 'Walk-in Guest',
      b.customer_phone || b.customer?.phone || 'NA',
      b.payment_mode || b.paymentMode || 'UPI',
      itemsCount,
      itemsSummary,
      b.subtotal || 0,
      b.discount || 0,
      b.total || b.grandTotal || 0
    ]);
  });

  const csvContent = rows.map(r => r.map(escapeCsv).join(',')).join('\r\n');
  fs.writeFileSync(CSV_FILE, csvContent, 'utf8');
}

// Track saved bill numbers in memory
const knownBillNos = new Set();

async function initialSync() {
  log('Checking Supabase connection & downloading existing bills...');
  const { data: bills, error } = await s
    .from('bills')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(5000);

  if (error) {
    log('❌ Supabase fetch error: ' + error.message);
    return;
  }

  log(`Found ${bills.length} total bills in Supabase cloud.`);
  let newSaves = 0;

  bills.forEach(b => {
    const bNo = b.invoice_number || b.billNo;
    if (bNo) knownBillNos.add(bNo);
    saveBillLocally(b);
    newSaves++;
  });

  rebuildMasterCsv(bills);
  log(`✅ Local Offline Vault Synced! All ${bills.length} bills saved to:`);
  log(`   📁 JSON Files : ${JSON_DIR}`);
  log(`   📁 Receipts   : ${RECEIPTS_DIR}`);
  log(`   📄 Master CSV : ${CSV_FILE}`);
}

async function startRealtimeListener() {
  log('\n⚡ Starting LIVE REALTIME LISTENER for Haridwar Boutique bills...');
  log('Whenever a cashier clicks "Complete Sale" in Haridwar, a copy will be saved on this laptop in <1 second!\n');

  const channel = s
    .channel('laptop_offline_vault')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bills' },
      payload => {
        const newBill = payload.new;
        if (!newBill) return;

        const bNo = newBill.invoice_number || newBill.billNo;
        if (knownBillNos.has(bNo)) return;
        knownBillNos.add(bNo);

        const items = Array.isArray(newBill.items) ? newBill.items : [];
        const itemsSummary = items.map(it => `${it.name || 'Item'} (${it.quantity || 1} pcs)`).join(', ');

        // Visual alert and beep
        process.stdout.write('\x07'); // System Beep
        console.log('\n======================================================');
        log(`🔔 [LIVE BILL RECEIVED FROM HARIDWAR BOUTIQUE]`);
        console.log(`   Invoice Number : ${bNo}`);
        console.log(`   Customer       : ${newBill.customer_name || 'Walk-in Guest'} (${newBill.customer_phone || 'NA'})`);
        console.log(`   Grand Total    : ₹${newBill.total} via ${newBill.payment_mode || 'UPI'}`);
        console.log(`   Items (${items.length})   : ${itemsSummary}`);
        
        const savedPath = saveBillLocally(newBill);
        console.log(`   💾 Saved to    : ${savedPath}`);

        // Append to Master CSV
        const itemsCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
        const csvLine = [
          bNo,
          newBill.created_at || new Date().toISOString(),
          newBill.customer_name || 'Walk-in Guest',
          newBill.customer_phone || 'NA',
          newBill.payment_mode || 'UPI',
          itemsCount,
          itemsSummary,
          newBill.subtotal || 0,
          newBill.discount || 0,
          newBill.total || 0
        ].map(escapeCsv).join(',') + '\r\n';

        fs.appendFileSync(CSV_FILE, csvLine, 'utf8');
        console.log(`   📄 Appended to : ${CSV_FILE}`);
        console.log('======================================================\n');
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'bills' },
      payload => {
        const updatedBill = payload.new;
        if (!updatedBill) return;
        const bNo = updatedBill.invoice_number || updatedBill.billNo;
        log(`✏️ [BILL UPDATED IN HARIDWAR] Invoice: ${bNo} | New Total: ₹${updatedBill.total}`);
        saveBillLocally(updatedBill);
      }
    )
    .subscribe(status => {
      if (status === 'SUBSCRIBED') {
        log('🟢 REALTIME WEBSOCKET ACTIVE & LISTENING! You are now receiving live bills.');
      } else {
        log(`Subscription status update: ${status}`);
      }
    });

  // Periodic safety check: poll every 60 seconds to catch any bill missed during WiFi drops
  setInterval(async () => {
    try {
      const { data: recent, error } = await s
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && Array.isArray(recent)) {
        let missedCount = 0;
        recent.forEach(b => {
          const bNo = b.invoice_number || b.billNo;
          if (bNo && !knownBillNos.has(bNo)) {
            knownBillNos.add(bNo);
            saveBillLocally(b);
            missedCount++;
            log(`⚡ Caught missed bill during fallback check: ${bNo} (₹${b.total})`);
          }
        });
        if (missedCount > 0) {
          // Rebuild full CSV if missed bills were caught
          const { data: all } = await s.from('bills').select('*').order('created_at', { ascending: true });
          if (all) rebuildMasterCsv(all);
        }
      }
    } catch {}
  }, 60000);
}

// Start Sync
(async () => {
  console.clear();
  console.log('============================================================');
  console.log('   RAJNANDINI BOUTIQUE - LAPTOP OFFLINE BILLS AUTO-SYNC     ');
  console.log('============================================================\n');
  await initialSync();
  await startRealtimeListener();
})();
