"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { selectRecordById } from "@/lib/recordsSlice";
import { RootState } from "@/lib/store";

export default function RecordRedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const record = useAppSelector((s: RootState) => selectRecordById(s, params.id));

  useEffect(() => {
    if (!record) return;
    router.replace(record.invoiceCreated ? `/record/${record.id}/invoice` : `/record/${record.id}/quotation`);
  }, [record, router]);

  return <div className="panel p-6 text-center text-muted">Loading…</div>;
}
