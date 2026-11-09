import { IndexSearchState } from "./types";

/** The part of the products entry the URL carries. */
export interface SearchRouteState {
  readonly query: string;
  /** Zero-based. */
  readonly page: number;
  readonly refinementList?: IndexSearchState["refinementList"];
  readonly range?: IndexSearchState["range"];
}

/** Another URL format for `routing`: each function absent keeps the default one. */
export interface SearchRouting {
  /** The URL of a route state, absolute or relative to `location`. */
  createURL?: (args: {
    routeState: SearchRouteState;
    location: Location;
  }) => string;
  /**
   * The route state a location describes. The controller then drops the
   * attributes the search config does not declare.
   */
  parseURL?: (args: { location: Location }) => SearchRouteState;
}

type RangeBounds = NonNullable<IndexSearchState["range"]>[string];

const QUERY_PARAM = "q";
const PAGE_PARAM = "page";
const FILTER_PREFIX = "f.";
const PRICE_PARAM = "price";
const PRICE_ATTRIBUTE = "price";
const PRICE_PATTERN = /^(\d+(?:\.\d+)?)?:(\d+(?:\.\d+)?)?$/;

const readPage = (value: string | null): number => {
  const page = Number(value);

  return Number.isInteger(page) && page > 1 ? page - 1 : 0;
};

const toBound = (amount: string | undefined): number | "" =>
  amount === undefined ? "" : Number(amount);

/** `<min>:<max>`, either side empty; malformed, both empty or reversed is none. */
const readPrice = (value: string | null): RangeBounds | undefined => {
  const match = value === null ? null : PRICE_PATTERN.exec(value);
  if (match === null) {
    return undefined;
  }
  const min = toBound(match[1]);
  const max = toBound(match[2]);
  if ((min === "" && max === "") || (min !== "" && max !== "" && min > max)) {
    return undefined;
  }

  return `${min}:${max}`;
};

const readRefinementList = (
  params: URLSearchParams,
): Record<string, string[]> | undefined => {
  const values = new Map<string, Set<string>>();
  for (const [name, value] of params) {
    const attribute = name.slice(FILTER_PREFIX.length);
    if (name.startsWith(FILTER_PREFIX) && attribute !== "" && value !== "") {
      values.set(attribute, (values.get(attribute) ?? new Set()).add(value));
    }
  }

  return values.size === 0
    ? undefined
    : Object.fromEntries(
        [...values].map(([attribute, set]) => [attribute, [...set]]),
      );
};

/**
 * The default format: `q`, `page` (1-indexed), `f.<attribute>=<value>` once
 * per value and `price=<min>:<max>`.
 */
export const parseSearchURL = ({
  location,
}: {
  location: Location;
}): SearchRouteState => {
  const params = new URLSearchParams(location.search);
  const price = readPrice(params.get(PRICE_PARAM));

  return {
    query: params.get(QUERY_PARAM)?.trim() ?? "",
    page: readPage(params.get(PAGE_PARAM)),
    refinementList: readRefinementList(params),
    range: price === undefined ? undefined : { [PRICE_ATTRIBUTE]: price },
  };
};

const deleteFilterParams = (params: URLSearchParams): void => {
  for (const name of [...params.keys()]) {
    if (name.startsWith(FILTER_PREFIX)) {
      params.delete(name);
    }
  }
  params.delete(PRICE_PARAM);
};

const writeRefinements = (
  params: URLSearchParams,
  { refinementList = {}, range = {} }: SearchRouteState,
): void => {
  deleteFilterParams(params);
  for (const [attribute, values] of Object.entries(refinementList)) {
    for (const value of values) {
      params.append(`${FILTER_PREFIX}${attribute}`, value);
    }
  }
  if (PRICE_ATTRIBUTE in range) {
    params.set(PRICE_PARAM, range[PRICE_ATTRIBUTE]);
  }
};

/** The default format, keeping the location's other params and its hash; page 1 and an empty query are left out. */
export const createSearchURL = ({
  routeState,
  location,
}: {
  routeState: SearchRouteState;
  location: Location;
}): string => {
  const params = new URLSearchParams(location.search);
  if (routeState.query === "") {
    params.delete(QUERY_PARAM);
  } else {
    params.set(QUERY_PARAM, routeState.query);
  }
  if (routeState.page > 0) {
    params.set(PAGE_PARAM, String(routeState.page + 1));
  } else {
    params.delete(PAGE_PARAM);
  }
  writeRefinements(params, routeState);
  const search = params.toString();

  return `${location.pathname}${search === "" ? "" : `?${search}`}${location.hash}`;
};
