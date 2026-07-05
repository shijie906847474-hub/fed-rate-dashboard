import { NextResponse } from "next/server";
import { CACHE_TTL } from "@/lib/constants";
import { withCache } from "@/lib/cache";
import { getFedWatchProvider } from "@/lib/providers";

const CACHE_KEY = "fedwatch:data";
let lastGood: Awaited<ReturnType<ReturnType<typeof getFedWatchProvider>["getFedWatchData"]>> | null =
  null;

export async function GET() {
  try {
    const data = await withCache(CACHE_KEY, CACHE_TTL.fedwatch, async () => {
      const provider = getFedWatchProvider();
      const result = await provider.getFedWatchData();
      lastGood = result;
      return result;
    });

    return NextResponse.json(data);
  } catch (error) {
    if (lastGood) {
      return NextResponse.json({ ...lastGood, stale: true });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch FedWatch data",
      },
      { status: 500 },
    );
  }
}
