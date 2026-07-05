import { NextResponse } from "next/server";
import { CACHE_TTL, INDICATORS } from "@/lib/constants";
import { withCache } from "@/lib/cache";
import { getIndicatorHistory } from "@/lib/indicators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const indicator = INDICATORS.find((item) => item.id === id);

  if (!indicator) {
    return NextResponse.json({ error: "Indicator not found" }, { status: 404 });
  }

  try {
    const data = await withCache(`indicators:history:${id}`, CACHE_TTL.history, () =>
      getIndicatorHistory(id),
    );

    return NextResponse.json({
      id: indicator.id,
      nameZh: indicator.nameZh,
      nameEn: indicator.nameEn,
      unit: indicator.unit,
      points: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch indicator history",
      },
      { status: 500 },
    );
  }
}
