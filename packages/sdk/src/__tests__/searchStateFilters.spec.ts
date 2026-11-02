import { describe, expect, it } from "vitest";
import { FilterableAttribute } from "../search/types";
import { SearchFilters } from "../types/searchFilters";
import { productsQuery } from "../utils/searchFilters";
import { searchStateFilters } from "../utils/searchStateFilters";

const attribute = (
  key: string,
  type: FilterableAttribute["type"],
): FilterableAttribute => ({ key, label: key, type, values: [] });

const ATTRIBUTES = [
  attribute("color", "keyword"),
  attribute("size", "keyword"),
  attribute("in_stock", "boolean"),
  attribute("price", "number"),
  attribute("weight", "number"),
];

const filters = (part: Partial<SearchFilters>): SearchFilters => ({
  facetFilters: [],
  numericFilters: [],
  ...part,
});

describe("filters as search state refinements", () => {
  it("lists the values a group picks on a keyword or boolean attribute", () => {
    expect(
      searchStateFilters(
        filters({
          facetFilters: [
            [
              { attribute: "color", value: "red" },
              { attribute: "color", value: "blue" },
            ],
            [{ attribute: "in_stock", value: "true" }],
          ],
        }),
        ATTRIBUTES,
      ),
    ).toEqual({
      refinementList: { color: ["red", "blue"], in_stock: ["true"] },
      range: undefined,
      filters: undefined,
    });
  });

  it("keeps as filters an exclusion, a mix of attributes, two groups on one attribute and an unknown attribute", () => {
    const raw = [
      [{ attribute: "color", value: "red", negated: true }],
      [
        { attribute: "color", value: "red" },
        { attribute: "size", value: "M" },
      ],
      [{ attribute: "size", value: "M" }],
      [{ attribute: "size", value: "L" }],
      [{ attribute: "brand", value: "Acme" }],
    ];

    expect(
      searchStateFilters(filters({ facetFilters: raw }), ATTRIBUTES),
    ).toEqual({
      refinementList: undefined,
      range: undefined,
      filters: { facetFilters: raw, numericFilters: [] },
    });
  });

  it("writes inclusive bounds on a number attribute as its range", () => {
    expect(
      searchStateFilters(
        filters({
          numericFilters: [
            [{ attribute: "price", operator: ">=", value: 10 }],
            [{ attribute: "price", operator: "<=", value: 50 }],
            [{ attribute: "weight", from: 1, to: 2 }],
          ],
        }),
        ATTRIBUTES,
      ).range,
    ).toEqual({ price: "10:50", weight: "1:2" });
  });

  it("keeps as filters a strict or exact bound, a side set twice, a group of two and a non-number attribute", () => {
    const raw = [
      [{ attribute: "price", operator: "<" as const, value: 50 }],
      [{ attribute: "price", operator: "=" as const, value: 50 }],
      [{ attribute: "weight", operator: "<=" as const, value: 9 }],
      [
        { attribute: "price", operator: ">=" as const, value: 1 },
        { attribute: "weight", operator: ">=" as const, value: 1 },
      ],
      [{ attribute: "color", operator: ">=" as const, value: 1 }],
    ];
    const result = searchStateFilters(
      filters({
        numericFilters: [
          [{ attribute: "weight", operator: "<=", value: 5 }],
          ...raw,
        ],
      }),
      ATTRIBUTES,
    );

    expect(result.range).toEqual({ weight: ":5" });
    expect(result.filters?.numericFilters).toEqual(raw);
  });

  it("keeps everything as filters before the search config loads", () => {
    const all = filters({
      facetFilters: [[{ attribute: "color", value: "red" }]],
      numericFilters: [[{ attribute: "price", from: 1, to: 2 }]],
    });

    expect(searchStateFilters(all, [])).toEqual({
      refinementList: undefined,
      range: undefined,
      filters: all,
    });
  });

  it("sends the filters it was given", () => {
    const given = filters({
      facetFilters: [
        [{ attribute: "color", value: "red", negated: true }],
        [{ attribute: "size", value: "M" }],
      ],
      numericFilters: [
        [{ attribute: "price", from: 10, to: 50 }],
        [{ attribute: "weight", operator: ">", value: 1 }],
      ],
    });
    const sent = productsQuery(
      { query: "", page: 0, ...searchStateFilters(given, ATTRIBUTES) },
      ATTRIBUTES,
    );

    expect(sent.facetFilters).toEqual(given.facetFilters);
    expect(sent.numericFilters).toEqual([
      [{ attribute: "weight", operator: ">", value: 1 }],
      [{ attribute: "price", from: 10, to: 50 }],
    ]);
  });
});
