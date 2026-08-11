import { SearchX } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center py-20">
      <Container className="mx-auto flex max-w-md flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
          <SearchX className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-text-dark">Page Not Found</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-body">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/">Back to Home</Button>
          <Button href="/contact" variant="outline">
            Contact Us
          </Button>
        </div>
      </Container>
    </section>
  );
}
