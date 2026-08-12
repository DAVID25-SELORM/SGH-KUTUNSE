"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { telemedicineRequestSchema, type TelemedicineRequestInput } from "@/lib/validation";
import { Input, Textarea } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { appCheckHeaders } from "@/lib/app-check";

export function TelemedicineRequestForm() {
  const [reference, setReference] = useState("");
  const [failed, setFailed] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TelemedicineRequestInput>({ resolver: zodResolver(telemedicineRequestSchema) });
  async function submit(data: TelemedicineRequestInput) {
    setFailed(false);
    try {
      const response = await fetch("/api/telemedicine", { method: "POST", headers: { "Content-Type": "application/json", ...(await appCheckHeaders()) }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error();
      setReference(result.reference); reset();
    } catch { setFailed(true); }
  }
  if (reference) return <Alert variant="success" title="Request received.">Your reference is <strong>{reference}</strong>. This is not a confirmed consultation; the hospital will contact you.</Alert>;
  return <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-5" noValidate>
    <Alert variant="warning" title="Not for emergencies">This form does not provide diagnosis or emergency care. For an emergency, call or proceed directly to the hospital.</Alert>
    {failed && <Alert variant="warning" title="Something went wrong.">Please try again or call the hospital.</Alert>}
    <Input label="Full Name" id="tm-name" required error={errors.fullName?.message} {...register("fullName")} />
    <Input label="Phone Number" id="tm-phone" type="tel" required error={errors.phone?.message} {...register("phone")} />
    <Input label="Email (optional)" id="tm-email" type="email" error={errors.email?.message} {...register("email")} />
    <Input label="Preferred contact time (optional)" id="tm-time" error={errors.preferredContactTime?.message} {...register("preferredContactTime")} />
    <Textarea label="How can the team help?" id="tm-request" required error={errors.request?.message} {...register("request")} />
    <Checkbox id="tm-consent" label="I consent to the hospital contacting me about this request." error={errors.consent?.message} {...register("consent")} />
    <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register("website")} />
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting request…" : "Request Telemedicine Contact"}</Button>
  </form>;
}
