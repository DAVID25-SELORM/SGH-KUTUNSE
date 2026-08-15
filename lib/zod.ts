import { z } from "zod";

// Keep browser validation compatible with the production Content Security Policy.
z.config({ jitless: true });

export { z };
