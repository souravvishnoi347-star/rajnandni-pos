const XLSX = require('xlsx');

const wb = XLSX.readFile('RAJNANDINI_STOCK_PHYSICAL_VERIFICATION_MASTER.xlsx', { cellStyles: true });
const sheet = wb.Sheets['Handbags'];
const range = XLSX.utils.decode_range(sheet['!ref']);

const bags = [];

for (let r = 1; r <= range.e.r; r++) {
  const skuCell = sheet[XLSX.utils.encode_cell({ r, c: 2 })];
  const barcodeCell = sheet[XLSX.utils.encode_cell({ r, c: 3 })];
  const nameCell = sheet[XLSX.utils.encode_cell({ r, c: 4 })];
  const sysStockCell = sheet[XLSX.utils.encode_cell({ r, c: 7 })];
  const cellK = sheet[XLSX.utils.encode_cell({ r, c: 10 })];

  const bc = barcodeCell ? String(barcodeCell.v).trim() : '';
  // Only genuine handbags: 8906001 to 8906043
  if (bc >= '8906001' && bc <= '8906043') {
    let isYellow = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.s && (cell.s.fgColor || cell.s.bgColor || cell.s.fill)) {
        isYellow = true;
      }
    }
    bags.push({
      row: r + 1,
      barcode: bc,
      sku: skuCell ? skuCell.v : '',
      name: nameCell ? nameCell.v : '',
      sysStock: sysStockCell ? sysStockCell.v : 0,
      colK: cellK && cellK.v !== undefined && cellK.v !== '' ? cellK.v : null,
      isYellow: isYellow
    });
  }
}

console.log('--- BREAKDOWN OF ALL 43 GENUINE HANDBAGS ---');
const yellowBags = bags.filter(b => b.isYellow);
const manualCountBags = bags.filter(b => b.colK !== null);
const pendingBags = bags.filter(b => !b.isYellow && b.colK === null);

console.log(`Total Genuine Handbags: ${bags.length}`);
console.log(`1. Yellow Highlighted (Stock pure/complete as per sheet): ${yellowBags.length}`);
yellowBags.forEach(b => console.log(`   - [${b.barcode}] ${b.name}: ${b.sysStock} pcs`));

console.log(`\n2. Number Filled in Column K (Different from sheet): ${manualCountBags.length}`);
manualCountBags.forEach(b => console.log(`   - [${b.barcode}] ${b.name}: Sheet says ${b.sysStock} pcs, Found on shelf: ${b.colK} pcs (Diff: ${b.colK - b.sysStock})`));

console.log(`\n3. Neither Yellow nor Col K filled: ${pendingBags.length}`);
pendingBags.forEach(b => console.log(`   - [${b.barcode}] ${b.name}: Sheet says ${b.sysStock} pcs`));
