"use client";

import { useRouter } from "next/navigation";
import Events from "@/components/legacy/Events";
import { MOCK_EVENTS } from "@/lib/mock-data";

export default function Page() {
  const router = useRouter();

  return (
    <Events
      onNavigate={(page) => {
        if (page.startsWith("event-")) {
          const eventId = page.replace("event-", "");
          const event = MOCK_EVENTS.find((item) => item.id === eventId);
          router.push(event ? `/events/${encodeURIComponent((event as any).slug ?? eventId)}` : "/events");
          return;
        }
        router.push(page === "events" ? "/events" : "/");
      }}
    />
  );
}
