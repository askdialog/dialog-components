import type { FC } from "react";
import {
  connectPagination,
  type SearchController,
} from "@askdialog/dialog-sdk";
import { resolveSearchTexts } from "./searchTexts";
import { useConnector } from "./useConnector";
import type { DialogSearchState } from "./useDialogSearch";
import "./DialogSearchPagination.css";

interface DialogSearchPaginationProps {
  controller: SearchController;
  state: DialogSearchState;
  locale?: string;
}

// Hidden while loading: a page taken from the retained response would apply to the pending query.
export const DialogSearchPagination: FC<DialogSearchPaginationProps> = ({
  controller,
  state,
  locale,
}) => {
  const [pagination, connector] = useConnector(connectPagination, controller);
  if (!pagination.visible) {
    return null;
  }
  const { currentPage, nbPages, isFirstPage, isLastPage } = pagination;
  const texts = resolveSearchTexts(state.context, locale);

  return (
    <nav aria-label="Search results pages" className="dialog-search-pagination">
      <button
        type="button"
        disabled={isFirstPage}
        onClick={() => connector.refine(currentPage - 1)}
      >
        {texts.previous}
      </button>
      <span>{texts.pageOf(currentPage + 1, nbPages)}</span>
      <button
        type="button"
        disabled={isLastPage}
        onClick={() => connector.refine(currentPage + 1)}
      >
        {texts.next}
      </button>
    </nav>
  );
};
