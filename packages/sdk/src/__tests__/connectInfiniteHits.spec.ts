// @vitest-environment jsdom
/* eslint max-lines: ["error", 360] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectInfiniteHits,
  InfiniteHitsConnector,
} from "../search/connectInfiniteHits";
import { createSearchController } from "../search/createSearchController";
import { SearchController, SearchMode } from "../search/types";
import {
  SearchOptions,
  SearchProductHit,
  SearchRequest,
  SearchResponse,
  SearchResult,
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

const hit = (objectID: string): SearchProductHit => ({
  objectID,
  id: 1,
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
  _display: {
    title: `Produit ${objectID}`,
    url: "/products/produit",
    price: "10,00 €",
    lines: [],
  },
});

const pageOf = (
  page: number,
  overrides: Partial<SearchResult<SearchProductHit>> = {},
): SearchResult<SearchProductHit> => ({
  index: INDEX,
  hits: [hit(`${page}a`), hit(`${page}b`)],
  nbHits: 5,
  page,
  nbPages: 3,
  hitsPerPage: 2,
  processingTimeMS: 1,
  query: "robe",
  queryID: "qid",
  ...overrides,
});

type Settle = (outcome: SearchResponse | Error) => void;
const pending: Settle[] = [];
const transport =
  vi.fn<
    (req: SearchRequest, opts?: SearchOptions) => Promise<SearchResponse>
  >();

const settle = async (outcome: SearchResponse | Error): Promise<void> => {
  pending.shift()?.(outcome);
  await vi.advanceTimersByTimeAsync(0);
};

const answer = (
  page: number,
  overrides?: Partial<SearchResult<SearchProductHit>>,
): Promise<void> => settle({ results: [pageOf(page, overrides)] });

const ids = (connector: InfiniteHitsConnector): string[] =>
  connector.getRenderState().hits.map(({ hit: { objectID } }) => objectID);

const requestedPage = (call: number): number | undefined =>
  transport.mock.calls[call]?.[0].requests[0]?.page;

let controller: SearchController;
let infiniteHits: InfiniteHitsConnector;

const connect = async (mode: SearchMode): Promise<void> => {
  controller = createSearchController({
    mode,
    transport,
    config: {},
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    debounceMs: 100,
  });
  infiniteHits = connectInfiniteHits(controller);
  controller.setSearchState({ [INDEX]: { query: "robe" } });
  await vi.advanceTimersByTimeAsync(100);
};

beforeEach(() => {
  vi.useFakeTimers();
  // Hit tracking observes impressions once a response arrives.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  transport.mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        pending.push((outcome) => {
          if (outcome instanceof Error) {
            reject(outcome);
          } else {
            resolve(outcome);
          }
        });
      }),
  );
});

afterEach(() => {
  infiniteHits.dispose();
  controller.dispose();
  pending.length = 0;
  transport.mockReset();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("connectInfiniteHits", () => {
  beforeEach(() => connect("lexical"));

  it("stacks every page fetched, in page order, with the engine's total", async () => {
    await answer(0);
    infiniteHits.showMore();
    expect(requestedPage(1)).toBe(1);

    expect(infiniteHits.getRenderState()).toMatchObject({
      loadingMore: true,
      nbHits: 5,
    });
    expect(ids(infiniteHits)).toEqual(["0a", "0b"]);

    await answer(1);
    expect(ids(infiniteHits)).toEqual(["0a", "0b", "1a", "1b"]);
    expect(infiniteHits.getRenderState()).toMatchObject({
      nbHits: 5,
      isLastPage: false,
      loadingMore: false,
    });
  });

  it("gives each hit its display on the lexical mode", async () => {
    await answer(0);

    expect(infiniteHits.getRenderState().hits[0]?.display).toMatchObject({
      title: "Produit 0a",
      price: "10,00 €",
    });
  });

  it("requests nothing more while loading or on the last page", async () => {
    infiniteHits.showMore();
    expect(transport).toHaveBeenCalledTimes(1);

    await answer(0);
    infiniteHits.showMore();
    infiniteHits.showMore();
    expect(transport).toHaveBeenCalledTimes(2);

    await answer(1);
    infiniteHits.showMore();
    await answer(2);
    expect(infiniteHits.getRenderState().isLastPage).toBe(true);

    infiniteHits.showMore();
    expect(transport).toHaveBeenCalledTimes(3);
  });

  it("requests nothing more while a new query waits for its debounce", async () => {
    await answer(0);
    controller.setSearchState({ [INDEX]: { query: "jupe" } });

    infiniteHits.showMore();

    expect(transport).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["loading", (): void => undefined],
    ["failed", (): Promise<void> => settle(new Error("network"))],
  ])(
    "shows no page %s more while a new query waits for its debounce",
    async (_name, endPage) => {
      await answer(0);
      infiniteHits.showMore();
      await endPage();

      controller.setSearchState({ [INDEX]: { query: "jupe" } });

      expect(infiniteHits.getRenderState()).toMatchObject({
        loadingMore: false,
        failedMore: false,
      });
    },
  );

  it("keeps the fetched pages when the next one fails, and retryMore replays it", async () => {
    await answer(0);
    infiniteHits.showMore();
    await settle(new Error("network"));

    expect(ids(infiniteHits)).toEqual(["0a", "0b"]);
    expect(infiniteHits.getRenderState()).toMatchObject({
      failedMore: true,
      nbHits: 5,
    });
    infiniteHits.showMore();
    expect(transport).toHaveBeenCalledTimes(2);

    infiniteHits.retryMore();
    expect(requestedPage(2)).toBe(1);
    expect(infiniteHits.getRenderState()).toMatchObject({
      failedMore: false,
      loadingMore: true,
    });

    await answer(1);
    expect(ids(infiniteHits)).toEqual(["0a", "0b", "1a", "1b"]);
  });

  it("does not retry when nothing more failed", async () => {
    await settle(new Error("network"));

    infiniteHits.retryMore();

    expect(infiniteHits.getRenderState().failedMore).toBe(false);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "a new query",
      async (): Promise<void> => {
        controller.setSearchState({ [INDEX]: { query: "jupe" } });
        await vi.advanceTimersByTimeAsync(100);
      },
    ],
    [
      "other refinements",
      (): void => {
        controller.setSearchState({
          [INDEX]: { query: "robe", refinementList: { color: ["rouge"] } },
        });
      },
    ],
    [
      "a retry of page 0",
      async (): Promise<void> => {
        controller.setSearchState({ [INDEX]: { query: "robe", page: 0 } });
        await settle(new Error("network"));
        controller.retry();
      },
    ],
  ])(
    "drops the previous pages from the first frame of %s",
    async (_name, startOver) => {
      await answer(0);
      infiniteHits.showMore();
      await answer(1);
      const listener = vi.fn();
      infiniteHits.subscribe(listener);

      await startOver();

      expect(infiniteHits.getRenderState()).toMatchObject({
        hits: [],
        nbHits: undefined,
        loadingMore: false,
      });
      // No frame showed the previous pages while the new search loaded.
      expect(
        listener.mock.calls.every(([state]) => state.loadingMore === false),
      ).toBe(true);
      await answer(0, { query: "jupe", hits: [hit("new")] });
      expect(ids(infiniteHits)).toEqual(["new"]);
    },
  );
});

describe("connectInfiniteHits, AI mode", () => {
  beforeEach(() => connect("ai"));

  it("builds each display from the AI record: title, image, price range and handle link", async () => {
    const record = {
      objectID: "gid://shopify/Product/1",
      title: "Veste thermique",
      handle: "veste-thermique",
      imageUrl: "https://cdn.example.com/veste.png",
      priceRange: {
        min: { amount: "219", currencyCode: "EUR" },
        max: { amount: "249", currencyCode: "EUR" },
      },
    } as unknown as SearchProductHit;
    await answer(0, { hits: [record] });

    expect(infiniteHits.getRenderState().hits[0]).toMatchObject({
      hit: record,
      display: {
        title: "Veste thermique",
        href: `${window.location.origin}/products/veste-thermique`,
        image: { url: "https://cdn.example.com/veste.png", shape: "theme" },
        price: expect.stringMatching(/^219,00\s€\s–\s249,00\s€$/u),
      },
    });
  });

  it("prefers the record's own url and shows a single price once", async () => {
    const record = {
      objectID: "1",
      title: "Selle",
      url: "/fr/selle-sr2",
      priceRange: {
        min: { amount: 129, currencyCode: "EUR" },
        max: { amount: 129, currencyCode: "EUR" },
      },
    } as unknown as SearchProductHit;
    await answer(0, { hits: [record] });

    expect(infiniteHits.getRenderState().hits[0]?.display).toMatchObject({
      href: "/fr/selle-sr2",
      price: expect.stringMatching(/^129,00\s€$/u),
    });
  });
});
