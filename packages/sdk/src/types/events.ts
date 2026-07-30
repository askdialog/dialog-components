import {
  SelectSearchResultEventPayload,
  ViewSearchResultsEventPayload,
} from "./searchAnalytics";

export const DIALOG_CUSTOM_EVENT = "enableDialogAssistantEvent";

export enum DialogEvents {
  OPEN_ASSISTANT = "open_assistant",
  CLOSE_ASSISTANT = "close_assistant",
  SEND_MESSAGE = "PRODUCT_QUESTION",
  SEND_GENERIC_QUESTION = "GENERIC_QUESTION",
  TRACK_ADD_TO_CART = "TRACK_ADD_TO_CART",
  TRACK_SUBMIT_CHECKOUT = "TRACK_SUBMIT_CHECKOUT",
  TRACK_VIEW_SEARCH_RESULTS = "TRACK_VIEW_SEARCH_RESULTS",
  TRACK_SELECT_SEARCH_RESULT = "TRACK_SELECT_SEARCH_RESULT",
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

// Optional enriched data describing the product actually added to cart.
// It lets merchant analytics integrations (e.g. GA forwarding) track the
// added product without resolving it from the page context — required when
// the added product is a Dialog suggestion and differs from the visited PDP.
// The `page*` fields describe the PDP the widget is embedded on, so the two
// products can be told apart.
export interface AddToCartProductDetails {
  productTitle?: string;
  variantTitle?: string;
  productUrl?: string;
  pageProductId?: string;
  pageVariantId?: string;
}

// Input shared by Dialog.addToCart, registerAddToCartEvent and the merchant
// `callbacks.addToCart`. All enriched fields are optional so existing
// integrations keep working unchanged.
export interface AddToCartInput extends AddToCartProductDetails {
  productId: string;
  quantity: number;
  price?: string;
  currency?: string;
  variantId?: string;
}

// Forwarded to the host app (e.g. shopify-assistant) so it can capture the
// event through its own PostHog instance instead of the SDK instantiating a
// second one. Field names are part of the cross-repo contract consumed by the
// host's tracking bridge — keep them in sync.
//
// Add-to-cart stays product-level: one event per added line.
export interface TrackEventPayload extends AddToCartProductDetails {
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
  | SubmitCheckoutEventPayload
  | ViewSearchResultsEventPayload
  | SelectSearchResultEventPayload;

export interface DialogEvent<T = DialogEventPayload> {
  type: DialogEvents;
  payload: T;
}
