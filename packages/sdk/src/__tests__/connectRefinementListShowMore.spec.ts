// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectRefinementList,
  RefinementListConnector,
} from "../search/connectRefinementList";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";

describe("connectRefinementList's fold", () => {
  const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  let controller: SearchController;

  const sizes = (limit: number | undefined) =>
    connectRefinementList(controller, { attribute: "size", limit });
  const shown = (list: RefinementListConnector): string[] =>
    list.getRenderState().items.map((item) => item.value);

  beforeEach(() => {
    controller = createSearchController({
      transport: vi.fn(),
      language: "fr",
      country: "BE",
      config: {
        searchConfig: {
          filterableAttributes: [
            { key: "size", label: "Taille", type: "keyword", values: SIZES },
          ],
        },
      },
      analytics: {
        surface: "search_page",
        trackViewSearchResults: vi.fn(),
        trackSelectSearchResult: vi.fn(),
      },
    });
  });

  afterEach(() => {
    controller.dispose();
  });

  it("shows the first `limit` values, then every value once unfolded", () => {
    const list = sizes(3);
    expect(list.getRenderState()).toMatchObject({
      isShowingMore: false,
      canToggleShowMore: true,
      foldedCount: 4,
    });
    expect(shown(list)).toEqual(["XS", "S", "M"]);

    list.toggleShowMore();
    expect(shown(list)).toEqual(SIZES);
    expect(list.getRenderState()).toMatchObject({
      isShowingMore: true,
      canToggleShowMore: true,
    });

    list.toggleShowMore();
    expect(shown(list)).toEqual(["XS", "S", "M"]);
  });

  it("keeps a checked value further down in its place while folded", () => {
    const list = sizes(3);
    list.refine("XL");

    expect(shown(list)).toEqual(["XS", "S", "M", "XL"]);
    expect(list.getRenderState().foldedCount).toBe(3);
  });

  it("shows every value when the fold would hide fewer than 2", () => {
    const list = sizes(6);
    expect(shown(list)).toEqual(SIZES);
    expect(list.getRenderState().canToggleShowMore).toBe(false);

    list.toggleShowMore();
    expect(list.getRenderState().isShowingMore).toBe(false);

    const five = sizes(5);
    expect(shown(five)).toHaveLength(5);
    five.refine("XXL");
    expect(shown(five)).toEqual(SIZES);
  });

  it("shows every value without a limit", () => {
    expect(shown(sizes(undefined))).toEqual(SIZES);
  });
});
