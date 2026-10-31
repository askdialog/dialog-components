// The search controller and connectors, exported by the SDK root and by its
// `@askdialog/dialog-sdk/search` alias.
export { createSearchController } from "./createSearchController";
export type {
  FilterableAttribute,
  IndexSearchState,
  MerchantConfig,
  SearchConfig,
  SearchContext,
  SearchController,
  SearchControllerOptions,
  SearchResults,
  SearchSnapshot,
  SearchState,
  SearchStateUpdater,
} from "./types";
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

// Types the controller's snapshot and options are built from.
export type { SearchBusinessRanking } from "../types/dialogConfig";
export type {
  SearchArticleHit,
  SearchCollectionHit,
  SearchHighlightResult,
  SearchHitByIndex,
  SearchIndex,
  SearchPageHit,
  SearchProductHit,
  SearchResult,
  SearchSections,
} from "../types/search";
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
  type SearchFunction,
  type SearchSection,
} from "../types/searchController";
export { DialogSearchError } from "../DialogSearchError";

// Shared UI helpers: texts, display rules, highlight, price and theme.
export { getSearchTexts, type SearchTexts } from "../utils/searchTexts";
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
