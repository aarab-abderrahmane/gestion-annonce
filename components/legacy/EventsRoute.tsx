"use client";

import { useRouter } from "next/navigation";
import Events from "@/components/legacy/Events";
import type { Event } from "@/types";

export default function EventsRoute({ events }: { events: Event[] }) {
  const router = useRouter();

  return (
    <Events
      events={events}
      onNavigate={(page) => {
        if (page.startsWith("event-")) {
          const eventId = page.replace("event-", "");
          const event = events.find((item) => item.id === eventId);
          return router.push(event ? `/events/${encodeURIComponent(event.slug)}` : "/events");
        }
        router.push(page === "events" ? "/events" : "/");
      }}
    />
  );
}
