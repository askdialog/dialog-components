import {
  filterFieldLabel,
  filterGroupText,
  filterGroupValue,
  FilterWriting,
  SearchFilter,
} from "../utils/searchFilterLabels";
import { attributeTypes } from "../utils/searchFilters";
import { DETECTED_SOURCE } from "./connectRefinementList";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchContext, SearchController, SearchResults } from "./types";
import { EntryChange, visitorGroups } from "./visitorRefinements";

/** One filter group a search ran with, as a chip. */
export interface CurrentRefinement {
  /** The group's first attribute. */
  readonly attribute: string;
  /** The published label of the attribute, else its default label. */
  readonly label: string;
  /** The group's values under `label`, e.g. "≤ 30,00 €" or "Nike or Puma". */
  readonly value: string;
  /** The whole group in words, e.g. "Price up to €30.00". */
  readonly text: string;
  /** The engine read it from the query, on the AI mode. */
  readonly detected: boolean;
  /** False for a detected group, an exclusion or a group mixing attributes. */
  readonly removable: boolean;
}

export interface CurrentRefinementsRenderState {
  /** The detected groups, then the visitor's in the request's order. */
  readonly items: readonly CurrentRefinement[];
}

export interface CurrentRefinementsConnector
  extends Connector<CurrentRefinementsRenderState> {
  /** Take a removable chip's filter off the search state; any other chip does nothing. */
  remove(chip: CurrentRefinement): void;
}

/** Alternatives of one attribute, which the visitor can take off as a whole. */
const isPickable = (group: readonly SearchFilter[]): boolean =>
  group.every(
    (filter) =>
      filter.attribute === group[0]?.attribute &&
      !("negated" in filter && filter.negated === true),
  );

const detectedGroups = (
  blocks: SearchResults["filters"],
): (readonly SearchFilter[])[] =>
  (blocks ?? [])
    .filter((block) => block.source === DETECTED_SOURCE)
    .flatMap((block) => [...block.facetFilters, ...block.numericFilters]);

const writingOf = (
  context: SearchContext,
  attributeLabels: SearchResults["attributeLabels"],
): FilterWriting => ({
  texts: context.texts,
  locale: `${context.language}-${context.country.toUpperCase()}`,
  currency: context.currency,
  labels: {
    ...Object.fromEntries(
      context.filterableAttributes.map(({ key, label }) => [key, label]),
    ),
    ...attributeLabels,
  },
});

const chipOf = (
  group: readonly SearchFilter[],
  writing: FilterWriting,
  removable: boolean,
): Omit<CurrentRefinement, "detected"> => {
  const attribute = group[0]?.attribute ?? "";

  return {
    attribute,
    label: filterFieldLabel(attribute, writing),
    value: filterGroupValue(group, writing),
    text: filterGroupText(group, writing),
    removable,
  };
};

/** The filter groups the products search ran with, as chips, and the action that takes one off. */
export function connectCurrentRefinements(
  controller: SearchController,
): CurrentRefinementsConnector {
  const entry = productsEntry(controller);
  // How each chip of the render state comes off.
  const removals = new WeakMap<CurrentRefinement, EntryChange>();

  const connector = createConnector(controller, {
    read: ({ searchState, results, context }) => {
      const { refinementList, range, filters } = entry.read(searchState);

      return [
        refinementList,
        range,
        filters,
        results.filters,
        results.attributeLabels,
        context,
      ] as const;
    },
    render: ([refinementList, range, filters, blocks, labels, context]) => {
      const writing = writingOf(context, labels);
      const detected = detectedGroups(blocks)
        .filter((group) => group.length > 0)
        .map((group) => ({ ...chipOf(group, writing, false), detected: true }));
      const visitor = visitorGroups(
        { query: "", refinementList, range, filters },
        attributeTypes(context.filterableAttributes),
      )
        .filter(({ group }) => group.length > 0)
        .map(({ group, without }) => {
          const chip = {
            ...chipOf(group, writing, isPickable(group)),
            detected: false,
          };
          removals.set(chip, without);

          return chip;
        });

      return { items: [...detected, ...visitor] };
    },
  });
  const { getRenderState, subscribe, dispose } = connector;

  return {
    getRenderState,
    subscribe,
    dispose,

    remove(chip) {
      const without = removals.get(chip);
      if (
        connector.disposed() ||
        !chip.removable ||
        without === undefined ||
        !getRenderState().items.includes(chip)
      ) {
        return;
      }
      entry.set(without(entry.read(controller.getSnapshot().searchState)));
    },
  };
}
