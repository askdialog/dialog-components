import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DialogSearchError } from "../DialogSearchError";
import { searchAi, searchAiOverview } from "../services/aiSearch";
import { AiOverviewRequest } from "../types/aiSearch";
import { SearchRequest } from "../types/search";

const API_KEY = "pk_test_abcdef";

// The widget adds its session to the request; the transport must not drop it.
const request = {
  requests: [{ indexName: "products_fr_be", query: "robe rouge", page: 0 }],
  sessionId: "session-1",
  userId: "user-1",
  source: "webmcp",
} as SearchRequest;

const overviewRequest = {
  query: "robe rouge",
  language: "fr",
  country: "BE",
  nbHits: 12,
  objectIDs: ["1", "2", "3"],
  sessionId: "session-1",
} as AiOverviewRequest;

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const fetchMock =
  vi.fn<(url: string, init: RequestInit) => Promise<Response>>();

// A request that only ends when its signal aborts.
const hangUntilAborted = (): void => {
  fetchMock.mockImplementation(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      }),
  );
};

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe.each([
  [
    "searchAi",
    /\/public\/search\/ai$/,
    () => searchAi(API_KEY, request),
    request,
  ],
  [
    "searchAiOverview",
    /\/public\/search\/ai\/overview$/,
    () => searchAiOverview(API_KEY, overviewRequest),
    overviewRequest,
  ],
])("%s", (_name, path, send, body) => {
  it("POSTs the request as is, extra fields included, with the api key header", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await expect(send()).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(path);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      "x-dialog-api-key": API_KEY,
    });
    expect(JSON.parse(init.body as string)).toEqual(body);
  });

  it("rejects an HTTP error with a DialogSearchError", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: "THROTTLED", message: "Too many requests" }, 429),
    );

    const error = await send().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DialogSearchError);
    expect(error).toMatchObject({ status: 429, code: "THROTTLED" });
  });

  it("times out after 30 s with a TimeoutError", async () => {
    vi.useFakeTimers();
    hangUntilAborted();
    const sent = send().catch((caught: unknown) => caught);

    await vi.advanceTimersByTimeAsync(29_999);
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    expect(await sent).toMatchObject({ name: "TimeoutError" });
  });
});

describe("AI transports cancellation", () => {
  it.each([
    [
      "searchAi",
      (signal: AbortSignal) => searchAi(API_KEY, request, { signal }),
    ],
    [
      "searchAiOverview",
      (signal: AbortSignal) =>
        searchAiOverview(API_KEY, overviewRequest, { signal }),
    ],
  ])("%s aborts the request with the caller's signal", async (_name, send) => {
    hangUntilAborted();
    const controller = new AbortController();
    const sent = send(controller.signal).catch((caught: unknown) => caught);

    controller.abort();

    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);
    expect(await sent).toMatchObject({ name: "AbortError" });
  });
});
