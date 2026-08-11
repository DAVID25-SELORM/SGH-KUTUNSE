"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { corporateEnquirySchema, type CorporateEnquiryInput } from "@/lib/validation";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function CorporateEnquiryForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CorporateEnquiryInput>({ resolver: zodResolver(corporateEnquirySchema) });

  async function onSubmit(data: CorporateEnquiryInput) {
    setStatus("idle");
    try {
      const res = await fetch("/api/corporate-enquiry", {
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
      <Alert variant="success" title="Enquiry received.">
        Thank you — our team will contact you to discuss a corporate wellness proposal for your organisation.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Alert variant="warning" title="Online corporate enquiries are being upgraded.">
        Please call Satellite General Hospital on 0303984314 or 059 257 5075.
      </Alert>
      {status === "error" ? (
        <Alert variant="warning" title="Something went wrong.">
          Please try again, or call the hospital directly.
        </Alert>
      ) : null}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Company Name" id="ce-company" required error={errors.companyName?.message} {...register("companyName")} />
        <Input label="Contact Person" id="ce-contact" required error={errors.contactName?.message} {...register("contactName")} />
        <Input label="Phone Number" id="ce-phone" type="tel" required error={errors.phone?.message} {...register("phone")} />
        <Input label="Email" id="ce-email" type="email" required error={errors.email?.message} {...register("email")} />
        <Input label="Number of Employees (optional)" id="ce-employees" {...register("employeeCount")} />
      </div>
      <Textarea
        label="What are you interested in?"
        id="ce-interests"
        required
        error={errors.interests?.message}
        placeholder="E.g. health screening, wellness programmes, health education"
        {...register("interests")}
      />
      <Button type="submit" disabled className="w-full sm:w-fit">
        Online enquiries temporarily unavailable
      </Button>
    </form>
  );
}
