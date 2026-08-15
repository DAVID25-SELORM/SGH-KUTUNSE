import { describe, expect, it } from "vitest";
import { z } from "@/lib/zod";

describe("production CSP compatibility", () => {
  it("keeps Zod's runtime code generation disabled", () => {
    expect(z.config().jitless).toBe(true);
  });
});
