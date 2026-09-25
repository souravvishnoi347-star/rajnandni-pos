import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rajnandni | Ethnic Studio, Bridal & Beauty Parlour POS",
  description: "Complete Billing, Inventory & Parlour Management Software for Rajnandni Female Ethnic Wear & Bridal Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#faf5f5] text-slate-900">
        {children}
      </body>
    </html>
  );
}
