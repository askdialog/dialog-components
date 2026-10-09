// Compile-time contract of the public API: these assertions are checked by
// `tsc` (test-type), the runtime test only anchors the file in the suite.
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  Dialog,
  DialogCallbacks,
  DialogConstructor,
  DialogSearchError,
  SearchCollectionHit,
  SearchControllerState,
  SearchHit,
  SearchOptions,
  SearchProductHit,
  SearchRequest,
  SearchResponse,
  SearchResult,
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
      (SearchProductHit | SearchCollectionHit | SearchHit)[]
    >();
    expectTypeOf<
      NonNullable<SearchControllerState["response"]>["hits"]
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
    expectTypeOf<SearchHit["objectID"]>().toEqualTypeOf<string>();
    expectTypeOf<
      NonNullable<SearchControllerState["sections"]>["collections"]
    >().toEqualTypeOf<SearchResult<SearchCollectionHit> | undefined>();

    const error = new DialogSearchError({ status: 404, message: "not found" });
    expectTypeOf(error.status).toEqualTypeOf<number>();
    expectTypeOf(error.code).toEqualTypeOf<string | undefined>();
    expect(error.name).toBe("DialogSearchError");
  });
});
