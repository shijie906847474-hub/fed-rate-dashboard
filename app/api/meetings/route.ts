import { NextResponse } from "next/server";
import { CACHE_TTL } from "@/lib/constants";
import { withCache } from "@/lib/cache";
import { getUpcomingMeetingList } from "@/lib/providers";

export async function GET() {
  try {
    const data = await withCache("meetings:upcoming", CACHE_TTL.meetings, async () =>
      getUpcomingMeetingList(),
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch meetings",
      },
      { status: 500 },
    );
  }
}
