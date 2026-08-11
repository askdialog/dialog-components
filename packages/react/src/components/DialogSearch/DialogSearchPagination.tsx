import type { FC } from "react";
import type {
  SearchController,
  SearchControllerState,
} from "@askdialog/dialog-sdk";
import "./DialogSearchPagination.css";

interface DialogSearchPaginationProps {
  controller: SearchController;
  state: SearchControllerState;
}

export const DialogSearchPagination: FC<DialogSearchPaginationProps> = ({
  controller,
  state,
}) => {
  const response = state.response;
  if (response === undefined || response.nbPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Search results pages" className="dialog-search-pagination">
      <button
        type="button"
        disabled={response.page === 0}
        onClick={() => controller.setPage(response.page - 1)}
      >
        Previous
      </button>
      <span>
        Page {response.page + 1} / {response.nbPages}
      </span>
      <button
        type="button"
        disabled={response.page >= response.nbPages - 1}
        onClick={() => controller.setPage(response.page + 1)}
      >
        Next
      </button>
    </nav>
  );
};
