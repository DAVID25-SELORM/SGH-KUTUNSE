import { afterAll, beforeAll, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let env: RulesTestEnvironment | undefined;
beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: "sgh-rules-test", firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "articles", "draft"), { status: "draft", title: "Private draft" });
    await setDoc(doc(context.firestore(), "articles", "published"), { status: "published", title: "Approved" });
  });
});
afterAll(async () => env?.cleanup());

const roles = ["viewer", "reception", "insurance", "corporate", "content_editor", "admin", "super_admin"];
describe("default-deny operational rules", () => {
  it("denies anonymous operational reads and writes", async () => { const db=env!.unauthenticatedContext().firestore(); await assertFails(getDoc(doc(db,"appointment_requests","x"))); await assertFails(setDoc(doc(db,"contact_messages","x"),{message:"private"})); });
  for (const role of roles) it(`denies direct ${role} operational access`, async () => { const db=env!.authenticatedContext(role,{role}).firestore(); await assertFails(getDoc(doc(db,"insurance_verifications","x"))); await assertFails(setDoc(doc(db,"appointment_requests","x"),{status:"completed"})); });
});
describe("public CMS publication rules", () => {
  it("denies unpublished CMS content", async () => assertFails(getDoc(doc(env!.unauthenticatedContext().firestore(),"articles","draft"))));
  it("allows explicitly published CMS content", async () => assertSucceeds(getDoc(doc(env!.unauthenticatedContext().firestore(),"articles","published"))));
  it("denies every client CMS write", async () => assertFails(setDoc(doc(env!.authenticatedContext("editor",{role:"content_editor"}).firestore(),"articles","published"),{status:"draft"})));
});
