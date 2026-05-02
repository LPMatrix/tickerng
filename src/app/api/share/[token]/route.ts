import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { reportShare as reportShareTable, report as reportTable } from "@/db/schema";
import { eq, and, gt, or, isNull } from "drizzle-orm";

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
    .where(and(eq(reportTable.id, share.reportId), isNull(reportTable.deletedAt)))
    .limit(1);
  if (!reportRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(reportRow);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
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
  if (!reportRow || reportRow.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db
    .update(reportShareTable)
    .set({ revoked: true })
    .where(eq(reportShareTable.token, token));
  return NextResponse.json({ ok: true });
}
