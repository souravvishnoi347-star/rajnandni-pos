const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const s = createClient(
  'https://mxlkiqhhnfzuwkzeilct.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bGtpcWhobmZ6dXdremVpbGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk3MDQsImV4cCI6MjEwNjE1NTcwNH0.rmrOa--NWWlyYQ82NY3aTcQy1UjePv9_j7KcnERSGs4'
);

async function generateReport() {
  const { data: bills } = await s.from('bills').select('*').order('created_at', { ascending: true }).limit(1000);
  const { data: products } = await s.from('products').select('*');

  const prodMap = {};
  products.forEach(p => {
    prodMap[p.id] = p;
    if (p.sku) prodMap[p.sku] = p;
  });

  const octBills = bills.filter(b => b.created_at >= '2026-10-01' && b.created_at < '2026-11-01');

  // === DATE WISE ===
  const dateMap = {};
  octBills.forEach(b => {
    const d = b.created_at.slice(0, 10);
    if (!dateMap[d]) dateMap[d] = { count: 0, total: 0, cost: 0, cash: 0, upi: 0, discount: 0 };
    const entry = dateMap[d];
    entry.count++;
    entry.total += Number(b.total);
    entry.discount += Number(b.discount || 0);
    const pm = (b.payment_mode || '').toLowerCase();
    if (pm === 'cash') entry.cash += Number(b.total);
    else entry.upi += Number(b.total);
    if (b.items && Array.isArray(b.items)) {
      b.items.forEach(it => {
        const prod = prodMap[it.id] || prodMap[it.sku];
        entry.cost += (prod ? Number(prod.purchase_cost || 0) : 0) * (it.quantity || 1);
      });
    }
  });

  // === ITEM WISE ===
  const itemSales = {};
  octBills.forEach(b => {
    if (b.items && Array.isArray(b.items)) {
      b.items.forEach(it => {
        const qty = it.quantity || 1;
        const key = it.sku || it.name || it.id;
        if (!itemSales[key]) itemSales[key] = { name: it.name, sku: it.sku || key, qty: 0, revenue: 0, cost: 0 };
        itemSales[key].qty += qty;
        itemSales[key].revenue += Number(it.price) * qty;
        const prod = prodMap[it.id] || prodMap[it.sku];
        itemSales[key].cost += (prod ? Number(prod.purchase_cost || 0) : 0) * qty;
      });
    }
  });

  // === CATEGORY WISE ===
  const catSales = {};
  octBills.forEach(b => {
    if (b.items && Array.isArray(b.items)) {
      b.items.forEach(it => {
        const prod = prodMap[it.id] || prodMap[it.sku];
        const cat = prod ? prod.category : 'other';
        if (!catSales[cat]) catSales[cat] = { qty: 0, revenue: 0, cost: 0 };
        const qty = it.quantity || 1;
        catSales[cat].qty += qty;
        catSales[cat].revenue += Number(it.price) * qty;
        catSales[cat].cost += (prod ? Number(prod.purchase_cost || 0) : 0) * qty;
      });
    }
  });

  // Totals
  const totalRevenue = octBills.reduce((s, b) => s + Number(b.total), 0);
  const totalDiscount = octBills.reduce((s, b) => s + Number(b.discount || 0), 0);
  const totalCost = Object.values(dateMap).reduce((s, d) => s + d.cost, 0);
  const totalCash = Object.values(dateMap).reduce((s, d) => s + d.cash, 0);
  const totalUpi = Object.values(dateMap).reduce((s, d) => s + d.upi, 0);
  const totalItems = Object.values(itemSales).reduce((s, it) => s + it.qty, 0);

  // Build CSV report
  let csv = '';
  csv += 'RAJNANDINI BOUTIQUE POS - OCTOBER 2026 SALES REPORT\n';
  csv += 'Generated: ' + new Date().toLocaleString('en-IN') + '\n';
  csv += 'NOTE: Bills from 22 Oct afternoon to 24 Oct morning are MISSING due to software bug (now fixed)\n\n';

  csv += '=== SUMMARY ===\n';
  csv += 'Total Bills,' + octBills.length + '\n';
  csv += 'Total Items Sold,' + totalItems + '\n';
  csv += 'Total Revenue (after discount),' + totalRevenue + '\n';
  csv += 'Total Discount Given,' + totalDiscount + '\n';
  csv += 'Total Purchase Cost,' + totalCost + '\n';
  csv += 'Gross Profit,' + (totalRevenue - totalCost) + '\n';
  csv += 'Profit Margin,' + ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1) + '%\n';
  csv += 'Cash Collection,' + totalCash + '\n';
  csv += 'UPI Collection,' + totalUpi + '\n\n';

  csv += '=== DATE-WISE SALES ===\n';
  csv += 'Date,Bills,Revenue,Discount,Cost,Profit,Cash,UPI\n';
  Object.entries(dateMap).sort().forEach(([d, v]) => {
    csv += d + ',' + v.count + ',' + v.total + ',' + v.discount + ',' + v.cost + ',' + (v.total - v.cost) + ',' + v.cash + ',' + v.upi + '\n';
  });

  csv += '\n=== CATEGORY-WISE SALES ===\n';
  csv += 'Category,Items Sold,Revenue,Cost,Profit\n';
  Object.entries(catSales).sort((a, b) => b[1].revenue - a[1].revenue).forEach(([cat, v]) => {
    csv += cat + ',' + v.qty + ',' + v.revenue + ',' + v.cost + ',' + (v.revenue - v.cost) + '\n';
  });

  csv += '\n=== TOP SELLING ITEMS (by Revenue) ===\n';
  csv += 'SKU,Item Name,Qty Sold,Revenue,Cost,Profit\n';
  Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).forEach(it => {
    csv += it.sku + ',' + (it.name || '').replace(/,/g, ' ') + ',' + it.qty + ',' + it.revenue + ',' + it.cost + ',' + (it.revenue - it.cost) + '\n';
  });

  csv += '\n=== ALL BILLS (DETAIL) ===\n';
  csv += 'Invoice No,Date,Customer,Phone,Items Count,Subtotal,Discount,Tax,Total,Payment Mode\n';
  octBills.forEach(b => {
    const d = new Date(b.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const itemCount = b.items ? b.items.length : 0;
    csv += b.invoice_number + ',' + d + ',' + (b.customer_name || '').replace(/,/g, ' ') + ',' + (b.customer_phone || '') + ',' + itemCount + ',' + (b.subtotal || 0) + ',' + (b.discount || 0) + ',' + (b.tax || 0) + ',' + b.total + ',' + (b.payment_mode || '') + '\n';
  });

  // Stock status
  csv += '\n=== CURRENT STOCK STATUS ===\n';
  csv += 'SKU,Item Name,Category,Current Stock,Selling Price,MRP,Purchase Cost\n';
  products.sort((a, b) => (a.stock || 0) - (b.stock || 0)).forEach(p => {
    csv += (p.sku || '') + ',' + (p.name || '').replace(/,/g, ' ') + ',' + (p.category || '') + ',' + (p.stock || 0) + ',' + (p.price || 0) + ',' + (p.mrp || 0) + ',' + (p.purchase_cost || 0) + '\n';
  });

  const outPath = 'scripts/RAJNANDINI_OCTOBER_2026_REPORT.csv';
  fs.writeFileSync(outPath, '\uFEFF' + csv);
  console.log('Report saved to:', outPath);
  console.log('Total bills:', octBills.length);
  console.log('Total revenue:', totalRevenue);
  console.log('Gross Profit:', totalRevenue - totalCost);
}

generateReport().catch(console.error);
