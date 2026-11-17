import {
  connectSearchBox,
  connectHits,
  connectInfiniteHits,
  connectPagination,
  connectStats,
  connectSections,
  connectQuerySuggestions,
  connectSortBy,
  connectClearRefinements,
  connectCurrentRefinements,
  connectDynamicWidgets,
  connectRefinementList,
  connectRange,
  connectAiOverview,
  type SearchController,
  type RefinementListOptions,
  type AiOverviewParams,
} from "@askdialog/dialog-sdk";

import { useConnector } from "./useConnector";

import { useCallback } from "react";

export const useSearchBox = (controller: SearchController) => {
  return useConnector(connectSearchBox, controller);
};

export const useHits = (controller: SearchController) => {
  return useConnector(connectHits, controller);
};

export const useInfiniteHits = (controller: SearchController) => {
  return useConnector(connectInfiniteHits, controller);
};

export const usePagination = (controller: SearchController) => {
  return useConnector(connectPagination, controller);
};

export const useStats = (controller: SearchController) => {
  return useConnector(connectStats, controller);
};

export const useSections = (controller: SearchController) => {
  return useConnector(connectSections, controller);
};

export const useQuerySuggestions = (controller: SearchController) => {
  return useConnector(connectQuerySuggestions, controller);
};

export const useSortBy = (controller: SearchController) => {
  return useConnector(connectSortBy, controller);
};

export const useClearRefinements = (controller: SearchController) => {
  return useConnector(connectClearRefinements, controller);
};

export const useCurrentRefinements = (controller: SearchController) => {
  return useConnector(connectCurrentRefinements, controller);
};

export const useDynamicWidgets = (controller: SearchController) => {
  return useConnector(connectDynamicWidgets, controller);
};

export const useRefinementList = (
  controller: SearchController,
  { attribute, limit }: RefinementListOptions,
) => {
  const connect = useCallback(
    (target: SearchController) =>
      connectRefinementList(target, { attribute, limit }),
    [attribute, limit],
  );
  return useConnector(connect, controller);
};

export const useRange = (
  controller: SearchController,
  { attribute }: { attribute: string },
) => {
  const connect = useCallback(
    (target: SearchController) => connectRange(target, { attribute }),
    [attribute],
  );
  return useConnector(connect, controller);
};

export const useAiOverview = (
  controller: SearchController,
  { apiKey, transport }: AiOverviewParams,
) => {
  const connect = useCallback(
    (target: SearchController) =>
      connectAiOverview(target, { apiKey, transport }),
    [apiKey, transport],
  );
  return useConnector(connect, controller);
};
