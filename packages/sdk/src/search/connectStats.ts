import { getSearchTexts } from "../utils/searchTexts";
import { Connector, createConnector } from "./connector";
import { SearchController } from "./types";

export interface StatsRenderState {
  /** Hits of the shown products result; 0 before the first one. */
  readonly nbHits: number;
  /** The count as announced, e.g. "1 result", "12 results". */
  readonly text: string;
}

export type StatsConnector = Connector<StatsRenderState>;

/** The products hit count and its text in the shopper's language. */
export function connectStats(controller: SearchController): StatsConnector {
  const { getRenderState, subscribe, dispose } = createConnector(controller, {
    read: ({ results, context }) =>
      [
        results.products?.nbHits ?? 0,
        context.language,
        context.country,
      ] as const,
    render: ([nbHits, language, country]) => ({
      nbHits,
      text: getSearchTexts(`${language}-${country}`).resultsCount(nbHits),
    }),
  });

  return { getRenderState, subscribe, dispose };
}
