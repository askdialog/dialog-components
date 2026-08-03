import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DialogSearchError } from "../DialogSearchError";
import { searchProducts } from "../services/search";
import { SearchResponse } from "../types/search";

const API_KEY = "pk_test_abcdef";

const emptyResponse: SearchResponse = {
  queryId: "0198c3f2-0000-7000-8000-000000000000",
  hits: [],
  nbHits: 0,
  page: 0,
  nbPages: 0,
  hitsPerPage: 20,
  processingTimeMs: 3,
  query: "running shoes",
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("searchProducts", () => {
  it("POSTs the exact request to /public/search with only the api key header", async () => {
    fetchMock.mockResolvedValue(jsonResponse(emptyResponse));

    await searchProducts(API_KEY, {
      query: "running shoes",
      page: 2,
      hitsPerPage: 50,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/public\/search$/);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      "x-dialog-api-key": API_KEY,
    });
    expect(JSON.parse(init.body as string)).toEqual({
      query: "running shoes",
      page: 2,
      hitsPerPage: 50,
    });
  });

  it("omits pagination fields the caller did not provide", async () => {
    fetchMock.mockResolvedValue(jsonResponse(emptyResponse));

    await searchProducts(API_KEY, { query: "running shoes" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      query: "running shoes",
    });
  });

  it("resolves the typed response, including empty results", async () => {
    fetchMock.mockResolvedValue(jsonResponse(emptyResponse));

    await expect(
      searchProducts(API_KEY, { query: "running shoes" }),
    ).resolves.toEqual(emptyResponse);
  });

  it.each([
    [401, "INVALID_WIDGET_API_KEY", "Invalid widget API key"],
    [
      422,
      "VALIDATION_ERROR",
      "query must contain at least 2 visible characters",
    ],
    [429, "THROTTLED", "Too many requests"],
    [503, "STOREFRONT_SEARCH_UNAVAILABLE", "Storefront search is unavailable"],
  ])(
    "rejects a %i answer with a DialogSearchError carrying status, code and message",
    async (status, code, message) => {
      fetchMock.mockResolvedValue(
        jsonResponse({ statusCode: status, error: code, message }, status),
      );

      const error = await searchProducts(API_KEY, {
        query: "running shoes",
      }).catch((caught: unknown) => caught as DialogSearchError);

      expect(error).toBeInstanceOf(DialogSearchError);
      expect(error).toMatchObject({
        name: "DialogSearchError",
        status,
        code,
        message,
      });
    },
  );

  it("falls back to statusText when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Bad Gateway</html>", {
        status: 502,
        statusText: "Bad Gateway",
      }),
    );

    const error = await searchProducts(API_KEY, {
      query: "running shoes",
    }).catch((caught: unknown) => caught as DialogSearchError);

    expect(error).toBeInstanceOf(DialogSearchError);
    expect(error).toMatchObject({
      status: 502,
      code: undefined,
      message: "Bad Gateway",
    });
  });

  it("propagates network failures untouched", async () => {
    const networkError = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(networkError);

    await expect(
      searchProducts(API_KEY, { query: "running shoes" }),
    ).rejects.toBe(networkError);
  });

  it("forwards the AbortSignal and preserves the native AbortError", async () => {
    const abortError = new DOMException(
      "The operation was aborted.",
      "AbortError",
    );
    fetchMock.mockRejectedValue(abortError);
    const controller = new AbortController();

    await expect(
      searchProducts(
        API_KEY,
        { query: "running shoes" },
        { signal: controller.signal },
      ),
    ).rejects.toBe(abortError);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });
});
