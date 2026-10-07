import { config } from "../config";
import { DialogSearchError } from "../DialogSearchError";
import {
  SearchIndex,
  SearchOptions,
  SearchRequest,
  SearchResponse,
} from "../types/search";

const SEARCH_PATH = "/public/search/lexical";
const API_KEY_HEADER = "x-dialog-api-key";

/** Build an index name from an ISO 639-1 language and the shopper's ISO 3166-1 alpha-2 country. */
export const searchIndexName = (
  index: SearchIndex,
  language: string,
  country: string,
): string => {
  if (!/^[a-z]{2}$/.test(language)) {
    throw new Error("Search language must be a lowercase ISO 639-1 code.");
  }
  if (!/^[A-Za-z]{2}$/.test(country)) {
    throw new Error("Search country must be an ISO 3166-1 alpha-2 code.");
  }

  return `${index}_${language}_${country.toLowerCase()}`;
};

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

/** Send one request. The caller controls cancellation through `options.signal`. */
export const searchLexical = async (
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
