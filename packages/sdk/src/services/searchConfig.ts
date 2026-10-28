import { config } from "../config";
import { SearchConfig } from "../search/types";
import { toSearchError } from "./searchError";

const SEARCH_CONFIG_PATH = "/public/search/config";
const API_KEY_HEADER = "x-dialog-api-key";

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

  return (await response.json()) as SearchConfig;
};
