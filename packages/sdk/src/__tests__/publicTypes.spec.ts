// Compile-time contract of the public API: these assertions are checked by
// `tsc` (test-type), the runtime test only anchors the file in the suite.
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  CartSnapshot,
  Dialog,
  DialogCallbacks,
  DialogConstructor,
  DialogSearchError,
  RangeRenderState,
  RefinementListItem,
  SearchArticleHit,
  SearchCollectionHit,
  SearchControllerOptions,
  SearchFacetsFunction,
  SearchFacetsRequest,
  SearchFacetsResponse,
  SearchFacetStats,
  searchLexicalFacets,
  SearchOptions,
  SearchPageHit,
  SearchProductHit,
  SearchQuerySuggestionHit,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SearchResults,
} from "../index";

describe("public API types", () => {
  it("accepts construction with and without commerce callbacks", () => {
    expectTypeOf<{
      apiKey: string;
      locale: string;
      currency: string;
    }>().toMatchTypeOf<DialogConstructor>();

    expectTypeOf<{
      apiKey: string;
      locale: string;
      currency: string;
      callbacks: DialogCallbacks;
    }>().toMatchTypeOf<DialogConstructor>();

    // Invalid callback values must be rejected.
    expectTypeOf<{
      apiKey: string;
      locale: string;
      currency: string;
      callbacks: { addToCart: string; getProduct: number };
    }>().not.toMatchTypeOf<DialogConstructor>();

    expectTypeOf<{
      addToCart: (input: {
        productId: string;
        quantity: number;
      }) => Promise<void>;
      getProduct: (productId: string) => Promise<never>;
    }>().toMatchTypeOf<DialogCallbacks>();
    expectTypeOf<
      NonNullable<DialogCallbacks["changeCartQuantity"]>
    >().parameters.toMatchTypeOf<
      [{ productId: string; variantId?: string; quantity: number }]
    >();
    expectTypeOf<
      NonNullable<DialogCallbacks["getCart"]>
    >().returns.toEqualTypeOf<Promise<CartSnapshot | null>>();
    expectTypeOf<CartSnapshot>().toEqualTypeOf<{
      lines: {
        productId: string;
        variantId: string;
        quantity: number;
        unitPrice: number;
      }[];
      totalAmount: number;
      currency: string;
    }>();

    expectTypeOf<Dialog["currency"]>().toEqualTypeOf<string>();

    expectTypeOf<Dialog["search"]>().parameters.toMatchTypeOf<
      [SearchRequest, (SearchOptions | undefined)?]
    >();

    expectTypeOf<{
      requests: [{ indexName: string; query: string }];
    }>().toMatchTypeOf<SearchRequest>();
    expectTypeOf<{
      requests: [
        {
          indexName: string;
          query: string;
          page: number;
          hitsPerPage: number;
        },
      ];
    }>().toMatchTypeOf<SearchRequest>();
    expectTypeOf<
      Dialog["search"]
    >().returns.resolves.toEqualTypeOf<SearchResponse>();

    expectTypeOf<SearchResponse["results"]>().toEqualTypeOf<SearchResult[]>();
    expectTypeOf<SearchResult["hits"]>().toEqualTypeOf<
      (
        | SearchProductHit
        | SearchCollectionHit
        | SearchArticleHit
        | SearchPageHit
        | SearchQuerySuggestionHit
      )[]
    >();
    expectTypeOf<
      NonNullable<SearchResults["products"]>["hits"]
    >().toEqualTypeOf<SearchProductHit[]>();
    expectTypeOf<SearchProductHit["objectID"]>().toEqualTypeOf<string>();
    expectTypeOf<SearchProductHit["id"]>().toEqualTypeOf<number | string>();
    expectTypeOf<SearchProductHit["variants_min_price"]>().toEqualTypeOf<
      number | undefined
    >();
    expectTypeOf<SearchProductHit["options"]>().toEqualTypeOf<
      Record<string, string>
    >();
    expectTypeOf<
      SearchProductHit["inventory_available"]
    >().toEqualTypeOf<boolean>();
    expectTypeOf<SearchResult["queryID"]>().toEqualTypeOf<string>();
    expectTypeOf<
      NonNullable<SearchResults["sections"]>["collections"]
    >().toEqualTypeOf<SearchResult<SearchCollectionHit> | undefined>();
    expectTypeOf<
      NonNullable<SearchResults["sections"]>["articles"]
    >().toEqualTypeOf<SearchResult<SearchArticleHit> | undefined>();
    expectTypeOf<
      NonNullable<SearchResults["sections"]>["pages"]
    >().toEqualTypeOf<SearchResult<SearchPageHit> | undefined>();
    expectTypeOf<
      NonNullable<SearchResults["sections"]>["query_suggestions"]
    >().toEqualTypeOf<SearchResult<SearchQuerySuggestionHit> | undefined>();
    expectTypeOf<SearchQuerySuggestionHit>().toEqualTypeOf<{
      objectID: string;
      query: string;
      popularity: number;
    }>();

    const error = new DialogSearchError({ status: 404, message: "not found" });
    expectTypeOf(error.status).toEqualTypeOf<number>();
    expectTypeOf(error.code).toEqualTypeOf<string | undefined>();
    expect(error.name).toBe("DialogSearchError");
  });

  it("describes the opt-in facet counts", () => {
    expectTypeOf<SearchControllerOptions["facets"]>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<SearchControllerOptions["facetsTransport"]>().toEqualTypeOf<
      SearchFacetsFunction | undefined
    >();
    expectTypeOf(searchLexicalFacets).parameters.toEqualTypeOf<
      [string, SearchFacetsRequest, SearchOptions?]
    >();
    expectTypeOf(searchLexicalFacets).returns.toEqualTypeOf<
      Promise<SearchFacetsResponse>
    >();
    expectTypeOf<RefinementListItem["count"]>().toEqualTypeOf<
      number | undefined
    >();
    expectTypeOf<RangeRenderState["bounds"]>().toEqualTypeOf<
      SearchFacetStats | undefined
    >();
    expectTypeOf<SearchFacetStats>().toEqualTypeOf<{
      min: number;
      max: number;
    }>();
    expectTypeOf<SearchResults["facetsStats"]>().toEqualTypeOf<
      Readonly<Record<string, SearchFacetStats>> | undefined
    >();
  });
});
