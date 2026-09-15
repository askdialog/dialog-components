<template>
  <nav
    v-if="response !== undefined && response.nbPages > 1"
    aria-label="Search results pages"
    class="dialog-search-pagination"
  >
    <button
      type="button"
      :disabled="response.page === 0"
      @click="props.controller.setPage(response.page - 1)"
    >
      {{ messages.previous }}
    </button>
    <span>{{ messages.pageOf(response.page + 1, response.nbPages) }}</span>
    <button
      type="button"
      :disabled="response.page >= response.nbPages - 1"
      @click="props.controller.setPage(response.page + 1)"
    >
      {{ messages.next }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import type {
  SearchController,
  SearchControllerState,
} from "@askdialog/dialog-sdk";
import { computed } from "vue";
import { getSearchMessages } from "./searchMessages";

interface Props {
  controller: SearchController;
  state: SearchControllerState;
  locale?: string;
}

const props = defineProps<Props>();

const response = computed(() => props.state.response);
const messages = computed(() => getSearchMessages(props.locale));
</script>

<style>
.dialog-search-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4px 0;
  font-size: 12px;
  color: var(--dso-text-sec);
}

.dialog-search-pagination button {
  margin: 0;
  padding: 6px 14px;
  border: 1px solid var(--dso-border);
  border-radius: var(--dso-r-btn);
  background: transparent;
  font: inherit;
  color: var(--dso-text);
  cursor: pointer;
  transition: background-color 120ms ease;
}

.dialog-search-pagination button:hover:not(:disabled) {
  background-color: var(--dso-hover);
}

.dialog-search-pagination button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
