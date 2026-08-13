import "server-only";
import { MockSmsProvider, type SmsProvider } from "@/lib/sms";
export function getSmsProvider(): SmsProvider {
  return new MockSmsProvider();
}
export { MockSmsProvider };
