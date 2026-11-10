import { loadDialogConfig } from "../services/dialogConfig";
import { loadSearchConfig } from "../services/searchConfig";
import { SearchBusinessRanking } from "../types/dialogConfig";
import { getSearchTexts } from "../utils/searchTexts";
import {
  storedMerchantConfig,
  storeMerchantConfig,
} from "./merchantConfigStorage";
import {
  FilterableAttribute,
  MerchantConfig,
  SearchConfig,
  SearchContext,
  SearchControllerOptions,
} from "./types";

export { storedMerchantConfig } from "./merchantConfigStorage";

/** Filterable on every products entry, outside the merchant's published attributes. */
export const PRICE_ATTRIBUTE = "price";

// One load per API key and language, shared by the page's controllers.
const loads = new Map<string, Promise<MerchantConfig>>();

/**
 * A loaded search config's attributes, then `price` as a number, so a range
 * on it is sent; a `price` the config publishes gives way to it, keeping
 * its `showInSearch: false`.
 */
const withPrice = (config: MerchantConfig, label: string): MerchantConfig => {
  const { searchConfig } = config;
  if (searchConfig === undefined) {
    return config;
  }
  const served = searchConfig.filterableAttributes.find(
    ({ key }) => key === PRICE_ATTRIBUTE,
  );
  const price: FilterableAttribute = {
    key: PRICE_ATTRIBUTE,
    label,
    type: "number",
    values: [],
    // The merchant's choice to hide it from the search page stands.
    ...(served?.showInSearch === false ? { showInSearch: false } : {}),
  };

  return {
    ...config,
    searchConfig: {
      ...searchConfig,
      filterableAttributes: [
        ...searchConfig.filterableAttributes.filter(
          ({ key }) => key !== PRICE_ATTRIBUTE,
        ),
        price,
      ],
    },
  };
};

// A part that failed keeps the session's copy, else stays undefined.
const merge = (
  [dialogConfig, searchConfig]: [
    PromiseSettledResult<{ searchBusinessRanking?: SearchBusinessRanking }>,
    PromiseSettledResult<SearchConfig>,
  ],
  stored: MerchantConfig | undefined,
): MerchantConfig => ({
  businessRanking:
    dialogConfig.status === "fulfilled"
      ? dialogConfig.value.searchBusinessRanking
      : stored?.businessRanking,
  searchConfig:
    searchConfig.status === "fulfilled"
      ? searchConfig.value
      : stored?.searchConfig,
});

/**
 * The dialog config and the search config, both checked, `price` added as a
 * number attribute labelled in `language`, loaded once per page and kept for
 * the session. A part whose loading fails keeps the session's copy, else
 * stays undefined; it is loaded again at the next call.
 */
export const loadMerchantConfig = (
  apiKey: string,
  language: string,
): Promise<MerchantConfig> => {
  const key = `${apiKey}:${language}`;
  let load = loads.get(key);
  if (load === undefined) {
    load = Promise.allSettled([
      loadDialogConfig(apiKey, language),
      loadSearchConfig(apiKey, language),
    ]).then((settled) => {
      if (settled.some(({ status }) => status === "rejected")) {
        loads.delete(key); // A later call loads again.
      }
      const loaded = withPrice(
        merge(settled, storedMerchantConfig(apiKey, language)),
        getSearchTexts(language).filterFields.price,
      );
      storeMerchantConfig(apiKey, language, loaded);

      return loaded;
    });
    loads.set(key, load);
  }

  return load;
};

type LoadedContext = Pick<
  SearchContext,
  "businessRanking" | "filterableAttributes" | "appearance"
>;

const fromConfig = (config: MerchantConfig): LoadedContext => ({
  businessRanking: config.businessRanking,
  filterableAttributes: config.searchConfig?.filterableAttributes ?? [],
  appearance: config.searchConfig?.appearance ?? {},
});

type MerchantContextOptions = Pick<
  SearchControllerOptions,
  | "mode"
  | "apiKey"
  | "config"
  | "texts"
  | "language"
  | "country"
  | "currency"
  | "storefrontRoot"
>;

/**
 * The initial context, from the passed config as it is, else the session's
 * copy, and `load`, which loads the config at its first call unless passed in.
 * A loaded or stored config's price takes the label of the controller's texts.
 */
export const createMerchantContext = ({
  mode = "lexical",
  apiKey,
  config,
  texts,
  language,
  country,
  currency,
  storefrontRoot = "/",
}: MerchantContextOptions): {
  context: SearchContext;
  load: (onLoaded: (loaded: LoadedContext) => void) => void;
} => {
  let loading = config !== undefined;
  const searchTexts = getSearchTexts(
    `${language}-${country.toUpperCase()}`,
    texts,
  );
  const fromLoaded = (loaded: MerchantConfig): ReturnType<typeof fromConfig> =>
    fromConfig(withPrice(loaded, searchTexts.filterFields.price));
  const stored =
    config !== undefined || apiKey === undefined
      ? undefined
      : storedMerchantConfig(apiKey, language);

  return {
    context: {
      mode,
      language,
      country,
      currency,
      ...(stored === undefined ? fromConfig(config ?? {}) : fromLoaded(stored)),
      texts: searchTexts,
      storefrontRoot,
    },
    load(onLoaded) {
      if (loading || apiKey === undefined) {
        return;
      }
      loading = true;
      void loadMerchantConfig(apiKey, language).then((loaded) => {
        onLoaded(fromLoaded(loaded));
      });
    },
  };
};
