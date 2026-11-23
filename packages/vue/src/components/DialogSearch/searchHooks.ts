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

export const useSearchBox = (controller: SearchController) => {
  const connector = connectSearchBox(controller);
  return [useConnector(connector), connector] as const;
};

export const useHits = (controller: SearchController) => {
  const connector = connectHits(controller);
  return [useConnector(connector), connector] as const;
};

export const useInfiniteHits = (controller: SearchController) => {
  const connector = connectInfiniteHits(controller);
  return [useConnector(connector), connector] as const;
};

export const usePagination = (controller: SearchController) => {
  const connector = connectPagination(controller);
  return [useConnector(connector), connector] as const;
};

export const useStats = (controller: SearchController) => {
  const connector = connectStats(controller);
  return [useConnector(connector), connector] as const;
};

export const useSections = (controller: SearchController) => {
  const connector = connectSections(controller);
  return [useConnector(connector), connector] as const;
};

export const useQuerySuggestions = (controller: SearchController) => {
  const connector = connectQuerySuggestions(controller);
  return [useConnector(connector), connector] as const;
};

export const useSortBy = (controller: SearchController) => {
  const connector = connectSortBy(controller);
  return [useConnector(connector), connector] as const;
};

export const useClearRefinements = (controller: SearchController) => {
  const connector = connectClearRefinements(controller);
  return [useConnector(connector), connector] as const;
};

export const useCurrentRefinements = (controller: SearchController) => {
  const connector = connectCurrentRefinements(controller);
  return [useConnector(connector), connector] as const;
};

export const useDynamicWidgets = (controller: SearchController) => {
  const connector = connectDynamicWidgets(controller);
  return [useConnector(connector), connector] as const;
};

export const useRefinementList = (
  controller: SearchController,
  { attribute, limit }: RefinementListOptions,
) => {
  const connector = connectRefinementList(controller, { attribute, limit });
  return [useConnector(connector), connector] as const;
};

export const useRange = (
  controller: SearchController,
  { attribute }: { attribute: string },
) => {
  const connector = connectRange(controller, { attribute });
  return [useConnector(connector), connector] as const;
};

export const useAiOverview = (
  controller: SearchController,
  { apiKey, transport }: AiOverviewParams,
) => {
  const connector = connectAiOverview(controller, { apiKey, transport });
  return [useConnector(connector), connector] as const;
};
