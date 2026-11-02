import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DialogSearchError } from "../DialogSearchError";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import { SearchFilterBlock } from "../types/aiSearch";
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

const API_KEY = "pk_test_abcdef";
const INDEX = "products_fr_be";

const filters: SearchFilterBlock[] = [
  {
    source: "query_constructor",
    facetFilters: [[{ attribute: "color", value: "rouge" }]],
    numericFilters: [[{ attribute: "price", operator: "<=", value: 40 }]],
  },
  { source: "user", facetFilters: [], numericFilters: [] },
];

const aiAnswer = {
  results: [
    {
      index: INDEX,
      hits: [{ objectID: "1", title: "Robe rouge" }],
      nbHits: 1,
      page: 0,
      nbPages: 1,
      hitsPerPage: 12,
      processingTimeMS: 40,
      query: "robe rouge",
      queryID: "qid",
      filters,
      attributeLabels: { color: "Couleur", price: "Prix" },
    },
  ],
};

const fetchMock =
  vi.fn<(url: string, init: RequestInit) => Promise<Response>>();

const respond = (body: unknown, status = 200): void => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
};

const create = (): SearchController =>
  createSearchController({
    mode: "ai",
    apiKey: API_KEY,
    // Passed in, so the controller loads no config.
    config: {},
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    sections: [{ index: "collections" }],
  });

const search = async (
  controller: SearchController,
  query: string,
): Promise<void> => {
  controller.setSearchState({ [INDEX]: { query } });
  await vi.advanceTimersByTimeAsync(100);
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  respond(aiAnswer);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("search controller, AI mode", () => {
  it("searches the products index on /public/search/ai with the api key, no section", async () => {
    await search(create(), " robe rouge ");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/public\/search\/ai$/);
    expect(init.headers).toMatchObject({ "x-dialog-api-key": API_KEY });
    expect(JSON.parse(init.body as string)).toEqual({
      requests: [
        { indexName: INDEX, query: "robe rouge", page: 0, hitsPerPage: 12 },
      ],
    });
  });

  it("exposes the response's filters by source and its attribute labels", async () => {
    const controller = create();
    await search(controller, "robe rouge");

    expect(controller.getSnapshot().results).toMatchObject({
      status: SearchStatus.SUCCESS,
      filters,
      attributeLabels: { color: "Couleur", price: "Prix" },
    });
  });

  it.each(["", "a", " a ", "🙂"])(
    "sends no request for the query %j",
    async (query) => {
      const controller = create();
      controller.open();
      await search(controller, query);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(controller.getSnapshot().results.status).toBe(SearchStatus.IDLE);
    },
  );

  it("aborts the pending request and goes idle when the query falls below 2 characters", async () => {
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    const controller = create();
    await search(controller, "robe");
    const { signal } = fetchMock.mock.calls[0][1];

    await search(controller, "r");

    expect(signal?.aborted).toBe(true);
    expect(controller.getSnapshot().results).toEqual({
      status: SearchStatus.IDLE,
    });
  });

  it("fails with a DialogSearchError on an HTTP error", async () => {
    respond({ error: "THROTTLED", message: "Too many requests" }, 429);
    const controller = create();
    await search(controller, "robe rouge");

    const { results } = controller.getSnapshot();
    expect(results.status).toBe(SearchStatus.ERROR);
    expect(results.error).toBeInstanceOf(DialogSearchError);
  });

  it("needs a transport or an api key", () => {
    expect(() =>
      createSearchController({
        mode: "ai",
        language: "fr",
        country: "BE",
        analytics: {
          surface: "search_page",
          trackViewSearchResults: vi.fn(),
          trackSelectSearchResult: vi.fn(),
        },
      }),
    ).toThrow(/transport or an apiKey/);
  });
});
