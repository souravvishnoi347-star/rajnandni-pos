const fs = require('fs');
const path = require('path');

const htmlContent = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rajnandini Boutique - Handbags New Barcodes</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background: #f1f5f9;
      color: #0f172a;
      padding: 24px;
    }
    .header-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      border-left: 6px solid #4f46e5;
    }
    h1 {
      font-size: 24px;
      color: #1e1b4b;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 16px;
    }
    .btn-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #4f46e5;
      color: white;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
    .btn-secondary {
      background: #e2e8f0;
      color: #334155;
    }
    .btn-secondary:hover {
      background: #cbd5e1;
    }
    table.info-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    table.info-table th, table.info-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    table.info-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }
    .badge-new {
      background: #dcfce7;
      color: #15803d;
    }
    .badge-replace {
      background: #fef3c7;
      color: #b45309;
    }

    /* Print Label Container */
    .labels-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 24px;
    }

    /* Thermal 50x38mm or 50x25mm Label Style */
    .barcode-label {
      width: 50mm;
      height: 30mm;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 3mm 2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      page-break-inside: avoid;
      text-align: center;
    }
    .shop-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #000;
      text-transform: uppercase;
      line-height: 1;
    }
    .item-name {
      font-size: 9px;
      font-weight: 700;
      color: #000;
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 46mm;
    }
    .barcode-svg {
      width: 44mm;
      height: 14mm;
      margin: 1px 0;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 0 2mm;
      font-size: 9px;
      font-weight: 700;
      color: #000;
      line-height: 1;
    }
    .mrp-strike {
      text-decoration: line-through;
      color: #555;
      font-weight: normal;
    }

    /* Print media rules */
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .labels-container {
        gap: 0;
        margin: 0;
      }
      .barcode-label {
        border: none;
        margin: 0;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>

  <div class="header-card no-print">
    <h1>🏷️ Rajnandini Boutique - Handbags Naye Barcode Stickers (Latest Updated)</h1>
    <p class="subtitle">Physical stock audit & correction ke baad jin bags par stickers lagne hain (Total 11 Stickers):</p>

    <table class="info-table">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Bag Ka Naam</th>
          <th>SKU Code</th>
          <th>Purana (Galat) Barcode</th>
          <th>Naya Sahi Barcode</th>
          <th>Print Copies</th>
          <th>MRP / Rate</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1</strong></td>
          <td><strong>03 short hand</strong></td>
          <td><code>RJ-BAG-024</code></td>
          <td><code>8906025</code> (1 pc par)</td>
          <td><strong style="color:#15803d; font-size:16px;">8906024</strong></td>
          <td><strong>1 Sticker</strong></td>
          <td>MRP: ₹799 | Rate: <strong>₹580</strong></td>
          <td><span class="badge badge-replace">Replace Sticker</span> Us 1 piece par laga dein jahan 8906025 laga tha.</td>
        </tr>
        <tr>
          <td><strong>2</strong></td>
          <td><strong>17- Shoulder bag</strong></td>
          <td><code>RJ-BAG-17S</code></td>
          <td><code>8906001</code> (06-Shoulder)</td>
          <td><strong style="color:#15803d; font-size:16px;">8906078</strong></td>
          <td><strong>5 Stickers</strong></td>
          <td>MRP: ₹1199 | Rate: <strong>₹699</strong></td>
          <td><span class="badge badge-new">Naya Unique Barcode</span> 17-Shoulder bags par chipkayein.</td>
        </tr>
        <tr>
          <td><strong>3</strong></td>
          <td><strong>20- Shoulder bag</strong></td>
          <td><code>RJ-BAG-20S</code></td>
          <td><code>8906002</code> (25-Shoulder)</td>
          <td><strong style="color:#15803d; font-size:16px;">8906079</strong></td>
          <td><strong>5 Stickers</strong></td>
          <td>MRP: ₹1299 | Rate: <strong>₹820</strong></td>
          <td><span class="badge badge-new">Naya Unique Barcode</span> 20-Shoulder bags par chipkayein.</td>
        </tr>
      </tbody>
    </table>

    <div class="btn-bar">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Print All 11 Barcodes Now (Ctrl + P)
      </button>
      <button class="btn btn-secondary" onclick="toggleBorder()">
        Toggle Sticker Cut Borders
      </button>
    </div>
  </div>

  <h3 class="no-print" style="margin-bottom: 12px; color: #475569;">Stickers Preview (Total 11 Stickers - Ready to Print):</h3>

  <div class="labels-container" id="labelsWrapper">
    <!-- Item 1: 03 short hand (1 copy) -->
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">03 short hand</div>
      <svg class="barcode-svg" id="bc_8906024_1"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 799</span></span>
        <span>RATE: Rs 580</span>
      </div>
    </div>

    <!-- Item 2: 17- Shoulder bag (5 Copies) -->
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">17- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906078_1"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1199</span></span>
        <span>RATE: Rs 699</span>
      </div>
    </div>
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">17- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906078_2"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1199</span></span>
        <span>RATE: Rs 699</span>
      </div>
    </div>
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">17- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906078_3"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1199</span></span>
        <span>RATE: Rs 699</span>
      </div>
    </div>
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">17- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906078_4"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1199</span></span>
        <span>RATE: Rs 699</span>
      </div>
    </div>
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">17- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906078_5"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1199</span></span>
        <span>RATE: Rs 699</span>
      </div>
    </div>

    <!-- Item 3: 20- Shoulder bag (5 Copies) -->
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">20- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906079_1"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1299</span></span>
        <span>RATE: Rs 820</span>
      </div>
    </div>
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">20- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906079_2"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1299</span></span>
        <span>RATE: Rs 820</span>
      </div>
    </div>
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">20- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906079_3"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1299</span></span>
        <span>RATE: Rs 820</span>
      </div>
    </div>
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">20- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906079_4"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1299</span></span>
        <span>RATE: Rs 820</span>
      </div>
    </div>
    <div class="barcode-label">
      <div class="shop-title">RAJNANDINI BOUTIQUE</div>
      <div class="item-name">20- Shoulder bag</div>
      <svg class="barcode-svg" id="bc_8906079_5"></svg>
      <div class="price-row">
        <span>MRP: <span class="mrp-strike">Rs 1299</span></span>
        <span>RATE: Rs 820</span>
      </div>
    </div>
  </div>

  <script>
    function renderBarcodes() {
      const render = (id, val) => {
        try {
          JsBarcode("#" + id, val, {
            format: "CODE128",
            width: 1.35,
            height: 24,
            displayValue: true,
            fontSize: 9,
            fontOptions: "bold",
            margin: 0,
            textMargin: 1
          });
        } catch (e) {
          console.error(e);
        }
      };

      render("bc_8906024_1", "8906024");
      
      for(let i=1; i<=5; i++) {
        render("bc_8906078_" + i, "8906078");
        render("bc_8906079_" + i, "8906079");
      }
    }

    window.onload = renderBarcodes;

    let hasBorder = true;
    function toggleBorder() {
      const labels = document.querySelectorAll('.barcode-label');
      hasBorder = !hasBorder;
      labels.forEach(l => {
        l.style.border = hasBorder ? '1px dashed #cbd5e1' : '1px solid transparent';
      });
    }
  </script>
</body>
</html>
`;

const path1 = path.join(__dirname, '..', 'PRINT_NEW_HANDBAG_BARCODES.html');
const path2 = path.join(__dirname, '..', 'Stock_Verification_Excel_Reports', 'PRINT_NEW_HANDBAG_BARCODES.html');

fs.writeFileSync(path1, htmlContent, 'utf8');
fs.writeFileSync(path2, htmlContent, 'utf8');

console.log('Regenerated Printable Barcodes HTML with 11 stickers successfully!');
