import "server-only";
import { CloudTasksClient } from "@google-cloud/tasks";
import { OAuth2Client } from "google-auth-library";

export const HOSPITAL_TIMEZONE = "Africa/Accra";
export const SMS_QUIET_HOURS = { start: Number(process.env.SMS_SEND_START_HOUR || 8), end: Number(process.env.SMS_SEND_END_HOUR || 19) } as const;
const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "satelitegeneralhospital";
const location = process.env.SMS_TASK_LOCATION || "us-east4";
const queue = process.env.SMS_TASK_QUEUE || "sgh-sms-schedules";
const baseUrl = process.env.APP_BASE_URL || "https://satellitegeneralhospital.com";
const serviceAccountEmail = process.env.SMS_TASK_SERVICE_ACCOUNT || `firebase-app-hosting-compute@${project}.iam.gserviceaccount.com`;
const client = new CloudTasksClient();
const verifier = new OAuth2Client();

export function parseAccraSchedule(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [hour, minute] = time.split(":").map(Number);
  if (hour > 23 || minute > 59) return null;
  const value = new Date(`${date}T${time}:00.000Z`);
  if (Number.isNaN(value.valueOf()) || value.toISOString().slice(0, 10) !== date) return null;
  return value;
}
export function withinSmsHours(value: Date) { const hour = value.getUTCHours(); return hour >= SMS_QUIET_HOURS.start && hour < SMS_QUIET_HOURS.end; }
export function validateSmsSchedule(date: string, time: string, now = new Date()) {
  const value = parseAccraSchedule(date, time);
  if (!value) return { ok: false as const, message: "Enter a valid date and time." };
  if (value.getTime() < now.getTime() + 5 * 60_000) return { ok: false as const, message: "Schedule at least 5 minutes in the future." };
  if (!withinSmsHours(value)) return { ok: false as const, message: `Choose a time from ${SMS_QUIET_HOURS.start}:00 to ${SMS_QUIET_HOURS.end}:00 Africa/Accra.` };
  return { ok: true as const, value };
}
export function smsSchedulingEnabled() { return process.env.SMS_SCHEDULING_ENABLED === "true"; }
export function formatAccraSchedule(value: Date) { return new Intl.DateTimeFormat("en-GB", { timeZone: HOSPITAL_TIMEZONE, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" }).format(value); }
function taskId(campaignId: string, generation: number) { return `campaign-${campaignId.replace(/[^A-Za-z0-9_-]/g, "-")}-${generation}`; }
export function taskName(campaignId: string, generation: number) { return client.taskPath(project, location, queue, taskId(campaignId, generation)); }
export function cloudTaskResourceName(shortTaskName: string) { return client.taskPath(project, location, queue, shortTaskName); }

export async function createScheduledSmsTask(campaignId: string, generation: number, scheduledAt: Date) {
  const name = taskName(campaignId, generation);
  const url = `${baseUrl}/api/admin/feedback/campaigns/${encodeURIComponent(campaignId)}/send`;
  await client.createTask({ parent: client.queuePath(project, location, queue), task: { name, scheduleTime: { seconds: Math.floor(scheduledAt.getTime() / 1000) }, httpRequest: { httpMethod: "POST", url, headers: { "Content-Type": "application/json" }, body: Buffer.from(JSON.stringify({ action: "scheduled", confirmation: "", scheduleGeneration: generation })).toString("base64"), oidcToken: { serviceAccountEmail, audience: baseUrl } } } });
  return name;
}
export async function deleteScheduledSmsTask(name: string) { try { await client.deleteTask({ name }); } catch (error) { if ((error as { code?: number }).code !== 5) throw error; } }

export async function verifyScheduledTaskRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  const task = request.headers.get("x-cloudtasks-taskname");
  const queueName = request.headers.get("x-cloudtasks-queuename");
  if (!authorization?.startsWith("Bearer ") || !task || queueName !== queue) return null;
  try {
    const ticket = await verifier.verifyIdToken({ idToken: authorization.slice(7), audience: baseUrl });
    const payload = ticket.getPayload();
    if (!payload?.email_verified || payload.email !== serviceAccountEmail) return null;
    // Cloud Tasks sends only the short task ID in X-CloudTasks-TaskName.
    // Normalize it to the full resource name persisted on the campaign.
    return { uid: `service:${payload.email}`, task: cloudTaskResourceName(task) };
  } catch { return null; }
}
