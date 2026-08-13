"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackSchema, type FeedbackInput, type FeedbackFormInput } from "@/lib/validation";
import { services } from "@/data/services";
import { appCheckHeaders } from "@/lib/app-check";
const scales = [
  [1, "Very Poor"],
  [2, "Poor"],
  [3, "Fair"],
  [4, "Good"],
  [5, "Excellent"],
] as const;
const ratingLabels = {
  reception: "Reception / welcome",
  waitingTime: "Waiting time",
  professionalism: "Staff courtesy and professionalism",
  cleanliness: "Cleanliness and comfort",
  communication: "Clarity of explanations / instructions",
  overallQuality: "Overall quality of care",
} as const;
export function FeedbackForm() {
  const [step, setStep] = useState(1);
  const [reference, setReference] = useState("");
  const [serverError, setServerError] = useState("");
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormInput, unknown, FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      source: "website",
      contactRequested: false,
      ratings: {
        reception: 4,
        waitingTime: 4,
        professionalism: 4,
        cleanliness: 4,
        communication: 4,
        overallQuality: 4,
      },
    },
  });
  const visit = watch("visitType"),
    service = watch("serviceUnit"),
    sat = watch("overallSatisfaction"),
    receipt = watch("receiptConcern"),
    contact = watch("contactRequested");
  async function submit(data: FeedbackInput) {
    setServerError("");
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await appCheckHeaders()),
        },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error();
      setReference(j.reference);
    } catch {
      setServerError(
        "Your feedback could not be saved. Your answers remain on this page; please try again.",
      );
    }
  }
  if (reference)
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8">
        <h2 className="text-2xl font-semibold">Thank you for your feedback.</h2>
        <p className="mt-3">
          Your response has been received. Reference:{" "}
          <strong>{reference}</strong>
        </p>
        {contact && (
          <p className="mt-2">
            A member of our team may contact you regarding your feedback.
          </p>
        )}
      </div>
    );
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      <div className="flex gap-2" aria-label={`Step ${step} of 4`}>
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-2 flex-1 rounded ${n <= step ? "bg-purple-deep" : "bg-border-default"}`}
          />
        ))}
      </div>
      {step === 1 && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">1. Your visit</h2>
          <fieldset>
            <legend className="font-semibold">
              What type of service did you receive?
            </legend>
            <label className="mt-3 block">
              <input
                type="radio"
                value="health_screening"
                {...register("visitType")}
              />{" "}
              Health Screening
            </label>
            <label className="mt-3 block">
              <input
                type="radio"
                value="facility_visit"
                {...register("visitType")}
              />{" "}
              Hospital / Facility Visit
            </label>
          </fieldset>
          {visit === "facility_visit" && (
            <label className="block font-semibold">
              Which service/unit did you visit?
              <select
                {...register("serviceUnit")}
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="">Select</option>
                {services.map((s) => (
                  <option key={s.slug}>{s.name}</option>
                ))}
                <option>Other</option>
              </select>
            </label>
          )}
          {service === "Other" && (
            <label className="block font-semibold">
              Other service
              <input
                {...register("otherService")}
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
          )}
          <label className="block font-semibold">
            Date of visit
            <input
              type="date"
              {...register("visitDate")}
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
        </section>
      )}
      {step === 2 && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">2. Your experience</h2>
          {Object.entries(ratingLabels).map(([key, label]) => (
            <fieldset key={key}>
              <legend className="font-semibold">{label}</legend>
              <div className="mt-2 grid grid-cols-5 gap-1">
                {scales.map(([value, text]) => (
                  <label
                    key={value}
                    className="flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-xl border p-1 text-center text-xs"
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register(
                        `ratings.${key as keyof FeedbackInput["ratings"]}`,
                      )}
                    />
                    <span>{text}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </section>
      )}
      {step === 3 && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">3. Overall feedback</h2>
          <label className="block font-semibold">
            How satisfied were you with the overall quality of care?
            <select
              {...register("overallSatisfaction")}
              className="mt-2 w-full rounded-xl border p-3"
            >
              <option value="">Select</option>
              {[
                "very_satisfied",
                "satisfied",
                "neutral",
                "dissatisfied",
                "very_dissatisfied",
              ].map((x) => (
                <option key={x} value={x}>
                  {x.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          {sat && ["dissatisfied", "very_dissatisfied"].includes(sat) && (
            <>
              <label className="block font-semibold">
                Which unit or aspect were you dissatisfied with?
                <textarea
                  {...register("dissatisfactionAspect")}
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>
              <label className="block font-semibold">
                What happened or what could we have done better?
                <textarea
                  {...register("improvementDetails")}
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>
            </>
          )}
          <label className="block font-semibold">
            Would you recommend us?
            <select
              {...register("recommendation")}
              className="mt-2 w-full rounded-xl border p-3"
            >
              <option value="">Select</option>
              {[
                "definitely",
                "probably",
                "not_sure",
                "probably_not",
                "definitely_not",
              ].map((x) => (
                <option key={x} value={x}>
                  {x.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-semibold">
            Comments or suggestions
            <textarea
              {...register("comments")}
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
          <label className="block font-semibold">
            Staff member or service to appreciate
            <textarea
              {...register("appreciation")}
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
        </section>
      )}
      {step === 4 && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold">4. Receipt and follow-up</h2>
          <label className="block font-semibold">
            Did you make any payment without receiving an official receipt?
            <select
              {...register("receiptConcern")}
              className="mt-2 w-full rounded-xl border p-3"
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </label>
          {receipt === "yes" && (
            <div className="grid gap-3 rounded-2xl bg-bg-soft p-4 sm:grid-cols-2">
              <input
                placeholder="Unit/service"
                {...register("receiptDetails.unit")}
                className="rounded-xl border p-3"
              />
              <input
                placeholder="Person, if known"
                {...register("receiptDetails.person")}
                className="rounded-xl border p-3"
              />
              <input
                placeholder="Approximate amount"
                {...register("receiptDetails.amount")}
                className="rounded-xl border p-3"
              />
              <textarea
                placeholder="Details you remember"
                {...register("receiptDetails.explanation")}
                className="rounded-xl border p-3 sm:col-span-2"
              />
            </div>
          )}
          <label className="flex gap-3 rounded-xl border p-4">
            <input type="checkbox" {...register("contactRequested")} />
            <span>
              <strong>I would like to be contacted</strong>
              <br />
              <small>
                Optional details are used only to follow up on this feedback.
              </small>
            </span>
          </label>
          {contact && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Name (optional)"
                {...register("contactName")}
                className="rounded-xl border p-3"
              />
              <input
                placeholder="Phone"
                {...register("contactPhone")}
                className="rounded-xl border p-3"
              />
              <input
                placeholder="Email"
                {...register("contactEmail")}
                className="rounded-xl border p-3"
              />
              <select
                {...register("preferredContact")}
                className="rounded-xl border p-3"
              >
                <option value="either">Phone or email</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
              </select>
            </div>
          )}
          <p className="text-sm text-text-muted">
            No login is required. You may submit anonymously. Do not include
            Ghana Card, NHIS/member ID, diagnosis, medication or medical
            records.
          </p>
          <input className="hidden" tabIndex={-1} {...register("website")} />
          {serverError && (
            <p role="alert" className="rounded-xl bg-amber-50 p-3">
              {serverError}
            </p>
          )}
        </section>
      )}
      <p className="text-sm text-amber-800">
        {Object.values(errors).length
          ? "Please review the required information before submitting."
          : ""}
      </p>
      <div className="flex justify-between gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="min-h-11 rounded-xl border px-5 font-semibold"
          >
            Back
          </button>
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="ml-auto min-h-11 rounded-xl bg-purple-deep px-5 font-semibold text-white"
          >
            Continue
          </button>
        ) : (
          <button
            disabled={isSubmitting}
            className="ml-auto min-h-11 rounded-xl bg-pink-accent px-5 font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Submitting…" : "Submit feedback"}
          </button>
        )}
      </div>
    </form>
  );
}
