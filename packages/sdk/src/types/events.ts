export const DIALOG_CUSTOM_EVENT = 'enableDialogAssistantEvent';

export enum DialogEvents {
  OPEN_ASSISTANT = 'open_assistant',
  CLOSE_ASSISTANT = 'close_assistant',
  SEND_MESSAGE = 'PRODUCT_QUESTION',
  SEND_GENERIC_QUESTION = 'GENERIC_QUESTION',
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

export type DiagnosticButtonType = 'productPageButton' | 'simpleButton';

export interface DiagnosticPayload {
  productTitle: string;
  handle: string;
  productId: string;
  selectedVariantId?: string;
  buttonType: DiagnosticButtonType;
  url: string;
}

export type DialogEventPayload =
  | ProductQuestionPayload
  | GenericQuestionPayload
  | DiagnosticPayload
  | OpenAssistantPayload;

export interface DialogEvent<T = DialogEventPayload> {
  type: DialogEvents;
  payload: T;
}
