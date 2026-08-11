import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/shared/PageHero";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Terms & Medical Disclaimer",
  description: `Terms of use and medical disclaimer for the ${HOSPITAL.name} website.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms & Medical Disclaimer" crumbs={[{ label: "Terms" }]} />
      <section className="py-16 sm:py-20">
        <Container className="mx-auto flex max-w-3xl flex-col gap-6 text-sm leading-relaxed text-text-body">
          <p>
            These terms are a placeholder pending full legal review and govern general use of this website for
            {" "}{HOSPITAL.name}.
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-dark">Website Use</h2>
          <p>
            This website provides general information about Satellite General Hospital and its services. It is
            not a substitute for professional medical advice, diagnosis, or treatment.
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-dark">Appointment Requests</h2>
          <p>
            Submitting a form on this website (such as an appointment request) does not constitute a confirmed
            appointment. A hospital representative will contact you to confirm availability.
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-dark">Medical Disclaimer</h2>
          <p>
            Health articles and information on this website are for general educational purposes only and do not
            replace consultation with a qualified healthcare professional. Always seek the advice of a doctor
            for any questions regarding a medical condition.
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-dark">Insurance Information</h2>
          <p>
            Listed insurance partners reflect accepted/partner insurers only. Coverage and benefits depend on
            your specific policy; please confirm eligibility with the hospital or your insurer before your visit.
          </p>
        </Container>
      </section>
    </>
  );
}
