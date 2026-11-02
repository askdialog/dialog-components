import { AiOverviewRequest, AiOverviewResponse } from "../types/aiSearch";
import { SearchOptions, SearchRequest, SearchResponse } from "../types/search";
import { postSearchApi } from "./searchApi";

const AI_SEARCH_PATH = "/public/search/ai";
const AI_OVERVIEW_PATH = "/public/search/ai/overview";
// Both routes call a model; the monolith allows them 30 s upstream.
const AI_TIMEOUT_MS = 30_000;

/**
 * Natural-language search on one products index: the engine extracts the
 * query's filters ("under 40 €") before ranking, and echoes them back in the
 * result's `filters` and `attributeLabels`. Its hits carry no `_display`.
 * Rejects with `DialogSearchError` on an HTTP error, a `TimeoutError` after 30 s.
 */
export const searchAi = (
  apiKey: string,
  request: SearchRequest,
  options?: SearchOptions,
): Promise<SearchResponse> =>
  postSearchApi<SearchResponse>(apiKey, AI_SEARCH_PATH, request, {
    signal: options?.signal,
    timeoutMs: AI_TIMEOUT_MS,
  });

/** The text and filter suggestions written about the first page of an AI search. */
export const searchAiOverview = (
  apiKey: string,
  request: AiOverviewRequest,
  options?: SearchOptions,
): Promise<AiOverviewResponse> =>
  postSearchApi<AiOverviewResponse>(apiKey, AI_OVERVIEW_PATH, request, {
    signal: options?.signal,
    timeoutMs: AI_TIMEOUT_MS,
  });
