/**
 * Moderation service (admin). Lists the report queue and resolves reports —
 * either dismissing them or removing the offending post.
 */
import { Query } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import { notFound } from "../http/errors";
import { Report } from "../domain/types";
import { ResolveReportInput } from "../domain/validation";
import { adminDeletePost } from "./feed.service";

const reportsCol = () => db.collection("reports");

/** The moderation queue, newest first. Optionally filter by status. */
export async function listReports(
  status?: "open" | "resolved",
): Promise<Report[]> {
  let q: Query = reportsCol();
  if (status) q = q.where("status", "==", status);
  const snap = await q.orderBy("createdAt", "desc").limit(100).get();
  return snap.docs.map((d) => d.data() as Report);
}

/** Resolve a report: dismiss it, or remove the post and then mark it resolved. */
export async function resolveReport(
  reportId: string,
  input: ResolveReportInput,
): Promise<void> {
  const ref = reportsCol().doc(reportId);
  const snap = await ref.get();
  if (!snap.exists) throw notFound("Report not found.");
  const report = snap.data() as Report;

  if (input.action === "removed") {
    await adminDeletePost(report.postId);
  }
  await ref.update({
    status: "resolved",
    resolvedAction: input.action,
    resolvedAt: Date.now(),
  });
}
