import { requireAdmin } from "@/lib/server/auth";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { serialize } from "@/lib/server/admin-data";
import { normalizeAdminRoles } from "@/lib/types/admin";
export default async function Page() {
  const actor = await requireAdmin("audit");
  const [s, users] = await Promise.all([
    adminDb
      .collection("audit_logs")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get(),
    adminAuth.listUsers(1000),
  ]);
  const hiddenSuperAdminUids = new Set(
    users.users
      .filter(
        (user) =>
          user.uid !== actor.uid &&
          normalizeAdminRoles(
            user.customClaims?.roles,
            user.customClaims?.role,
          ).includes("super_admin"),
      )
      .map((user) => user.uid),
  );
  const visibleEntries = s.docs.filter((doc) => {
    const entry = doc.data();
    return !(
      entry.entityType === "admin_user" &&
      hiddenSuperAdminUids.has(String(entry.entityId))
    );
  });
  return (
    <section>
      <h1 className="text-3xl font-semibold text-purple-deep">Audit log</h1>
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        {visibleEntries.map((d) => {
          const x = serialize(d.data());
          const actorLabel = hiddenSuperAdminUids.has(String(x.actorUid))
            ? "Protected administrator"
            : String(x.actorUid);
          return (
            <div
              key={d.id}
              className="border-b border-border-default py-3 text-sm"
            >
              <strong>{String(x.action)}</strong>
              <p>
                {String(x.entityType)} · {String(x.entityId)} · {actorLabel}
              </p>
              <p className="text-text-muted">
                {String(x.timestamp ?? "Pending")}
              </p>
            </div>
          );
        })}
        {visibleEntries.length === 0 && <p>No audit entries yet.</p>}
      </div>
    </section>
  );
}
