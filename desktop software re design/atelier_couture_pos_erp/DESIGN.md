---
name: Atelier Couture POS & ERP
colors:
  surface: '#fef8f7'
  surface-dim: '#ded9d8'
  surface-bright: '#fef8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f2f2'
  surface-container: '#f3ecec'
  surface-container-high: '#ede7e6'
  surface-container-highest: '#e7e1e1'
  on-surface: '#1d1b1b'
  on-surface-variant: '#534345'
  inverse-surface: '#323030'
  inverse-on-surface: '#f5efef'
  outline: '#857275'
  outline-variant: '#d8c1c4'
  surface-tint: '#8f4857'
  primary: '#3f0819'
  on-primary: '#ffffff'
  primary-container: '#5a1e2d'
  on-primary-container: '#d68393'
  inverse-primary: '#ffb2bf'
  secondary: '#7c5641'
  on-secondary: '#ffffff'
  secondary-container: '#fdc9af'
  on-secondary-container: '#79533e'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cba72f'
  on-tertiary-container: '#4e3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9de'
  primary-fixed-dim: '#ffb2bf'
  on-primary-fixed: '#3b0616'
  on-primary-fixed-variant: '#733140'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#eebca2'
  on-secondary-fixed: '#2f1405'
  on-secondary-fixed-variant: '#613e2b'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#fef8f7'
  on-background: '#1d1b1b'
  surface-variant: '#e7e1e1'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  currency-tabular:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-touch, tactile luxury boutique environment translated into high-efficiency point-of-sale (POS) and enterprise resource planning (ERP) software. Designed specifically for haute Indian bridal couture, bespoke lehengas, and handloom sarees, it bridges client-facing luxury aesthetics with back-of-house operational rigor.

The visual narrative relies on **Refined Modern Luxury**:
- **Atmosphere:** Serene, warm gallery aesthetic. Avoids clinical corporate blues or harsh flat whites. It evokes the feeling of stepped limestone, handmade paper, raw silk, and champagne metal trims.
- **Audience:** Master drapers, store managers, luxury fashion consultants, and couture inventory controllers who operate across both tablet touchscreens on the showroom floor and high-density multi-monitor back-office desks.
- **Emotional Response:** Impeccable poise, calm competence, and tactile prestige. Interactions feel bespoke and deliberate rather than mass-market transactional.

## Colors

The palette is tuned for day-long showroom lighting and anti-glare tablet clarity, combining rich Indian heritage accents with contemporary luxury restraint.

### Color Roles & Semantics
- **Primary (`#5A1E2D` — Deep Wine Burgundy):** Used for authoritative interactive targets, active tabs, primary checkout triggers, and final order approvals. Conveys lineage, depth, and deliberate action.
- **Secondary (`#C99A82` — Muted Rose Gold / Blush Suede):** Used for non-disruptive accents, subtle selection indicators, active filter chips, and warm secondary badges.
- **Tertiary (`#D4AF37` — Champagne Gold):** Reserved for VIP tier indicators, bridal customisation tags, bespoke alteration flags, and high-value cart highlights.
- **Neutrals (`#1F1D1D` to `#FAF8F5`):**
  - **Canvas Base:** `#FAF8F5` (Warm Ivory / Raw Silk).
  - **Surface Elevated:** `#FFFFFF` (Pure Studio White for cards and scan targets).
  - **Surface Sunken:** `#F3EFEA` (Warm Stone for data grids, cart drawers, and barcode inputs).
  - **Text Primary:** `#1F1D1D` (Deep Charcoal Umber; softens harsh true black to reduce eye fatigue under boutique spotlights).
  - **Text Muted:** `#736B66` (Warm Mineral Gray for metadata, SKU labels, and tax notes).
  - **Border / Divider:** `#E8E2D9` (Warm Alabaster Line; creates structure without visual noise).

### Functional Feedback
- **Success / In-Stock:** `#2D5A43` (Deep Forest Jade).
- **Warning / Alteration Pending:** `#9C6A1A` (Burnished Ochre).
- **Error / Void:** `#8A1C1C` (Crimson).

## Typography

The pairing combines the architectural, sculpted geometry of **Outfit** for editorial titles, customer profile headers, and bridal lookbooks with the pragmatic precision of **Inter** for POS cart lists, measurement matrices, and ledger tables.

### Rules & Details
- **Tabular Figures:** Always apply `font-feature-settings: "tnum"` and `font-variant-numeric: tabular-nums` to `Inter` for prices, SKU codes, yardage measurements, and inventory tallies to preserve strict vertical alignment.
- **Labels & Microcopy:** `label-md` and `label-sm` use subtle uppercase transformations with expanded letter spacing (`0.04em`–`0.06em`) when used for inventory status (e.g., `IN EMBROIDERY`, `ALTERATIONS`, `DISPATCHED`).
- **Headlines:** Must remain tight and proportional; never use heavy black weights for headlines. High-contrast elegance comes from clean line-height and restrained medium weights.

## Layout & Spacing

The system accommodates hybrid POS terminals (fixed horizontal screens, mobile iPad assists, and back-office multi-column consoles).

### Grid Structure
- **Showroom POS Mode (Tablet & Desktop landscape):** A dedicated asymmetric 3-pane split:
  - **Left Navigation / Quick Scan (25% width / min 280px):** Customer dossier, VIP loyalty tier, and barcode quick-input.
  - **Center Catalog & Grid (45%–50% width):** High-resolution visual grid showing bridal ensembles, blouse cuts, fabric swatches, and stock availability across boutique branches.
  - **Right Slip / Cart (25%–30% width / min 360px):** Sticky bill-of-materials, custom fittings notes, breakdown of GST/taxes, and instant tender controls.
