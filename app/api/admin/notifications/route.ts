import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { hasPermission } from "@/lib/types/admin";
import { notificationTypes, type NotificationType } from "@/lib/notifications";
import { submissionKinds } from "@/lib/types/submissions";

function allowed(
  role: Parameters<typeof hasPermission>[0],
  type: string,
): type is NotificationType {
  return (
    notificationTypes.includes(type as NotificationType) &&
    hasPermission(role, submissionKinds[type as NotificationType].permission)
  );
}

export async function GET() {
  const actor = await getAdminSession();
  if (!actor)
    return NextResponse.json(
      { ok: false, message: "Your administrator session has expired." },
      { status: 401 },
    );
  const snapshot = await adminDb
    .collection("admin_notifications")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const visible = snapshot.docs.filter((doc) =>
    allowed(actor.roles, String(doc.get("type") ?? "")),
  );
  const stateRefs = visible.map((doc) =>
    adminDb
      .collection("admin_notification_states")
      .doc(actor.uid)
      .collection("items")
      .doc(doc.id),
  );
  const states = stateRefs.length ? await adminDb.getAll(...stateRefs) : [];
  const items = visible.map((doc, index) => ({
    id: doc.id,
    type: doc.get("type"),
    title: doc.get("title"),
    body: doc.get("body"),
    reference: doc.get("reference"),
    targetUrl: doc.get("targetUrl"),
    priority: doc.get("priority"),
    createdAt: doc.get("createdAt")?.toDate?.()?.toISOString?.() ?? null,
    read: states[index]?.exists && Boolean(states[index].get("readAt")),
  }));
  return NextResponse.json(
    { ok: true, unread: items.filter((item) => !item.read).length, items },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request))
    return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await getAdminSession();
  if (!actor)
    return NextResponse.json(
      { ok: false, message: "Your administrator session has expired." },
      { status: 401 },
    );
  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    all?: unknown;
  } | null;
  const snapshot = await adminDb
    .collection("admin_notifications")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const visible = snapshot.docs.filter((doc) =>
    allowed(actor.roles, String(doc.get("type") ?? "")),
  );
  const targets =
    body?.all === true ? visible : visible.filter((doc) => doc.id === body?.id);
  if (!targets.length)
    return NextResponse.json(
      { ok: false, message: "Notification not found." },
      { status: 404 },
    );
  const batch = adminDb.batch();
  targets.forEach((doc) =>
    batch.set(
      adminDb
        .collection("admin_notification_states")
        .doc(actor.uid)
        .collection("items")
        .doc(doc.id),
      { readAt: FieldValue.serverTimestamp() },
      { merge: true },
    ),
  );
  await batch.commit();
  return NextResponse.json({ ok: true, updated: targets.length });
}
