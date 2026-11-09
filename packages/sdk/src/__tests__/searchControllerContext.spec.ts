// @vitest-environment jsdom
/* eslint max-lines: ["error", 300] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchController } from "../search/createSearchController";
import {
  SearchController,
  SearchControllerOptions,
  SearchSnapshot,
} from "../search/types";
import { SearchRequest, SearchResponse } from "../types/search";
import { SearchStatus } from "../types/searchController";

const INDEX = "products_fr_be";

const ATTRIBUTES = [
  { key: "color", label: "Couleur", type: "keyword", values: ["Rouge"] },
] as const;

const PRICE_FIELDS = {
  price: "Tarif public",
  brand: "Marque",
  category: "Catégorie",
  productType: "Type",
  color: "Couleur",
  size: "Taille",
};
const PRICE = { key: "price", label: "Prix", type: "number", values: [] };
// A loaded config gains the price attribute.
const LOADED = [...ATTRIBUTES, PRICE];

const answer: SearchResponse = {
  results: [
    {
      index: INDEX,
      hits: [],
      nbHits: 2,
      page: 0,
      nbPages: 1,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query: "",
      queryID: "qid",
    },
  ],
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const fetchMock = vi.fn<typeof fetch>();
const transport = vi.fn<(request: SearchRequest) => Promise<SearchResponse>>(
  () => Promise.resolve(answer),
);
// The loads are cached per page: each test uses its own API key.
let apiKey = 0;

const configRequests = (): string[] =>
  fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname);

const create = (
  options: Partial<SearchControllerOptions> = {},
): SearchController =>
  createSearchController({
    transport,
    apiKey: `pk_test_${apiKey}`,
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    ...options,
  });

const context = (controller: SearchController): SearchSnapshot["context"] =>
  controller.getSnapshot().context;

beforeEach(() => {
  apiKey += 1;
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  // Hit tracking observes impressions once a response arrives.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  fetchMock.mockImplementation((url) =>
    Promise.resolve(
      String(url).includes("/widget/dialog-config")
        ? jsonResponse({ searchBusinessRanking: "best_sellers" })
        : jsonResponse({ filterableAttributes: ATTRIBUTES }),
    ),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("search controller context", () => {
  it("takes the business ranking and filterable attributes from the config option and loads nothing", async () => {
    const controller = create({
      config: {
        businessRanking: "newest",
        searchConfig: { filterableAttributes: ATTRIBUTES },
      },
    });
    controller.open();
    controller.setSearchState({ [INDEX]: { query: "shoes" } });
    await vi.runAllTimersAsync();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(context(controller)).toMatchObject({
      businessRanking: "newest",
      filterableAttributes: ATTRIBUTES,
    });
  });

  it("loads the dialog config and the search config at the first open, not at creation", async () => {
    const controller = create();
    await vi.runAllTimersAsync();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(context(controller)).toMatchObject({
      businessRanking: undefined,
      filterableAttributes: [],
    });

    controller.open();
    await vi.runAllTimersAsync();

    expect(configRequests()).toEqual([
      "/widget/dialog-config",
      "/public/search/config",
    ]);
    expect(context(controller)).toMatchObject({
      businessRanking: "best_sellers",
      filterableAttributes: LOADED,
    });
  });

  it("loads the config at the first search", async () => {
    const controller = create();
    controller.setSearchState({ [INDEX]: { query: "shoes" } });
    await vi.runAllTimersAsync();

    expect(configRequests()).toHaveLength(2);
    expect(context(controller).businessRanking).toBe("best_sellers");
  });

  it("sends again, once the config loads, the refinements its first search dropped", async () => {
    const controller = create();
    controller.setSearchState({
      [INDEX]: { query: "", refinementList: { color: ["Rouge"] } },
    });
    await vi.runAllTimersAsync();

    expect(transport.mock.calls.map(([request]) => request)).toEqual([
      {
        requests: [
          expect.not.objectContaining({ facetFilters: expect.anything() }),
        ],
      },
      {
        requests: [
          expect.objectContaining({
            facetFilters: [[{ attribute: "color", value: "Rouge" }]],
          }),
        ],
      },
    ]);
  });

  it("shares one load between controllers with the same API key and language", async () => {
    const first = create();
    const second = create();
    first.open();
    second.open();
    await vi.runAllTimersAsync();
    create().open();
    await vi.runAllTimersAsync();

    expect(configRequests()).toHaveLength(2);
    expect(context(second).businessRanking).toBe("best_sellers");

    create({ language: "de", country: "DE" }).open();
    await vi.runAllTimersAsync();
    expect(configRequests()).toHaveLength(4);
  });

  it("leaves the business ranking undefined when the dialog config fails, and still searches", async () => {
    fetchMock.mockImplementation((url) =>
      Promise.resolve(
        String(url).includes("/widget/dialog-config")
          ? jsonResponse({}, 500)
          : jsonResponse({ filterableAttributes: ATTRIBUTES }),
      ),
    );
    const controller = create();
    controller.open();
    await vi.runAllTimersAsync();

    expect(controller.getSnapshot().results.status).toBe(SearchStatus.SUCCESS);
    expect(context(controller)).toMatchObject({
      businessRanking: undefined,
      filterableAttributes: LOADED,
    });
  });

  it("puts the price attribute last, in place of one the config publishes, and sends a range on it", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse({
          filterableAttributes: [
            { key: "price", label: "Tarif", type: "keyword", values: ["10"] },
            ...ATTRIBUTES,
          ],
        }),
      ),
    );
    const controller = create({ texts: { filterFields: { ...PRICE_FIELDS } } });
    controller.setSearchState({
      [INDEX]: { query: "", range: { price: "10:20" } },
    });
    await vi.runAllTimersAsync();

    expect(context(controller).filterableAttributes).toEqual([
      ...ATTRIBUTES,
      { ...PRICE, label: "Tarif public" },
    ]);
    expect(transport.mock.lastCall?.[0]).toEqual({
      requests: [
        expect.objectContaining({
          numericFilters: [[{ attribute: "price", from: 10, to: 20 }]],
        }),
      ],
    });
  });

  it("keeps the merchant's choice to hide the price from the search page", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse({
          filterableAttributes: [
            { ...PRICE, showInSearch: false },
            ...ATTRIBUTES,
          ],
        }),
      ),
    );
    const controller = create();
    controller.open();
    await vi.runAllTimersAsync();

    expect(context(controller).filterableAttributes).toEqual([
      ...ATTRIBUTES,
      { ...PRICE, showInSearch: false },
    ]);
  });

  it("adds no price attribute when the search config fails", async () => {
    fetchMock.mockImplementation((url) =>
      Promise.resolve(
        String(url).includes("/widget/dialog-config")
          ? jsonResponse({})
          : jsonResponse({}, 500),
      ),
    );
    const controller = create();
    controller.open();
    await vi.runAllTimersAsync();

    expect(context(controller).filterableAttributes).toEqual([]);
  });

  it("exposes the texts of its language with the overrides applied", () => {
    const { texts } = context(
      create({ language: "de", country: "AT", texts: { retry: "Nochmal" } }),
    );

    expect(texts.noResults).toBe("Keine passenden Produkte");
    expect(texts.retry).toBe("Nochmal");
  });
});
