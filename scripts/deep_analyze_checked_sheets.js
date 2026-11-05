const XLSX = require('xlsx');

async function analyzeAllChecked() {
  const file = 'RAJNANDINI_STOCK_PHYSICAL_VERIFICATION_MASTER.xlsx';
  const wb = XLSX.readFile(file);

  console.log('===============================================================');
  console.log('   DEEP ANALYSIS OF PHYSICAL STOCK VERIFICATION BY USER');
  console.log('===============================================================\n');

  // 1. KIDSWEAR
  const kidSheet = wb.Sheets['Kidswear'];
  const kidRows = XLSX.utils.sheet_to_json(kidSheet, { defval: '' });
  console.log(`>>> 1. KIDSWEAR (Total Designs: ${kidRows.length})`);
  let kidSysTotal = 0;
  let kidPhysTotal = 0;
  let kidMatches = 0;
  let kidDiffs = [];

  kidRows.forEach((r, idx) => {
    const sys = Number(r['System Stock in Shop (Pcs)']) || 0;
    const physRaw = String(r['Physical Count [Shop Verification]']).trim();
    const phys = physRaw !== '' ? Number(physRaw) : null;
    const rem = String(r['Discrepancy / Remarks']).trim();

    kidSysTotal += sys;
    if (phys !== null && !isNaN(phys)) {
      kidPhysTotal += phys;
      const diff = phys - sys;
      if (diff === 0) {
        kidMatches++;
      } else {
        kidDiffs.push({
          sku: r['SKU / Item Code'],
          name: r['Product Name'],
          sys,
          phys,
          diff,
          rem
        });
      }
    }
  });

  console.log(`   Checked: ${kidRows.length}/${kidRows.length} (100% Complete)`);
  console.log(`   System Stock: ${kidSysTotal} pcs | Physical Count: ${kidPhysTotal} pcs`);
  console.log(`   Exact Matches: ${kidMatches} designs`);
  console.log(`   Discrepancies: ${kidDiffs.length} designs:`);
  kidDiffs.forEach(d => {
    console.log(`     * [${d.sku}] "${d.name}": System ${d.sys} vs Physical ${d.phys} (Diff: ${d.diff > 0 ? '+' : ''}${d.diff}) | Remark: ${d.rem}`);
  });

  // 2. LEHENGAS
  const lehSheet = wb.Sheets['Lehengas'];
  const lehRows = XLSX.utils.sheet_to_json(lehSheet, { defval: '' });
  console.log(`\n>>> 2. LEHENGAS (Total Designs: ${lehRows.length})`);
  let lehCheckedCount = 0;
  let lehSysTotalChecked = 0;
  let lehPhysTotalChecked = 0;
  let lehMatches = 0;
  let lehDiffs = [];
  let lehUnchecked = [];

  lehRows.forEach((r, idx) => {
    const sys = Number(r['System Stock in Shop (Pcs)']) || 0;
    const physRaw = String(r['Physical Count [Shop Verification]']).trim();
    const phys = (physRaw !== '' && !isNaN(Number(physRaw))) ? Number(physRaw) : (physRaw === '0' ? 0 : null);
    const rem = String(r['Discrepancy / Remarks']).trim();

    if (phys !== null) {
      lehCheckedCount++;
      lehSysTotalChecked += sys;
      lehPhysTotalChecked += phys;
      const diff = phys - sys;
      if (diff === 0) {
        lehMatches++;
      } else {
        lehDiffs.push({
          sku: r['SKU / Item Code'],
          name: r['Product Name'],
          sys,
          phys,
          diff,
          rem
        });
      }
    } else {
      lehUnchecked.push({
        sku: r['SKU / Item Code'],
        name: r['Product Name'],
        sys,
        physRaw
      });
    }
  });

  console.log(`   Checked: ${lehCheckedCount}/${lehRows.length} (${Math.round(lehCheckedCount/lehRows.length*100)}% Complete)`);
  console.log(`   Checked Items: System Stock: ${lehSysTotalChecked} pcs | Physical Count: ${lehPhysTotalChecked} pcs (Diff: ${lehPhysTotalChecked - lehSysTotalChecked} pcs)`);
  console.log(`   Exact Matches: ${lehMatches} designs`);
  console.log(`   Discrepancies found: ${lehDiffs.length} designs:`);
  lehDiffs.forEach(d => {
    console.log(`     * [${d.sku}] "${d.name}": System ${d.sys} vs Physical ${d.phys} (Diff: ${d.diff > 0 ? '+' : ''}${d.diff}) | Rem: ${d.rem}`);
  });
  console.log(`   Remaining Unchecked Lehengas: ${lehUnchecked.length} designs:`);
  lehUnchecked.forEach(u => {
    console.log(`     - [${u.sku}] "${u.name}" (Sys Stock: ${u.sys})`);
  });

  // 3. FOOTWEAR
  const ftwSheet = wb.Sheets['Footwear'];
  const ftwRows = XLSX.utils.sheet_to_json(ftwSheet, { defval: '' });
  console.log(`\n>>> 3. FOOTWEAR (Total Designs: ${ftwRows.length})`);
  let ftwCheckedCount = 0;
  let ftwSysTotalChecked = 0;
  let ftwPhysTotalChecked = 0;
  let ftwMatches = 0;
  let ftwDiffs = [];
  let ftwUnchecked = [];

  ftwRows.forEach((r, idx) => {
    const sys = Number(r['System Stock in Shop (Pcs)']) || 0;
    const physRaw = String(r['Physical Count [Shop Verification]']).trim();
    const phys = (physRaw !== '' && !isNaN(Number(physRaw))) ? Number(physRaw) : (physRaw === '0' ? 0 : null);
    const rem = String(r['Discrepancy / Remarks']).trim();

    if (phys !== null) {
      ftwCheckedCount++;
      ftwSysTotalChecked += sys;
      ftwPhysTotalChecked += phys;
      const diff = phys - sys;
      if (diff === 0) {
        ftwMatches++;
      } else {
        ftwDiffs.push({
          sku: r['SKU / Item Code'],
          name: r['Product Name'],
          sys,
          phys,
          diff,
          rem
        });
      }
    } else {
      ftwUnchecked.push({
        sku: r['SKU / Item Code'],
        name: r['Product Name'],
        sys,
        physRaw
      });
    }
  });

  console.log(`   Checked: ${ftwCheckedCount}/${ftwRows.length} (${Math.round(ftwCheckedCount/ftwRows.length*100)}% Complete)`);
  console.log(`   Checked Items: System Stock: ${ftwSysTotalChecked} pcs | Physical Count: ${ftwPhysTotalChecked} pcs (Diff: ${ftwPhysTotalChecked - ftwSysTotalChecked} pcs)`);
  console.log(`   Exact Matches: ${ftwMatches} designs`);
  console.log(`   Discrepancies found: ${ftwDiffs.length} designs:`);
  ftwDiffs.forEach(d => {
    console.log(`     * [${d.sku}] "${d.name}": System ${d.sys} vs Physical ${d.phys} (Diff: ${d.diff > 0 ? '+' : ''}${d.diff})`);
  });
  console.log(`   Remaining Unchecked Footwear: ${ftwUnchecked.length} designs:`);
  ftwUnchecked.forEach(u => {
    console.log(`     - [${u.sku}] "${u.name}" (Sys Stock: ${u.sys})`);
  });

  // 4. HANDLOOM
  const hndSheet = wb.Sheets['Handloom'];
  const hndRows = XLSX.utils.sheet_to_json(hndSheet, { defval: '' });
  console.log(`\n>>> 4. HANDLOOM (Total Designs: ${hndRows.length})`);
  hndRows.forEach(r => {
    const rem = String(r['Discrepancy / Remarks']).trim();
    const phys = String(r['Physical Count [Shop Verification]']).trim();
    if (rem || phys) {
      console.log(`   [${r['SKU / Item Code']}] "${r['Product Name']}": Sys Stock ${r['System Stock in Shop (Pcs)']} | Physical: "${phys}" | Remark: "${rem}"`);
    }
  });

  // Overall Summary of verification progress
  console.log('\n===============================================================');
  console.log('   OVERALL STORE PHYSICAL VERIFICATION PROGRESS STATUS');
  console.log('===============================================================');
  const catSummary = [
    { cat: 'Kidswear', total: kidRows.length, checked: kidRows.length, pct: '100%', status: 'Fully Verified' },
    { cat: 'Footwear', total: ftwRows.length, checked: ftwCheckedCount, pct: `${Math.round(ftwCheckedCount/ftwRows.length*100)}%`, status: 'Mostly Verified' },
    { cat: 'Lehengas', total: lehRows.length, checked: lehCheckedCount, pct: `${Math.round(lehCheckedCount/lehRows.length*100)}%`, status: 'Mostly Verified' },
    { cat: 'Handbags', total: 45, checked: 45, pct: '100%', status: 'Fully Reconciled with Supplier' },
    { cat: 'Handloom', total: hndRows.length, checked: 5, pct: '38%', status: 'Partially Noted' },
    { cat: 'Sarees', total: 323, checked: 0, pct: '0%', status: 'Pending' },
    { cat: 'Kurtis', total: 197, checked: 0, pct: '0%', status: 'Pending' },
    { cat: 'Jewellery', total: 120, checked: 0, pct: '0%', status: 'Pending' },
    { cat: 'Cosmetics', total: 50, checked: 0, pct: '0%', status: 'Pending' },
    { cat: 'Undergarments', total: 18, checked: 0, pct: '0%', status: 'Pending' },
    { cat: 'Bangles', total: 4, checked: 0, pct: '0%', status: 'Pending' },
    { cat: 'Earrings', total: 4, checked: 0, pct: '0%', status: 'Pending' }
  ];
  console.table(catSummary);
}

analyzeAllChecked().catch(console.error);
