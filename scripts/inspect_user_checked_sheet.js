const XLSX = require('xlsx');
const fs = require('fs');

async function inspectMaster() {
  const file = 'RAJNANDINI_STOCK_PHYSICAL_VERIFICATION_MASTER.xlsx';
  console.log('Reading:', file);
  const wb = XLSX.readFile(file);
  console.log('Sheets found:', wb.SheetNames);

  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (rows.length === 0) return;

    // Check if any row has 'Physical Count [Shop Verification]' or similar filled in
    const physicalColKey = Object.keys(rows[0] || {}).find(k => 
      k.toLowerCase().includes('physical') || 
      k.toLowerCase().includes('count') || 
      k.toLowerCase().includes('actual') ||
      k.toLowerCase().includes('check') ||
      k.toLowerCase().includes('verified')
    );

    const remarksColKey = Object.keys(rows[0] || {}).find(k => 
      k.toLowerCase().includes('remark') || 
      k.toLowerCase().includes('discrepancy') ||
      k.toLowerCase().includes('note')
    );

    let filledCount = 0;
    let filledRemarks = 0;
    const filledRows = [];

    rows.forEach((r, idx) => {
      const val = physicalColKey ? String(r[physicalColKey]).trim() : '';
      const rem = remarksColKey ? String(r[remarksColKey]).trim() : '';
      if (val !== '' && val !== '0' && val !== '-') {
        filledCount++;
        filledRows.push({ idx, row: r });
      } else if (val === '0') {
        filledCount++;
        filledRows.push({ idx, row: r });
      }
      if (rem !== '') {
        filledRemarks++;
      }
    });

    console.log(`\nSheet: [${sheetName}] | Total Rows: ${rows.length}`);
    if (physicalColKey) {
      console.log(`  Physical Column: "${physicalColKey}" -> Filled Entries: ${filledCount}/${rows.length}`);
    }
    if (remarksColKey) {
      console.log(`  Remarks Column: "${remarksColKey}" -> Filled Entries: ${filledRemarks}`);
    }

    if (filledCount > 0) {
      console.log(`  Sample filled entries in [${sheetName}]:`);
      filledRows.slice(0, 10).forEach(fr => {
        console.log(`    Row ${fr.idx + 1}: SKU: ${fr.row['SKU / Item Code'] || fr.row['SKU'] || ''} | Name: ${fr.row['Product Name'] || fr.row['Item Name'] || ''} | Sys Stock: ${fr.row['System Stock in Shop (Pcs)'] || fr.row['Stock'] || ''} | Physical Count: ${fr.row[physicalColKey]} | Remark: ${fr.row[remarksColKey] || ''}`);
      });
    }
  });
}

inspectMaster().catch(console.error);
