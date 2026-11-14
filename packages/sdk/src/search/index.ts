// The search controller and connectors, exported by the SDK root and by its
// `@askdialog/dialog-sdk/search` alias.
export { createSearchController } from "./createSearchController";
export { createSearchDraft } from "./createSearchDraft";
export { loadMerchantConfig, storedMerchantConfig } from "./merchantConfig";
export type {
  FilterableAttribute,
  IndexSearchState,
  MerchantConfig,
  SearchConfig,
  SearchContext,
  SearchController,
  SearchControllerOptions,
  SearchDraft,
  SearchMode,
  SearchResults,
  SearchSnapshot,
  SearchState,
  SearchStateUpdater,
} from "./types";
export type { SearchRouteState, SearchRouting } from "./routeUrl";
export type { Connector } from "./connector";
export {
  connectSearchBox,
  type SearchBoxConnector,
  type SearchBoxRenderState,
} from "./connectSearchBox";
export {
  connectHits,
  productHitDisplay,
  type HitsConnector,
  type HitsRenderState,
  type ProductHit,
  type ProductHitDisplay,
} from "./connectHits";
export {
  connectInfiniteHits,
  type InfiniteHit,
  type InfiniteHitsConnector,
  type InfiniteHitsRenderState,
} from "./connectInfiniteHits";
export {
  connectSortBy,
  type SortByConnector,
  type SortByItem,
  type SortByRenderState,
} from "./connectSortBy";
export {
  connectStats,
  type StatsConnector,
  type StatsRenderState,
} from "./connectStats";
export {
  connectPagination,
  type PaginationConnector,
  type PaginationItem,
  type PaginationRenderState,
} from "./connectPagination";
export {
  connectSections,
  type SectionHit,
  type SectionHitDisplay,
  type SectionsConnector,
  type SectionsRenderState,
} from "./connectSections";
export {
  connectQuerySuggestions,
  type QuerySuggestion,
  type QuerySuggestionsConnector,
  type QuerySuggestionsRenderState,
} from "./connectQuerySuggestions";
export {
  connectAiOverview,
  type AiOverviewConnector,
  type AiOverviewParams,
  type AiOverviewRenderState,
  type AiOverviewStatus,
} from "./connectAiOverview";
export type { AiOverviewTransport } from "./aiOverviewRequests";

export {
  connectRefinementList,
  type RefinementListConnector,
  type RefinementListItem,
  type RefinementListOptions,
  type RefinementListRenderState,
} from "./connectRefinementList";
export {
  connectRange,
  type RangeConnector,
  type RangeRenderState,
} from "./connectRange";
export {
  connectClearRefinements,
  type ClearRefinementsConnector,
  type ClearRefinementsRenderState,
} from "./connectClearRefinements";
export {
  connectDynamicWidgets,
  type DynamicWidgetsConnector,
  type DynamicWidgetsRenderState,
} from "./connectDynamicWidgets";
export {
  connectCurrentRefinements,
  type CurrentRefinement,
  type CurrentRefinementsConnector,
  type CurrentRefinementsRenderState,
} from "./connectCurrentRefinements";

// Types the controller's snapshot and options are built from.
export type { SearchBusinessRanking } from "../types/dialogConfig";
export type {
  SearchArticleHit,
  SearchCollectionHit,
  SearchFacetCounts,
  SearchFacetsRequest,
  SearchFacetsResponse,
  SearchFacetStats,
  SearchHighlightResult,
  SearchHitByIndex,
  SearchIndex,
  SearchPageHit,
  SearchProductHit,
  SearchQuerySuggestionHit,
  SearchResult,
  SearchSections,
  SearchSort,
} from "../types/search";
export { SEARCH_SORTS } from "../types/search";
export type {
  SearchFacetFilter,
  SearchFilters,
  SearchNumericFilter,
  SearchNumericOperator,
} from "../types/searchFilters";
export type {
  SearchDisplayImage,
  SearchDisplayLine,
  SearchHitDisplay,
  SearchImageShape,
  SearchProductHitDisplay,
} from "../types/searchDisplay";
export {
  SearchStatus,
  type SearchControllerAnalytics,
  type SearchFacetsFunction,
  type SearchFacetsOptions,
  type SearchFunction,
  type SearchSection,
} from "../types/searchController";
export { DialogSearchError } from "../DialogSearchError";

// The AI transports, for a surface calling them outside a controller.
export { searchAi, searchAiOverview } from "../services/aiSearch";
export type {
  AiOverviewRequest,
  AiOverviewResponse,
  AiOverviewSuggestion,
  SearchAttributeLabels,
  SearchFilterBlock,
} from "../types/aiSearch";

// Shared UI helpers: texts, display rules, highlight, price and theme.
export {
  getSearchTexts,
  type SearchFilterField,
  type SearchTexts,
} from "../utils/searchTexts";
export {
  hitHref,
  hitImage,
  hitTitle,
  navigableCollections,
  resolveDisplayUrl,
  safeHref,
} from "../utils/searchDisplay";
export { highlightedTitleParts, type TitlePart } from "../utils/titleHighlight";
export {
  formatSearchCompareAtPrice,
  formatSearchPrice,
} from "../utils/searchPrice";
export {
  resolveSearchPanelVariables,
  type SearchPanelVariables,
} from "../utils/searchTheme";
export type { Theme } from "../types/theme";
export {
  resolveSearchAppearanceVariables,
  type SearchAppearanceVariables,
} from "../utils/searchAppearance";
export type {
  SearchAppearance,
  SearchAppearanceFiltersStyle,
  SearchAppearanceImageRatio,
} from "../types/searchAppearance";
