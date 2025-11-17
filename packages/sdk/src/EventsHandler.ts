import {
  AssistantEvent,
  AssistantEventPayload,
  CommonPayload,
  DIALOG_ASSISTANT_EVENT,
  GenericAssistantEventPayload,
} from './types/assistantEvent';
import { DIALOG_CUSTOM_EVENT, DialogEvent } from './types/events';

export class EventsHandler {
  private _locale: string;
  private _userId?: string;

  constructor(locale: string, userId?: string) {
    this._locale = locale;
    this._userId = userId;
  }

  public emitExternalEvent(
    type: DialogEvent['type'],
    payload?: DialogEvent['payload'],
  ): void {
    const event = new CustomEvent(DIALOG_CUSTOM_EVENT, {
      detail: { type, payload },
    });

    window.dispatchEvent(event);
  }

  public emitAssistantEvent(
    type: AssistantEvent['type'],
    payload?: GenericAssistantEventPayload,
  ): void {
    const event = new CustomEvent(DIALOG_ASSISTANT_EVENT, {
      detail: { type, payload },
    });

    window.dispatchEvent(event);
  }

  public onAssistantEvent(
    listener: (
      event: AssistantEvent<CommonPayload & AssistantEventPayload>,
    ) => void,
  ): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<AssistantEvent>;

      const commonPayload: CommonPayload = {
        locale: this._locale,
        url: window.location.href,
        date: new Date().toISOString(),
      };

      listener({
        type: customEvent.detail.type,
        payload: {
          userId: this._userId,
          ...commonPayload,
          ...customEvent.detail.payload,
        },
      });
    };

    window.addEventListener(DIALOG_ASSISTANT_EVENT, handler);

    return () => {
      window.removeEventListener(DIALOG_ASSISTANT_EVENT, handler);
    };
  }
}
