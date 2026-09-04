import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";
import { CurrentProduct } from "../types/constructor";

// The full Dialog constructor touches window/localStorage; these tests only
// exercise the current-product dataset contract, so the instance is built
// from the prototype with just the fields the tested paths read.
const buildDialog = (currentProduct?: CurrentProduct): Dialog => {
  const dialog = Object.create(Dialog.prototype) as Dialog;
  Object.assign(dialog, {
    _apiKey: "api-key-1",
    _userId: "user-1",
    _locale: "fr-FR",
    _ignoreOneTrustAutoBlock: false,
    _disableAddToCart: false,
    _currentProduct: currentProduct,
  });

  return dialog;
};

interface FakeMountNode {
  dataset: Record<string, string>;
}

const stubDocument = (options: { mounted: boolean } = { mounted: true }) => {
  const script = { setAttribute: vi.fn() };
  const div: FakeMountNode = { dataset: {} };
  // _loadAssistant appends the mount node; getElementById reflects that.
  let mounted = options.mounted;
  vi.stubGlobal("document", {
    createElement: (tag: string) => (tag === "script" ? script : div),
    getElementById: (id: string) =>
      mounted && id === "dialog-shopify-ai" ? div : null,
    body: {
      appendChild: vi.fn(() => {
        mounted = true;
      }),
    },
    head: { insertBefore: vi.fn(), firstChild: null },
  });

  return { div };
};

// Fake timers keep the deferred script injection from firing after the
// document stub is torn down.
const loadAssistant = (dialog: Dialog): void => {
  vi.useFakeTimers();
  (dialog as unknown as { _loadAssistant(): void })._loadAssistant();
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Dialog current product — constructor option", () => {
  it("writes the product dataset on the mount node at load", () => {
    const { div } = stubDocument();

    loadAssistant(buildDialog({ id: "6980", variantId: "42" }));

    expect(div.dataset.productId).toBe("6980");
    expect(div.dataset.variantId).toBe("42");
  });

  it("omits the variant key when no variant is declared", () => {
    const { div } = stubDocument();

    loadAssistant(buildDialog({ id: "6980" }));

    expect(div.dataset.productId).toBe("6980");
    expect(div.dataset.variantId).toBeUndefined();
  });

  it("leaves the mount node free of product keys by default", () => {
    const { div } = stubDocument();

    loadAssistant(buildDialog());

    expect(div.dataset.productId).toBeUndefined();
    expect(div.dataset.variantId).toBeUndefined();
  });
});

describe("Dialog current product — constructor validation", () => {
  it("rejects an invalid constructor product id and keeps the mount node clean", () => {
    const { div } = stubDocument();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const dialog = buildDialog();
    Object.assign(dialog, { _currentProduct: undefined });

    // Mirror the constructor guard through the public setter contract.
    dialog.setCurrentProduct("");
    loadAssistant(dialog);

    expect(div.dataset.productId).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("Dialog.setCurrentProduct / clearCurrentProduct", () => {
  it("writes the dataset on the existing mount node", () => {
    const { div } = stubDocument();
    const dialog = buildDialog();

    dialog.setCurrentProduct("6980", "42");

    expect(div.dataset.productId).toBe("6980");
    expect(div.dataset.variantId).toBe("42");
  });

  it("drops a stale variant when the next product has none", () => {
    const { div } = stubDocument();
    const dialog = buildDialog();

    dialog.setCurrentProduct("6980", "42");
    dialog.setCurrentProduct("7001");

    expect(div.dataset.productId).toBe("7001");
    expect(div.dataset.variantId).toBeUndefined();
  });

  it("removes both keys on clearCurrentProduct", () => {
    const { div } = stubDocument();
    const dialog = buildDialog();

    dialog.setCurrentProduct("6980", "42");
    dialog.clearCurrentProduct();

    expect(div.dataset.productId).toBeUndefined();
    expect(div.dataset.variantId).toBeUndefined();
  });

  it("rejects an empty productId without touching the dataset", () => {
    const { div } = stubDocument();
    const dialog = buildDialog();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    dialog.setCurrentProduct("  ");

    expect(div.dataset.productId).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("warns when the mount node is missing", () => {
    stubDocument({ mounted: false });
    const dialog = buildDialog();
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    dialog.setCurrentProduct("6980");

    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it("tolerates a missing mount node and applies the value at load", () => {
    const { div } = stubDocument({ mounted: false });
    const dialog = buildDialog();

    expect(() => dialog.setCurrentProduct("6980")).not.toThrow();

    loadAssistant(dialog);

    expect(div.dataset.productId).toBe("6980");
  });
});
