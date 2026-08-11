import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Online messages are temporarily unavailable. Please call the hospital." },
    { status: 503 }
  );
}
