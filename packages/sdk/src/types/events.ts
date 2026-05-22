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
export interface TrackEventPayload {
  userId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price?: string;
  currency?: string;
}

export type DialogEventPayload =
  | ProductQuestionPayload
  | GenericQuestionPayload
  | DiagnosticPayload
  | OpenAssistantPayload
  | TrackEventPayload;

export interface DialogEvent<T = DialogEventPayload> {
  type: DialogEvents;
  payload: T;
}
