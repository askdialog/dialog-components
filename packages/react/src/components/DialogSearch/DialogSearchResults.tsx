import type { FC, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DialogSearchError,
  SearchStatus,
  type SearchController,
  type SearchControllerState,
} from "@askdialog/dialog-sdk";
import { DialogSearchPagination } from "./DialogSearchPagination";
import { DialogSearchProductCard } from "./DialogSearchProductCard";
import { useAnchorRect } from "./useAnchorRect";
import "./DialogSearchResults.css";

const PANEL_OFFSET_PX = 8;
const VIEWPORT_MARGIN_PX = 16;

interface DialogSearchResultsProps {
  controller: SearchController;
  state: SearchControllerState;
}

const describeError = (error: unknown): string => {
  if (error instanceof DialogSearchError) {
    return `Search failed (${error.status}${error.code ? ` ${error.code}` : ""}): ${error.message}`;
  }

  return "Search failed: network error. Check your connection and try again.";
};

const panelContent = (
  controller: SearchController,
  state: SearchControllerState,
): ReactNode => {
  const response = state.response;

  switch (state.status) {
    case SearchStatus.LOADING:
      return (
        <p role="status" className="dialog-search-status">
          Searching “{state.query}”…
        </p>
      );
    case SearchStatus.ERROR:
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
            Retry
          </button>
        </div>
      );
    case SearchStatus.EMPTY:
      return (
        <p role="status" className="dialog-search-status">
          No products match “{response?.query}”.
        </p>
      );
    case SearchStatus.SUCCESS:
      if (response === undefined) {
        return null;
      }

      return (
        <>
          <p role="status" className="dialog-search-status">
            {response.nbHits} result{response.nbHits > 1 ? "s" : ""}
          </p>
          <ul className="dialog-search-results">
            {response.hits.map((hit, index) => (
              <DialogSearchProductCard
                key={hit.id}
                controller={controller}
                hit={hit}
                index={index}
              />
            ))}
          </ul>
          <DialogSearchPagination controller={controller} state={state} />
        </>
      );
    default:
      return null;
  }
};

// The panel is portaled to document.body in position: fixed so no ancestor
// stacking context or overflow clipping can hide it; the in-flow anchor div
// (rendered where the panel visually opens) provides its coordinates.
export const DialogSearchResults: FC<DialogSearchResultsProps> = ({
  controller,
  state,
}) => {
  const isOpen = state.status !== SearchStatus.IDLE;
  const { anchorRef, rect } = useAnchorRect(isOpen);

  return (
    <>
      <div ref={anchorRef} />
      {isOpen &&
        rect !== undefined &&
        createPortal(
          <div
            className="dialog-search-panel"
            style={{
              top: rect.top + PANEL_OFFSET_PX,
              left: rect.left,
              width: rect.width,
              maxHeight: `calc(100vh - ${rect.top + PANEL_OFFSET_PX + VIEWPORT_MARGIN_PX}px)`,
            }}
          >
            {panelContent(controller, state)}
          </div>,
          document.body,
        )}
    </>
  );
};
