import { type FC, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  connectSearchBox,
  connectSections,
  DialogSearchError,
  resolveSearchPanelVariables,
  SearchStatus,
  type SearchController,
  type SearchTexts,
  type Theme,
} from "@askdialog/dialog-sdk/search";
import { ArrowRightIcon } from "../../icons/ArrowRightIcon";
import { DialogSearchCollections } from "./DialogSearchCollections";
import { DialogSearchProducts } from "./DialogSearchProducts";
import { isAnchorOnScreen, panelStyle } from "./panelPlacement";
import { resolveSearchTexts } from "./searchTexts";
import { useAnchorRect } from "./useAnchorRect";
import { useConnector } from "./useConnector";
import type { DialogSearchState } from "./useDialogSearch";
import { useOutsideDismiss } from "./useOutsideDismiss";
import "./DialogSearchResults.css";

export type SearchProductsLayout = "list" | "grid";

interface DialogSearchResultsProps {
  controller: SearchController;
  state: DialogSearchState;
  /** BCP 47 locale for prices, counts and labels; the search language and country when omitted. */
  locale?: string;
  /** Usually `client.theme`, as returned by `useDialogSearch`. */
  theme?: Theme;
  layout?: SearchProductsLayout;
  /** Link of the "See all results" footer; omitted, the panel shows the first page of hits only. */
  seeAllHref?: (query: string) => string;
}

const describeError = (error: unknown): string => {
  if (error instanceof DialogSearchError) {
    return `Search failed (${error.status}${error.code ? ` ${error.code}` : ""}): ${error.message}`;
  }

  return "Search failed: network error. Check your connection and try again.";
};

const PanelContent: FC<
  DialogSearchResultsProps & { query: string; texts: SearchTexts }
> = ({ controller, state, locale, seeAllHref, query, texts }) => {
  const [{ collections }] = useConnector(connectSections, controller);
  const { status, products, error } = state.results;

  if (status === SearchStatus.ERROR) {
    return (
      <div className="dialog-search-error">
        <p
          role="alert"
          className="dialog-search-status dialog-search-status-error"
        >
          {describeError(error)}
        </p>
        <button
          type="button"
          className="dialog-search-retry"
          onClick={() => controller.retry()}
        >
          {texts.retry}
        </button>
      </div>
    );
  }
  // Non-blocking: the previous results stay while the next query is loading,
  // so everything below reads the products' own query, not the pending one.
  if (products === undefined) {
    return (
      <p role="status" className="dialog-search-status">
        {texts.searching(query)}
      </p>
    );
  }

  const hasSeeAll = seeAllHref !== undefined && products.nbHits > 0;

  return (
    <>
      <div
        className={`dialog-search-body${collections.length > 0 ? "" : " dialog-search-body--no-collections"}`}
      >
        <DialogSearchCollections collections={collections} texts={texts} />
        <DialogSearchProducts
          controller={controller}
          context={state.context}
          nbHits={products.nbHits}
          locale={locale}
          texts={texts}
        />
      </div>
      {hasSeeAll && (
        <div className="dialog-search-footer">
          <a className="dialog-search-cta" href={seeAllHref(products.query)}>
            {texts.seeAllLabel(products.nbHits)}
            <ArrowRightIcon />
          </a>
        </div>
      )}
    </>
  );
};

// Render fixed under document.body to avoid ancestor clipping and stacking contexts.
export const DialogSearchResults: FC<DialogSearchResultsProps> = (props) => {
  const { controller, state, locale, theme, layout = "list" } = props;
  const { status } = state.results;
  const [{ query }] = useConnector(connectSearchBox, controller);
  const hasResults = status !== SearchStatus.IDLE;
  const { anchorRef, rect, viewport } = useAnchorRect(hasResults);
  const { isOpen, panelRef } = useOutsideDismiss(status, query, anchorRef);
  const texts = resolveSearchTexts(state.context, locale);
  const panelVariables = useMemo(
    () => resolveSearchPanelVariables(theme),
    [theme],
  );

  return (
    <>
      <div ref={anchorRef} />
      {isOpen &&
        rect !== undefined &&
        isAnchorOnScreen(rect, viewport.height) &&
        createPortal(
          <div
            ref={panelRef}
            className={`dialog-search-panel dialog-search-panel--${layout}`}
            style={{
              ...panelStyle(rect, viewport.width, viewport.height),
              ...panelVariables,
            }}
          >
            <PanelContent {...props} query={query} texts={texts} />
          </div>,
          document.body,
        )}
    </>
  );
};
