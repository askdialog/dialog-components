/* eslint max-lines: ["error", 320] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchController } from "../search/createSearchController";
import { SearchController, SearchSnapshot } from "../search/types";
import {
  SearchOptions,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/search";
import { SearchStatus } from "../types/searchController";

const INDEX = "products_fr_be";

const result = (overrides: Partial<SearchResult> = {}): SearchResult => ({
  index: INDEX,
  hits: [],
  nbHits: 2,
  page: 0,
  nbPages: 1,
  hitsPerPage: 12,
  processingTimeMS: 1,
  query: "",
  queryID: "qid",
  ...overrides,
});

const answer = (...results: SearchResult[]): SearchResponse => ({
  results: results.length === 0 ? [result()] : results,
});

interface Pending {
  resolve: (value: SearchResponse) => void;
  reject: (error: unknown) => void;
  signal?: AbortSignal;
}

const transport =
  vi.fn<
    (req: SearchRequest, opts?: SearchOptions) => Promise<SearchResponse>
  >();
const pending: Pending[] = [];
const snapshots: SearchSnapshot[] = [];

const holdRequests = (): void => {
  transport.mockImplementation(
    (_request, options) =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, reject, signal: options?.signal });
      }),
  );
};

const settle = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(0);
};

const create = (): SearchController => {
  const controller = createSearchController({
    transport,
    language: "fr",
    country: "BE",
    sections: [{ index: "collections" }],
  });
  controller.subscribe((snapshot) => snapshots.push(snapshot));

  return controller;
};

const setQuery = (controller: SearchController, query: string): void => {
  controller.setSearchState((state) => ({
    ...state,
    [INDEX]: { ...state[INDEX], query },
  }));
};

const setPage = (controller: SearchController, page: number): void => {
  controller.setSearchState((state) => ({
    ...state,
    [INDEX]: { ...state[INDEX], page },
  }));
};

beforeEach(() => {
  vi.useFakeTimers();
  transport.mockResolvedValue(answer());
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  pending.length = 0;
  snapshots.length = 0;
});

describe("search controller", () => {
  it("exposes the search state keyed by the products index, idle results and the context", () => {
    expect(create().getSnapshot()).toEqual({
      searchState: { [INDEX]: { query: "", page: 0 } },
      results: { status: SearchStatus.IDLE },
      context: { language: "fr", country: "BE" },
    });
  });

  it("keeps the products entry when an update omits it", () => {
    const controller = create();
    controller.setSearchState({});

    expect(controller.getSnapshot().searchState).toEqual({
      [INDEX]: { query: "", page: 0 },
    });
  });

  it("resets the page on any change other than the page", () => {
    const controller = create();
    setPage(controller, 3);
    expect(controller.getSnapshot().searchState[INDEX].page).toBe(3);

    setQuery(controller, "shoes");

    expect(controller.getSnapshot().searchState[INDEX].page).toBe(0);
  });

  it("sends a query change after the debounce and a page change at once", async () => {
    const controller = create();
    setQuery(controller, "sh");
    vi.advanceTimersByTime(99);
    setQuery(controller, "shoes");
    vi.advanceTimersByTime(99);
    expect(transport).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await settle();
    expect(transport).toHaveBeenCalledTimes(1);

    setPage(controller, 1);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][0].requests[0]).toMatchObject({
      query: "shoes",
      page: 1,
    });
  });

  it("requests the products entry and the sections, and no section on the empty query", async () => {
    const controller = create();
    controller.open();
    await settle();
    setQuery(controller, " shoes ");
    vi.advanceTimersByTime(100);
    await settle();

    expect(transport.mock.calls.map(([request]) => request.requests)).toEqual([
      [{ indexName: INDEX, query: "", page: 0, hitsPerPage: 12 }],
      [
        { indexName: INDEX, query: "shoes", page: 0, hitsPerPage: 12 },
        {
          indexName: "collections_fr_be",
          query: "shoes",
          page: 0,
          hitsPerPage: 12,
        },
      ],
    ]);
  });

  it("aborts the previous request and ignores its late answer", async () => {
    holdRequests();
    const controller = create();
    setPage(controller, 1);
    setPage(controller, 2);
    expect(pending[0].signal?.aborted).toBe(true);

    pending[1].resolve(answer(result({ page: 2 })));
    await settle();
    pending[0].resolve(answer(result({ page: 1 })));
    await settle();

    expect(controller.getSnapshot().results.products?.page).toBe(2);
  });

  it("keeps the previous products while loading and reports success, empty and error", async () => {
    holdRequests();
    const controller = create();
    controller.open();
    pending[0].resolve(answer());
    await settle();
    expect(controller.getSnapshot().results.status).toBe(SearchStatus.SUCCESS);
    const products = controller.getSnapshot().results.products;

    setPage(controller, 1);
    expect(controller.getSnapshot().results).toMatchObject({
      status: SearchStatus.LOADING,
      products,
    });

    pending[1].resolve(answer(result({ nbHits: 0 })));
    await settle();
    expect(controller.getSnapshot().results.status).toBe(SearchStatus.EMPTY);

    const error = new Error("boom");
    setPage(controller, 2);
    pending[2].reject(error);
    await settle();
    expect(controller.getSnapshot().results).toEqual({
      status: SearchStatus.ERROR,
      error,
    });
  });

  it("replays the last failed request on retry", async () => {
    const controller = create();
    transport.mockRejectedValueOnce(new Error("boom"));
    setPage(controller, 2);
    await settle();

    controller.retry();
    await settle();

    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][0]).toEqual(transport.mock.calls[0][0]);
    expect(controller.getSnapshot().results.status).toBe(SearchStatus.SUCCESS);
  });

  it("does not retry a failed request after close", async () => {
    const controller = create();
    transport.mockRejectedValueOnce(new Error("boom"));
    setPage(controller, 2);
    await settle();

    controller.close();
    controller.retry();

    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("does not retry a successful request", async () => {
    const controller = create();
    controller.open();
    await settle();

    controller.retry();

    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("runs the empty-query search on open only when there is no query", async () => {
    const controller = create();
    setQuery(controller, "shoes");
    controller.open();
    expect(transport).not.toHaveBeenCalled();

    setQuery(controller, "");
    vi.advanceTimersByTime(100);
    await settle();
    controller.open();

    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("cancels and returns to idle on close", async () => {
    holdRequests();
    const controller = create();
    setPage(controller, 1);
    controller.close();
    pending[0].resolve(answer());
    await settle();

    expect(pending[0].signal?.aborted).toBe(true);
    expect(controller.getSnapshot().results).toEqual({
      status: SearchStatus.IDLE,
    });
    expect(controller.getSnapshot().searchState[INDEX]).toEqual({
      query: "",
      page: 0,
    });
  });

  it("sends and notifies nothing after dispose", async () => {
    const controller = create();
    setQuery(controller, "shoes");
    controller.dispose();
    vi.advanceTimersByTime(100);
    await settle();
    setPage(controller, 1);
    controller.open();

    expect(transport).not.toHaveBeenCalled();
    expect(snapshots).toHaveLength(1);
  });

  it("notifies subscribers with a new snapshot on each change", async () => {
    const controller = create();
    setPage(controller, 1);
    await settle();

    expect(snapshots.map((snapshot) => snapshot.results.status)).toEqual([
      SearchStatus.IDLE,
      SearchStatus.LOADING,
      SearchStatus.SUCCESS,
    ]);
    expect(new Set(snapshots).size).toBe(3);
    expect(snapshots.at(-1)).toBe(controller.getSnapshot());
  });
});
