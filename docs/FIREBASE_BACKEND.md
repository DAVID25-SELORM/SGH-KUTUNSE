# Firebase backend and administration

Production uses Firebase App Hosting's service identity and Application Default Credentials. Never add a service-account JSON file. Local development should use the Auth and Firestore emulators (`npm run emulators`) and set `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, and `GCLOUD_PROJECT=satelitegeneralhospital` before `npm run dev`.

Public forms call Next.js route handlers. Only the Admin SDK writes operational collections; Firestore rules deny all direct client access. Admin sign-in uses Firebase Email/Password, exchanges an ID token for an HTTP-only eight-hour session cookie, and requires a trusted custom `role` claim on every protected server boundary.

Rate limiting must be distributed before production traffic. Configure Firebase App Check for the web app and enforce a verified App Check token at each public endpoint, or place Cloud Armor/reCAPTCHA Enterprise in front of App Hosting. An in-memory limiter is intentionally not presented as production protection. The included honeypot and strict request constraints are only baseline safeguards.

CMS rollout is additive: seed static data idempotently with stable slugs, never overwrite an existing Firestore document, review drafts, then switch public reads to published Firestore records with static fallback. No seed is run automatically. Suggested retention for operational requests must be approved by hospital governance; configure TTL only after that decision.

Manual setup: enable Email/Password Authentication; create the first approved staff user; set its `role=super_admin` custom claim using a one-time controlled Admin SDK process; deploy rules/indexes only after review; grant the App Hosting runtime service account least-privilege Firebase Auth Admin and Firestore access; register and enforce App Check after testing; configure authorized domains; create approved Storage buckets/rules before enabling CMS uploads. No email/SMS/WhatsApp notification provider is configured.

## Patient feedback architecture (local implementation; not deployed)

`/feedback` is a no-login, anonymous-by-default survey. The browser posts strict JSON to `/api/feedback`; the route enforces payload bounds, content type, honeypot and optional App Check, then the Admin SDK creates `feedback_responses/{id}`, a non-sensitive `submission_references` reservation, and a minimal history entry. Direct client Firestore access remains denied. Optional contact details are stored only when follow-up is requested. Receipt/payment concerns are neutral allegations, flagged `receiptRestricted`, excluded from ordinary dashboard cards, and visible only with `feedback_receipts`; access is audited without allegation content.

Admin pages are `/admin/feedback`, `/admin/feedback/[id]`, and `/admin/feedback/campaigns`. Permissions are additive: `feedback`, `feedback_manage`, `feedback_receipts`, `feedback_campaigns`, and `feedback_sms`. Super administrators receive all; administrators do not receive receipt-detail or live-SMS permission; reception can manage ordinary feedback; viewers are read-only. Server authorization remains authoritative.

Campaign concepts use `feedback_campaigns` and future recipient subcollections. URLs may include only an opaque campaign code/source—never names, phone numbers, patient/member IDs or medical identifiers. Unique recipient tokens are not implemented, preserving non-correlatable anonymous responses. QR codes should point to `/feedback` or a non-identifying campaign/source URL after wording approval.

`SmsProvider` is server-only; `MockSmsProvider` is the only implementation. Real sending is disabled. A production Ghana-compatible adapter must provide server secrets, approved sender ID, API endpoint, acceptance/delivery semantics, webhook signature verification, idempotency keys, opt-out handling and retention rules. Suggested secret variables: `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID`, and `SMS_WEBHOOK_SECRET`; never prefix them with `NEXT_PUBLIC_`.

Before deployment: approve survey/privacy/SMS wording; select roles allowed to view ordinary and receipt feedback; approve follow-up SLA, retention/TTL, escalation and opt-out rules; configure and enforce App Check/Cloud Armor; select provider; implement signed delivery webhook and idempotent recipient batches; review rules/indexes; deploy to preview; run anonymous, role, mobile and accessibility QA. Rollback is code rollback plus disabling the feedback navigation/provider; do not delete responses without an approved retention procedure. The existing Google Form remains untouched.

The campaign admin includes downloadable PNG QR generation for reception, OPD, screening, laboratory and pharmacy. QR URLs contain only `source=qr` and a non-identifying campaign label. Before live campaign controls are unlocked, recipient documents must store normalized phone numbers, consent/opt-out state, an idempotency key, queued/attempted/provider-accepted/handset-delivered/failed/skipped state, and timestamps. “Delivered” must only be used when the provider confirms handset delivery. Recipient collections remain Admin-SDK-only and audit metadata must not contain plaintext phone numbers.

## App Check console steps

1. In Google Cloud Console, enable reCAPTCHA Enterprise and create a website key for the approved production and App Hosting preview domains.
2. In Firebase Console → App Check → Apps, register the SGH web app with that reCAPTCHA Enterprise key.
3. Add the key as `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` in the App Hosting backend environment.
4. Leave `REQUIRE_FIREBASE_APP_CHECK=false`, deploy only to a future preview, and verify valid and missing-token requests.
5. After verification, set `REQUIRE_FIREBASE_APP_CHECK=true`. Monitor App Check metrics before enforcing other Firebase products.

App Check attests the calling app; reCAPTCHA Enterprise supplies bot/risk signals. Neither is request rate limiting. For rate limiting, use Google Cloud Armor rate-based rules in front of the App Hosting service where supported, or a small shared Redis/Firestore-backed limiter with TTL and hashed network keys. Do not use a process-memory counter. Obtain privacy approval before retaining network-derived identifiers.

## Local prerequisites

Install Eclipse Temurin OpenJDK 21 LTS x64 JDK, set `JAVA_HOME`, and add `%JAVA_HOME%\bin` to `PATH`. Confirm with `java -version`. Use Node 22 LTS. Then run `npm run emulators` and `npm run test:rules`; neither command should target production data.
