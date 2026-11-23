// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectInfiniteHits,
  InfiniteHitsConnector,
} from "../search/connectInfiniteHits";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import {
  SearchProductHit,
  SearchRequest,
  SearchResponse,
  SearchResult,
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
const PER_PAGE = 2;

const hit = (objectID: string): SearchProductHit => ({
  objectID,
  id: 1,
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
  _display: { title: objectID, url: "/products/p", price: "1 €", lines: [] },
});

// 7 hits over 4 pages of 2.
const pageOf = (
  page: number,
  query = "robe",
): SearchResult<SearchProductHit> => ({
  index: INDEX,
  hits: page === 3 ? [hit("3a")] : [hit(`${page}a`), hit(`${page}b`)],
  nbHits: 7,
  page,
  nbPages: 4,
  hitsPerPage: PER_PAGE,
  processingTimeMS: 1,
  query,
  queryID: "qid",
});

const pending: ((response: SearchResponse) => void)[] = [];
const transport = vi.fn<(req: SearchRequest) => Promise<SearchResponse>>();
const answer = async (page: number, query?: string): Promise<void> => {
  pending.shift()?.({ results: [pageOf(page, query)] });
  await vi.advanceTimersByTimeAsync(0);
};
const requestedPage = (call: number): number | undefined =>
  transport.mock.calls[call]?.[0].requests[0]?.page;
const ids = (connector: InfiniteHitsConnector): string[] =>
  connector.getRenderState().hits.map(({ hit: { objectID } }) => objectID);

let controller: SearchController;
let infiniteHits: InfiniteHitsConnector;

// As a URL's `page=3` restores it: the list starts on page index 2.
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
    () => new Promise((resolve) => pending.push(resolve)),
  );
  controller = createSearchController({
    transport,
    config: {},
    language: "fr",
    country: "BE",
    hitsPerPage: PER_PAGE,
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    initialSearchState: { [INDEX]: { query: "robe", page: 2 } },
  });
  infiniteHits = connectInfiniteHits(controller);
  controller.search();
  await answer(2);
});

afterEach(() => {
  infiniteHits.dispose();
  controller.dispose();
  pending.length = 0;
  transport.mockReset();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("connectInfiniteHits, starting on a later page", () => {
  it("counts the hits above and below the fetched pages", () => {
    expect(ids(infiniteHits)).toEqual(["2a", "2b"]);
    expect(infiniteHits.getRenderState()).toMatchObject({
      isFirstPage: false,
      isLastPage: false,
      nbHitsBefore: 4,
      nbHitsAfter: 1,
    });
  });

  it("showPrevious stacks the pages above, down to page 0, keeping the fetched ones", async () => {
    infiniteHits.showPrevious();
    expect(requestedPage(1)).toBe(1);
    expect(infiniteHits.getRenderState()).toMatchObject({
      loadingPrevious: true,
      loadingMore: false,
    });
    await answer(1);
    expect(ids(infiniteHits)).toEqual(["1a", "1b", "2a", "2b"]);

    infiniteHits.showPrevious();
    expect(requestedPage(2)).toBe(0);
    // Page 0 fills the list from above instead of starting it over.
    expect(ids(infiniteHits)).toEqual(["1a", "1b", "2a", "2b"]);
    await answer(0);
    expect(ids(infiniteHits)).toEqual(["0a", "0b", "1a", "1b", "2a", "2b"]);
    expect(infiniteHits.getRenderState()).toMatchObject({
      isFirstPage: true,
      nbHitsBefore: 0,
      loadingPrevious: false,
    });

    infiniteHits.showPrevious();
    expect(transport).toHaveBeenCalledTimes(3);

    infiniteHits.showMore();
    expect(requestedPage(3)).toBe(3);
    await answer(3);
    expect(infiniteHits.getRenderState()).toMatchObject({
      isLastPage: true,
      nbHitsAfter: 0,
    });
    expect(ids(infiniteHits)).toHaveLength(7);
  });

  it("starts over on a new query's page 0 after a showPrevious", async () => {
    infiniteHits.showPrevious();
    await answer(1);
    controller.setSearchState({ [INDEX]: { query: "jupe" } });
    controller.search();

    expect(ids(infiniteHits)).toEqual([]);
    await answer(0, "jupe");
    expect(ids(infiniteHits)).toEqual(["0a", "0b"]);
  });
});
