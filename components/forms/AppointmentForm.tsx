"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle, Phone } from "lucide-react";
import { APPOINTMENT_DAYS, APPOINTMENT_NEEDS, appointmentSchema, type AppointmentInput } from "@/lib/validation";
import { insurers } from "@/data/insurers";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { appCheckHeaders } from "@/lib/app-check";
import { trackEvent } from "@/lib/analytics-events";
import { HOSPITAL } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

const WHATSAPP_BUTTON = "bg-[#25D366] text-white hover:bg-[#1ebe5b] border-transparent";

export function AppointmentForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [reference, setReference] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { preferredDay: "Today" },
  });
  const pickADay = useWatch({ control, name: "preferredDay" }) === "Pick a day";

  async function onSubmit(data: AppointmentInput) {
    setStatus("idle");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await appCheckHeaders()) },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error("Request failed");
      setReference(result.reference);
      setStatus("success");
      void trackEvent("generate_lead", { form_name: "appointment" });
      reset({ preferredDay: "Today" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success" title="Request received. We'll confirm within 30 minutes.">
          Your reference is <strong>{reference}</strong>. A hospital representative will confirm your appointment by WhatsApp or phone, 24/7. If it is
          urgent, call {HOSPITAL.phones[0]} or come straight in.
        </Alert>
        <Button
          href={whatsappLink(`Hello SGH, I sent an appointment request. My reference is ${reference}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full sm:w-fit ${WHATSAPP_BUTTON}`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Message us about this request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="rounded-2xl bg-bg-soft p-4 text-sm text-text-body">
        <strong className="text-text-dark">Book in under a minute.</strong> We confirm by WhatsApp or phone within 30 minutes, 24/7.
        <br />
        Unwell now? Don&apos;t wait for an appointment. Call{" "}
        <a href={`tel:${HOSPITAL.phonesTel[0]}`} className="font-semibold text-purple-deep">
          {HOSPITAL.phones[0]}
        </a>{" "}
        or come straight in: we&apos;re open 24 hours.
      </div>

      {status === "error" ? (
        <Alert variant="warning" title="Something went wrong.">
          Please try again, or message us on WhatsApp or call the hospital directly to book your appointment.
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Full Name" id="fullName" required autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <Input
          label="Phone (WhatsApp)"
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>

      <Select label="What do you need?" id="service" required error={errors.service?.message} defaultValue="" {...register("service")}>
        <option value="" disabled>
          Choose one
        </option>
        {APPOINTMENT_NEEDS.map((need) => (
          <option key={need} value={need}>
            {need}
          </option>
        ))}
      </Select>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-text-dark">
          When? <span className="text-pink-accent">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {APPOINTMENT_DAYS.map((day) => (
            <label key={day} className="cursor-pointer">
              <input type="radio" value={day} className="peer sr-only" {...register("preferredDay")} />
              <span className="inline-flex min-h-11 items-center rounded-xl border border-border-default bg-white px-4 text-sm font-medium text-text-dark peer-checked:border-purple-deep peer-checked:bg-purple-deep peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-purple-deep">
                {day}
              </span>
            </label>
          ))}
        </div>
        {errors.preferredDay?.message ? (
          <p role="alert" className="text-xs font-medium text-pink-dark">
            {errors.preferredDay.message}
          </p>
        ) : null}
      </fieldset>

      {pickADay ? (
        <Input
          label="Which day?"
          id="preferredDate"
          type="date"
          required
          min={new Date().toISOString().slice(0, 10)}
          error={errors.preferredDate?.message}
          {...register("preferredDate")}
        />
      ) : null}

      <details className="rounded-2xl border border-border-default p-4">
        <summary className="cursor-pointer text-sm font-semibold text-purple-deep">Add more details (optional)</summary>
        <div className="mt-4 flex flex-col gap-5">
          <Select label="Insurance provider" id="insuranceProvider" defaultValue="" {...register("insuranceProvider")}>
            <option value="">Not applicable / self pay</option>
            {insurers.map((i) => (
              <option key={i.name} value={i.name}>
                {i.name}
              </option>
            ))}
          </Select>
          <Textarea
            label="Anything we should know?"
            id="notes"
            error={errors.notes?.message}
            placeholder="Please do not include test results or other sensitive medical details"
            {...register("notes")}
          />
        </div>
      </details>

      <Checkbox
        id="consent"
        error={errors.consent?.message}
        label="I consent to Satellite General Hospital contacting me by phone, SMS or WhatsApp to confirm this appointment request."
        {...register("consent")}
      />

      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register("website")} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-fit">
          {isSubmitting ? "Sending…" : "Request my appointment"}
        </Button>
        <Button
          href={whatsappLink("Hello SGH, I'd like to book an appointment.")}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full sm:w-fit ${WHATSAPP_BUTTON}`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Book on WhatsApp
        </Button>
        <Button href={`tel:${HOSPITAL.phonesTel[0]}`} variant="outline" className="w-full sm:w-fit">
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </Button>
      </div>
    </form>
  );
}
