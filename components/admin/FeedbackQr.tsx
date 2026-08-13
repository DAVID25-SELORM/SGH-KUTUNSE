"use client";
import { useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

export function FeedbackQr() {
  const [source, setSource] = useState("reception");
  const [image, setImage] = useState("");
  async function generate() {
    const url = new URL("/feedback", "https://satellitegeneralhospital.com");
    url.searchParams.set("source", "qr");
    url.searchParams.set("campaign", `qr_${source}`);
    setImage(await QRCode.toDataURL(url.toString(), { width: 640, margin: 2, errorCorrectionLevel: "H" }));
  }
  return <div className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Survey QR code</h2><p className="mt-2 text-sm text-text-muted">Generate a non-identifying campaign QR for print use.</p><div className="mt-4 flex flex-wrap gap-3"><select value={source} onChange={e=>setSource(e.target.value)} className="rounded-xl border px-3 py-2">{["reception","opd","health_screening","laboratory","pharmacy"].map(v=><option key={v}>{v.replaceAll("_"," ")}</option>)}</select><button type="button" onClick={generate} className="rounded-xl bg-purple-deep px-4 py-2 font-semibold text-white">Generate QR</button></div>{image ? <div className="mt-5"><Image unoptimized src={image} width={256} height={256} alt={`Feedback QR code for ${source}`} /><a href={image} download={`sgh-feedback-${source}.png`} className="mt-3 inline-block font-semibold text-purple-deep">Download PNG</a></div> : null}</div>;
}
