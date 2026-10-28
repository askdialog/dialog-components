<template>
  <li ref="cardRef" class="dialog-search-card">
    <component
      :is="display.href === undefined ? 'div' : 'a'"
      :class="[
        'dialog-search-product',
        { 'dialog-search-product--no-image': display.image === undefined },
      ]"
      :href="display.href"
      v-on="
        display.href === undefined
          ? {}
          : { click: handleClick, auxclick: handleAuxClick }
      "
    >
      <span
        v-if="display.image !== undefined"
        class="dialog-search-product-thumb"
        aria-hidden="true"
      >
        <img :src="display.image" alt="" loading="lazy" />
      </span>
      <span class="dialog-search-product-title">
        <HighlightedTitle :parts="display.titleParts" />
      </span>
      <span v-if="display.price !== ''" class="dialog-search-product-price"
        ><s
          v-if="display.compareAtPrice !== ''"
          class="dialog-search-product-compare-at"
          >{{ display.compareAtPrice }}</s
        >{{ display.price }}</span
      >
    </component>
  </li>
</template>

<script setup lang="ts">
import {
  formatSearchCompareAtPrice,
  formatSearchPrice,
  productHitDisplay,
  type ProductHitDisplay,
  type SearchController,
  type SearchProductHit,
} from "@askdialog/dialog-sdk";
import { computed, ref, watch } from "vue";
import HighlightedTitle from "./HighlightedTitle.vue";

interface Props {
  controller: SearchController;
  hit: SearchProductHit;
  index: number;
  /** BCP 47 locale of the price; omitted, the shopper's market. */
  locale?: string;
  /** Committed query, emphasized inside the title. */
  query?: string;
  /** The hit's display from `connectHits`; built from the hit when omitted. */
  display?: ProductHitDisplay;
}

const props = withDefaults(defineProps<Props>(), {
  locale: undefined,
  query: "",
  display: undefined,
});

const cardRef = ref<HTMLLIElement>();

// Reobserve each response even when the framework reuses the DOM node.
watch(
  () => props.hit,
  () => {
    if (cardRef.value !== undefined) {
      props.controller.observeHit(cardRef.value, props.index);
    }
  },
  { immediate: true, flush: "post" },
);

// A `locale` formats the prices in that locale instead of the shopper's market.
const display = computed((): ProductHitDisplay => {
  if (props.display === undefined) {
    return productHitDisplay(
      props.controller,
      props.hit,
      props.query,
      props.locale,
    );
  }

  return props.locale === undefined
    ? props.display
    : {
        ...props.display,
        price: formatSearchPrice(props.hit, props.locale),
        compareAtPrice: formatSearchCompareAtPrice(props.hit, props.locale),
      };
});

// Preserve native modified clicks. Prevent default navigation only when the
// adapter handles the click; record selection in both cases.
const handleClick = (event: MouseEvent): void => {
  const opensNatively =
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (props.controller.selectHit(props.index, { navigate: !opensNatively })) {
    event.preventDefault();
  }
};

// Track middle-clicks without the navigation adapter; ignore right-clicks.
const handleAuxClick = (event: MouseEvent): void => {
  if (event.button === 1) {
    props.controller.selectHit(props.index, { navigate: false });
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

.dialog-search-product.dialog-search-product--no-image {
  grid-template-columns: minmax(0, 1fr) auto;
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

.dialog-search-product-compare-at {
  margin-inline-end: 6px;
  font-weight: 400;
  opacity: 0.55;
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
