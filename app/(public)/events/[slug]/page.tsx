"use client";

import { useParams, useRouter } from "next/navigation";
import EventDetail from "@/components/legacy/EventDetail";
import { findEventBySlug } from "@/lib/mock-data";

export default function Page() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const event = findEventBySlug(decodeURIComponent(params.slug));

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-[28px] p-8" style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}>
          <h1 className="md-headline-medium mb-3">الفعالية غير موجودة</h1>
          <button onClick={() => router.push("/events")} className="md-btn md-btn-filled">العودة إلى الفعاليات</button>
        </div>
      </div>
    );
  }

  return <EventDetail event={event} onBack={() => router.push("/events")} onNavigate={() => {}} />;
}
