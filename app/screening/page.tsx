import type { Metadata } from "next";
import { HeartPulse, Building2, Briefcase, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHero } from "@/components/shared/PageHero";
import { CTASection } from "@/components/shared/CTASection";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Health Screening",
  description: `Preventive health screening packages available at ${HOSPITAL.name}, covering BMI, blood pressure, blood glucose and more.`,
  path: "/screening",
});

const packages = [
  {
    icon: Sparkles,
    title: "Basic Health Screening",
    description: "Covers general indicators including BMI, weight, height, blood pressure and pulse.",
  },
  {
    icon: HeartPulse,
    title: "Cardiometabolic Screening",
    description: "Focused on cardiovascular and metabolic indicators, including blood glucose.",
  },
  {
    icon: Building2,
    title: "Corporate Screening",
    description: "On-site or hospital-based screening designed for organisations and teams.",
  },
  {
    icon: Briefcase,
    title: "Pre-Employment Screening",
    description: "Health screening packages suited to pre-employment requirements.",
  },
];

const includedChecks = ["BMI", "Weight", "Height", "Blood Pressure", "Pulse", "Blood Glucose", "ENT", "General Counselling"];

export default function ScreeningPage() {
  return (
    <>
      <PageHero
        eyebrow="Preventive Care"
        title="Health Screening Services"
        description="Screening packages designed to help you understand and manage your health proactively."
        crumbs={[{ label: "Health Screening" }]}
      />

      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {packages.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-text-dark">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-body">{description}</p>
                <p className="mt-3 text-xs font-medium text-text-muted">Contact the hospital for package details.</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-border-default bg-bg-soft p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-text-dark">General Wellness Screening Typically Includes</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {includedChecks.map((check) => (
                <Badge key={check} variant="outline">
                  {check}
                </Badge>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <CTASection
        title="Ready to book a screening?"
        description="Book an appointment and select a health screening service, or call the hospital to ask about package details."
      />
    </>
  );
}
