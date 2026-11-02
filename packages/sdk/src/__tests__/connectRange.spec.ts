// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectRange,
  parseRangeField,
  RangeConnector,
} from "../search/connectRange";
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

const INDEX = "products_fr_be";

const rangeOf = (controller: SearchController) =>
  controller.getSnapshot().searchState[INDEX].range;

describe("parseRangeField", () => {
  it("reads a number, a comma as the decimal separator, and nothing else", () => {
    expect(parseRangeField(" 12 ")).toBe(12);
    expect(parseRangeField("9,5")).toBe(9.5);
    expect(parseRangeField("")).toBeUndefined();
    expect(parseRangeField("abc")).toBeUndefined();
  });
});

describe("connectRange", () => {
  let controller: SearchController;
  let price: RangeConnector;

  beforeEach(() => {
    controller = createSearchController({
      transport: vi.fn(() => new Promise<SearchResponse>(() => undefined)),
      language: "fr",
      country: "BE",
      initialSearchState: {
        [INDEX]: { query: "shoes", range: { price: "10:50", weight: "1:" } },
      },
      analytics: {
        surface: "search_page",
        trackViewSearchResults: vi.fn(),
        trackSelectSearchResult: vi.fn(),
      },
    });
    price = connectRange(controller, { attribute: "price" });
  });

  afterEach(() => {
    price.dispose();
    controller.dispose();
  });

  it("shows the search state's bounds as the fields", () => {
    expect(price.getRenderState()).toEqual({
      attribute: "price",
      min: "10",
      max: "50",
      minAboveMax: false,
    });
  });

  it("writes the fields' bounds to range, an empty field removing its bound", () => {
    price.refine("20", "80");
    expect(rangeOf(controller)).toEqual({ price: "20:80", weight: "1:" });

    price.refine("", "80");
    expect(rangeOf(controller)).toEqual({ price: ":80", weight: "1:" });

    price.refine("20", "");
    expect(rangeOf(controller)).toEqual({ price: "20:", weight: "1:" });

    price.refine("", "");
    expect(rangeOf(controller)).toEqual({ weight: "1:" });
  });

  it("drops range once its last attribute has no bound", () => {
    connectRange(controller, { attribute: "weight" }).refine("", "");
    price.refine(" ", "");

    expect(rangeOf(controller)).toBeUndefined();
  });

  it("keeps the fields as typed", () => {
    price.refine("9,", "abc");

    expect(rangeOf(controller)).toEqual({ price: "9:", weight: "1:" });
    expect(price.getRenderState()).toMatchObject({ min: "9,", max: "abc" });
  });

  it("shows a floor above the ceiling as an error, leaving the search state unchanged", () => {
    const listener = vi.fn();
    price.subscribe(listener);

    price.refine("80", "20");

    expect(rangeOf(controller)).toEqual({ price: "10:50", weight: "1:" });
    expect(listener).toHaveBeenLastCalledWith({
      attribute: "price",
      min: "80",
      max: "20",
      minAboveMax: true,
    });

    price.refine("8", "20");
    expect(price.getRenderState().minAboveMax).toBe(false);
    expect(rangeOf(controller)).toEqual({ price: "8:20", weight: "1:" });
  });

  it("shows the search state again once its bounds change elsewhere", () => {
    price.refine("80", "20");
    controller.setSearchState({ [INDEX]: { query: "shoes" } });

    expect(price.getRenderState()).toMatchObject({
      min: "",
      max: "",
      minAboveMax: false,
    });
  });

  it("clears an error typed with no bounds once the search state changes", () => {
    price.refine("", "");
    price.refine("80", "20");
    expect(price.getRenderState().minAboveMax).toBe(true);

    controller.close();

    expect(price.getRenderState()).toMatchObject({
      min: "",
      max: "",
      minAboveMax: false,
    });
  });
});
