import { loadDialogConfig } from "../services/dialogConfig";
import { loadSearchConfig } from "../services/searchConfig";
import { getSearchTexts } from "../utils/searchTexts";
import {
  FilterableAttribute,
  MerchantConfig,
  SearchContext,
  SearchControllerOptions,
} from "./types";

/** Filterable on every products entry, outside the merchant's published attributes. */
export const PRICE_ATTRIBUTE = "price";

// One load per API key and language, shared by the page's controllers.
const loads = new Map<string, Promise<MerchantConfig>>();

const settled = <T>(result: PromiseSettledResult<T>): T | undefined =>
  result.status === "fulfilled" ? result.value : undefined;

/** The dialog config and the search config; a failed part stays undefined. */
const loadMerchantConfig = (
  apiKey: string,
  language: string,
): Promise<MerchantConfig> => {
  const key = `${apiKey}:${language}`;
  let load = loads.get(key);
  if (load === undefined) {
    load = Promise.allSettled([
      loadDialogConfig(apiKey, language),
      loadSearchConfig(apiKey, language),
    ]).then(([dialogConfig, searchConfig]) => {
      if (
        dialogConfig.status === "rejected" ||
        searchConfig.status === "rejected"
      ) {
        loads.delete(key); // A later controller loads again.
      }

      return {
        businessRanking: settled(dialogConfig)?.searchBusinessRanking,
        searchConfig: settled(searchConfig),
      };
    });
    loads.set(key, load);
  }

  return load;
};

const fromConfig = (
  config: MerchantConfig,
): Pick<SearchContext, "businessRanking" | "filterableAttributes"> => ({
  businessRanking: config.businessRanking,
  filterableAttributes: config.searchConfig?.filterableAttributes ?? [],
});

/**
 * A loaded search config's attributes, then `price` as a number, so a range
 * on it is sent; a `price` the config publishes gives way to it.
 */
const withPrice = (
  config: MerchantConfig,
  label: string,
): MerchantConfig => {
  const { searchConfig } = config;
  if (searchConfig === undefined) {
    return config;
  }
  const price: FilterableAttribute = {
    key: PRICE_ATTRIBUTE,
    label,
    type: "number",
    values: [],
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

/** The initial context, and `load`, which loads the config at its first call unless passed in. */
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
  load: (onLoaded: (loaded: Partial<SearchContext>) => void) => void;
} => {
  let loading = config !== undefined;
  const searchTexts = getSearchTexts(
    `${language}-${country.toUpperCase()}`,
    texts,
  );

  return {
    context: {
      mode,
      language,
      country,
      currency,
      ...fromConfig(config ?? {}),
      texts: searchTexts,
      storefrontRoot,
    },
    load(onLoaded) {
      if (loading || apiKey === undefined) {
        return;
      }
      loading = true;
      void loadMerchantConfig(apiKey, language).then((loaded) => {
        onLoaded(fromConfig(withPrice(loaded, searchTexts.filterFields.price)));
      });
    },
  };
};
