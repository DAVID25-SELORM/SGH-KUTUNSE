# Satellite General Hospital Website

Recovered editable source for the Satellite General Hospital public website, built with Next.js 16, TypeScript, Tailwind CSS, React Hook Form, and Zod.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

## Deployment

Production deploys from the `firebase-migration` branch to Firebase App Hosting (project `satelitegeneralhospital`). `STORMERHOST_PHASE1_DEPLOYMENT.md`, `app.js` and `.cpanel.yml` describe an earlier cPanel hosting setup and are kept only for reference.

## Content and integrations

- Repeated hospital content is maintained in `data/` and `lib/constants.ts`.
- Doctor profiles, health articles and gallery albums are managed in the admin area (`/admin`) and published from Firestore only after verification.
- Appointment, contact, insurance, corporate and telemedicine forms save submissions to Firestore and notify staff in the admin inbox. SMS campaigns, contacts and analytics are managed from the admin area.
- The logo, directions map, care-team hero crop, and services flyer in `public/images/` were derived from official PDFs supplied by the hospital.
- Facility photography remains intentionally represented by labelled placeholders until verified hospital photos are available.

No medical prices, clinical outcomes, accreditations, staff credentials, or patient testimonials are invented in this project.

## Recovery note

This source was recovered from the existing Firebase deployment artifacts and public assets without modifying the deployed site. The `.firebase` generated cache is not part of this repository and must never be treated as canonical source.
