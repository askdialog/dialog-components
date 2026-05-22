import {
  AssistantEvent,
  AssistantEventPayload,
  CommonPayload,
  DIALOG_ASSISTANT_EVENT,
  GenericAssistantEventPayload,
} from "./types/assistantEvent";
import { DIALOG_CUSTOM_EVENT, DialogEvent, DialogEvents } from "./types/events";

interface BufferedEvent {
  type: DialogEvent["type"];
  payload?: DialogEvent["payload"];
}

// Tracking events can fire (e.g. add-to-cart on page load) before the host app
// has mounted its listener. We buffer those until a consumer signals readiness,
// then flush, so none are dispatched into the void.
const BUFFERED_EVENT_TYPES: ReadonlySet<DialogEvent["type"]> = new Set([
  DialogEvents.TRACK_ADD_TO_CART,
  DialogEvents.TRACK_SUBMIT_CHECKOUT,
]);

export class EventsHandler {
  private _locale: string;
  private _userId?: string;
  private _consumerReady = false;
  private _bufferedEvents: BufferedEvent[] = [];

  constructor(locale: string, userId?: string) {
    this._locale = locale;
    this._userId = userId;
  }

  public emitExternalEvent(
    type: DialogEvent["type"],
    payload?: DialogEvent["payload"],
  ): void {
    if (!this._consumerReady && BUFFERED_EVENT_TYPES.has(type)) {
      this._bufferedEvents.push({ type, payload });

      return;
    }

    this._dispatchExternalEvent(type, payload);
  }

  // Signalled by the host app once its tracking listener is attached. Flushing
  // here (not on emit) guarantees buffered events reach an existing listener.
  public notifyConsumerReady(): void {
    this._consumerReady = true;

    const buffered = this._bufferedEvents;
    this._bufferedEvents = [];
    buffered.forEach(({ type, payload }) =>
      this._dispatchExternalEvent(type, payload),
    );
  }

  public notifyConsumerGone(): void {
    this._consumerReady = false;
  }

  private _dispatchExternalEvent(
    type: DialogEvent["type"],
    payload?: DialogEvent["payload"],
  ): void {
    const event = new CustomEvent(DIALOG_CUSTOM_EVENT, {
      detail: { type, payload },
    });

    window.dispatchEvent(event);
  }

  public emitAssistantEvent(
    type: AssistantEvent["type"],
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
