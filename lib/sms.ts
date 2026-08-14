export type SmsResult = {
  providerId: string;
  status: "mocked" | "accepted" | "failed";
};
export interface SmsProvider {
  mode: "mock" | "sandbox" | "live";
  sendMessage(
    to: string,
    message: string,
    idempotencyKey: string,
  ): Promise<SmsResult>;
  sendBatch(messages: Array<{ to: string; message: string; idempotencyKey: string }>): Promise<SmsResult[]>;
  getDeliveryReports?(providerIds: string[]): Promise<Array<{ providerId: string; status: string }>>;
  getDeliveryStatus?(providerId: string): Promise<SmsResult>;
  processDeliveryWebhook?(payload: unknown): Promise<void>;
}
export class MockSmsProvider implements SmsProvider {
  mode = "mock" as const;
  async sendMessage(_to: string, _message: string, idempotencyKey: string) {
    return { providerId: `mock-${idempotencyKey}`, status: "mocked" as const };
  }
  async sendBatch(messages: Array<{ to: string; message: string; idempotencyKey: string }>) {
    return Promise.all(messages.map((item) => this.sendMessage(item.to, item.message, item.idempotencyKey)));
  }
  async getDeliveryStatus(providerId: string) {
    return { providerId, status: "mocked" as const };
  }
}
export function deduplicateRecipients(inputs: string[]) {
  const valid = inputs.map(normalizeGhanaPhone).filter((phone): phone is string => Boolean(phone));
  return [...new Set(valid)];
}
export function normalizeGhanaPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (/^0[235][0-9]{8}$/.test(digits)) return `+233${digits.slice(1)}`;
  if (/^233[235][0-9]{8}$/.test(digits)) return `+${digits}`;
  if (/^\+233[235][0-9]{8}$/.test(input.replace(/\s/g, "")))
    return input.replace(/\s/g, "");
  return null;
}
