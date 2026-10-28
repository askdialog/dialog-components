<template>
  <span v-if="props.parts.before !== ''" class="dialog-search-muted">{{
    props.parts.before
  }}</span>
  <span class="dialog-search-match">{{ props.parts.match }}</span>
  <span v-if="props.parts.after !== ''" class="dialog-search-muted">{{
    props.parts.after
  }}</span>
</template>

<script setup lang="ts">
import type { TitleParts } from "@askdialog/dialog-sdk/search";

const props = defineProps<{
  parts: TitleParts;
}>();
</script>

<style>
.dialog-search-match {
  font-weight: 600;
}

.dialog-search-muted {
  opacity: 0.55;
}
</style>
