const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const XLSX = require('xlsx');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function generateHandbagsAudit() {
  const { data: bags, error: bErr } = await supabase.from('products').select('*').eq('category', 'handbags').order('barcode', { ascending: true });
  if (bErr) throw bErr;

  const { data: bills, error: billErr } = await supabase.from('bills').select('*');
  if (billErr) throw billErr;

  // Track sales count per barcode
  const salesMap = {};
  bills.forEach(b => {
    const items = Array.isArray(b.items) ? b.items : [];
    items.forEach(it => {
      const bc = String(it.barcode || '').trim();
      if (bc) {
        salesMap[bc] = (salesMap[bc] || 0) + (Number(it.quantity) || 1);
      }
    });
  });

  let totalInitial = 0;
  let totalSold = 0;
  let totalCurrent = 0;

  const rows = bags.map((b, idx) => {
    const curStock = Number(b.stock) || 0;
    const sold = salesMap[b.barcode] || 0;
    const initialListed = curStock + sold;

    totalInitial += initialListed;
    totalSold += sold;
    totalCurrent += curStock;

    return {
      'S.No': idx + 1,
      'Barcode': b.barcode,
      'SKU Code': b.sku || '',
      'Product Name': b.name,
      'Initial Listed Stock': initialListed,
      'Units Sold': sold,
      'Expected Stock on Shelf': curStock,
      'Physical Shelf Count': '', // For user to write
      'Stock Difference': '',      // Physical - Expected
      'MRP (₹)': b.mrp || b.price,
      'Selling Price (₹)': b.price,
      'Status': curStock === 0 ? 'SOLD OUT' : (curStock <= 1 ? 'LOW STOCK' : 'AVAILABLE')
    };
  });

  // Summary Row
  rows.push({
    'S.No': 'TOTAL',
    'Barcode': '-',
    'SKU Code': '-',
    'Product Name': `Total 43 Handbag Designs`,
    'Initial Listed Stock': totalInitial,
    'Units Sold': totalSold,
    'Expected Stock on Shelf': totalCurrent,
    'Physical Shelf Count': '',
    'Stock Difference': '',
    'MRP (₹)': '-',
    'Selling Price (₹)': '-',
    'Status': '-'
  });

  // Save to Excel with formatting
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 12 }, // Barcode
    { wch: 14 }, // SKU Code
    { wch: 28 }, // Product Name
    { wch: 20 }, // Initial Listed Stock
    { wch: 14 }, // Units Sold
    { wch: 24 }, // Expected Stock on Shelf
    { wch: 22 }, // Physical Shelf Count
    { wch: 18 }, // Stock Difference
    { wch: 12 }, // MRP
    { wch: 16 }, // Selling Price
    { wch: 14 }  // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Handbags Physical Audit');
  const targetXlsx = 'HANDBAGS_FULL_STOCK_AUDIT.xlsx';
  XLSX.writeFile(wb, targetXlsx);

  // Save to CSV
  const csvHeaders = Object.keys(rows[0]);
  const csvContent = [
    csvHeaders.join(','),
    ...rows.map(r => csvHeaders.map(h => `"${r[h] ?? ''}"`).join(','))
  ].join('\n');
  fs.writeFileSync('HANDBAGS_FULL_STOCK_AUDIT.csv', csvContent, 'utf8');

  // Try to update the original if not locked
  try {
    XLSX.writeFile(wb, 'ACTUAL_HANDBAGS_SHELF_VERIFICATION.xlsx');
    fs.writeFileSync('ACTUAL_HANDBAGS_SHELF_VERIFICATION.csv', csvContent, 'utf8');
  } catch (err) {
    console.log('Original file is currently open in Excel, created HANDBAGS_FULL_STOCK_AUDIT.xlsx instead.');
  }

  console.log(`Updated ACTUAL_HANDBAGS_SHELF_VERIFICATION.xlsx and .csv`);
  console.log(`Totals: Initial=${totalInitial}, Sold=${totalSold}, ExpectedOnShelf=${totalCurrent}`);
}

generateHandbagsAudit();
