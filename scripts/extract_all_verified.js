const XLSX = require('xlsx');

const wb = XLSX.readFile('RAJNANDINI_STOCK_PHYSICAL_VERIFICATION_MASTER.xlsx', { cellStyles: true });
const sheet = wb.Sheets['Handbags'];
const range = XLSX.utils.decode_range(sheet['!ref']);

console.log('--- ALL ROWS IN HANDBAGS SHEET ---');
const results = [];

for (let r = 1; r <= range.e.r; r++) {
  const skuCell = sheet[XLSX.utils.encode_cell({ r, c: 2 })];
  const barcodeCell = sheet[XLSX.utils.encode_cell({ r, c: 3 })];
  const nameCell = sheet[XLSX.utils.encode_cell({ r, c: 4 })];
  const sysStockCell = sheet[XLSX.utils.encode_cell({ r, c: 7 })];
  const cellI = sheet[XLSX.utils.encode_cell({ r, c: 8 })];
  const cellJ = sheet[XLSX.utils.encode_cell({ r, c: 9 })];
  const cellK = sheet[XLSX.utils.encode_cell({ r, c: 10 })];

  let yellowCols = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c })];
    if (cell && cell.s) {
      const s = cell.s;
      // Check fgColor, bgColor, patternType
      if (s.fgColor || s.bgColor || s.fill) {
        yellowCols.push(c);
      }
    }
  }

  results.push({
    rowIdx: r + 1,
    sku: skuCell ? skuCell.v : '',
    barcode: barcodeCell ? barcodeCell.v : '',
    name: nameCell ? nameCell.v : '',
    sysStock: sysStockCell ? sysStockCell.v : 0,
    colK: (cellK && cellK.v !== undefined && cellK.v !== '') ? cellK.v : null,
    isYellow: yellowCols.length > 0,
    yellowColsCount: yellowCols.length
  });
}

console.log(JSON.stringify(results, null, 2));