- **ERP Ledger Mode:** 12-column fluid grid, defaulting to 24px outer margins and 16px column gutters.

### Breakpoints & Adaptation
- **Mobile Handheld (up to 767px):** Single-column layout. Cart collapses into an anchored bottom bar revealing current total with quick slide-over sheet.
- **Tablet / Countertop POS (768px – 1199px):** 2-pane arrangement (collapsible catalogue + cart drawer).
- **Desktop Pro / Boutique Flagship Screen (1200px+):** Full 3-pane orchestration with zero vertical scrolling for core billing workflows.

## Elevation & Depth

Visual depth is achieved through **ambient warm lighting** and soft, layered architectural paper surfaces rather than heavy artificial shadows.

### Elevation Levels
- **Level 0 (Flat Surface / Canvas):** `#FAF8F5`. No shadow. Base workspace for lists and tables.
- **Level 1 (Cards, Tiles, Catalog Items):** `#FFFFFF` with outline `1px solid #E8E2D9`. Ambient drop shadow: `0 2px 8px -2px rgba(90, 30, 45, 0.04), 0 1px 4px -1px rgba(31, 29, 29, 0.03)`.
- **Level 2 (Active Cart Item, Floating Controls, Search Autocomplete):** `#FFFFFF` with outline `1px solid #DFD7CB`. Ambient drop shadow: `0 8px 24px -4px rgba(90, 30, 45, 0.08), 0 2px 6px -1px rgba(31, 29, 29, 0.04)`.
- **Level 3 (Modal Sheets, Fitting Spec Sheets, Checkout Dialogs):** `#FFFFFF` with outline `1px solid #C99A82` (at 30% opacity). Soft diffused shadow: `0 20px 40px -8px rgba(31, 29, 29, 0.12), 0 4px 12px -2px rgba(90, 30, 45, 0.06)`.

### Scrim & Overlay
Backdrops use warm frosted blur: `background: rgba(250, 248, 245, 0.72); backdrop-filter: blur(8px);`.

## Shapes

The shape system pairs generous, ergonomic outer shells with precise, functional internal components:
- **Base Surfaces & Cards:** Standard `rounded-xl` (16px) for item tiles, customer summary panes, and billing drawers to reinforce the tailored luxury feel.
- **Inputs & Field Enclosures:** `rounded-lg` (8px–10px) to balance scan-ability and clean visual containment.
- **Badges, Status Chips, & Action Pills:** Full pill radius (`rounded-full` / 9999px) for luxury indicators (e.g., `Zardozi Handwork`, `Bespoke Order`, `VIP Platinum`).
- **Touch Ergonomics:** Every interactive cell in the POS maintains a minimum target surface of 44×44px, rounded to prevent visual friction during rapid touch entry.

## Components

### 1. Buttons
- **Primary (Tender / Complete Order / Save Order):** Solid Deep Wine (`#5A1E2D`), text white, `rounded-xl`, subtle highlight ring on hover. Focus state utilizes an outer ring in champagne gold (`#D4AF37`).
- **Secondary (Custom Alterations / Hold Bill / Add Customer):** Warm ivory ground with border `1px solid #C99A82`, text `#5A1E2D`.
- **Tertiary / Utility (Discount, Split Tender, Notes):** Flat neutral stone `#F3EFEA`, text `#1F1D1D`.

### 2. Product & Ensemble Tiles (Catalog)
- Card container with `rounded-xl` geometry, subtle warm border, and 4:5 vertical aspect ratio for full-length Indian silhouettes (lehengas and sarees).
- Displays primary photograph, artisan weave tag (e.g., *Pure Kanchipuram Silk*), real-time store inventory level, and price rendered in tabular Inter.
- Long-press triggers a quick-preview modal with swatch zoom, karigari (craftsmanship) notes, and blouse tailoring status.

### 3. Cart & Register Matrix
- Row items separated by delicate hairlines (`#E8E2D9`).
- Left thumb contains SKU and thumbnail; right column presents tabular price, quantity counters, and bespoke alteration flags in pill chips.
- Total billing summary features a distinct Champagne Gold subtle gradient banner for luxury client presentation facing the counter.

### 4. Chips & Badges
- **Bespoke / Custom Made:** Background `rgba(201, 154, 130, 0.15)`, text `#5A1E2D`, border `1px solid #C99A82`.
- **VIP Client Status:** Background `rgba(212, 175, 55, 0.12)`, text `#7A5B0B`, border `1px solid #D4AF37`.
- **Inventory Status:** High-contrast neutral pills (`#F3EFEA`), uppercase `label-sm` tracking.

### 5. Inputs & Measurement Fields
- Specialized measurement inputs for blouse, lehenga length, choli bust, and hip dimensions use segmented inline numeric controls with high-contrast active borders (`#5A1E2D`).
- Barcode/RFID quick-scan input is permanently docked at the top of the interface with auto-focus preservation and an instant clear button.

### 6. Lists & Ledger Tables (ERP)
- Alternating subtle rows (`#FFFFFF` to `#FAF8F5`) with `1px` alabaster dividers.
- Pinned header with uppercase letter-spaced metadata (`label-md`).
- Right-aligned tabular numeric fields with automatic currency symbols (₹ / $ / AED) aligned in a strict vertical axis.