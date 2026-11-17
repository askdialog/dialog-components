// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { connectPagination } from "../search/connectPagination";
import { connectInfiniteHits } from "../search/connectInfiniteHits";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import {
  SearchFacetsResponse,
  SearchRequest,
  SearchResponse,
} from "../types/search";

const INDEX = "products_en_us";
let controller: SearchController;
let resolveCounts: (value: SearchFacetsResponse) => void;
const transport = vi.fn(
  async (request: SearchRequest): Promise<SearchResponse> => ({
    results: [
      {
        index: INDEX,
        query: request.requests[0].query,
        hits: [],
        nbHits: 40,
        nbPages: 4,
        page: request.requests[0].page ?? 0,
        hitsPerPage: 10,
        queryID: "qid",
        processingTimeMS: 1,
      },
    ],
  }),
);

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  controller = createSearchController({
    transport,
    language: "en",
    country: "US",
    config: {},
    debounceMs: 100,
    facets: true,
    facetsTransport: () =>
      new Promise((resolve) => {
        resolveCounts = resolve;
      }),
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
  });
});

afterEach(() => {
  controller.dispose();
  transport.mockClear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it.each(["pagination", "infinite"])(
  "keeps %s blocked when old counts answer during debounce",
  async (kind) => {
    const pagination = connectPagination(controller);
    const infinite = connectInfiniteHits(controller);
    controller.search();
    await vi.advanceTimersByTimeAsync(0);
    controller.setSearchState({ [INDEX]: { query: "shoes" } });
    resolveCounts({ facets: {}, nbHits: 40 });
    await vi.advanceTimersByTimeAsync(0);

    if (kind === "pagination") pagination.refine(2);
    else infinite.showMore();
    expect(transport).toHaveBeenCalledTimes(1);
    expect(pagination.getRenderState().visible).toBe(false);

    await vi.advanceTimersByTimeAsync(100);
    expect(transport.mock.calls[1][0].requests[0]).toMatchObject({
      query: "shoes",
      page: 0,
    });
    expect(pagination.getRenderState().visible).toBe(true);
    if (kind === "pagination") pagination.refine(2);
    else infinite.showMore();
    expect(transport.mock.calls[2][0].requests[0]).toMatchObject({
      query: "shoes",
      page: kind === "pagination" ? 2 : 1,
    });
    pagination.dispose();
    infinite.dispose();
  },
);

it("does not skip a pending query's first page when infinite hits connects late", async () => {
  controller.search();
  await vi.advanceTimersByTimeAsync(0);
  controller.setSearchState({ [INDEX]: { query: "shoes" } });
  const infinite = connectInfiniteHits(controller);
  infinite.showMore();
  expect(transport).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(100);
  expect(transport.mock.calls[1][0].requests[0]).toMatchObject({
    query: "shoes",
    page: 0,
  });
  infinite.dispose();
});
