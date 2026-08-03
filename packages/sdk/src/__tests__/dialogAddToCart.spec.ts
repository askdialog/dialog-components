import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";
import { EventsHandler } from "../EventsHandler";
import { AddToCartInput, DialogEvents } from "../types/events";

// The full Dialog constructor loads the assistant into the DOM; these tests
// only exercise the add-to-cart pass-through, so the instance is built from
// the prototype with just the fields addToCart/registerAddToCartEvent read.
const buildDialog = (
  addToCartCallback: (input: AddToCartInput) => Promise<void>,
): { dialog: Dialog; emitExternalEvent: ReturnType<typeof vi.fn> } => {
  const eventsHandler = new EventsHandler("fr", "user-1");
  const emitExternalEvent = vi.fn();
  eventsHandler.emitExternalEvent =
    emitExternalEvent as EventsHandler["emitExternalEvent"];

  const dialog = Object.create(Dialog.prototype) as Dialog;
  Object.assign(dialog, {
    _callbacks: { addToCart: addToCartCallback, getProduct: vi.fn() },
    _eventsHandler: eventsHandler,
    _userId: "user-1",
  });

  return { dialog, emitExternalEvent };
};

const enrichedInput: AddToCartInput = {
  productId: "gid://shopify/Product/42",
  variantId: "gid://shopify/ProductVariant/4242",
  quantity: 2,
  price: "19.90",
  currency: "EUR",
  productTitle: "Suggested product",
  variantTitle: "50ml",
  productUrl: "https://shop.example/products/suggested",
  pageProductId: "gid://shopify/Product/1",
  pageVariantId: "gid://shopify/ProductVariant/11",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("Dialog.addToCart", () => {
  it("forwards the full enriched input to the merchant callback", async () => {
    const addToCartCallback = vi.fn().mockResolvedValue(undefined);
    const { dialog } = buildDialog(addToCartCallback);

    await dialog.addToCart(enrichedInput);

    expect(addToCartCallback).toHaveBeenCalledWith(enrichedInput);
  });

  it("emits TRACK_ADD_TO_CART with the enriched fields and the userId", async () => {
    const { dialog, emitExternalEvent } = buildDialog(
      vi.fn().mockResolvedValue(undefined),
    );

    await dialog.addToCart(enrichedInput);

    expect(emitExternalEvent).toHaveBeenCalledWith(
      DialogEvents.TRACK_ADD_TO_CART,
      { userId: "user-1", ...enrichedInput },
    );
  });

  it("keeps working with the legacy minimal input", async () => {
    const addToCartCallback = vi.fn().mockResolvedValue(undefined);
    const { dialog, emitExternalEvent } = buildDialog(addToCartCallback);
    const legacyInput: AddToCartInput = {
      productId: "gid://shopify/Product/42",
      quantity: 1,
    };

    await dialog.addToCart(legacyInput);

    expect(addToCartCallback).toHaveBeenCalledWith(legacyInput);
    expect(emitExternalEvent).toHaveBeenCalledWith(
      DialogEvents.TRACK_ADD_TO_CART,
      { userId: "user-1", ...legacyInput },
    );
  });
});
