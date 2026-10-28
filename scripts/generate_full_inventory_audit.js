const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://mxlkiqhhnfzuwkzeilct.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4';

const s = createClient(SUPABASE_URL, SUPABASE_KEY);

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  return `"${str}"`;
}

async function generateAudit() {
  console.log('Fetching live master data from Supabase...');
  const { data: prods, error: pErr } = await s.from('products').select('*');
  if (pErr) throw pErr;

  const { data: bills, error: bErr } = await s.from('bills').select('*');
  if (bErr) throw bErr;

  console.log(`Loaded ${prods.length} products and ${bills.length} bills.`);

  // Purge any fake or parlour dummy items
  const PURGED_IDS = new Set([
    'manual-1792225948451',
    'prod-par-1', 'prod-par-2', 'prod-par-3', 'prod-par-4', 'prod-par-5', 'prod-par-6', 'prod-par-7'
  ]);
  const PURGED_SKUS = new Set([
    'RJ-PAR-001', 'RJ-PAR-002', 'RJ-PAR-003', 'RJ-PAR-004', 'RJ-PAR-005', 'RJ-PAR-006', 'RJ-PAR-007'
  ]);

  const cleanProds = prods.filter(p => {
    if (!p) return false;
    if (PURGED_IDS.has(p.id)) return false;
    if (p.sku && PURGED_SKUS.has(p.sku.toUpperCase().trim())) return false;
    if (p.isService && p.category === 'parlour') return false;
    const name = (p.name || '').toLowerCase();
    if (name.includes('hd beauity') || name.includes('airbrush makeup')) return false;
    return true;
  });

  console.log(`Active Genuine Products after purge: ${cleanProds.length}`);

  // Build lookups for bills
  const prodById = new Map();
  const prodBySku = new Map();
  const prodByBarcode = new Map();
  const prodByName = new Map();

  cleanProds.forEach(p => {
    p.totalSold = 0;
    p.totalRevenue = 0;
    p.billCount = 0;
    p.firstSoldDate = null;
    p.lastSoldDate = null;

    prodById.set(p.id, p);
    if (p.sku) prodBySku.set(p.sku.toUpperCase().trim(), p);
    if (p.barcode && p.barcode.trim() !== '8901001') {
      prodByBarcode.set(p.barcode.trim(), p);
    }
    if (p.name) {
      const cleanName = p.name.toLowerCase().trim().replace(/\s+/g, ' ');
      prodByName.set(cleanName, p);
    }
  });

  // Track unmapped bill items for audit
  const unmappedSales = [];

  bills.forEach(b => {
    if (!b.items || !Array.isArray(b.items)) return;
    b.items.forEach(it => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.price) || 0;
      const sku = (it.sku || '').trim().toUpperCase();
      const barcode = (it.barcode || '').trim();
      const id = (it.id || '').trim();
      const name = (it.name || '').toLowerCase().trim().replace(/\s+/g, ' ');

      // Precise 1-to-1 matching
      let matched = null;
      if (id && prodById.has(id)) matched = prodById.get(id);
      else if (sku && prodBySku.has(sku)) matched = prodBySku.get(sku);
      else if (barcode && barcode !== '8901001' && prodByBarcode.has(barcode)) matched = prodByBarcode.get(barcode);
      else if (name && prodByName.has(name)) matched = prodByName.get(name);

      if (matched) {
        matched.totalSold += qty;
        matched.totalRevenue += (qty * price);
        matched.billCount += 1;
        if (!matched.firstSoldDate || b.created_at < matched.firstSoldDate) matched.firstSoldDate = b.created_at;
        if (!matched.lastSoldDate || b.created_at > matched.lastSoldDate) matched.lastSoldDate = b.created_at;
      } else {
        unmappedSales.push({ billNo: b.billNo, date: b.created_at, item: it });
      }
    });
  });

  // Sort products: by Category alphabetically, then by Units Sold descending
  cleanProds.sort((a, b) => {
    const catA = (a.category || '').toLowerCase();
    const catB = (b.category || '').toLowerCase();
    if (catA !== catB) return catA.localeCompare(catB);
    return (b.totalSold || 0) - (a.totalSold || 0);
  });

  // Category summary calculation
  const catSummary = {};
  let grandTotalStock = 0;
  let grandTotalCostValue = 0;
  let grandTotalRetailValue = 0;
  let grandTotalSold = 0;
  let grandTotalRevenue = 0;
  let inStockCount = 0;
  let soldOutCount = 0;
  let lowStockCount = 0;

  cleanProds.forEach(p => {
    const stock = Number(p.stock) || 0;
    const cost = Number(p.purchase_cost) || 0;
    const price = Number(p.price) || 0;
    const sold = p.totalSold || 0;
    const rev = p.totalRevenue || 0;
    const cat = (p.category || 'other').toLowerCase();

    if (!catSummary[cat]) {
      catSummary[cat] = {
        category: cat,
        skuCount: 0,
        stockPcs: 0,
        wholesaleCostVal: 0,
        retailVal: 0,
        soldPcs: 0,
        salesRevenue: 0,
        soldOutCount: 0
      };
    }

    catSummary[cat].skuCount += 1;
    catSummary[cat].stockPcs += stock;
    catSummary[cat].wholesaleCostVal += (stock * cost);
    catSummary[cat].retailVal += (stock * price);
    catSummary[cat].soldPcs += sold;
    catSummary[cat].salesRevenue += rev;
    if (stock === 0) catSummary[cat].soldOutCount += 1;

    grandTotalStock += stock;
    grandTotalCostValue += (stock * cost);
    grandTotalRetailValue += (stock * price);
    grandTotalSold += sold;
    grandTotalRevenue += rev;

    if (stock === 0) soldOutCount++;
    else if (stock <= 2) lowStockCount++;
    else inStockCount++;
  });

  // Generate CSV Content
  const csvRows = [];

  // Header / Metadata block
  csvRows.push(['RAJNANDINI BOUTIQUE - COMPLETE MASTER INVENTORY & SALES AUDIT']);
  csvRows.push(['Report Generated At', new Date().toISOString()]);
  csvRows.push(['Total Genuine Products (SKUs)', cleanProds.length]);
  csvRows.push(['Total Unsold Showroom Stock (Pieces in Shop)', grandTotalStock]);
  csvRows.push(['Total Procurement Cost of Stock in Shop (Rs)', grandTotalCostValue]);
  csvRows.push(['Total Retail Value of Stock in Shop (Rs)', grandTotalRetailValue]);
  csvRows.push(['Total Units Sold Across All Bills (Pieces)', grandTotalSold]);
  csvRows.push(['Total Sales Revenue Collected to Date (Rs)', grandTotalRevenue]);
  csvRows.push(['Active In Stock Designs', inStockCount]);
  csvRows.push(['Critical Low Stock (<=2 pcs)', lowStockCount]);
  csvRows.push(['Completely Sold Out Designs', soldOutCount]);
  csvRows.push([]);

  // Category Summary Section
  csvRows.push(['--- CATEGORY-WISE INVENTORY & SALES BREAKDOWN ---']);
  csvRows.push([
    'Category',
    'Catalog Designs (SKUs)',
    'Current Stock (Pieces in Shop)',
    'Wholesale Cost of Stock (Rs)',
    'Retail Selling Value (Rs)',
    'Units Sold to Date (Pcs)',
    'Sales Revenue Collected (Rs)',
    'Sold Out Designs'
  ]);

  Object.values(catSummary).forEach(c => {
    csvRows.push([
      c.category.toUpperCase(),
      c.skuCount,
      c.stockPcs,
      Math.round(c.wholesaleCostVal),
      Math.round(c.retailVal),
      c.soldPcs,
      Math.round(c.salesRevenue),
      c.soldOutCount
    ]);
  });

  csvRows.push([
    'GRAND TOTAL',
    cleanProds.length,
    grandTotalStock,
    Math.round(grandTotalCostValue),
    Math.round(grandTotalRetailValue),
    grandTotalSold,
    Math.round(grandTotalRevenue),
    soldOutCount
  ]);
  csvRows.push([]);

  // Detailed Product Table
  csvRows.push(['--- FULL PRODUCT-BY-PRODUCT STOCK & SALES MASTER LIST ---']);
  const headers = [
    'S.No',
    'Category',
    'Product Title / Description',
    'SKU',
    'Barcode',
    'Wholesale Procurement Cost (Rs)',
    'Retail Selling Price (Rs)',
    'Current Stock on Racks (Pcs)',
    'Stock Status',
    'Units Sold to Date (Pcs)',
    'Sales Revenue Collected (Rs)',
    'Total Stock Cost Value (Rs)',
    'Total Stock Retail Value (Rs)',
    'Profit Margin per Piece (Rs)',
    'Profit Margin %',
    'First Sale Date',
    'Last Sale Date'
  ];
  csvRows.push(headers);

  cleanProds.forEach((p, idx) => {
    const stock = Number(p.stock) || 0;
    const cost = Number(p.purchase_cost) || 0;
    const price = Number(p.price) || 0;
    const sold = p.totalSold || 0;
    const rev = p.totalRevenue || 0;
    const marginRs = price - cost;
    const marginPct = price > 0 ? ((marginRs / price) * 100).toFixed(1) + '%' : '0%';
    const status = stock === 0 ? 'SOLD OUT' : stock <= 2 ? 'LOW STOCK' : 'IN STOCK';

    csvRows.push([
      idx + 1,
      (p.category || 'other').toUpperCase(),
      p.name || 'Unnamed',
      p.sku || '',
      p.barcode || '',
      cost,
      price,
      stock,
      status,
      sold,
      rev,
      stock * cost,
      stock * price,
      marginRs,
      marginPct,
      p.firstSoldDate ? p.firstSoldDate.slice(0, 10) : 'Never Sold',
      p.lastSoldDate ? p.lastSoldDate.slice(0, 10) : 'Never Sold'
    ]);
  });

  const csvString = csvRows.map(row => row.map(escapeCsv).join(',')).join('\r\n');

  // Write to public folder for direct download
  const publicPath = path.join(__dirname, '..', 'public', 'RAJNANDINI_GENUINE_INVENTORY_MASTER.csv');
  fs.writeFileSync(publicPath, csvString, 'utf8');
  console.log(`Wrote CSV to: ${publicPath} (${csvString.length} bytes)`);

  // Also write to scripts folder
  const scriptsPath = path.join(__dirname, 'RAJNANDINI_GENUINE_INVENTORY_MASTER.csv');
  fs.writeFileSync(scriptsPath, csvString, 'utf8');

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Total Genuine Products: ${cleanProds.length}`);
  console.log(`Current Unsold Showroom Stock: ${grandTotalStock} pieces`);
  console.log(`Total Units Sold to Date: ${grandTotalSold} pieces`);
  console.log(`Wholesale Stock Value: Rs ${grandTotalCostValue.toLocaleString('en-IN')}`);
  console.log(`Retail Stock Value: Rs ${grandTotalRetailValue.toLocaleString('en-IN')}`);
  console.log(`Total Sales Revenue: Rs ${grandTotalRevenue.toLocaleString('en-IN')}`);
}

generateAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
