import { Clock3, HeartHandshake, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";

const facts = [
  { value: "24/7", label: "Healthcare available", icon: Clock3 },
  { value: "Multiple", label: "Medical specialties", icon: HeartHandshake },
  { value: "Major", label: "Insurance partners accepted", icon: ShieldCheck },
];

export function HospitalFacts() {
  return (
    <section className="bg-purple-dark py-20 text-white sm:py-24">
      <Container>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Care you can count on</p>
        <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-0">
          {facts.map(({ value, label, icon: Icon }, index) => (
            <div key={label} className={`text-center ${index ? "sm:border-l sm:border-white/15" : ""}`}>
              <Icon className="mx-auto h-6 w-6 text-pink-accent" aria-hidden="true" />
              <p className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">{value}</p>
              <p className="mt-2 text-sm text-white/65 sm:text-base">{label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
