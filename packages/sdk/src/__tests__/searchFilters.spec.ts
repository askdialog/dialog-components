import { describe, expect, it } from "vitest";
import { applySearchState } from "../search/searchState";
import { FilterableAttribute, IndexSearchState } from "../search/types";
import { SearchFilters } from "../types/searchFilters";
import { productsQuery } from "../utils/searchFilters";
import { buildSearchRequest } from "../utils/searchRequests";

const INDEX = "products_fr_be";

const attribute = (
  key: string,
  type: FilterableAttribute["type"],
): FilterableAttribute => ({ key, label: key, type, values: [] });

const ATTRIBUTES = [
  attribute("color", "keyword"),
  attribute("size", "keyword"),
  attribute("in_stock", "boolean"),
  attribute("price", "number"),
];

const query = (entry: Omit<IndexSearchState, "query">) =>
  productsQuery({ query: "shoes", page: 0, ...entry }, ATTRIBUTES);

describe("products filters", () => {
  it("sends no filters when none is set", () => {
    expect(query({})).toEqual({ query: "shoes", page: 0 });
  });

  it("ORs the values of an attribute and ANDs the attributes", () => {
    expect(
      query({
        refinementList: { color: ["red", "blue"], in_stock: ["true"] },
      }).facetFilters,
    ).toEqual([
      [
        { attribute: "color", value: "red" },
        { attribute: "color", value: "blue" },
      ],
      [{ attribute: "in_stock", value: "true" }],
    ]);
  });

  it("skips an attribute left without values", () => {
    expect(query({ refinementList: { color: [] } })).toEqual({
      query: "shoes",
      page: 0,
    });
  });

  it("sends a range's bounds inclusive, a floor or a ceiling alone", () => {
    expect(query({ range: { price: "10:50" } }).numericFilters).toEqual([
      [{ attribute: "price", from: 10, to: 50 }],
    ]);
    expect(query({ range: { price: "10:" } }).numericFilters).toEqual([
      [{ attribute: "price", operator: ">=", value: 10 }],
    ]);
    expect(query({ range: { price: ":50" } }).numericFilters).toEqual([
      [{ attribute: "price", operator: "<=", value: 50 }],
    ]);
    expect(query({ range: { price: ":" } })).toEqual({
      query: "shoes",
      page: 0,
    });
  });

  it("keeps a floor above the ceiling, which matches nothing", () => {
    expect(query({ range: { price: "50:10" } }).numericFilters).toEqual([
      [{ attribute: "price", operator: ">=", value: 50 }],
      [{ attribute: "price", operator: "<=", value: 10 }],
    ]);
  });

  it("drops an attribute the search config does not declare with the refinement's type", () => {
    expect(
      query({
        refinementList: { material: ["wool"], price: ["10"] },
        range: { weight: "1:2", color: "1:2" },
      }),
    ).toEqual({ query: "shoes", page: 0 });
  });

  it("sends raw filters as they are, before the refinements", () => {
    const filters: SearchFilters = {
      facetFilters: [
        [{ attribute: "color", value: "red", negated: true }],
        [
          { attribute: "color", value: "blue" },
          { attribute: "size", value: "M" },
        ],
      ],
      numericFilters: [[{ attribute: "price", operator: "<", value: 30 }]],
    };

    expect(
      query({
        filters,
        refinementList: { size: ["L"] },
        range: { price: "5:" },
      }),
    ).toEqual({
      query: "shoes",
      page: 0,
      facetFilters: [
        ...filters.facetFilters,
        [{ attribute: "size", value: "L" }],
      ],
      numericFilters: [
        ...filters.numericFilters,
        [{ attribute: "price", operator: ">=", value: 5 }],
      ],
    });
  });

  it("never filters the sections", () => {
    const request = buildSearchRequest(
      query({ refinementList: { color: ["red"] }, range: { price: "1:2" } }),
      [{ index: "collections" }],
      { indexName: INDEX, language: "fr", country: "BE", hitsPerPage: 12 },
    );

    expect(request.requests[1]).toEqual({
      indexName: "collections_fr_be",
      query: "shoes",
      page: 0,
      hitsPerPage: 12,
    });
  });

  it.each<[string, Partial<IndexSearchState>]>([
    ["refinementList", { refinementList: { color: ["red"] } }],
    ["range", { range: { price: "10:" } }],
    ["filters", { filters: { facetFilters: [], numericFilters: [] } }],
  ])("resets the page when %s changes", (_name, change) => {
    const previous = { [INDEX]: { query: "shoes", page: 3 } };

    expect(
      applySearchState(previous, { [INDEX]: { ...previous[INDEX], ...change } })[
        INDEX
      ].page,
    ).toBe(0);
  });
});
