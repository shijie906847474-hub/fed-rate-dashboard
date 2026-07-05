import { NextResponse } from "next/server";
import { CACHE_TTL, INDICATORS } from "@/lib/constants";
import { withCache } from "@/lib/cache";
import { getIndicatorHistory } from "@/lib/indicators";

export async function GET() {
  try {
    const data = await withCache("indicators:history:all", CACHE_TTL.history, async () => {
      const entries = await Promise.all(
        INDICATORS.map(async (indicator) => {
          const points = await getIndicatorHistory(indicator.id);
          return [
            indicator.id,
            {
              id: indicator.id,
              nameZh: indicator.nameZh,
              nameEn: indicator.nameEn,
              unit: indicator.unit,
              points,
            },
          ] as const;
        }),
      );

      return Object.fromEntries(entries);
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch indicator histories",
      },
      { status: 500 },
    );
  }
}
