"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insuranceVerificationSchema, type InsuranceVerificationInput } from "@/lib/validation";
import { insurers } from "@/data/insurers";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { appCheckHeaders } from "@/lib/app-check";

export function InsuranceVerificationForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [reference, setReference] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InsuranceVerificationInput>({ resolver: zodResolver(insuranceVerificationSchema) });

  async function onSubmit(data: InsuranceVerificationInput) {
    setStatus("idle");
    try {
      const res = await fetch("/api/insurance-verify", {
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
      <Alert variant="success" title="Request received.">
        Your reference is <strong>{reference}</strong>. The hospital will contact you to help verify eligibility for the service you need.
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Full Name" id="iv-fullName" required error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Phone Number" id="iv-phone" type="tel" required error={errors.phone?.message} {...register("phone")} />
        <Select label="Insurer" id="iv-insurer" required error={errors.insurer?.message} defaultValue="" {...register("insurer")}>
          <option value="" disabled>
            Select your insurer
          </option>
          {insurers.map((i) => (
            <option key={i.name} value={i.name}>
              {i.name}
            </option>
          ))}
        </Select>
        <Input label="Member ID (optional)" id="iv-memberId" {...register("memberId")} />
      </div>
      <Input label="Service Needed" id="iv-service" required error={errors.serviceNeeded?.message} {...register("serviceNeeded")} />
      <Textarea label="Message (optional)" id="iv-message" {...register("message")} />
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register("website")} />
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Submitting request…" : "Request Insurance Verification"}
      </Button>
    </form>
  );
}
