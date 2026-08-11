import Image from "next/image";
import { Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { HOSPITAL } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-7.5rem)] items-center overflow-hidden bg-purple-dark text-white">
      <Image
        src="/images/hero/hospital-care-team.png"
        alt="Healthcare professionals featured in Satellite General Hospital's official material"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[68%_20%] opacity-80 sm:object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(40,9,43,0.96)_0%,rgba(70,18,73,0.82)_42%,rgba(102,28,105,0.3)_72%,rgba(102,28,105,0.12)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(39,8,41,0.72)_0%,transparent_38%)] sm:hidden" />

      <Container className="relative z-10 py-24 sm:py-32 lg:py-40">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
            <Clock className="h-3.5 w-3.5 text-pink-accent" aria-hidden="true" />
            Open 24 hours, every day
          </span>

          <h1 className="mt-7 max-w-4xl text-[2.7rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white min-[390px]:text-[3.15rem] sm:text-7xl lg:text-[6.7rem]">
            Friendly Healthcare.
            <span className="mt-2 block text-white/72">Premium Experience.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-white/75 sm:text-xl sm:leading-8">
            Comprehensive healthcare available 24/7 for you and your family at {HOSPITAL.name}.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/appointments" size="lg" className="shadow-[0_16px_40px_-14px_rgba(236,8,140,0.7)]">
              Book Appointment
            </Button>
            <Button
              href={`tel:${HOSPITAL.phonesTel[0]}`}
              variant="outline"
              size="lg"
              className="border-white/35 bg-white/10 text-white backdrop-blur-md hover:bg-white hover:text-purple-dark"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call Hospital
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
