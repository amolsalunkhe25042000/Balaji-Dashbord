"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { selectAllRecords } from "@/lib/recordsSlice";
import { computeTotals, fmtMoney, formatDate, isInvoiceRecord } from "@/lib/money";
import { SERVICES } from "@/lib/services";
import { JobRecord } from "@/lib/types";

const READ_KEY = "balaji_crm_read_notifications_v1";
type NotificationFilter = "all" | "action" | "updates";
type NotificationKind = "approval" | "payment" | "enquiry" | "update";

interface CrmNotification {
  id: string;
  recordId: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  date: string;
  href: string;
  accent: string;
}

function buildNotifications(records: JobRecord[]): CrmNotification[] {
  const notifications: CrmNotification[] = [];
  records.forEach((record) => {
    const customer = record.customer.name || "Unnamed customer";
    const service = SERVICES[record.service].label;
    const href = record.invoiceCreated ? `/record/${record.id}/invoice` : `/record/${record.id}/quotation`;
    if (record.status === "enquiry") {
      notifications.push({ id: `${record.id}-enquiry`, recordId: record.id, kind: "enquiry", title: "New enquiry needs attention", detail: `${customer} · ${service}`, date: record.updatedAt, href: "/visits", accent: "#0F8B8D" });
    }
    if (record.status === "quotation_sent") {
      notifications.push({ id: `${record.id}-approval`, recordId: record.id, kind: "approval", title: "Quotation awaiting approval", detail: `${customer} · ${record.quotationNo || "Quotation ready"}`, date: record.updatedAt, href, accent: "#2563EB" });
    }
    if (isInvoiceRecord(record) && ["invoiced", "partially_paid"].includes(record.status)) {
      const balance = computeTotals(record).balanceDue;
      notifications.push({ id: `${record.id}-payment`, recordId: record.id, kind: "payment", title: "Payment follow-up required", detail: `${customer} · Balance ₹ ${fmtMoney(balance)}`, date: record.updatedAt, href: `/record/${record.id}/invoice`, accent: "#D97706" });
    }
    if (record.status === "approved" || record.status === "paid") {
      notifications.push({ id: `${record.id}-update`, recordId: record.id, kind: "update", title: record.status === "approved" ? "Job approved and ready" : "Invoice fully paid", detail: `${customer} · ${service}`, date: record.updatedAt, href, accent: "#059669" });
    }
  });
  return notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const filterLabels: Record<NotificationFilter, string> = { all: "All activity", action: "Needs action", updates: "Updates" };

export default function NotificationsPage() {
  const records = useAppSelector(selectAllRecords);
  const notifications = useMemo(() => buildNotifications(records), [records]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(READ_KEY);
      if (stored) setReadIds(JSON.parse(stored) as string[]);
    } catch {
      setReadIds([]);
    }
  }, []);

  useEffect(() => {
    if (!notifications.length) return;
    const ids = notifications.map((notification) => notification.id);
    setReadIds(ids);
    window.localStorage.setItem(READ_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("crm-notifications-read"));
  }, [notifications]);

  const visibleNotifications = notifications.filter((notification) => filter === "all" || (filter === "action" ? ["approval", "payment", "enquiry"].includes(notification.kind) : notification.kind === "update"));
  const unreadCount = notifications.filter((notification) => !readIds.includes(notification.id)).length;

  function markRead(id: string) {
    setReadIds((current) => {
      const next = current.includes(id) ? current : [...current, id];
      window.localStorage.setItem(READ_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("crm-notifications-read"));
      return next;
    });
  }

  function markAllRead() {
    const ids = notifications.map((notification) => notification.id);
    setReadIds(ids);
    window.localStorage.setItem(READ_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("crm-notifications-read"));
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="relative overflow-hidden rounded-2xl bg-deep px-5 py-7 text-white sm:px-8 sm:py-9">
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[24px] border-water/40" aria-hidden="true" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9FD3D2]">Operations inbox</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Notifications</h1>
            <p className="mt-2 max-w-xl text-sm text-[#D8ECEB]">A focused view of the customer requests, approvals, and payments that deserve your next action.</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-right"><div className="font-display text-2xl font-bold">{unreadCount}</div><div className="text-[10px] uppercase tracking-widest text-[#9FD3D2]">Unread</div></div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Notification filters">
          {(Object.keys(filterLabels) as NotificationFilter[]).map((key) => <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === key ? "bg-deep text-white" : "border border-line bg-white text-muted hover:bg-panel"}`}>{filterLabels[key]}</button>)}
        </div>
        <button type="button" className="btn-outline text-xs" onClick={markAllRead} disabled={!unreadCount}>Mark all as read</button>
      </div>

      <section className="panel overflow-hidden">
        {visibleNotifications.length ? visibleNotifications.map((notification) => {
          const unread = !readIds.includes(notification.id);
          return <Link key={notification.id} href={notification.href} onClick={() => markRead(notification.id)} className={`flex gap-3 border-b border-line p-4 transition last:border-b-0 hover:bg-panel sm:gap-4 ${unread ? "bg-[#F8FBFA]" : "bg-white opacity-75"}`}>
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${notification.accent}18`, color: notification.accent }} aria-hidden="true">{notification.kind === "payment" ? "₹" : notification.kind === "approval" ? "✓" : notification.kind === "enquiry" ? "?" : "•"}</span>
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-deep">{notification.title}</span>{unread && <span className="h-2 w-2 rounded-full bg-water" aria-label="Unread" />}</span><span className="mt-1 block text-xs text-muted">{notification.detail}</span><span className="mt-2 block text-[11px] text-muted">{formatDate(notification.date.slice(0, 10))}</span></span>
            <span className="self-center text-lg text-muted" aria-hidden="true">→</span>
          </Link>;
        }) : <div className="px-5 py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-panel text-2xl text-muted" aria-hidden="true">✓</div><h2 className="mt-3 font-display font-bold text-deep">Nothing in this view</h2><p className="mt-1 text-sm text-muted">New enquiries, approvals, and payment reminders will appear here.</p><Link href="/new" className="btn-primary mt-5 text-xs">Create a new enquiry</Link></div>}
      </section>
    </div>
  );
}