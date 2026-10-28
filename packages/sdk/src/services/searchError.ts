import { DialogSearchError } from "../DialogSearchError";

/** Read a failed search API response into a `DialogSearchError`. */
export const toSearchError = async (
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
