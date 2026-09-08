"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="no-print app-header text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 flex items-center justify-between gap-4">
        <Link href="/" className="brand-lockup">
          <div className="brand-title">Balaji Paints &amp; Waterproof Service</div>
          <div className="brand-subtitle">Enquiries · Quotations · Invoices · Payments</div>
        </Link>
        <nav className="header-nav" aria-label="Primary navigation">
          <Link
            href="/"
            aria-label="Dashboard"
            title="Dashboard"
            className={`header-nav-link ${isActive("/") ? "header-nav-link-active" : ""}`}
          >
            <span aria-hidden="true">⌂</span>
          </Link>
          <Link
            href="/new"
            aria-label="New job"
            title="New job"
            className={`header-nav-link ${isActive("/new") ? "header-nav-link-active" : ""}`}
          >
            <span aria-hidden="true">▣</span>
          </Link>
          <Link
            href="/visits"
            aria-label="Customer visits"
            title="Customer visits"
            className={`header-nav-link ${isActive("/visits") ? "header-nav-link-active" : ""}`}
          >
            <span aria-hidden="true">◫</span>
          </Link>
          <Link
            href="/approved"
            aria-label="Approved jobs"
            title="Approved jobs"
            className={`header-nav-link ${isActive("/approved") ? "header-nav-link-active" : ""}`}
          >
            <span aria-hidden="true">✓</span>
          </Link>
          <span className="header-divider" aria-hidden="true" />
          <button type="button" className="header-utility" aria-label="Notifications" title="Notifications">
            ♧
          </button>
          <button type="button" className="header-utility" aria-label="Settings" title="Settings">
            ⚙
          </button>
          <button type="button" className="header-utility" aria-label="Help" title="Help">
            ?
          </button>
          <span className="header-avatar" aria-label="User profile">B</span>
        </nav>
      </div>
    </header>
  );
}
