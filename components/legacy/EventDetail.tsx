"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import type { Event } from "@/types";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Copy,
  Linkedin,
  MapPin,
  MessageCircle,
  Share2,
  Twitter,
  Users,
  X as CloseIcon,
  ZoomIn,
  Newspaper,
  Tag,
  BookOpen,
} from "lucide-react";
import { IMAGE_BLUR_DATA_URL } from "@/lib/utils";

interface EventDetailProps {
  event: Event;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

type CountdownParts = { days: number; hours: number; minutes: number };
type Person = { id: string; name: string; role: string; image?: string };

/* ── Palette anchored to site's MD3 primary #006A60 ─────────────────── */
const P = {
  primary: "#006A60",
  primaryDark: "#004E47",
  primaryLight: "#9EF2E4",
  primaryContainer: "#CCE8E4",
  surface: "#F4FBF8",
  surfaceLow: "#EFF5F2",
  onSurface: "#191C1C",
  onSurfaceMuted: "#3F4946",
  outline: "#6F7977",
  outlineVariant: "#BEC9C6",
  accent: "#4A6360",
  black: "#0B1110",
};

const PERSON_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='48' fill='%239EF2E4'/><circle cx='48' cy='35' r='18' fill='%23006A60'/><path d='M20 82c6-14 18-22 28-22s22 8 28 22' fill='%23006A60'/></svg>";

function formatDate(value?: string) {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(value?: string) {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getStatus(event: Event) {
  const now = Date.now();
  const start = event.startsAt ? new Date(event.startsAt).getTime() : NaN;
  const end = event.endsAt ? new Date(event.endsAt).getTime() : NaN;

  if (!Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end)
    return { label: "Live Now 🔴", bg: "#B00020", fg: "#FFFFFF" };

  if ((!Number.isNaN(end) && now > end) || (!event.isUpcoming && Number.isNaN(start)))
    return { label: "Ended ✓", bg: "#CCE8E4", fg: "#004E47" };

  return { label: "Upcoming", bg: "#006A60", fg: "#FFFFFF" };
}

function getCountdown(target?: string, nowMs = Date.now()): CountdownParts {
  if (!target) return { days: 0, hours: 0, minutes: 0 };
  const diff = new Date(target).getTime() - nowMs;
  if (Number.isNaN(diff) || diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const totalMinutes = Math.floor(diff / 60000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

function getPeople(event: Event) {
  const organizers = event.organizers ?? event.people?.filter((p) => p.type === "organizer") ?? [];
  const participants = event.participants ?? event.people?.filter((p) => p.type === "participant") ?? [];
  return { organizers, participants };
}

/* ── Small reusable pieces ─────────────────────────────────────────── */

function Divider() {
  return <hr style={{ borderColor: P.outlineVariant, borderTopWidth: 1, margin: "0" }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.28em] mb-4"
      style={{ color: P.primary }}
    >
      {children}
    </p>
  );
}

function FactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 py-3" style={{ borderBottom: `1px solid ${P.outlineVariant}` }}>
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full mt-0.5"
        style={{ background: P.primaryContainer, color: P.primary }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: P.outline }}>
          {label}
        </p>
        <p className="mt-0.5 text-[15px] font-medium leading-6" style={{ color: P.onSurface }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function PersonCard({ person, organizer }: { person: Person; organizer?: boolean }) {
  const avatarSrc = person.image || PERSON_FALLBACK;

  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: `1px solid ${P.outlineVariant}` }}
    >
      <Image
        src={avatarSrc}
        alt={person.name}
        width={48}
        height={48}
        loading="lazy"
        placeholder="blur"
        blurDataURL={PERSON_FALLBACK}
        className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
        style={{ border: `2px solid ${P.primaryContainer}` }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: P.onSurface }}>{person.name}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: P.onSurfaceMuted }}>{person.role}</p>
      </div>
      {organizer && (
        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 rounded-full flex-shrink-0"
          style={{ background: P.primaryContainer, color: P.primary }}
        >
          Organizer
        </span>
      )}
    </div>
  );
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-4xl font-black tabular-nums leading-none"
        style={{ color: "#FFFFFF" }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.26em]" style={{ color: "rgba(255,255,255,0.65)" }}>
        {label}
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────── */
const EventDetail: React.FC<EventDetailProps> = ({ event, onBack }) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const eventUrl = typeof window !== "undefined" ? window.location.href : "";
  const status = getStatus(event);
  const eventType = event.category || event.categories?.[0] || "Event";
  const heroImage = event.gallery?.[0] || event.logo || `https://picsum.photos/seed/${event.id}/1600/1000`;
  const description = event.detailedDescription || event.shortDescription || "No description provided.";
  const { organizers, participants } = getPeople(event);
  const attendeeCount = event.attendeeCount ?? participants.length;
  const countdown = getCountdown(event.startsAt, nowMs);

  const shareOptions = [
    {
      name: "WhatsApp", icon: <MessageCircle size={20} />, color: "#25D366",
      url: `https://wa.me/?text=${encodeURIComponent(event.title + " " + eventUrl)}`
    },
    {
      name: "LinkedIn", icon: <Linkedin size={20} />, color: "#0077B5",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`
    },
    {
      name: "X / Twitter", icon: <Twitter size={20} />, color: "#111827",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(eventUrl)}`
    },
  ];

  const handleCopy = async () => {
    if (!eventUrl || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  useEffect(() => {
    document.body.style.overflow = shareOpen || zoomImg ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [shareOpen, zoomImg]);

  useEffect(() => {
    if (!event.isUpcoming || !event.startsAt) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [event.isUpcoming, event.startsAt]);

  const reportDate = formatDate(event.startsAt || event.date);
  const serif = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(158,242,228,0.18), transparent 28%), linear-gradient(180deg, #F8FEFD 0, #F2F8F6 220px, #EEF4F2 100%)",
        fontFamily: "var(--md-font-brand)",
      }}
    >
      <div style={{ background: P.primaryDark }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.12)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.9)" }}>
            <Newspaper size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.26em]">Event Feature</span>
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.12)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <Share2 size={15} />
            Share
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="relative">
          <div className="relative h-[340px] overflow-hidden rounded-2xl sm:h-[460px] lg:h-[560px]" style={{ boxShadow: "0 24px 90px rgba(0,42,37,0.18)" }}>
            <Image
              src={heroImage}
              alt={event.title}
              fill
              sizes="100vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(0,42,37,0.1) 0%, rgba(0,42,37,0.22) 40%, rgba(0,42,37,0.78) 100%)" }}
            />
            <div className="absolute left-6 right-6 top-6 flex flex-wrap items-center gap-3 sm:left-8 sm:right-8">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ background: status.bg, color: status.fg }}
              >
                {status.label}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ background: "rgba(255,255,255,0.16)", color: "#FFFFFF" }}
              >
                <Tag size={11} />
                {eventType}
              </span>
            </div>
          </div>

          <div
            className="relative z-10 mx-auto -mt-16 max-w-4xl rounded-2xl px-6 py-7 sm:-mt-24 sm:px-8 sm:py-9 lg:px-10"
            style={{
              background: "rgba(248,254,253,0.96)",
              borderTop: `6px solid ${P.primary}`,
              boxShadow: "0 20px 50px rgba(0,42,37,0.12)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: P.outlineVariant }}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: P.outline }}>
                <span>{reportDate}</span>
                {event.location ? <span>{event.location}</span> : null}
                <span>{attendeeCount} attendees</span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: P.primary }}>
                Filed under event report
              </span>
            </div>

            <h1
              className="mt-6 text-4xl font-black leading-[1.02] sm:text-5xl lg:text-6xl"
              style={{ color: P.black, fontFamily: serif, letterSpacing: "-0.03em" }}
            >
              {event.title}
            </h1>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
              <p
                className="text-lg leading-9"
                style={{ color: P.onSurfaceMuted, fontFamily: serif }}
              >
                {description}
              </p>
              <div className="border-t pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0" style={{ borderColor: P.outlineVariant }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: P.primary }}>
                  At a glance
                </p>
                <div className="mt-3 space-y-2 text-sm leading-6" style={{ color: P.onSurfaceMuted }}>
                  <p>Type: <span style={{ color: P.onSurface, fontWeight: 700 }}>{eventType}</span></p>
                  <p>Status: <span style={{ color: P.onSurface, fontWeight: 700 }}>{status.label}</span></p>
                  <p>Schedule: <span style={{ color: P.onSurface, fontWeight: 700 }}>{formatTime(event.startsAt)} - {formatTime(event.endsAt)}</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Article body ────────────────────────────────────────────── */}
        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">

          {/* ── LEFT column ─────────────────────────────────────────── */}
          <div>
            <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="text-[16px] leading-8" style={{ color: P.onSurfaceMuted }}>
                <p>
                  <span
                    className="mr-3 inline-block align-top text-6xl font-black leading-[0.8]"
                    style={{ color: P.primary, fontFamily: serif }}
                  >
                    {description.charAt(0)}
                  </span>
                  {description.slice(1)}
                </p>
              </div>
              <div
                className="border-l pl-5"
                style={{ borderColor: P.outlineVariant }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: P.primary }}>
                  Editorial Note
                </p>
                <p className="mt-3 text-sm leading-7" style={{ color: P.onSurfaceMuted }}>
                  This event page is arranged as a published report: headline, facts, roster,
                  documentation, and timing, in one continuous reading flow.
                </p>
              </div>
            </div>

            <Divider />

            {/* ── Basic information ───────────────────────────────────── */}
            <section className="mt-8">
              <SectionLabel>
                <BookOpen size={12} className="inline-block mr-1.5 mb-0.5" />
                Event Facts
              </SectionLabel>

              <FactRow icon={<CalendarDays size={15} />} label="Start date" value={formatDate(event.startsAt || event.date)} />
              <FactRow icon={<CalendarDays size={15} />} label="End date" value={formatDate(event.endsAt || event.endDate)} />
              <FactRow icon={<Clock3 size={15} />} label="Start time" value={formatTime(event.startsAt)} />
              <FactRow icon={<Clock3 size={15} />} label="End time" value={formatTime(event.endsAt)} />
              <FactRow icon={<MapPin size={15} />} label="Location" value={event.location || "Not specified"} />
              <FactRow icon={<Users size={15} />} label="Total attendees" value={`${attendeeCount} attendees`} />
            </section>

            {/* ── People ─────────────────────────────────────────────── */}
            <section className="mt-10">
              <Divider />
              <div className="mt-8">
                <SectionLabel>Organizers & Participants</SectionLabel>

                {organizers.length > 0 && (
                  <div className="mb-10">
                    <p className="text-sm font-bold mb-1" style={{ color: P.onSurface }}>
                      Organizers
                      <span
                        className="ml-2 px-2 py-0.5 rounded-full text-[11px]"
                        style={{ background: P.primaryContainer, color: P.primary }}
                      >
                        {organizers.length}
                      </span>
                    </p>
                    {organizers.map((p) => <PersonCard key={p.id} person={p} organizer />)}
                  </div>
                )}

                {participants.length > 0 && (
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: P.onSurface }}>
                      Participants
                      <span
                        className="ml-2 px-2 py-0.5 rounded-full text-[11px]"
                        style={{ background: P.primaryContainer, color: P.primary }}
                      >
                        {participants.length}
                      </span>
                    </p>
                    {participants.map((p) => <PersonCard key={p.id} person={p} />)}
                  </div>
                )}

                {!organizers.length && !participants.length && (
                  <p className="text-sm leading-7" style={{ color: P.onSurfaceMuted }}>
                    No people were listed for this event.
                  </p>
                )}
              </div>
            </section>

            {/* ── Photo gallery ──────────────────────────────────────── */}
            {event.gallery?.length ? (
              <section className="mt-10">
                <Divider />
                <div className="mt-8">
                  <SectionLabel>Photo Gallery</SectionLabel>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                    {event.gallery.map((img, i) => {
                      const wide = i === 0 || i % 5 === 0;
                      const tall = i % 4 === 2;
                      return (
                        <button
                          key={`${img}-${i}`}
                          type="button"
                          onClick={() => setZoomImg(img)}
                          className={`group relative overflow-hidden text-left ${wide ? "lg:col-span-7" : "lg:col-span-5"}`}
                          style={{ minHeight: wide ? 320 : tall ? 280 : 210, borderRadius: 16 }}
                        >
                          <Image
                            src={img}
                            alt={`${event.title} photo ${i + 1}`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL={IMAGE_BLUR_DATA_URL}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,42,37,0.65))" }}
                          />
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-3">
                            <p className="text-xs font-semibold text-white/80">Photo {i + 1}</p>
                            <span
                              className="flex h-8 w-8 items-center justify-center rounded-full"
                              style={{ background: "rgba(255,255,255,0.18)" }}
                            >
                              <ZoomIn size={15} className="text-white" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}

            {/* ── Countdown timer ────────────────────────────────────── */}
            {event.isUpcoming ? (
              <section className="mt-10">
                <Divider />
                <div className="mt-8">
                  <SectionLabel>Event Countdown</SectionLabel>

                  <div
                    className="rounded-2xl px-6 py-8 sm:px-10"
                    style={{
                      background: `linear-gradient(135deg, ${P.primary} 0%, ${P.primaryDark} 100%)`,
                      boxShadow: `0 8px 32px rgba(0,106,96,0.30)`,
                    }}
                  >
                    <p className="text-sm leading-7 mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
                      Time remaining until the event begins. Updates automatically.
                    </p>
                    <div className="grid grid-cols-3 gap-6">
                      <CountdownBlock value={countdown.days} label="Days" />
                      <CountdownBlock value={countdown.hours} label="Hours" />
                      <CountdownBlock value={countdown.minutes} label="Minutes" />
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          {/* ── RIGHT sidebar ─────────────────────────────────────────── */}
          <aside className="space-y-8 lg:sticky lg:top-6">
            {/* ── Event brief card ───────────────────────────────── */}
            <div className="rounded-2xl border-t-4 pt-4" style={{ borderColor: P.primary, background: P.surfaceLow }}>
              <div className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: P.primary }}>
                  Event Brief
                </p>
                <h3 className="mt-2 text-2xl font-black leading-tight" style={{ color: P.black, fontFamily: serif }}>
                  Snapshot
                </h3>
                <div className="mt-5 space-y-4 border-t pt-4 text-sm" style={{ borderColor: P.outlineVariant }}>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: P.outline }}>Category</p>
                    <p className="mt-1 font-semibold" style={{ color: P.onSurface }}>{eventType}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: P.outline }}>Status</p>
                    <p className="mt-1 font-semibold" style={{ color: P.onSurface }}>{status.label}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: P.outline }}>Location</p>
                    <p className="mt-1 leading-6 font-semibold" style={{ color: P.onSurface }}>{event.location || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: P.outline }}>Attendance</p>
                    <p className="mt-1 font-semibold" style={{ color: P.onSurface }}>{attendeeCount}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: P.outline }}>Published date</p>
                    <p className="mt-1 leading-6 font-semibold" style={{ color: P.onSurface }}>{reportDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Share button ───────────────────────────────────── */}
            <button
              onClick={() => setShareOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: P.primary, color: "#FFFFFF" }}
            >
              <Share2 size={16} />
              Share this report
            </button>
          </aside>
        </div>
      </div>

      {/* ── Image zoom overlay ──────────────────────────────────────── */}
      {zoomImg ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            className="absolute inset-0"
            style={{ background: "rgba(0,42,37,0.92)" }}
            onClick={() => setZoomImg(null)}
            aria-label="Close image preview"
          />
          <div className="relative z-10 w-full max-w-5xl">
            <button
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              onClick={() => setZoomImg(null)}
              aria-label="Close"
            >
              <CloseIcon size={18} />
            </button>
            <Image
              src={zoomImg}
              alt="Selected event visual"
              width={1600}
              height={1200}
              loading="lazy"
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
              className="max-h-[88vh] w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}

      {/* ── Share modal ─────────────────────────────────────────────── */}
      {shareOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(4px)" }}
            onClick={() => setShareOpen(false)}
          />

          <div
            className="relative z-10 w-full max-w-[500px] rounded-2xl overflow-hidden"
            style={{
              background: P.surface,
              border: `1px solid ${P.outlineVariant}`,
              boxShadow: "0 24px 80px rgba(0,42,37,0.28)",
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ background: P.primary }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: P.primaryLight }}>
                  Share
                </p>
                <h3 className="mt-0.5 text-lg font-black text-white">Share this event</h3>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}
                onClick={() => setShareOpen(false)}
                aria-label="Close"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              {/* Preview */}
              <div
                className="flex items-center gap-3 rounded-xl p-3 mb-5"
                style={{ background: P.surfaceLow, border: `1px solid ${P.outlineVariant}` }}
              >
                <Image
                  src={heroImage}
                  alt={event.title}
                  width={56}
                  height={56}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={IMAGE_BLUR_DATA_URL}
                  className="h-14 w-14 rounded-lg flex-shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: P.onSurface }}>{event.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: P.onSurfaceMuted }}>{eventType}</p>
                </div>
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {shareOptions.map((opt) => (
                  <a
                    key={opt.name}
                    href={opt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 rounded-xl py-4 transition-opacity hover:opacity-85"
                    style={{ background: P.surfaceLow, border: `1px solid ${P.outlineVariant}` }}
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                      style={{ background: opt.color }}
                    >
                      {opt.icon}
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: P.onSurfaceMuted }}>
                      {opt.name}
                    </span>
                  </a>
                ))}
              </div>

              {/* Copy link */}
              <label className="block text-[11px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: P.outline }}>
                Event link
              </label>
              <div
                className="flex items-center gap-2 rounded-xl overflow-hidden"
                style={{ border: `1px solid ${P.outlineVariant}`, background: P.surfaceLow }}
              >
                <input
                  type="text"
                  value={eventUrl}
                  readOnly
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                  style={{ color: P.onSurfaceMuted }}
                />
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-r-xl transition-opacity hover:opacity-90"
                  style={{ background: P.primary, color: "#FFFFFF", flexShrink: 0 }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null
      }
    </div >
  );
};

export default EventDetail;
