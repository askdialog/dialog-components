// Compile-time contract of the public API: these assertions are checked by
// `tsc` (test-type), the runtime test only anchors the file in the suite.
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  Dialog,
  DialogCallbacks,
  DialogConstructor,
  DialogSearchError,
  SearchHit,
  SearchOptions,
  SearchProduct,
  SearchRequest,
  SearchResponse,
} from "../index";

describe("public API types", () => {
  it("accepts construction with and without commerce callbacks", () => {
    expectTypeOf<{
      apiKey: string;
      locale: string;
    }>().toMatchTypeOf<DialogConstructor>();

    expectTypeOf<{
      apiKey: string;
      locale: string;
      callbacks: DialogCallbacks;
    }>().toMatchTypeOf<DialogConstructor>();

    // Invalid callback values must be rejected.
    expectTypeOf<{
      apiKey: string;
      locale: string;
      callbacks: { addToCart: string; getProduct: number };
    }>().not.toMatchTypeOf<DialogConstructor>();

    expectTypeOf<Dialog["search"]>().parameters.toMatchTypeOf<
      [SearchRequest, (SearchOptions | undefined)?]
    >();

    expectTypeOf<{ query: string }>().toMatchTypeOf<SearchRequest>();
    expectTypeOf<{
      query: string;
      page: number;
      queryId: string;
    }>().toMatchTypeOf<SearchRequest>();
    expectTypeOf<SearchResponse["queryId"]>().toEqualTypeOf<string>();
    expectTypeOf<
      Dialog["search"]
    >().returns.resolves.toEqualTypeOf<SearchResponse>();

    expectTypeOf<SearchResponse["hits"]>().toEqualTypeOf<SearchHit[]>();
    expectTypeOf<SearchHit["product"]>().toEqualTypeOf<SearchProduct>();
    expectTypeOf<SearchProduct["priceRange"]>().toMatchTypeOf<
      { min: { amount: string; currencyCode: string } } | undefined
    >();

    const error = new DialogSearchError({ status: 404, message: "not found" });
    expectTypeOf(error.status).toEqualTypeOf<number>();
    expectTypeOf(error.code).toEqualTypeOf<string | undefined>();
    expect(error.name).toBe("DialogSearchError");
  });
});
