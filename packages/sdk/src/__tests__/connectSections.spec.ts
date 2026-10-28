// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectSections } from "../search/connectSections";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import { SearchResponse, SearchResult } from "../types/search";

vi.mock("../utils/searchImpressions", () => ({
  createSearchImpressionTracker: () => ({
    setContext: vi.fn(),
    observe: vi.fn(),
    forceImpression: vi.fn(),
    flush: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

const INDEX = "products_fr_be";

const result = (index: string, hits: unknown[]): SearchResult => ({
  index,
  hits: hits as SearchResult["hits"],
  nbHits: hits.length,
  page: 0,
  nbPages: 1,
  hitsPerPage: 12,
  processingTimeMS: 1,
  query: "creme",
  queryID: "qid",
});

const answer: SearchResponse = {
  results: [
    result(INDEX, [{ objectID: "p1" }]),
    result("collections_fr_be", [
      { objectID: "c1", title: "Crème visage", url: "/collections/creme" },
      { objectID: "c2", title: "Sans lien" },
      { objectID: "c3", title: "Script", url: "javascript:alert(1)" },
    ]),
    result("articles_fr_be", [
      {
        objectID: "a1",
        title: "La crème",
        url: "/blogs/news/creme",
        image: "a.jpg",
        tags: [],
      },
    ]),
    result("pages_fr_be", [{ objectID: "g1", handle: "creme-faq" }]),
  ],
};

const transport = vi.fn<() => Promise<SearchResponse>>();

const create = (): SearchController =>
  createSearchController({
    transport,
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    sections: [
      { index: "collections" },
      { index: "articles" },
      { index: "pages" },
    ],
  });

const setQuery = (controller: SearchController, query: string): void => {
  controller.setSearchState({ [INDEX]: { query } });
};

const search = async (
  controller: SearchController,
  query: string,
): Promise<void> => {
  setQuery(controller, query);
  await vi.advanceTimersByTimeAsync(100);
};

beforeEach(() => {
  vi.useFakeTimers();
  transport.mockResolvedValue(answer);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("connectSections", () => {
  it("exposes collections that have a link, articles and pages, each with its display", async () => {
    const controller = create();
    const sections = connectSections(controller);

    await search(controller, "creme");

    expect(sections.getRenderState()).toEqual({
      collections: [
        {
          hit: expect.objectContaining({ objectID: "c1" }),
          display: {
            title: "Crème visage",
            titleParts: { before: "", match: "Crème", after: " visage" },
            href: "/collections/creme",
            image: undefined,
          },
        },
      ],
      articles: [
        {
          hit: expect.objectContaining({ objectID: "a1" }),
          display: {
            title: "La crème",
            titleParts: { before: "La ", match: "crème", after: "" },
            href: "/blogs/news/creme",
            image: "a.jpg",
          },
        },
      ],
      pages: [
        {
          hit: expect.objectContaining({ objectID: "g1" }),
          display: {
            title: "creme-faq",
            titleParts: { before: "", match: "creme", after: "-faq" },
            href: undefined,
            image: undefined,
          },
        },
      ],
    });
  });

  it("exposes no section on the empty query, even while the previous sections are kept", async () => {
    const controller = create();
    const sections = connectSections(controller);
    const listener = vi.fn();
    sections.subscribe(listener);
    await search(controller, "creme");
    expect(sections.getRenderState().articles).toHaveLength(1);

    setQuery(controller, " ");

    expect(controller.getSnapshot().results.sections).toBeDefined();
    expect(sections.getRenderState()).toEqual({
      collections: [],
      articles: [],
      pages: [],
    });
    expect(listener).toHaveBeenLastCalledWith(sections.getRenderState());
  });

  it("keeps its render state while the sections do not change, and stops notifying after dispose", async () => {
    const controller = create();
    const sections = connectSections(controller);
    const listener = vi.fn();
    sections.subscribe(listener);
    await search(controller, "creme");
    const renderState = sections.getRenderState();
    const notified = listener.mock.calls.length;

    setQuery(controller, "cremes");
    expect(sections.getRenderState()).toBe(renderState);
    expect(listener).toHaveBeenCalledTimes(notified);

    sections.dispose();
    await vi.advanceTimersByTimeAsync(100);
    expect(listener).toHaveBeenCalledTimes(notified);
  });
});
