export const DIALOG_ASSISTANT_EVENT = 'dialogAssistantEvent';

export enum AssistantEvents {
  USER_OPENED_ASSISTANT = 'userOpenedAssistant',
  USER_CLOSED_ASSISTANT = 'userClosedAssistant',
  USER_SENT_MESSAGE = 'userSentMessage',
  USER_CLICKED_ON_PRODUCT_CARD = 'userClickedOnProductCard',
  USER_OPENED_RECOMMENDATION = 'userOpenedRecommendation',
  USER_ADDED_TO_CART = 'userAddedToCart',
  USER_SEND_POSITIVE_FEEDBACK = 'userSendPositiveFeedback',
  USER_SEND_NEGATIVE_FEEDBACK = 'userSendNegativeFeedback',
}

export interface CommonPayload {
  date: string;
  locale: string;
  url: string;
}

export interface GenericAssistantEventPayload {
  userId?: string;
  productId?: string;
  variantId?: string;
}

export type AssistantEventPayload = GenericAssistantEventPayload;

export interface AssistantEvent<T = AssistantEventPayload> {
  type: AssistantEvents;
  payload: T;
}
