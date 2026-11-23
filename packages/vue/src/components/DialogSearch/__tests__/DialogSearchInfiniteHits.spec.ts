// @vitest-environment jsdom
import {
  createSearchController,
  type SearchProductHit,
  type SearchRequest,
  type SearchResponse,
} from "@askdialog/dialog-sdk";
import { createApp, h, nextTick } from "vue";
import { expect, it, vi } from "vitest";
import DialogSearchInfiniteHits from "../DialogSearchInfiniteHits.vue";

vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const INDEX = "products_fr_fr";
const analytics = {
  surface: "search_page" as const,
  trackViewSearchResults() {},
  trackSelectSearchResult() {},
};
const lexicalHit = (id: string): SearchProductHit => ({
  objectID: id,
  id: 1,
  tags: [],
  options: {},
  option_names: [],
  inventory_available: true,
  _display: { title: id, url: "/products/p", price: "1 €", lines: [] },
});
// 5 hits over 3 pages of 2.
const respond = (request: SearchRequest): Promise<SearchResponse> => {
  const page = request.requests[0]?.page ?? 0;
  const ids = page === 2 ? [`${page}a`] : [`${page}a`, `${page}b`];
  return Promise.resolve({
    results: [
      {
        index: INDEX,
        hits: ids.map(lexicalHit),
        nbHits: 5,
        page,
        nbPages: 3,
        hitsPerPage: 2,
        processingTimeMS: 1,
        query: "robe",
        queryID: "q",
      },
    ],
  });
};
const settle = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
    await nextTick();
  }
};
const mount = (controller: ReturnType<typeof createSearchController>) => {
  const container = document.createElement("div");
  createApp({
    render: () => h(DialogSearchInfiniteHits, { controller }),
  }).mount(container);
  return container;
};
const button = (container: HTMLElement, text: RegExp) =>
  [...container.querySelectorAll("button")].find((b) =>
    text.test(b.textContent ?? ""),
  );
const titles = (container: HTMLElement) =>
  [...container.querySelectorAll("li")].map((li) => li.textContent);

it("restored on a later page, loads the pages above and counts the hits left", async () => {
  const controller = createSearchController({
    language: "fr",
    country: "FR",
    config: {},
    hitsPerPage: 2,
    transport: vi.fn(respond),
    analytics,
    initialSearchState: { [INDEX]: { query: "robe", page: 1 } },
  });
  const container = mount(controller);
  controller.search();
  await settle();

  expect(titles(container)).toEqual(["1a1 €", "1b1 €"]);
  expect(button(container, /Voir plus/)?.textContent?.trim()).toBe(
    "Voir plus (1)",
  );
  button(container, /précédents/)?.click();
  await settle();

  expect(titles(container)).toEqual(["0a1 €", "0b1 €", "1a1 €", "1b1 €"]);
  expect(button(container, /précédents/)).toBeUndefined();
});

it("renders AI hits with their image, price range and handle link", async () => {
  const controller = createSearchController({
    mode: "ai",
    language: "fr",
    country: "FR",
    config: {},
    transport: () =>
      Promise.resolve({
        results: [
          {
            index: INDEX,
            hits: [
              {
                objectID: "1",
                title: "Veste thermique",
                handle: "veste-thermique",
                imageUrl: "https://cdn.example.com/veste.png",
                priceRange: {
                  min: { amount: "219", currencyCode: "EUR" },
                  max: { amount: "219", currencyCode: "EUR" },
                },
              } as unknown as SearchProductHit,
            ],
            nbHits: 1,
            page: 0,
            nbPages: 1,
            hitsPerPage: 12,
            processingTimeMS: 1,
            query: "veste chaude",
            queryID: "q",
          },
        ],
      }),
    analytics,
  });
  const container = mount(controller);
  controller.setSearchState({ [INDEX]: { query: "veste chaude" } });
  controller.search();
  await settle();

  const link = container.querySelector("li a");
  expect(link?.getAttribute("href")).toBe(
    `${window.location.origin}/products/veste-thermique`,
  );
  expect(link?.querySelector("img")?.getAttribute("src")).toBe(
    "https://cdn.example.com/veste.png",
  );
  expect(link?.textContent).toMatch(/^Veste thermique219,00\s€$/u);
});
