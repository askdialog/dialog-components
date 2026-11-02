import { config } from "../config";
import { toSearchError } from "./searchError";

const API_KEY_HEADER = "x-dialog-api-key";

interface PostOptions {
  signal?: AbortSignal;
  /** Past it, the request is aborted and rejects with a `TimeoutError` `DOMException`. */
  timeoutMs?: number;
}

const post = async <TResponse>(
  apiKey: string,
  path: string,
  body: unknown,
  signal: AbortSignal | undefined,
): Promise<TResponse> => {
  const response = await fetch(`${config.monolithApiUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [API_KEY_HEADER]: apiKey,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    throw await toSearchError(response);
  }

  return (await response.json()) as TResponse;
};

// Aborts with the caller's signal, or past `timeoutMs` with a `TimeoutError`.
const withTimeout = async <TResponse>(
  run: (signal: AbortSignal) => Promise<TResponse>,
  signal: AbortSignal | undefined,
  timeoutMs: number,
  path: string,
): Promise<TResponse> => {
  const controller = new AbortController();
  const timeout = new DOMException(
    `Dialog search ${path} timed out after ${timeoutMs} ms.`,
    "TimeoutError",
  );
  const abort = (): void => controller.abort();
  const timer = setTimeout(() => controller.abort(timeout), timeoutMs);
  if (signal?.aborted === true) {
    abort();
  }
  signal?.addEventListener("abort", abort, { once: true });

  try {
    return await run(controller.signal);
  } catch (error) {
    // Not an `AbortError`, which callers read as a cancellation.
    throw controller.signal.reason === timeout ? timeout : error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
};

/** POST the body as is to a search route; a non-2xx answer rejects with `DialogSearchError`. */
export const postSearchApi = <TResponse>(
  apiKey: string,
  path: string,
  body: unknown,
  { signal, timeoutMs }: PostOptions = {},
): Promise<TResponse> => {
  const run = (runSignal: AbortSignal | undefined): Promise<TResponse> =>
    post<TResponse>(apiKey, path, body, runSignal);

  return timeoutMs === undefined
    ? run(signal)
    : withTimeout(run, signal, timeoutMs, path);
};
