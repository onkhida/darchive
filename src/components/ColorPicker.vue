<template>
  <div class="p-6 border transition-colors" 
       :class="isDark ? 'bg-primary-900 border-primary-700' : 'bg-white border-primary-200'">
    <h4 class="text-lg font-semibold mb-4 transition-colors" 
        :class="isDark ? 'text-primary-100' : 'text-primary-900'">
      Interactive Color Picker
    </h4>
    <div class="space-y-4">
      <input 
        v-model="selectedColor"
        type="color" 
        class="w-16 h-16 border-2 cursor-pointer transition-colors" 
        :class="isDark ? 'border-primary-600' : 'border-primary-300'"
      />
      <div 
        class="p-4 border text-center font-mono text-sm transition-colors"
        :class="isDark ? 'bg-primary-800' : 'bg-primary-50'"
        :style="{ backgroundColor: selectedColor, color: contrastColor }"
      >
        {{ selectedColor }}
      </div>
      <div class="text-sm transition-colors" 
           :class="isDark ? 'text-primary-300' : 'text-primary-700'">
        Pick a color to see its hex value and auto-contrast text
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'

// Get theme state from parent (we'll inject this)
const isDark = inject('isDark', ref(true))

const selectedColor = ref('#ff6b6b')

const contrastColor = computed(() => {
  const hex = selectedColor.value
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
})
</script>
