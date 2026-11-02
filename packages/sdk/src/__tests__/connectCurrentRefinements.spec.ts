// @vitest-environment jsdom
/* eslint max-lines: ["error", 300] */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  connectCurrentRefinements,
  CurrentRefinement,
  CurrentRefinementsConnector,
} from "../search/connectCurrentRefinements";
import { createSearchController } from "../search/createSearchController";
import {
  FilterableAttribute,
  IndexSearchState,
  SearchController,
  SearchMode,
} from "../search/types";
import { SearchFilterBlock } from "../types/aiSearch";
import { SearchResponse } from "../types/search";

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

const attribute = (
  key: string,
  type: FilterableAttribute["type"],
  label = key,
): FilterableAttribute => ({ key, label, type, values: [] });

const ATTRIBUTES = [
  attribute("brand", "keyword"),
  attribute("color", "keyword", "Teinte"),
  attribute("price", "number"),
];

const DETECTED: SearchFilterBlock[] = [
  {
    source: "query_constructor",
    facetFilters: [[{ attribute: "color", value: "rouge" }]],
    numericFilters: [[{ attribute: "price", operator: "<=", value: 40 }]],
  },
  {
    source: "user",
    facetFilters: [[{ attribute: "brand", value: "Avène" }]],
    numericFilters: [],
  },
];

const answer = (
  fields: Pick<SearchResponse["results"][number], "filters"> & {
    attributeLabels?: Record<string, string>;
  } = {},
): SearchResponse => ({
  results: [
    {
      index: INDEX,
      hits: [],
      nbHits: 0,
      page: 0,
      nbPages: 0,
      hitsPerPage: 12,
      processingTimeMS: 1,
      query: "robe",
      queryID: "qid",
      ...fields,
    },
  ],
});

const transport = vi.fn<() => Promise<SearchResponse>>();

const create = ({
  mode = "ai",
  language = "fr",
}: { mode?: SearchMode; language?: string } = {}): SearchController =>
  createSearchController({
    mode,
    transport,
    config: { searchConfig: { filterableAttributes: ATTRIBUTES } },
    language,
    country: "BE",
    currency: "EUR",
    analytics: {
      surface: "search_page",
      trackViewSearchResults: vi.fn(),
      trackSelectSearchResult: vi.fn(),
    },
  });

const search = async (
  controller: SearchController,
  entry: Omit<IndexSearchState, "query"> = {},
): Promise<void> => {
  controller.setSearchState({ [INDEX]: { query: "robe", ...entry } });
  await vi.advanceTimersByTimeAsync(300);
};

const entryOf = (controller: SearchController): IndexSearchState =>
  controller.getSnapshot().searchState[INDEX];

const chips = (connector: CurrentRefinementsConnector): CurrentRefinement[] => [
  ...connector.getRenderState().items,
];

const euros = (amount: number): string =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(
    amount,
  );

