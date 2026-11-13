import { searchAi } from "../services/aiSearch";
import { searchLexical, searchLexicalFacets } from "../services/search";
import {
  SearchFacetsFunction,
  SearchFunction,
  SearchSection,
} from "../types/searchController";
import { SearchControllerOptions, SearchMode } from "./types";

/** What the mode decides of the requests the controller sends. */
export interface SearchModeSetup {
  transport: SearchFunction;
  sections: SearchControllerOptions["sections"];
  /** A shorter trimmed query, in code points, sends no request. */
  minQueryLength: number;
  /** Sends the counts of the `facets` option; absent when it is off and in AI mode. */
  facetsTransport?: SearchFacetsFunction;
}

// The AI route answers one products request, and its engine needs two
// visible characters.
const AI_MIN_QUERY_LENGTH = 2;
const NO_SECTIONS: readonly SearchSection[] = [];

const modeTransport = (
  mode: SearchMode,
  apiKey: string | undefined,
): SearchFunction => {
  if (apiKey === undefined) {
    throw new Error("createSearchController needs a transport or an apiKey.");
  }
  const search = mode === "ai" ? searchAi : searchLexical;

  return (request, options) => search(apiKey, request, options);
};

// Only the lexical route has counts.
const countsTransport = ({
  mode,
  facets,
  facetsTransport,
  apiKey,
}: SearchControllerOptions): SearchFacetsFunction | undefined => {
  if (facets !== true || mode === "ai") {
    return undefined;
  }
  if (facetsTransport !== undefined) {
    return facetsTransport;
  }
  if (apiKey === undefined) {
    throw new Error(
      "createSearchController needs a facetsTransport or an apiKey for facets.",
    );
  }

  return (request, options) => searchLexicalFacets(apiKey, request, options);
};

export const searchModeSetup = (
  options: SearchControllerOptions,
): SearchModeSetup => {
  const {
    mode = "lexical",
    transport,
    apiKey,
    sections = NO_SECTIONS,
  } = options;
  const ai = mode === "ai";
  const facetsTransport = countsTransport(options);

  return {
    transport: transport ?? modeTransport(mode, apiKey),
    sections: ai ? NO_SECTIONS : sections,
    minQueryLength: ai ? AI_MIN_QUERY_LENGTH : 0,
    ...(facetsTransport === undefined ? {} : { facetsTransport }),
  };
};
