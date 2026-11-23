// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  connectInfiniteHits,
  InfiniteHitsConnector,
} from "../search/connectInfiniteHits";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import {
  SearchFacetsResponse,
  SearchProductHit,
  SearchRequest,
  SearchResponse,
} from "../types/search";

vi.mock("../utils/searchImpressions", () => ({
  createSearchImpressionTracker: () => ({
    setContext: vi.fn(),
    observe: vi.fn(),
    forceImpression: vi.fn(),
    flush: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

const INDEX = "products_fr_be";
const hit = (objectID: string): SearchProductHit => ({
  objectID,
  id: 1,
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
  _display: { title: objectID, url: "/products/p", price: "1 €", lines: [] },
});
const response = (page: number): SearchResponse => ({
  results: [
    {
      index: INDEX,
      hits: [hit(`${page}a`), hit(`${page}b`)],
      nbHits: 8,
      page,
      nbPages: 4,
      hitsPerPage: 2,
      processingTimeMS: 1,
      query: "robe",
      queryID: "qid",
    },
  ],
});

const hits: ((outcome: SearchResponse | Error) => void)[] = [];
const counts: ((response: SearchFacetsResponse) => void)[] = [];
const transport = vi.fn<(req: SearchRequest) => Promise<SearchResponse>>();
const answer = async (outcome: SearchResponse | Error): Promise<void> => {
  hits.shift()?.(outcome);
  await vi.advanceTimersByTimeAsync(0);
};
const ids = (connector: InfiniteHitsConnector): string[] =>
  connector.getRenderState().hits.map(({ hit: { objectID } }) => objectID);

let controller: SearchController;
let infiniteHits: InfiniteHitsConnector;

// Restored on page index 2, then filled from above down to page 0.
beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  transport.mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        hits.push((outcome) =>
          outcome instanceof Error ? reject(outcome) : resolve(outcome),
        );
      }),
  );
  controller = createSearchController({
    transport,
    facets: true,
    facetsTransport: () => new Promise((resolve) => counts.push(resolve)),
    config: {
      searchConfig: {
        filterableAttributes: [
          { key: "color", label: "Couleur", type: "keyword", values: ["Bleu"] },
        ],
      },
    },
    language: "fr",
    country: "BE",
    hitsPerPage: 2,
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    initialSearchState: { [INDEX]: { query: "robe", page: 2 } },
  });
  infiniteHits = connectInfiniteHits(controller);
  controller.search();
  await answer(response(2));
  infiniteHits.showPrevious();
  await answer(response(1));
});

afterEach(() => {
  infiniteHits.dispose();
  controller.dispose();
  hits.length = 0;
  counts.length = 0;
  transport.mockReset();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("keeps the pages above when late facet counts refresh the filled page 0", async () => {
  infiniteHits.showPrevious();
  await answer(response(0));
  expect(ids(infiniteHits)).toEqual(["0a", "0b", "1a", "1b", "2a", "2b"]);

  expect(counts).toHaveLength(1);
  counts.shift()?.({ facets: { color: { Bleu: 3 } }, nbHits: 8 });
  await vi.advanceTimersByTimeAsync(0);

  expect(controller.getSnapshot().results.facets).toEqual({
    color: { Bleu: 3 },
  });
  expect(ids(infiniteHits)).toEqual(["0a", "0b", "1a", "1b", "2a", "2b"]);
});

it("starts over on other refinements after a failed fill of page 0", async () => {
  infiniteHits.showPrevious();
  await answer(new Error("network"));

  controller.setSearchState({
    [INDEX]: { query: "robe", refinementList: { color: ["Bleu"] } },
  });

  expect(ids(infiniteHits)).toEqual([]);
  await answer(response(0));
  expect(ids(infiniteHits)).toEqual(["0a", "0b"]);
});
