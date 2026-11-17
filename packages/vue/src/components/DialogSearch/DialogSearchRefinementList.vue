<script setup lang="ts">
import {
  resolveSearchPanelVariables,
  type SearchController,
  type Theme,
} from "@askdialog/dialog-sdk";
import "./DialogSearchControls.css";
import { useRefinementList } from "./searchHooks";
const props = defineProps<{
  controller: SearchController;
  attribute: string;
  limit?: number;
  theme?: Theme;
}>();
const [state, connector] = useRefinementList(props.controller, {
  attribute: props.attribute,
  limit: props.limit,
});
const texts = props.controller.getSnapshot().context.texts;
</script>
<template>
  <fieldset
    class="dialog-search-controls"
    :style="resolveSearchPanelVariables(theme)"
  >
    <legend>{{ state.label }}</legend>
    <ul>
      <li v-for="item in state.items" :key="item.value">
        <label
          ><input
            type="checkbox"
            :checked="item.isRefined"
            @change="connector.refine(item.value)"
          />{{ item.value
          }}{{ item.count === undefined ? "" : ` (${item.count})` }}</label
        >
      </li>
    </ul>
    <button
      v-if="state.canToggleShowMore"
      type="button"
      @click="connector.toggleShowMore()"
    >
      {{
        state.isShowingMore ? texts.seeLess : texts.seeMore(state.foldedCount)
      }}
    </button>
  </fieldset>
</template>
