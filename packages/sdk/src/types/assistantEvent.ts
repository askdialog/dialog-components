export const DIALOG_ASSISTANT_EVENT = "dialogAssistantEvent";

export enum AssistantEvents {
  USER_OPENED_ASSISTANT = "userOpenedAssistant",
  USER_CLOSED_ASSISTANT = "userClosedAssistant",
  USER_SENT_MESSAGE = "userSentMessage",
  USER_CLICKED_ON_PRODUCT_CARD = "userClickedOnProductCard",
  USER_OPENED_RECOMMENDATION = "userOpenedRecommendation",
  USER_ADDED_TO_CART = "userAddedToCart",
  USER_SEND_POSITIVE_FEEDBACK = "userSendPositiveFeedback",
  USER_SEND_NEGATIVE_FEEDBACK = "userSendNegativeFeedback",
}

export interface CommonPayload {
  date: string;
  locale: string;
  url: string;
}

// The enriched optional fields are populated on `userAddedToCart`: full data
// of the product actually added (which can be a Dialog suggestion) plus the
// PDP-context product under `page*` so integrations can tell them apart.
export interface GenericAssistantEventPayload {
  userId?: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
  price?: string;
  currency?: string;
  productTitle?: string;
  variantTitle?: string;
  productUrl?: string;
  pageProductId?: string;
  pageVariantId?: string;
}

export type AssistantEventPayload = GenericAssistantEventPayload;

export interface AssistantEvent<T = AssistantEventPayload> {
  type: AssistantEvents;
  payload: T;
}
