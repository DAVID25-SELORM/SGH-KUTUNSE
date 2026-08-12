import { randomBytes } from "node:crypto";
export function createReference(prefix: string) { return `SGH-${prefix}-${randomBytes(6).toString("hex").toUpperCase()}`; }
