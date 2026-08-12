import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";

// The full Dialog constructor touches window/localStorage; these tests only
// exercise the assistant script injection, so the instance is built from the
// prototype with just the fields _loadAssistant reads.
const buildDialog = (
  overrides: Partial<{
    _ignoreOneTrustAutoBlock: boolean;
    _disableAddToCart: boolean;
  }> = {},
): Dialog => {
  const dialog = Object.create(Dialog.prototype) as Dialog;
  Object.assign(dialog, {
    _apiKey: "api-key-1",
    _userId: "user-1",
    _locale: "fr-FR",
    _ignoreOneTrustAutoBlock: false,
    _disableAddToCart: false,
    ...overrides,
  });

  return dialog;
};

interface FakeScript {
  setAttribute: ReturnType<typeof vi.fn>;
  type?: string;
  src?: string;
}

const stubDocument = (): {
  script: FakeScript;
  div: { dataset: Record<string, string> };
  insertBefore: ReturnType<typeof vi.fn>;
} => {
  const script: FakeScript = { setAttribute: vi.fn() };
  const div = { dataset: {} as Record<string, string> };
  const insertBefore = vi.fn();
  vi.stubGlobal("document", {
    createElement: (tag: string) => (tag === "script" ? script : div),
    body: { appendChild: vi.fn() },
    head: { insertBefore, firstChild: null },
  });

  return { script, div, insertBefore };
};

const loadAssistant = (dialog: Dialog): void => {
  (dialog as unknown as { _loadAssistant(): void })._loadAssistant();
  vi.advanceTimersByTime(50);
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Dialog._loadAssistant OneTrust exemption", () => {
  it("sets data-ot-ignore on the injected script when opted in", () => {
    vi.useFakeTimers();
    const { script, insertBefore } = stubDocument();

    loadAssistant(buildDialog({ _ignoreOneTrustAutoBlock: true }));

    expect(script.setAttribute).toHaveBeenCalledWith("data-ot-ignore", "");
    expect(insertBefore).toHaveBeenCalledWith(script, null);
  });

  it("leaves the injected script untouched by default", () => {
    vi.useFakeTimers();
    const { script, insertBefore } = stubDocument();

    loadAssistant(buildDialog({ _ignoreOneTrustAutoBlock: false }));

    expect(script.setAttribute).not.toHaveBeenCalled();
    expect(insertBefore).toHaveBeenCalledWith(script, null);
  });
});

describe("Dialog._loadAssistant add-to-cart toggle", () => {
  it("flags the injected div when disableAddToCart is set", () => {
    vi.useFakeTimers();
    const { div } = stubDocument();

    loadAssistant(buildDialog({ _disableAddToCart: true }));

    expect(div.dataset.disableAddToCart).toBe("true");
  });

  it("leaves the div free of the flag by default", () => {
    vi.useFakeTimers();
    const { div } = stubDocument();

    loadAssistant(buildDialog({ _disableAddToCart: false }));

    expect(div.dataset.disableAddToCart).toBeUndefined();
  });
});
