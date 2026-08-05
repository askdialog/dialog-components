/* eslint-disable max-lines */
import { uuidv7 } from "uuidv7";
import packageJson from "../package.json";
import { defaultTheme } from "./constants/theme";
import { DialogCallbacks, DialogConstructor } from "./types/constructor";
import { Theme } from "./types/theme";
import {
  DetailedLocaleInfo,
  getDetailedLocaleInfo,
} from "./utils/localization";
import { ANONYMOUS_CUSTOMER_ID, CUSTOMER_ID } from "./constants/user";
import { Suggestion } from "./types/suggestion";
import {
  AddToCartInput,
  DialogEvents,
  GenericQuestionPayload,
  LegacyCheckoutParams,
  OpenAssistantPayload,
  ProductQuestionPayload,
  SubmitCheckoutParams,
} from "./types/events";
import { SimplifiedProduct } from "./types/product";
import { EventsHandler } from "./EventsHandler";
import { loadSuggestions } from "./services/suggestions";
import { searchProducts } from "./services/search";
import { SearchOptions, SearchRequest, SearchResponse } from "./types/search";
import { config } from "./config";
import { AssistantEvent } from "./types/assistantEvent";
import { exposeSdkOnWindowDialog } from "./windowAudit";
export class Dialog {
  public static readonly VERSION = packageJson.version;

  private _apiKey: string;
  private _locale: string;
  private _countryCode?: string;

  private _callbacks?: DialogCallbacks;
  private _theme: Theme;
  private _userId: string;
  private _eventsHandler: EventsHandler;
  private _ignoreOneTrustAutoBlock: boolean;

  constructor({
    apiKey,
    locale,
    countryCode,
    callbacks,
    theme,
    userId,
    ignoreOneTrustAutoBlock,
  }: DialogConstructor) {
    this._apiKey = apiKey;
    this._locale = locale;
    this._countryCode = countryCode;
    this._callbacks = callbacks;
    this._ignoreOneTrustAutoBlock = ignoreOneTrustAutoBlock ?? false;
    this._theme = { ...defaultTheme, ...theme };
    this._userId = this._createOrRetrieveUserId(userId);
    this._eventsHandler = new EventsHandler(locale, userId);
    exposeSdkOnWindowDialog(this, Dialog.VERSION);
    this._loadAssistant();
  }

  public get apiKey(): string {
    return this._apiKey;
  }
  public get theme(): Theme {
    return this._theme;
  }
  public get userId(): string {
    return this._userId;
  }
  public get locale(): string {
    return this._locale;
  }
  public get eventsHandler(): EventsHandler {
    return this._eventsHandler;
  }

  public getLocalizationInformations(): DetailedLocaleInfo | null {
    return getDetailedLocaleInfo(this._locale, this._countryCode);
  }

  private _createOrRetrieveUserId(userId?: string): string {
    if (userId !== undefined) {
      localStorage.setItem(CUSTOMER_ID, userId);

      return userId;
    }

    const existingAnonymousUserId = localStorage.getItem(ANONYMOUS_CUSTOMER_ID);
    if (existingAnonymousUserId !== null) {
      return existingAnonymousUserId;
    }

    const newUserId = uuidv7();
    localStorage.setItem(ANONYMOUS_CUSTOMER_ID, newUserId);

    return newUserId;
  }

  public async getSuggestions(productId: string): Promise<Suggestion> {
    return loadSuggestions(this._apiKey, this._locale, productId);
  }

  /**
   * Typed product search through the Nest public endpoint. Stateless: one
   * request per call, cancellation belongs to the caller via
   * `options.signal` (previous searches are never cancelled automatically).
   * Rejects with `DialogSearchError` on a non-2xx answer, and with the
   * native AbortError / network error otherwise.
   */
  public search(
    request: SearchRequest,
    options?: SearchOptions,
  ): Promise<SearchResponse> {
    return searchProducts(this._apiKey, request, options);
  }

  // TODO: Not yet implemented on assistant
  public openAssistant(params: OpenAssistantPayload): void {
    this._eventsHandler.emitExternalEvent(DialogEvents.OPEN_ASSISTANT, params);
  }

  // TODO: Not yet implemented on assistant
  public closeAssistant(): void {
    this._eventsHandler.emitExternalEvent(DialogEvents.CLOSE_ASSISTANT);
  }

