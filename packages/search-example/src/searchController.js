/**
 * Framework-free search behavior around `dialog.search()`: debounce,
 * cancellation, stale-response protection, state and pagination.
 *
 * Deliberately owned by the demo for now — this module is the extraction
 * source for the reusable frontend search behavior (DEC-2459).
 */

const DEFAULT_DEBOUNCE_MS = 250;
const DEFAULT_HITS_PER_PAGE = 12;
// `SearchRequest` rejects queries under two visible characters (code points).
const MIN_QUERY_CODE_POINTS = 2;

export const SearchStatus = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

const INITIAL_STATE = {
  status: SearchStatus.IDLE,
  query: "",
  page: 0,
  response: undefined,
  error: undefined,
};

/**
 * @param {object} options
 * @param {(request: object, options?: { signal?: AbortSignal }) => Promise<object>} options.search
 *   The bound `dialog.search` function.
 * @param {(state: object) => void} options.onState Called on every state change.
 * @param {number} [options.debounceMs]
 * @param {number} [options.hitsPerPage]
 */
export function createSearchController({
  search,
  onState,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  hitsPerPage = DEFAULT_HITS_PER_PAGE,
}) {
  let state = { ...INITIAL_STATE };

  let debounceTimer;
  // Query typed but not yet run: `state.query` only holds committed queries, so
  // without this, `setPage()` would cancel the debounce and paginate stale results.
  let pendingQuery;
  let abortController;
  // Monotonic token: a response only lands if it belongs to the latest request.
  let requestId = 0;

  function setState(patch) {
    state = { ...state, ...patch };
    onState(state);
  }

  function cancelInFlight() {
    clearTimeout(debounceTimer);
    if (abortController !== undefined) {
      abortController.abort();
      abortController = undefined;
    }
  }

  async function run(query, page) {
    cancelInFlight();
    abortController = new AbortController();
    const id = ++requestId;

    setState({ status: SearchStatus.LOADING, query, page });
    try {
      const response = await search(
        { query, page, hitsPerPage },
        { signal: abortController.signal },
      );
      if (id !== requestId) {
        return; // A newer request landed first: this response is stale.
      }
      setState({ status: SearchStatus.SUCCESS, response, error: undefined });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return; // Superseded by a newer request — never surfaced.
      }
      if (id !== requestId) {
        return;
      }
      setState({ status: SearchStatus.ERROR, error, response: undefined });
    }
  }

  return {
    /** Debounced entry point for keystrokes. */
    setQuery(rawQuery) {
      const query = rawQuery.trim();
      cancelInFlight();
      pendingQuery = undefined;
      if ([...query].length < MIN_QUERY_CODE_POINTS) {
        requestId += 1; // Invalidate anything in flight.
        setState(INITIAL_STATE);
        return;
      }
      pendingQuery = query;
      debounceTimer = setTimeout(() => {
        pendingQuery = undefined;
        void run(query, 0);
      }, debounceMs);
    },

    /** Immediate (non-debounced) pagination. */
    setPage(page) {
      if (pendingQuery !== undefined) {
        // A query change is pending: the click targeted stale results, so the
        // new query supersedes pagination — flush it now instead of debouncing.
        const query = pendingQuery;
        pendingQuery = undefined;
        void run(query, 0);
        return;
      }
      if (state.query === "") {
        return; // Pagination requires a committed non-empty query.
      }
      void run(state.query, page);
    },

    getState() {
      return state;
    },
  };
}
