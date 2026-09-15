import type { FC } from "react";
import {
  SearchStatus,
  type SearchController,
  type SearchControllerState,
} from "@askdialog/dialog-sdk";
import { getSearchMessages } from "./searchMessages";
import "./DialogSearchPagination.css";

interface DialogSearchPaginationProps {
  controller: SearchController;
  state: SearchControllerState;
  locale?: string;
}

// Hidden while loading: a page taken from the retained response would apply to the pending query.
export const hasPagination = (state: SearchControllerState): boolean =>
  state.status !== SearchStatus.LOADING &&
  state.response !== undefined &&
  state.response.nbPages > 1;

export const DialogSearchPagination: FC<DialogSearchPaginationProps> = ({
  controller,
  state,
  locale,
}) => {
  const response = state.response;
  if (response === undefined || !hasPagination(state)) {
    return null;
  }
  const messages = getSearchMessages(locale);

  return (
    <nav aria-label="Search results pages" className="dialog-search-pagination">
      <button
        type="button"
        disabled={response.page === 0}
        onClick={() => controller.setPage(response.page - 1)}
      >
        {messages.previous}
      </button>
      <span>{messages.pageOf(response.page + 1, response.nbPages)}</span>
      <button
        type="button"
        disabled={response.page >= response.nbPages - 1}
        onClick={() => controller.setPage(response.page + 1)}
      >
        {messages.next}
      </button>
    </nav>
  );
};
