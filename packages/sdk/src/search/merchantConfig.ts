import { loadDialogConfig } from "../services/dialogConfig";
import { loadSearchConfig } from "../services/searchConfig";
import { getSearchTexts } from "../utils/searchTexts";
import {
  MerchantConfig,
  SearchContext,
  SearchControllerOptions,
} from "./types";

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

type MerchantContextOptions = Pick<
  SearchControllerOptions,
  "apiKey" | "config" | "texts" | "language" | "country" | "storefrontRoot"
>;

/** The initial context, and `load`, which loads the config at its first call unless passed in. */
export const createMerchantContext = ({
  apiKey,
  config,
  texts,
  language,
  country,
  storefrontRoot = "/",
}: MerchantContextOptions): {
  context: SearchContext;
  load: (onLoaded: (loaded: Partial<SearchContext>) => void) => void;
} => {
  let loading = config !== undefined;

  return {
    context: {
      language,
      country,
      ...fromConfig(config ?? {}),
      texts: getSearchTexts(`${language}-${country.toUpperCase()}`, texts),
      storefrontRoot,
    },
    load(onLoaded) {
      if (loading || apiKey === undefined) {
        return;
      }
      loading = true;
      void loadMerchantConfig(apiKey, language).then((loaded) => {
        onLoaded(fromConfig(loaded));
      });
    },
  };
};
