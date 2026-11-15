import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectRange } from "../search/connectRange";
import { connectRefinementList } from "../search/connectRefinementList";
import { createSearchController } from "../search/createSearchController";
import { SearchController } from "../search/types";
import {
  SearchFacetsResponse,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "../types/search";

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

const result = (): SearchResult => ({
  index: INDEX,
  hits: [],
  nbHits: 5,
  page: 0,
  nbPages: 1,
  hitsPerPage: 12,
  processingTimeMS: 1,
  query: "shirt",
  queryID: "qid",
});

const transport = vi.fn<(request: SearchRequest) => Promise<SearchResponse>>();
const facetsTransport = vi.fn<() => Promise<SearchFacetsResponse>>();

const create = (facets: boolean): SearchController =>
  createSearchController({
    transport,
    facetsTransport,
    facets,
    language: "fr",
    country: "BE",
    config: {
      searchConfig: {
        filterableAttributes: [
          {
            key: "color",
            label: "Couleur",
            type: "keyword",
            values: ["Beige", "Bleu", "Noir", "Rouge", "Vert"],
          },
          { key: "price", label: "Prix", type: "number", values: [] },
        ],
      },
    },
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
    initialSearchState: {
      [INDEX]: { query: "shirt", refinementList: { color: ["Vert"] } },
    },
  });

const answer = async (
  controller: SearchController,
  counts: SearchFacetsResponse | Error,
): Promise<void> => {
  transport.mockResolvedValueOnce({ results: [result()] });
  if (counts instanceof Error) {
    facetsTransport.mockRejectedValueOnce(counts);
  } else {
    facetsTransport.mockResolvedValueOnce(counts);
  }
  controller.search();
  await vi.advanceTimersByTimeAsync(0);
};

const COUNTS: SearchFacetsResponse = {
  facets: { color: { Bleu: 3, Noir: 2, Rouge: 1, Autre: 4 } },
  facets_stats: { price: { min: 9.9, max: 120 } },
  nbHits: 5,
};

describe("facet counts in the connectors", () => {
  let controller: SearchController;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    controller.dispose();
    transport.mockReset();
    facetsTransport.mockReset();
    vi.useRealTimers();
  });

  it("offers the values with a result and the checked ones, with their counts", async () => {
    controller = create(true);
    const colors = connectRefinementList(controller, { attribute: "color" });
    await answer(controller, COUNTS);

    // Beige has no result; Vert is checked with none; Autre is not a config value.
    expect(colors.getRenderState().items).toEqual([
      { value: "Bleu", isRefined: false, count: 3 },
      { value: "Noir", isRefined: false, count: 2 },
      { value: "Rouge", isRefined: false, count: 1 },
      { value: "Vert", isRefined: true, count: 0 },
    ]);
  });

  it("folds the offered values, the checked ones kept", async () => {
    controller = create(true);
    const colors = connectRefinementList(controller, {
      attribute: "color",
      limit: 1,
    });
    await answer(controller, COUNTS);

    expect(colors.getRenderState()).toMatchObject({
      items: [
        { value: "Bleu", count: 3 },
        { value: "Vert", count: 0 },
      ],
      foldedCount: 2,
      canToggleShowMore: true,
    });

    colors.toggleShowMore();

    expect(colors.getRenderState().items).toHaveLength(4);
  });

  it.each([
    ["the option is off", false, COUNTS],
    ["the counts fail", true, new Error("502")],
    ["the answer has no facet for it", true, { facets: {}, nbHits: 0 }],
  ])(
    "offers every config value without count when %s",
    async (_case, facets, counts) => {
      controller = create(facets);
      const colors = connectRefinementList(controller, { attribute: "color" });
      await answer(controller, counts);

      expect(colors.getRenderState().items).toEqual(
        ["Beige", "Bleu", "Noir", "Rouge", "Vert"].map((value) => ({
          value,
          isRefined: value === "Vert",
        })),
      );
    },
  );

  it("gives the price range the results' bounds once answered", async () => {
    controller = create(true);
    const price = connectRange(controller, { attribute: "price" });

    expect(price.getRenderState()).not.toHaveProperty("bounds");

    await answer(controller, COUNTS);

    expect(price.getRenderState().bounds).toEqual({ min: 9.9, max: 120 });

    // Another search, whose counts answer no bounds.
    controller.setSearchState((state) => ({
      ...state,
      [INDEX]: { ...state[INDEX], query: "pull" },
    }));
    await answer(controller, { facets: {}, nbHits: 0 });

    expect(facetsTransport).toHaveBeenCalledTimes(2);
    expect(price.getRenderState()).not.toHaveProperty("bounds");
  });

  it("gives a draft the last applied search's counts, and sends nothing", async () => {
    controller = create(true);
    await answer(controller, COUNTS);
    const draft = controller.createDraft();
    const colors = connectRefinementList(draft, { attribute: "color" });
    colors.refine("Beige");
    colors.refine("Bleu");

    expect(transport).toHaveBeenCalledOnce();
    expect(facetsTransport).toHaveBeenCalledOnce();
    expect(colors.getRenderState().items).toEqual([
      { value: "Beige", isRefined: true, count: 0 },
      { value: "Bleu", isRefined: true, count: 3 },
      { value: "Noir", isRefined: false, count: 2 },
      { value: "Rouge", isRefined: false, count: 1 },
      { value: "Vert", isRefined: true, count: 0 },
    ]);
    draft.discard();
  });
});
