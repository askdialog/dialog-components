import {
  createSearchController,
  registerDialogInstallation,
  type Dialog,
  type SearchController,
  type SearchControllerState,
  type SearchHit,
  type SearchSection,
  type SearchSurface,
  type Theme,
} from "@askdialog/dialog-sdk";
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue";

export interface UseDialogSearchOptions {
  client: Dialog;
  /** Lowercase ISO 639-1 language code, e.g. `fr`. */
  language: string;
  /** ISO 4217 currency, independent of language. */
  currency: string;
  /** UI surface used in search analytics. */
  surface?: SearchSurface;
  /** Navigate after recording selection; omit to use native links. */
  navigate?: (url: string, hit: SearchHit) => void;
  debounceMs?: number;
  hitsPerPage?: number;
  /**
   * Extra indices searched alongside the products, e.g. `[{ index: 'collections', hitsPerPage: 5 }]`.
   * Only request an index the catalog exposes: a missing one fails the whole search.
   */
  sections?: readonly SearchSection[];
}

export interface DialogSearch {
  controller: SearchController;
  state: Readonly<ShallowRef<SearchControllerState>>;
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
    },
    ...rest,
  });

  const state = shallowRef(controller.getState());
  const unsubscribe = controller.subscribe(() => {
    state.value = controller.getState();
  });

  onMounted(() => {
    registerDialogInstallation({
      method: "vue",
      version:
        typeof __DIALOG_VUE_VERSION__ === "undefined"
          ? undefined
          : __DIALOG_VUE_VERSION__,
    });
  });

  onUnmounted(() => {
    unsubscribe();
    controller.dispose();
  });

  return { controller, state, theme: client.theme };
};
