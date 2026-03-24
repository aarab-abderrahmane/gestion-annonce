"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Wifi, WifiOff } from "lucide-react";

type NetworkQuality = "good" | "fair" | "slow" | "offline";

type NetworkState = {
  quality: NetworkQuality;
  label: string;
  hint: string;
  latencyMs: number | null;
  effectiveType: string | null;
};

type NavigatorConnection = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

const DEFAULT_STATE: NetworkState = {
  quality: "good",
  label: "الشبكة جيدة",
  hint: "قياس الاتصال...",
  latencyMs: null,
  effectiveType: null,
};

const VISIBILITY_STORAGE_KEY = "network-indicator-visible";

function getNavigatorConnection() {
  if (typeof navigator === "undefined") return null;

  return (
    (navigator as Navigator & {
      connection?: NavigatorConnection;
      mozConnection?: NavigatorConnection;
      webkitConnection?: NavigatorConnection;
    }).connection ??
    (navigator as Navigator & { mozConnection?: NavigatorConnection }).mozConnection ??
    (navigator as Navigator & { webkitConnection?: NavigatorConnection }).webkitConnection ??
    null
  );
}

function formatConnectionHint({
  latencyMs,
  effectiveType,
}: {
  latencyMs: number | null;
  effectiveType: string | null;
}) {
  const parts: string[] = [];

  if (effectiveType) {
    parts.push(effectiveType.toUpperCase());
  }

  if (latencyMs !== null) {
    parts.push(`${latencyMs}ms`);
  }

  return parts.length > 0 ? parts.join(" • ") : "مراقبة الاتصال";
}

function resolveNetworkState({
  online,
  latencyMs,
  connection,
}: {
  online: boolean;
  latencyMs: number | null;
  connection: NavigatorConnection | null;
}): NetworkState {
  if (!online) {
    return {
      quality: "offline",
      label: "غير متصل",
      hint: "تحقق من الاتصال بالإنترنت",
      latencyMs,
      effectiveType: null,
    };
  }

  const effectiveType = connection?.effectiveType ?? null;
  const downlink = connection?.downlink ?? null;
  const rtt = connection?.rtt ?? null;
  const saveData = Boolean(connection?.saveData);

  const measuredLatency = latencyMs ?? rtt ?? null;
  const slowByConnection =
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    (typeof downlink === "number" && downlink < 0.8) ||
    (typeof rtt === "number" && rtt >= 650) ||
    saveData;
  const fairByConnection =
    effectiveType === "3g" ||
    (typeof downlink === "number" && downlink < 1.5) ||
    (typeof rtt === "number" && rtt >= 350);

  if (slowByConnection || (measuredLatency !== null && measuredLatency >= 1200)) {
    return {
      quality: "slow",
      label: "الشبكة بطيئة",
      hint: formatConnectionHint({ latencyMs: measuredLatency, effectiveType }),
      latencyMs: measuredLatency,
      effectiveType,
    };
  }

  if (fairByConnection || (measuredLatency !== null && measuredLatency >= 500)) {
    return {
      quality: "fair",
      label: "الشبكة متوسطة",
      hint: formatConnectionHint({ latencyMs: measuredLatency, effectiveType }),
      latencyMs: measuredLatency,
      effectiveType,
    };
  }

  return {
    quality: "good",
    label: "الشبكة جيدة",
    hint: formatConnectionHint({ latencyMs: measuredLatency, effectiveType }),
    latencyMs: measuredLatency,
    effectiveType,
  };
}

