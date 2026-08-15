"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Volume2, VolumeX, X } from "lucide-react";
import {
  firstUnseenNotificationId,
  readSeenNotificationIds,
} from "@/lib/notifications";

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  reference: string;
  targetUrl: string;
  priority: string;
  createdAt: string | null;
  read: boolean;
};
type Payload = { unread: number; items: AdminNotification[] };
const soundKey = "sgh-admin-notification-sound";
const seenKey = "sgh-admin-notifications-seen";
const playedPrefix = "sgh-admin-notification-played:";

function relativeTime(value: string | null) {
  if (!value) return "Just now";
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function diagnostic(event: string) {
  if (process.env.NODE_ENV !== "production")
    console.info(`[SGH notifications] ${event}`);
}

export function AdminNotifications() {
  const [data, setData] = useState<Payload>({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<AdminNotification | null>(null);
  const [sound, setSound] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const initialized = useRef(false);
  const loadInProgress = useRef(false);
  const consecutiveFailures = useRef(0);
  const authenticationExpired = useRef(false);
  const soundRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const playSound = useCallback(async (reason: "test" | "notification") => {
    const audio = audioRef.current;
    if (!audio) {
      setSoundBlocked(true);
      diagnostic("sound play rejected: audio unavailable");
      return false;
    }
    try {
      diagnostic(`sound play requested (${reason})`);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.45;
      await audio.play();
      setSoundBlocked(false);
      diagnostic("sound play succeeded");
      return true;
    } catch (error) {
      setSoundBlocked(true);
      diagnostic(
        `sound play blocked/rejected${error instanceof Error ? `: ${error.name}` : ""}`,
      );
      return false;
    }
  }, []);

  const playNewNotificationOnce = useCallback(
    async (id: string) => {
      const playedKey = `${playedPrefix}${id}`;
      const playIfUnclaimed = async () => {
        if (localStorage.getItem(playedKey)) return;
        if (await playSound("notification"))
          localStorage.setItem(playedKey, String(Date.now()));
      };
      if (navigator.locks?.request) {
        await navigator.locks.request(
          `sgh-notification-sound-${id}`,
          { ifAvailable: true },
          async (lock) => {
            if (lock) await playIfUnclaimed();
          },
        );
      } else await playIfUnclaimed();
    },
    [playSound],
  );

  const load = useCallback(async () => {
    if (authenticationExpired.current) return false;
    if (loadInProgress.current) return false;
    if (!navigator.onLine) {
      consecutiveFailures.current = 4;
      return false;
    }
    loadInProgress.current = true;
    try {
      const response = await fetch("/api/admin/notifications", {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 401 || response.status === 403) {
        authenticationExpired.current = true;
        window.location.replace("/admin/login?reason=session_expired");
        return false;
      }
      if (!response.ok) {
        diagnostic(`notification refresh failed: HTTP ${response.status}`);
        consecutiveFailures.current += 1;
        return false;
      }
      const next = (await response.json()) as Payload;
      const seen = readSeenNotificationIds(localStorage.getItem(seenKey));
      if (initialized.current) {
        const newestId = firstUnseenNotificationId(
          next.items.map((item) => item.id),
          seen,
        );
        const newest = next.items.find((item) => item.id === newestId);
        if (newest) {
          setToast(newest);
          if (soundRef.current) await playNewNotificationOnce(newest.id);
        }
      }
      next.items.forEach((item) => seen.add(item.id));
      localStorage.setItem(seenKey, JSON.stringify([...seen].slice(-300)));
      initialized.current = true;
      setData(next);
      consecutiveFailures.current = 0;
      return true;
    } catch (error) {
      consecutiveFailures.current += 1;
      diagnostic(
        `notification refresh unavailable${error instanceof Error ? `: ${error.name}` : ""}`,
      );
      return false;
    } finally {
      loadInProgress.current = false;
    }
  }, [playNewNotificationOnce]);
  useEffect(() => {
    const audio = new Audio("/notification-tone.wav");
    audio.preload = "auto";
    audio.volume = 0.45;
    audioRef.current = audio;
    const enabled = localStorage.getItem(soundKey) === "on";
    soundRef.current = enabled;
    diagnostic(
      enabled ? "notification sound enabled" : "notification sound disabled",
    );
    let stopped = false;
    let timer = 0;
    const poll = async () => {
      const refreshed = await load();
      if (stopped || authenticationExpired.current) return;
      const delay = refreshed
        ? 3_000
        : Math.min(
            60_000,
            3_000 * 2 ** Math.min(consecutiveFailures.current, 4),
          );
      timer = window.setTimeout(poll, delay);
    };
    const resume = () => {
      if (loadInProgress.current) return;
      window.clearTimeout(timer);
      void poll();
    };
    timer = window.setTimeout(() => {
      setSound(enabled);
      void poll();
    }, 0);
    window.addEventListener("online", resume);
    window.addEventListener("focus", resume);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.removeEventListener("online", resume);
      window.removeEventListener("focus", resume);
      audio.pause();
      audioRef.current = null;
    };
  }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") setOpen(false);
        return;
      }
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      )
        setOpen(false);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("pointerdown", close);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("pointerdown", close);
    };
  }, [open]);
  async function markRead(id: string) {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        diagnostic(`mark read failed: HTTP ${response.status}`);
        return;
      }
      setData((old) => ({
        unread: Math.max(
          0,
          old.unread - (old.items.find((item) => item.id === id)?.read ? 0 : 1),
        ),
        items: old.items.map((item) =>
          item.id === id ? { ...item, read: true } : item,
        ),
      }));
    } catch (error) {
      diagnostic(
        `mark read unavailable${error instanceof Error ? `: ${error.name}` : ""}`,
      );
    }
  }
  async function setSoundPreference(
    enabled: boolean,
    confirmWithSound = false,
  ) {
    soundRef.current = enabled;
    setSound(enabled);
    localStorage.setItem(soundKey, enabled ? "on" : "off");
    diagnostic(
      enabled ? "notification sound enabled" : "notification sound disabled",
    );
    if (!enabled) {
      setSoundBlocked(false);
      return;
    }
    if (confirmWithSound && (await playSound("test")))
      diagnostic("audio unlocked");
  }
  function toggleSound() {
    void setSoundPreference(!sound, !sound);
  }
  return (
    <div ref={containerRef} className="static sm:relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-11 w-11 place-items-center rounded-xl border"
        aria-label={`Notifications, ${data.unread} unread`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {data.unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-pink-accent px-1 text-center text-xs font-bold text-white">
            {data.unread > 99 ? "99+" : data.unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[4.5rem] z-50 flex max-h-[calc(100dvh-5.25rem)] flex-col overflow-hidden rounded-2xl border bg-white p-3 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[min(92vw,380px)] sm:max-h-[min(75vh,620px)]">
          <div className="flex items-start justify-between gap-2 px-2 py-1">
            <strong>Notifications</strong>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className="flex min-h-9 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
              >
                {sound ? (
                  <Volume2 className="h-4 w-4 shrink-0" />
                ) : (
                  <VolumeX className="h-4 w-4 shrink-0" />
                )}{" "}
                <span>Sound: {sound ? "On" : "Off"}</span>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-bg-soft"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mx-2 my-2 flex flex-wrap gap-2">
            <button
              onClick={() => void playSound("test")}
              className="rounded-lg border px-3 py-2 text-sm font-semibold"
            >
              Test sound
            </button>
            {soundBlocked && (
              <button
                onClick={() => void setSoundPreference(true, true)}
                className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
              >
                Enable notification sounds
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {data.items.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                href={item.targetUrl}
                onClick={() => {
                  void markRead(item.id);
                  setOpen(false);
                }}
                className={`block rounded-xl p-3 hover:bg-bg-soft ${item.read ? "opacity-70" : "bg-purple-50"}`}
              >
                <span className="block break-words font-semibold">
                  {item.title}
                </span>
                <span className="mt-1 block break-all text-sm">
                  {item.reference}
                </span>
                <span className="text-xs text-text-muted">
                  {relativeTime(item.createdAt)}
                </span>
              </Link>
            ))}
            {!data.items.length && (
              <p className="p-4 text-sm text-text-muted">
                No notifications yet.
              </p>
            )}
          </div>
          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-xl border p-2 text-center text-sm font-semibold text-purple-deep"
          >
            View notification history
          </Link>
        </div>
      )}
      {toast && (
        <div
          role="status"
          className="fixed inset-x-3 bottom-3 z-[70] rounded-2xl border bg-white p-4 shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(90vw,360px)]"
        >
          <button
            onClick={() => setToast(null)}
            className="absolute right-2 top-2"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
          <strong>{toast.title}</strong>
          <p className="mt-1 text-sm">{toast.body}</p>
          <Link
            href={toast.targetUrl}
            onClick={() => {
              void markRead(toast.id);
              setToast(null);
            }}
            className="mt-3 inline-block font-semibold text-purple-deep"
          >
            View
          </Link>
        </div>
      )}
    </div>
  );
}
