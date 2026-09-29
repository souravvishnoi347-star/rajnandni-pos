import type { Metadata } from "next";
import { Cinzel, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RAJNANDNI | Darshan Enterprises — Luxury Retail POS & Billing",
  description: "Flagship Retail Billing, Inventory & Barcode Software for Rajnandni (Darshan Enterprises, Haridwar)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen bg-[#f8f5f0] text-stone-900 selection:bg-amber-400 selection:text-stone-950">
        {children}
      </body>
    </html>
  );
}
