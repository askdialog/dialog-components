import { describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";
import { CartSnapshot } from "../types/events";

const buildDialog = (
  getCart?: () => Promise<CartSnapshot | null>,
  disableAddToCart = false,
): Dialog => {
  const dialog = Object.create(Dialog.prototype) as Dialog;
  Object.assign(dialog, {
    _callbacks: {
      addToCart: vi.fn(),
      getProduct: vi.fn(),
      ...(getCart === undefined ? {} : { getCart }),
    },
    _disableAddToCart: disableAddToCart,
  });

  return dialog;
};

const snapshot: CartSnapshot = {
  lines: [
    {
      productId: "gid://shopify/Product/42",
      variantId: "gid://shopify/ProductVariant/4242",
      quantity: 2,
      unitPrice: 12.5,
    },
  ],
  totalAmount: 25,
  currency: "EUR",
};

describe("Dialog.getCart", () => {
  it("resolves the merchant's snapshot", async () => {
    const getCart = vi.fn().mockResolvedValue(snapshot);
    const dialog = buildDialog(getCart);

    await expect(dialog.getCart()).resolves.toEqual(snapshot);
    expect(getCart).toHaveBeenCalledOnce();
    expect(dialog.canReadCart()).toBe(true);
  });

  it("resolves null when the merchant has no cart", async () => {
    const dialog = buildDialog(vi.fn().mockResolvedValue(null));

    await expect(dialog.getCart()).resolves.toBeNull();
  });

  it("rejects with an explicit configuration error without the callback", async () => {
    const dialog = buildDialog(undefined);

    await expect(dialog.getCart()).rejects.toThrowError(/callbacks\.getCart/);
    expect(dialog.canReadCart()).toBe(false);
  });

  it("is not affected by disableAddToCart", async () => {
    const getCart = vi.fn().mockResolvedValue(snapshot);
    const dialog = buildDialog(getCart, true);

    await expect(dialog.getCart()).resolves.toEqual(snapshot);
    expect(dialog.canReadCart()).toBe(true);
  });
});
