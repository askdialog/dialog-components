import { searchAi } from "../services/aiSearch";
import { searchLexical } from "../services/search";
import { SearchFunction, SearchSection } from "../types/searchController";
import { SearchControllerOptions, SearchMode } from "./types";

/** What the mode decides of the requests the controller sends. */
export interface SearchModeSetup {
  transport: SearchFunction;
  sections: SearchControllerOptions["sections"];
  /** A shorter trimmed query, in code points, sends no request. */
  minQueryLength: number;
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

export const searchModeSetup = ({
  mode = "lexical",
  transport,
  apiKey,
  sections = NO_SECTIONS,
}: SearchControllerOptions): SearchModeSetup => {
  const ai = mode === "ai";

  return {
    transport: transport ?? modeTransport(mode, apiKey),
    sections: ai ? NO_SECTIONS : sections,
    minQueryLength: ai ? AI_MIN_QUERY_LENGTH : 0,
  };
};
