import { config } from "../config";
import { DialogSearchError } from "../DialogSearchError";
import { SearchOptions, SearchRequest, SearchResponse } from "../types/search";

const SEARCH_PATH = "/public/search";
const API_KEY_HEADER = "x-dialog-api-key";

const toSearchError = async (
  response: Response,
): Promise<DialogSearchError> => {
  let body: { error?: unknown; message?: unknown } | undefined;
  try {
    body = (await response.json()) as typeof body;
  } catch {
    body = undefined;
  }
  const code = typeof body?.error === "string" ? body.error : undefined;
  const message =
    typeof body?.message === "string" && body.message.length > 0
      ? body.message
      : response.statusText;

  return new DialogSearchError({ status: response.status, code, message });
};

/**
 * One POST per invocation — no debounce, cache, retry or request state; the
 * caller owns cancellation through `options.signal`.
 */
export const searchProducts = async (
  apiKey: string,
  request: SearchRequest,
  options?: SearchOptions,
): Promise<SearchResponse> => {
  const response = await fetch(`${config.monolithApiUrl}${SEARCH_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [API_KEY_HEADER]: apiKey,
    },
    body: JSON.stringify(request),
    signal: options?.signal,
  });

  if (!response.ok) {
    throw await toSearchError(response);
  }

  return (await response.json()) as SearchResponse;
};
