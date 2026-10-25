import {
  createSearchController,
  registerDialogInstallation,
  type Dialog,
  type SearchBusinessRanking,
  type SearchController,
  type SearchControllerState,
  type SearchProductHit,
  type SearchSection,
  type SearchSurface,
  type Theme,
} from "@askdialog/dialog-sdk";
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue";

export interface UseDialogSearchOptions {
  client: Dialog;
  /** Lowercase ISO 639-1 language code, e.g. `fr`. */
  language: string;
  /** Shopper's ISO 3166-1 alpha-2 country, e.g. `BE`; prices follow its market. */
  country: string;
  /** UI surface used in search analytics. */
  surface?: SearchSurface;
  /** Navigate after recording selection; omit to use native links. */
  navigate?: (url: string, hit: SearchProductHit) => void;
  /** Build a product's link when its hit has no `url`, e.g. `/products/${hit.handle}`. */
  buildProductUrl?: (hit: SearchProductHit) => string | undefined;
  debounceMs?: number;
  hitsPerPage?: number;
  /**
   * Extra indices searched alongside the products, e.g. `[{ index: 'collections', hitsPerPage: 5 }]`.
   * Only request an index the catalog exposes: a missing one fails the whole search.
   */
  sections?: readonly SearchSection[];
}

/** The controller state plus the merchant's business ranking, read from the dialog config. */
export type DialogSearchState = SearchControllerState & {
  businessRanking?: SearchBusinessRanking;
};

export interface DialogSearch {
  controller: SearchController;
  state: Readonly<ShallowRef<DialogSearchState>>;
  /** The client's theme, for `DialogSearchResults`. */
  theme: Theme;
}

/** Options are fixed when the controller is created. */
export const useDialogSearch = (
  options: UseDialogSearchOptions,
): DialogSearch => {
  const { client, surface = "search_page", ...rest } = options;
  const controller = createSearchController({
    search: (request, requestOptions) => client.search(request, requestOptions),
    analytics: {
      surface,
      trackViewSearchResults: (params) => client.trackViewSearchResults(params),
      trackSelectSearchResult: (params) =>
        client.trackSelectSearchResult(params),
      trackOpenedSearch: (params) => client.trackOpenedSearch(params),
    },
    ...rest,
  });

  let businessRanking: SearchBusinessRanking | undefined;
  const state = shallowRef<DialogSearchState>(controller.getState());
  const unsubscribe = controller.subscribe(() => {
    state.value = { ...controller.getState(), businessRanking };
  });

  let active = true;

  onMounted(() => {
    client
      .getDialogConfig()
      .then((config) => {
        if (active) {
          businessRanking = config.searchBusinessRanking;
          state.value = { ...state.value, businessRanking };
        }
      })
      // Without the config the empty-query products keep the default title.
      .catch(() => undefined);
    registerDialogInstallation({
      method: "vue",
      version:
        typeof __DIALOG_VUE_VERSION__ === "undefined"
          ? undefined
          : __DIALOG_VUE_VERSION__,
    });
  });

  onUnmounted(() => {
    active = false;
    unsubscribe();
    controller.dispose();
  });

  return { controller, state, theme: client.theme };
};
