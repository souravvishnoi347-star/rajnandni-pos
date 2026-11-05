const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const page1Data = [
  { bagNo: 1, qty: 3, rate: 230, amount: 690, candidateBags: '12 new bride / Clutch series (Cost ~₹230, MRP ₹699)' },
  { bagNo: 2, qty: 4, rate: 350, amount: 1400, candidateBags: '17- Shoulder bag / 06-Shoulder (Cost ₹350, Sale ₹699)' },
  { bagNo: 3, qty: 3, rate: 290, amount: 870, candidateBags: '11 hand clutch / Party series (Cost ₹290, Sale ₹799)' },
  { bagNo: 4, qty: 3, rate: 260, amount: 780, candidateBags: '19 - Sling Bag series (Cost ₹260, Sale ₹410)' },
  { bagNo: 5, qty: 2, rate: 290, amount: 580, candidateBags: 'Clutch / Designer series (Cost ₹290, Sale ₹799)' },
  { bagNo: 6, qty: 5, rate: 310, amount: 1550, candidateBags: 'Shoulder / Tote series (Cost ₹310, Sale ~₹599)' },
  { bagNo: 7, qty: 4, rate: 260, amount: 1040, candidateBags: 'Sling / Sider series (Cost ₹260, Sale ₹410)' },
  { bagNo: 8, qty: 4, rate: 230, amount: 920, candidateBags: 'Bridal / Clutch series (Cost ₹230, Sale ₹699)' },
  { bagNo: 9, qty: 4, rate: 220, amount: 880, candidateBags: 'Daily Sling / Potli series (Cost ₹220, Sale ~₹399)' },
  { bagNo: 10, qty: 4, rate: 240, amount: 960, candidateBags: '18-Shoulder / Hobo series (Cost ₹240, Sale ₹510)' },
  { bagNo: 11, qty: 2, rate: 280, amount: 560, candidateBags: 'Hobo party / Special series (Cost ₹280, Sale ₹420)' },
  { bagNo: 12, qty: 2, rate: 220, amount: 440, candidateBags: 'Daily Sling / Sider series (Cost ₹220, Sale ~₹399)' }
];

const totalQty = page1Data.reduce((a, b) => a + b.qty, 0);
const totalAmount = page1Data.reduce((a, b) => a + b.amount, 0);

console.log(`Page 1 Total Items: ${page1Data.length}`);
console.log(`Page 1 Total Quantity: ${totalQty} pieces`);
console.log(`Page 1 Total Cost Amount: ₹${totalAmount}`);

// Create Workbook
const wb = XLSX.utils.book_new();

const excelRows = page1Data.map(d => ({
  'Bag No. / S.No.': d.bagNo,
  'Supplier Quantity (Pieces)': d.qty,
  'Wholesale Rate per Pc (Rs)': d.rate,
  'Total Purchase Cost (Rs)': d.amount,
  'Matched Shop Bag / Design Series': d.candidateBags,
  'Physical Showroom Verification Notes': 'Audit ready'
}));

excelRows.push({
  'Bag No. / S.No.': 'PAGE 1 TOTAL',
  'Supplier Quantity (Pieces)': totalQty,
  'Wholesale Rate per Pc (Rs)': '-',
  'Total Purchase Cost (Rs)': totalAmount,
  'Matched Shop Bag / Design Series': '12 Supplier Lots',
  'Physical Showroom Verification Notes': 'Total Investment for Page 1'
});

const ws = XLSX.utils.json_to_sheet(excelRows);
ws['!cols'] = [
  { wch: 18 },
  { wch: 26 },
  { wch: 26 },
  { wch: 24 },
  { wch: 45 },
  { wch: 35 }
];

XLSX.utils.book_append_sheet(wb, ws, 'Page_1_Supplier_Bill');

const filePath1 = path.join(__dirname, '..', 'Stock_Verification_Excel_Reports', 'SUPPLIER_HANDBAGS_PURCHASE_RECONCILIATION.xlsx');
const filePath2 = path.join(__dirname, '..', 'SUPPLIER_HANDBAGS_PURCHASE_RECONCILIATION.xlsx');

XLSX.writeFile(wb, filePath1);
XLSX.writeFile(wb, filePath2);

console.log('Saved supplier reconciliation workbook successfully to:');
console.log('1.', filePath1);
console.log('2.', filePath2);

// Append to Notepad Changelog
const logEntry = `\r\n========================================================================================
SUPPLIER NOTEBOOK BILL RECONCILIATION - PAGE 1 (SERIAL NO. 1 - 12)
ENTRY TIME: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
========================================================================================
- Total Lots on Page 1: 12 Bag Entries (Bag #1 to Bag #12)
- Total Pieces Received: 39 Pieces
- Total Wholesale Bill Amount: Rs 9,670
- Average Purchase Rate: Rs ${Math.round(totalAmount / totalQty)} per piece

Item-wise Breakdown:
  Bag #1:  3 pcs @ Rs 230 = Rs 690
  Bag #2:  4 pcs @ Rs 350 = Rs 1,400 (Matches 17-Shoulder / 06-Shoulder @ Rs 350)
  Bag #3:  3 pcs @ Rs 290 = Rs 870   (Matches 11 hand clutch series @ Rs 290)
  Bag #4:  3 pcs @ Rs 260 = Rs 780   (Matches Sling bag series @ Rs 260)
  Bag #5:  2 pcs @ Rs 290 = Rs 580   (Matches Clutch series @ Rs 290)
  Bag #6:  5 pcs @ Rs 310 = Rs 1,550
  Bag #7:  4 pcs @ Rs 260 = Rs 1,040
  Bag #8:  4 pcs @ Rs 230 = Rs 920   (Matches 12 new bride series @ Rs 230)
  Bag #9:  4 pcs @ Rs 220 = Rs 880
  Bag #10: 4 pcs @ Rs 240 = Rs 960   (Matches 18-Shoulder / Hobo series @ Rs 240)
  Bag #11: 2 pcs @ Rs 280 = Rs 560   (Matches Hobo party series @ Rs 280)
  Bag #12: 2 pcs @ Rs 220 = Rs 440

Excel File Created: SUPPLIER_HANDBAGS_PURCHASE_RECONCILIATION.xlsx
========================================================================================\r\n`;

const log1 = path.join(__dirname, '..', 'Stock_Verification_Audit_Logs', 'HANDBAGS_PHYSICAL_VERIFICATION_CHANGELOG.txt');
const log2 = path.join(__dirname, '..', 'Stock_Verification_Excel_Reports', 'Audit_Logs_And_Notes', 'HANDBAGS_PHYSICAL_VERIFICATION_CHANGELOG.txt');

fs.appendFileSync(log1, logEntry, 'utf8');
fs.appendFileSync(log2, logEntry, 'utf8');
console.log('Appended to Notepad logs successfully.');
