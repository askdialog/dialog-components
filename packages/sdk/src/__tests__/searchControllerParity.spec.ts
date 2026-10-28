/* eslint max-lines: ["error", 300] */
// Deleted with the legacy controller (DEC-3614).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchController as createNewController } from "../search/createSearchController";
import { createSearchController as createLegacyController } from "../searchController";
import {
  SearchProductHit,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/search";
import { SearchControllerAnalytics } from "../types/searchController";

const INDEX = "products_fr_be";
const COLLECTIONS = "collections_fr_be";

type ObserverCallback = (
  entries: Array<Partial<IntersectionObserverEntry>>,
) => void;

type TraceEntry =
  | { request: SearchRequest }
  | { event: string; params: unknown }
  | { navigate: string };

/** What a scenario step does, written once per controller API. */
interface Driver {
  open(): void;
  type(query: string): void;
  goToPage(page: number): void;
  observeHit(element: Element, index: number): void;
  selectHit(index: number): void;
  close(): void;
}

interface Recorder {
  trace: TraceEntry[];
  transport: (request: SearchRequest) => Promise<SearchResponse>;
  analytics: SearchControllerAnalytics;
  navigate: (url: string) => void;
}

const observed = new Map<Element, ObserverCallback>();

const productHit = (id: number): SearchProductHit => ({
  objectID: `v${id}`,
  id,
  handle: `product-${id}`,
  // The first hit has no link, so its URL comes from `buildProductUrl`.
  url: id % 10 === 1 ? undefined : `https://shop.example/p${id}`,
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
});

const resultFor = (
  index: string,
  { query, page = 0, hitsPerPage = 12 }: SearchRequest["requests"][number],
  queryID: string,
): SearchResult => ({
  index,
  hits:
    index === INDEX
      ? [productHit((page + 1) * 10 + 1), productHit((page + 1) * 10 + 2)]
      : [],
  nbHits: index === INDEX ? 30 : 0,
  page,
  nbPages: index === INDEX ? 3 : 0,
  hitsPerPage,
  processingTimeMS: 1,
  query,
  queryID,
});

// Each controller gets its own query IDs; the trace compares them by order.
const record = (prefix: string): Recorder => {
  const trace: TraceEntry[] = [];
  let answered = 0;
  const track =
    (event: string) =>
    (params: unknown): void => {
      trace.push({ event, params });
    };

  return {
    trace,
    transport: (request) => {
      trace.push({ request });
      answered += 1;
      const queryID = `${prefix}-${answered}`;

      return Promise.resolve({
        results: request.requests.map((entry) =>
          resultFor(entry.indexName, entry, queryID),
        ),
      });
    },
    analytics: {
      surface: "autocomplete",
      trackOpenedSearch: track("open_search"),
      trackViewSearchResults: track("view_search_results"),
      trackSelectSearchResult: track("select_search_result"),
    },
    navigate: (url) => {
      trace.push({ navigate: url });
    },
  };
};

const CONTROLLER_OPTIONS = {
  language: "fr",
  country: "BE",
  sections: [{ index: "collections" as const, hitsPerPage: 4 }],
  buildProductUrl: (hit: SearchProductHit) => `/products/${hit.handle}`,
};

const legacyDriver = (recorder: Recorder): Driver => {
  const controller = createLegacyController({
    ...CONTROLLER_OPTIONS,
    search: recorder.transport,
    analytics: recorder.analytics,
    navigate: recorder.navigate,
  });

  return {
    open: () => controller.open(),
    type: (query) => controller.setQuery(query),
    goToPage: (page) => controller.setPage(page),
    observeHit: (element, index) => controller.observeResult(element, index),
    selectHit: (index) => controller.selectResult(index),
    close: () => controller.close(),
  };
};

const newDriver = (recorder: Recorder): Driver => {
  const controller = createNewController({
    ...CONTROLLER_OPTIONS,
    transport: recorder.transport,
    analytics: recorder.analytics,
    navigate: recorder.navigate,
  });
  const setEntry = (entry: { query?: string; page?: number }): void => {
    controller.setSearchState((state) => ({
      ...state,
      [INDEX]: { ...state[INDEX], ...entry },
    }));
  };

  return {
    open: () => controller.open(),
    type: (query) => setEntry({ query }),
    goToPage: (page) => setEntry({ page }),
    observeHit: (element, index) => controller.observeHit(element, index),
    selectHit: (index) => controller.selectHit(index),
    close: () => controller.close(),
  };
};

const show = (element: Element): void => {
  observed.get(element)?.([{ target: element, intersectionRatio: 1 }]);
};

// Open, query snowboard, page 2, select the first hit, close.
const runScenario = async (driver: Driver): Promise<void> => {
  driver.open();
  await vi.advanceTimersByTimeAsync(0);
  driver.type("snowboard");
  await vi.advanceTimersByTimeAsync(100);
  driver.goToPage(1);
  await vi.advanceTimersByTimeAsync(0);
  const first = {} as Element;
  const second = {} as Element;
  driver.observeHit(first, 0);
  driver.observeHit(second, 1);
  show(first);
  show(second);
  await vi.advanceTimersByTimeAsync(2000);
  driver.selectHit(0);
  driver.close();
  await vi.advanceTimersByTimeAsync(2000);
};

// Replace each query ID by the order it first appeared in.
const byOrder = (trace: TraceEntry[]): TraceEntry[] => {
  const order = new Map<string, string>();

  return JSON.parse(JSON.stringify(trace), (key, value: unknown) => {
    if (key !== "query_id" || typeof value !== "string") {
      return value;
    }
    if (!order.has(value)) {
      order.set(value, `query-${order.size + 1}`);
    }

    return order.get(value);
  }) as TraceEntry[];
};

const traceOf = async (
  prefix: string,
  driverFor: (recorder: Recorder) => Driver,
): Promise<TraceEntry[]> => {
  const recorder = record(prefix);
  await runScenario(driverFor(recorder));

  return byOrder(recorder.trace);
};

const request = (query: string, page: number): TraceEntry => ({
  request: {
    requests: [
      { indexName: INDEX, query, page, hitsPerPage: 12 },
      ...(query === ""
        ? []
        : [{ indexName: COLLECTIONS, query, page: 0, hitsPerPage: 4 }]),
    ],
  },
});

const envelope = {
  index: INDEX,
  surface: "autocomplete",
  search_type: "lexical",
  page: 2,
  total_hits: 30,
  query_length: 9,
};

// Both controllers must send and emit exactly this.
const EXPECTED: TraceEntry[] = [
  {
    event: "open_search",
    params: { surface: "autocomplete", search_type: "lexical" },
  },
  request("", 0),
  request("snowboard", 0),
  request("snowboard", 1),
  {
    event: "view_search_results",
    params: {
      ...envelope,
      query_id: "query-1",
      items: [
        { product_id: "21", position: 13 },
        { product_id: "22", position: 14 },
      ],
    },
  },
  {
    event: "select_search_result",
    params: {
      ...envelope,
      query_id: "query-1",
      items: [{ product_id: "21", position: 13 }],
    },
  },
  { navigate: "/products/product-21" },
];

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private readonly callback: ObserverCallback) {}
      observe = (element: Element): void => {
        observed.set(element, this.callback);
      };
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  observed.clear();
});

describe("legacy and new search controller parity", () => {
  it("send the same requests, emit the same events and navigate to the same URL", async () => {
    const legacy = await traceOf("legacy", legacyDriver);
    const next = await traceOf("new", newDriver);

    expect(next).toEqual(legacy);
    expect(legacy).toEqual(EXPECTED);
  });
});
