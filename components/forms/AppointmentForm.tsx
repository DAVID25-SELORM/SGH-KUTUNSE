"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, type AppointmentInput } from "@/lib/validation";
import { services } from "@/data/services";
import { doctors } from "@/data/doctors";
import { insurers } from "@/data/insurers";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { appCheckHeaders } from "@/lib/app-check";

export function AppointmentForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [reference, setReference] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentInput>({ resolver: zodResolver(appointmentSchema) });

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
      reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Alert variant="success" title="Appointment request received.">
        Your reference is <strong>{reference}</strong>. A hospital representative will contact you to confirm availability. If your need is urgent, please call
        the hospital directly.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {status === "error" ? (
        <Alert variant="warning" title="Something went wrong.">
          Please try again, or call the hospital directly to book your appointment.
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Full Name" id="fullName" required error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Phone Number" id="phone" type="tel" required error={errors.phone?.message} {...register("phone")} />
        <Input label="Email" id="email" type="email" error={errors.email?.message} {...register("email")} />
        <Select label="Sex" id="sex" required error={errors.sex?.message} defaultValue="" {...register("sex")}>
          <option value="" disabled>
            Select
          </option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </Select>
        <Input
          label="Date of Birth"
          id="dateOfBirth"
          type="date"
          required
          error={errors.dateOfBirth?.message}
          {...register("dateOfBirth")}
        />
        <Select
          label="New or Existing Patient"
          id="patientType"
          required
          error={errors.patientType?.message}
          defaultValue=""
          {...register("patientType")}
        >
          <option value="" disabled>
            Select
          </option>
          <option value="New Patient">New Patient</option>
          <option value="Existing Patient">Existing Patient</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select label="Service / Department" id="service" required error={errors.service?.message} defaultValue="" {...register("service")}>
          <option value="" disabled>
            Select a service
          </option>
          {services.map((s) => (
            <option key={s.slug} value={s.name}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select label="Preferred Doctor (optional)" id="preferredDoctor" defaultValue="" {...register("preferredDoctor")}>
          <option value="">No preference</option>
          {doctors.map((d) => (
            <option key={d.slug} value={d.fullName}>
              {d.fullName} — {d.specialty}
            </option>
          ))}
        </Select>
        <Input
          label="Preferred Date"
          id="preferredDate"
          type="date"
          required
          error={errors.preferredDate?.message}
          {...register("preferredDate")}
        />
        <Input
          label="Preferred Time"
          id="preferredTime"
          type="time"
          required
          error={errors.preferredTime?.message}
          {...register("preferredTime")}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          label="Self Pay or Insurance"
          id="paymentMethod"
          required
          error={errors.paymentMethod?.message}
          defaultValue=""
          {...register("paymentMethod")}
        >
          <option value="" disabled>
            Select
          </option>
          <option value="Self Pay">Self Pay</option>
          <option value="Insurance">Insurance</option>
        </Select>
        <Select label="Insurance Provider (if applicable)" id="insuranceProvider" defaultValue="" {...register("insuranceProvider")}>
          <option value="">Not applicable</option>
          {insurers.map((i) => (
            <option key={i.name} value={i.name}>
              {i.name}
            </option>
          ))}
        </Select>
      </div>

      <Textarea
        label="Reason for Visit"
        id="reasonForVisit"
        required
        error={errors.reasonForVisit?.message}
        placeholder="Briefly describe why you'd like to see a doctor"
        {...register("reasonForVisit")}
      />

      <Checkbox
        id="consent"
        error={errors.consent?.message}
        label="I consent to Satellite General Hospital contacting me to confirm this appointment request."
        {...register("consent")}
      />

      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register("website")} />
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Submitting request…" : "Request Appointment"}
      </Button>
    </form>
  );
}
