// @vitest-environment jsdom
/* eslint max-lines: ["error", 380] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchController } from "../search/createSearchController";
import { SearchController, SearchControllerOptions } from "../search/types";
import {
  SearchFacetsRequest,
  SearchFacetsResponse,
  SearchOptions,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/search";
import { SearchStatus } from "../types/searchController";

// The counts of a search that starts before the merchant config has loaded:
// its hits leave at once, its counts once the attributes to count are known.

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
const ATTRIBUTES = [
  { key: "color", label: "Couleur", type: "keyword", values: ["Bleu"] },
] as const;
const COUNTS: SearchFacetsResponse = {
  facets: { color: { Bleu: 3 } },
  facets_stats: { price: { min: 9.9, max: 120 } },
  nbHits: 4,
};

const result = (query: string): SearchResult => ({
  index: INDEX,
  hits: [],
  nbHits: 4,
  page: 0,
  nbPages: 1,
  hitsPerPage: 12,
  processingTimeMS: 1,
  query,
  queryID: "qid",
});

interface Pending<T, R> {
  body: T;
  resolve: (value: R) => void;
  reject: (error: unknown) => void;
  signal?: AbortSignal;
}

const hits: Pending<SearchRequest, SearchResponse>[] = [];
const counts: Pending<SearchFacetsRequest, SearchFacetsResponse>[] = [];
const config: { resolve: () => void; reject: (error: unknown) => void }[] = [];

const transport = vi.fn(
  (body: SearchRequest, options?: SearchOptions) =>
    new Promise<SearchResponse>((resolve, reject) => {
      hits.push({ body, resolve, reject, signal: options?.signal });
    }),
);
const facetsTransport = vi.fn(
  (body: SearchFacetsRequest, options?: SearchOptions) =>
    new Promise<SearchFacetsResponse>((resolve, reject) => {
      counts.push({ body, resolve, reject, signal: options?.signal });
    }),
);

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

// The config answers when the test says so: both its parts at once.
const fetchMock = vi.fn<typeof fetch>(
  (url) =>
    new Promise<Response>((resolve, reject) => {
      config.push({
        resolve: () => {
          resolve(
            jsonResponse(
              String(url).includes("/widget/dialog-config")
                ? {}
                : { filterableAttributes: ATTRIBUTES },
            ),
          );
        },
        reject,
      });
    }),
);
const answerConfig = async (): Promise<void> => {
  config.forEach(({ resolve }) => {
    resolve();
  });
  await vi.advanceTimersByTimeAsync(0);
};
const failConfig = async (): Promise<void> => {
  config.forEach(({ reject }) => {
    reject(new TypeError("Failed to fetch"));
  });
  await vi.advanceTimersByTimeAsync(0);
};

// The config loads are cached per page: each test uses its own API key.
let apiKey = 0;

const create = (
  options: Partial<SearchControllerOptions> = {},
): SearchController =>
  createSearchController({
    transport,
    facetsTransport,
    facets: true,
    apiKey: `pk_counts_${apiKey}`,
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    initialSearchState: { [INDEX]: { query: "shirt" } },
    ...options,
  });

const setState = (
  controller: SearchController,
  patch: Record<string, unknown>,
): void => {
  controller.setSearchState((state) => ({
    ...state,
    [INDEX]: { ...state[INDEX], ...patch },
  }));
};

// The hits request this search sent before facet counts existed.
const HITS_BODY = {
  requests: [{ indexName: INDEX, query: "shirt", page: 0, hitsPerPage: 12 }],
};

describe("search controller counts before the merchant config", () => {
  let controller: SearchController | undefined;

  beforeEach(() => {
    apiKey += 1;
    vi.useFakeTimers();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    controller?.dispose();
    controller = undefined;
    hits.length = 0;
    counts.length = 0;
    config.length = 0;
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("sends the hits at once and renders them before the config and the counts", async () => {
    controller = create();
    controller.search();

    expect(hits.map(({ body }) => body)).toEqual([HITS_BODY]);
    expect(counts).toHaveLength(0);

    hits[0].resolve({ results: [result("shirt")] });
    await vi.advanceTimersByTimeAsync(0);

    expect(config).toHaveLength(2); // Still on its way.
    expect(controller.getSnapshot().results).toMatchObject({
      status: SearchStatus.SUCCESS,
      products: { nbHits: 4 },
    });
    expect(controller.getSnapshot().results).not.toHaveProperty("facets");
  });

  it("sends one counts request, with the config's attributes and the price, once it loads", async () => {
    controller = create();
    controller.search();
    hits[0].resolve({ results: [result("shirt")] });
    await vi.advanceTimersByTimeAsync(0);
    await answerConfig();

    expect(counts.map(({ body }) => body)).toEqual([
      { indexName: INDEX, query: "shirt", facets: ["color", "price"] },
    ]);
    expect(hits).toHaveLength(1);

    counts[0].resolve(COUNTS);
    await vi.advanceTimersByTimeAsync(0);

    expect(controller.getSnapshot().results).toMatchObject({
      status: SearchStatus.SUCCESS,
      products: { nbHits: 4 },
      facets: COUNTS.facets,
      facetsStats: COUNTS.facets_stats,
    });
  });

  it("sends the counts once when the config answers before the hits", async () => {
    controller = create();
    controller.search();
    await answerConfig();

    expect(counts).toHaveLength(1);
    expect(hits).toHaveLength(1);
    expect(hits[0].signal?.aborted).toBe(false);

    hits[0].resolve({ results: [result("shirt")] });
    counts[0].resolve(COUNTS);
    await vi.advanceTimersByTimeAsync(0);

    expect(controller.getSnapshot().results.facets).toEqual(COUNTS.facets);
    expect(counts).toHaveLength(1);
  });

  it("counts the price alone, once, when the config fails to load", async () => {
    controller = create();
    controller.search();

    expect(counts).toHaveLength(0);

    await failConfig();

    expect(counts.map(({ body }) => body.facets)).toEqual([["price"]]);

    hits[0].resolve({ results: [result("shirt")] });
    counts[0].resolve(COUNTS);
    await vi.advanceTimersByTimeAsync(0);

    expect(controller.getSnapshot().results).toMatchObject({
      status: SearchStatus.SUCCESS,
      facetsStats: COUNTS.facets_stats,
    });
  });

  it("counts only the latest query when a search replaces one before the config", async () => {
    controller = create();
    controller.search();
    setState(controller, { query: "shoes" });
    await vi.advanceTimersByTimeAsync(100);

    expect(hits[0].signal?.aborted).toBe(true);
    expect(hits).toHaveLength(2);
    expect(counts).toHaveLength(0);

    await answerConfig();

    expect(counts.map(({ body }) => body)).toEqual([
      { indexName: INDEX, query: "shoes", facets: ["color", "price"] },
    ]);

    hits[0].resolve({ results: [result("shirt")] });
    hits[1].resolve({ results: [result("shoes")] });
    await vi.advanceTimersByTimeAsync(0);

    expect(controller.getSnapshot().results.products?.query).toBe("shoes");
  });

  it("counts the query typed while the config loads, once its debounce ends", async () => {
    controller = create();
    controller.search();
    setState(controller, { query: "shoes" });
    await answerConfig();

    expect(counts).toHaveLength(0); // The typed query is not sent yet.

    await vi.advanceTimersByTimeAsync(100);

    expect(counts.map(({ body }) => body.query)).toEqual(["shoes"]);
  });

  it("sends a page change's hits alone, and its search's counts once the config loads", async () => {
    controller = create();
    controller.search();
    setState(controller, { page: 1 });

    expect(hits).toHaveLength(2);
    expect(counts).toHaveLength(0);

    await answerConfig();
    setState(controller, { page: 2 });

    expect(counts.map(({ body }) => body)).toEqual([
      { indexName: INDEX, query: "shirt", facets: ["color", "price"] },
    ]);
    expect(hits).toHaveLength(3);
  });

  it("sends the refinements the first search dropped with their counts, once", async () => {
    controller = create({
      initialSearchState: {
        [INDEX]: { query: "shirt", refinementList: { color: ["Bleu"] } },
      },
    });
    controller.search();

    expect(hits[0].body.requests[0]).not.toHaveProperty("facetFilters");
    expect(counts).toHaveLength(0);

    await answerConfig();

    const facetFilters = [[{ attribute: "color", value: "Bleu" }]];
    expect(hits[1].body.requests[0]).toMatchObject({ facetFilters });
    expect(counts.map(({ body }) => body)).toEqual([
      {
        indexName: INDEX,
        query: "shirt",
        facetFilters,
        facets: ["color", "price"],
      },
    ]);
  });

  it("sends the counts with the hits when the session holds the config", async () => {
    controller = create();
    controller.search();
    await answerConfig();
    controller.dispose();
    counts.length = 0;
    config.length = 0;

    controller = create();
    controller.search();

    expect(counts.map(({ body }) => body.facets)).toEqual([["color", "price"]]);

    await answerConfig(); // Loaded again: same attributes, nothing more.

    expect(counts).toHaveLength(1);
  });

  it("sends the counts with the hits when the config is passed in", () => {
    controller = create({
      config: { searchConfig: { filterableAttributes: [...ATTRIBUTES] } },
    });
    controller.search();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(counts.map(({ body }) => body.facets)).toEqual([["color", "price"]]);
  });

  it("sends the counts with the hits when there is no config to load", () => {
    controller = create({ apiKey: undefined });
    controller.search();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(counts.map(({ body }) => body.facets)).toEqual([["price"]]);
  });

  it.each(["close", "dispose"] as const)(
    "sends no counts after a %s before the config loads",
    async (end) => {
      controller = create();
      controller.search();
      controller[end]();
      await answerConfig();

      expect(counts).toHaveLength(0);
    },
  );
});
