<script setup lang="ts">
import {
  resolveSearchPanelVariables,
  searchIndexName,
  type SearchController,
  type Theme,
} from "@askdialog/dialog-sdk";
import "../../../../search-controls.css";
import { useAiOverview, useSearchBox } from "./searchHooks";
import type { AiOverviewParams } from "@askdialog/dialog-sdk";
const props = defineProps<
  AiOverviewParams & {
    controller: SearchController;
    label?: string;
    errorLabel?: string;
    theme?: Theme;
  }
>();
const [state, connector] = useAiOverview(props.controller, {
  apiKey: props.apiKey,
  transport: props.transport,
});
const [box] = useSearchBox(props.controller);
const texts = props.controller.getSnapshot().context.texts;
const retry = () => {
  const { searchState, context } = props.controller.getSnapshot();
  const index = searchIndexName("products", context.language, context.country);
  if ((searchState[index].page ?? 0) === 0) props.controller.search();
  else
    props.controller.setSearchState({
      ...searchState,
      [index]: { ...searchState[index], page: 0 },
    });
};
</script>
<template>
  <section
    v-if="state.status !== 'idle'"
    class="dialog-search-controls"
    :style="resolveSearchPanelVariables(theme)"
    :aria-label="label ?? 'AI overview'"
    :aria-busy="state.status === 'loading'"
  >
    <p v-if="state.status === 'loading'" role="status">
      {{ texts.searching(box.query) }}
    </p>
    <div v-else-if="state.status === 'error'">
      <p role="alert">{{ errorLabel ?? "AI overview could not be loaded." }}</p>
      <button type="button" @click="retry()">
        {{ texts.retry }}
      </button>
    </div>
    <template v-else
      ><p v-if="box.status === 'empty'" role="status">{{ texts.noResults }}</p>
      <p>{{ state.text }}</p>
      <ul>
        <li v-for="(item, index) in state.suggestions" :key="index">
          <button type="button" @click="connector.applySuggestion(item)">
            {{ item.label }}
          </button>
        </li>
      </ul></template
    >
  </section>
</template>
