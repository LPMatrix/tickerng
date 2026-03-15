import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { report as reportTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
