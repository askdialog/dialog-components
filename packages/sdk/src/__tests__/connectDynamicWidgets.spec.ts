import { describe, expect, it, vi } from "vitest";
import { connectDynamicWidgets } from "../search/connectDynamicWidgets";
import { createSearchController } from "../search/createSearchController";
import { FilterableAttribute } from "../search/types";

const rendered = (
  filterableAttributes: readonly FilterableAttribute[],
): readonly string[] => {
  const controller = createSearchController({
    transport: vi.fn(),
    language: "fr",
    country: "BE",
    config: { searchConfig: { filterableAttributes } },
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
  });
  const widgets = connectDynamicWidgets(controller);
  const { attributesToRender } = widgets.getRenderState();
  widgets.dispose();
  controller.dispose();

  return attributesToRender;
};

const keyword = (
  key: string,
  values: string[] = ["a"],
  extra: Partial<FilterableAttribute> = {},
): FilterableAttribute => ({
  key,
  label: key,
  type: "keyword",
  values,
  ...extra,
});

describe("connectDynamicWidgets", () => {
  it("renders the keyword attributes with values in the config's order, then the price", () => {
    expect(
      rendered([
        { key: "price", label: "Prix", type: "number", values: [] },
        keyword("size"),
        { key: "in_stock", label: "En stock", type: "boolean", values: [] },
        keyword("material", []),
        { key: "weight", label: "Poids", type: "number", values: [] },
        { key: "released", label: "Sortie", type: "date", values: [] },
        keyword("color"),
      ]),
    ).toEqual(["size", "color", "price"]);
  });

  it("leaves out an attribute the merchant hides from the search page", () => {
    expect(
      rendered([
        keyword("size", ["S"], { showInSearch: false }),
        keyword("color", ["red"], { showInSearch: true }),
        {
          key: "price",
          label: "Prix",
          type: "number",
          values: [],
          showInSearch: false,
        },
      ]),
    ).toEqual(["color"]);
  });

  it("renders no price declared otherwise than as a number", () => {
    expect(rendered([keyword("price", []), keyword("color")])).toEqual([
      "color",
    ]);
  });
});
