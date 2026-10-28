import type { Connector } from "@askdialog/dialog-sdk";
import { onUnmounted, shallowRef, type ShallowRef } from "vue";

/** Follow a connector's render state; the connector is disposed on unmount. */
export const useConnector = <TRenderState>(
  connector: Connector<TRenderState>,
): Readonly<ShallowRef<TRenderState>> => {
  const renderState = shallowRef<TRenderState>(connector.getRenderState());
  const unsubscribe = connector.subscribe((next) => {
    renderState.value = next;
  });

  onUnmounted(() => {
    unsubscribe();
    connector.dispose();
  });

  return renderState;
};
