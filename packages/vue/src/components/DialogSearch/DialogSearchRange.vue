<script setup lang="ts">
import {
  resolveSearchPanelVariables,
  type SearchController,
  type Theme,
} from "@askdialog/dialog-sdk";
import "./DialogSearchControls.css";
import { useRange } from "./searchHooks";
const props = defineProps<{
  controller: SearchController;
  attribute?: string;
  label?: string;
  invalidLabel?: string;
  theme?: Theme;
}>();
const [state, connector] = useRange(props.controller, {
  attribute: props.attribute ?? "price",
});
const isInvalidNumber = (value: string) =>
  value.trim() !== "" &&
  !Number.isFinite(Number(value.trim().replace(",", ".")));
const texts = props.controller.getSnapshot().context.texts;
</script>
<template>
  <fieldset
    class="dialog-search-controls"
    :style="resolveSearchPanelVariables(theme)"
  >
    <legend>
      {{
        label ??
        (state.attribute === "price"
          ? texts.filterFields.price
          : state.attribute)
      }}
    </legend>
    <div class="dialog-search-range-fields">
      <label
        >{{ texts.priceMin
        }}<input
          inputmode="decimal"
          :value="state.min"
          :placeholder="state.bounds?.min.toString()"
          :aria-invalid="state.minAboveMax || isInvalidNumber(state.min)"
          @input="
            connector.refine(
              ($event.target as HTMLInputElement).value,
              state.max,
            )
          "
      /></label>
      <label
        >{{ texts.priceMax
        }}<input
          inputmode="decimal"
          :value="state.max"
          :placeholder="state.bounds?.max.toString()"
          :aria-invalid="state.minAboveMax || isInvalidNumber(state.max)"
          @input="
            connector.refine(
              state.min,
              ($event.target as HTMLInputElement).value,
            )
          "
      /></label>
    </div>
    <p
      v-if="
        isInvalidNumber(state.min) ||
        isInvalidNumber(state.max) ||
        state.minAboveMax
      "
      role="alert"
    >
      {{
        isInvalidNumber(state.min) || isInvalidNumber(state.max)
          ? (invalidLabel ?? "Enter a valid number.")
          : texts.priceMinAboveMax
      }}
    </p>
  </fieldset>
</template>
