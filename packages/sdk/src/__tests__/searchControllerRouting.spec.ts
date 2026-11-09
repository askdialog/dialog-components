// @vitest-environment jsdom
/* eslint max-lines: ["error", 320] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchController } from "../search/createSearchController";
import {
  IndexSearchState,
  SearchController,
  SearchControllerOptions,
} from "../search/types";
import { SearchRequest, SearchResponse } from "../types/search";

const INDEX = "products_fr_be";

const ATTRIBUTES = [
  { key: "color", label: "Couleur", type: "keyword", values: ["Rouge"] },
  { key: "price", label: "Prix", type: "number", values: [] },
] as const;

const answer: SearchResponse = {
  results: [
    {
      index: INDEX,
      hits: [],
      nbHits: 40,
      page: 0,
      nbPages: 4,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query: "",
      queryID: "qid",
    },
  ],
};

const transport = vi.fn<(request: SearchRequest) => Promise<SearchResponse>>(
  () => Promise.resolve(answer),
);
const fetchMock = vi.fn<typeof fetch>();
let apiKey = 0;
const controllers: SearchController[] = [];

const create = (
  options: Partial<SearchControllerOptions> = {},
): SearchController => {
  const controller = createSearchController({
    transport,
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    config: { searchConfig: { filterableAttributes: ATTRIBUTES } },
    routing: true,
    ...options,
  });
  controllers.push(controller);

  return controller;
};

const visit = (url: string): void => {
  window.history.replaceState(null, "", url);
};

const entry = (controller: SearchController): IndexSearchState | undefined =>
  controller.getSnapshot().searchState[INDEX];

const setEntry = (
  controller: SearchController,
  change: Partial<IndexSearchState>,
): void => {
  controller.setSearchState((searchState) => ({
    ...searchState,
    // The controller keeps the products entry present.
    [INDEX]: { ...searchState[INDEX], ...change },
  }));
};

const params = (): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  for (const [name, value] of new URLSearchParams(window.location.search)) {
    result[name] = [...(result[name] ?? []), value];
  }

  return result;
};

const lastQuery = (): SearchRequest["requests"][number] | undefined =>
  transport.mock.lastCall?.[0].requests[0];

let pushState: ReturnType<typeof vi.spyOn>;
let replaceState: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  apiKey += 1;
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  visit("/search?q=chemise&page=3&f.color=Rouge&price=10:50&utm_source=mail");
  pushState = vi.spyOn(window.history, "pushState");
  replaceState = vi.spyOn(window.history, "replaceState");
});

afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("search controller routing", () => {
  it("starts from the URL and searches it without writing it", async () => {
    const controller = create();
    expect(entry(controller)).toEqual({
      query: "chemise",
      page: 2,
      refinementList: { color: ["Rouge"] },
      range: { price: "10:50" },
    });

    controller.search();
    await vi.runAllTimersAsync();

    expect(lastQuery()).toMatchObject({
      query: "chemise",
      page: 2,
      facetFilters: [[{ attribute: "color", value: "Rouge" }]],
      numericFilters: [[{ attribute: "price", from: 10, to: 50 }]],
    });
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("pushes a filter change, back on page 1, keeping the other params", async () => {
    const controller = create();
    setEntry(controller, {
      refinementList: { color: ["Rouge", "Bleu"] },
    });
    await vi.runAllTimersAsync();

    expect(pushState).toHaveBeenCalledTimes(1);
    expect(replaceState).not.toHaveBeenCalled();
    expect(params()).toEqual({
      q: ["chemise"],
      utm_source: ["mail"],
      "f.color": ["Rouge", "Bleu"],
      price: ["10:50"],
    });
  });

  it("pushes a page change, 1-indexed", async () => {
    const controller = create();
    setEntry(controller, { page: 3 });
    await vi.runAllTimersAsync();

    expect(pushState).toHaveBeenCalledTimes(1);
    expect(params().page).toEqual(["4"]);
  });

  it("replaces the URL on a query change once its debounce runs out", async () => {
    const controller = create();
    setEntry(controller, { query: "robe " });
    expect(replaceState).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();

    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(pushState).not.toHaveBeenCalled();
    expect(params()).toEqual({
      q: ["robe"],
      utm_source: ["mail"],
      "f.color": ["Rouge"],
      price: ["10:50"],
    });
  });

  it("restores the query, the filters and the page on back and forward, pushing nothing", async () => {
    const controller = create();
    controller.search();
    await vi.runAllTimersAsync();
    transport.mockClear();

    visit("/search?q=robe&page=2&f.color=Bleu");
    replaceState.mockClear();
    window.dispatchEvent(new PopStateEvent("popstate"));
    await vi.runAllTimersAsync();

    expect(entry(controller)).toEqual({
      query: "robe",
      page: 1,
      refinementList: { color: ["Bleu"] },
      range: undefined,
    });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(lastQuery()).toMatchObject({ query: "robe", page: 1 });
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("ignores an attribute the config does not declare and a malformed price", async () => {
    visit("/search?q=chemise&f.size=M&f.color=Rouge&price=50:10");
    replaceState.mockClear();
    const controller = create();
    expect(entry(controller)).toEqual({
      query: "chemise",
      page: 0,
      refinementList: { color: ["Rouge"] },
      range: undefined,
    });

    controller.search();
    await vi.runAllTimersAsync();
    expect(pushState).not.toHaveBeenCalled();

    setEntry(controller, { refinementList: { color: ["Bleu"] } });
    await vi.runAllTimersAsync();
    expect(params()).toEqual({ q: ["chemise"], "f.color": ["Bleu"] });
  });

  it("keeps the URL's refinements until the loaded config declares them", async () => {
    fetchMock.mockImplementation((url) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            String(url).includes("/public/search/config")
              ? { filterableAttributes: ATTRIBUTES }
              : {},
          ),
        ),
      ),
    );
    visit("/search?q=chemise&f.size=M&f.color=Rouge");
    const controller = create({ config: undefined, apiKey: `pk_${apiKey}` });
    expect(entry(controller)?.refinementList).toEqual({
      size: ["M"],
      color: ["Rouge"],
    });

    controller.search();
    await vi.runAllTimersAsync();

    expect(entry(controller)?.refinementList).toEqual({ color: ["Rouge"] });
    expect(lastQuery()).toMatchObject({
      facetFilters: [[{ attribute: "color", value: "Rouge" }]],
    });
  });

  it("writes and reads another URL format", async () => {
    visit("/search/chemise?colors=Rouge,Bleu");
    const controller = create({
      routing: {
        createURL: ({ routeState }) =>
          `/search/${encodeURIComponent(routeState.query)}?colors=${(routeState.refinementList?.color ?? []).join(",")}`,
        parseURL: ({ location }) => ({
          query: decodeURIComponent(location.pathname.split("/")[2] ?? ""),
          page: 0,
          refinementList: {
            color:
              new URLSearchParams(location.search).get("colors")?.split(",") ??
              [],
          },
        }),
      },
    });
    expect(entry(controller)).toMatchObject({
      query: "chemise",
      refinementList: { color: ["Rouge", "Bleu"] },
    });

    setEntry(controller, { refinementList: { color: ["Vert"] } });
    await vi.runAllTimersAsync();

    expect(pushState).toHaveBeenCalledTimes(1);
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      "/search/chemise?colors=Vert",
    );
  });

  it("leaves the URL alone without routing or once disposed", async () => {
    const controller = create({ routing: undefined });
    expect(entry(controller)).toEqual({ query: "", page: 0 });
    setEntry(controller, {
      query: "robe",
      refinementList: { color: ["Bleu"] },
    });
    await vi.runAllTimersAsync();

    const routed = create();
    routed.dispose();
    transport.mockClear();
    visit("/search?q=robe");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await vi.runAllTimersAsync();

    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalledTimes(1); // The visit.
    expect(entry(routed)?.query).toBe("chemise");
    expect(transport).not.toHaveBeenCalled();
  });
});
