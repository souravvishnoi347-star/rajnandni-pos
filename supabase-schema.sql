-- ==========================================================
-- RAJNANDNI BOUTIQUE & PARLOUR (HARIDWAR) - SUPABASE SCHEMA
-- ==========================================================
-- Run this script in your Supabase project's SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    mrp NUMERIC NOT NULL,
    purchase_cost NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    sizes JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '[]'::jsonb,
    badge TEXT,
    is_service BOOLEAN DEFAULT FALSE,
    service_duration TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for instant barcode & search lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 2. BILLS / INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    payment_mode TEXT NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bills_invoice_number ON public.bills(invoice_number);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at DESC);

-- 3. CUSTOMERS & KHATA / UDHAAR TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    address TEXT,
    total_purchases NUMERIC DEFAULT 0,
    balance_due NUMERIC DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- 4. ALTERATION & TAILORING TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.alterations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    item_name TEXT NOT NULL,
    instructions TEXT,
    tailor_name TEXT,
    delivery_date DATE,
    status TEXT DEFAULT 'received',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. FUNCTION TO ATOMICALLY DECREMENT STOCK
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id TEXT, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock = GREATEST(0, stock - p_qty),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- 6. ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
-- For POS counter access with anon key:
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alterations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for alterations" ON public.alterations FOR ALL USING (true) WITH CHECK (true);
