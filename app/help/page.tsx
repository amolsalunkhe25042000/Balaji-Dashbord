"use client";

import Link from "next/link";
import { useAppSelector } from "@/lib/hooks";

const statuses = [
  ["Enquiry", "A customer request that has not been printed as a quotation yet.", "bg-slate-400"],
  ["Quotation sent", "A quotation has been printed and is waiting for the customer's decision.", "bg-blue-500"],
  ["Approved", "The customer accepted the quotation and work can begin.", "bg-cyan-600"],
  ["Invoiced", "An invoice exists but no payment has been recorded.", "bg-amber-500"],
  ["Partially paid", "A payment was received and a balance is still open.", "bg-orange-500"],
  ["Paid", "The invoice balance is fully settled.", "bg-emerald-600"],
  ["Closed", "The work is delivered and archived from the active pipeline.", "bg-slate-700"],
  ["Request closed", "The enquiry did not convert into a job.", "bg-red-700"],
];

const faqs = [
  ["Where is my data stored?", "Records and dashboard settings are stored in this browser's local storage. Keep a backup of important quotations and invoices, especially before clearing browser data."],
  ["Can I change a job after saving it?", "Yes. Open the job from Approved jobs or a recent-work row, update the details, and save the changes from that record page."],
  ["Why did my dashboard layout change?", "Dashboard visibility, management panels, status filters, and Operations matrix columns are controlled from Settings. Reset settings restores every available section."],
  ["What happens when I switch service?", "Painting and Waterproofing have different templates, defaults, numbering prefixes, and terms. If the current job has edits, the switch modal asks you to confirm before clearing them."],
];

export default function HelpPage() {
  const brandingName = useAppSelector((state) => state.settings.brandingName);

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-deep px-5 py-8 text-white sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-[#0F8B8D]/40" aria-hidden="true" />
        <div className="absolute -bottom-24 right-24 h-44 w-44 rounded-full border-[22px] border-[#D9622B]/25" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9FD3D2]">Help centre</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Run every job with confidence.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#D8ECEB]">A practical guide to {brandingName}: from the first customer visit to a paid and closed job.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/new" className="btn bg-white text-deep hover:bg-[#E7F3F2]">Create a new job</Link>
            <Link href="/settings" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">Open settings</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">Recommended flow</p>
          <h2 className="font-display text-2xl font-bold text-deep">From enquiry to payment</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            ["01", "Choose a service", "Start a new job and select Painting or Waterproofing. Each service loads its own work items, terms, and document numbering."],
            ["02", "Capture the visit", "Add the customer, site, scope, quantities, rates, discount, GST, and payment terms. Save as an enquiry when details are still being collected."],
            ["03", "Send the quotation", "Use Save & print quotation. The quotation number is generated only when you print, keeping numbering clean."],
            ["04", "Track the outcome", "Move through approval, invoice, payments, and closure. The dashboard and Approved jobs view update from the same live records."],
          ].map(([number, title, text]) => (
            <article key={number} className="panel p-4">
              <span className="font-mono text-sm font-bold text-water">{number}</span>
              <h3 className="mt-3 font-display font-bold text-deep">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">Pipeline reference</p>
            <h2 className="font-display text-2xl font-bold text-deep">What each status means</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {statuses.map(([title, text, color]) => (
              <div key={title} className="flex gap-3 rounded-lg border border-line bg-panel p-3">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} aria-hidden="true" />
                <div><h3 className="text-sm font-bold text-deep">{title}</h3><p className="mt-1 text-xs leading-relaxed text-muted">{text}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-paint">Service guide</p>
          <h2 className="font-display text-2xl font-bold text-deep">Two teams, one workspace</h2>
          <div className="mt-5 flex flex-col gap-3">
            <div className="rounded-lg border-l-4 border-[#D9622B] bg-[#FFF3ED] p-4"><h3 className="font-display font-bold text-deep">Painting</h3><p className="mt-1 text-xs leading-relaxed text-muted">Interior, exterior, texture, wood, metal, putty, primer, and finishing work. Uses the P quotation and invoice numbering family.</p></div>
            <div className="rounded-lg border-l-4 border-water bg-[#E7F3F2] p-4"><h3 className="font-display font-bold text-deep">Waterproofing</h3><p className="mt-1 text-xs leading-relaxed text-muted">Terrace, bathroom, tank, basement, leakage, grouting, and membrane work. Uses the W numbering family and waterproofing terms.</p></div>
          </div>
          <div className="mt-5 rounded-lg border border-line p-4"><h3 className="text-sm font-bold text-deep">Switching service?</h3><p className="mt-1 text-xs leading-relaxed text-muted">The switch dialog protects your current draft. Choose Keep editing to stay, or Switch and clear to load a fresh template for the other service.</p></div>
        </section>
      </div>

      <section className="panel p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">Dashboard and settings</p><h2 className="font-display text-2xl font-bold text-deep">Make the workspace fit your day</h2></div>
          <Link href="/settings" className="btn-outline text-xs">Configure dashboard</Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-panel p-4"><h3 className="font-display font-bold text-deep">Branding</h3><p className="mt-1 text-xs leading-relaxed text-muted">Change the workspace name shown in the navigation and dashboard heading.</p></div>
          <div className="rounded-lg bg-panel p-4"><h3 className="font-display font-bold text-deep">Visibility</h3><p className="mt-1 text-xs leading-relaxed text-muted">Show only the stat cards, charts, and recent-work sections your team actually uses.</p></div>
          <div className="rounded-lg bg-panel p-4"><h3 className="font-display font-bold text-deep">Data management</h3><p className="mt-1 text-xs leading-relaxed text-muted">Select one or multiple records in Settings to delete old or test data permanently.</p></div>
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-water">Common questions</p>
        <h2 className="font-display text-2xl font-bold text-deep">Quick answers</h2>
        <div className="mt-4 divide-y divide-line">
          {faqs.map(([question, answer]) => <details key={question} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-deep"><span>{question}</span><span className="text-xl font-normal text-water transition group-open:rotate-45" aria-hidden="true">+</span></summary><p className="max-w-3xl pt-3 text-xs leading-relaxed text-muted">{answer}</p></details>)}
        </div>
      </section>
    </div>
  );
}