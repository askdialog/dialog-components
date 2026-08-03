import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";
import { AddToCartInput } from "../types/events";
import { SimplifiedProduct } from "../types/product";

// The full Dialog constructor loads the assistant into the DOM; these tests
// only exercise the callback plumbing, so the instance is built from the
// prototype with just the fields the tested methods read.
const buildDialog = (callbacks?: {
  addToCart?: (input: AddToCartInput) => Promise<void>;
  getProduct?: (
    productId: string,
    variantId?: string,
  ) => Promise<SimplifiedProduct>;
}): Dialog => {
  const dialog = Object.create(Dialog.prototype) as Dialog;
  Object.assign(dialog, { _callbacks: callbacks });

  return dialog;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("Dialog without commerce callbacks", () => {
  it("throws an explicit configuration error from getProduct()", async () => {
    const dialog = buildDialog(undefined);

    expect(() => dialog.getProduct("product-1")).toThrowError(
      /callbacks\.getProduct/,
    );
  });

  it("throws an explicit configuration error from addToCart()", async () => {
    const dialog = buildDialog(undefined);

    await expect(
      dialog.addToCart({
        productId: "product-1",
        variantId: "variant-1",
        quantity: 1,
      } as AddToCartInput),
    ).rejects.toThrowError(/callbacks\.addToCart/);
  });

  it("throws when only the other callback was provided", () => {
    const dialog = buildDialog({ addToCart: vi.fn() });

    expect(() => dialog.getProduct("product-1")).toThrowError(
      /callbacks\.getProduct/,
    );
  });
});

describe("Dialog with commerce callbacks (historical construction)", () => {
  it("keeps forwarding getProduct() to the merchant callback", async () => {
    const product = { id: "product-1" } as unknown as SimplifiedProduct;
    const getProduct = vi.fn().mockResolvedValue(product);
    const dialog = buildDialog({ getProduct });

    await expect(dialog.getProduct("product-1", "variant-1")).resolves.toBe(
      product,
    );
    expect(getProduct).toHaveBeenCalledWith("product-1", "variant-1");
  });
});
