import {
  createSearchController,
  registerDialogInstallation,
  type Dialog,
  type SearchController,
  type SearchControllerState,
  type SearchHit,
  type SearchSurface,
} from "@askdialog/dialog-sdk";
import { onMounted, onUnmounted, shallowRef, type ShallowRef } from "vue";

export interface UseDialogSearchOptions {
  client: Dialog;
  /** Where the results are displayed, for search analytics. */
  surface?: SearchSurface;
  /** Router adapter called after selection attribution; omit to let the cards' `<a href>` navigate natively. */
  navigate?: (url: string, hit: SearchHit) => void;
  debounceMs?: number;
  hitsPerPage?: number;
  /** Storefront locale for the searched index (`products_fr`); defaults to the client's. */
  locale?: string;
}

export interface DialogSearch {
  controller: SearchController;
  state: Readonly<ShallowRef<SearchControllerState>>;
}

/** Options are read once during setup — later changes don't rebind the live controller. */
export const useDialogSearch = (
  options: UseDialogSearchOptions,
): DialogSearch => {
  const {
    client,
    surface = "search_page",
    locale = client.locale,
    ...rest
  } = options;
  const controller = createSearchController({
    search: (request, requestOptions) => client.search(request, requestOptions),
    locale,
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

  return { controller, state };
};
