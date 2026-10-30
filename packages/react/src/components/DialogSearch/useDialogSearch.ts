import {
  createSearchController,
  registerDialogInstallation,
  type Dialog,
  type SearchController,
  type SearchProductHit,
  type SearchSection,
  type SearchSnapshot,
  type SearchSurface,
  type Theme,
} from "@askdialog/dialog-sdk";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRecreatableController } from "./recreatableController";

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
  /** @deprecated Ignored: every hit's `_display.url` is its link. */
  buildProductUrl?: (hit: SearchProductHit) => string | undefined;
  /**
   * The path a relative `_display.url` resolves under, e.g. `/` or `/fr-fr/`
   * (Shopify's `window.Shopify.routes.root`); default `/`.
   */
  storefrontRoot?: string;
  debounceMs?: number;
  hitsPerPage?: number;
  /**
   * Extra indices searched alongside the products, e.g. `[{ index: 'collections', hitsPerPage: 5 }]`.
   * Only request an index the catalog exposes: a missing one fails the whole search.
   */
  sections?: readonly SearchSection[];
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
  ...rest
}: UseDialogSearchOptions): SearchController =>
  createSearchController({
    transport: (request, requestOptions) =>
      client.search(request, requestOptions),
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
