/* eslint max-lines: ["error", 360] */
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

const result = (): SearchResult => ({
  index: INDEX,
  hits: [],
  nbHits: 4,
  page: 0,
  nbPages: 1,
  hitsPerPage: 12,
  processingTimeMS: 1,
  query: "shirt",
  queryID: "qid",
});

const COUNTS: SearchFacetsResponse = {
  facets: { color: { Bleu: 3, Rouge: 1 } },
  facets_stats: { price: { min: 9.9, max: 120 } },
  nbHits: 4,
};

interface Pending<T> {
  body: unknown;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  signal?: AbortSignal;
}

const hits: Pending<SearchResponse>[] = [];
const counts: Pending<SearchFacetsResponse>[] = [];
const order: string[] = [];

const transport = vi.fn(
  (request: SearchRequest, options?: SearchOptions) =>
    new Promise<SearchResponse>((resolve, reject) => {
      order.push("hits");
      hits.push({ body: request, resolve, reject, signal: options?.signal });
    }),
);
const facetsTransport = vi.fn(
  (request: SearchFacetsRequest, options?: SearchOptions) =>
    new Promise<SearchFacetsResponse>((resolve, reject) => {
      order.push("counts");
      counts.push({ body: request, resolve, reject, signal: options?.signal });
    }),
);

const settle = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(0);
};

const create = (
  options: Partial<SearchControllerOptions> = {},
): SearchController =>
  createSearchController({
    transport,
    facetsTransport,
    language: "fr",
    country: "BE",
    config: {
      searchConfig: {
        filterableAttributes: [
          {
            key: "color",
            label: "Couleur",
            type: "keyword",
            values: ["Bleu", "Rouge", "Vert"],
          },
          { key: "size", label: "Taille", type: "keyword", values: ["M"] },
          { key: "new", label: "Nouveau", type: "boolean", values: [] },
          { key: "price", label: "Prix", type: "number", values: [] },
        ],
      },
    },
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    sections: [{ index: "collections" }],
    initialSearchState: {
      [INDEX]: {
        query: "shirt",
        refinementList: { color: ["Bleu"] },
        range: { price: "10:" },
      },
    },
    ...options,
  });

const refine = (controller: SearchController, color: string[]): void => {
  controller.setSearchState((state) => ({
    ...state,
    [INDEX]: { ...state[INDEX], refinementList: { color } },
  }));
};

const setPage = (controller: SearchController, page: number): void => {
  controller.setSearchState((state) => ({
    ...state,
    [INDEX]: { ...state[INDEX], page },
  }));
};

// The hits request of 3.5.0 for this search state: the option changes none of it.
const HITS_BODY: SearchRequest = {
  requests: [
    {
      indexName: INDEX,
      query: "shirt",
      page: 0,
      facetFilters: [[{ attribute: "color", value: "Bleu" }]],
      numericFilters: [[{ attribute: "price", operator: ">=", value: 10 }]],
      hitsPerPage: 12,
    },
    {
      indexName: "collections_fr_be",
      query: "shirt",
      page: 0,
      hitsPerPage: 12,
    },
  ],
};

