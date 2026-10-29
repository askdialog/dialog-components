/* eslint max-lines: ["error", 220] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import {
  SearchProductHit,
  SearchResponse,
  SearchResult,
} from "../types/search";

const INDEX = "products_fr_be";

type ObserverCallback = (
  entries: Array<Partial<IntersectionObserverEntry>>,
) => void;

let observerCallback: ObserverCallback;

const productHit = (id: number, url: string): SearchProductHit => ({
  objectID: `v${id}`,
  id,
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
  _display: { title: `P${id}`, url, price: "", lines: [] },
});

const answer = (overrides: Partial<SearchResult> = {}): SearchResponse => ({
  results: [
    {
      index: INDEX,
      hits: [
        productHit(101, "https://shop.example/p1"),
        productHit(102, "javascript:void(0)"),
      ],
      nbHits: 30,
      page: 1,
      nbPages: 3,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query: "shoes",
      queryID: "qid-1",
      ...overrides,
    },
  ],
});

const ENVELOPE = {
  query_id: "qid-1",
  index: INDEX,
  surface: "search_page",
  search_type: "lexical",
  page: 2,
  total_hits: 30,
  query_length: 5,
};

const transport = vi.fn<() => Promise<SearchResponse>>();
const trackViewSearchResults = vi.fn();
const trackSelectSearchResult = vi.fn();
const trackOpenedSearch = vi.fn();
const navigate = vi.fn();

const create = (): SearchController =>
  createSearchController({
    transport,
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults,
      trackSelectSearchResult,
      trackOpenedSearch,
    },
    navigate,
  });

const search = async (
  controller: SearchController,
  response = answer(),
): Promise<void> => {
  transport.mockResolvedValue(response);
  controller.setSearchState({ [INDEX]: { query: "shoes", page: 1 } });
  await vi.advanceTimersByTimeAsync(100);
};

const showFor = (target: Element, ms: number): void => {
  observerCallback([{ target, intersectionRatio: 0.5 }]);
  vi.advanceTimersByTime(ms);
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: ObserverCallback) {
        observerCallback = callback;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  vi.stubGlobal("window", {
    location: { href: "https://shop.example/", origin: "https://shop.example" },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("search controller hit tracking", () => {
  it("emits a view batch for hits half visible for 500 ms, once per query", async () => {
    const controller = create();
    await search(controller);
    const first = {} as Element;
    const second = {} as Element;
    controller.observeHit(first, 0);
    controller.observeHit(second, 1);

    showFor(first, 500);
    showFor(second, 499);
    observerCallback([{ target: second, intersectionRatio: 0 }]);
    showFor(first, 500);
    vi.advanceTimersByTime(1500);

    expect(trackViewSearchResults).toHaveBeenCalledTimes(1);
    expect(trackViewSearchResults).toHaveBeenCalledWith({
      ...ENVELOPE,
      items: [{ product_id: "101", position: 13 }],
    });
  });

  it("emits an empty view batch at once for zero hits", async () => {
    await search(create(), answer({ hits: [], nbHits: 0, nbPages: 0 }));

    expect(trackViewSearchResults).toHaveBeenCalledWith({
      ...ENVELOPE,
      total_hits: 0,
      items: [],
    });
  });

  it("emits the selection, then calls navigate and reports it ran", async () => {
    const controller = create();
    await search(controller);

    expect(controller.selectHit(0)).toBe(true);
    expect(trackSelectSearchResult).toHaveBeenCalledWith({
      ...ENVELOPE,
      items: [{ product_id: "101", position: 13 }],
    });
    expect(navigate).toHaveBeenCalledWith(
      "https://shop.example/p1",
      expect.objectContaining({ id: 101 }),
    );
  });

  it("reports navigate did not run when opted out or without a link", async () => {
    const controller = create();
    await search(controller);

    expect(controller.selectHit(0, { navigate: false })).toBe(false);
    expect(controller.selectHit(1)).toBe(false);
    expect(trackSelectSearchResult).toHaveBeenCalledTimes(2);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("ignores selection before any results", () => {
    expect(create().selectHit(0)).toBe(false);
    expect(trackSelectSearchResult).not.toHaveBeenCalled();
  });

  it("emits the search opened signal on open", () => {
    transport.mockResolvedValue(answer());
    create().open();

    expect(trackOpenedSearch).toHaveBeenCalledWith({
      surface: "search_page",
      search_type: "lexical",
    });
  });

  it("flushes qualified impressions on close", async () => {
    const controller = create();
    await search(controller);
    const element = {} as Element;
    controller.observeHit(element, 0);
    showFor(element, 500);

    controller.close();

    expect(trackViewSearchResults).toHaveBeenCalledWith({
      ...ENVELOPE,
      items: [{ product_id: "101", position: 13 }],
    });
  });
});
