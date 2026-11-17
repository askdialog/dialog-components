<script setup lang="ts">
import {
  resolveSearchPanelVariables,
  type SearchController,
  type Theme,
} from "@askdialog/dialog-sdk";
import "./DialogSearchControls.css";
import { useAiOverview, useSearchBox } from "./searchHooks";
import type { AiOverviewParams } from "@askdialog/dialog-sdk";
const props = defineProps<
  AiOverviewParams & {
    controller: SearchController;
    label?: string;
    theme?: Theme;
  }
>();
const [state, connector] = useAiOverview(props.controller, {
  apiKey: props.apiKey,
  transport: props.transport,
});
const [box] = useSearchBox(props.controller);
const texts = props.controller.getSnapshot().context.texts;
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
    <button
      v-else-if="state.status === 'error'"
      type="button"
      @click="controller.search()"
    >
      {{ texts.retry }}</button
    ><template v-else
      ><p>{{ state.text }}</p>
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
