import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { report as reportTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const MAX_LIST = 50;

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({
      id: reportTable.id,
      mode: reportTable.mode,
      query: reportTable.query,
      createdAt: reportTable.createdAt,
    })
    .from(reportTable)
    .where(eq(reportTable.userId, userId))
    .orderBy(desc(reportTable.createdAt))
    .limit(MAX_LIST);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const mode = body.mode === "discovery" ? "discovery" : "verification";
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  if (!query || !content) {
    return NextResponse.json(
      { error: "query and content are required" },
      { status: 400 }
    );
  }
  const id = randomUUID();
  await db.insert(reportTable).values({
    id,
    userId,
    mode,
    query,
    content,
    createdAt: new Date(),
  });
  return NextResponse.json({ id });
}
