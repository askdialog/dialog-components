import {
  SearchStatus,
  type SearchControllerState,
} from "@askdialog/dialog-sdk";

// Hidden while loading: a page taken from the retained response would apply to the pending query.
export const hasPagination = (state: SearchControllerState): boolean =>
  state.status !== SearchStatus.LOADING &&
  state.response !== undefined &&
  state.response.nbPages > 1;
