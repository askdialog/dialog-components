import {
  createSearchController,
  registerDialogInstallation,
  type Dialog,
  type SearchController,
  type SearchControllerOptions,
  type SearchSnapshot,
  type SearchSurface,
  type Theme,
} from "@askdialog/dialog-sdk";
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue";

export interface UseDialogSearchOptions
  extends Omit<SearchControllerOptions, "apiKey" | "analytics"> {
  client: Dialog;
  /** UI surface used in search analytics. */
  surface?: SearchSurface;
}

/** The controller's snapshot: search state, results and context. */
export type DialogSearchState = SearchSnapshot;

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
  const { client, surface = "search_page", mode, transport, ...rest } = options;
  const controller = createSearchController({
    mode,
    transport:
      transport ??
      (mode === "ai"
        ? undefined
        : (request, requestOptions) => client.search(request, requestOptions)),
    // The controller loads the merchant's business ranking at the first open or search.
    apiKey: client.apiKey,
    analytics: {
      surface,
      trackViewSearchResults: (params) => client.trackViewSearchResults(params),
      trackSelectSearchResult: (params) =>
        client.trackSelectSearchResult(params),
      trackOpenedSearch: (params) => client.trackOpenedSearch(params),
    },
    ...rest,
  });

  const state = shallowRef(controller.getSnapshot());
  const unsubscribe = controller.subscribe((snapshot) => {
    state.value = snapshot;
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
