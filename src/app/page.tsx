"use client";

import { useEffect, useState } from "react";
import { ProductItem, ProductCategory } from "@/types/pos";
import { SupabaseService, isSupabaseConfigured } from "@/lib/supabaseClient";
import { ShoppingBag, Search, Heart, User, ChevronRight, ArrowRight } from "lucide-react";

export default function StorefrontPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">("all");

  useEffect(() => {
    async function loadProducts() {
      if (isSupabaseConfigured()) {
        const remoteProds = await SupabaseService.fetchProducts();
        if (remoteProds && remoteProds.length > 0) {
          setProducts(remoteProds);
          setLoading(false);
          return;
        }
      }
      const local = localStorage.getItem("rajnandni_products");
      if (local) {
        setProducts(JSON.parse(local));
      }
      setLoading(false);
    }
    loadProducts();
  }, []);

  const categories = [
    { id: "all", label: "ALL COLLECTION" },
    { id: "sarees", label: "SAREES" },
    { id: "lehengas", label: "LEHENGAS" },
    { id: "kurtis", label: "KURTIS & SUITS" },
    { id: "handbags", label: "HANDBAGS" },
    { id: "jewellery", label: "JEWELLERY" },
    { id: "cosmetics", label: "COSMETICS" }
  ];

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const displayProducts = filteredProducts.filter(p => !p.isService);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans">
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#f3e5d8] text-stone-900 text-center py-2 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2">
        <Heart className="w-3.5 h-3.5 fill-current" />
        DELIVERING LOVE WORLDWIDE
      </div>

      {/* MAIN HEADER */}
      <header className="bg-white sticky top-0 z-50">
        <div className="border-b border-stone-200">
          <div className="max-w-[1400px] mx-auto px-5 py-4 md:py-6 flex items-center justify-between">
            {/* Left Spacer (for centering logo on desktop) */}
            <div className="hidden md:flex flex-1">
              <a href="/pos" className="text-[10px] font-bold tracking-[0.15em] text-stone-400 hover:text-stone-900 uppercase transition">
                Staff Access
              </a>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-3 justify-center flex-1">
              <img src="/logo.png" alt="Rajnandini Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
              <h1 className="text-2xl md:text-3xl font-normal font-serif tracking-[0.25em] uppercase">RAJNANDINI</h1>
            </div>

            {/* Right Icons */}
            <div className="flex flex-1 items-center justify-end gap-5">
              <button className="text-stone-700 hover:text-stone-900 transition"><Search className="w-5 h-5 md:w-6 md:h-6 font-light" strokeWidth={1.5} /></button>
              <button className="text-stone-700 hover:text-stone-900 transition hidden sm:block"><Heart className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} /></button>
              <button className="text-stone-700 hover:text-stone-900 transition hidden sm:block"><User className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} /></button>
              <button className="text-stone-700 hover:text-stone-900 transition relative">
                <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
                <span className="absolute -top-1.5 -right-2 bg-stone-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
              </button>
            </div>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="hidden lg:flex items-center justify-center gap-8 py-4 px-5 border-b border-stone-100 bg-white">
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as ProductCategory | "all")}
              className={`text-[11px] font-semibold tracking-widest uppercase transition-colors flex items-center gap-1 ${activeCategory === cat.id ? "text-stone-900" : "text-stone-500 hover:text-stone-900"}`}
            >
              {cat.label}
              <ChevronRight className="w-3 h-3 opacity-50" />
            </button>
          ))}
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative w-full h-[70vh] md:h-[85vh] bg-stone-900 overflow-hidden flex items-center">
        {/* We use a high quality unsplash image for the hero background to mimic the vibe */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1583391733958-d25e07fac044?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
        ></div>
        
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-6 md:px-16 text-white">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-8 max-w-3xl drop-shadow-lg">
            A modern take on timeless Indian elegance, <br className="hidden md:block"/> made for moments that stay with you.
          </h2>
          
          <button className="group flex items-center gap-3 border border-white/80 hover:border-white px-8 py-4 text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase transition-all hover:bg-white hover:text-stone-900 backdrop-blur-sm">
            <span>EXPLORE INDO-WESTERN LEHENGAS</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* FEATURED COLLECTIONS (FESTIVAL CARDS) */}
      <section className="max-w-[1400px] mx-auto px-5 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="group relative aspect-[4/5] bg-stone-100 overflow-hidden cursor-pointer">
            <img src="https://images.unsplash.com/photo-1615886753866-79396abc446e?auto=format&fit=crop&w=800&q=80" alt="Karwa Chauth" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/30 to-transparent flex flex-col justify-end p-8 text-center pb-12">
              <h3 className="text-white text-3xl font-serif mb-2 tracking-wide">KARWA CHAUTH</h3>
              <p className="text-stone-200 text-sm font-medium mb-8">Grand Moments, Timeless Styles!</p>
              <div className="flex items-center justify-center gap-2 text-white font-bold text-xs tracking-widest uppercase group-hover:gap-3 transition-all">
                SHOP NOW <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="group relative aspect-[4/5] bg-stone-100 overflow-hidden cursor-pointer">
            <img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80" alt="Navratri" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/30 to-transparent flex flex-col justify-end p-8 text-center pb-12">
              <h3 className="text-white text-3xl font-serif mb-2 tracking-wide">NAVRATRI</h3>
              <p className="text-stone-200 text-sm font-medium mb-8">Nine Nights. Endless Nakhra.</p>
              <div className="flex items-center justify-center gap-2 text-white font-bold text-xs tracking-widest uppercase group-hover:gap-3 transition-all">
                SHOP NOW <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative aspect-[4/5] bg-stone-100 overflow-hidden cursor-pointer">
            <img src="https://images.unsplash.com/photo-1610030559381-8079bf68fc3e?auto=format&fit=crop&w=800&q=80" alt="Diwali" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/30 to-transparent flex flex-col justify-end p-8 text-center pb-12">
              <h3 className="text-white text-3xl font-serif mb-2 tracking-wide">DIWALI</h3>
              <p className="text-stone-200 text-sm font-medium mb-8">Let Your Festive Glow Begin!</p>
              <div className="flex items-center justify-center gap-2 text-white font-bold text-xs tracking-widest uppercase group-hover:gap-3 transition-all">
                SHOP NOW <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECOND HERO / BRANDING SECTION */}
      <section className="relative w-full h-[60vh] md:h-[75vh] bg-stone-900 overflow-hidden flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614660447190-25e4c026b7ee?auto=format&fit=crop&w=2000&q=80')" }}
        ></div>
        
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-6 md:px-16 text-white text-center md:text-left">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-8 drop-shadow-lg">
            Timeless drapes, <br/> thoughtfully chosen.
          </h2>
          
          <button className="group inline-flex items-center gap-3 border border-white hover:border-white px-8 py-4 text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase transition-all hover:bg-white hover:text-stone-900 backdrop-blur-sm">
            <span>DISCOVER SAREES</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* PRODUCT CATALOG */}
      <section className="bg-white py-24 px-5">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-6">Our Collection</h2>
            <div className="flex items-center justify-center gap-4">
               <div className="w-12 h-[1px] bg-stone-300"></div>
               <img src="/logo.png" className="w-6 h-6 grayscale opacity-40" />
               <div className="w-12 h-[1px] bg-stone-300"></div>
            </div>
          </div>

          {/* MOBILE CATEGORY SCROLL */}
          <div className="lg:hidden flex overflow-x-auto pb-6 -mx-5 px-5 gap-3 snap-x hide-scrollbar mb-8">
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as ProductCategory | "all")}
                className={`snap-center shrink-0 px-6 py-3 rounded-none text-xs font-bold tracking-widest uppercase border transition-all ${
                  activeCategory === cat.id 
                    ? "bg-stone-900 text-white border-stone-900" 
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 animate-pulse">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="aspect-[3/4] bg-stone-100"></div>
              ))}
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-6 md:gap-y-16">
              {displayProducts.map(prod => (
                <div key={prod.id} className="group cursor-pointer">
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] bg-stone-50 mb-4 overflow-hidden">
                    {prod.imageUrl ? (
                      <img 
                        src={prod.imageUrl} 
                        alt={prod.name} 
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-6 text-center">
                        <ShoppingBag className="w-8 h-8 mb-3 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Image</span>
                      </div>
                    )}
                    
                    {/* Hover Add to Cart Button */}
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <button className="w-full bg-white/95 backdrop-blur text-stone-900 py-3 text-xs font-bold tracking-widest uppercase hover:bg-stone-900 hover:text-white transition-colors border border-stone-200">
                        Add to Cart
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="text-center px-2">
                    <h3 className="font-serif text-lg text-stone-900 mb-2 line-clamp-1">{prod.name}</h3>
                    <p className="font-medium text-stone-600 tracking-wide">₹{prod.price.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 font-medium">No products found in this collection.</p>
            </div>
          )}
        </div>
      </section>
      
      {/* INSTAGRAM CAROUSEL SECTION */}
      <section className="bg-stone-50 py-20 border-t border-stone-100">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-serif text-stone-900 mb-2">#RajnandiniStyle</h2>
          <p className="text-stone-500 text-sm font-medium">Follow us on Instagram for daily inspiration</p>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar snap-x w-full">
          {[
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1615886753866-79396abc446e?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1583391733958-d25e07fac044?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1610030559381-8079bf68fc3e?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1615886753866-79396abc446e?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1583391733958-d25e07fac044?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1610030559381-8079bf68fc3e?auto=format&fit=crop&w=400&q=80",
          ].map((url, i) => (
            <div key={i} className="flex-none w-[200px] h-[300px] md:w-[280px] md:h-[420px] snap-center">
              <img src={url} className="w-full h-full object-cover border-r border-white" />
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-stone-200 py-16 md:py-24 px-5 text-center">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="Rajnandini Logo" className="w-20 h-20 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
          </div>
          <h2 className="text-2xl font-serif tracking-[0.2em] uppercase mb-6 text-stone-900">RAJNANDINI</h2>
          <p className="text-sm text-stone-500 mb-12 font-medium max-w-md mx-auto leading-relaxed">
            A modern take on timeless Indian elegance. <br/>
            Near PSC Petropump, Ranipur, Haridwar
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-16">
            <a href="#" className="text-stone-500 hover:text-stone-900 uppercase text-[10px] md:text-xs font-bold tracking-[0.15em] transition">About Us</a>
            <a href="#" className="text-stone-500 hover:text-stone-900 uppercase text-[10px] md:text-xs font-bold tracking-[0.15em] transition">Contact</a>
            <a href="#" className="text-stone-500 hover:text-stone-900 uppercase text-[10px] md:text-xs font-bold tracking-[0.15em] transition">Instagram</a>
            <a href="#" className="text-stone-500 hover:text-stone-900 uppercase text-[10px] md:text-xs font-bold tracking-[0.15em] transition">WhatsApp</a>
          </div>

          <div className="pt-10 border-t border-stone-100">
            <p className="text-[11px] text-stone-400 font-medium tracking-wide">
              &copy; {new Date().getFullYear()} Rajnandini Darshan Enterprises. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