describe("search controller facets option", () => {
  let controller: SearchController | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    controller?.dispose();
    controller = undefined;
    hits.length = 0;
    counts.length = 0;
    order.length = 0;
    transport.mockClear();
    facetsTransport.mockClear();
    vi.useRealTimers();
  });

  it("is off by default: the hits request is 3.5.0's and no counts are asked", async () => {
    controller = create();
    controller.search();
    hits[0].resolve({ results: [result()] });
    await settle();

    expect(transport.mock.calls.map(([body]) => body)).toEqual([HITS_BODY]);
    expect(facetsTransport).not.toHaveBeenCalled();
    expect(controller.getSnapshot().results).not.toHaveProperty("facets");
    expect(controller.getSnapshot().results).not.toHaveProperty("facetsStats");
  });

  it("sends nothing more in AI mode", () => {
    controller = create({ mode: "ai", facets: true });
    controller.search();

    expect(transport).toHaveBeenCalledOnce();
    expect(facetsTransport).not.toHaveBeenCalled();
  });

  it("on, sends the counts with the hits, and the hits request as off", () => {
    controller = create({ facets: true });
    controller.search();

    expect(order).toEqual(["counts", "hits"]);
    expect(hits.map(({ body }) => body)).toEqual([HITS_BODY]);
    expect(counts.map(({ body }) => body)).toEqual([
      {
        indexName: INDEX,
        query: "shirt",
        facetFilters: [[{ attribute: "color", value: "Bleu" }]],
        numericFilters: [[{ attribute: "price", operator: ">=", value: 10 }]],
        facets: ["color", "size", "price"],
      },
    ]);
  });

  it("asks the price even when the config does not declare it", () => {
    controller = create({ facets: true, config: {} });
    controller.search();

    expect(counts[0].body).toMatchObject({ facets: ["price"] });
  });

  it("renders the hits without waiting for the counts, then the counts", async () => {
    controller = create({ facets: true });
    controller.search();
    hits[0].resolve({ results: [result()] });
    await settle();

    expect(controller.getSnapshot().results).toMatchObject({
      status: SearchStatus.SUCCESS,
      products: { nbHits: 4 },
    });
    expect(controller.getSnapshot().results).not.toHaveProperty("facets");

    counts[0].resolve(COUNTS);
    await settle();

    expect(controller.getSnapshot().results).toMatchObject({
      status: SearchStatus.SUCCESS,
      products: { nbHits: 4 },
      facets: COUNTS.facets,
      facetsStats: COUNTS.facets_stats,
    });
  });

  it("keeps counts that answer before the hits once the hits answer", async () => {
    controller = create({ facets: true });
    controller.search();
    counts[0].resolve(COUNTS);
    await settle();
    hits[0].resolve({ results: [result()] });
    await settle();

    expect(controller.getSnapshot().results).toMatchObject({
      status: SearchStatus.SUCCESS,
      facets: COUNTS.facets,
    });
  });

  it("aborts both requests on a newer search and drops their answers", async () => {
    controller = create({ facets: true });
    controller.search();
    refine(controller, ["Rouge"]);

    expect(hits[0].signal?.aborted).toBe(true);
    expect(counts[0].signal?.aborted).toBe(true);
    expect(counts).toHaveLength(2);

    counts[0].resolve(COUNTS);
    await settle();

    expect(controller.getSnapshot().results).not.toHaveProperty("facets");
  });

  it("leaves the hits and no counts when the counts fail", async () => {
    controller = create({ facets: true });
    controller.search();
    counts[0].resolve(COUNTS);
    hits[0].resolve({ results: [result()] });
    await settle();
    refine(controller, ["Rouge"]);
    hits[1].resolve({ results: [result()] });
    await settle();

    // The previous counts are kept while the next load.
    expect(controller.getSnapshot().results.facets).toEqual(COUNTS.facets);

    counts[1].reject(new Error("502"));
    await settle();

    const { results } = controller.getSnapshot();
    expect(results.status).toBe(SearchStatus.SUCCESS);
    expect(results.products?.nbHits).toBe(4);
    expect(results).not.toHaveProperty("facets");
    expect(results).not.toHaveProperty("facetsStats");
  });

  it("asks the hits alone on a page change, and keeps the counts", async () => {
    controller = create({ facets: true });
    controller.search();
    counts[0].resolve(COUNTS);
    hits[0].resolve({ results: [result()] });
    await settle();
    setPage(controller, 1);

    expect(hits).toHaveLength(2);
    expect(counts).toHaveLength(1);

    hits[1].resolve({ results: [{ ...result(), page: 1 }] });
    await settle();

    expect(controller.getSnapshot().results.facets).toEqual(COUNTS.facets);
  });

  it("lets counts on their way answer across a page change", async () => {
    controller = create({ facets: true });
    controller.search();
    setPage(controller, 1);

    expect(counts[0].signal?.aborted).toBe(false);
    expect(counts).toHaveLength(1);

    counts[0].resolve(COUNTS);
    await settle();

    expect(controller.getSnapshot().results.facets).toEqual(COUNTS.facets);
  });

  it("aborts the counts and forgets them on close", async () => {
    controller = create({ facets: true });
    controller.search();
    counts[0].resolve(COUNTS);
    await settle();
    controller.close();

    expect(controller.getSnapshot().results).toEqual({
      status: SearchStatus.IDLE,
    });

    refine(controller, ["Bleu"]);

    expect(counts).toHaveLength(2);
  });

  it("binds the counts to the API key when no counts transport is given", () => {
    const fetch = vi.fn(() => new Promise<Response>(() => undefined));
    vi.stubGlobal("fetch", fetch);
    controller = create({
      facets: true,
      facetsTransport: undefined,
      apiKey: "key",
    });
    controller.search();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/public\/search\/lexical\/facets$/),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-dialog-api-key": "key" }),
      }),
    );
    vi.unstubAllGlobals();
  });
});
