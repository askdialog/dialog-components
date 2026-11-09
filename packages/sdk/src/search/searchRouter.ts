import { attributeTypes, isFacetType } from "../utils/searchFilters";
import {
  createSearchURL,
  parseSearchURL,
  SearchRouteState,
  SearchRouting,
} from "./routeUrl";
import { readIndexState } from "./searchState";
import {
  FilterableAttribute,
  MerchantConfig,
  SearchContext,
  SearchControllerOptions,
  SearchState,
} from "./types";

/** Keeps a controller's products entry and the URL in step; does nothing without `routing`. */
export interface SearchRouter {
  /** The search state with the products entry's query, page and refinements read from the URL. */
  restore(searchState: SearchState): SearchState;
  /** Take the loaded attributes, and drop from the products entry the refinements they do not declare. */
  declare(
    searchState: SearchState,
    loaded: Pick<SearchContext, "filterableAttributes">,
  ): SearchState;
  /** Push the products entry's URL, or replace the current one when its query changed. */
  write(searchState: SearchState): void;
  /** Stop following back and forward. */
  stop(): void;
}

const NO_ROUTER: SearchRouter = {
  restore: (searchState) => searchState,
  declare: (searchState) => searchState,
  write: () => undefined,
  stop: () => undefined,
};

const declaredEntries = <T>(
  record: Readonly<Record<string, T>> | undefined,
  declared: (attribute: string) => boolean,
): Record<string, T> | undefined => {
  const entries = Object.entries(record ?? {}).filter(([attribute]) =>
    declared(attribute),
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

/** The route with only the refinements the attributes declare with their type. */
const declaredOnly = (
  { query, page, refinementList, range }: SearchRouteState,
  attributes: readonly FilterableAttribute[] | undefined,
): SearchRouteState => {
  if (attributes === undefined) {
    return { query, page, refinementList, range };
  }
  const typeOf = attributeTypes(attributes);

  return {
    query,
    page,
    refinementList: declaredEntries(refinementList, (attribute) =>
      isFacetType(typeOf.get(attribute)),
    ),
    range: declaredEntries(
      range,
      (attribute) => typeOf.get(attribute) === "number",
    ),
  };
};

const formatOf = (routing: true | SearchRouting): Required<SearchRouting> => ({
  createURL: createSearchURL,
  parseURL: parseSearchURL,
  ...(routing === true ? {} : routing),
});

// Unknown until the config is passed or loaded: the URL is then kept whole.
const passedAttributes = (
  config: MerchantConfig | undefined,
): readonly FilterableAttribute[] | undefined =>
  config === undefined
    ? undefined
    : (config.searchConfig?.filterableAttributes ?? []);

/** `onPop` gets the restore of the state back and forward lead to, to search it pushing nothing. */
export const createSearchRouter = (
  { routing, config }: Pick<SearchControllerOptions, "routing" | "config">,
  indexName: string,
  onPop: (restore: SearchRouter["restore"]) => void,
): SearchRouter => {
  if (routing === undefined || routing === false) {
    return NO_ROUTER;
  }
  if (typeof window === "undefined") {
    return NO_ROUTER;
  }
  const { createURL, parseURL } = formatOf(routing);
  let attributes = passedAttributes(config);

  const read = (): SearchRouteState =>
    declaredOnly(parseURL({ location: window.location }), attributes);
  const routeOf = (searchState: SearchState): SearchRouteState =>
    declaredOnly(readIndexState(searchState, indexName), attributes);
  const urlOf = (routeState: SearchRouteState): string =>
    new URL(
      createURL({ routeState, location: window.location }),
      window.location.href,
    ).href;
  const withRoute = (
    searchState: SearchState,
    route: SearchRouteState,
  ): SearchState => ({
    ...searchState,
    [indexName]: { ...readIndexState(searchState, indexName), ...route },
  });

  const restore = (searchState: SearchState): SearchState =>
    withRoute(searchState, read());
  const onPopState = (): void => {
    onPop(restore);
  };
  window.addEventListener("popstate", onPopState);

  return {
    restore,
    declare(searchState, { filterableAttributes }) {
      attributes = filterableAttributes;

      return withRoute(searchState, routeOf(searchState));
    },
    write(searchState) {
      const route = routeOf(searchState);
      const query = route.query.trim();
      const current = read();
      const url = urlOf({ ...route, query });
      if (url === urlOf(current)) {
        return;
      }
      if (query === current.query) {
        window.history.pushState(null, "", url);
      } else {
        window.history.replaceState(window.history.state, "", url);
      }
    },
    stop() {
      window.removeEventListener("popstate", onPopState);
    },
  };
};
