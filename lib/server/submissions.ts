import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { submissionKinds, type SubmissionKind } from "@/lib/types/submissions";
import { createReference } from "@/lib/reference";

export async function createSubmission(kind: SubmissionKind, data: Record<string, unknown>) {
  const config = submissionKinds[kind];
  const searchTerms = [...new Set(Object.values(data).filter((value): value is string => typeof value === "string").flatMap((value) => value.toLowerCase().split(/[^a-z0-9@+.-]+/).filter((term) => term.length >= 2)).slice(0, 40))];
  for (let attempt=0;attempt<4;attempt++) {
    const reference=createReference(config.prefix);const now=FieldValue.serverTimestamp();const doc=adminDb.collection(config.collection).doc();const reservation=adminDb.collection("submission_references").doc(reference);
    try{await adminDb.runTransaction(async transaction=>{if((await transaction.get(reservation)).exists)throw new Error("REFERENCE_COLLISION");transaction.create(reservation,{kind,documentId:doc.id,createdAt:now});transaction.create(doc,{...data,reference,searchTerms,status:"new",priority:"normal",assignedTo:null,source:"website",createdAt:now,updatedAt:now,lastActionAt:now});transaction.create(doc.collection("history").doc(),{action:"submitted",actorUid:null,actorDisplayName:"Website visitor",createdAt:now,safeMetadata:{}})});return reference}catch(error){if(error instanceof Error&&error.message==="REFERENCE_COLLISION")continue;throw error}
  }
  throw new Error("Reference allocation failed");
}
