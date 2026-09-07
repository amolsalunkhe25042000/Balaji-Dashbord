import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Balaji Painting Service — Job Manager",
  description: "Enquiries, quotations, invoices and payment tracking for Balaji Painting & Waterproofing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Providers>
          <TopNav />
          <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-5">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
