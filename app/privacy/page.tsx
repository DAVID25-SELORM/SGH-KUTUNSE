import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/shared/PageHero";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `How ${HOSPITAL.name} handles information submitted through this website.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" crumbs={[{ label: "Privacy Policy" }]} />
      <section className="py-16 sm:py-20">
        <Container className="mx-auto flex max-w-3xl flex-col gap-6 text-sm leading-relaxed text-text-body">
          <p>
            This page describes, in general terms, how {HOSPITAL.name} handles information submitted through
            this website. It is a placeholder policy pending full legal review and should not be treated as a
            complete or final privacy policy.
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-dark">Information We Collect</h2>
          <p>
            We collect information you voluntarily submit through forms on this website, such as your name,
            phone number, email address, and details relevant to appointment or enquiry requests.
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-dark">How We Use Information</h2>
          <p>
            Information submitted is used to respond to your request — for example, to contact you about an
            appointment, insurance verification, or general enquiry. We do not sell personal information.
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-dark">Data Protection</h2>
          <p>
            We take reasonable steps to protect information submitted through this website. This policy does not
            constitute a claim of compliance with any specific data protection law or standard; a formal
            compliance assessment has not yet been carried out.
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-dark">Contact</h2>
          <p>
            For questions about this policy, please reach out via our{" "}
            <a href="/contact" className="font-medium text-purple-deep hover:text-purple-dark">
              Contact page
            </a>
            .
          </p>
        </Container>
      </section>
    </>
  );
}
