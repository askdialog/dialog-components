/* eslint max-lines: ["error", 280] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectAiOverview } from "../search/connectAiOverview";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import {
  AiOverviewRequest,
  AiOverviewResponse,
  SearchFilterBlock,
} from "../types/aiSearch";
import {
  SearchOptions,
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

const detected: SearchFilterBlock[] = [
  {
    source: "query_constructor",
    facetFilters: [[{ attribute: "color", value: "rouge" }]],
    numericFilters: [],
  },
];

// The overview reads only a hit's object ID.
const page = (number: number): SearchResponse => ({
  results: [
    {
      index: INDEX,
      hits: Array.from(
        { length: 5 },
        (_, index) => ({ objectID: `${number}-${index}` }) as SearchProductHit,
      ),
      nbHits: 40,
      page: number,
      nbPages: 4,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query: "robe rouge",
      queryID: "qid",
      filters: detected,
    },
  ],
});

const overview: AiOverviewResponse = {
  text: "Des robes rouges.",
  suggestions: [
    {
      label: "Taille M (12)",
      filters: {
        facetFilters: [[{ attribute: "size", value: "M" }]],
        numericFilters: [[{ attribute: "price", operator: "<=", value: 50 }]],
      },
    },
  ],
  attributeLabels: { size: "Taille" },
};

let search: ReturnType<
  typeof vi.fn<(request: SearchRequest) => Promise<SearchResponse>>
>;
let send: ReturnType<
  typeof vi.fn<
    (
      request: AiOverviewRequest,
      options?: SearchOptions,
    ) => Promise<AiOverviewResponse>
  >
>;

const create = (): SearchController =>
  createSearchController({
    mode: "ai",
    transport: search,
    config: {
      searchConfig: {
        filterableAttributes: [
          { key: "color", label: "Couleur", type: "keyword", values: [] },
          { key: "size", label: "Taille", type: "keyword", values: [] },
          { key: "price", label: "Prix", type: "number", values: [] },
        ],
      },
    },
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
  });

const query = async (controller: SearchController, text: string) => {
  controller.setSearchState({ [INDEX]: { query: text } });
  await vi.advanceTimersByTimeAsync(100);
};

beforeEach(() => {
  vi.useFakeTimers();
  // A transport per test: the overview cache is shared per transport.
  search = vi.fn(() => Promise.resolve(page(0)));
  send = vi.fn(() => Promise.resolve(overview));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("connectAiOverview", () => {
  it("requests the overview once page 0 answers, with its query, filters, hit count and first 3 object IDs", async () => {
    const controller = create();
    const connector = connectAiOverview(controller, { transport: send });
    expect(connector.getRenderState().status).toBe("idle");

    await query(controller, "robe rouge");

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toEqual({
      query: "robe rouge",
      language: "fr",
      country: "BE",
      page: 0,
      filters: detected,
      nbHits: 40,
      objectIDs: ["0-0", "0-1", "0-2"],
    });
    expect(connector.getRenderState()).toEqual({
      status: "success",
      text: "Des robes rouges.",
      suggestions: overview.suggestions,
      attributeLabels: { size: "Taille" },
    });
  });

  it("is loading while page 0 and then its overview load", async () => {
    let answer: (response: AiOverviewResponse) => void = () => undefined;
    send.mockImplementation(() => new Promise((resolve) => (answer = resolve)));
    const controller = create();
    const connector = connectAiOverview(controller, { transport: send });
    controller.setSearchState({ [INDEX]: { query: "robe rouge" } });
    controller.search();

    expect(connector.getRenderState().status).toBe("loading");
    await vi.advanceTimersByTimeAsync(0);
    expect(connector.getRenderState().status).toBe("loading");

    answer(overview);
    await vi.advanceTimersByTimeAsync(0);
    expect(connector.getRenderState().status).toBe("success");
  });

  it("keeps the overview of page 0 while later pages load, and requests no other", async () => {
    const controller = create();
    const connector = connectAiOverview(controller, { transport: send });
    await query(controller, "robe rouge");
    const shown = connector.getRenderState();
    let answer: (response: SearchResponse) => void = () => undefined;
    search.mockImplementation(
      () => new Promise((resolve) => (answer = resolve)),
    );

    controller.setSearchState((state) => ({
      [INDEX]: { ...state[INDEX], page: 1 },
    }));
    expect(connector.getRenderState()).toBe(shown);
    answer(page(1));
    await vi.advanceTimersByTimeAsync(0);

    expect(connector.getRenderState()).toBe(shown);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("fails when page 0 fails, without a request", async () => {
    search.mockRejectedValue(new Error("down"));
    const controller = create();
    const connector = connectAiOverview(controller, { transport: send });

    await query(controller, "robe rouge");

    expect(connector.getRenderState().status).toBe("error");
    expect(send).not.toHaveBeenCalled();
  });

  it("fails when the overview request fails", async () => {
    send.mockRejectedValue(new Error("down"));
    const controller = create();
    const connector = connectAiOverview(controller, { transport: send });

    await query(controller, "robe rouge");

    expect(connector.getRenderState()).toMatchObject({
      status: "error",
      text: undefined,
      suggestions: [],
    });
  });

  it("sends the same request once per page, for every connector and search", async () => {
    const controller = create();
    connectAiOverview(controller, { transport: send });
    await query(controller, "robe rouge");
    await query(controller, "robe");
    await query(controller, "robe rouge");

    const other = create();
    const connector = connectAiOverview(other, { transport: send });
    await query(other, "robe rouge");

    expect(send).toHaveBeenCalledTimes(1);
    expect(connector.getRenderState().status).toBe("success");
  });

  it("aborts the pending request when a new search starts and no connector waits for it", async () => {
    send.mockImplementation(() => new Promise(() => undefined));
    const controller = create();
    connectAiOverview(controller, { transport: send });
    await query(controller, "robe rouge");
    const signal = send.mock.calls[0][1]?.signal;

    controller.setSearchState({ [INDEX]: { query: "jupe" } });
    controller.search();

    expect(signal?.aborted).toBe(true);
  });

  it("applies a suggestion as every filter of the search state, in one search", async () => {
    const controller = create();
    const connector = connectAiOverview(controller, { transport: send });
    controller.setSearchState({
      [INDEX]: {
        query: "robe rouge",
        page: 2,
        refinementList: { color: ["bleu"] },
        range: { price: "10:" },
      },
    });
    await vi.advanceTimersByTimeAsync(100);
    search.mockClear();

    connector.applySuggestion(overview.suggestions[0]);

    expect(controller.getSnapshot().searchState[INDEX]).toEqual({
      query: "robe rouge",
      page: 0,
      refinementList: { size: ["M"] },
      range: { price: ":50" },
      filters: undefined,
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0].requests[0]).toMatchObject({
      page: 0,
      facetFilters: [[{ attribute: "size", value: "M" }]],
      numericFilters: [[{ attribute: "price", operator: "<=", value: 50 }]],
    });
  });

  it("needs a transport or an api key", () => {
    expect(() => connectAiOverview(create(), {})).toThrow(
      /transport or an apiKey/,
    );
  });
});
