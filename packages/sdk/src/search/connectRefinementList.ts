import { SearchFilterBlock } from "../types/aiSearch";
import { pickedAttribute, withKey } from "../utils/searchStateFilters";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController } from "./types";

export const DETECTED_SOURCE = "query_constructor";
const NO_VALUES: readonly string[] = [];

export interface RefinementListItem {
  readonly value: string;
  readonly isRefined: boolean;
}

export interface RefinementListRenderState {
  readonly attribute: string;
  /** The search config's label; the attribute until the config loads. */
  readonly label: string;
  /** The search config's values in its order; none until the config loads. */
  readonly items: readonly RefinementListItem[];
}

export interface RefinementListConnector
  extends Connector<RefinementListRenderState> {
  /** Check or uncheck a value, starting from the values shown checked. */
  refine(value: string): void;
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

/** The search config's values of one attribute, checked or not, and the action that toggles one. */
export function connectRefinementList(
  controller: SearchController,
  { attribute }: { attribute: string },
): RefinementListConnector {
  const entry = productsEntry(controller);
  const connector = createConnector(controller, {
    read: ({ searchState, results, context }) =>
      [
        context.filterableAttributes.find(({ key }) => key === attribute),
        entry.read(searchState).refinementList?.[attribute],
        results.filters,
      ] as const,
    render: ([config, picked, blocks]) => {
      const checked = checkedValues(picked, detectedValues(blocks, attribute));

      return {
        attribute,
        label: config?.label ?? attribute,
        items: (config?.values ?? NO_VALUES).map((value) => ({
          value,
          isRefined: checked.includes(value),
        })),
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
  };
}
