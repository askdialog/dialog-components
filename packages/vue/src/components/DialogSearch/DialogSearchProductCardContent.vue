<template>
  <div class="dialog-search-card-image">
    <img
      v-if="props.hit.product.imageUrl !== undefined"
      :src="props.hit.product.imageUrl"
      :alt="title"
      loading="lazy"
    />
  </div>
  <div class="dialog-search-card-info">
    <p class="dialog-search-card-title">{{ title }}</p>
    <p v-if="price !== ''" class="dialog-search-card-price">
      {{ price
      }}<s v-if="compareAtPrice !== ''" class="dialog-search-card-compare-at">{{
        " " + compareAtPrice
      }}</s>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { SearchHit } from "@askdialog/dialog-sdk";
import { computed } from "vue";
import { formatSearchCompareAtPrice, formatSearchPrice } from "./searchDisplay";

const props = defineProps<{
  hit: SearchHit;
  locale?: string;
}>();

const title = computed(() => props.hit.product.title ?? props.hit.product.id);
const price = computed(() =>
  formatSearchPrice(props.hit.product.priceRange, props.locale),
);
const compareAtPrice = computed(() =>
  formatSearchCompareAtPrice(props.hit.product, props.locale),
);
</script>
