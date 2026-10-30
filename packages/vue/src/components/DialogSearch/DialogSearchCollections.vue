<template>
  <aside v-if="props.collections.length > 0" class="dialog-search-collections">
    <div class="dialog-search-section-head">
      <p class="dialog-search-label">{{ props.texts.collectionsLabel }}</p>
      <span class="dialog-search-count">
        {{ props.texts.collectionsCount(props.collections.length) }}
      </span>
    </div>
    <ul class="dialog-search-collection-list">
      <li v-for="{ hit, display } in props.collections" :key="hit.objectID">
        <a class="dialog-search-collection" :href="display.href">
          <span
            v-if="display.image !== undefined"
            :class="[
              'dialog-search-collection-thumb',
              `dialog-search-thumb--${display.image.shape}`,
            ]"
            aria-hidden="true"
          >
            <img :src="display.image.url" alt="" loading="lazy" />
          </span>
          <span class="dialog-search-collection-title">
            <HighlightedTitle :parts="display.titleParts" />
          </span>
          <span class="dialog-search-caret">
            <CaretRightIcon />
          </span>
        </a>
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import type {
  SearchCollectionHit,
  SearchTexts,
  SectionHit,
} from "@askdialog/dialog-sdk";
import CaretRightIcon from "../../icons/CaretRightIcon.vue";
import HighlightedTitle from "./HighlightedTitle.vue";

const props = defineProps<{
  /** Only collections with a link, from `connectSections`. */
  collections: readonly SectionHit<SearchCollectionHit>[];
  texts: SearchTexts;
}>();
</script>

<style>
.dialog-search-collections {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  padding: 20px 12px 20px 24px;
  border-right: 1px solid var(--dso-border);
  background: var(--dso-side);
  overflow-y: auto;
}

.dialog-search-collection-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dialog-search-collection {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--dso-r-item);
  color: inherit;
  text-decoration: none;
}

.dialog-search-collection:hover {
  background: var(--dso-hover);
}

.dialog-search-collection-thumb {
  flex: none;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: var(--dso-r-thumb);
  background: var(--dso-thumb);
}

.dialog-search-collection-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialog-search-collection-title {
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

.dialog-search-caret {
  display: inline-flex;
  flex: none;
  color: var(--dso-text-sec);
}

@media (max-width: 767px) {
  .dialog-search-collections {
    flex: none;
    gap: 10px;
    padding: 0;
    border-right: 0;
    background: transparent;
    overflow: visible;
  }

  .dialog-search-collections .dialog-search-section-head {
    padding: 0 16px;
  }

  .dialog-search-collection-list {
    flex-direction: row;
    gap: 10px;
    padding: 0 16px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .dialog-search-collection-list::-webkit-scrollbar {
    display: none;
  }

  .dialog-search-collection {
    flex: none;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 80px;
    padding: 0;
  }

  .dialog-search-collection-thumb {
    width: 80px;
    height: 50px;
    border-radius: var(--dso-r-item);
  }

  .dialog-search-collection-title {
    font-size: 13px;
  }

  .dialog-search-caret {
    display: none;
  }
}
</style>
