<template>
  <button
    type="button"
    class="dialog-ask-something-else"
    :disabled="props.disabled"
    @click="handleClick"
  >
    {{ getInputMessages(props.client.locale).askSomethingElse }}
  </button>
</template>

<script setup lang="ts">
import type { Dialog, Suggestion } from "@askdialog/dialog-sdk";
import { getInputMessages } from "./inputMessages";

const props = defineProps<{
  client: Dialog;
  questions: Suggestion["questions"] | undefined;
  disabled: boolean;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}>();

const handleClick = () => {
  props.client.openAssistantWithSuggestions({
    questions: props.questions ?? [],
    product: {
      id: props.productId,
      title: props.productTitle,
      selectedVariantId: props.selectedVariantId,
    },
  });
};
</script>

<style scoped>
.dialog-ask-something-else {
  padding: 12px 16px;
  min-height: 50px;
  width: fit-content;
  display: flex;
  align-items: center;
  font-family: var(--dialog-theme-font-family);
  font-size: var(--dialog-theme-content-font-size, 14px);
  font-weight: 500;
  cursor: pointer;
  border: unset;
  border-radius: var(--dialog-theme-cta-border-type, 24px);
  background-color: var(--dialog-theme-primary-color);
  color: var(--dialog-theme-cta-text-color);
}

.dialog-ask-something-else:hover:not(:disabled) {
  transform: scale(1.02);
}

.dialog-ask-something-else:disabled {
  cursor: default;
  opacity: 0.5;
}
</style>
