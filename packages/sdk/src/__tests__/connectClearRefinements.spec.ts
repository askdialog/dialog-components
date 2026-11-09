// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ClearRefinementsConnector,
  connectClearRefinements,
} from "../search/connectClearRefinements";
import { createSearchController } from "../search/createSearchController";
import { SearchController, SearchState } from "../search/types";
import { SearchResponse } from "../types/search";

const INDEX = "products_fr_be";

describe("connectClearRefinements", () => {
  let controller: SearchController;
  let clear: ClearRefinementsConnector;

  const create = (initialSearchState: SearchState): void => {
    controller = createSearchController({
      transport: vi.fn(() => new Promise<SearchResponse>(() => undefined)),
      language: "fr",
      country: "BE",
      initialSearchState,
      config: {
        searchConfig: {
          filterableAttributes: [
            {
              key: "color",
              label: "Couleur",
              type: "keyword",
              values: ["red"],
            },
            { key: "price", label: "Prix", type: "number", values: [] },
          ],
        },
      },
      analytics: {
        surface: "search_page",
        trackViewSearchResults: vi.fn(),
        trackSelectSearchResult: vi.fn(),
      },
    });
    clear = connectClearRefinements(controller);
  };

  afterEach(() => {
    clear.dispose();
    controller.dispose();
  });

  it("cannot refine without a value or a bound the request sends", () => {
    create({
      [INDEX]: {
        query: "shirt",
        refinementList: { color: [], material: ["linen"] },
        filters: {
          facetFilters: [[{ attribute: "color", value: "blue" }]],
          numericFilters: [],
        },
      },
    });

    expect(clear.getRenderState().canRefine).toBe(false);
  });

  it.each([
    [{ refinementList: { color: ["red"] } }],
    [{ range: { price: "10:" as const } }],
  ])("can refine with a visitor refinement %o", (refinements) => {
    create({ [INDEX]: { query: "shirt", ...refinements } });

    expect(clear.getRenderState().canRefine).toBe(true);
  });

  it("removes every refinement list and range in one change, keeping the query", () => {
    const filters = {
      facetFilters: [[{ attribute: "color", value: "blue" }]],
      numericFilters: [],
    };
    create({
      [INDEX]: {
        query: "shirt",
        page: 2,
        refinementList: { color: ["red"] },
        range: { price: "10:20" },
        filters,
      },
    });
    const setSearchState = vi.spyOn(controller, "setSearchState");

    clear.refine();

    expect(setSearchState).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().searchState[INDEX]).toEqual({
      query: "shirt",
      page: 0,
      refinementList: undefined,
      range: undefined,
      filters,
    });
    expect(clear.getRenderState().canRefine).toBe(false);
  });
});
