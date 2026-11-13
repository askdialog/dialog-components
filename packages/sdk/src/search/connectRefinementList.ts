import { SearchFilterBlock } from "../types/aiSearch";
import { pickedAttribute, withKey } from "../utils/searchStateFilters";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController } from "./types";

export const DETECTED_SOURCE = "query_constructor";
const NO_VALUES: readonly string[] = [];
/** A fold hiding fewer values than this shows them all. */
const MIN_FOLDED = 2;

export interface RefinementListItem {
  readonly value: string;
  readonly isRefined: boolean;
  /**
   * Products the value would give, with the controller's `facets` option, once
   * the last search's counts hold the attribute; 0 only on a checked value.
   */
  readonly count?: number;
}

export interface RefinementListRenderState {
  readonly attribute: string;
  /** The search config's label; the attribute until the config loads. */
  readonly label: string;
  /**
   * The search config's values in its order; none until the config loads.
   * When the last search's counts hold the attribute, only the values with a
   * result, and the checked ones. Folded, the first `limit` of them and every
   * checked one further down.
   */
  readonly items: readonly RefinementListItem[];
  /** The visitor unfolded the values. */
  readonly isShowingMore: boolean;
  /** The fold hides values, or would once folded again: show the toggle. */
  readonly canToggleShowMore: boolean;
  /** How many values the fold hides, e.g. for "See more (n)"; 0 when it hides none. */
  readonly foldedCount: number;
}

export interface RefinementListOptions {
  readonly attribute: string;
  /** The values shown while folded; without it, every value shows. */
  readonly limit?: number;
}

export interface RefinementListConnector
  extends Connector<RefinementListRenderState> {
  /** Check or uncheck a value, starting from the values shown checked. */
  refine(value: string): void;
  /** Unfold the values, or fold them again. */
  toggleShowMore(): void;
}

/**
 * The values the engine read from the query on one attribute: groups of that
 * attribute alone, an exclusion left out, as the visitor can pick them.
 */
export const detectedValues = (
  blocks: readonly SearchFilterBlock[] | undefined,
  attribute: string,
): readonly string[] =>
  (blocks ?? [])
    .filter((block) => block.source === DETECTED_SOURCE)
    .flatMap((block) => block.facetFilters)
    .filter((group) => pickedAttribute(group) === attribute)
    .flat()
    .map((filter) => filter.value);

/**
 * The visitor's values, else, on an AI result, the ones the engine detected. An
 * attribute the visitor emptied keeps `[]`, so a detected value can be unchecked.
 */
export const checkedValues = (
  picked: readonly string[] | undefined,
  detected: readonly string[],
): readonly string[] => picked ?? detected;

const toggled = (values: readonly string[], value: string): string[] =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

/**
 * The values shown folded: the first `limit`, and every checked one further
 * down in its place; all of them when the fold would hide fewer than 2.
 */
export const foldedValues = (
  values: readonly string[],
  checked: readonly string[],
  limit: number | undefined,
): readonly string[] => {
  if (limit === undefined) {
    return values;
  }
  const shown = values.filter(
    (value, index) => index < limit || checked.includes(value),
  );

  return values.length - shown.length < MIN_FOLDED ? values : shown;
};

/**
 * The values offered: the search config's, and, when the counts hold the
 * attribute, those with a result or checked, each with its count.
 */
export const offeredValues = (
  values: readonly string[],
  checked: readonly string[],
  counts: Readonly<Record<string, number>> | undefined,
): readonly { value: string; count?: number }[] =>
  counts === undefined
    ? values.map((value) => ({ value }))
    : values
        .map((value) => ({ value, count: counts[value] ?? 0 }))
        .filter(({ value, count }) => count > 0 || checked.includes(value));

/** The search config's values of one attribute, checked or not, folded past `limit`, and the actions that toggle a value or the fold. */
export function connectRefinementList(
  controller: SearchController,
  { attribute, limit }: RefinementListOptions,
): RefinementListConnector {
  const entry = productsEntry(controller);
  let isShowingMore = false;
  const connector = createConnector(controller, {
    read: ({ searchState, results, context }) =>
      [
        context.filterableAttributes.find(({ key }) => key === attribute),
        entry.read(searchState).refinementList?.[attribute],
        results.filters,
        results.facets?.[attribute],
        isShowingMore,
      ] as const,
    render: ([config, picked, blocks, counts, showingMore]) => {
      const checked = checkedValues(picked, detectedValues(blocks, attribute));
      const offered = offeredValues(
        config?.values ?? NO_VALUES,
        checked,
        counts,
      );
      const values = offered.map(({ value }) => value);
      const folded = foldedValues(values, checked, limit);
      const foldedCount = values.length - folded.length;
      const shown = showingMore
        ? offered
        : offered.filter(({ value }) => folded.includes(value));

      return {
        attribute,
        label: config?.label ?? attribute,
        items: shown.map(({ value, count }) => ({
          value,
          isRefined: checked.includes(value),
          ...(count === undefined ? {} : { count }),
        })),
        isShowingMore: showingMore,
        canToggleShowMore: foldedCount > 0,
        foldedCount,
      };
    },
  });
  const { getRenderState, subscribe, dispose } = connector;

  return {
    getRenderState,
    subscribe,
    dispose,

    refine(value) {
      if (connector.disposed()) {
        return;
      }
      const { searchState, results } = controller.getSnapshot();
      const { refinementList } = entry.read(searchState);
      const detected = detectedValues(results.filters, attribute);
      const values = toggled(
        checkedValues(refinementList?.[attribute], detected),
        value,
      );
      // Without a detected value to hide, an emptied attribute leaves the search state.
      const kept = values.length > 0 || detected.length > 0;
      entry.set({
        refinementList: withKey(
          refinementList,
          attribute,
          kept ? values : undefined,
        ),
      });
    },

    toggleShowMore() {
      if (connector.disposed() || !getRenderState().canToggleShowMore) {
        return;
      }
      isShowingMore = !isShowingMore;
      connector.refresh();
    },
  };
}
