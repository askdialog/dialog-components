<template>
  <section class="dialog-search-products">
    <div class="dialog-search-section-head">
      <p class="dialog-search-label">
        {{ props.messages.productsLabel
        }}<span
          v-if="response !== undefined && response.nbHits > 0"
          class="dialog-search-label-count"
        >
          · {{ props.messages.resultsCount(response.nbHits) }}</span
        >
      </p>
    </div>
    <ul class="dialog-search-results">
      <li v-if="hits.length === 0" class="dialog-search-empty" role="status">
        {{ props.messages.noResults }}
      </li>
      <DialogSearchProductCard
        v-for="(hit, index) in hits"
        v-else
        :key="hit.objectID"
        :controller="props.controller"
        :hit="hit"
        :index="index"
        :locale="props.locale"
        :query="props.state.query"
      />
    </ul>
    <DialogSearchPagination
      v-if="!props.hasSeeAll"
      :controller="props.controller"
      :state="props.state"
      :locale="props.locale"
    />
  </section>
</template>

<script setup lang="ts">
import type {
  SearchController,
  SearchControllerState,
} from "@askdialog/dialog-sdk";
import { computed } from "vue";
import DialogSearchPagination from "./DialogSearchPagination.vue";
import DialogSearchProductCard from "./DialogSearchProductCard.vue";
import type { SearchMessages } from "./searchMessages";

const props = defineProps<{
  controller: SearchController;
  state: SearchControllerState;
  locale: string | undefined;
  messages: SearchMessages;
  /** The footer link replaces in-panel pagination when set. */
  hasSeeAll: boolean;
}>();

const response = computed(() => props.state.response);
const hits = computed(() => response.value?.hits ?? []);
</script>

<style>
.dialog-search-products {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 20px 24px 12px;
  overflow-y: auto;
}

.dialog-search-products .dialog-search-section-head {
  padding: 0 8px;
}

.dialog-search-results {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dialog-search-empty {
  padding: 8px;
  color: var(--dso-text-sec);
}

@media (min-width: 768px) {
  .dialog-search-panel--grid .dialog-search-results {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
}

@media (max-width: 767px) {
  .dialog-search-products {
    gap: 6px;
    padding: 0 8px 8px;
    overflow: visible;
  }
}
</style>
