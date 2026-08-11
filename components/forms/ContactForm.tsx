"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@/lib/validation";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(data: ContactInput) {
    setStatus("idle");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Alert variant="success" title="Message received.">
        Thank you for reaching out — a member of our team will get back to you.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Alert variant="warning" title="Online messages are being upgraded.">
        Please call Satellite General Hospital on 0303984314 or 059 257 5075.
      </Alert>
      {status === "error" ? (
        <Alert variant="warning" title="Something went wrong.">
          Please try again, or call the hospital directly.
        </Alert>
      ) : null}
      <Input label="Full Name" id="contact-fullName" required error={errors.fullName?.message} {...register("fullName")} />
      <Input label="Phone Number" id="contact-phone" type="tel" required error={errors.phone?.message} {...register("phone")} />
      <Textarea label="Message" id="contact-message" required error={errors.message?.message} {...register("message")} />
      <Button type="submit" disabled className="w-full sm:w-fit">
        Online messages temporarily unavailable
      </Button>
    </form>
  );
}
