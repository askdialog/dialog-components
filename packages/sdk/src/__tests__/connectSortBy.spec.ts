import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectSortBy } from "../search/connectSortBy";
import { createSearchController } from "../search/createSearchController";
import { SearchController, SearchControllerOptions } from "../search/types";
import {
  SearchFacetsResponse,
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

const transport = vi.fn<(request: SearchRequest) => Promise<SearchResponse>>();
const facetsTransport = vi.fn<() => Promise<SearchFacetsResponse>>();

const create = (
  options: Partial<SearchControllerOptions> = {},
): SearchController =>
  createSearchController({
    transport,
    facetsTransport,
    facets: true,
    language: "fr",
    country: "BE",
    config: {
      searchConfig: {
        filterableAttributes: [
          { key: "color", label: "Couleur", type: "keyword", values: ["Bleu"] },
        ],
      },
    },
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    initialSearchState: {
      [INDEX]: { query: "robe", page: 2, refinementList: { color: ["Bleu"] } },
    },
    ...options,
  });

const productsRequest = (call: number) =>
  transport.mock.calls[call]?.[0].requests[0];

describe("connectSortBy", () => {
  let controller: SearchController;

  beforeEach(() => {
    vi.useFakeTimers();
    transport.mockResolvedValue({ results: [] });
    facetsTransport.mockResolvedValue({ facets: {}, nbHits: 0 });
  });

  afterEach(() => {
    controller.dispose();
    transport.mockReset();
    facetsTransport.mockReset();
    vi.useRealTimers();
  });

  it("offers relevance and both price orders in the shopper's language", () => {
    controller = create();

    expect(connectSortBy(controller).getRenderState()).toEqual({
      label: "Trier par",
      currentRefinement: "relevance",
      items: [
        { value: "relevance", label: "Pertinence", isRefined: true },
        { value: "price_asc", label: "Prix croissant", isRefined: false },
        { value: "price_desc", label: "Prix décroissant", isRefined: false },
      ],
    });
  });

  it("sends the sort from page 1, the query and filters kept, without asking the counts again", async () => {
    controller = create();
    const sortBy = connectSortBy(controller);
    controller.search();
    await vi.advanceTimersByTimeAsync(0);

    expect(productsRequest(0)).not.toHaveProperty("sort");

    sortBy.refine("price_desc");
    await vi.advanceTimersByTimeAsync(0);

    expect(productsRequest(1)).toMatchObject({
      query: "robe",
      page: 0,
      facetFilters: [[{ attribute: "color", value: "Bleu" }]],
      sort: "price_desc",
    });
    expect(sortBy.getRenderState().currentRefinement).toBe("price_desc");
    expect(facetsTransport).toHaveBeenCalledTimes(1);

    sortBy.refine("relevance");
    await vi.advanceTimersByTimeAsync(0);

    expect(productsRequest(2)).not.toHaveProperty("sort");
  });

  it("never sends a sort in AI mode", async () => {
    controller = create({
      mode: "ai",
      facets: false,
      initialSearchState: { [INDEX]: { query: "robe", sort: "price_asc" } },
    });
    controller.search();
    await vi.advanceTimersByTimeAsync(0);

    expect(productsRequest(0)).not.toHaveProperty("sort");
  });
});
