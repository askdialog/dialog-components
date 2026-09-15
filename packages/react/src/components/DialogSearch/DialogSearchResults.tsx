import type { FC, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DialogSearchError,
  SearchStatus,
  type SearchController,
  type SearchControllerState,
  type Theme,
} from "@askdialog/dialog-sdk";
import { ArrowRightIcon } from "../../icons/ArrowRightIcon";
import { DialogSearchCollections } from "./DialogSearchCollections";
import { DialogSearchProducts } from "./DialogSearchProducts";
import { isAnchorOnScreen, panelStyle } from "./panelPlacement";
import { navigableCollections } from "./searchCollections";
import { getSearchMessages, type SearchMessages } from "./searchMessages";
import { resolveSearchPanelVariables } from "./searchTheme";
import { useAnchorRect } from "./useAnchorRect";
import { useOutsideDismiss } from "./useOutsideDismiss";
import "./DialogSearchResults.css";

export type SearchProductsLayout = "list" | "grid";

interface DialogSearchResultsProps {
  controller: SearchController;
  state: SearchControllerState;
  /** BCP 47 locale for prices, counts and labels. */
  locale?: string;
  /** Usually `client.theme`, as returned by `useDialogSearch`. */
  theme?: Theme;
  layout?: SearchProductsLayout;
  /** Link of the "See all results" footer; omitted, the panel paginates instead. */
  seeAllHref?: (query: string) => string;
}

const describeError = (error: unknown): string => {
  if (error instanceof DialogSearchError) {
    return `Search failed (${error.status}${error.code ? ` ${error.code}` : ""}): ${error.message}`;
  }

  return "Search failed: network error. Check your connection and try again.";
};

const panelContent = (
  props: DialogSearchResultsProps,
  messages: SearchMessages,
): ReactNode => {
  const { controller, state, locale, seeAllHref } = props;
  const { status, response } = state;

  if (status === SearchStatus.ERROR) {
    return (
      <div className="dialog-search-error">
        <p
          role="alert"
          className="dialog-search-status dialog-search-status-error"
        >
          {describeError(state.error)}
        </p>
        <button
          type="button"
          className="dialog-search-retry"
          onClick={() => controller.retry()}
        >
          {messages.retry}
        </button>
      </div>
    );
  }
  // Non-blocking: the previous results stay while the next query is loading.
  if (response === undefined) {
    return (
      <p role="status" className="dialog-search-status">
        {messages.searching(state.query)}
      </p>
    );
  }

  const collections = state.sections?.collections?.hits;
  const hasCollections = navigableCollections(collections).length > 0;
  const hasSeeAll = seeAllHref !== undefined && response.nbHits > 0;

  return (
    <>
      <div
        className={`dialog-search-body${hasCollections ? "" : " dialog-search-body--no-collections"}`}
      >
        <DialogSearchCollections
          collections={collections ?? []}
          query={state.query}
          messages={messages}
        />
        <DialogSearchProducts
          controller={controller}
          state={state}
          locale={locale}
          messages={messages}
          hasSeeAll={hasSeeAll}
        />
      </div>
      {hasSeeAll && (
        <div className="dialog-search-footer">
          <a className="dialog-search-cta" href={seeAllHref(state.query)}>
            {messages.seeAllLabel(response.nbHits)}
            <ArrowRightIcon />
          </a>
        </div>
      )}
    </>
  );
};

// Render fixed under document.body to avoid ancestor clipping and stacking contexts.
export const DialogSearchResults: FC<DialogSearchResultsProps> = (props) => {
  const { state, locale, theme, layout = "list" } = props;
  const hasResults = state.status !== SearchStatus.IDLE;
  const { anchorRef, rect, viewport } = useAnchorRect(hasResults);
  const { isOpen, panelRef } = useOutsideDismiss(state, anchorRef);
  const messages = getSearchMessages(locale);

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
              ...resolveSearchPanelVariables(theme),
            }}
          >
            {panelContent(props, messages)}
          </div>,
          document.body,
        )}
    </>
  );
};
