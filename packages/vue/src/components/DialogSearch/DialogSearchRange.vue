<script setup lang="ts">
import { ref, watch } from "vue";
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
const fields = ref({ min: state.value.min, max: state.value.max });
watch([() => state.value.min, () => state.value.max], () => {
  fields.value = { min: state.value.min, max: state.value.max };
});
const refine = (min: string, max: string) => {
  fields.value = { min, max };
  if (!isInvalidNumber(min) && !isInvalidNumber(max))
    connector.refine(min, max);
};
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
          :value="fields.min"
          :placeholder="state.bounds?.min.toString()"
          :aria-invalid="state.minAboveMax || isInvalidNumber(fields.min)"
          @input="
            refine(($event.target as HTMLInputElement).value, fields.max)
          "
      /></label>
      <label
        >{{ texts.priceMax
        }}<input
          inputmode="decimal"
          :value="fields.max"
          :placeholder="state.bounds?.max.toString()"
          :aria-invalid="state.minAboveMax || isInvalidNumber(fields.max)"
          @input="
            refine(fields.min, ($event.target as HTMLInputElement).value)
          "
      /></label>
    </div>
    <p
      v-if="
        isInvalidNumber(fields.min) ||
        isInvalidNumber(fields.max) ||
        state.minAboveMax
      "
      role="alert"
    >
      {{
        isInvalidNumber(fields.min) || isInvalidNumber(fields.max)
          ? (invalidLabel ?? "Enter a valid number.")
          : texts.priceMinAboveMax
      }}
    </p>
  </fieldset>
</template>
