import { searchAiOverview } from "../services/aiSearch";
import { AiOverviewRequest, AiOverviewResponse } from "../types/aiSearch";
import { SearchOptions } from "../types/search";

export type AiOverviewTransport = (
  request: AiOverviewRequest,
  options?: SearchOptions,
) => Promise<AiOverviewResponse>;

interface SharedRequest {
  readonly promise: Promise<AiOverviewResponse>;
  readonly abortController: AbortController;
  response?: AiOverviewResponse;
  users: number;
}

/** One overview request a connector follows until it releases it. */
export interface HeldAiOverview {
  readonly promise: Promise<AiOverviewResponse>;
  /** Set when the answer already came, for another connector or an earlier search. */
  readonly response: AiOverviewResponse | undefined;
  release(): void;
}

// Per transport, each request is sent once per page: an answer is kept, a
// failure is sent again by the next connector asking for it.
const requests = new WeakMap<AiOverviewTransport, Map<string, SharedRequest>>();
const apiKeyTransports = new Map<string, AiOverviewTransport>();

/** The AI Overview transport bound to an API key, the same function per key. */
export const apiKeyAiOverviewTransport = (
  apiKey: string,
): AiOverviewTransport => {
  let transport = apiKeyTransports.get(apiKey);
  if (transport === undefined) {
    transport = (request, options) =>
      searchAiOverview(apiKey, request, options);
    apiKeyTransports.set(apiKey, transport);
  }

  return transport;
};

const send = (
  transport: AiOverviewTransport,
  request: AiOverviewRequest,
  sent: Map<string, SharedRequest>,
  key: string,
): SharedRequest => {
  const abortController = new AbortController();
  const shared: SharedRequest = {
    // A custom transport throwing at once rejects like a failed request.
    promise: new Promise((resolve) => {
      resolve(transport(request, { signal: abortController.signal }));
    }),
    abortController,
    users: 0,
  };
  shared.promise.then(
    (response) => {
      shared.response = response;
    },
    () => {
      if (sent.get(key) === shared) {
        sent.delete(key);
      }
    },
  );

  return shared;
};

/**
 * The overview of a request, sent unless the same transport already sent it.
 * Aborted when every connector released it before its answer.
 */
export const holdAiOverview = (
  transport: AiOverviewTransport,
  request: AiOverviewRequest,
): HeldAiOverview => {
  let sent = requests.get(transport);
  if (sent === undefined) {
    sent = new Map();
    requests.set(transport, sent);
  }
  const key = JSON.stringify(request);
  let shared = sent.get(key);
  if (shared === undefined) {
    shared = send(transport, request, sent, key);
    sent.set(key, shared);
  }
  shared.users += 1;
  const held = shared;
  const byKey = sent;
  let released = false;

  return {
    promise: held.promise,
    response: held.response,
    release() {
      if (released) {
        return;
      }
      released = true;
      held.users -= 1;
      if (held.users === 0 && held.response === undefined) {
        if (byKey.get(key) === held) {
          byKey.delete(key);
        }
        held.abortController.abort();
      }
    },
  };
};
