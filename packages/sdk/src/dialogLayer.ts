// Miniature copy of trackDialogEvent from dialog-ecom's @dialog/storefront-events
// (private package): Dialog's surfaces push their events onto `window.dialogLayer`,
// as onto GA4's `dataLayer`, and the widget sends them on.
// Not declared on Window: the Dialog tag declares it for its gtag-style commands.
const DIALOG_LAYER_GLOBAL = "dialogLayer";

const getDialogLayer = (): unknown[] => {
  const existing: unknown = Reflect.get(window, DIALOG_LAYER_GLOBAL);
  if (Array.isArray(existing)) {
    return existing;
  }
  const layer: unknown[] = [];
  Reflect.set(window, DIALOG_LAYER_GLOBAL, layer);

  return layer;
};

/** Push one Dialog event onto `window.dialogLayer`, for the widget to send. */
export const trackDialogEvent = (
  event: string,
  properties: Record<string, unknown> = {},
): void => {
  getDialogLayer().push({ ...properties, event });
};
