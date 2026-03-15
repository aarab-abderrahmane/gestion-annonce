"use client";

import React, { useEffect, useState } from "react";
import { Event } from "@/types";
import {
  CalendarDays,
  Clock3,
  Copy,
  MapPin,
  MessageCircle,
  Share2,
  Ticket,
  Users,
  X as CloseIcon,
  Check,
  ChevronLeft,
  Linkedin,
  Twitter,
  ZoomIn,
  Timer,
} from "lucide-react";

interface EventDetailProps {
  event: Event;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

type CountdownParts = { days: number; hours: number; minutes: number };

const PERSON_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='48' fill='%23CCE8E4'/><circle cx='48' cy='36' r='18' fill='%234A6360'/><path d='M20 82c6-14 18-22 28-22s22 8 28 22' fill='%234A6360'/></svg>";

/* ─── helpers ─── */
function formatDate(value?: string) {
  if (!value) return "Not specified";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatTime(value?: string) {
  if (!value) return "Not specified";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getStatus(event: Event) {
  const now = Date.now();
  const start = event.startsAt ? new Date(event.startsAt).getTime() : NaN;
  const end = event.endsAt ? new Date(event.endsAt).getTime() : NaN;
  if (!isNaN(start) && !isNaN(end) && now >= start && now <= end) {
    return { label: "Live Now 🔴", bg: "rgba(220,38,38,0.16)", color: "#dc2626", border: "1px solid rgba(248,113,113,0.4)" };
  }
  if ((!isNaN(end) && now > end) || (!event.isUpcoming && isNaN(start))) {
    return { label: "Ended ✓", bg: "rgba(21,128,61,0.16)", color: "#15803d", border: "1px solid rgba(74,222,128,0.35)" };
  }
  return { label: "Upcoming", bg: "rgba(245,158,11,0.16)", color: "#d97706", border: "1px solid rgba(251,191,36,0.35)" };
}

function getCountdown(target?: string, nowMs = Date.now()): CountdownParts {
  if (!target) return { days: 0, hours: 0, minutes: 0 };
  const diff = new Date(target).getTime() - nowMs;
  if (isNaN(diff) || diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const totalMin = Math.floor(diff / 60000);
  return {
    days: Math.floor(totalMin / 1440),
    hours: Math.floor((totalMin % 1440) / 60),
    minutes: totalMin % 60,
  };
}

function getPeople(event: Event) {
  const organizers =
    event.organizers ?? event.people?.filter((p) => p.type === "organizer") ?? [];
  const participants =
    event.participants ?? event.people?.filter((p) => p.type === "participant") ?? [];
  return { organizers, participants };
}

/* ─── sub-components ─── */
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-6">
      <p
        className="md-label-medium mb-1 uppercase tracking-widest"
        style={{ color: "var(--md-primary)" }}
      >
        {label}
      </p>
      <h2 className="md-headline-small" style={{ color: "var(--md-on-surface)" }}>
        {title}
      </h2>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article
      className="flex flex-col gap-3 rounded-[20px] p-5"
      style={{
        background: "var(--md-surface-container)",
        border: "1px solid var(--md-outline-variant)",
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: "var(--md-secondary-container)",
          color: "var(--md-on-secondary-container)",
        }}
      >
        {icon}
      </div>
      <div>
        <p className="md-label-small mb-0.5" style={{ color: "var(--md-on-surface-variant)" }}>
          {label}
        </p>
        <p className="md-title-small" style={{ color: "var(--md-on-surface)" }}>
          {value}
        </p>
      </div>
    </article>
  );
}

function PersonCard({ person }: { person: { id: string; name: string; role: string; image?: string } }) {
  return (
    <article
      className="flex items-center gap-4 rounded-[20px] p-4"
      style={{
        background: "var(--md-surface-container)",
        border: "1px solid var(--md-outline-variant)",
      }}
    >
      <img
        src={person.image || PERSON_FALLBACK}
        alt={person.name}
        className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
        style={{ border: "2px solid var(--md-outline-variant)" }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PERSON_FALLBACK; }}
      />
      <div className="min-w-0">
        <p className="md-title-small truncate" style={{ color: "var(--md-on-surface)" }}>
          {person.name}
        </p>
        <p className="md-body-small mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>
          {person.role}
        </p>
      </div>
    </article>
  );
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[24px] py-6 px-4"
      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)" }}
    >
      <span
        className="md-display-small font-extrabold tabular-nums"
        style={{ lineHeight: 1 }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span
        className="md-label-small mt-2 uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.65)" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── main component ─── */
const EventDetail: React.FC<EventDetailProps> = ({ event, onBack }) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const eventUrl = typeof window !== "undefined" ? window.location.href : "";
  const status = getStatus(event);
  const eventType = event.category || event.categories?.[0] || "Event";
  const heroImage =
    event.gallery?.[0] || event.logo || `https://picsum.photos/seed/${event.id}/1600/900`;
  const { organizers, participants } = getPeople(event);
  const attendeeCount = event.attendeeCount ?? participants.length;
  const isUpcoming = status.label === "Upcoming";
  const countdown = getCountdown(event.startsAt, nowMs);

  const handleCopy = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <MessageCircle size={22} />,
      color: "#25D366",
      url: `https://wa.me/?text=${encodeURIComponent(event.title + " " + eventUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: <Linkedin size={22} />,
      color: "#0077B5",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
    },
    {
      name: "X",
      icon: <Twitter size={22} />,
      color: "#111827",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(eventUrl)}`,
    },
  ];

  useEffect(() => {
    document.body.style.overflow = shareOpen || zoomImg ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [shareOpen, zoomImg]);

  useEffect(() => {
    if (!isUpcoming || !event.startsAt) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [event.startsAt, isUpcoming]);

  return (
    <div style={{ background: "var(--md-surface)", minHeight: "100vh", paddingBottom: "96px" }}>

      {/* ═══════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: 520, borderRadius: "0 0 40px 40px", background: "#07110c" }}
      >
        {/* hero image */}
        <img
          src={heroImage}
          alt={event.title}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.68 }}
        />
        {/* gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,17,12,0.25) 0%, rgba(7,17,12,0.5) 40%, rgba(7,17,12,0.92) 100%)",
          }}
        />
        {/* ambient blobs */}
        <div
          className="pointer-events-none absolute -left-16 top-16 h-60 w-60 rounded-full"
          style={{ background: "rgba(128,216,198,0.2)", filter: "blur(40px)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full"
          style={{ background: "rgba(212,227,255,0.12)", filter: "blur(48px)" }}
        />

        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-5xl flex-col px-4 py-6 md:px-8">
          {/* top bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
              Back
            </button>

            <button
              className="md-icon-btn"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                width: 44,
                height: 44,
              }}
              onClick={() => setShareOpen(true)}
              aria-label="Share event"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* title & badges */}
          <div className="mt-auto pt-16">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {/* event type chip */}
              <span
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {eventType}
              </span>
              {/* status chip */}
              <span
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
                style={{
                  background: status.bg,
                  color: status.color,
                  border: status.border,
                  backdropFilter: "blur(8px)",
                }}
              >
                {status.label}
              </span>
            </div>

            <h1
              className="mb-5 font-extrabold leading-tight text-white"
              style={{ fontSize: "clamp(28px,5vw,52px)", lineHeight: 1.15 }}
            >
              {event.title}
            </h1>

            {/* quick meta pills */}
            <div className="flex flex-wrap gap-2 text-sm text-white/85">
              <span
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <CalendarDays size={14} />
                {formatDate(event.startsAt || event.date)}
              </span>
              {event.location && (
                <span
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
                >
                  <MapPin size={14} />
                  {event.location}
                </span>
              )}
              <span
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <Users size={14} />
                {attendeeCount} attendees
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CONTENT AREA
      ═══════════════════════════════════════════════ */}
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8 md:py-10">

        {/* ─── SECTION 2 — Basic Information ─── */}
        <section
          className="rounded-[28px] p-6 md:p-8"
          style={{
            background: "var(--md-surface-container-low)",
            border: "1px solid var(--md-outline-variant)",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <SectionHeader label="Overview" title="Event Information" />
            <button
              className="md-btn md-btn-filled hidden shrink-0 md:flex"
              style={{ gap: 8 }}
            >
              <Ticket size={17} />
              Register
            </button>
          </div>

          {/* description */}
          {(event.detailedDescription || event.shortDescription) && (
            <p
              className="md-body-large mb-6 max-w-3xl leading-relaxed"
              style={{ color: "var(--md-on-surface-variant)" }}
            >
              {event.detailedDescription || event.shortDescription}
            </p>
          )}

          {/* info cards grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <InfoCard icon={<CalendarDays size={17} />} label="Start date" value={formatDate(event.startsAt || event.date)} />
            <InfoCard icon={<CalendarDays size={17} />} label="End date" value={formatDate(event.endsAt || event.endDate)} />
            <InfoCard icon={<Clock3 size={17} />} label="Start time" value={formatTime(event.startsAt)} />
            <InfoCard icon={<Clock3 size={17} />} label="End time" value={formatTime(event.endsAt)} />
            <InfoCard icon={<MapPin size={17} />} label="Location" value={event.location || "Not specified"} />
          </div>

          {/* attendee highlight */}
          <div
            className="mt-4 flex items-center justify-between rounded-[20px] px-6 py-5"
            style={{
              background: "linear-gradient(135deg, var(--md-primary-container), var(--md-tertiary-container))",
            }}
          >
            <div>
              <p
                className="md-label-small mb-1 uppercase tracking-widest"
                style={{ color: "var(--md-on-primary-container)" }}
              >
                Total Attendees
              </p>
              <p
                className="md-display-small font-extrabold"
                style={{ color: "var(--md-on-primary-container)" }}
              >
                {attendeeCount}
              </p>
            </div>
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(0,0,0,0.08)" }}
            >
              <Users size={28} style={{ color: "var(--md-on-primary-container)" }} />
            </div>
          </div>
        </section>

        {/* ─── SECTION 3 — People ─── */}
        {(organizers.length > 0 || participants.length > 0) && (
          <section
            className="rounded-[28px] p-6 md:p-8"
            style={{
              background: "var(--md-surface-container-low)",
              border: "1px solid var(--md-outline-variant)",
            }}
          >
            <SectionHeader label="People" title="Organizers & Participants" />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Organizers */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="md-title-medium" style={{ color: "var(--md-on-surface)" }}>
                    Organizers
                  </h3>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: "var(--md-secondary-container)",
                      color: "var(--md-on-secondary-container)",
                    }}
                  >
                    {organizers.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {organizers.length > 0 ? (
                    organizers.map((p) => <PersonCard key={p.id} person={p} />)
                  ) : (
                    <p className="md-body-medium rounded-[16px] p-4" style={{ color: "var(--md-on-surface-variant)", background: "var(--md-surface-container)" }}>
                      No organizers listed.
                    </p>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="md-title-medium" style={{ color: "var(--md-on-surface)" }}>
                    Participants
                  </h3>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: "var(--md-tertiary-container)",
                      color: "var(--md-on-tertiary-container)",
                    }}
                  >
                    {participants.length}
                  </span>
                  {participants.length > 0 && (
                    <span
                      className="ml-auto text-xs"
                      style={{ color: "var(--md-on-surface-variant)" }}
                    >
                      Total: {participants.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {participants.length > 0 ? (
                    participants.slice(0, 6).map((p) => <PersonCard key={p.id} person={p} />)
                  ) : (
                    <p className="md-body-medium rounded-[16px] p-4" style={{ color: "var(--md-on-surface-variant)", background: "var(--md-surface-container)" }}>
                      No participants listed.
                    </p>
                  )}
                  {participants.length > 6 && (
                    <p
                      className="md-label-medium text-center"
                      style={{ color: "var(--md-primary)" }}
                    >
                      +{participants.length - 6} more participants
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── SECTION 4 — Photo Gallery ─── */}
        {event.gallery && event.gallery.length > 0 && (
          <section
            className="rounded-[28px] p-6 md:p-8"
            style={{
              background: "var(--md-surface-container-low)",
              border: "1px solid var(--md-outline-variant)",
            }}
          >
            <SectionHeader label="Photo Gallery" title="Moments from the Event" />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {event.gallery.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setZoomImg(img)}
                  className="group relative overflow-hidden rounded-[20px] text-left"
                  style={{ aspectRatio: "4/3", cursor: "zoom-in" }}
                >
                  <img
                    src={img}
                    alt={`${event.title} — photo ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                    style={{ transition: "transform 500ms ease" }}
                  />
                  {/* overlay on hover */}
                  <div
                    className="absolute inset-0 flex flex-col items-end justify-between p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.68) 100%)" }}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
                    >
                      <ZoomIn size={16} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-white/90">Photo {i + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ─── SECTION 5 — Countdown (Upcoming only) ─── */}
        {isUpcoming && (
          <section
            className="relative overflow-hidden rounded-[28px] p-6 md:p-8"
            style={{
              background: "linear-gradient(135deg, #0a1f16 0%, #102e22 50%, #0d2030 100%)",
              color: "white",
            }}
          >
            {/* decorative blobs */}
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full"
              style={{ background: "rgba(128,216,198,0.12)", filter: "blur(32px)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full"
              style={{ background: "rgba(212,227,255,0.08)", filter: "blur(28px)" }}
            />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Timer size={18} style={{ color: "rgba(128,216,198,0.8)" }} />
                  <p
                    className="md-label-medium uppercase tracking-widest"
                    style={{ color: "rgba(128,216,198,0.8)" }}
                  >
                    Countdown
                  </p>
                </div>
                <h2 className="md-headline-small mb-1">Time Until Event Starts</h2>
                <p className="md-body-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Based on the scheduled start time
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 md:min-w-[340px]">
                <CountdownBox value={countdown.days} label="Days" />
                <CountdownBox value={countdown.hours} label="Hours" />
                <CountdownBox value={countdown.minutes} label="Minutes" />
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ─── bottom CTA bar (mobile) ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex gap-3 p-4 md:hidden"
        style={{
          background: "var(--md-surface-container-high)",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.10)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          className="md-btn md-btn-filled flex-1"
          style={{ height: 52 }}
        >
          <Ticket size={17} />
          Register
        </button>
        <button
          className="md-icon-btn md-icon-btn-tonal"
          style={{ width: 52, height: 52 }}
          onClick={() => setShareOpen(true)}
          aria-label="Share event"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* ─── Image lightbox ─── */}
      {zoomImg && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            className="absolute inset-0"
            style={{ background: "rgba(4,12,9,0.88)", cursor: "zoom-out" }}
            onClick={() => setZoomImg(null)}
            aria-label="Close image preview"
          />
          <div className="relative z-10 w-full max-w-5xl">
            <button
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", cursor: "pointer" }}
              onClick={() => setZoomImg(null)}
              aria-label="Close image preview"
            >
              <CloseIcon size={18} />
            </button>
            <img
              src={zoomImg}
              alt="Selected event photo"
              className="max-h-[88vh] w-full rounded-[28px] object-contain"
            />
          </div>
        </div>
      )}

      {/* ─── Share dialog ─── */}
      {shareOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.36)", backdropFilter: "blur(4px)" }}
            onClick={() => setShareOpen(false)}
          />
          <div
            className="md-dialog relative w-full max-w-[480px]"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.24)" }}
          >
            {/* header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="md-label-small mb-0.5 uppercase tracking-widest" style={{ color: "var(--md-primary)" }}>
                  Share
                </p>
                <h3 className="md-title-large" style={{ color: "var(--md-on-surface)" }}>
                  Share this event
                </h3>
              </div>
              <button
                className="md-icon-btn"
                onClick={() => setShareOpen(false)}
                aria-label="Close share dialog"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div style={{ height: 1, background: "var(--md-outline-variant)", margin: "0 -4px 20px" }} />

            {/* event preview */}
            <div
              className="mb-5 flex items-center gap-4 rounded-[16px] p-4"
              style={{ background: "var(--md-surface-container)" }}
            >
              <img
                src={heroImage}
                className="h-14 w-14 flex-shrink-0 rounded-[12px] object-cover"
                alt={event.title}
              />
              <div className="min-w-0">
                <p className="md-title-small truncate" style={{ color: "var(--md-on-surface)" }}>
                  {event.title}
                </p>
                <p className="md-body-small mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>
                  {eventType}
                </p>
              </div>
            </div>

            {/* share options */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              {shareOptions.map((opt) => (
                <a
                  key={opt.name}
                  href={opt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-[18px] text-white"
                    style={{ background: opt.color }}
                  >
                    {opt.icon}
                  </div>
                  <span className="md-label-small" style={{ color: "var(--md-on-surface-variant)" }}>
                    {opt.name}
                  </span>
                </a>
              ))}
            </div>

            {/* copy link */}
            <label className="md-label-small mb-2 block" style={{ color: "var(--md-on-surface-variant)" }}>
              Event link
            </label>
            <div
              className="flex items-center gap-2 rounded-[14px] p-1.5"
              style={{ background: "var(--md-surface-container)", border: "1px solid var(--md-outline-variant)" }}
            >
              <input
                type="text"
                readOnly
                value={eventUrl}
                className="flex-1 bg-transparent px-2 py-1 outline-none text-sm"
                style={{ color: "var(--md-on-surface-variant)" }}
              />
              <button
                onClick={handleCopy}
                className="md-btn md-btn-tonal"
                style={{ height: 36, padding: "0 16px", fontSize: 13 }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
