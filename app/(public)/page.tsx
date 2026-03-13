"use client";

import { useRouter } from "next/navigation";
import Home from "@/components/legacy/Home";
import { MOCK_EVENTS } from "@/lib/mock-data";

export default function Page() {
  const router = useRouter();

  return (
    <Home
      onNavigate={(page) => {
        if (page === "home") return router.push("/");
        if (page === "announcements") return router.push("/announcements");
        if (page === "important-info") return router.push("/important-info");
        if (page === "events") return router.push("/events");
        if (page.startsWith("event-")) {
          const eventId = page.replace("event-", "");
          const event = MOCK_EVENTS.find((item) => item.id === eventId);
          router.push(event ? `/events/${encodeURIComponent((event as any).slug ?? eventId)}` : "/events");
        }
      }}
    />
  );
}
