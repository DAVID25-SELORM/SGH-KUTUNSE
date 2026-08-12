"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@/lib/validation";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { appCheckHeaders } from "@/lib/app-check";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [reference, setReference] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  async function onSubmit(data: ContactInput) {
    setStatus("idle");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await appCheckHeaders()) },
        body: JSON.stringify(data),
      });
      const result = await res.json(); if (!res.ok) throw new Error("Request failed"); setReference(result.reference);
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Alert variant="success" title="Message received.">
        Your reference is <strong>{reference}</strong>. Thank you for reaching out — a member of our team will get back to you.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {status === "error" ? (
        <Alert variant="warning" title="Something went wrong.">
          Please try again, or call the hospital directly.
        </Alert>
      ) : null}
      <Input label="Full Name" id="contact-fullName" required error={errors.fullName?.message} {...register("fullName")} />
      <Input label="Phone Number" id="contact-phone" type="tel" required error={errors.phone?.message} {...register("phone")} />
      <Input label="Email (optional)" id="contact-email" type="email" error={errors.email?.message} {...register("email")} />
      <Input label="Subject (optional)" id="contact-subject" error={errors.subject?.message} {...register("subject")} />
      <Textarea label="Message" id="contact-message" required error={errors.message?.message} {...register("message")} />
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register("website")} />
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
