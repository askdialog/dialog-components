<template>
  <div ref="anchorRef" />
  <Teleport v-if="showPanel" to="body">
    <div
      ref="panelRef"
      :class="['dialog-search-panel', `dialog-search-panel--${props.layout}`]"
      :style="style"
    >
      <div
        v-if="props.state.status === SearchStatus.ERROR"
        class="dialog-search-error"
      >
        <p role="alert" class="dialog-search-status dialog-search-status-error">
          {{ describeError(props.state.error) }}
        </p>
        <button
          type="button"
          class="dialog-search-retry"
          @click="props.controller.retry()"
        >
          {{ messages.retry }}
        </button>
      </div>
      <!-- Non-blocking: the previous results stay while the next query is loading,
           so everything below reads the response's own query, not the pending one. -->
      <p
        v-else-if="response === undefined"
        role="status"
        class="dialog-search-status"
      >
        {{ messages.searching(props.state.query) }}
      </p>
      <template v-else>
        <div
          :class="[
            'dialog-search-body',
            { 'dialog-search-body--no-collections': !hasCollections },
          ]"
        >
          <DialogSearchCollections
            :collections="collections"
            :query="response.query"
            :messages="messages"
          />
          <DialogSearchProducts
            :controller="props.controller"
            :response="response"
            :locale="props.locale"
            :messages="messages"
          />
        </div>
        <div v-if="hasSeeAll || hasPages" class="dialog-search-footer">
          <a v-if="hasSeeAll" class="dialog-search-cta" :href="seeAllHref">
            {{ messages.seeAllLabel(response.nbHits) }}
            <ArrowRightIcon />
          </a>
          <DialogSearchPagination
            v-else
            :controller="props.controller"
            :state="props.state"
            :locale="props.locale"
          />
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  DialogSearchError,
  SearchStatus,
  type SearchController,
  type SearchControllerState,
  type Theme,
} from "@askdialog/dialog-sdk";
import { computed } from "vue";
import ArrowRightIcon from "../../icons/ArrowRightIcon.vue";
import DialogSearchCollections from "./DialogSearchCollections.vue";
import DialogSearchPagination from "./DialogSearchPagination.vue";
import DialogSearchProducts from "./DialogSearchProducts.vue";
import { isAnchorOnScreen, panelStyle } from "./panelPlacement";
import { navigableCollections } from "./searchCollections";
import type { SearchProductsLayout } from "./searchLayout";
import { getSearchMessages } from "./searchMessages";
import { resolveSearchPanelVariables } from "./searchTheme";
import { useAnchorRect } from "./useAnchorRect";
import { useOutsideDismiss } from "./useOutsideDismiss";

interface Props {
  controller: SearchController;
  state: SearchControllerState;
  /** BCP 47 locale for prices, counts and labels. */
  locale?: string;
  /** Usually `client.theme`, as returned by `useDialogSearch`. */
  theme?: Theme;
  layout?: SearchProductsLayout;
  /** Link of the "See all results" footer; omitted, the panel paginates instead. */
  seeAllHref?: (query: string) => string;
}

const props = withDefaults(defineProps<Props>(), {
  locale: undefined,
  theme: undefined,
  layout: "list",
  seeAllHref: undefined,
});

const describeError = (error: unknown): string => {
  if (error instanceof DialogSearchError) {
    return `Search failed (${error.status}${error.code ? ` ${error.code}` : ""}): ${error.message}`;
  }

  return "Search failed: network error. Check your connection and try again.";
};

const stateRef = computed(() => props.state);
const hasResults = computed(() => props.state.status !== SearchStatus.IDLE);

// Render fixed under document.body to avoid ancestor clipping and stacking contexts.
const { anchorRef, rect, viewport } = useAnchorRect(hasResults);
const { isOpen, panelRef } = useOutsideDismiss(stateRef, anchorRef);

const showPanel = computed(
  () =>
    isOpen.value &&
    rect.value !== undefined &&
    isAnchorOnScreen(rect.value, viewport.value.height),
);
const style = computed(() => ({
  ...(rect.value === undefined
    ? {}
    : panelStyle(rect.value, viewport.value.width, viewport.value.height)),
  ...resolveSearchPanelVariables(props.theme),
}));

const messages = computed(() => getSearchMessages(props.locale));
const response = computed(() => props.state.response);
const collections = computed(
  () => props.state.sections?.collections?.hits ?? [],
);
const hasCollections = computed(
  () => navigableCollections(collections.value).length > 0,
);
const hasSeeAll = computed(
  () =>
    props.seeAllHref !== undefined &&
    response.value !== undefined &&
    response.value.nbHits > 0,
);
const hasPages = computed(
  () =>
    !hasSeeAll.value &&
    response.value !== undefined &&
    response.value.nbPages > 1,
);
const seeAllHref = computed(() =>
  response.value === undefined
    ? undefined
    : props.seeAllHref?.(response.value.query),
);
</script>

<style>
/* Teleported to document.body; top/left/width/max-height are set inline from the anchor.
   Palette and radii come from the --dso-* custom properties resolved from the
   SDK theme (searchTheme.ts); only the font is inherited from the page. */
.dialog-search-panel {
  position: fixed;
  z-index: 9999;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  background: var(--dso-panel);
  border-radius: var(--dso-r-panel);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
  overflow: hidden;
  font-family: var(--dso-font, inherit);
  font-size: 14px;
  line-height: 1.35;
  color: var(--dso-text);
  -webkit-font-smoothing: antialiased;
}

.dialog-search-panel *,
.dialog-search-panel *::before,
.dialog-search-panel *::after {
  box-sizing: border-box;
}

.dialog-search-status {
  margin: 0;
  padding: 16px 24px;
  color: var(--dso-text-sec);
}

.dialog-search-status-error {
  color: #b3261e;
}

.dialog-search-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 16px;
}

.dialog-search-retry {
  margin: 0 24px;
  padding: 6px 14px;
  border: 1px solid var(--dso-border);
  border-radius: var(--dso-r-btn);
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--dso-text);
  cursor: pointer;
  transition: background-color 120ms ease;
}

.dialog-search-retry:hover {
  background-color: var(--dso-hover);
}

.dialog-search-body {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
}

.dialog-search-body--no-collections {
  grid-template-columns: minmax(0, 1fr);
}

.dialog-search-section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 12px 8px;
}

.dialog-search-label {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dso-text-sec);
}

.dialog-search-label-count {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.dialog-search-count {
  font-size: 12px;
  color: var(--dso-text-sec);
}

.dialog-search-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex: none;
  padding: 14px 24px;
  border-top: 1px solid var(--dso-border);
}

.dialog-search-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  border: 1px solid var(--dso-primary);
  border-radius: var(--dso-r-btn);
  background: var(--dso-primary);
  color: var(--dso-cta-text);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.dialog-search-cta:hover {
  filter: brightness(0.95);
}

.dialog-search-footer .dialog-search-pagination {
  flex: 1;
}

@media (max-width: 767px) {
  .dialog-search-body {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-top: 16px;
    overflow-y: auto;
  }

  .dialog-search-footer {
    padding: 12px 16px;
  }

  .dialog-search-cta {
    width: 100%;
    height: 44px;
  }

  .dialog-search-cta svg {
    display: none;
  }
}
</style>
