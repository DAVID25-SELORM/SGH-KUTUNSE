"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Volume2, VolumeX, X } from "lucide-react";

export type AdminNotification = { id: string; type: string; title: string; body: string; reference: string; targetUrl: string; priority: string; createdAt: string | null; read: boolean };
type Payload = { unread: number; items: AdminNotification[] };
const soundKey = "sgh-admin-notification-sound";
const seenKey = "sgh-admin-notifications-seen";

function relativeTime(value: string | null) {
  if (!value) return "Just now";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function playProfessionalTone() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return false;
  const context = new AudioContextClass();
  if (context.state === "suspended") { void context.close(); return false; }
  const gain = context.createGain(); const oscillator = context.createOscillator();
  oscillator.type = "sine"; oscillator.frequency.setValueAtTime(660, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
  oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.3); oscillator.onended = () => void context.close(); return true;
}

export function AdminNotifications() {
  const [data, setData] = useState<Payload>({ unread: 0, items: [] });
  const [open, setOpen] = useState(false); const [toast, setToast] = useState<AdminNotification | null>(null);
  const [sound, setSound] = useState(false); const [soundBlocked, setSoundBlocked] = useState(false);
  const initialized = useRef(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/notifications", { cache: "no-store" }); if (!response.ok) return;
    const next = await response.json() as Payload;
    const seen = new Set<string>(JSON.parse(localStorage.getItem(seenKey) || "[]") as string[]);
    if (initialized.current) {
      const newest = next.items.find((item) => !seen.has(item.id));
      if (newest) { setToast(newest); if (sound && !playProfessionalTone()) setSoundBlocked(true); }
    }
    next.items.forEach((item) => seen.add(item.id)); localStorage.setItem(seenKey, JSON.stringify([...seen].slice(-300)));
    initialized.current = true; setData(next);
  }, [sound]);
  useEffect(() => { const initial = window.setTimeout(() => { setSound(localStorage.getItem(soundKey) === "on"); void load(); }, 0); const timer = window.setInterval(() => void load(), 8000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 8000); return () => window.clearTimeout(timer); }, [toast]);
  async function markRead(id: string) { await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); setData((old) => ({ unread: Math.max(0, old.unread - (old.items.find((item) => item.id === id)?.read ? 0 : 1)), items: old.items.map((item) => item.id === id ? { ...item, read: true } : item) })); }
  function toggleSound() { const enabled = !sound; setSound(enabled); localStorage.setItem(soundKey, enabled ? "on" : "off"); setSoundBlocked(enabled && !playProfessionalTone()); }
  return <div className="relative">
    <button onClick={() => setOpen((value) => !value)} className="relative grid h-11 w-11 place-items-center rounded-xl border" aria-label={`Notifications, ${data.unread} unread`} aria-expanded={open}><Bell className="h-5 w-5"/>{data.unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-pink-accent px-1 text-center text-xs font-bold text-white">{data.unread > 99 ? "99+" : data.unread}</span>}</button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] rounded-2xl border bg-white p-3 shadow-2xl"><div className="flex items-center justify-between px-2 py-1"><strong>Notifications</strong><button onClick={toggleSound} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold">{sound ? <Volume2 className="h-4 w-4"/> : <VolumeX className="h-4 w-4"/>} Sound {sound ? "ON" : "OFF"}</button></div>{soundBlocked && <button onClick={()=>{localStorage.setItem(soundKey,"on");setSound(true);setSoundBlocked(!playProfessionalTone())}} className="mx-2 my-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">Enable notification sounds</button>}<div className="max-h-96 overflow-y-auto">{data.items.slice(0, 8).map((item) => <Link key={item.id} href={item.targetUrl} onClick={() => { void markRead(item.id); setOpen(false); }} className={`block rounded-xl p-3 hover:bg-bg-soft ${item.read ? "opacity-70" : "bg-purple-50"}`}><span className="font-semibold">{item.title}</span><span className="mt-1 block text-sm">{item.reference}</span><span className="text-xs text-text-muted">{relativeTime(item.createdAt)}</span></Link>)}{!data.items.length && <p className="p-4 text-sm text-text-muted">No notifications yet.</p>}</div><Link href="/admin/notifications" onClick={() => setOpen(false)} className="mt-2 block rounded-xl border p-2 text-center text-sm font-semibold text-purple-deep">View notification history</Link></div>}
    {toast && <div role="status" className="fixed bottom-5 right-5 z-[70] w-[min(90vw,360px)] rounded-2xl border bg-white p-4 shadow-2xl"><button onClick={() => setToast(null)} className="absolute right-2 top-2" aria-label="Dismiss notification"><X className="h-4 w-4"/></button><strong>{toast.title}</strong><p className="mt-1 text-sm">{toast.body}</p><Link href={toast.targetUrl} onClick={() => { void markRead(toast.id); setToast(null); }} className="mt-3 inline-block font-semibold text-purple-deep">View</Link></div>}
  </div>;
}
