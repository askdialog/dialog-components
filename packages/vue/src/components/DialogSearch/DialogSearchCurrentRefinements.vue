<script setup lang="ts">
import {
  resolveSearchPanelVariables,
  type SearchController,
  type Theme,
} from "@askdialog/dialog-sdk";
import "./DialogSearchControls.css";
import { useCurrentRefinements, useClearRefinements } from "./searchHooks";
const props = defineProps<{ controller: SearchController; theme?: Theme }>();
const [state, connector] = useCurrentRefinements(props.controller);
const [clear, clearConnector] = useClearRefinements(props.controller);
const texts = props.controller.getSnapshot().context.texts;
</script>
<template>
  <section
    class="dialog-search-controls"
    :style="resolveSearchPanelVariables(theme)"
    :aria-label="texts.appliedFiltersLabel"
  >
    <ul>
      <li v-for="(item, index) in state.items" :key="index">
        <button
          v-if="item.removable"
          type="button"
          :aria-label="texts.removeFilter(item.text)"
          @click="connector.remove(item)"
        >
          {{ item.text }} ×</button
        ><span v-else>{{ item.text }}</span>
      </li>
    </ul>
    <button
      v-if="clear.canRefine"
      type="button"
      @click="clearConnector.refine()"
    >
      {{ texts.clearAll }}
    </button>
  </section>
</template>
