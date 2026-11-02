import { AiOverviewRequest } from "../types/aiSearch";
import { SearchStatus } from "../types/searchController";
import { SearchSnapshot } from "./types";

const OVERVIEW_OBJECT_IDS = 3;

type StatusBeforeRequest = "idle" | "loading" | "error";

const PAGE_ZERO_STATUS: Partial<Record<SearchStatus, StatusBeforeRequest>> = {
  [SearchStatus.LOADING]: "loading",
  [SearchStatus.ERROR]: "error",
};

/**
 * What the search says of its overview: the request once page 0 answered, the
 * status while page 0 loads or after it failed, undefined while a later page
 * loads, which leaves the overview of page 0 as it is.
 */
export const pageZeroOverview = (
  { results, context }: SearchSnapshot,
  page: number,
): AiOverviewRequest | StatusBeforeRequest | undefined => {
  const { status, products } = results;
  const answered =
    status === SearchStatus.SUCCESS || status === SearchStatus.EMPTY;
  if (answered && products?.page === 0) {
    return {
      query: products.query,
      language: context.language,
      country: context.country,
      page: 0,
      filters: [...(results.filters ?? [])],
      nbHits: products.nbHits,
      objectIDs: products.hits
        .slice(0, OVERVIEW_OBJECT_IDS)
        .map((hit) => hit.objectID),
    };
  }
  if (status === SearchStatus.IDLE) {
    return "idle";
  }

  return page === 0 ? PAGE_ZERO_STATUS[status] : undefined;
};
