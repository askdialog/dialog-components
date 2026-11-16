<template>
  <button
    v-for="(question, index) in props.questions"
    :key="question.question"
    :ref="(button) => setButton(button, index)"
    class="dialog-block-suggestions-item"
    @click="handleClick(question, index)"
  >
    <AiStarsIcon
      class="dialog-block-suggestions-item-icon"
      :color="props.client.theme.primaryColor"
    />
    <span class="dialog-block-suggestions-item-label">
      {{ question.question }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { trackDialogEvent } from "@askdialog/dialog-sdk";
import type { Dialog, Suggestion } from "@askdialog/dialog-sdk";
import {
  createImpressionTracker,
  type ImpressionTracker,
} from "@askdialog/dialog-sdk/impressions";
import { onBeforeUnmount, onMounted, watch } from "vue";
import AiStarsIcon from "../../icons/AiStarsIcon.vue";
import {
  PRODUCT_QUESTION_CLICKED,
  PRODUCT_QUESTION_VIEWED,
  productQuestionEventProperties,
} from "./productQuestionEvents";

const props = defineProps<{
  client: Dialog;
  questions: Suggestion["questions"];
  recommendationId?: Suggestion["recommendationId"];
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
}>();

const buttons: (Element | null)[] = [];
const setButton = (button: unknown, index: number) => {
  buttons[index] = button instanceof Element ? button : null;
};

let tracker: ImpressionTracker | undefined;

const eventContext = () => ({
  productId: props.productId,
  locale: props.client.locale,
  recommendationId: props.recommendationId,
});

// A question without an id (legacy reader) is not measured.
const observeQuestions = () => {
  tracker?.disconnect();
  const viewed = new Map<string, number>();
  const context = eventContext();
  tracker = createImpressionTracker({
    onImpressions: (ids) => {
      for (const id of ids) {
        trackDialogEvent(
          PRODUCT_QUESTION_VIEWED,
          productQuestionEventProperties(context, id, viewed.get(id) ?? 0),
        );
      }
    },
  });
  props.questions.forEach(({ id }, index) => {
    const button = buttons[index];
    if (id && button) {
      viewed.set(id, index);
      tracker?.observe(button, id);
    }
  });
};

onMounted(observeQuestions);
watch(
  () =>
    [
      props.client,
      props.productId,
      props.recommendationId,
      props.questions,
    ] as const,
  observeQuestions,
  { flush: "post" },
);
onBeforeUnmount(() => tracker?.disconnect());

const handleClick = (
  question: Suggestion["questions"][number],
  index: number,
) => {
  if (question.id) {
    trackDialogEvent(
      PRODUCT_QUESTION_CLICKED,
      productQuestionEventProperties(eventContext(), question.id, index),
    );
  }
  props.client.sendProductMessage({
    productId: props.productId,
    productTitle: props.productTitle,
    selectedVariantId: props.selectedVariantId,
    question: question.question,
    fromQuestionSuggestion: true,
  });
};
</script>

<style scoped>
.dialog-block-suggestions-item {
  border-radius: 18px;
  background-color: #f1f1f1;
  border: none;
  outline: none;
  padding: 12px 16px;
  width: fit-content;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
  background-color: white;
  align-items: center;
  gap: 8px;
  border: 1px solid #dddce2;
  border-radius: 24px;
}
.dialog-block-suggestions-item:hover {
  transform: scale(1.01);
}
.dialog-block-suggestions-item-label {
  color: var(--dialog-theme-content-color, #575665);
  font-size: var(--dialog-theme-content-font-size, 14px);
  font-weight: 500;
  text-align: start;
  flex: 1;
}
.dialog-block-suggestions-item-icon {
  path {
    stroke: var(--dialog-theme-primary-color);
  }
}
</style>
