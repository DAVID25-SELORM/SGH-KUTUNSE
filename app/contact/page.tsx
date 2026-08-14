import type { Metadata } from "next";
import { Phone, MapPin, Clock, Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/shared/PageHero";
import { MapSection } from "@/components/shared/MapSection";
import { ContactForm } from "@/components/forms/ContactForm";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description: `Contact ${HOSPITAL.name} — call, send a message, or get directions to our Kuntunse Satellite location.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in Touch"
        description="We're here 24/7. Call us directly, send a message, or find directions to the hospital."
        crumbs={[{ label: "Contact" }]}
      />

      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-1">
            <Card>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-text-dark">Operating Hours</h3>
              <p className="mt-1 text-sm text-text-body">{HOSPITAL.hours}</p>
            </Card>

            <Card>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                <Phone className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-text-dark">Phone</h3>
              <div className="mt-2 flex flex-col gap-2">
                {HOSPITAL.phones.map((phone, i) => (
                  <Button key={phone} href={`tel:${HOSPITAL.phonesTel[i]}`} variant="outline" size="sm" className="w-fit">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {phone}
                  </Button>
                ))}
              </div>
            </Card>

            <Card>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-text-dark">Location</h3>
              <p className="mt-1 text-sm text-text-body">{HOSPITAL.address}</p>
            </Card>

            {HOSPITAL.email ? (
              <Card>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-text-dark">Email</h3>
                <p className="mt-1 text-sm text-text-body">{HOSPITAL.email}</p>
              </Card>
            ) : null}
          </div>

          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-text-dark">Send Us a Message</h2>
            <div className="mt-5">
              <ContactForm />
            </div>
          </Card>
        </Container>
      </section>

      <section className="pb-20 sm:pb-24">
        <Container>
          <MapSection />
        </Container>
      </section>
    </>
  );
}
