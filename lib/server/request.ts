import { NextResponse } from "next/server";
import type { ZodTypeAny, output } from "zod";

const MAX_BYTES = 16_384;

export async function parseJson<S extends ZodTypeAny>(request: Request, schema: S): Promise<{ data: output<S>; error?: never } | { data?: never; error: NextResponse }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return { error: NextResponse.json({ ok: false, message: "Unsupported content type." }, { status: 415 }) };
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) return { error: NextResponse.json({ ok: false, message: "Request is too large." }, { status: 413 }) };
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BYTES) return { error: NextResponse.json({ ok: false, message: "Request is too large." }, { status: 413 }) };
  try {
    const parsed = schema.safeParse(JSON.parse(text));
    if (!parsed.success) return { error: NextResponse.json({ ok: false, message: "Please check the information provided.", errors: parsed.error.flatten().fieldErrors }, { status: 400 }) };
    return { data: parsed.data };
  } catch {
    return { error: NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 }) };
  }
}

export function publicError() {
  return NextResponse.json({ ok: false, message: "We could not save your request. Please try again or call the hospital." }, { status: 500 });
}
