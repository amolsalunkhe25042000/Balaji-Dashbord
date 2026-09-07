"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="no-print bg-[#08222E] text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-bold tracking-wide">Balaji Painting Service</div>
          <div className="text-[11px] text-[#8FB0AE]">Enquiries · Quotations · Invoices · Payments</div>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`px-3 py-2 rounded-md text-sm font-semibold ${
              isActive("/") ? "bg-water text-white" : "text-[#C9DEDD] hover:bg-white/10"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/new"
            className={`px-3 py-2 rounded-md text-sm font-semibold ${
              isActive("/new") ? "bg-water text-white" : "text-[#C9DEDD] hover:bg-white/10"
            }`}
          >
            + New job
          </Link>
        </nav>
      </div>
    </header>
  );
}
