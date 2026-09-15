<template>
  <span v-if="parts.before !== ''" class="dialog-search-muted">{{
    parts.before
  }}</span>
  <span class="dialog-search-match">{{ parts.match }}</span>
  <span v-if="parts.after !== ''" class="dialog-search-muted">{{
    parts.after
  }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { splitTitleMatch } from "./titleHighlight";

const props = defineProps<{
  title: string;
  query: string;
}>();

const parts = computed(() => splitTitleMatch(props.title, props.query));
</script>

<style>
.dialog-search-match {
  font-weight: 600;
}

.dialog-search-muted {
  opacity: 0.55;
}
</style>
