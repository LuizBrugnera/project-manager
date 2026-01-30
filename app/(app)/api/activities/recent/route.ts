import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserRelevantActivities } from "@/lib/activity-log";

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const activities = await getUserRelevantActivities(user.id, 5);

  return NextResponse.json({ activities });
}
