// @vitest-environment jsdom
import {
  SearchStatus,
  type Dialog,
  type SearchResponse,
} from "@askdialog/dialog-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, h } from "vue";
import {
  useDialogSearch,
  type DialogSearch,
  type UseDialogSearchOptions,
} from "../useDialogSearch";

const INDEX = "products_fr_be";

const answer: SearchResponse = {
  results: [
    {
      index: INDEX,
      hits: [],
      nbHits: 0,
      page: 0,
      nbPages: 0,
      hitsPerPage: 6,
      processingTimeMS: 1,
      query: "",
      queryID: "qid",
    },
  ],
};

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });

// The merchant config is cached per API key: each test uses its own.
let apiKey = 0;

const createClient = () => ({
  apiKey: `pk_test_${apiKey}`,
  theme: { primaryColor: "#123456" },
  search: vi.fn(() => Promise.resolve(answer)),
  trackViewSearchResults: vi.fn(),
  trackSelectSearchResult: vi.fn(),
  trackOpenedSearch: vi.fn(),
});

type FakeClient = ReturnType<typeof createClient>;

const mount = (
  client: FakeClient,
  options: Partial<UseDialogSearchOptions> = {},
): { search: DialogSearch; unmount: () => void } => {
  let search: DialogSearch | undefined;
  const app = createApp(
    defineComponent({
      setup() {
        search = useDialogSearch({
          client: client as unknown as Dialog,
          language: "fr",
          country: "BE",
          ...options,
        });

        return () => h("div");
      },
    }),
  );
  app.mount(document.createElement("div"));

  return { search: search as DialogSearch, unmount: () => app.unmount() };
};

beforeEach(() => {
  apiKey += 1;
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url.includes("/widget/dialog-config")
          ? jsonResponse({ searchBusinessRanking: "best_sellers" })
          : jsonResponse({ filterableAttributes: [] }),
      ),
    ),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useDialogSearch", () => {
  it("searches through the client with the language, country and options it is given", async () => {
    const client = createClient();
    const { search } = mount(client, { hitsPerPage: 6 });

    search.controller.open();
    await vi.runAllTimersAsync();

    expect(client.search).toHaveBeenCalledTimes(1);
    expect(client.search.mock.calls[0]).toMatchObject([
      { requests: [{ indexName: INDEX, query: "", hitsPerPage: 6 }] },
      { signal: expect.any(AbortSignal) },
    ]);
  });

  it("reports analytics through the client, on the search page surface by default", () => {
    const client = createClient();
    const { search } = mount(client);

    search.controller.open();

    expect(client.trackOpenedSearch).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "search_page" }),
    );
  });

  it("reports analytics on the surface it is given", () => {
    const client = createClient();
    const { search } = mount(client, { surface: "autocomplete" });

    search.controller.open();

    expect(client.trackOpenedSearch).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "autocomplete" }),
    );
  });

  it("follows the controller's snapshot, the merchant's business ranking included", async () => {
    const client = createClient();
    const { search } = mount(client);
    expect(search.state.value).toBe(search.controller.getSnapshot());

    search.controller.open();
    await vi.runAllTimersAsync();

    expect(search.state.value).toBe(search.controller.getSnapshot());
    expect(search.state.value.results.status).toBe(SearchStatus.EMPTY);
    expect(search.state.value.context.businessRanking).toBe("best_sellers");
  });

  it("returns the client's theme", () => {
    const client = createClient();

    expect(mount(client).search.theme).toBe(client.theme);
  });

  it("disposes the controller on unmount", async () => {
    const client = createClient();
    const { search, unmount } = mount(client);
    const snapshot = search.state.value;

    unmount();
    search.controller.open();
    await vi.runAllTimersAsync();

    expect(client.search).not.toHaveBeenCalled();
    expect(search.state.value).toBe(snapshot);
  });
});
