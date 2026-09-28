import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rajnandni | Darshan Enterprises - POS & Retail Billing",
  description: "Retail Billing, Inventory & Barcode Software for Rajnandni (Darshan Enterprises, Haridwar)",
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
