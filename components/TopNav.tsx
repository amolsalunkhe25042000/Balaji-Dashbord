"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { selectAllRecords } from "@/lib/recordsSlice";
import { isInvoiceRecord } from "@/lib/money";

const READ_KEY = "balaji_crm_read_notifications_v1";

function Icon({ name }: { name: "home" | "plus" | "visits" | "check" | "chart" | "bell" | "settings" | "help" | "menu" | "close" }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    plus: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M12 8v6M9 11h6" /></>,
    visits: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h5M8 16h3" /></>,
    check: <><path d="m5 12 4 4L19 6" /><path d="M4 4h16v16H4z" /></>,
    chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1A1.7 1.7 0 0 0 11.4 6a1.7 1.7 0 0 0 1-1.6V4h2.6v.4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.4V13h-.4a1.7 1.7 0 0 0-1.6 1Z" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 4.1 1.7c-1 .8-1.8 1.2-1.8 2.8M12 17h.01" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function notificationIds(records: ReturnType<typeof selectAllRecords>) {
  return records.flatMap((record) => {
    const ids: string[] = [];
    if (record.status === "enquiry") ids.push(`${record.id}-enquiry`);
    if (record.status === "quotation_sent") ids.push(`${record.id}-approval`);
    if (isInvoiceRecord(record) && ["invoiced", "partially_paid"].includes(record.status)) ids.push(`${record.id}-payment`);
    if (record.status === "approved" || record.status === "paid") ids.push(`${record.id}-update`);
    return ids;
  });
}

export default function TopNav() {
  const pathname = usePathname();
  const brandingName = useAppSelector((state) => state.settings.brandingName);
  const records = useAppSelector(selectAllRecords);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const currentNotificationIds = notificationIds(records);
  const notificationCount = currentNotificationIds.filter((id) => !readIds.includes(id)).length;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(READ_KEY);
      if (stored) setReadIds(JSON.parse(stored) as string[]);
    } catch {
      setReadIds([]);
    }
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const syncReadNotifications = () => {
      try {
        const stored = window.localStorage.getItem(READ_KEY);
        setReadIds(stored ? JSON.parse(stored) as string[] : []);
      } catch {
        setReadIds([]);
      }
    };
    window.addEventListener("crm-notifications-read", syncReadNotifications);
    return () => window.removeEventListener("crm-notifications-read", syncReadNotifications);
  }, []);

  function openNotifications() {
    const next = Array.from(new Set([...readIds, ...currentNotificationIds]));
    setReadIds(next);
    window.localStorage.setItem(READ_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("crm-notifications-read"));
    setMenuOpen(false);
  }

  const navLinks = [
    ["/", "Dashboard", "home"], ["/new", "New job", "plus"], ["/visits", "Customer visits", "visits"], ["/approved", "Approved jobs", "check"], ["/owner", "Owner finance", "chart"],
  ] as const;

  return (
    <header className="no-print app-header text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 flex items-center justify-between gap-4">
        <Link href="/" className="brand-lockup">
          <div className="brand-title">{brandingName}</div>
          <div className="brand-subtitle">Enquiries · Quotations · Invoices · Payments</div>
        </Link>
        <nav className="header-nav" aria-label="Primary navigation">
          <div className="header-desktop-links">
            {navLinks.map(([href, label, icon]) => <Link key={href} href={href} aria-label={label} title={label} className={`header-nav-link ${isActive(href) ? "header-nav-link-active" : ""}`}><Icon name={icon} /></Link>)}
          </div>
          <span className="header-divider" aria-hidden="true" />
          <Link href="/notifications" onClick={openNotifications} className={`header-utility relative ${isActive("/notifications") ? "header-nav-link-active" : ""}`} aria-label={`Notifications${notificationCount ? `, ${notificationCount} pending` : ""}`} title="Notifications">
            <Icon name="bell" />
            {notificationCount > 0 && <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D96272] px-1 text-[9px] font-bold leading-none text-white">{notificationCount > 9 ? "9+" : notificationCount}</span>}
          </Link>
          <Link href="/settings" className={`header-utility ${isActive("/settings") ? "header-nav-link-active" : ""}`} aria-label="Settings" title="Settings">
            <Icon name="settings" />
          </Link>
          <Link href="/help" className={`header-utility ${isActive("/help") ? "header-nav-link-active" : ""}`} aria-label="Help" title="Help">
            <Icon name="help" />
          </Link>
          <span className="header-avatar" aria-label="User profile">B</span>
          <button type="button" className="header-menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Icon name={menuOpen ? "close" : "menu"} /></button>
        </nav>
      </div>
      {menuOpen && <div className="header-mobile-menu">
        <div className="header-mobile-links">{navLinks.map(([href, label, icon]) => <Link key={href} href={href} className={`header-mobile-link ${isActive(href) ? "header-mobile-link-active" : ""}`}><Icon name={icon} /><span>{label}</span></Link>)}</div>
        <div className="header-mobile-links"><Link href="/notifications" onClick={openNotifications} className={`header-mobile-link ${isActive("/notifications") ? "header-mobile-link-active" : ""}`}><Icon name="bell" /><span>Notifications{notificationCount ? ` (${notificationCount})` : ""}</span></Link><Link href="/settings" className={`header-mobile-link ${isActive("/settings") ? "header-mobile-link-active" : ""}`}><Icon name="settings" /><span>Settings</span></Link><Link href="/help" className={`header-mobile-link ${isActive("/help") ? "header-mobile-link-active" : ""}`}><Icon name="help" /><span>Help centre</span></Link></div>
      </div>}
    </header>
  );
}
