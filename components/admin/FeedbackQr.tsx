"use client";
import { useState } from "react";
import Image from "next/image";

export function FeedbackQr() {
  const [source, setSource] = useState("reception");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function generate() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/feedback/qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "QR code could not be generated.");
      setImage(String(result.dataUrl));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "QR code could not be generated.");
    } finally { setLoading(false); }
  }
  return <div className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Survey QR code</h2><p className="mt-2 text-sm text-text-muted">Generate a non-identifying campaign QR for print use.</p><div className="mt-4 flex flex-wrap gap-3"><select value={source} onChange={e=>setSource(e.target.value)} className="rounded-xl border px-3 py-2">{["reception","opd","health_screening","laboratory","pharmacy"].map(v=><option key={v}>{v.replaceAll("_"," ")}</option>)}</select><button type="button" disabled={loading} onClick={generate} className="rounded-xl bg-purple-deep px-4 py-2 font-semibold text-white disabled:opacity-50">{loading ? "Generating…" : "Generate QR"}</button></div>{error ? <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-amber-900">{error}</p> : null}{image ? <div className="mt-5"><Image unoptimized src={image} width={256} height={256} alt={`Feedback QR code for ${source}`} /><a href={image} download={`sgh-feedback-${source}.png`} className="mt-3 inline-block font-semibold text-purple-deep">Download PNG</a></div> : null}</div>;
}
