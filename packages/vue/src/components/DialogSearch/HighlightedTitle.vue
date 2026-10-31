<template>
  <template v-for="({ text, highlighted }, index) in props.parts" :key="index">
    <span v-if="highlighted" class="dialog-search-match">{{ text }}</span>
    <template v-else>{{ text }}</template>
  </template>
</template>

<script setup lang="ts">
import type { TitlePart } from "@askdialog/dialog-sdk";

/** The title as text, the parts the engine matched in bold. */
const props = defineProps<{
  parts: readonly TitlePart[];
}>();
</script>

<style>
.dialog-search-match {
  font-weight: 600;
}
</style>
