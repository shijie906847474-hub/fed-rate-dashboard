import { CalculatedFedWatchProvider } from "./calculated";
import { MockFedWatchProvider } from "./mock";
import { OfficialFedWatchProvider } from "./official";
import type { FedWatchProvider } from "./types";

export function getFedWatchProvider(): FedWatchProvider {
  const provider = process.env.FEDWATCH_PROVIDER ?? "calculated";

  switch (provider) {
    case "official":
      return new OfficialFedWatchProvider();
    case "mock":
      return new MockFedWatchProvider();
    case "calculated":
    default:
      return new CalculatedFedWatchProvider();
  }
}

export * from "./types";
export { getUpcomingMeetingList } from "./calculated";
