<script setup lang="ts">
import {
  formatSearchPrice,
  resolveSearchPanelVariables,
  safeHref,
  type SearchController,
  type Theme,
} from "@askdialog/dialog-sdk";
import { useInfiniteHits, useSearchBox } from "./searchHooks";
import "./DialogSearchControls.css";
const props = defineProps<{
  controller: SearchController;
  theme?: Theme;
  errorLabel?: string;
}>();
const [state, connector] = useInfiniteHits(props.controller);
const [box] = useSearchBox(props.controller);
const { texts, language } = props.controller.getSnapshot().context;
</script>
<template>
  <section
    class="dialog-search-controls"
    :style="resolveSearchPanelVariables(theme)"
    :aria-label="texts.productsLabel"
    :aria-busy="box.status === 'loading'"
  >
    <ul class="dialog-search-infinite-list">
      <li
        v-for="(entry, index) in state.hits"
        :key="`${entry.hit.objectID}-${index}`"
      >
        <slot name="hit" :entry="entry" :index="index">
          <component
            :is="
              (
                entry.display === undefined
                  ? safeHref(entry.hit.url)
                  : entry.display.href
              )
                ? 'a'
                : 'span'
            "
            :href="
              entry.display === undefined
                ? safeHref(entry.hit.url)
                : entry.display.href
            "
          >
            <img
              v-if="
                entry.display?.image?.url ??
                (entry.display === undefined
                  ? safeHref(entry.hit.product_image ?? entry.hit.image)
                  : undefined)
              "
              :src="
                entry.display?.image?.url ??
                safeHref(entry.hit.product_image ?? entry.hit.image)
              "
              alt=""
              loading="lazy"
            />
            <span>{{ entry.display?.title ?? entry.hit.title }}</span
            ><span>{{
              entry.display?.price ?? formatSearchPrice(entry.hit, language)
            }}</span>
          </component></slot
        >
      </li>
    </ul>
    <p v-if="box.status === 'loading'" role="status">
      {{ texts.searching(box.query) }}
    </p>
    <p v-if="box.status === 'empty'" role="status">{{ texts.noResults }}</p>
    <div v-if="box.status === 'error'">
      <p role="alert">{{ errorLabel ?? "Search could not be loaded." }}</p>
      <button
        type="button"
        @click="state.failedMore ? connector.retryMore() : controller.retry()"
      >
        {{ texts.retry }}
      </button>
    </div>
    <button
      v-else-if="!state.isLastPage"
      type="button"
      :disabled="state.loadingMore"
      @click="connector.showMore()"
    >
      {{ texts.seeMore(Math.max(0, (state.nbHits ?? 0) - state.hits.length)) }}
    </button>
  </section>
</template>
