import { describe, expect, it } from "vitest";
import { GET } from "@/app/notification-tone.wav/route";

describe("admin notification tone", () => {
  it("serves a short WAV asset with the correct MIME type", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/wav");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("RIFF");
    expect(bytes.byteLength).toBeGreaterThan(1_000);
  });
});
