// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectHits } from "../search/connectHits";
import { createSearchController } from "../search/createSearchController";
import { SearchControllerOptions } from "../search/types";
import { SearchBusinessRanking } from "../types/dialogConfig";
import {
  SearchProductHit,
  SearchResponse,
  SearchResult,
} from "../types/search";

const impressions = vi.hoisted(() => ({
  observe: vi.fn(),
  forceImpression: vi.fn(),
}));

vi.mock("../utils/searchImpressions", () => ({
  createSearchImpressionTracker: () => ({
    setContext: vi.fn(),
    observe: impressions.observe,
    forceImpression: impressions.forceImpression,
    flush: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

const hit = (overrides: Partial<SearchProductHit>): SearchProductHit => ({
  objectID: "v1",
  id: 1,
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
  ...overrides,
});

const answer = (
  index: string,
  query: string,
  hits: SearchProductHit[],
): SearchResponse => ({
  results: [
    {
      index,
      hits,
      nbHits: hits.length,
      page: 0,
      nbPages: 1,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query,
      queryID: "qid",
    } satisfies SearchResult<SearchProductHit>,
  ],
});

const transport = vi.fn<() => Promise<SearchResponse>>();
const trackSelectSearchResult = vi.fn();

const create = (options: Partial<SearchControllerOptions> = {}) =>
  createSearchController({
    transport,
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult,
    },
    ...options,
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("connectHits", () => {
  it("gives each hit its display in the market currency", async () => {
    const controller = create({
      buildProductUrl: (product) => `/products/${product.handle ?? ""}`,
    });
    const hits = connectHits(controller);
    transport.mockResolvedValue(
      answer("products_fr_be", "creme", [
        hit({
          title: "Crème mains",
          url: "/products/creme-mains",
          product_image: "product.jpg",
          image: "variant.jpg",
          variants_min_price: 12.5,
          variants_compare_at_price_min: 15,
          currency: "EUR",
        }),
        hit({ objectID: "v2", handle: "savon", image: "", currency: "EUR" }),
        hit({ objectID: "v3", title: "Script", url: "javascript:alert(1)" }),
      ]),
    );

    controller.setSearchState({ products_fr_be: { query: "creme" } });
    await vi.advanceTimersByTimeAsync(100);

    const [first, second, third] = hits
      .getRenderState()
      .hits.map(({ display }) => display);
    expect({
      ...first,
      price: first.price.replace(/\s/g, " "),
      compareAtPrice: first.compareAtPrice.replace(/\s/g, " "),
    }).toEqual({
      title: "Crème mains",
      titleParts: { before: "", match: "Crème", after: " mains" },
      href: "/products/creme-mains",
      image: "product.jpg",
      price: "12,50 €",
      compareAtPrice: "15,00 €",
    });
    expect(second).toMatchObject({
      title: "savon",
      href: "/products/savon",
      image: undefined,
      price: "",
      compareAtPrice: "",
    });
    expect(third.href).toBeUndefined();
    expect(hits.getRenderState()).toMatchObject({
      query: "creme",
      title: "Produits",
    });
  });

  it.each<[string, string, SearchBusinessRanking | undefined, string]>([
    ["en", "US", undefined, "Our products"],
    ["en", "US", "best_sellers", "Best sellers"],
    ["fr", "FR", "newest", "Nouveautés"],
    ["de", "DE", "price_asc", "Niedrige Preise"],
    ["es", "ES", "price_desc", "Precios altos"],
    ["it", "IT", undefined, "I nostri prodotti"],
  ])(
    "titles the empty query in %s after the ranking %s",
    async (language, country, businessRanking, title) => {
      const index = `products_${language}_${country.toLowerCase()}`;
      const controller = create({
        language,
        country,
        config: { businessRanking },
      });
      const hits = connectHits(controller);
      transport.mockResolvedValue(answer(index, "", [hit({})]));

      controller.open();
      await vi.advanceTimersByTimeAsync(0);

      expect(hits.getRenderState().title).toBe(title);
    },
  );

  it("tracks impressions and selections, and reports whether navigation ran", async () => {
    const navigate = vi.fn();
    const controller = create({ navigate });
    const hits = connectHits(controller);
    transport.mockResolvedValue(
      answer("products_fr_be", "", [
        hit({ url: "/products/a" }),
        hit({ objectID: "v2" }),
      ]),
    );
    controller.open();
    await vi.advanceTimersByTimeAsync(0);
    const element = document.createElement("li");

    hits.observe(element, 0);
    expect(impressions.observe).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ product_id: "1", position: 1 }),
    );

    expect(hits.select(0)).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/products/a", expect.anything());
    expect(hits.select(0, { navigate: false })).toBe(false);
    expect(hits.select(1)).toBe(false);
    expect(trackSelectSearchResult).toHaveBeenCalledTimes(3);
    expect(navigate).toHaveBeenCalledTimes(1);

    hits.dispose();
    expect(hits.select(0)).toBe(false);
    hits.observe(element, 0);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(impressions.observe).toHaveBeenCalledTimes(1);
  });
});
