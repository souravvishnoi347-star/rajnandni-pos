import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAJNANDINI | Haute Couture & Bridal Atelier POS",
  description: "Atelier Couture POS & ERP — Flagship Retail Billing, Inventory, Barcode & CRM Suite for Rajnandini (Darshan Enterprises, Haridwar)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#fef8f7] text-[#1d1b1b] selection:bg-[#5a1e2d] selection:text-white">
        {children}
      </body>
    </html>
  );
}
