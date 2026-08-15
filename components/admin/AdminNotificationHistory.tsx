"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminNotification } from "./AdminNotifications";
import { notificationTypes } from "@/lib/notifications";

export function AdminNotificationHistory() {
  const [items,setItems]=useState<AdminNotification[]>([]),[state,setState]=useState("all"),[type,setType]=useState("all"),[date,setDate]=useState("");
  async function load(){const response=await fetch("/api/admin/notifications",{cache:"no-store"});if(response.ok)setItems((await response.json()).items)}
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[]);
  const visible=useMemo(()=>items.filter(item=>(state==="all"||(state==="read")===item.read)&&(type==="all"||item.type===type)&&(!date||item.createdAt?.slice(0,10)===date)),[items,state,type,date]);
  async function mark(body:object){await fetch("/api/admin/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});await load()}
  return <div className="mt-6"><div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-4"><select value={state} onChange={e=>setState(e.target.value)} className="rounded-xl border p-3"><option value="all">All</option><option value="unread">Unread</option><option value="read">Read</option></select><select value={type} onChange={e=>setType(e.target.value)} className="rounded-xl border p-3"><option value="all">All types</option>{notificationTypes.map(item=><option key={item} value={item}>{item}</option>)}</select><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="rounded-xl border p-3"/><button onClick={()=>void mark({all:true})} className="rounded-xl bg-purple-deep px-4 py-3 font-semibold text-white">Mark all as read</button></div><div className="mt-4 space-y-3">{visible.map(item=><article key={item.id} className={`rounded-2xl border bg-white p-4 ${item.read?"":"border-purple-deep"}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{item.title}</strong><p className="text-sm">{item.reference} · {item.createdAt?new Date(item.createdAt).toLocaleString():"Just now"}</p></div><div className="flex gap-2"><Link href={item.targetUrl} onClick={()=>void mark({id:item.id})} className="rounded-xl border px-3 py-2 font-semibold text-purple-deep">Open record</Link>{!item.read&&<button onClick={()=>void mark({id:item.id})} className="rounded-xl border px-3 py-2 font-semibold">Mark read</button>}</div></div></article>)}{!visible.length&&<p className="rounded-2xl bg-white p-6 text-text-muted">No notifications match these filters.</p>}</div></div>;
}
