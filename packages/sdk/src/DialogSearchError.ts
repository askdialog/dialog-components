interface DialogSearchErrorParams {
  status: number;
  code?: string;
  message: string;
}

/**
 * Non-2xx answer from the search endpoint. `status` is the HTTP status,
 * `code` the stable machine-readable error code the API carries when the
 * body is JSON (e.g. "SEARCH_INDEX_NOT_FOUND"), `message` the API message
 * or the HTTP statusText when the body is not JSON. Aborts and network
 * failures are NOT wrapped: they reject with their native errors.
 */
export class DialogSearchError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor({ status, code, message }: DialogSearchErrorParams) {
    super(message);
    this.name = "DialogSearchError";
    this.status = status;
    this.code = code;
  }
}
