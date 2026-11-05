const XLSX = require('xlsx');

const wb = XLSX.readFile('RAJNANDINI_STOCK_PHYSICAL_VERIFICATION_MASTER.xlsx', { cellStyles: true });
const sheet = wb.Sheets['Handbags'];

// Inspect range
console.log('Sheet range:', sheet['!ref']);

// Find all filled cells in columns I, J, K or beyond
const range = XLSX.utils.decode_range(sheet['!ref']);
console.log(`Rows: ${range.s.r} to ${range.e.r}, Cols: ${range.s.c} to ${range.e.c}`);

// Print headers
for (let c = range.s.c; c <= range.e.c; c++) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
  const cell = sheet[cellAddress];
  console.log(`Col ${XLSX.utils.encode_col(c)} (${c}): ${cell ? cell.v : 'EMPTY'}`);
}

console.log('\n--- SCANNING ROWS FOR DATA IN COLS I, J, K, etc. ---');
for (let r = 1; r <= range.e.r; r++) {
  const barcodeCell = sheet[XLSX.utils.encode_cell({ r, c: 3 })]; // Col D (Barcode)
  const nameCell = sheet[XLSX.utils.encode_cell({ r, c: 4 })];    // Col E (Name)
  const sysStockCell = sheet[XLSX.utils.encode_cell({ r, c: 7 })];// Col H (System Stock)
  
  // Check cols 8 (I), 9 (J), 10 (K), 11 (L)
  const cellI = sheet[XLSX.utils.encode_cell({ r, c: 8 })];
  const cellJ = sheet[XLSX.utils.encode_cell({ r, c: 9 })];
  const cellK = sheet[XLSX.utils.encode_cell({ r, c: 10 })];

  // Also check cell style / fill if any
  const rowFilled = (cellI && cellI.v !== '') || (cellJ && cellJ.v !== '') || (cellK && cellK.v !== '');
  
  // Check if any cell has s (style)
  let isYellow = false;
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c })];
    if (cell && cell.s && cell.s.fgColor) {
      isYellow = true;
    }
  }

  if (rowFilled || isYellow || (cellK && cellK.v)) {
    console.log(`Row ${r + 1} | Barcode: ${barcodeCell ? barcodeCell.v : ''} | Name: "${nameCell ? nameCell.v : ''}" | SysStock(H): ${sysStockCell ? sysStockCell.v : ''} | Col I: ${cellI ? cellI.v : ''} | Col J: ${cellJ ? cellJ.v : ''} | Col K: ${cellK ? cellK.v : ''}`);
  }
}
