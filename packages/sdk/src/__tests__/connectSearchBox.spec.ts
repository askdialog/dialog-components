// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectSearchBox } from "../search/connectSearchBox";
import { createSearchController } from "../search/createSearchController";
import { SearchResponse, SearchResult } from "../types/search";
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

const answer: SearchResponse = {
  results: [
    {
      index: INDEX,
      hits: [],
      nbHits: 3,
      page: 0,
      nbPages: 1,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query: "",
      queryID: "qid",
    } satisfies SearchResult,
  ],
};

const transport = vi.fn<() => Promise<SearchResponse>>();

const setup = () => {
  const controller = createSearchController({
    transport,
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
  });

  return { controller, searchBox: connectSearchBox(controller) };
};

const sentQueries = (): unknown[] =>
  transport.mock.calls.map(
    (call) =>
      (call as unknown[] as [{ requests: { query: string }[] }])[0].requests[0]
        .query,
  );

beforeEach(() => {
  vi.useFakeTimers();
  transport.mockResolvedValue(answer);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("connectSearchBox", () => {
  it("shows the typed query at once and searches it after the debounce", async () => {
    const { searchBox } = setup();

    searchBox.refine("cre");
    searchBox.refine("creme ");

    expect(searchBox.getRenderState()).toEqual({
      query: "creme ",
      status: SearchStatus.IDLE,
    });
    expect(transport).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);

    expect(sentQueries()).toEqual(["creme"]);
    expect(searchBox.getRenderState().status).toBe(SearchStatus.SUCCESS);
  });

  it("submits at once, with the given query or the typed one", async () => {
    const { searchBox } = setup();

    searchBox.refine("creme");
    searchBox.submit();
    searchBox.submit("savon");
    await vi.advanceTimersByTimeAsync(100);

    expect(sentQueries()).toEqual(["creme", "savon"]);
    expect(searchBox.getRenderState().query).toBe("savon");
  });

  it("clears the query and searches the empty query at once", async () => {
    const { searchBox } = setup();
    searchBox.submit("creme");

    searchBox.clear();
    await vi.advanceTimersByTimeAsync(0);

    expect(searchBox.getRenderState().query).toBe("");
    expect(sentQueries()).toEqual(["creme", ""]);
  });

  it("opens and closes the controller", async () => {
    const { searchBox } = setup();

    searchBox.open();
    await vi.advanceTimersByTimeAsync(0);

    expect(sentQueries()).toEqual([""]);
    expect(searchBox.getRenderState().status).toBe(SearchStatus.SUCCESS);

    searchBox.refine("creme");
    searchBox.close();
    await vi.advanceTimersByTimeAsync(100);

    expect(searchBox.getRenderState()).toEqual({
      query: "",
      status: SearchStatus.IDLE,
    });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("keeps its render state while the query and status hold, and is inert after dispose", async () => {
    const { controller, searchBox } = setup();
    const listener = vi.fn();
    searchBox.subscribe(listener);
    const renderState = searchBox.getRenderState();

    controller.setSearchState((state) => ({
      ...state,
      collections_fr_be: { query: "other" },
    }));

    expect(searchBox.getRenderState()).toBe(renderState);
    expect(listener).not.toHaveBeenCalled();

    searchBox.dispose();
    controller.setSearchState({ [INDEX]: { query: "creme" } });
    searchBox.submit("savon");
    await vi.advanceTimersByTimeAsync(100);

    expect(listener).not.toHaveBeenCalled();
    expect(sentQueries()).toEqual(["creme"]);
  });
});
