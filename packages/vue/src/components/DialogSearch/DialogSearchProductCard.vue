<template>
  <li ref="cardRef" class="dialog-search-card">
    <component
      :is="href === undefined ? 'div' : 'a'"
      class="dialog-search-product"
      :href="href"
      @click="handleClick"
      @auxclick="handleAuxClick"
    >
      <span class="dialog-search-product-thumb" aria-hidden="true">
        <img
          v-if="props.hit.imageUrl !== undefined && props.hit.imageUrl !== ''"
          :src="props.hit.imageUrl"
          alt=""
          loading="lazy"
        />
      </span>
      <span class="dialog-search-product-title">
        <HighlightedTitle :title="hitTitle(props.hit)" :query="props.query" />
      </span>
      <span v-if="price !== ''" class="dialog-search-product-price">{{
        price
      }}</span>
    </component>
  </li>
</template>

<script setup lang="ts">
import type { SearchController, SearchHit } from "@askdialog/dialog-sdk";
import { computed, ref, watch } from "vue";
import HighlightedTitle from "./HighlightedTitle.vue";
import { formatSearchPrice, hitHref, hitTitle } from "./searchDisplay";

interface Props {
  controller: SearchController;
  hit: SearchHit;
  index: number;
  locale?: string;
  /** Committed query, emphasized inside the title. */
  query?: string;
}

const props = withDefaults(defineProps<Props>(), {
  locale: undefined,
  query: "",
});

const cardRef = ref<HTMLLIElement>();

// Reobserve each response even when the framework reuses the DOM node.
watch(
  () => props.hit,
  () => {
    if (cardRef.value !== undefined) {
      props.controller.observeResult(cardRef.value, props.index);
    }
  },
  { immediate: true, flush: "post" },
);

const href = computed(() => hitHref(props.hit));
const price = computed(() =>
  formatSearchPrice(props.hit.priceRange, props.locale),
);

// Preserve native modified clicks. Prevent default navigation only when the
// adapter handles the click; record selection in both cases.
const handleClick = (event: MouseEvent): void => {
  if (href.value === undefined) {
    return;
  }
  const opensNatively =
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (
    props.controller.selectResult(props.index, { navigate: !opensNatively })
  ) {
    event.preventDefault();
  }
};

// Track middle-clicks without the navigation adapter; ignore right-clicks.
const handleAuxClick = (event: MouseEvent): void => {
  if (href.value !== undefined && event.button === 1) {
    props.controller.selectResult(props.index, { navigate: false });
  }
};
</script>

<style>
.dialog-search-card {
  width: 100%;
}

.dialog-search-product {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 8px;
  border-radius: var(--dso-r-item);
  color: inherit;
  text-decoration: none;
}

a.dialog-search-product:hover {
  background: var(--dso-hover);
}

.dialog-search-product-thumb {
  flex: none;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border: 1px solid var(--dso-border);
  border-radius: var(--dso-r-thumb);
  background: var(--dso-thumb);
}

.dialog-search-product-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialog-search-product-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.dialog-search-product-price {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .dialog-search-panel--grid .dialog-search-product {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--dso-border);
  }

  .dialog-search-panel--grid .dialog-search-product-thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 3;
    border: 0;
  }
}

@media (max-width: 767px) {
  .dialog-search-product {
    grid-template-columns: 52px minmax(0, 1fr) auto;
    gap: 12px;
  }

  .dialog-search-product-thumb {
    width: 52px;
    height: 52px;
  }

  .dialog-search-product-price {
    font-size: 14px;
  }
}
</style>
