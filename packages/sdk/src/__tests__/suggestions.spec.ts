// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "../config";
import { loadSuggestions } from "../services/suggestions";

const fetchMock = vi.fn();
const apiKey = "a5c3c7e0-5f2b-4d3a-9b1e-2f6c8d7a1b23";
const productId = "9053100277937";

describe("loadSuggestions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/products/serum-eclat");
    fetchMock.mockResolvedValue({
      json: () => Promise.resolve({ questions: [] }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("calls the monolith route with the api key header", async () => {
    await loadSuggestions(apiKey, "fr", productId);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.origin).toBe(new URL(config.monolithApiUrl).origin);
    expect(parsed.pathname).toBe("/public/product-page-questions");
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      pagePath: "/products/serum-eclat",
      locale: "fr",
      productId,
    });
    expect(init.headers).toEqual({ "x-dialog-api-key": apiKey });
  });

  it("returns the parsed body", async () => {
    const body = { questions: [{ question: "Is it vegan?" }] };
    fetchMock.mockResolvedValue({ json: () => Promise.resolve(body) });

    await expect(loadSuggestions(apiKey, "en", productId)).resolves.toEqual(
      body,
    );
  });
});
