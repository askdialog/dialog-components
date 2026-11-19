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
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRecreatableController } from "./recreatableController";

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
  state: DialogSearchState;
  /** The client's theme, for `DialogSearchResults`. */
  theme: Theme;
}

const createController = ({
  client,
  surface = "search_page",
  mode,
  transport,
  ...rest
}: UseDialogSearchOptions): SearchController =>
  createSearchController({
    mode,
    transport:
      transport ??
      (mode === "ai"
        ? undefined
        : (request, requestOptions) => client.search(request, requestOptions)),
    // The controller loads the merchant's config at the first open or search.
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

/** Options are fixed when the controller is created. */
export const useDialogSearch = (
  options: UseDialogSearchOptions,
): DialogSearch => {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [controller] = useState(() =>
    createRecreatableController(() => createController(optionsRef.current)),
  );

  useEffect(() => {
    controller.revive();
    registerDialogInstallation({
      method: "react",
      version:
        typeof __DIALOG_REACT_VERSION__ === "undefined"
          ? undefined
          : __DIALOG_REACT_VERSION__,
    });

    return () => controller.dispose();
  }, [controller]);

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  return { controller, state, theme: options.client.theme };
};
