// @vitest-environment jsdom
import { act } from "react";
import type { ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Dialog } from "@askdialog/dialog-sdk";
import { DialogBlockSuggestions } from "./DialogBlockSuggestions";
import { DialogInput } from "./DialogInput";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const product = { productId: "8123456789", productTitle: "Night cream" };

describe("product block questions", () => {
  let client: Dialog;
  let sendProductMessage: ReturnType<typeof vi.fn>;
  let container: HTMLDivElement;
  let root: Root;

  const render = (element: ReactElement): void => {
    act(() => root.render(element));
  };

  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
    sendProductMessage = vi.fn();
    client = {
      locale: "fr",
      theme: { primaryColor: "#000000", ctaTextColor: "#ffffff" },
      sendProductMessage,
    } as unknown as Dialog;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("sends a typed question as typed, not as a suggestion", () => {
    render(<DialogInput client={client} {...product} />);
    const input = container.querySelector("input") as HTMLInputElement;

    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setValue?.call(input, "Can I use it on dry hair?");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => container.querySelector("button")?.click());

    expect(sendProductMessage).toHaveBeenCalledTimes(1);
    const sent = sendProductMessage.mock.calls[0][0];
    expect(sent.question).toBe("Can I use it on dry hair?");
    expect(sent.fromQuestionSuggestion).not.toBe(true);
  });

  it("sends a clicked suggestion as a suggestion", () => {
    render(
      <DialogBlockSuggestions
        client={client}
        questions={[{ id: null, question: "Is it vegan?" }]}
        recommendationId={null}
        {...product}
      />,
    );

    act(() => container.querySelector("button")?.click());

    expect(sendProductMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "Is it vegan?",
        fromQuestionSuggestion: true,
      }),
    );
  });
});