  public sendProductMessage(params: ProductQuestionPayload): void {
    this._eventsHandler.emitExternalEvent(DialogEvents.SEND_MESSAGE, params);
  }

  public sendGenericMessage(params: GenericQuestionPayload): void {
    this._eventsHandler.emitExternalEvent(
      DialogEvents.SEND_GENERIC_QUESTION,
      params,
    );
  }

  public onAssistantEvent(listener: (event: AssistantEvent) => void): void {
    this._eventsHandler.onAssistantEvent(listener);
  }

  public dispatchAssistantEvent(event: AssistantEvent): void {
    this._eventsHandler.emitAssistantEvent(event.type, event.payload);
  }

  public getProduct(
    productId: string,
    variantId?: string,
  ): Promise<SimplifiedProduct> {
    return this._getCallbacksOrThrow("getProduct").getProduct(
      productId,
      variantId,
    );
  }

  // The full input (including the optional enriched product fields) is
  // forwarded to the merchant callback and to the tracking event, so
  // integrations can consume the added-product data wherever they hook in.
  public async addToCart(input: AddToCartInput): Promise<void> {
    await this._getCallbacksOrThrow("addToCart").addToCart(input);
    this.registerAddToCartEvent(input);

    return;
  }

  // Callbacks are optional at construction; the two commerce methods assert
  // theirs at call time with an integration-facing configuration error.
  private _getCallbacksOrThrow(name: keyof DialogCallbacks): DialogCallbacks {
    if (this._callbacks?.[name] === undefined) {
      throw new Error(
        `Dialog: \`callbacks.${name}\` was not provided to the constructor; ${name}() is unavailable on this instance.`,
      );
    }

    return this._callbacks;
  }

  public registerAddToCartEvent(input: AddToCartInput): void {
    this._eventsHandler.emitExternalEvent(DialogEvents.TRACK_ADD_TO_CART, {
      userId: this._userId,
      ...input,
    });
  }

  // Order-level: call ONCE per completed order with the order total.
  // `orderValue` is what the dashboard's "Revenue generated" reads — do not
  // call this per line item (that has no total and revenue resolves to 0).
  //
  // The legacy per-line signature (`{ productId, quantity, price }`) is still
  // accepted for backward compatibility so existing installs keep working
  // after an upgrade, but it is deprecated: it carries no order total.
  public registerSubmitCheckoutEvent(
    params: SubmitCheckoutParams | LegacyCheckoutParams,
  ): void {
    if ("orderValue" in params) {
      this._eventsHandler.emitExternalEvent(
        DialogEvents.TRACK_SUBMIT_CHECKOUT,
        {
          userId: this._userId,
          orderValue: params.orderValue,
          currency: params.currency,
          transactionId: params.transactionId,
          items: params.items,
        },
      );

      return;
    }

    this._eventsHandler.emitExternalEvent(DialogEvents.TRACK_SUBMIT_CHECKOUT, {
      userId: this._userId,
      productId: params.productId,
      variantId: params.variantId,
      quantity: params.quantity,
      price: params.price,
      currency: params.currency,
    });
  }

  private _loadAssistant(): void {
    const localeInfo = getDetailedLocaleInfo(this._locale, this._countryCode);

    if (localeInfo === null) {
      console.error("Missing locale information");

      return;
    }

    const div = document.createElement("div");
    div.id = "dialog-shopify-ai";
    div.dataset.shopIsoCode = localeInfo.languageCode;
    div.dataset.apiKey = this._apiKey;
    div.dataset.userId = this._userId;
    div.dataset.countryCode = localeInfo.countryCode;
    div.dataset.language = localeInfo.language;
    document.body.appendChild(div);

    setTimeout(() => {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.defer = true;
      script.async = true;
      script.type = "module";
      script.src = config.assistantUrl;
      if (this._ignoreOneTrustAutoBlock) {
        // OneTrust auto-blocking also intercepts dynamically injected scripts
        // (by domain), so the merchant's data-ot-ignore on their own SDK tag
        // cannot cover this one — it has to be set here.
        script.setAttribute("data-ot-ignore", "");
      }
      document.head.insertBefore(script, document.head.firstChild);
    }, 50);
  }
}
