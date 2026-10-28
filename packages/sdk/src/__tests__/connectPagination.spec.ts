// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectPagination,
  PaginationConnector,
  paginationItems,
} from "../search/connectPagination";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import {
  SearchOptions,
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

const result = (overrides: Partial<SearchResult> = {}): SearchResult => ({
  index: INDEX,
  hits: [],
  nbHits: 60,
  page: 0,
  nbPages: 5,
  hitsPerPage: 12,
  processingTimeMS: 1,
  query: "shoe",
  queryID: "qid",
  ...overrides,
});

const pending: ((response: SearchResponse) => void)[] = [];
const transport =
  vi.fn<
    (req: SearchRequest, opts?: SearchOptions) => Promise<SearchResponse>
  >();

const answer = async (overrides: Partial<SearchResult> = {}): Promise<void> => {
  pending.shift()?.({ results: [result(overrides)] });
  await vi.advanceTimersByTimeAsync(0);
};

const setQuery = (controller: SearchController, query: string): void => {
  controller.setSearchState((state) => ({
    ...state,
    [INDEX]: { ...state[INDEX], query },
  }));
};

const pages = (pagination: PaginationConnector): (number | "…")[] =>
  pagination
    .getRenderState()
    .pages.map((item) => (item.type === "page" ? item.page + 1 : "…"));

describe("paginationItems", () => {
  const shown = (current: number, nbPages: number): (number | "…")[] =>
    paginationItems(current, nbPages).map((item) =>
      item.type === "page" ? item.page + 1 : "…",
    );

  it("shows the first and last pages and the current one ±2, a gap as an ellipsis", () => {
    expect(shown(0, 10)).toEqual([1, 2, 3, "…", 10]);
    expect(shown(5, 10)).toEqual([1, "…", 4, 5, 6, 7, 8, "…", 10]);
    expect(shown(9, 10)).toEqual([1, "…", 8, 9, 10]);
  });

  it("shows every page when none is hidden", () => {
    expect(shown(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(shown(0, 2)).toEqual([1, 2]);
  });
});

describe("connectPagination", () => {
  let controller: SearchController;
  let pagination: PaginationConnector;

  beforeEach(async () => {
    vi.useFakeTimers();
    // Hit tracking observes impressions once a response arrives.
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
        new Promise((resolve) => {
          pending.push(resolve);
        }),
    );
    controller = createSearchController({
      transport,
      language: "fr",
      country: "BE",
      analytics: {
        surface: "search_page",
        trackViewSearchResults: vi.fn(),
        trackSelectSearchResult: vi.fn(),
      },
      debounceMs: 100,
    });
    pagination = connectPagination(controller);
    setQuery(controller, "shoe");
    await vi.advanceTimersByTimeAsync(100);
  });

  afterEach(() => {
    pagination.dispose();
    controller.dispose();
    pending.length = 0;
    transport.mockReset();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("exposes the current page, the page count, first/last flags and the numbered pages", async () => {
    await answer({ page: 4, nbPages: 5 });

    expect(pagination.getRenderState()).toMatchObject({
      visible: true,
      currentPage: 4,
      nbPages: 5,
      isFirstPage: false,
      isLastPage: true,
    });
    expect(pages(pagination)).toEqual([1, "…", 3, 4, 5]);
  });

  it("is hidden while loading, while a query is pending and with a single page", async () => {
    expect(pagination.getRenderState().visible).toBe(false);

    await answer();
    expect(pagination.getRenderState().visible).toBe(true);

    setQuery(controller, "shoes");
    expect(pagination.getRenderState().visible).toBe(false);

    await vi.advanceTimersByTimeAsync(100);
    await answer({ nbPages: 1 });
    expect(pagination.getRenderState()).toMatchObject({
      visible: false,
      pages: [],
    });
  });

  it("is hidden when connected while a newer query is pending", async () => {
    await answer();
    setQuery(controller, "shoes");
    const late = connectPagination(controller);

    expect(late.getRenderState().visible).toBe(false);
    late.refine(2);
    expect(transport).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);
    await answer({ query: "shoes" });
    expect(late.getRenderState().visible).toBe(true);
    late.dispose();
  });

  it("requests the refined page, and ignores a page out of range", async () => {
    await answer();

    pagination.refine(5);
    pagination.refine(-1);
    expect(transport).toHaveBeenCalledTimes(1);

    pagination.refine(3);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1]?.[0].requests[0]).toMatchObject({
      query: "shoe",
      page: 3,
    });
    expect(pagination.getRenderState().visible).toBe(false);
  });

  it("notifies subscribers with the new render state", async () => {
    const listener = vi.fn();
    pagination.subscribe(listener);

    await answer({ page: 1 });

    expect(listener).toHaveBeenLastCalledWith(pagination.getRenderState());
    expect(pagination.getRenderState().currentPage).toBe(1);
  });
});
