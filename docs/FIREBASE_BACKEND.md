# Firebase backend and administration

Production uses Firebase App Hosting's service identity and Application Default Credentials. Never add a service-account JSON file. Local development should use the Auth and Firestore emulators (`npm run emulators`) and set `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, and `GCLOUD_PROJECT=satelitegeneralhospital` before `npm run dev`.

Public forms call Next.js route handlers. Only the Admin SDK writes operational collections; Firestore rules deny all direct client access. Admin sign-in uses Firebase Email/Password, exchanges an ID token for an HTTP-only eight-hour session cookie, and requires a trusted custom `role` claim on every protected server boundary.

Rate limiting must be distributed before production traffic. Configure Firebase App Check for the web app and enforce a verified App Check token at each public endpoint, or place Cloud Armor/reCAPTCHA Enterprise in front of App Hosting. An in-memory limiter is intentionally not presented as production protection. The included honeypot and strict request constraints are only baseline safeguards.

CMS rollout is additive: seed static data idempotently with stable slugs, never overwrite an existing Firestore document, review drafts, then switch public reads to published Firestore records with static fallback. No seed is run automatically. Suggested retention for operational requests must be approved by hospital governance; configure TTL only after that decision.

Manual setup: enable Email/Password Authentication; create the first approved staff user; set its `role=super_admin` custom claim using a one-time controlled Admin SDK process; deploy rules/indexes only after review; grant the App Hosting runtime service account least-privilege Firebase Auth Admin and Firestore access; register and enforce App Check after testing; configure authorized domains; create approved Storage buckets/rules before enabling CMS uploads. No email/SMS/WhatsApp notification provider is configured.

## App Check console steps

1. In Google Cloud Console, enable reCAPTCHA Enterprise and create a website key for the approved production and App Hosting preview domains.
2. In Firebase Console → App Check → Apps, register the SGH web app with that reCAPTCHA Enterprise key.
3. Add the key as `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` in the App Hosting backend environment.
4. Leave `REQUIRE_FIREBASE_APP_CHECK=false`, deploy only to a future preview, and verify valid and missing-token requests.
5. After verification, set `REQUIRE_FIREBASE_APP_CHECK=true`. Monitor App Check metrics before enforcing other Firebase products.

App Check attests the calling app; reCAPTCHA Enterprise supplies bot/risk signals. Neither is request rate limiting. For rate limiting, use Google Cloud Armor rate-based rules in front of the App Hosting service where supported, or a small shared Redis/Firestore-backed limiter with TTL and hashed network keys. Do not use a process-memory counter. Obtain privacy approval before retaining network-derived identifiers.

## Local prerequisites

Install Eclipse Temurin OpenJDK 21 LTS x64 JDK, set `JAVA_HOME`, and add `%JAVA_HOME%\bin` to `PATH`. Confirm with `java -version`. Use Node 22 LTS. Then run `npm run emulators` and `npm run test:rules`; neither command should target production data.
