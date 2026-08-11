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

## Content and integrations

- Repeated hospital content is maintained in `data/` and `lib/constants.ts`.
- Doctor profiles and health articles are clearly marked demo content until verified records are supplied.
- Appointment, contact, insurance, and corporate form layouts are preserved but submission is temporarily disabled. Visitors are directed to call the hospital until durable storage is implemented.
- The logo, directions map, care-team hero crop, and services flyer in `public/images/` were derived from official PDFs supplied by the hospital.
- Facility photography remains intentionally represented by labelled placeholders until verified hospital photos are available.

No medical prices, clinical outcomes, accreditations, staff credentials, or patient testimonials are invented in this project.

## Recovery note

This source was recovered from the existing Firebase deployment artifacts and public assets without modifying the deployed site. The `.firebase` generated cache is not part of this repository and must never be treated as canonical source.
