<template>
  <li ref="cardRef" class="dialog-search-card">
    <div v-if="href === undefined" class="dialog-search-card-body">
      <DialogSearchProductCardContent :hit="props.hit" :locale="props.locale" />
    </div>
    <a
      v-else
      class="dialog-search-card-body"
      :href="href"
      @click="handleClick"
      @auxclick="handleAuxClick"
    >
      <DialogSearchProductCardContent :hit="props.hit" :locale="props.locale" />
    </a>
  </li>
</template>

<script setup lang="ts">
import type { SearchController, SearchHit } from "@askdialog/dialog-sdk";
import { computed, ref, watch } from "vue";
import DialogSearchProductCardContent from "./DialogSearchProductCardContent.vue";
import { safeProductHref } from "./searchDisplay";

interface Props {
  controller: SearchController;
  hit: SearchHit;
  index: number;
  locale?: string;
}

const props = defineProps<Props>();

const cardRef = ref<HTMLLIElement>();

// Watches `hit` (fresh object per response) so a new response re-observes the
// element even when Vue reuses the DOM node.
watch(
  () => props.hit,
  () => {
    if (cardRef.value !== undefined) {
      props.controller.observeResult(cardRef.value, props.index);
    }
  },
  { immediate: true, flush: "post" },
);

// A modified click (cmd/ctrl/shift/alt) means "open in a new tab/window":
// the SPA adapter can't do that, so record the selection but let the browser
// navigate natively. For a plain click, when the adapter handles the
// in-app transition, suppress the anchor's native navigation so the click
// doesn't also trigger a full-page load. Without an adapter, selectResult
// returns false and the native same-tab navigation proceeds (attribution is
// designed to survive it).
const handleClick = (event: MouseEvent): void => {
  const opensNatively =
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (
    props.controller.selectResult(props.index, { navigate: !opensNatively })
  ) {
    event.preventDefault();
  }
};

// auxclick also fires on right-click; only the middle button opens a tab.
// It always opens natively (new tab), so record attribution without running
// the in-app adapter.
const handleAuxClick = (event: MouseEvent): void => {
  if (event.button === 1) {
    props.controller.selectResult(props.index, { navigate: false });
  }
};

const href = computed(() =>
  props.hit.product.url === undefined
    ? undefined
    : safeProductHref(props.hit.product.url),
);
</script>

<style>
.dialog-search-card {
  width: 100%;
}

.dialog-search-card-body {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
}

a.dialog-search-card-body:hover {
  background: rgba(0, 0, 0, 0.03);
}

.dialog-search-card-image {
  position: relative;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  background: #f2f2f2;
}

.dialog-search-card-image::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  pointer-events: none;
}

.dialog-search-card-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialog-search-card-info {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.dialog-search-card-title {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 13px;
  line-height: 20px;
  color: #171717;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-search-card-price {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: #737373;
}

.dialog-search-card-compare-at {
  color: #a3a3a3;
  text-decoration: line-through;
}
</style>
