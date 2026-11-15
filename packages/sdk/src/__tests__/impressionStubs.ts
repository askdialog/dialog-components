import { afterEach, beforeEach, vi } from "vitest";

// Fake timers, an IntersectionObserver driven by `intersect` and the window
// page lifecycle driven by `fireWindowEvent`, for the impression tracker specs.
type ObserverCallback = (
  entries: Array<Partial<IntersectionObserverEntry>>,
) => void;

let observerCallback: ObserverCallback;
const windowListeners = new Map<string, (event: unknown) => void>();

export const element = (): Element => ({}) as Element;

export const intersect = (target: Element, ratio: number): void => {
  observerCallback([{ target, intersectionRatio: ratio }]);
};

export const fireWindowEvent = (type: string, event: unknown = {}): void => {
  windowListeners.get(type)?.(event);
};

export function stubImpressionEnvironment(): void {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: ObserverCallback) {
          observerCallback = callback;
        }
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal("window", {
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        windowListeners.set(type, listener);
      },
      removeEventListener: (type: string) => {
        windowListeners.delete(type);
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    windowListeners.clear();
  });
}
