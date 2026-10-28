// @vitest-environment jsdom
import { act, type FC, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Dialog } from "@askdialog/dialog-sdk";
import {
  SearchStatus,
  type SearchProductHit,
  type SearchResponse,
} from "@askdialog/dialog-sdk/search";
import {
  type DialogSearch,
  type UseDialogSearchOptions,
  useDialogSearch,
} from "./useDialogSearch";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const INDEX = "products_fr_be";

const hit: SearchProductHit = {
  objectID: "v1",
  id: 1,
  title: "Shoe",
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
};

const answer = (query: string): SearchResponse => ({
  results: [
    {
      index: INDEX,
      hits: [hit],
      nbHits: 1,
      page: 0,
      nbPages: 1,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query,
      queryID: "qid",
    },
  ],
});

// The merchant config loads once per API key: each client gets its own.
let apiKeys = 0;
const fakeClient = () => {
  const client = {
    apiKey: `key-${++apiKeys}`,
    theme: { primaryColor: "#123456" },
    search: vi.fn((request: { requests: { query: string }[] }) =>
      Promise.resolve(answer(request.requests[0].query)),
    ),
    trackViewSearchResults: vi.fn(),
    trackSelectSearchResult: vi.fn(),
    trackOpenedSearch: vi.fn(),
  };

  return { ...client, dialog: client as unknown as Dialog };
};

let root: Root;
let container: HTMLElement;
let latest: DialogSearch;

const Probe: FC<{ options: UseDialogSearchOptions }> = ({ options }) => {
  latest = useDialogSearch(options);

  return null;
};

const render = async (
  options: UseDialogSearchOptions,
  { strict = false } = {},
): Promise<void> => {
  const probe = <Probe options={options} />;
  await act(async () => {
    root.render(strict ? <StrictMode>{probe}</StrictMode> : probe);
  });
};

// Let the transport's promise and the config loads settle.
const settle = (): Promise<void> =>
  act(() => new Promise((resolve) => setTimeout(resolve, 20)));

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  // Impressions are tracked once the results are rendered.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            url.includes("dialog-config")
              ? { searchBusinessRanking: "best_sellers" }
              : { filterableAttributes: [] },
          ),
      }),
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("useDialogSearch", () => {
  it("searches through the client and returns the controller's snapshot", async () => {
    const client = fakeClient();
    await render({ client: client.dialog, language: "fr", country: "BE" });
    expect(latest.state.results.status).toBe(SearchStatus.IDLE);

    act(() => latest.controller.open());
    await settle();

    expect(client.search).toHaveBeenCalledTimes(1);
    expect(client.search.mock.calls[0][0].requests[0]).toMatchObject({
      indexName: INDEX,
      query: "",
    });
    expect(latest.state.results.status).toBe(SearchStatus.SUCCESS);
    expect(latest.state.results.products?.hits).toEqual([hit]);
    expect(latest.theme).toBe(client.theme);
  });

  it.each([
    [undefined, "search_page"],
    ["autocomplete", "autocomplete"],
  ] as const)(
    "tracks analytics on the client, with surface %s as %s",
    async (surface, expected) => {
      const client = fakeClient();
      await render({
        client: client.dialog,
        language: "fr",
        country: "BE",
        surface,
      });

      act(() => latest.controller.open());
      await settle();

      expect(client.trackOpenedSearch).toHaveBeenCalledWith({
        surface: expected,
        search_type: "lexical",
      });
    },
  );

  it("loads the merchant's business ranking with the client's API key", async () => {
    const client = fakeClient();
    await render({ client: client.dialog, language: "fr", country: "BE" });

    act(() => latest.controller.open());
    await settle();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/widget/dialog-config?locale=fr"),
      { headers: { "x-dialog-api-key": client.apiKey } },
    );
    expect(latest.state.context.businessRanking).toBe("best_sellers");
    expect(latest.state.context.texts.productsLabel).toBe("Produits");
  });

  it("keeps the same controller, searching and notifying, after StrictMode replays its effects", async () => {
    const client = fakeClient();
    await render(
      { client: client.dialog, language: "fr", country: "BE", debounceMs: 0 },
      { strict: true },
    );
    const { controller } = latest;

    act(() =>
      controller.setSearchState((searchState) => ({
        ...searchState,
        [INDEX]: { query: "shoe" },
      })),
    );
    await settle();

    expect(latest.controller).toBe(controller);
    expect(client.search).toHaveBeenCalledTimes(1);
    expect(latest.state.searchState[INDEX].query).toBe("shoe");
    expect(latest.state.results.products?.query).toBe("shoe");
  });

  it("sends no pending search once unmounted", async () => {
    const client = fakeClient();
    await render({
      client: client.dialog,
      language: "fr",
      country: "BE",
      debounceMs: 10,
    });

    act(() => latest.controller.setSearchState({ [INDEX]: { query: "shoe" } }));
    act(() => root.unmount());
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(client.search).not.toHaveBeenCalled();
    root = createRoot(container);
  });
});
