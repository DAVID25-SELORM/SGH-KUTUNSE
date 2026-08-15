import "server-only";
import { MockSmsProvider, type SmsProvider } from "@/lib/sms";

type ArkeselResponse = {
  status?: string;
  data?: Array<{ recipient?: string; id?: string }>;
};

function comparablePhone(value: string) {
  return value.replace(/\D/g, "").replace(/^0/, "233");
}

export type ArkeselDeliveryReport = { providerId: string; status: string };

const ARKESEL_REPORT_BATCH_SIZE = 200;
const ARKESEL_REPORT_TIMEOUT_MS = 15_000;

export class ArkeselSmsProvider implements SmsProvider {
  mode: "sandbox" | "live";

  constructor(
    private readonly apiKey: string,
    private readonly sender: string,
    sandbox: boolean,
  ) {
    this.mode = sandbox ? "sandbox" : "live";
  }

  private async send(recipients: string[], message: string) {
    try {
      const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
        method: "POST",
        headers: {
          "api-key": this.apiKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: this.sender,
          message,
          recipients,
          sandbox: this.mode === "sandbox",
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        return recipients.map(() => ({
          providerId: "",
          status: "failed" as const,
          failureClass:
            response.status >= 500
              ? ("delivery_unknown" as const)
              : ("rejected" as const),
        }));
      }
      const payload = (await response.json()) as ArkeselResponse;
      if (payload.status !== "success")
        return recipients.map(() => ({
          providerId: "",
          status: "failed" as const,
          failureClass: "rejected" as const,
        }));
      const byRecipient = new Map(
        (payload.data ?? []).map((item) => [
          comparablePhone(item.recipient ?? ""),
          item.id,
        ]),
      );
      return recipients.map((recipient, index) => {
        const providerId =
          byRecipient.get(comparablePhone(recipient)) ??
          (payload.data?.length === recipients.length
            ? payload.data[index]?.id
            : undefined);
        return providerId
          ? {
              providerId,
              status:
                this.mode === "sandbox"
                  ? ("mocked" as const)
                  : ("accepted" as const),
            }
          : {
              providerId: "",
              status: "failed" as const,
              failureClass: "delivery_unknown" as const,
            };
      });
    } catch {
      return recipients.map(() => ({
        providerId: "",
        status: "failed" as const,
        failureClass: "delivery_unknown" as const,
      }));
    }
  }

  async sendMessage(to: string, message: string, _idempotencyKey: string) {
    void _idempotencyKey;
    return (await this.send([to], message))[0];
  }

  async sendBatch(
    messages: Array<{ to: string; message: string; idempotencyKey: string }>,
  ) {
    if (!messages.length) return [];
    if (messages.some((item) => item.message !== messages[0].message)) {
      throw new Error(
        "Arkesel batches must use one controlled message template.",
      );
    }
    return this.send(
      messages.map((item) => item.to),
      messages[0].message,
    );
  }

  async getDeliveryReports(
    providerIds: string[],
  ): Promise<ArkeselDeliveryReport[]> {
    if (this.mode !== "live" || !providerIds.length) return [];
    const batches: string[][] = [];
    for (
      let offset = 0;
      offset < providerIds.length;
      offset += ARKESEL_REPORT_BATCH_SIZE
    ) {
      batches.push(
        providerIds.slice(offset, offset + ARKESEL_REPORT_BATCH_SIZE),
      );
    }
    const results = await Promise.all(
      batches.map(async (msgIds) => {
        const response = await fetch(
          "https://sms.arkesel.com/api/v2/sms/message-reports",
          {
            method: "POST",
            headers: {
              "api-key": this.apiKey.trim(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ msg_ids: msgIds }),
            signal: AbortSignal.timeout(ARKESEL_REPORT_TIMEOUT_MS),
            cache: "no-store",
          },
        );
        if (!response.ok)
          throw new Error(`Arkesel report lookup failed (${response.status}).`);
        const payload = (await response.json()) as {
          status?: string;
          data?: Record<string, { status?: string }>;
        };
        if (payload.status !== "success" || !payload.data)
          throw new Error("Arkesel returned an invalid report response.");
        return Object.entries(payload.data).flatMap(([providerId, report]) =>
          report?.status ? [{ providerId, status: report.status }] : [],
        );
      }),
    );
    return results.flat();
  }
}

export function getSmsProvider(): SmsProvider {
  if (process.env.SMS_PROVIDER === "arkesel") {
    const apiKey = process.env.SMS_API_KEY?.trim();
    const sender = process.env.SMS_SENDER_ID?.trim();
    if (apiKey && sender && sender.length <= 11) {
      return new ArkeselSmsProvider(
        apiKey,
        sender,
        process.env.SMS_SANDBOX === "true",
      );
    }
  }
  return new MockSmsProvider();
}
export { MockSmsProvider };
