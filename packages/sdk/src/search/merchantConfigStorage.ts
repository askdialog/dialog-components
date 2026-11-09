import { readSearchConfig } from "../services/searchConfig";
import { SearchBusinessRanking } from "../types/dialogConfig";
import { isRecord } from "../utils/isRecord";
import { MerchantConfig } from "./types";

const STORAGE_KEY_PREFIX = "dialog-search-config";
const BUSINESS_RANKINGS: ReadonlySet<unknown> = new Set<SearchBusinessRanking>([
  "best_sellers",
  "newest",
  "price_asc",
  "price_desc",
]);

const storageKey = (apiKey: string, language: string): string =>
  `${STORAGE_KEY_PREFIX}:${apiKey}:${language}`;

const readMerchantConfig = (value: unknown): MerchantConfig => {
  const { businessRanking, searchConfig } = isRecord(value) ? value : {};

  return {
    businessRanking: BUSINESS_RANKINGS.has(businessRanking)
      ? (businessRanking as SearchBusinessRanking)
      : undefined,
    searchConfig:
      searchConfig === undefined ? undefined : readSearchConfig(searchConfig),
  };
};

/**
 * The config the last load of the session kept, checked again; undefined
 * before any load, or when the session storage is disabled.
 */
export const storedMerchantConfig = (
  apiKey: string,
  language: string,
): MerchantConfig | undefined => {
  try {
    const stored = sessionStorage.getItem(storageKey(apiKey, language));

    return stored === null
      ? undefined
      : readMerchantConfig(JSON.parse(stored) as unknown);
  } catch {
    return undefined;
  }
};

export const storeMerchantConfig = (
  apiKey: string,
  language: string,
  merchantConfig: MerchantConfig,
): void => {
  try {
    sessionStorage.setItem(
      storageKey(apiKey, language),
      JSON.stringify(merchantConfig),
    );
  } catch {
    // Disabled or full: the next page waits for its own load.
  }
};
