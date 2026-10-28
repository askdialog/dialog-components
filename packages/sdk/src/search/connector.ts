import { SearchController, SearchSnapshot } from "./types";

/** What every connector returns, next to its actions. */
export interface Connector<TRenderState> {
  /** The same object while nothing the connector reads changes. */
  getRenderState(): TRenderState;
  /** Called with a new render state on each change; returns an unsubscribe function. */
  subscribe(listener: (renderState: TRenderState) => void): () => void;
  /** Stop following the controller and remove subscribers; actions then do nothing. */
  dispose(): void;
}

interface ConnectorDefinition<
  TInputs extends readonly unknown[],
  TRenderState,
> {
  /** The values the render state is built from, compared one by one with `Object.is`. */
  read(snapshot: SearchSnapshot): TInputs;
  /** Called when an input changes; returning the previous object notifies no one. */
  render(inputs: TInputs): TRenderState;
}

const sameInputs = (
  previous: readonly unknown[],
  next: readonly unknown[],
): boolean =>
  previous.length === next.length &&
  previous.every((value, index) => Object.is(value, next[index]));

/**
 * Follow a controller and rebuild the render state only when one of its inputs changes.
 * `disposed()` lets a connector's actions do nothing once disposed.
 */
export const createConnector = <
  TInputs extends readonly unknown[],
  TRenderState,
>(
  controller: SearchController,
  { read, render }: ConnectorDefinition<TInputs, TRenderState>,
): Connector<TRenderState> & { disposed(): boolean } => {
  const listeners = new Set<(renderState: TRenderState) => void>();
  let inputs = read(controller.getSnapshot());
  let renderState = render(inputs);
  let disposed = false;

  const unsubscribe = controller.subscribe((snapshot) => {
    const next = read(snapshot);
    if (sameInputs(inputs, next)) {
      return;
    }
    inputs = next;
    const nextRenderState = render(next);
    if (nextRenderState === renderState) {
      return;
    }
    renderState = nextRenderState;
    for (const listener of listeners) {
      listener(renderState);
    }
  });

  return {
    getRenderState: () => renderState,

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    dispose() {
      disposed = true;
      unsubscribe();
      listeners.clear();
    },

    disposed: () => disposed,
  };
};
