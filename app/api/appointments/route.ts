import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Online appointment requests are temporarily unavailable. Please call the hospital." },
    { status: 503 }
  );
}
