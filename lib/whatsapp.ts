import { HOSPITAL } from "@/lib/constants";

export const DEFAULT_WHATSAPP_MESSAGE = "Hello SGH, I'd like to ask a question.";

/** Click-to-chat link with a pre-filled message so staff know the context of the enquiry. */
export function whatsappLink(message: string = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${HOSPITAL.whatsapp}?text=${encodeURIComponent(message)}`;
}
