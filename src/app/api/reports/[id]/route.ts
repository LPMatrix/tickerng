import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { report as reportTable, reportShare as reportShareTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** GET: fetch a single report by id (only if owned by current user) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const [row] = await db
    .select()
    .from(reportTable)
    .where(and(eq(reportTable.id, id), eq(reportTable.userId, session.user.id)))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

/** POST: create a read-only share link for this report (owner only). Body: { expiresInDays?: number } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: reportId } = await params;
  const [reportRow] = await db
    .select()
    .from(reportTable)
    .where(and(eq(reportTable.id, reportId), eq(reportTable.userId, session.user.id)))
    .limit(1);
  if (!reportRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : null;
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = expiresInDays != null && expiresInDays > 0
    ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;
  await db.insert(reportShareTable).values({
    id: randomUUID(),
    reportId,
    token,
    expiresAt,
    revoked: false,
    createdAt: now,
  });
  const baseUrl = getBaseUrl(request);
  const url = `${baseUrl}/r/${token}`;
  return NextResponse.json({ token, url });
}
