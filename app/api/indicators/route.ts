import { NextResponse } from "next/server";
import { CACHE_TTL } from "@/lib/constants";
import { withCache } from "@/lib/cache";
import { getIndicatorSnapshots } from "@/lib/indicators";

export async function GET() {
  try {
    const data = await withCache("indicators:snapshot", CACHE_TTL.indicators, () =>
      getIndicatorSnapshots(),
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch indicators",
      },
      { status: 500 },
    );
  }
}
