import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectSearchBox } from "../search/connectSearchBox";
import { connectStats } from "../search/connectStats";
import { createSearchController } from "../search/createSearchController";
import { SearchController, SearchState } from "../search/types";
import { SearchRequest, SearchResponse, SearchResult } from "../types/search";
import { SearchStatus } from "../types/searchController";

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

const answer = (nbHits: number): SearchResponse => ({
  results: [
    {
      index: INDEX,
      hits: [],
      nbHits,
      page: 0,
      nbPages: 3,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query: "",
      queryID: "qid",
    } satisfies SearchResult,
  ],
});

const transport = vi.fn<(request: SearchRequest) => Promise<SearchResponse>>();

const create = (): SearchController =>
  createSearchController({
    transport,
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    initialSearchState: { [INDEX]: { query: "shoes", page: 2 } },
  });

const refine = (
  controller: SearchController,
  refinementList: Record<string, string[]>,
): void => {
  controller.setSearchState((state) => ({
    ...state,
    [INDEX]: { ...state[INDEX], refinementList },
  }));
};

const sentQueries = (): string[] =>
  transport.mock.calls.map(([request]) => request.requests[0].query);

beforeEach(() => {
  vi.useFakeTimers();
  transport.mockResolvedValue(answer(4));
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("search draft", () => {
  it("starts from the parent's search state, results and context", async () => {
    const parent = create();
    parent.search();
    await vi.advanceTimersByTimeAsync(0);

    const draft = parent.createDraft();

    expect(draft.getSnapshot()).toEqual(parent.getSnapshot());
  });

  it("changes its own search state and sends no request", async () => {
    const parent = create();
    const draft = parent.createDraft();
    const listener = vi.fn();
    draft.subscribe(listener);

    refine(draft, { color: ["red"] });
    draft.search();
    draft.open();
    draft.retry();
    await vi.advanceTimersByTimeAsync(1000);

    expect(draft.getSnapshot().searchState[INDEX]).toEqual({
      query: "shoes",
      page: 0,
      refinementList: { color: ["red"] },
    });
    expect(parent.getSnapshot().searchState[INDEX]).toEqual({
      query: "shoes",
      page: 2,
    });
    expect(listener).toHaveBeenCalledOnce();
    expect(transport).not.toHaveBeenCalled();
  });

  it("follows the parent's results", async () => {
    const parent = create();
    const draft = parent.createDraft();

    parent.search();
    await vi.advanceTimersByTimeAsync(0);

    expect(draft.getSnapshot().results).toBe(parent.getSnapshot().results);
    expect(draft.getSnapshot().results.status).toBe(SearchStatus.SUCCESS);
  });

  it("runs connectors on its search state and the parent's results", async () => {
    const parent = create();
    const draft = parent.createDraft();
    const searchBox = connectSearchBox(draft);
    const stats = connectStats(draft);

    searchBox.refine("boots");
    searchBox.submit();
    parent.search();
    await vi.advanceTimersByTimeAsync(1000);

    expect(searchBox.getRenderState().query).toBe("boots");
    expect(stats.getRenderState().nbHits).toBe(4);
    expect(sentQueries()).toEqual(["shoes"]);
  });

  it("applies its search state to the parent in one search on commit", async () => {
    const parent = create();
    const draft = parent.createDraft();
    draft.setSearchState((state) => ({
      ...state,
      [INDEX]: { ...state[INDEX], query: "boots" },
    }));
    refine(draft, { color: ["red"] });
    const committed: SearchState = draft.getSnapshot().searchState;

    draft.commit();
    await vi.advanceTimersByTimeAsync(0);

    expect(parent.getSnapshot().searchState).toEqual(committed);
    expect(sentQueries()).toEqual(["boots"]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(transport).toHaveBeenCalledOnce();
  });

  it("sends nothing on commit when the draft changed nothing", async () => {
    const parent = create();

    parent.createDraft().commit();
    await vi.advanceTimersByTimeAsync(1000);

    expect(transport).not.toHaveBeenCalled();
  });

  it("drops its changes on discard and does nothing after", async () => {
    const parent = create();
    const draft = parent.createDraft();
    const listener = vi.fn();
    draft.subscribe(listener);
    refine(draft, { color: ["red"] });

    draft.discard();
    refine(draft, { color: ["blue"] });
    draft.commit();
    parent.search();
    await vi.advanceTimersByTimeAsync(0);

    expect(parent.getSnapshot().searchState[INDEX]).toEqual({
      query: "shoes",
      page: 2,
    });
    expect(listener).toHaveBeenCalledOnce();
  });
});
