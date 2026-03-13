"use client";

import { useRouter } from "next/navigation";
import EventDetail from "@/components/legacy/EventDetail";
import type { Event } from "@/types";

export default function EventDetailRoute({ event }: { event: Event }) {
  const router = useRouter();
  return <EventDetail event={event} onBack={() => router.push('/events')} onNavigate={() => {}} />;
}
