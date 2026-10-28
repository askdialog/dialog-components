<template>
  <nav
    v-if="pagination.visible"
    aria-label="Search results pages"
    class="dialog-search-pagination"
  >
    <button
      type="button"
      :disabled="pagination.isFirstPage"
      @click="connector.refine(pagination.currentPage - 1)"
    >
      {{ texts.previous }}
    </button>
    <span>{{
      texts.pageOf(pagination.currentPage + 1, pagination.nbPages)
    }}</span>
    <button
      type="button"
      :disabled="pagination.isLastPage"
      @click="connector.refine(pagination.currentPage + 1)"
    >
      {{ texts.next }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import {
  connectPagination,
  type SearchController,
  type SearchSnapshot,
} from "@askdialog/dialog-sdk";
import { computed } from "vue";
import { searchTexts } from "./searchTexts";
import { useConnector } from "./useConnector";

interface Props {
  controller: SearchController;
  state: SearchSnapshot;
  /** BCP 47 locale of the labels; omitted, the shopper's language. */
  locale?: string;
}

const props = defineProps<Props>();

// The controller is fixed for the component's lifetime.
const connector = connectPagination(props.controller);
const pagination = useConnector(connector);
const texts = computed(() => searchTexts(props.locale, props.state.context));
</script>

<style>
.dialog-search-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4px 0;
  font-size: 12px;
  color: var(--dso-text-sec, #737373);
}

.dialog-search-pagination button {
  margin: 0;
  padding: 6px 14px;
  border: 1px solid var(--dso-border, rgba(0, 0, 0, 0.1));
  border-radius: var(--dso-r-btn, 10px);
  background: transparent;
  font: inherit;
  color: var(--dso-text, #171717);
  cursor: pointer;
  transition: background-color 120ms ease;
}

.dialog-search-pagination button:hover:not(:disabled) {
  background-color: var(--dso-hover, rgba(0, 0, 0, 0.04));
}

.dialog-search-pagination button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
