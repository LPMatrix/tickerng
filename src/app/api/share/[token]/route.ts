import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { reportShare as reportShareTable, report as reportTable } from "@/db/schema";
import { eq, and, gt, or, isNull } from "drizzle-orm";

/** GET: fetch report by share token (public, read-only). Returns 404 if expired/revoked/invalid. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const now = new Date();
  const [share] = await db
    .select()
    .from(reportShareTable)
    .where(
      and(
        eq(reportShareTable.token, token),
        eq(reportShareTable.revoked, false),
        or(isNull(reportShareTable.expiresAt), gt(reportShareTable.expiresAt, now))
      )
    )
    .limit(1);
  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [reportRow] = await db
    .select({
      content: reportTable.content,
      mode: reportTable.mode,
      query: reportTable.query,
    })
    .from(reportTable)
    .where(eq(reportTable.id, share.reportId))
    .limit(1);
  if (!reportRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(reportRow);
}

/** DELETE: revoke this share link (auth required; must own the report). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [share] = await db
    .select({ reportId: reportShareTable.reportId })
    .from(reportShareTable)
    .where(eq(reportShareTable.token, token))
    .limit(1);
  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [reportRow] = await db
    .select({ userId: reportTable.userId })
    .from(reportTable)
    .where(eq(reportTable.id, share.reportId))
    .limit(1);
  if (!reportRow || reportRow.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db
    .update(reportShareTable)
    .set({ revoked: true })
    .where(eq(reportShareTable.token, token));
  return NextResponse.json({ ok: true });
}
