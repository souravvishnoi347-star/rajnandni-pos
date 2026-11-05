const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxlkiqhhnfzuwkzeilct.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4';

const s = createClient(SUPABASE_URL, SUPABASE_KEY);

function formatIST(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return String(dateStr);
  }
}

async function runExport() {
  console.log('Fetching live products and bills from Supabase...');
  
  // Fetch all products
  const { data: prods, error: pErr } = await s.from('products').select('*');
  if (pErr) throw pErr;

  // Fetch all bills
  const { data: bills, error: bErr } = await s.from('bills').select('*').order('created_at', { ascending: false });
  if (bErr) throw bErr;

  console.log(`Fetched ${prods.length} products and ${bills.length} bills.`);

  // Dummy / fake service purge
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
    if (p.is_service && (p.category || '').toLowerCase() === 'parlour') return false;
    const name = (p.name || '').toLowerCase();
    if (name.includes('hd beauity') || name.includes('airbrush makeup')) return false;
    return true;
  });

  console.log(`Clean Active Genuine Products: ${cleanProds.length}`);

  // Product lookups
  const prodById = new Map();
  const prodBySku = new Map();
  const prodByBarcode = new Map();
  const prodByName = new Map();

  cleanProds.forEach(p => {
    p.totalSold = 0;
    p.totalRevenue = 0;
    p.salesHistory = []; // array of sale details
    p.customerNames = new Set();
    p.customerPhones = new Set();
    p.invoices = new Set();
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

  // Track direct counter sales that didn't link to a pre-cataloged product
  const directCounterSales = [];

  bills.forEach(b => {
    const items = Array.isArray(b.items) ? b.items : [];
    const invoiceNum = b.invoice_number || 'N/A';
    const custName = (b.customer_name || 'Walk-in Guest').trim();
    const custPhone = (b.customer_phone || 'N/A').trim();
    const payMode = b.payment_mode || 'Cash';
    const billDate = b.created_at;

    items.forEach(it => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.price) || 0;
      const sku = (it.sku || '').trim().toUpperCase();
      const barcode = (it.barcode || '').trim();
      const id = (it.id || '').trim();
      const name = (it.name || '').toLowerCase().trim().replace(/\s+/g, ' ');

      let matched = null;
      if (id && prodById.has(id)) matched = prodById.get(id);
      else if (sku && prodBySku.has(sku)) matched = prodBySku.get(sku);
      else if (barcode && barcode !== '8901001' && prodByBarcode.has(barcode)) matched = prodByBarcode.get(barcode);
      else if (name && prodByName.has(name)) matched = prodByName.get(name);

      const saleRecord = {
        invoice: invoiceNum,
        date: billDate,
        dateIST: formatIST(billDate),
        customerName: custName,
        customerPhone: custPhone,
        qty: qty,
        price: price,
        paymentMode: payMode,
        itemName: it.name || 'Item',
        itemSku: it.sku || ''
      };

      if (matched) {
        matched.totalSold += qty;
        matched.totalRevenue += (qty * price);
        matched.salesHistory.push(saleRecord);
        if (custName && custName.toLowerCase() !== 'walk-in guest') {
          matched.customerNames.add(custName);
        } else if (custName) {
          matched.customerNames.add(custName);
        }
        if (custPhone && custPhone !== 'NA' && custPhone !== 'N/A') {
          matched.customerPhones.add(custPhone);
        }
        matched.invoices.add(invoiceNum);

        if (!matched.firstSoldDate || billDate < matched.firstSoldDate) matched.firstSoldDate = billDate;
        if (!matched.lastSoldDate || billDate > matched.lastSoldDate) matched.lastSoldDate = billDate;
      } else {
        directCounterSales.push(saleRecord);
      }
    });
  });

  // Prepare categories
  const categories = {};
  cleanProds.forEach(p => {
    const cat = (p.category || 'other').trim().toLowerCase();
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  });

  // Helper to map product into standard verification row
  function mapProductToRow(p, index) {
    const currentStock = Number(p.stock) || 0;
    const soldQty = p.totalSold || 0;
    const initialTrackedStock = currentStock + soldQty;
    const purchaseCost = Number(p.purchase_cost) || 0;
    const sellingPrice = Number(p.price) || 0;
    const mrp = Number(p.mrp) || sellingPrice;
    const revenue = p.totalRevenue || 0;
    const currentStockCostVal = currentStock * purchaseCost;
    const currentStockRetailVal = currentStock * sellingPrice;

    let stockStatus = 'IN STOCK';
    if (currentStock === 0) {
      stockStatus = 'SOLD OUT';
    } else if (currentStock <= 2) {
      stockStatus = 'LOW STOCK';
    }

    const isSold = soldQty > 0 ? 'YES' : 'NO';
    const customersStr = Array.from(p.customerNames).join(', ') || (soldQty > 0 ? 'Walk-in Guest' : '-');
    const phonesStr = Array.from(p.customerPhones).join(', ') || '-';
    const invoicesStr = Array.from(p.invoices).join(', ') || '-';

    // Detailed breakdown string
    const saleTrail = p.salesHistory.map(s => 
      `[Bill: ${s.invoice} | ${s.dateIST} | Qty: ${s.qty} | Rate: ₹${s.price} | Cust: ${s.customerName} (${s.customerPhone}) | Mode: ${s.paymentMode}]`
    ).join(';\n');

    let sizesStr = '';
    if (Array.isArray(p.sizes)) sizesStr = p.sizes.join(', ');
    else if (p.sizes) sizesStr = String(p.sizes);

    let colorsStr = '';
    if (Array.isArray(p.colors)) colorsStr = p.colors.join(', ');
    else if (p.colors) colorsStr = String(p.colors);

    return {
      'S.No': index + 1,
      'Category': (p.category || '').toUpperCase(),
      'SKU / Item Code': p.sku || '',
      'Barcode': p.barcode || '',
      'Product Name': p.name || '',
      'Listing Date (IST)': formatIST(p.created_at),
      'Stock Status': stockStatus,
      'System Stock in Shop (Pcs)': currentStock,
      'Physical Count [Shop Verification]': '', // Blank for user to write physical count
      'Discrepancy / Remarks': '', // Space for notes
      'Units Sold (Pcs)': soldQty,
      'Total Tracked Qty (Stock+Sold)': initialTrackedStock,
      'Sold? (Yes/No)': isSold,
      'Wholesale Cost (Rs)': purchaseCost,
      'Selling Price (Rs)': sellingPrice,
      'MRP (Rs)': mrp,
      'Total Sales Revenue (Rs)': revenue,
      'Current Shop Stock Cost Value (Rs)': currentStockCostVal,
      'Current Shop Stock Retail Value (Rs)': currentStockRetailVal,
      'Last Sold Date (IST)': formatIST(p.lastSoldDate) || '-',
      'Sold To Customer Name(s)': customersStr,
      'Customer Phone(s)': phonesStr,
      'Bill Invoice Number(s)': invoicesStr,
      'Complete Sales Trail / Details': saleTrail || '-',
      'Sizes / Variants': sizesStr || '-',
      'Colors': colorsStr || '-',
      'Badge / Tag': p.badge || '-'
    };
  }

  // Column widths definition for best visual readability in Excel
  const colWidths = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Category
    { wch: 16 }, // SKU
    { wch: 12 }, // Barcode
    { wch: 38 }, // Product Name
    { wch: 22 }, // Listing Date
    { wch: 14 }, // Stock Status
    { wch: 16 }, // System Stock
    { wch: 20 }, // Physical Count
    { wch: 18 }, // Discrepancy
    { wch: 14 }, // Units Sold
    { wch: 16 }, // Total Tracked Qty
    { wch: 12 }, // Sold?
    { wch: 14 }, // Wholesale Cost
    { wch: 14 }, // Selling Price
    { wch: 12 }, // MRP
    { wch: 16 }, // Total Sales Revenue
    { wch: 20 }, // Stock Cost Value
    { wch: 20 }, // Stock Retail Value
    { wch: 22 }, // Last Sold Date
    { wch: 28 }, // Customer Names
    { wch: 20 }, // Customer Phones
    { wch: 22 }, // Invoice Numbers
    { wch: 55 }, // Sales Trail
    { wch: 18 }, // Sizes
    { wch: 20 }, // Colors
    { wch: 15 }  // Badge
  ];

  // ==========================================
  // 1. BUILD MASTER EXCEL WORKBOOK
  // ==========================================
  const masterWb = XLSX.utils.book_new();

  // --- SUMMARY SHEET ---
  const summaryRows = [];
  let grandSystemStock = 0;
  let grandCostValue = 0;
  let grandRetailValue = 0;
  let grandUnitsSold = 0;
  let grandSalesRevenue = 0;
  let grandInStockSkus = 0;
  let grandLowStockSkus = 0;
  let grandSoldOutSkus = 0;

  const catOverviewList = [];

  const catKeys = Object.keys(categories).sort();
  catKeys.forEach(cat => {
    const list = categories[cat];
    let catStock = 0;
    let catCost = 0;
    let catRetail = 0;
    let catSold = 0;
    let catRevenue = 0;
    let catInStock = 0;
    let catLowStock = 0;
    let catSoldOut = 0;

    list.forEach(p => {
      const stock = Number(p.stock) || 0;
      const cost = Number(p.purchase_cost) || 0;
      const price = Number(p.price) || 0;
      const sold = p.totalSold || 0;
      const rev = p.totalRevenue || 0;

      catStock += stock;
      catCost += (stock * cost);
      catRetail += (stock * price);
      catSold += sold;
      catRevenue += rev;

      if (stock === 0) catSoldOut++;
      else if (stock <= 2) catLowStock++;
      else catInStock++;
    });

    grandSystemStock += catStock;
    grandCostValue += catCost;
    grandRetailValue += catRetail;
    grandUnitsSold += catSold;
    grandSalesRevenue += catRevenue;
    grandInStockSkus += catInStock;
    grandLowStockSkus += catLowStock;
    grandSoldOutSkus += catSoldOut;

    catOverviewList.push({
      'Category': cat.toUpperCase(),
      'Total Listed Designs (SKUs)': list.length,
      'Current Shop Stock (Pieces)': catStock,
      'Wholesale Cost of Stock (Rs)': Math.round(catCost),
      'Retail Selling Value of Stock (Rs)': Math.round(catRetail),
      'Total Units Sold (Pieces)': catSold,
      'Total Sales Revenue Collected (Rs)': Math.round(catRevenue),
      'Active In-Stock Designs': catInStock,
      'Low Stock Designs (<=2 pcs)': catLowStock,
      'Sold-Out Designs': catSoldOut
    });
  });

  const summarySheet = XLSX.utils.json_to_sheet([
    { 'SUMMARY METRICS': 'RAJNANDINI BOUTIQUE - COMPLETE STOCK & SALES PHYSICAL AUDIT', 'VALUE': '' },
    { 'SUMMARY METRICS': 'Report Generation Date & Time', 'VALUE': formatIST(new Date().toISOString()) },
    { 'SUMMARY METRICS': 'Total Listed Genuine Products (SKUs)', 'VALUE': cleanProds.length },
    { 'SUMMARY METRICS': 'Current Showroom Stock Remaining (Pieces in Shop)', 'VALUE': grandSystemStock },
    { 'SUMMARY METRICS': 'Total Wholesale Cost of Showroom Stock (Rs)', 'VALUE': Math.round(grandCostValue) },
    { 'SUMMARY METRICS': 'Total Retail Selling Value of Showroom Stock (Rs)', 'VALUE': Math.round(grandRetailValue) },
    { 'SUMMARY METRICS': 'Total Catalog Pieces Sold to Date', 'VALUE': grandUnitsSold },
    { 'SUMMARY METRICS': 'Total Catalog Sales Revenue Collected (Rs)', 'VALUE': Math.round(grandSalesRevenue) },
    { 'SUMMARY METRICS': 'Direct Counter / Manual Billed Items Sold (Pcs)', 'VALUE': directCounterSales.length },
    { 'SUMMARY METRICS': 'Designs with Good Stock (>2 pcs)', 'VALUE': grandInStockSkus },
    { 'SUMMARY METRICS': 'Designs with Critical Low Stock (<=2 pcs)', 'VALUE': grandLowStockSkus },
    { 'SUMMARY METRICS': 'Completely Sold Out Designs', 'VALUE': grandSoldOutSkus },
    { 'SUMMARY METRICS': '', 'VALUE': '' },
    { 'SUMMARY METRICS': '=== CATEGORY-WISE BREAKDOWN TABLE ===', 'VALUE': '' }
  ]);

  XLSX.utils.sheet_add_json(summarySheet, catOverviewList, { origin: 'A16' });
  summarySheet['!cols'] = [
    { wch: 38 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
    { wch: 26 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(masterWb, summarySheet, 'OVERVIEW & SUMMARY');

  // Directory for individual excel files
  const reportsDir = path.join(__dirname, '..', 'Stock_Verification_Excel_Reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  // Map category to a clean friendly sheet name
  const sheetNameMap = {
    'handbags': 'Handbags',
    'sarees': 'Sarees',
    'kurtis': 'Kurtis',
    'jewellery': 'Jewellery',
    'cosmetics': 'Cosmetics',
    'footwear': 'Footwear',
    'lehengas': 'Lehengas',
    'kidswear': 'Kidswear',
    'undergarments': 'Undergarments',
    'handloom': 'Handloom',
    'bangles': 'Bangles',
    'earrings': 'Earrings'
  };

  let fileIndex = 1;

  // Process each category
  catKeys.forEach(cat => {
    const list = categories[cat];
    // Sort: items that have sales first, then by current stock descending, then SKU
    list.sort((a, b) => {
      if ((b.totalSold || 0) !== (a.totalSold || 0)) {
        return (b.totalSold || 0) - (a.totalSold || 0);
      }
      return (b.stock || 0) - (a.stock || 0);
    });

    const rows = list.map((p, idx) => mapProductToRow(p, idx));
    const catSheet = XLSX.utils.json_to_sheet(rows);
    catSheet['!cols'] = colWidths;

    const sheetName = sheetNameMap[cat] || cat.toUpperCase().slice(0, 31);
    XLSX.utils.book_append_sheet(masterWb, catSheet, sheetName.slice(0, 31));

    // Also write INDIVIDUAL EXCEL FILE for this category
    const singleWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(singleWb, catSheet, sheetName.slice(0, 31));

    const prefix = String(fileIndex).padStart(2, '0');
    const singleFileName = `${prefix}_${sheetName}_Stock_Verification.xlsx`;
    const singleFilePath = path.join(reportsDir, singleFileName);
    XLSX.writeFile(singleWb, singleFilePath);
    console.log(`Generated: ${singleFileName} (${list.length} products)`);
    fileIndex++;
  });

  // Direct Counter Sales Sheet
  const counterRows = directCounterSales.map((s, idx) => ({
    'S.No': idx + 1,
    'Bill Invoice No': s.invoice,
    'Sale Date (IST)': s.dateIST,
    'Item Name': s.itemName,
    'SKU': s.itemSku || 'MANUAL/DIRECT',
    'Quantity Sold': s.qty,
    'Price (Rs)': s.price,
    'Total Amount (Rs)': s.qty * s.price,
    'Customer Name': s.customerName,
    'Customer Phone': s.customerPhone,
    'Payment Mode': s.paymentMode,
    'Remarks': 'Direct counter billing item (not pre-cataloged)'
  }));

  const counterSheet = XLSX.utils.json_to_sheet(counterRows);
  counterSheet['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 22 },
    { wch: 30 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(masterWb, counterSheet, 'Direct Counter Sales');

  const counterWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(counterWb, counterSheet, 'Direct Counter Sales');
  const counterFileName = `${String(fileIndex).padStart(2, '0')}_Direct_Counter_Sales.xlsx`;
  XLSX.writeFile(counterWb, path.join(reportsDir, counterFileName));
  console.log(`Generated: ${counterFileName} (${directCounterSales.length} counter sales)`);

  // Master all products combined sheet
  const allRows = cleanProds.map((p, idx) => mapProductToRow(p, idx));
  const allSheet = XLSX.utils.json_to_sheet(allRows);
  allSheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(masterWb, allSheet, 'ALL_PRODUCTS_MASTER');

  // Save Master Workbook with fallback if locked by Excel
  const masterPath = path.join(__dirname, '..', 'RAJNANDINI_STOCK_PHYSICAL_VERIFICATION_MASTER.xlsx');
  const masterUpdatedPath = path.join(__dirname, '..', 'RAJNANDINI_STOCK_PHYSICAL_VERIFICATION_MASTER_UPDATED.xlsx');
  
  try {
    XLSX.writeFile(masterWb, masterPath);
    console.log(`\nMASTER WORKBOOK SAVED SUCCESSFULLY: ${masterPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.log(`\nMaster file was locked (open in Excel). Saving as: ${masterUpdatedPath}`);
      XLSX.writeFile(masterWb, masterUpdatedPath);
    } else {
      throw err;
    }
  }

  // Also save a copy inside reportsDir
  const reportMasterPath = path.join(reportsDir, '00_MASTER_ALL_CATEGORIES_VERIFICATION.xlsx');
  const reportMasterUpdatedPath = path.join(reportsDir, '00_MASTER_ALL_CATEGORIES_VERIFICATION_UPDATED.xlsx');
  try {
    XLSX.writeFile(masterWb, reportMasterPath);
    console.log(`Saved copy in reports folder: ${reportMasterPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.log(`Reports folder master locked. Saving as: ${reportMasterUpdatedPath}`);
      XLSX.writeFile(masterWb, reportMasterUpdatedPath);
    }
  }

  console.log('\nAll Excel files generated successfully!');
}

runExport().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