async function measureLatency(signal: AbortSignal) {
  const startedAt = performance.now();
  const response = await fetch(`/robots.txt?ts=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Latency probe failed");
  }

  return Math.round(performance.now() - startedAt);
}

function getIndicatorColors(quality: NetworkQuality) {
  if (quality === "offline") {
    return {
      background: "var(--md-error-container)",
      color: "var(--md-on-error-container)",
      dot: "var(--md-error)",
      borderColor: "color-mix(in srgb, var(--md-error) 22%, transparent)",
    };
  }

  if (quality === "slow") {
    return {
      background: "var(--md-warning-container)",
      color: "var(--md-on-warning-container)",
      dot: "#B06200",
      borderColor: "rgba(176, 98, 0, 0.22)",
    };
  }

  if (quality === "fair") {
    return {
      background: "var(--md-tertiary-container)",
      color: "var(--md-on-tertiary-container)",
      dot: "var(--md-tertiary)",
      borderColor: "color-mix(in srgb, var(--md-tertiary) 20%, transparent)",
    };
  }

  return {
    background: "var(--md-primary-container)",
    color: "var(--md-on-primary-container)",
    dot: "var(--md-primary)",
    borderColor: "color-mix(in srgb, var(--md-primary) 20%, transparent)",
  };
}

function getStoredVisibilityPreference() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const storedValue = window.localStorage.getItem(VISIBILITY_STORAGE_KEY);
    return storedValue === null ? true : storedValue === "true";
  } catch {
    return true;
  }
}

export default function NetworkIndicator() {
  const [networkState, setNetworkState] = useState<NetworkState>(DEFAULT_STATE);
  const [isIndicatorVisible, setIsIndicatorVisible] = useState(getStoredVisibilityPreference);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const connection = getNavigatorConnection();
    let intervalId: number | null = null;
    let controller: AbortController | null = null;

    const updateState = async () => {
      controller?.abort();
      controller = new AbortController();

      const online = typeof navigator === "undefined" ? true : navigator.onLine;

      if (!online) {
        if (isMountedRef.current) {
          setNetworkState(
            resolveNetworkState({
              online: false,
              latencyMs: null,
              connection,
            }),
          );
        }
        return;
      }

      try {
        const latencyMs = await measureLatency(controller.signal);

        if (!isMountedRef.current) return;

        setNetworkState(
          resolveNetworkState({
            online: true,
            latencyMs,
            connection,
          }),
        );
      } catch {
        if (!isMountedRef.current) return;

        setNetworkState(
          resolveNetworkState({
            online: typeof navigator === "undefined" ? true : navigator.onLine,
            latencyMs: null,
            connection,
          }),
        );
      }
    };

    const handleOnline = () => {
      void updateState();
    };

    const handleOffline = () => {
      setNetworkState(
        resolveNetworkState({
          online: false,
          latencyMs: null,
          connection,
        }),
      );
    };

    void updateState();
    intervalId = window.setInterval(() => {
      void updateState();
    }, 30000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    connection?.addEventListener?.("change", handleOnline);

    return () => {
      isMountedRef.current = false;
      controller?.abort();
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      connection?.removeEventListener?.("change", handleOnline);
    };
  }, []);

  const colors = useMemo(
    () => getIndicatorColors(networkState.quality),
    [networkState.quality],
  );

  const Icon = networkState.quality === "offline" ? WifiOff : Wifi;
  const ToggleIcon = isIndicatorVisible ? EyeOff : Eye;
  const toggleLabel = isIndicatorVisible ? "إخفاء مؤشر الشبكة" : "إظهار مؤشر الشبكة";

  const handleToggleVisibility = () => {
    setIsIndicatorVisible((currentValue) => {
      const nextValue = !currentValue;

      try {
        window.localStorage.setItem(VISIBILITY_STORAGE_KEY, String(nextValue));
      } catch {
        // Ignore storage failures and keep the in-memory preference.
      }

      return nextValue;
    });
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[70] flex items-end gap-2" dir="ltr">
      <button
        type="button"
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-transform duration-200 hover:-translate-y-0.5"
        style={{
          background: "var(--md-surface-container-high)",
          color: "var(--md-on-surface)",
          borderColor: "color-mix(in srgb, var(--md-outline) 20%, transparent)",
        }}
        aria-label={toggleLabel}
        aria-pressed={isIndicatorVisible}
        onClick={handleToggleVisibility}
        title={toggleLabel}
      >
        <ToggleIcon size={18} />
      </button>

      {isIndicatorVisible ? (
        <div
          className="pointer-events-none flex items-center gap-3 rounded-[var(--md-shape-full)] border px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.10)] backdrop-blur-sm"
          style={{
            background: colors.background,
            color: colors.color,
            borderColor: colors.borderColor,
          }}
          aria-live="polite"
          aria-label={`${networkState.label} - ${networkState.hint}`}
          title={`${networkState.label} - ${networkState.hint}`}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{
              background: "color-mix(in srgb, currentColor 10%, transparent)",
            }}
          >
            <Icon size={16} />
          </span>

          <div className="min-w-0 text-right">
            <p className="md-label-large leading-none">{networkState.label}</p>
            <p className="md-body-small mt-1 whitespace-nowrap opacity-80">
              {networkState.hint}
            </p>
          </div>

          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: colors.dot, boxShadow: `0 0 0 4px color-mix(in srgb, ${colors.dot} 16%, transparent)` }}
          />
        </div>
      ) : null}
    </div>
  );
}
