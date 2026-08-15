import Link from "next/link";
import { ContactEditor } from "@/components/admin/ContactEditor";
import {
  AGE_GROUPS,
  CONTACT_SOURCES,
  contactMatchesDirectoryFilters,
  isSmsEligibleContact,
} from "@/lib/contacts";
import { humanizeFeedbackValue } from "@/lib/feedback-display";
import { recipientKey } from "@/lib/feedback-campaigns";
import { normalizeGhanaPhone } from "@/lib/sms";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";
import {
  ensureApprovedStaffContacts,
  ensureLegacyCampaignContacts,
} from "@/lib/server/feedback-contacts";
import { hasPermission } from "@/lib/types/admin";

type Params = {
  q?: string;
  source?: string;
  gender?: string;
  ageGroup?: string;
  facility?: string;
  tag?: string;
  consent?: string;
  status?: string;
  page?: string;
};
type ContactRow = Record<string, unknown> & { id: string };
const PAGE_SIZE = 20;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const session = await requireAdmin("contacts");
  await ensureApprovedStaffContacts();
  await ensureLegacyCampaignContacts();
  const filters = await searchParams;
  const snapshot = await adminDb.collection("feedback_contacts").get();
  const allRows = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as ContactRow,
  );
  const matchingRows = allRows.filter((contact) =>
    contactMatchesDirectoryFilters(contact, filters),
  );
  const eligibleByPhone = new Map<string, ContactRow>();
  for (const contact of matchingRows) {
    if (!isSmsEligibleContact(contact)) continue;
    const phone = normalizeGhanaPhone(
      String(contact.normalizedPhone ?? contact.phone ?? ""),
    );
    if (phone) eligibleByPhone.set(recipientKey(phone), contact);
  }
  const eligibleEntries = [...eligibleByPhone.entries()],
    optedOut = new Set<string>();
  for (let offset = 0; offset < eligibleEntries.length; offset += 400) {
    const group = eligibleEntries.slice(offset, offset + 400);
    const documents = await adminDb.getAll(
      ...group.map(([id]) => adminDb.collection("sms_opt_outs").doc(id)),
    );
    documents.forEach((document, index) => {
      if (document.exists) optedOut.add(group[index][0]);
    });
  }
  const smsEligible = eligibleEntries.filter(
    ([id]) => !optedOut.has(id),
  ).length;
  const requestedPage = Math.max(
      1,
      Number.parseInt(String(filters.page ?? "1"), 10) || 1,
    ),
    pageCount = Math.max(1, Math.ceil(matchingRows.length / PAGE_SIZE)),
    page = Math.min(requestedPage, pageCount);
  const rows = matchingRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const query = new URLSearchParams(
    Object.entries(filters)
      .filter(([key, value]) => key !== "page" && value)
      .map(([key, value]) => [key, String(value)]),
  );
  const pageHref = (nextPage: number) =>
    `/admin/contacts?${new URLSearchParams([...query, ["page", String(nextPage)]]).toString()}`;
  const manage = hasPermission(session.roles, "contacts_manage");
  return (
    <section>
      <p className="text-sm font-semibold text-pink-accent">
        AUDIENCE MANAGEMENT
      </p>
      <h1 className="text-3xl font-semibold text-purple-deep">Contacts</h1>
      <p className="mt-2 text-sm text-text-muted">
        One normalized directory for messaging audiences and consent.
      </p>
      <div
        className="mt-6 grid gap-3 sm:grid-cols-3"
        aria-label="Contact summary"
      >
        {[
          [
            "Total Contacts",
            allRows.length,
            "All contacts in the authorized directory",
          ],
          [
            "Matching Filters",
            matchingRows.length,
            "Contacts matching the current search and filters",
          ],
          [
            "SMS Eligible",
            smsEligible,
            "Valid, active, opted-in and deduplicated, excluding global opt-outs",
          ],
        ].map(([label, value, help]) => (
          <article
            key={String(label)}
            className="rounded-2xl border bg-white p-5 shadow-sm"
            title={String(help)}
          >
            <p className="text-sm font-semibold text-text-muted">{label}</p>
            <strong className="mt-2 block text-3xl text-purple-deep">
              {value}
            </strong>
            <p className="mt-2 text-xs text-text-muted">{help}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-bg-soft p-4 font-semibold">
        {matchingRows.length === allRows.length
          ? `${allRows.length} total contacts`
          : matchingRows.length
            ? `${matchingRows.length} of ${allRows.length} contacts match your filters`
            : `0 of ${allRows.length} contacts match the selected filters`}{" "}
        · {smsEligible} SMS eligible
      </p>
      {manage ? (
        <details className="mt-6">
          <summary className="cursor-pointer rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white">
            Add contact
          </summary>
          <div className="mt-4">
            <ContactEditor />
          </div>
        </details>
      ) : null}
      <form className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Name, phone, email or reference"
          className="rounded-xl border px-3 py-2"
        />
        <select
          name="source"
          defaultValue={filters.source ?? ""}
          className="rounded-xl border px-3 py-2"
        >
          <option value="">All sources</option>
          {CONTACT_SOURCES.map((item) => (
            <option key={item} value={item}>
              {humanizeFeedbackValue(item)}
            </option>
          ))}
        </select>
        <select
          name="gender"
          defaultValue={filters.gender ?? ""}
          className="rounded-xl border px-3 py-2"
        >
          <option value="">All genders</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
        <select
          name="ageGroup"
          defaultValue={filters.ageGroup ?? ""}
          className="rounded-xl border px-3 py-2"
        >
          <option value="">All age groups</option>
          {AGE_GROUPS.map((item) => (
            <option key={item} value={item}>
              {humanizeFeedbackValue(item)}
            </option>
          ))}
        </select>
        <input
          name="facility"
          defaultValue={filters.facility}
          placeholder="Facility or screening event"
          className="rounded-xl border px-3 py-2"
        />
        <input
          name="tag"
          defaultValue={filters.tag}
          placeholder="Tag"
          className="rounded-xl border px-3 py-2"
        />
        <select
          name="consent"
          defaultValue={filters.consent ?? ""}
          className="rounded-xl border px-3 py-2"
        >
          <option value="">All consent states</option>
          <option value="sms">SMS opted in</option>
          <option value="email">Email opted in</option>
          <option value="blocked">Do not contact</option>
        </select>
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-xl border px-3 py-2"
        >
          <option value="">All activity states</option>
          <option value="active">Active</option>
          <option value="archived">Inactive / archived</option>
        </select>
        <div className="flex gap-2 md:col-span-4">
          <button className="rounded-xl bg-purple-deep px-5 py-2 font-semibold text-white">
            Apply filters
          </button>
          <Link href="/admin/contacts" className="rounded-xl border px-4 py-2">
            Clear
          </Link>
        </div>
      </form>
      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <p className="font-semibold">
          Showing {rows.length} of {matchingRows.length} matching contacts
        </p>
        {pageCount > 1 && (
          <p className="text-sm text-text-muted">
            Page {page} of {pageCount}
          </p>
        )}
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-bg-soft">
              <tr>
                <th className="p-4">Contact</th>
                <th>Source</th>
                <th>Demographics</th>
                <th>Consent</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((contact) => (
                <tr key={contact.id} className="border-t">
                  <td className="p-4">
                    <strong>
                      {String(
                        contact.fullName || contact.name || "Name not provided",
                      )}
                    </strong>
                    <p>{String(contact.phone ?? "")}</p>
                    <p className="text-xs text-text-muted">
                      {String(contact.email ?? "")}
                    </p>
                  </td>
                  <td>{humanizeFeedbackValue(contact.source)}</td>
                  <td>
                    {humanizeFeedbackValue(contact.gender)} ·{" "}
                    {humanizeFeedbackValue(contact.ageGroup)}
                  </td>
                  <td>
                    {contact.doNotContact
                      ? "Do not contact"
                      : contact.smsOptIn
                        ? "SMS opted in"
                        : "No SMS consent"}
                  </td>
                  <td>{humanizeFeedbackValue(contact.status)}</td>
                  <td className="pr-4">
                    <Link
                      href={`/admin/contacts/${contact.id}`}
                      className="font-semibold text-purple-deep"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length ? (
          <p className="p-8 text-center text-text-muted">
            0 of {allRows.length} contacts match the selected filters.
          </p>
        ) : null}
      </div>
      {pageCount > 1 && (
        <nav
          className="mt-4 flex justify-end gap-2"
          aria-label="Contacts pagination"
        >
          <Link
            aria-disabled={page === 1}
            href={pageHref(page === 1 ? 1 : page - 1)}
            className={`rounded-xl border px-4 py-2 font-semibold ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Previous
          </Link>
          <Link
            aria-disabled={page === pageCount}
            href={pageHref(page === pageCount ? pageCount : page + 1)}
            className={`rounded-xl border px-4 py-2 font-semibold ${page === pageCount ? "pointer-events-none opacity-50" : ""}`}
          >
            Next
          </Link>
        </nav>
      )}
    </section>
  );
}
