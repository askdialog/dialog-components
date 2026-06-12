export const DIALOG_CUSTOM_EVENT = "enableDialogAssistantEvent";

export enum DialogEvents {
  OPEN_ASSISTANT = "open_assistant",
  CLOSE_ASSISTANT = "close_assistant",
  SEND_MESSAGE = "PRODUCT_QUESTION",
  SEND_GENERIC_QUESTION = "GENERIC_QUESTION",
  TRACK_ADD_TO_CART = "TRACK_ADD_TO_CART",
  TRACK_SUBMIT_CHECKOUT = "TRACK_SUBMIT_CHECKOUT",
}
export interface GenericQuestionPayload {
  question: string;
}
export interface ProductQuestionPayload extends GenericQuestionPayload {
  answer?: string;
  productId: string;
  productTitle: string;
  fromQuestionSuggestion?: boolean;
  selectedVariantId?: string;
}

export interface OpenAssistantPayload {
  question?: string;
  answer?: string;
  productId?: string;
  productTitle?: string;
  fromQuestionSuggestion?: boolean;
  selectedVariantId?: string;
}

export type DiagnosticButtonType = "productPageButton" | "simpleButton";

export interface DiagnosticPayload {
  productTitle: string;
  handle: string;
  productId: string;
  selectedVariantId?: string;
  buttonType: DiagnosticButtonType;
  url: string;
}

// Forwarded to the host app (e.g. shopify-assistant) so it can capture the
// event through its own PostHog instance instead of the SDK instantiating a
// second one. Field names are part of the cross-repo contract consumed by the
// host's tracking bridge — keep them in sync.
//
// Add-to-cart stays product-level: one event per added line.
export interface TrackEventPayload {
  userId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price?: string;
  currency?: string;
}

// A single line of a completed order. Optional, for product-level attribution
// only — revenue is computed from the order-level `orderValue`, never summed
// from these lines.
export interface CheckoutLineItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price?: number;
}

// Checkout is order-level: ONE event per completed order, carrying the order
// total. This is what the dashboard's "Revenue generated" reads. Do NOT emit
// one event per line item — that has no order total and revenue resolves to 0.
// Field names are part of the cross-repo contract consumed by the host's
// tracking bridge — keep them in sync.
export interface SubmitCheckoutEventPayload {
  userId?: string;
  orderValue: number;
  currency?: string;
  transactionId?: string;
  items?: CheckoutLineItem[];
}

// Public arguments for registerSubmitCheckoutEvent — order-level (preferred).
export interface SubmitCheckoutParams {
  orderValue: number;
  currency?: string;
  transactionId?: string;
  items?: CheckoutLineItem[];
}

/**
 * @deprecated Per-line checkout has no order total, so "Revenue generated"
 * resolves to 0. Pass the order total via {@link SubmitCheckoutParams} instead,
 * once per completed order.
 */
export interface LegacyCheckoutParams {
  productId: string;
  quantity: number;
  price?: string;
  currency?: string;
  variantId?: string;
}

export type DialogEventPayload =
  | ProductQuestionPayload
  | GenericQuestionPayload
  | DiagnosticPayload
  | OpenAssistantPayload
  | TrackEventPayload
  | SubmitCheckoutEventPayload;

export interface DialogEvent<T = DialogEventPayload> {
  type: DialogEvents;
  payload: T;
}
