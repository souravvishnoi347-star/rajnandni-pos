const fs = require('fs');
const path = require('path');

const targetFiles = [
  'C:\\Users\\soura\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 12\\Local Storage\\leveldb\\000221.ldb',
  'C:\\Users\\soura\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 12\\Local Storage\\leveldb\\000226.ldb',
  'C:\\Users\\soura\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb\\000769.ldb'
];

// Add all files in Profile 12 and Edge Default leveldb
function addDir(dir) {
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.ldb') || f.endsWith('.log')) {
        const full = path.join(dir, f);
        if (!targetFiles.includes(full)) targetFiles.push(full);
      }
    }
  }
}

addDir('C:\\Users\\soura\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 12\\Local Storage\\leveldb');
addDir('C:\\Users\\soura\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb');
addDir('C:\\Users\\soura\\AppData\\Roaming\\Opera Software\\Opera Stable\\Local Storage\\leveldb');

const billsFound = new Map();

for (const file of targetFiles) {
  if (!fs.existsSync(file)) continue;
  try {
    const raw = fs.readFileSync(file, 'latin1');
    
    // Look for bill patterns: "billNo":"RJN-...
    let searchIdx = 0;
    while (true) {
      const idx = raw.indexOf('"billNo"', searchIdx);
      if (idx === -1) break;
      
      // Find start of this object
      let start = raw.lastIndexOf('{', idx);
      if (start !== -1) {
        // Expand forward to find matching closing brace
        let depth = 0;
        let end = -1;
        for (let i = start; i < Math.min(start + 50000, raw.length); i++) {
          if (raw[i] === '{') depth++;
          else if (raw[i] === '}') {
            depth--;
            if (depth === 0) {
              end = i + 1;
              break;
            }
          }
        }
        if (end !== -1) {
          const candidate = raw.slice(start, end);
          try {
            const parsed = JSON.parse(candidate);
            if (parsed && parsed.billNo && (parsed.customer || parsed.items || parsed.grandTotal)) {
              const cust = (parsed.customer && parsed.customer.name) ? parsed.customer.name : 'Unknown';
              const phone = (parsed.customer && parsed.customer.phone) ? parsed.customer.phone : '';
              const tot = parsed.grandTotal || parsed.total || 0;
              const key = parsed.billNo + '_' + cust + '_' + tot;
              billsFound.set(key, parsed);
            }
          } catch (e) {}
        }
      }
      searchIdx = idx + 8;
    }
  } catch (e) {}
}

console.log('Total extracted bills:', billsFound.size);

const summary = [];
for (const [k, b] of billsFound.entries()) {
  summary.push({
    key: k,
    billNo: b.billNo,
    customer: b.customer?.name,
    phone: b.customer?.phone,
    total: b.grandTotal || b.total,
    date: b.createdAt || b.rawDate,
    itemsCount: b.items ? b.items.length : 0
  });
}

// Sort by billNo
summary.sort((a, b) => (a.billNo || '').localeCompare(b.billNo || ''));
console.log(JSON.stringify(summary, null, 2));

// Save full extracted bills to a json file
fs.writeFileSync('D:\\Hostbolt\\clients\\Haridwar\\Rajnandni Boutique POS\\scripts\\extracted_bills.json', JSON.stringify(Array.from(billsFound.values()), null, 2));
