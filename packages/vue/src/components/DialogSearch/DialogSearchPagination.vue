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
      Previous
    </button>
    <span> Page {{ response.page + 1 }} / {{ response.nbPages }} </span>
    <button
      type="button"
      :disabled="response.page >= response.nbPages - 1"
      @click="props.controller.setPage(response.page + 1)"
    >
      Next
    </button>
  </nav>
</template>

<script setup lang="ts">
import type {
  SearchController,
  SearchControllerState,
} from "@askdialog/dialog-sdk";
import { computed } from "vue";

interface Props {
  controller: SearchController;
  state: SearchControllerState;
}

const props = defineProps<Props>();

const response = computed(() => props.state.response);
</script>

<style>
.dialog-search-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 4px;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: #737373;
}

.dialog-search-pagination button {
  margin: 0;
  padding: 6px 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 9999px;
  background: #ffffff;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.dialog-search-pagination button:hover:not(:disabled) {
  background-color: #fafafa;
}

.dialog-search-pagination button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
