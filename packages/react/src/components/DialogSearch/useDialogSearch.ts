import {
  createSearchController,
  registerDialogInstallation,
  SearchStatus,
  type Dialog,
  type SearchController,
  type SearchControllerState,
  type SearchHit,
  type SearchSurface,
} from "@askdialog/dialog-sdk";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

export interface UseDialogSearchOptions {
  client: Dialog;
  /** Where the results are displayed, for search analytics. */
  surface?: SearchSurface;
  /** Router adapter called after selection attribution; omit to let the cards' `<a href>` navigate natively. */
  navigate?: (url: string, hit: SearchHit) => void;
  debounceMs?: number;
  hitsPerPage?: number;
}

export interface DialogSearch {
  controller: SearchController;
  state: SearchControllerState;
}

const SERVER_SNAPSHOT: SearchControllerState = {
  status: SearchStatus.IDLE,
  query: "",
  page: 0,
};

/** Options are read when the controller is created — later changes don't rebind a live controller. */
export const useDialogSearch = (
  options: UseDialogSearchOptions,
): DialogSearch => {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const controllerRef = useRef<SearchController | undefined>(undefined);

  const getController = useCallback((): SearchController => {
    if (controllerRef.current === undefined) {
      const { client, surface = "search_page", ...rest } = optionsRef.current;
      controllerRef.current = createSearchController({
        search: (request, requestOptions) =>
          client.search(request, requestOptions),
        analytics: {
          surface,
          trackViewSearchResults: (params) =>
            client.trackViewSearchResults(params),
          trackSelectSearchResult: (params) =>
            client.trackSelectSearchResult(params),
        },
        ...rest,
      });
    }

    return controllerRef.current;
  }, []);

  // StrictMode disposes the first controller after the initial render; this
  // stable facade re-resolves the live one so rendered components never
  // dispatch into the dead instance.
  const facadeRef = useRef<SearchController | undefined>(undefined);
  facadeRef.current ??= {
    setQuery: (rawQuery) => getController().setQuery(rawQuery),
    submit: (rawQuery) => getController().submit(rawQuery),
    setPage: (page) => getController().setPage(page),
    retry: () => getController().retry(),
    observeResult: (element, index) =>
      getController().observeResult(element, index),
    selectResult: (index) => getController().selectResult(index),
    subscribe: (listener) => getController().subscribe(listener),
    getState: () => getController().getState(),
    dispose: () => getController().dispose(),
  };

  useEffect(() => {
    registerDialogInstallation({
      method: "react",
      version:
        typeof __DIALOG_REACT_VERSION__ === "undefined"
          ? undefined
          : __DIALOG_REACT_VERSION__,
    });
    const controller = getController();

    return () => {
      controller.dispose();
      if (controllerRef.current === controller) {
        controllerRef.current = undefined;
      }
    };
  }, [getController]);

  const subscribe = useCallback(
    (listener: () => void) => getController().subscribe(listener),
    [getController],
  );
  const getState = useCallback(
    () => getController().getState(),
    [getController],
  );
  const state = useSyncExternalStore(
    subscribe,
    getState,
    () => SERVER_SNAPSHOT,
  );

  return { controller: facadeRef.current, state };
};
