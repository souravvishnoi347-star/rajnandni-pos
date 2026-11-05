const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxlkiqhhnfzuwkzeilct.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4';

const s = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findSourabhBill() {
  console.log('Searching for bills of Sourabh / 8979505639 in Supabase...');

  const { data: bills, error } = await s.from('bills').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }

  const matchingBills = bills.filter(b => 
    (b.customer_phone && b.customer_phone.includes('8979505639')) ||
    (b.customer_name && b.customer_name.toLowerCase().includes('sourabh'))
  );

  console.log('Found matching bills in Supabase:', matchingBills.length);
  matchingBills.forEach(b => {
    console.log('\n=======================================');
    console.log('Invoice:', b.invoice_number);
    console.log('Date:', b.created_at);
    console.log('Customer:', b.customer_name);
    console.log('Phone:', b.customer_phone);
    console.log('Total:', b.total);
    console.log('Payment Mode:', b.payment_mode);
    console.log('Items in DB:');
    console.log(JSON.stringify(b.items, null, 2));
  });

  // Check offline receipts or vault
  const vaultDir = path.join(__dirname, '..', 'offline_bills_vault');
  if (fs.existsSync(vaultDir)) {
    console.log('\nChecking offline_bills_vault...');
    const receiptDir = path.join(vaultDir, 'bills_receipts');
    if (fs.existsSync(receiptDir)) {
      const files = fs.readdirSync(receiptDir);
      files.forEach(f => {
        const content = fs.readFileSync(path.join(receiptDir, f), 'utf8');
        if (content.includes('8979505639') || content.toLowerCase().includes('sourabh')) {
          console.log(`\nFound in offline receipt ${f}:`);
          console.log(content);
        }
      });
    }
  }
}

findSourabhBill().catch(console.error);
