"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Volume2, VolumeX, X } from "lucide-react";
import { firstUnseenNotificationId, readSeenNotificationIds } from "@/lib/notifications";

export type AdminNotification = { id: string; type: string; title: string; body: string; reference: string; targetUrl: string; priority: string; createdAt: string | null; read: boolean };
type Payload = { unread: number; items: AdminNotification[] };
const soundKey = "sgh-admin-notification-sound";
const seenKey = "sgh-admin-notifications-seen";
const playedPrefix = "sgh-admin-notification-played:";

function relativeTime(value: string | null) {
  if (!value) return "Just now";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function diagnostic(event: string) {
  console.info(`[SGH notifications] ${event}`);
}

export function AdminNotifications() {
  const [data, setData] = useState<Payload>({ unread: 0, items: [] });
  const [open, setOpen] = useState(false); const [toast, setToast] = useState<AdminNotification | null>(null);
  const [sound, setSound] = useState(false); const [soundBlocked, setSoundBlocked] = useState(false);
  const initialized = useRef(false);
  const loadInProgress = useRef(false);
  const soundRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(async (reason: "test" | "notification") => {
    const audio = audioRef.current;
    if (!audio) { setSoundBlocked(true); diagnostic("sound play rejected: audio unavailable"); return false; }
    try {
      diagnostic(`sound play requested (${reason})`);
      audio.pause(); audio.currentTime = 0; audio.volume = 0.45;
      await audio.play();
      setSoundBlocked(false); diagnostic("sound play succeeded"); return true;
    } catch (error) {
      setSoundBlocked(true);
      diagnostic(`sound play blocked/rejected${error instanceof Error ? `: ${error.name}` : ""}`);
      return false;
    }
  }, []);

  const playNewNotificationOnce = useCallback(async (id: string) => {
    const playedKey = `${playedPrefix}${id}`;
    const playIfUnclaimed = async () => {
      if (localStorage.getItem(playedKey)) return;
      if (await playSound("notification")) localStorage.setItem(playedKey, String(Date.now()));
    };
    if (navigator.locks?.request) {
      await navigator.locks.request(`sgh-notification-sound-${id}`, { ifAvailable: true }, async (lock) => { if (lock) await playIfUnclaimed(); });
    } else await playIfUnclaimed();
  }, [playSound]);

  const load = useCallback(async () => {
    if (loadInProgress.current) return;
    loadInProgress.current = true;
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!response.ok) { diagnostic(`notification refresh failed: HTTP ${response.status}`); return; }
      const next = await response.json() as Payload;
      const seen = readSeenNotificationIds(localStorage.getItem(seenKey));
      if (initialized.current) {
        const newestId = firstUnseenNotificationId(next.items.map((item) => item.id), seen);
        const newest = next.items.find((item) => item.id === newestId);
        if (newest) { setToast(newest); if (soundRef.current) await playNewNotificationOnce(newest.id); }
      }
      next.items.forEach((item) => seen.add(item.id)); localStorage.setItem(seenKey, JSON.stringify([...seen].slice(-300)));
      initialized.current = true; setData(next);
    } catch (error) {
      diagnostic(`notification refresh unavailable${error instanceof Error ? `: ${error.name}` : ""}`);
    } finally {
      loadInProgress.current = false;
    }
  }, [playNewNotificationOnce]);
  useEffect(() => {
    const audio = new Audio("/notification-tone.wav"); audio.preload = "auto"; audio.volume = 0.45; audioRef.current = audio;
    const enabled = localStorage.getItem(soundKey) === "on"; soundRef.current = enabled;
    diagnostic(enabled ? "notification sound enabled" : "notification sound disabled");
    const initial = window.setTimeout(() => { setSound(enabled); void load(); }, 0);
    const timer = window.setInterval(() => void load(), 3000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); audio.pause(); audioRef.current = null; };
  }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 8000); return () => window.clearTimeout(timer); }, [toast]);
  async function markRead(id: string) {
    try {
      const response = await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) { diagnostic(`mark read failed: HTTP ${response.status}`); return; }
      setData((old) => ({ unread: Math.max(0, old.unread - (old.items.find((item) => item.id === id)?.read ? 0 : 1)), items: old.items.map((item) => item.id === id ? { ...item, read: true } : item) }));
    } catch (error) {
      diagnostic(`mark read unavailable${error instanceof Error ? `: ${error.name}` : ""}`);
    }
  }
  async function setSoundPreference(enabled: boolean, confirmWithSound = false) {
    soundRef.current = enabled; setSound(enabled); localStorage.setItem(soundKey, enabled ? "on" : "off");
    diagnostic(enabled ? "notification sound enabled" : "notification sound disabled");
    if (!enabled) { setSoundBlocked(false); return; }
    if (confirmWithSound && await playSound("test")) diagnostic("audio unlocked");
  }
  function toggleSound() { void setSoundPreference(!sound, !sound); }
  return <div className="relative">
    <button onClick={() => setOpen((value) => !value)} className="relative grid h-11 w-11 place-items-center rounded-xl border" aria-label={`Notifications, ${data.unread} unread`} aria-expanded={open}><Bell className="h-5 w-5"/>{data.unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-pink-accent px-1 text-center text-xs font-bold text-white">{data.unread > 99 ? "99+" : data.unread}</span>}</button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] rounded-2xl border bg-white p-3 shadow-2xl"><div className="flex items-center justify-between px-2 py-1"><strong>Notifications</strong><button onClick={toggleSound} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold">{sound ? <Volume2 className="h-4 w-4"/> : <VolumeX className="h-4 w-4"/>} Notification sound: {sound ? "On" : "Off"}</button></div><div className="mx-2 my-2 flex flex-wrap gap-2"><button onClick={() => void playSound("test")} className="rounded-lg border px-3 py-2 text-sm font-semibold">Test sound</button>{soundBlocked && <button onClick={() => void setSoundPreference(true, true)} className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">Enable notification sounds</button>}</div><div className="max-h-96 overflow-y-auto">{data.items.slice(0, 8).map((item) => <Link key={item.id} href={item.targetUrl} onClick={() => { void markRead(item.id); setOpen(false); }} className={`block rounded-xl p-3 hover:bg-bg-soft ${item.read ? "opacity-70" : "bg-purple-50"}`}><span className="font-semibold">{item.title}</span><span className="mt-1 block text-sm">{item.reference}</span><span className="text-xs text-text-muted">{relativeTime(item.createdAt)}</span></Link>)}{!data.items.length && <p className="p-4 text-sm text-text-muted">No notifications yet.</p>}</div><Link href="/admin/notifications" onClick={() => setOpen(false)} className="mt-2 block rounded-xl border p-2 text-center text-sm font-semibold text-purple-deep">View notification history</Link></div>}
    {toast && <div role="status" className="fixed bottom-5 right-5 z-[70] w-[min(90vw,360px)] rounded-2xl border bg-white p-4 shadow-2xl"><button onClick={() => setToast(null)} className="absolute right-2 top-2" aria-label="Dismiss notification"><X className="h-4 w-4"/></button><strong>{toast.title}</strong><p className="mt-1 text-sm">{toast.body}</p><Link href={toast.targetUrl} onClick={() => { void markRead(toast.id); setToast(null); }} className="mt-3 inline-block font-semibold text-purple-deep">View</Link></div>}
  </div>;
}