beforeEach(() => {
  vi.useFakeTimers();
  transport.mockResolvedValue(answer());
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("connectCurrentRefinements", () => {
  it("shows one chip per group the search sends, in the request's order", async () => {
    const controller = create();
    const connector = connectCurrentRefinements(controller);

    await search(controller, {
      refinementList: { color: ["rouge", "bleu"], unknown: ["x"], brand: [] },
      range: { price: "10:20" },
      filters: {
        facetFilters: [[{ attribute: "brand", value: "Avène" }]],
        numericFilters: [],
      },
    });

    expect(chips(connector)).toEqual([
      {
        attribute: "brand",
        label: "brand",
        value: "Avène",
        text: "brand : Avène",
        detected: false,
        removable: true,
      },
      {
        attribute: "color",
        label: "Teinte",
        value: "rouge ou bleu",
        text: "Teinte : rouge ou Teinte : bleu",
        detected: false,
        removable: true,
      },
      {
        attribute: "price",
        label: "price",
        value: `${euros(10)} – ${euros(20)}`,
        text: `price entre ${euros(10)} et ${euros(20)}`,
        detected: false,
        removable: true,
      },
    ]);
  });

  it("puts the engine's detected groups first on the AI mode, labelled as published, read-only", async () => {
    transport.mockResolvedValue(
      answer({ filters: DETECTED, attributeLabels: { price: "Prix" } }),
    );
    const controller = create();
    const connector = connectCurrentRefinements(controller);

    await search(controller);

    expect(chips(connector)).toEqual([
      expect.objectContaining({
        text: "Teinte : rouge",
        detected: true,
        removable: false,
      }),
      expect.objectContaining({
        label: "Prix",
        value: `≤ ${euros(40)}`,
        detected: true,
        removable: false,
      }),
    ]);
  });

  it("writes the labels in the controller's language", async () => {
    const [result] = answer({ filters: DETECTED }).results;
    transport.mockResolvedValue({
      results: [{ ...result, index: "products_de_be" }],
    });
    const controller = create({ language: "de" });
    const connector = connectCurrentRefinements(controller);

    controller.setSearchState({ products_de_be: { query: "robe" } });
    await vi.advanceTimersByTimeAsync(300);

    expect(chips(connector)[1].text).toBe(
      `price bis einschließlich ${new Intl.NumberFormat("de-BE", {
        style: "currency",
        currency: "EUR",
      }).format(40)}`,
    );
  });

  it("keeps an exclusion or a group mixing attributes read-only", async () => {
    const controller = create();
    const connector = connectCurrentRefinements(controller);
    const filters = {
      facetFilters: [
        [{ attribute: "color", value: "rouge", negated: true }],
        [
          { attribute: "brand", value: "Avène" },
          { attribute: "color", value: "bleu" },
        ],
      ],
      numericFilters: [
        [{ attribute: "price", operator: "!=" as const, value: 0 }],
      ],
    };
    await search(controller, { filters });

    for (const chip of chips(connector)) {
      expect(chip.removable).toBe(false);
      connector.remove(chip);
    }

    expect(entryOf(controller).filters).toEqual(filters);
  });

  it("takes off a removable chip's filter alone", async () => {
    const controller = create();
    const connector = connectCurrentRefinements(controller);
    await search(controller, {
      refinementList: { color: ["rouge"], brand: ["Avène"] },
      range: { price: "10:" },
      filters: {
        facetFilters: [],
        numericFilters: [[{ attribute: "price", operator: "<", value: 90 }]],
      },
    });
    const removeChip = (text: string): void => {
      const chip = chips(connector).find((item) => item.text === text);
      connector.remove(chip as CurrentRefinement);
    };

    removeChip("Teinte : rouge");
    removeChip(`price inférieur à ${euros(90)}`);
    removeChip(`price à partir de ${euros(10)}`);

    expect(entryOf(controller)).toEqual({
      query: "robe",
      page: 0,
      refinementList: { brand: ["Avène"] },
      range: undefined,
      filters: undefined,
    });
    expect(chips(connector).map(({ text }) => text)).toEqual(["brand : Avène"]);
  });

  it("keeps the other bound of a floor above its ceiling", async () => {
    const controller = create();
    const connector = connectCurrentRefinements(controller);
    await search(controller, { range: { price: "50:20" } });

    connector.remove(chips(connector)[0]);

    expect(entryOf(controller).range).toEqual({ price: ":20" });
  });

  it("ignores a chip of an earlier render state and does nothing once disposed", async () => {
    const controller = create();
    const connector = connectCurrentRefinements(controller);
    await search(controller, { refinementList: { color: ["rouge"] } });
    const [stale] = chips(connector);
    await search(controller, { refinementList: { color: ["bleu"] } });

    connector.remove(stale);
    expect(entryOf(controller).refinementList).toEqual({ color: ["bleu"] });

    connector.dispose();
    connector.remove(chips(connector)[0]);
    expect(entryOf(controller).refinementList).toEqual({ color: ["bleu"] });
  });

  it("shows no detected group on the lexical mode", async () => {
    const controller = create({ mode: "lexical" });
    const connector = connectCurrentRefinements(controller);

    await search(controller, { refinementList: { color: ["rouge"] } });

    expect(chips(connector).map(({ detected }) => detected)).toEqual([false]);
  });
});
