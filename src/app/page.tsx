"use client";

import { useEffect, useState } from "react";
import { ProductItem, ProductCategory } from "@/types/pos";
import { SupabaseService, isSupabaseConfigured } from "@/lib/supabaseClient";
import { ShoppingBag, Star, TrendingUp, ShieldCheck, Phone, ChevronRight } from "lucide-react";

export default function StorefrontPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">("all");

  useEffect(() => {
    async function loadProducts() {
      // 1. Try Supabase first
      if (isSupabaseConfigured()) {
        const remoteProds = await SupabaseService.fetchProducts();
        if (remoteProds && remoteProds.length > 0) {
          setProducts(remoteProds);
          setLoading(false);
          return;
        }
      }
      
      // 2. Fallback to LocalStorage if Supabase fails or not configured
      const local = localStorage.getItem("rajnandni_products");
      if (local) {
        setProducts(JSON.parse(local));
      }
      setLoading(false);
    }
    loadProducts();
  }, []);

  const categories = [
    { id: "all", label: "All Collection" },
    { id: "sarees", label: "Sarees" },
    { id: "lehengas", label: "Lehengas & Gowns" },
    { id: "kurtis", label: "Kurtis & Suits" },
    { id: "handbags", label: "Handbags & Purses" },
    { id: "bangles", label: "Bangles & Kada" },
    { id: "earrings", label: "Earrings & Jhumkas" },
    { id: "jewellery", label: "Jewellery & Sets" },
    { id: "cosmetics", label: "Cosmetics" }
  ];

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  // We only show physical products on the website (not services)
  const displayProducts = filteredProducts.filter(p => !p.isService);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-black font-serif tracking-widest uppercase">RAJNANDINI</h1>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Premium Boutique</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600">
            <a href="#" className="text-stone-900 border-b-2 border-stone-900 pb-1">Shop</a>
            <a href="#" className="hover:text-stone-900 transition">Collections</a>
            <a href="#" className="hover:text-stone-900 transition">Our Story</a>
            <a href="#" className="hover:text-stone-900 transition">Contact</a>
          </nav>
          <div className="flex items-center gap-4">
            <a 
              href="/pos" 
              className="hidden sm:flex text-[11px] font-bold text-stone-500 hover:text-stone-900 transition px-3 py-1.5 rounded-full border border-stone-200"
            >
              Staff Login
            </a>
            <button className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-full text-sm font-bold transition shadow-md">
              <ShoppingBag className="w-4 h-4" />
              <span>Cart (0)</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="bg-stone-900 text-white py-20 px-5 relative overflow-hidden">
        {/* Subtle grid pattern for luxury look */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")" }}></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-amber-400 font-bold tracking-[0.3em] text-xs uppercase mb-4 block">New Collection 2026</span>
          <h2 className="text-4xl md:text-6xl font-black font-serif leading-tight mb-6">
            Elegance Designed For <br className="hidden md:block"/> Every Occasion
          </h2>
          <p className="text-stone-300 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Discover our curated collection of premium Sarees, Lehengas, Handbags, and authentic Jewellery. 
            Directly from Haridwar to your doorstep.
          </p>
          <button className="bg-white text-stone-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-stone-100 transition inline-flex items-center gap-2 shadow-xl shadow-stone-950/20">
            Explore Collection <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="bg-white border-b border-stone-200 py-8 px-5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-stone-100">
          <div className="flex flex-col items-center justify-center p-4">
            <TrendingUp className="w-6 h-6 text-stone-700 mb-2" />
            <h4 className="font-bold text-stone-900 text-sm">Premium Quality</h4>
            <p className="text-xs text-stone-500 mt-1">Handpicked fabrics & materials</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <ShieldCheck className="w-6 h-6 text-stone-700 mb-2" />
            <h4 className="font-bold text-stone-900 text-sm">Secure Checkout</h4>
            <p className="text-xs text-stone-500 mt-1">100% safe & trusted payments</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <Phone className="w-6 h-6 text-stone-700 mb-2" />
            <h4 className="font-bold text-stone-900 text-sm">WhatsApp Support</h4>
            <p className="text-xs text-stone-500 mt-1">Quick assistance & direct orders</p>
          </div>
        </div>
      </section>

      {/* SHOP SECTION */}
      <main className="max-w-7xl mx-auto px-5 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-black font-serif text-stone-900">Featured Products</h3>
            <p className="text-sm text-stone-500 mt-1">Straight from our boutique inventory</p>
          </div>
          
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                  activeCategory === cat.id 
                    ? "bg-stone-900 text-white border-stone-900" 
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:text-stone-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-stone-500 font-semibold text-sm">Loading Boutique Collection...</p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-lg font-bold text-stone-800">No products found in this category.</p>
            <p className="text-sm text-stone-500 mt-1">Check back later or browse other collections.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((prod) => (
              <div key={prod.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                {/* Product Image Area */}
                <div className="aspect-[4/5] bg-stone-50 relative overflow-hidden flex items-center justify-center">
                  {prod.badge && (
                    <span className="absolute top-3 left-3 z-10 bg-white text-stone-900 text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm">
                      {prod.badge}
                    </span>
                  )}
                  {prod.imageUrl ? (
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-300">
                      <ShoppingBag className="w-12 h-12 mb-2 opacity-30" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">No Image</span>
                    </div>
                  )}
                  
                  {/* Quick Add Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <button className="w-full bg-stone-900 text-white font-bold text-xs py-3 rounded-xl shadow-lg hover:bg-stone-800 flex items-center justify-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5" /> Quick Add
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-amber-700 transition">
                      {prod.name}
                    </h4>
                    {prod.sizes && prod.sizes.length > 0 && (
                      <p className="text-[10px] text-stone-400 mt-1 font-medium uppercase tracking-wider">
                        {prod.sizes.join(" • ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-base font-black text-stone-900">₹{prod.price.toLocaleString("en-IN")}</span>
                    {prod.mrp > prod.price && (
                      <span className="text-[11px] text-stone-400 line-through">₹{prod.mrp.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* FOOTER */}
      <footer className="bg-white border-t border-stone-200 mt-12 py-10 px-5 text-center">
        <h2 className="text-xl font-black font-serif tracking-widest uppercase mb-2">RAJNANDINI</h2>
        <p className="text-xs text-stone-500 mb-6">Near PSC Petropump, Ranipur, Haridwar - 249401</p>
        <p className="text-[11px] text-stone-400 font-medium">&copy; {new Date().getFullYear()} Rajnandini Darshan Enterprises. All rights reserved.</p>
      </footer>
    </div>
  );
}
