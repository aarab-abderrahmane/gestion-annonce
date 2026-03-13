"use client";

import { useRouter } from "next/navigation";
import Home from "@/components/legacy/Home";
import type { Announcement, Event, NewsAlert } from "@/types";

export default function HomeRoute({ announcements, newsItems, events }: { announcements: Announcement[]; newsItems: NewsAlert[]; events: Event[] }) {
  const router = useRouter();

  return (
    <Home
      announcements={announcements}
      newsItems={newsItems}
      events={events}
      onNavigate={(page) => {
        if (page === "home") return router.push("/");
        if (page === "announcements") return router.push("/announcements");
        if (page === "important-info") return router.push("/important-info");
        if (page === "events") return router.push("/events");
        if (page.startsWith("event-")) {
          const eventId = page.replace("event-", "");
          const event = events.find((item) => item.id === eventId);
          return router.push(event ? `/events/${encodeURIComponent(event.slug)}` : "/events");
        }
      }}
    />
  );
}
