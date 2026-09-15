<script setup lang="ts">
import type { Dialog } from "@askdialog/dialog-sdk";
import {
  DialogSearchBar,
  DialogSearchResults,
  type SearchProductsLayout,
  useDialogSearch,
} from "@askdialog/dialog-vue";
import { ref } from "vue";

const props = defineProps<{
  client: Dialog;
}>();

const layout = ref<SearchProductsLayout>("list");

// Only for a catalog exposing a collections index: a missing one fails the whole search.
const sections =
  import.meta.env.VITE_DIALOG_SEARCH_COLLECTIONS === "true"
    ? [{ index: "collections" as const, hitsPerPage: 5 }]
    : [];

const { controller, state, theme } = useDialogSearch({
  client: props.client,
  language: "fr",
  currency: props.client.currency,
  sections,
});
</script>

<template>
  <section class="search-demo">
    <label class="search-demo-layout">
      Products layout
      <select v-model="layout">
        <option value="list">list</option>
        <option value="grid">grid</option>
      </select>
    </label>
    <DialogSearchBar
      :controller="controller"
      placeholder="Search the catalog..."
    />
    <DialogSearchResults
      :controller="controller"
      :state="state"
      locale="fr-FR"
      :theme="theme"
      :layout="layout"
    />
  </section>
</template>

<style scoped>
.search-demo {
  width: 384px;
  max-width: calc(100vw - 40px);
  margin: 20px;
}

.search-demo-layout {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
}
</style>
