export type DeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "interrupted_delivery_unknown";

export type DeliveryTransition = {
  status: DeliveryStatus;
  providerStatus: string;
  deliveredAt?: Date;
  failedAt?: Date;
};

export function mapArkeselDeliveryStatus(providerStatus: string): DeliveryStatus | null {
  switch (providerStatus.trim().toUpperCase()) {
    case "DELIVERED": return "delivered";
    case "SUBMITTED":
    case "QUEUED": return "sent";
    case "PROHIBITED":
    case "NOT_DELIVERED":
    case "EXPIRED": return "failed";
    default: return null;
  }
}

export function resolveDeliveryTransition(current: string, providerStatus: string, now = new Date()): DeliveryTransition | null {
  const next = mapArkeselDeliveryStatus(providerStatus);
  if (!next || current === "delivered") return null;
  if (next === "sent" && ["sent", "failed", "interrupted_delivery_unknown"].includes(current)) return null;
  if (next === current) return null;
  return {
    status: next,
    providerStatus: providerStatus.trim().toUpperCase(),
    ...(next === "delivered" ? { deliveredAt: now } : {}),
    ...(next === "failed" ? { failedAt: now } : {}),
  };
}

export function counterDelta(current: string, next: DeliveryStatus) {
  const delta = { acceptedCount: 0, deliveredCount: 0, failedCount: 0, unknownCount: 0 };
  const key = (status: string) => status === "sent" ? "acceptedCount" : status === "delivered" ? "deliveredCount" : status === "failed" ? "failedCount" : status === "interrupted_delivery_unknown" ? "unknownCount" : null;
  const oldKey = key(current), newKey = key(next);
  if (oldKey) delta[oldKey]--;
  if (newKey) delta[newKey]++;
  return delta;
}
