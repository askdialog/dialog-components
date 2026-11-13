// @vitest-environment jsdom
/* eslint max-lines: ["error", 270] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectQuerySuggestions } from "../search/connectQuerySuggestions";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import {
  SearchQuerySuggestionHit,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/search";
import { SearchSection } from "../types/searchController";

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
const SUGGESTIONS = "query_suggestions_fr_be";

const result = (index: string, hits: unknown[]): SearchResult => ({
  index,
  hits: hits as SearchResult["hits"],
  nbHits: hits.length,
  page: 0,
  nbPages: 1,
  hitsPerPage: 5,
  processingTimeMS: 1,
  query: "",
  queryID: "qid",
});

const suggestion = (
  query: string,
  popularity: number,
): SearchQuerySuggestionHit => ({ objectID: query, query, popularity });

const HITS = [
  suggestion("crème hydratante", 12),
  suggestion("Creme solaire", 30),
  suggestion("crayon", 4),
];

const answer = (request: SearchRequest): SearchResponse => ({
  results: request.requests.map(({ indexName }) =>
    result(indexName, indexName === SUGGESTIONS ? HITS : []),
  ),
});

const transport = vi.fn((request: SearchRequest) =>
  Promise.resolve(answer(request)),
);

const create = (
  sections: readonly SearchSection[] = [{ index: "query_suggestions" }],
): SearchController =>
  createSearchController({
    transport,
    language: "fr",
    country: "BE",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    sections,
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

const sentRequests = (): SearchRequest["requests"][] =>
  transport.mock.calls.map(([request]) => request.requests);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("query suggestions requests", () => {
  it("requests 5 query suggestions unless the section says otherwise", async () => {
    await search(create(), "cre");
    await search(
      create([{ index: "query_suggestions", hitsPerPage: 8 }]),
      "cre",
    );

    expect(sentRequests()).toEqual([
      [
        { indexName: INDEX, query: "cre", page: 0, hitsPerPage: 12 },
        { indexName: SUGGESTIONS, query: "cre", page: 0, hitsPerPage: 5 },
      ],
      [
        { indexName: INDEX, query: "cre", page: 0, hitsPerPage: 12 },
        { indexName: SUGGESTIONS, query: "cre", page: 0, hitsPerPage: 8 },
      ],
    ]);
  });

  it("requests query suggestions alone beside products on the empty query", async () => {
    const controller = create([
      { index: "collections" },
      { index: "query_suggestions" },
      { index: "pages" },
    ]);

    controller.open();
    await vi.advanceTimersByTimeAsync(0);
    await search(controller, "cre");

    expect(sentRequests()).toEqual([
      [
        { indexName: INDEX, query: "", page: 0, hitsPerPage: 12 },
        { indexName: SUGGESTIONS, query: "", page: 0, hitsPerPage: 5 },
      ],
      [
        { indexName: INDEX, query: "cre", page: 0, hitsPerPage: 12 },
        {
          indexName: "collections_fr_be",
          query: "cre",
          page: 0,
          hitsPerPage: 12,
        },
        { indexName: SUGGESTIONS, query: "cre", page: 0, hitsPerPage: 5 },
        { indexName: "pages_fr_be", query: "cre", page: 0, hitsPerPage: 12 },
      ],
    ]);
  });

  it("exposes the query suggestion hits in the order returned", async () => {
    const controller = create();

    await search(controller, "cre");

    expect(
      controller.getSnapshot().results.sections?.query_suggestions?.hits,
    ).toEqual(HITS);
  });
});

describe("connectQuerySuggestions", () => {
  it("lists the suggestions in order, the leading part matching the typed text highlighted", async () => {
    const controller = create();
    const suggestions = connectQuerySuggestions(controller);

    await search(controller, " CRE ");

    expect(suggestions.getRenderState()).toEqual({
      suggestions: [
        {
          hit: HITS[0],
          parts: [
            { text: "crè", highlighted: true },
            { text: "me hydratante", highlighted: false },
          ],
        },
        {
          hit: HITS[1],
          parts: [
            { text: "Cre", highlighted: true },
            { text: "me solaire", highlighted: false },
          ],
        },
        {
          hit: HITS[2],
          parts: [{ text: "crayon", highlighted: false }],
        },
      ],
    });
  });

  it("highlights accents typed or not, and the whole query when typed in full", async () => {
    const controller = create();
    const suggestions = connectQuerySuggestions(controller);

    await search(controller, "Crème Solaire");

    expect(suggestions.getRenderState().suggestions[1].parts).toEqual([
      { text: "Creme solaire", highlighted: true },
    ]);
  });

  it("highlights nothing on the empty query", async () => {
    const controller = create();
    const suggestions = connectQuerySuggestions(controller);

    controller.open();
    await vi.advanceTimersByTimeAsync(0);

    expect(
      suggestions.getRenderState().suggestions.map(({ parts }) => parts),
    ).toEqual(HITS.map(({ query }) => [{ text: query, highlighted: false }]));
  });

  it("lists none when the query suggestions are not requested", async () => {
    const controller = create([]);
    const suggestions = connectQuerySuggestions(controller);

    await search(controller, "cre");

    expect(suggestions.getRenderState()).toEqual({ suggestions: [] });
  });

  it("applies a suggestion: sets the query and searches it at once", async () => {
    const controller = create();
    const suggestions = connectQuerySuggestions(controller);
    setQuery(controller, "cre");

    suggestions.applySuggestion("creme solaire");
    await vi.advanceTimersByTimeAsync(0);

    expect(controller.getSnapshot().searchState[INDEX].query).toBe(
      "creme solaire",
    );
    expect(sentRequests().map(([products]) => products.query)).toEqual([
      "creme solaire",
    ]);
  });

  it("applies nothing after dispose", async () => {
    const controller = create();
    const suggestions = connectQuerySuggestions(controller);
    suggestions.dispose();

    suggestions.applySuggestion("creme solaire");
    await vi.advanceTimersByTimeAsync(100);

    expect(transport).not.toHaveBeenCalled();
  });
});
