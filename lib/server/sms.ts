import "server-only";
import { MockSmsProvider, type SmsProvider } from "@/lib/sms";

type ArkeselResponse = {
  status?: string;
  data?: Array<{ recipient?: string; id?: string }>;
};

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
        return recipients.map((recipient) => ({
          providerId: `arkesel-failed-${recipient.slice(-4)}`,
          status: "failed" as const,
        }));
      }
      const payload = (await response.json()) as ArkeselResponse;
      const byRecipient = new Map(
        (payload.data ?? []).map((item) => [item.recipient?.replace(/^\+/, ""), item.id]),
      );
      return recipients.map((recipient) => ({
        providerId:
          byRecipient.get(recipient.replace(/^\+/, "")) ??
          `arkesel-${crypto.randomUUID()}`,
        status: this.mode === "sandbox" ? ("mocked" as const) : ("accepted" as const),
      }));
    } catch {
      return recipients.map((recipient) => ({
        providerId: `arkesel-failed-${recipient.slice(-4)}`,
        status: "failed" as const,
      }));
    }
  }

  async sendMessage(to: string, message: string, _idempotencyKey: string) {
    void _idempotencyKey;
    return (await this.send([to], message))[0];
  }

  async sendBatch(messages: Array<{ to: string; message: string; idempotencyKey: string }>) {
    if (!messages.length) return [];
    if (messages.some((item) => item.message !== messages[0].message)) {
      throw new Error("Arkesel batches must use one controlled message template.");
    }
    return this.send(
      messages.map((item) => item.to),
      messages[0].message,
    );
  }
}

export function getSmsProvider(): SmsProvider {
  if (process.env.SMS_PROVIDER === "arkesel") {
    const apiKey = process.env.SMS_API_KEY?.trim();
    const sender = process.env.SMS_SENDER_ID?.trim();
    if (apiKey && sender && sender.length <= 11) {
      return new ArkeselSmsProvider(apiKey, sender, process.env.SMS_SANDBOX === "true");
    }
  }
  return new MockSmsProvider();
}
export { MockSmsProvider };
