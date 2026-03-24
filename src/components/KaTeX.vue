<template>
  <span v-if="displayMode" class="block my-4">
    <span v-html="rendered"></span>
  </span>
  <span v-else v-html="rendered"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKaTeX } from '../composables/useKaTeX'

interface Props {
  expression: string
  displayMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: false,
})

const { renderInline, renderDisplay } = useKaTeX()

const rendered = computed(() => {
  return props.displayMode ? renderDisplay(props.expression) : renderInline(props.expression)
})
</script>
