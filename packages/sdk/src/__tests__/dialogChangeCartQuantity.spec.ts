import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";
import { ChangeCartQuantityInput } from "../types/events";

const buildDialog = (
  changeCartQuantity?: (input: ChangeCartQuantityInput) => Promise<void>,
  disableAddToCart = false,
): Dialog => {
  const dialog = Object.create(Dialog.prototype) as Dialog;
  Object.assign(dialog, {
    _callbacks: {
      addToCart: vi.fn(),
      getProduct: vi.fn(),
      ...(changeCartQuantity === undefined ? {} : { changeCartQuantity }),
    },
    _disableAddToCart: disableAddToCart,
  });

  return dialog;
};

const input: ChangeCartQuantityInput = {
  productId: "gid://shopify/Product/42",
  variantId: "gid://shopify/ProductVariant/4242",
  quantity: 2,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("Dialog.changeCartQuantity", () => {
  it("forwards the input to the merchant callback", async () => {
    const changeCartQuantity = vi.fn().mockResolvedValue(undefined);
    const dialog = buildDialog(changeCartQuantity);

    await dialog.changeCartQuantity(input);

    expect(changeCartQuantity).toHaveBeenCalledWith(input);
    expect(dialog.canChangeCartQuantity()).toBe(true);
  });

  it("throws an explicit configuration error without the callback", async () => {
    const dialog = buildDialog(undefined);

    await expect(dialog.changeCartQuantity(input)).rejects.toThrowError(
      /callbacks\.changeCartQuantity/,
    );
    expect(dialog.canChangeCartQuantity()).toBe(false);
  });

  it("is a no-op and reports no capability when disableAddToCart is set", async () => {
    const changeCartQuantity = vi.fn().mockResolvedValue(undefined);
    const dialog = buildDialog(changeCartQuantity, true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(dialog.changeCartQuantity(input)).resolves.toBeUndefined();

    expect(changeCartQuantity).not.toHaveBeenCalled();
    expect(dialog.canChangeCartQuantity()).toBe(false);
    expect(warn).toHaveBeenCalledOnce();

    warn.mockRestore();
  });
});
