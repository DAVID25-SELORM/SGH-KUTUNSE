import type { Metadata } from "next";
import { Briefcase, Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PageHero } from "@/components/shared/PageHero";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Careers",
  description: `Careers and employment opportunities at ${HOSPITAL.name}.`,
  path: "/careers",
});

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Join Our Team"
        description="We're always interested in hearing from qualified healthcare professionals and support staff."
        crumbs={[{ label: "Careers" }]}
      />

      <section className="py-20 sm:py-24">
        <Container className="mx-auto max-w-2xl text-center">
          <Card>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
              <Briefcase className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-text-dark">No Open Positions Listed Currently</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-body">
              We don&apos;t have specific vacancies published at the moment. If you&apos;d like to be considered for future
              opportunities, please get in touch through our Contact page.
            </p>
            <a
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-deep hover:text-purple-dark"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contact the Hospital
            </a>
          </Card>
        </Container>
      </section>
    </>
  );
}
