<template>
  <ThemeProvider :theme="props.client.theme">
    <div id="dialog-instant" class="dialog-block-container">
      <DialogBlockHeader :title="assistantName" :description="description" />
      <DialogBlockSuggestionsContainer
        :client="props.client"
        :questions="suggestionData?.questions"
        :is-loading="isFetchingSuggestions"
        :product-id="props.productId"
        :product-title="props.productTitle"
        :selected-variant-id="props?.selectedVariantId"
      />
      <DialogInput
        v-if="props.enableInput"
        :client="props.client"
        :placeholder="inputPlaceholder"
        :product-id="props.productId"
        :product-title="props.productTitle"
        :selected-variant-id="props?.selectedVariantId"
      />
    </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
import { Dialog, type Suggestion } from "@askdialog/dialog-sdk";
import DialogBlockHeader from "./DialogBlockHeader.vue";
import DialogBlockSuggestionsContainer from "./DialogBlockSuggestionsContainer.vue";
import DialogInput from "./DialogInput.vue";
import ThemeProvider from "./ThemeProvider.vue";
import { computed, ref, watch } from "vue";

interface Props {
  client: Dialog;
  productId: string;
  productTitle: string;
  selectedVariantId?: string;
  enableInput?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enableInput: true,
  selectedVariantId: undefined,
});
const isFetchingSuggestions = ref(true);
const suggestionData = ref<Suggestion | undefined>(undefined);
const fetchSequence = ref(0);

const assistantName = computed(() => {
  return isFetchingSuggestions.value ? "" : suggestionData.value?.assistantName;
});
const description = computed(() => {
  return isFetchingSuggestions.value ? "" : suggestionData.value?.description;
});
const inputPlaceholder = computed(() => {
  return isFetchingSuggestions.value
    ? ""
    : suggestionData.value?.inputPlaceholder;
});

const handleFetchingSuggestions = async () => {
  const sequence = ++fetchSequence.value;
  isFetchingSuggestions.value = true;
  suggestionData.value = undefined;
  try {
    const suggestion = await props.client.getSuggestions(props.productId);
    if (sequence === fetchSequence.value) {
      suggestionData.value = suggestion;
    }
  } catch (error) {
    console.error("error", error);
  } finally {
    if (sequence === fetchSequence.value) {
      isFetchingSuggestions.value = false;
    }
  }
};

watch(
  () => [props.client, props.productId] as const,
  () => {
    void handleFetchingSuggestions();
  },
  { immediate: true },
);
</script>

<style scoped>
.dialog-block-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 24px 0;
  width: fit-content;
  gap: 24px;
}
.dialog-block-container > * {
  box-sizing: border-box;
}
</style>
