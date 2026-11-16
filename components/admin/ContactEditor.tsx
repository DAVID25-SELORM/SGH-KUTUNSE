"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AGE_GROUPS,
  CONTACT_SOURCES,
  GENDERS,
  SMS_CONSENT_SCOPES,
} from "@/lib/contacts";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
type Contact = Record<string, unknown> & { id?: string };
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
export function ContactEditor({
  initial = {},
  canDelete = false,
}: {
  initial?: Contact;
  canDelete?: boolean;
}) {
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmation, setConfirmation] = useState<
      { kind: "delete" } | { kind: "merge"; targetId: string } | null
    >(null);
  const id = String(initial.id ?? "");
  async function save(fd: FormData) {
    setBusy(true);
    setMessage("");
    const optedIn = fd.get("smsOptIn") === "on";
    const selectedScopes = SMS_CONSENT_SCOPES.filter(
      (scope) => fd.get(`scope_${scope}`) === "on",
    );
    const body = {
      fullName: fd.get("fullName"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      gender: fd.get("gender"),
      dateOfBirth: fd.get("dateOfBirth"),
      age: fd.get("age"),
      ageGroup: fd.get("ageGroup"),
      source: fd.get("source"),
      sourceLabel: fd.get("sourceLabel"),
      facility: fd.get("facility"),
      group: fd.get("group"),
      tags: String(fd.get("tags") ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      smsOptIn: optedIn,
      smsConsentStatus: optedIn
        ? "opted_in"
        : id
          ? "opted_out"
          : "unknown",
      smsConsentSource: String(
        initial.smsConsentSource ?? (optedIn ? fd.get("source") : ""),
      ),
      smsConsentScope: optedIn
        ? selectedScopes.length
          ? selectedScopes
          : ["feedback_request"]
        : [],
      smsConsentDate: String(initial.smsConsentDate ?? ""),
      smsConsentEvidenceNote: String(initial.smsConsentEvidenceNote ?? ""),
      emailOptIn: fd.get("emailOptIn") === "on",
      doNotContact: fd.get("doNotContact") === "on",
      notes: fd.get("notes"),
      status: fd.get("status"),
    };
    const r = await fetch(
      id ? `/api/admin/contacts/${id}` : "/api/admin/contacts",
      {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setMessage(j.message ?? "Contact could not be saved.");
    setMessage("Contact saved.");
    if (!id || j.id) router.push(`/admin/contacts/${j.id}`);
    else router.refresh();
  }
  async function remove() {
    setBusy(true);
    const r = await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setMessage(j.message ?? "Contact could not be removed.");
    router.push("/admin/contacts");
  }
  async function merge(targetId: string) {
    setBusy(true);
    const r = await fetch(`/api/admin/contacts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setMessage(j.message ?? "Contacts could not be merged.");
    router.push(`/admin/contacts/${j.id}`);
  }
  const field = "mt-1 w-full rounded-xl border bg-white px-3 py-2";
  return (
    <div className="space-y-6">
      <form
        action={save}
        className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2"
      >
        <label className="text-sm font-semibold">
          Full name
          <input
            name="fullName"
            defaultValue={String(initial.fullName ?? initial.name ?? "")}
            maxLength={120}
            required
            className={field}
          />
        </label>
        <label className="text-sm font-semibold">
          Phone
          <input
            name="phone"
            defaultValue={String(
              initial.normalizedPhone ?? initial.phone ?? "",
            )}
            required
            inputMode="tel"
            className={field}
          />
        </label>
        <label className="text-sm font-semibold">
          Email
          <input
            name="email"
            type="email"
            defaultValue={String(initial.email ?? "")}
            className={field}
          />
        </label>
        <label className="text-sm font-semibold">
          Gender
          <select
            name="gender"
            defaultValue={String(initial.gender ?? "")}
            className={field}
          >
            {GENDERS.map((x) => (
              <option key={x} value={x}>
                {x ? label(x) : "Not provided"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Date of birth
          <input
            name="dateOfBirth"
            type="date"
            defaultValue={String(initial.dateOfBirth ?? "")}
            className={field}
          />
        </label>
        <label className="text-sm font-semibold">
          Age (when DOB is unknown)
          <input
            name="age"
            type="number"
            min="0"
            max="125"
            defaultValue={initial.age == null ? "" : String(initial.age)}
            className={field}
          />
        </label>
        <label className="text-sm font-semibold">
          Age group
          <select
            name="ageGroup"
            defaultValue={String(initial.ageGroup ?? "")}
            className={field}
          >
            <option value="">Not provided</option>
            {AGE_GROUPS.map((x) => (
              <option key={x} value={x}>
                {label(x)
                  .replace("65 Plus", "65+")
                  .replace("Under 18", "Under 18")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Contact Category
          <select
            name="source"
            defaultValue={String(initial.source ?? "other")}
            className={field}
          >
            {CONTACT_SOURCES.map((x) => (
              <option key={x} value={x}>
                {label(x)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Other category label (optional)
          <input name="sourceLabel" defaultValue={String(initial.sourceLabel ?? "")} maxLength={80} className={field} />
        </label>
        <label className="text-sm font-semibold">
          Facility / screening event
          <input
            name="facility"
            defaultValue={String(initial.facility ?? "")}
            placeholder="Kutunse Screening - Aug 2026"
            className={field}
          />
        </label>
        <label className="text-sm font-semibold">
          Group
          <input
            name="group"
            defaultValue={String(initial.group ?? "")}
            className={field}
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Tags (comma separated)
          <input
            name="tags"
            defaultValue={
              Array.isArray(initial.tags) ? initial.tags.join(", ") : ""
            }
            className={field}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            name="smsOptIn"
            type="checkbox"
            defaultChecked={initial.smsOptIn === true}
          />{" "}
          SMS consent
        </label>
        <fieldset className="rounded-xl border p-3 sm:col-span-2">
          <legend className="px-1 text-sm font-semibold">
            SMS consent applies to
          </legend>
          {SMS_CONSENT_SCOPES.map((scope) => {
            const existing = Array.isArray(initial.smsConsentScope)
              ? initial.smsConsentScope.map(String)
              : [];
            return (
              <label key={scope} className="mr-5 inline-flex items-center gap-2 text-sm">
                <input
                  name={`scope_${scope}`}
                  type="checkbox"
                  defaultChecked={
                    existing.length
                      ? existing.includes(scope)
                      : scope === "feedback_request"
                  }
                />
                {scope === "feedback_request"
                  ? "Feedback requests"
                  : scope === "health_screening_followup"
                    ? "Health screening follow-up"
                    : "General broadcasts & service messages"}
              </label>
            );
          })}
        </fieldset>
        <label className="flex items-center gap-2">
          <input
            name="emailOptIn"
            type="checkbox"
            defaultChecked={initial.emailOptIn === true}
          />{" "}
          Email consent
        </label>
        <label className="flex items-center gap-2">
          <input
            name="doNotContact"
            type="checkbox"
            defaultChecked={initial.doNotContact === true}
          />{" "}
          Do not contact
        </label>
        <label className="text-sm font-semibold">
          Status
          <select
            name="status"
            defaultValue={String(initial.status ?? "active")}
            className={field}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Internal notes
          <textarea
            name="notes"
            rows={4}
            maxLength={3000}
            defaultValue={String(initial.notes ?? "")}
            className={field}
          />
        </label>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            disabled={busy}
            className="rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save contact"}
          </button>
          {id && canDelete ? (
            <button
              type="button"
              onClick={() => setConfirmation({ kind: "delete" })}
              disabled={busy}
              className="rounded-xl border border-red-300 px-5 py-3 font-semibold text-red-700"
            >
              Delete safely
            </button>
          ) : null}
        </div>
        {message ? (
          <p role="status" className="sm:col-span-2">
            {message}
          </p>
        ) : null}
      </form>
      {id ? (
        <form
          action={(formData) =>
            setConfirmation({
              kind: "merge",
              targetId: String(formData.get("targetId") ?? ""),
            })
          }
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
        >
          <h2 className="font-semibold">Merge duplicate</h2>
          <p className="mt-1 text-sm">
            Enter the destination contact ID. This contact is archived and its
            source/tags are preserved.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              name="targetId"
              required
              pattern="[a-f0-9]{64}"
              placeholder="Destination contact ID"
              className="min-h-11 flex-1 rounded-xl border px-3"
            />
            <button
              disabled={busy}
              className="rounded-xl border border-amber-500 px-5 py-2 font-semibold"
            >
              Merge contact
            </button>
          </div>
        </form>
      ) : null}
      <ConfirmModal
        open={confirmation !== null}
        title={
          confirmation?.kind === "merge"
            ? "Merge Duplicate Contact"
            : "Delete Contact"
        }
        description={
          confirmation?.kind === "merge"
            ? "Merge this contact into the selected destination? This contact will be archived and its source and tags preserved."
            : "Delete this contact? Referenced contacts will be archived and anonymized instead."
        }
        confirmLabel={
          confirmation?.kind === "merge" ? "Merge Contact" : "Delete Safely"
        }
        dangerous
        disabled={busy}
        onClose={() => setConfirmation(null)}
        onConfirm={async () => {
          const current = confirmation;
          if (!current) return;
          if (current.kind === "merge") await merge(current.targetId);
          else await remove();
          setConfirmation(null);
        }}
      />
    </div>
  );
}
