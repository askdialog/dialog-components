import { config } from "../config";
import { FilterableAttribute, SearchConfig } from "../search/types";
import { isRecord } from "../utils/isRecord";
import { readSearchAppearance } from "../utils/searchAppearance";
import { toSearchError } from "./searchError";

const SEARCH_CONFIG_PATH = "/public/search/config";
const API_KEY_HEADER = "x-dialog-api-key";

const ATTRIBUTE_TYPES: ReadonlySet<unknown> = new Set<
  FilterableAttribute["type"]
>(["keyword", "number", "boolean", "date"]);

const isFilterableAttribute = (value: unknown): value is FilterableAttribute =>
  isRecord(value) &&
  typeof value.key === "string" &&
  typeof value.label === "string" &&
  ATTRIBUTE_TYPES.has(value.type) &&
  Array.isArray(value.values) &&
  value.values.every((item) => typeof item === "string") &&
  (value.showInSearch === undefined || typeof value.showInSearch === "boolean");

/**
 * The config's well-formed parts: a malformed attribute or appearance key is
 * dropped on its own, an absent appearance reads as `{}`.
 */
export const readSearchConfig = (body: unknown): SearchConfig => {
  const { filterableAttributes, appearance } = isRecord(body) ? body : {};

  return {
    filterableAttributes: Array.isArray(filterableAttributes)
      ? filterableAttributes.filter(isFilterableAttribute)
      : [],
    appearance: readSearchAppearance(appearance),
  };
};

/** The merchant's storefront search config for a lowercase ISO 639-1 language. */
export const loadSearchConfig = async (
  apiKey: string,
  language: string,
  signal?: AbortSignal,
): Promise<SearchConfig> => {
  const query = new URLSearchParams({ language });
  const response = await fetch(
    `${config.monolithApiUrl}${SEARCH_CONFIG_PATH}?${query.toString()}`,
    { headers: { [API_KEY_HEADER]: apiKey }, signal },
  );
  if (!response.ok) {
    throw await toSearchError(response);
  }

  return readSearchConfig(await response.json());
};
