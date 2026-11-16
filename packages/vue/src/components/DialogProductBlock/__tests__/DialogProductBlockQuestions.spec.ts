// @vitest-environment jsdom
import type { Dialog } from "@askdialog/dialog-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Component, createApp, h, nextTick } from "vue";
import DialogBlockSuggestions from "../DialogBlockSuggestions.vue";
import DialogInput from "../DialogInput.vue";

const product = { productId: "8123456789", productTitle: "Night cream" };

describe("product block questions", () => {
  let client: Dialog;
  let sendProductMessage: ReturnType<typeof vi.fn>;
  let container: HTMLDivElement;
  let unmount: () => void;

  const render = (component: Component, props: Record<string, unknown>) => {
    const app = createApp({ render: () => h(component, props) });
    app.mount(container);
    unmount = () => app.unmount();
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
  });

  afterEach(() => {
    unmount();
    container.remove();
    vi.unstubAllGlobals();
  });

  it("sends a typed question as typed, not as a suggestion", async () => {
    render(DialogInput, { client, ...product });
    const input = container.querySelector("input") as HTMLInputElement;

    input.value = "Can I use it on dry hair?";
    input.dispatchEvent(new Event("input"));
    await nextTick();
    container.querySelector("button")?.click();

    expect(sendProductMessage).toHaveBeenCalledTimes(1);
    const sent = sendProductMessage.mock.calls[0][0];
    expect(sent.question).toBe("Can I use it on dry hair?");
    expect(sent.fromQuestionSuggestion).not.toBe(true);
  });

  it("sends a clicked suggestion as a suggestion", () => {
    render(DialogBlockSuggestions, {
      client,
      questions: [{ id: null, question: "Is it vegan?" }],
      recommendationId: null,
      ...product,
    });

    container.querySelector("button")?.click();

    expect(sendProductMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "Is it vegan?",
        fromQuestionSuggestion: true,
      }),
    );
  });
});
