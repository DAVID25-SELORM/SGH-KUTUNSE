"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminNotification } from "./AdminNotifications";
import { notificationReadEvent, notificationTypes, type NotificationReadDetail } from "@/lib/notifications";

export function AdminNotificationHistory() {
  const [items, setItems] = useState<AdminNotification[]>([]),
    [state, setState] = useState("all"),
    [type, setType] = useState("all"),
    [date, setDate] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    if (!navigator.onLine) return false;
    try {
      const response = await fetch("/api/admin/notifications", {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 401 || response.status === 403) {
        window.location.replace("/admin/login?reason=session_expired");
        return false;
      }
      if (!response.ok) return false;
      setItems((await response.json()).items);
      setNotice("");
      return true;
    } catch {
      return false;
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (state === "all" || (state === "read") === item.read) &&
          (type === "all" || item.type === type) &&
          (!date || item.createdAt?.slice(0, 10) === date),
      ),
    [items, state, type, date],
  );
  async function mark(body: object) {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 401 || response.status === 403) {
        window.location.replace("/admin/login?reason=session_expired");
        return;
      }
      if (!response.ok) throw new Error("Notification update failed.");
      const detail: NotificationReadDetail = "all" in body ? { all: true } : { id: String((body as { id?: unknown }).id ?? "") };
      setItems((current) => current.map((item) => detail.all || item.id === detail.id ? { ...item, read: true } : item));
      window.dispatchEvent(new CustomEvent<NotificationReadDetail>(notificationReadEvent, { detail }));
      await load();
    } catch {
      setNotice(
        "The notification could not be updated because the connection was interrupted. Please try again.",
      );
    }
  }
  return (
    <div className="mt-6">
      {notice && (
        <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm">
          {notice}
        </p>
      )}
      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-4">
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="all">All types</option>
          {notificationTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border p-3"
        />
        <button
          onClick={() => void mark({ all: true })}
          className="rounded-xl bg-purple-deep px-4 py-3 font-semibold text-white"
        >
          Mark all as read
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {visible.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 transition-colors ${item.read ? "border-slate-200 bg-slate-50 text-text-muted" : "border-purple-deep bg-purple-50 shadow-sm ring-1 ring-purple-200"}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className={`block break-words ${item.read ? "font-medium" : "font-bold text-purple-deep"}`}>{item.title}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.read ? "bg-slate-200 text-slate-600" : "bg-pink-accent text-white"}`}>{item.read ? "Read" : "Unread"}</span>
                </div>
                <p className="break-all text-sm">
                  {item.reference} ·{" "}
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : "Just now"}
                </p>
              </div>
              <div className="grid gap-2 min-[420px]:grid-cols-2 sm:flex sm:shrink-0">
                <Link
                  href={item.targetUrl}
                  onClick={() => void mark({ id: item.id })}
                  className="rounded-xl border px-3 py-2 text-center font-semibold text-purple-deep"
                >
                  Open record
                </Link>
                {!item.read && (
                  <button
                    onClick={() => void mark({ id: item.id })}
                    className="rounded-xl border px-3 py-2 text-center font-semibold"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
        {!visible.length && (
          <p className="rounded-2xl bg-white p-6 text-text-muted">
            No notifications match these filters.
          </p>
        )}
      </div>
    </div>
  );
}
