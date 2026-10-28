// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectStats } from "../search/connectStats";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import { SearchResponse } from "../types/search";

vi.mock("../utils/searchImpressions", () => ({
  createSearchImpressionTracker: () => ({
    setContext: vi.fn(),
    observe: vi.fn(),
    forceImpression: vi.fn(),
    flush: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

const answer = (index: string, nbHits: number): SearchResponse => ({
  results: [
    {
      index,
      hits: [],
      nbHits,
      page: 0,
      nbPages: 1,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query: "",
      queryID: "qid",
    },
  ],
});

const transport = vi.fn<() => Promise<SearchResponse>>();

const create = (language: string, country: string): SearchController =>
  createSearchController({
    transport,
    language,
    country,
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
  });

const search = async (
  controller: SearchController,
  index: string,
  query: string,
): Promise<void> => {
  controller.setSearchState({ [index]: { query } });
  await vi.advanceTimersByTimeAsync(100);
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("connectStats", () => {
  it.each([
    ["en", "US", "1 result", "12,345 results"],
    ["fr", "FR", "1 résultat", "12 345 résultats"],
    ["de", "DE", "1 Ergebnis", "12.345 Ergebnisse"],
    ["es", "ES", "1 resultado", "12.345 resultados"],
    ["it", "IT", "1 risultato", "12.345 risultati"],
  ])("announces the hit count in %s", async (language, country, one, many) => {
    const index = `products_${language}_${country.toLowerCase()}`;
    const controller = create(language, country);
    const stats = connectStats(controller);

    expect(stats.getRenderState().nbHits).toBe(0);

    transport.mockResolvedValue(answer(index, 1));
    await search(controller, index, "a");

    expect(stats.getRenderState()).toEqual({ nbHits: 1, text: one });

    transport.mockResolvedValue(answer(index, 12345));
    await search(controller, index, "ab");

    expect(stats.getRenderState().text.replace(/\s/g, " ")).toBe(many);
  });

  it("keeps its render state while the count holds, and stops notifying after dispose", async () => {
    const index = "products_en_us";
    const controller = create("en", "US");
    const stats = connectStats(controller);
    transport.mockResolvedValue(answer(index, 5));
    await search(controller, index, "a");
    const renderState = stats.getRenderState();
    const listener = vi.fn();
    stats.subscribe(listener);

    await search(controller, index, "ab");

    expect(stats.getRenderState()).toBe(renderState);
    expect(listener).not.toHaveBeenCalled();

    stats.dispose();
    transport.mockResolvedValue(answer(index, 6));
    await search(controller, index, "abc");

    expect(listener).not.toHaveBeenCalled();
  });
});
