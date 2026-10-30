import type { Connector, SearchController } from "@askdialog/dialog-sdk";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Connect to `controller` for the component's lifetime: returns the render
 * state, re-rendering on its changes, and the connector's actions.
 */
export const useConnector = <TConnector extends Connector<unknown>>(
  connect: (controller: SearchController) => TConnector,
  controller: SearchController,
): [ReturnType<TConnector["getRenderState"]>, TConnector] => {
  const ref = useRef<{ controller: SearchController; connector: TConnector }>(
    undefined,
  );

  // Recreated on next access after disposal, as StrictMode replays effects.
  const get = useCallback((): TConnector => {
    if (ref.current?.controller !== controller) {
      ref.current = { controller, connector: connect(controller) };
    }

    return ref.current.connector;
  }, [connect, controller]);

  // Declared before the store subscription, so its replay subscribes to the new connector.
  useEffect(() => {
    const connector = get();

    return () => {
      connector.dispose();
      if (ref.current?.connector === connector) {
        ref.current = undefined;
      }
    };
  }, [get]);

  const subscribe = useCallback(
    (listener: () => void) => get().subscribe(listener),
    [get],
  );
  const getRenderState = useCallback(
    () => get().getRenderState() as ReturnType<TConnector["getRenderState"]>,
    [get],
  );
  const renderState = useSyncExternalStore(
    subscribe,
    getRenderState,
    getRenderState,
  );

  return [renderState, get()];
};
