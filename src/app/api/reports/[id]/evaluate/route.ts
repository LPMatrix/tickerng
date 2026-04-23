import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { report as reportTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { evaluateReport } from "@/lib/evaluation";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [row] = await db
    .select()
    .from(reportTable)
    .where(and(eq(reportTable.id, id), eq(reportTable.userId, userId)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const evaluation = await evaluateReport(row.content);

  await db
    .update(reportTable)
    .set({ evaluation: JSON.stringify(evaluation) })
    .where(eq(reportTable.id, id));

  return NextResponse.json(evaluation);
}
