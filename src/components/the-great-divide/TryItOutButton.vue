<template>
  <a href="/demo" class="inline-flex items-center gap-2 px-6 py-3 bg-[#004B49] text-white font-medium rounded-md hover:bg-teal-800 transition-colors duration-200">
    <span class="text-white">Try It Out</span>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 17L17 7"/>
      <path d="M7 7h10v10"/>
    </svg>
  </a>
</template>

<script setup lang="ts">
// Simple button component, no props needed
</script>

<style scoped>
a {
  display: inline-flex;
  text-decoration: none;
}
</style>
