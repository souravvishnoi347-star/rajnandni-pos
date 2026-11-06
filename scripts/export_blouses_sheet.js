const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function exportBlousesExcel() {
  const { data: prods, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', 'blouses')
    .order('barcode', { ascending: true });

  if (error || !prods) {
    console.error("Error fetching blouses:", error);
    return;
  }

  const rows = prods.map((p, idx) => ({
    "S.No.": idx + 1,
    "Barcode": p.barcode,
    "SKU Code": p.sku,
    "Product Name / Design": p.name,
    "Category": "Designer Blouses",
    "Current Stock (Pcs)": p.stock,
    "Wholesale Cost (₹)": p.purchase_cost,
    "Retail Selling Price (₹)": p.price,
    "MRP (₹)": p.mrp,
    "Total Cost Valuation (₹)": p.purchase_cost * p.stock,
    "Total Retail Value (₹)": p.price * p.stock,
    "Physical Count (Verified)": p.stock,
    "Remarks / Notes": "New arrival (Night Nov 5), Barcodes printed"
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 40 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Designer Blouses");
  const outPath = "Stock_Verification_Excel_Reports/14_Blouses_Stock_Verification.xlsx";
  XLSX.writeFile(wb, outPath);
  console.log(`✓ Created Excel Report: ${outPath} with ${rows.length} records!`);
}

exportBlousesExcel();
