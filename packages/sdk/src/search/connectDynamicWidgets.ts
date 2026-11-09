import { Connector, createConnector } from "./connector";
import { PRICE_ATTRIBUTE } from "./merchantConfig";
import { FilterableAttribute, SearchController } from "./types";

export interface DynamicWidgetsRenderState {
  /**
   * The attributes a filters UI gives a section: the keyword ones with values,
   * in the search config's order, then `price` when declared as a number.
   * None until the config loads.
   */
  readonly attributesToRender: readonly string[];
}

export type DynamicWidgetsConnector = Connector<DynamicWidgetsRenderState>;

const isShown = ({ showInSearch }: FilterableAttribute): boolean =>
  showInSearch !== false;

/**
 * The attributes to render: a keyword attribute with values, the merchant not
 * hiding it from the search page, then the price; boolean and date ones left out.
 */
export const attributesToRender = (
  attributes: readonly FilterableAttribute[],
): string[] => {
  const shown = attributes.filter(isShown);
  const keywords = shown
    .filter(({ type, values }) => type === "keyword" && values.length > 0)
    .map(({ key }) => key);
  const hasPrice = shown.some(
    ({ key, type }) => key === PRICE_ATTRIBUTE && type === "number",
  );

  return hasPrice ? [...keywords, PRICE_ATTRIBUTE] : keywords;
};

/** The search config's attributes a filters UI renders a section for, in order. */
export function connectDynamicWidgets(
  controller: SearchController,
): DynamicWidgetsConnector {
  const { getRenderState, subscribe, dispose } = createConnector(controller, {
    read: ({ context }) => [context.filterableAttributes] as const,
    render: ([attributes]) => ({
      attributesToRender: attributesToRender(attributes),
    }),
  });

  return { getRenderState, subscribe, dispose };
}
