import {
  AiOverviewRequest,
  AiOverviewResponse,
  AiOverviewSuggestion,
  SearchAttributeLabels,
} from "../types/aiSearch";
import { searchStateFilters } from "../utils/searchStateFilters";
import {
  AiOverviewTransport,
  apiKeyAiOverviewTransport,
  HeldAiOverview,
  holdAiOverview,
} from "./aiOverviewRequests";
import { pageZeroOverview } from "./aiOverviewSearch";
import { Connector, createConnector } from "./connector";
import { productsEntry } from "./searchState";
import { SearchController, SearchSnapshot } from "./types";

const NO_SUGGESTIONS: readonly AiOverviewSuggestion[] = [];
const NO_LABELS: Readonly<SearchAttributeLabels> = {};

/** `idle` with no AI search, `loading` until page 0 and its overview answer. */
export type AiOverviewStatus = "idle" | "loading" | "success" | "error";

export interface AiOverviewRenderState {
  readonly status: AiOverviewStatus;
  /** Written about page 0; undefined until it answers. */
  readonly text: string | undefined;
  /** Next searches to offer, each with its complete filters. */
  readonly suggestions: readonly AiOverviewSuggestion[];
  /** The label of each attribute the suggestions filter on. */
  readonly attributeLabels: Readonly<SearchAttributeLabels>;
}

export interface AiOverviewConnector extends Connector<AiOverviewRenderState> {
  /** Replace every filter of the search state with the suggestion's, in one search. */
  applySuggestion(suggestion: AiOverviewSuggestion): void;
}

export interface AiOverviewParams {
  /** Binds the SDK's AI Overview transport when `transport` is absent. */
  apiKey?: string;
  /** Replaces the SDK's transport, e.g. to add the visitor's session to the request. */
  transport?: AiOverviewTransport;
}

interface Overview {
  readonly status: AiOverviewStatus;
  readonly response?: AiOverviewResponse;
}

const IDLE: Overview = { status: "idle" };
const LOADING: Overview = { status: "loading" };
const ERROR: Overview = { status: "error" };
const BEFORE_REQUEST = { idle: IDLE, loading: LOADING, error: ERROR };

const toRenderState = ({
  status,
  response,
}: Overview): AiOverviewRenderState => ({
  status,
  text: response?.text,
  suggestions: response?.suggestions ?? NO_SUGGESTIONS,
  attributeLabels: response?.attributeLabels ?? NO_LABELS,
});

const resolveTransport = ({
  apiKey,
  transport,
}: AiOverviewParams): AiOverviewTransport => {
  if (transport !== undefined) {
    return transport;
  }
  if (apiKey === undefined) {
    throw new Error("connectAiOverview needs a transport or an apiKey.");
  }

  return apiKeyAiOverviewTransport(apiKey);
};

/**
 * The AI Overview of the controller's search: requested once page 0 answers,
 * kept while later pages load; a failed page 0 fails it.
 */
export function connectAiOverview(
  controller: SearchController,
  params: AiOverviewParams,
): AiOverviewConnector {
  const transport = resolveTransport(params);
  const entry = productsEntry(controller);
  let overview = IDLE;
  let held: { key: string; overview: HeldAiOverview } | undefined;
  let refresh = (): void => undefined;

  const set = (next: Overview): void => {
    overview = next;
    refresh();
  };

  const release = (next: Overview): void => {
    held?.overview.release();
    held = undefined;
    set(next);
  };

  const request = (body: AiOverviewRequest): void => {
    const key = JSON.stringify(body);
    if (held?.key === key) {
      return;
    }
    held?.overview.release();
    const current = { key, overview: holdAiOverview(transport, body) };
    held = current;
    const { response, promise } = current.overview;
    if (response !== undefined) {
      set({ status: "success", response });

      return;
    }
    set(LOADING);
    promise.then(
      (answer) => {
        if (held === current) {
          set({ status: "success", response: answer });
        }
      },
      () => {
        if (held === current) {
          set(ERROR);
        }
      },
    );
  };

  const follow = (snapshot: SearchSnapshot): void => {
    const next = pageZeroOverview(
      snapshot,
      entry.read(snapshot.searchState).page,
    );
    if (typeof next === "object") {
      request(next);
    } else if (next !== undefined) {
      release(BEFORE_REQUEST[next]);
    }
  };

  follow(controller.getSnapshot());
  const unfollow = controller.subscribe(follow);
  const connector = createConnector(controller, {
    read: () => [overview] as const,
    render: ([current]) => toRenderState(current),
  });
  refresh = connector.refresh;
  const { getRenderState, subscribe } = connector;

  return {
    getRenderState,
    subscribe,

    dispose() {
      unfollow();
      held?.overview.release();
      held = undefined;
      connector.dispose();
    },

    applySuggestion(suggestion) {
      if (connector.disposed()) {
        return;
      }
      const { filterableAttributes } = controller.getSnapshot().context;
      entry.set(searchStateFilters(suggestion.filters, filterableAttributes));
    },
  };
}
