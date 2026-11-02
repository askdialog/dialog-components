// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectRefinementList,
  RefinementListConnector,
} from "../search/connectRefinementList";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import {
  SearchOptions,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/search";
import { SearchFilterBlock } from "../types/aiSearch";

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

const result = (filters?: SearchFilterBlock[]): SearchResult => ({
  index: INDEX,
  hits: [],
  nbHits: 0,
  page: 0,
  nbPages: 0,
  hitsPerPage: 12,
  processingTimeMS: 1,
  query: "red shoes",
  queryID: "qid",
  filters,
});

const detected = (
  facetFilters: SearchFilterBlock["facetFilters"],
): SearchFilterBlock => ({
  source: "query_constructor",
  facetFilters,
  numericFilters: [],
});

const transport =
  vi.fn<
    (req: SearchRequest, opts?: SearchOptions) => Promise<SearchResponse>
  >();

const checked = (list: RefinementListConnector): string[] =>
  list
    .getRenderState()
    .items.filter((item) => item.isRefined)
    .map((item) => item.value);

const refinementListOf = (controller: SearchController) =>
  controller.getSnapshot().searchState[INDEX].refinementList;

describe("connectRefinementList", () => {
  let controller: SearchController;
  let colors: RefinementListConnector;

  const search = async (filters?: SearchFilterBlock[]): Promise<void> => {
    transport.mockResolvedValueOnce({ results: [result(filters)] });
    controller.search();
    await vi.advanceTimersByTimeAsync(0);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    controller = createSearchController({
      transport,
      language: "fr",
      country: "BE",
      config: {
        searchConfig: {
          filterableAttributes: [
            {
              key: "color",
              label: "Couleur",
              type: "keyword",
              values: ["red", "blue", "green"],
            },
          ],
        },
      },
      analytics: {
        surface: "search_page",
        trackViewSearchResults: vi.fn(),
        trackSelectSearchResult: vi.fn(),
      },
    });
    colors = connectRefinementList(controller, { attribute: "color" });
  });

  afterEach(() => {
    colors.dispose();
    controller.dispose();
    transport.mockReset();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("lists the search config's values with its label, none checked", () => {
    expect(colors.getRenderState()).toEqual({
      attribute: "color",
      label: "Couleur",
      items: [
        { value: "red", isRefined: false },
        { value: "blue", isRefined: false },
        { value: "green", isRefined: false },
      ],
    });
  });

  it("lists nothing for an attribute the search config does not declare", () => {
    const sizes = connectRefinementList(controller, { attribute: "size" });

    expect(sizes.getRenderState()).toEqual({
      attribute: "size",
      label: "size",
      items: [],
    });
    sizes.dispose();
  });

  it("toggles a value in the search state's refinementList", () => {
    colors.refine("red");
    colors.refine("blue");
    expect(refinementListOf(controller)).toEqual({ color: ["red", "blue"] });
    expect(checked(colors)).toEqual(["red", "blue"]);

    colors.refine("red");
    expect(refinementListOf(controller)).toEqual({ color: ["blue"] });

    colors.refine("blue");
    expect(refinementListOf(controller)).toBeUndefined();
    expect(checked(colors)).toEqual([]);
  });

  it("checks the values the engine detected while the visitor picked none", async () => {
    await search([
      detected([
        [
          { attribute: "color", value: "red" },
          { attribute: "color", value: "green" },
        ],
      ]),
    ]);

    expect(checked(colors)).toEqual(["red", "green"]);
  });

  it("ignores a detected exclusion, a mix of attributes and the visitor's own block", async () => {
    await search([
      detected([
        [{ attribute: "color", value: "red", negated: true }],
        [
          { attribute: "color", value: "blue" },
          { attribute: "size", value: "42" },
        ],
      ]),
      {
        source: "user",
        facetFilters: [[{ attribute: "color", value: "green" }]],
        numericFilters: [],
      },
    ]);

    expect(checked(colors)).toEqual([]);
  });

  it("checks the visitor's values over the detected ones, and toggles from what is shown", async () => {
    await search([detected([[{ attribute: "color", value: "red" }]])]);

    colors.refine("blue");
    expect(refinementListOf(controller)).toEqual({ color: ["red", "blue"] });

    colors.refine("red");
    expect(checked(colors)).toEqual(["blue"]);
  });

  it("unchecks a detected value by keeping the attribute empty", async () => {
    await search([detected([[{ attribute: "color", value: "red" }]])]);

    colors.refine("red");

    expect(refinementListOf(controller)).toEqual({ color: [] });
    expect(checked(colors)).toEqual([]);
  });
});
