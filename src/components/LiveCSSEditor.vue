<template>
  <div class="p-6 border transition-colors" 
       :class="isDark ? 'bg-primary-900 border-primary-700' : 'bg-white border-primary-200'">
    <h4 class="text-lg font-semibold mb-4 transition-colors" 
        :class="isDark ? 'text-primary-100' : 'text-primary-900'">
      Live CSS Editor
    </h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-2 transition-colors" 
               :class="isDark ? 'text-primary-300' : 'text-primary-700'">
          CSS Code:
        </label>
        <textarea 
          v-model="cssCode"
          class="w-full h-32 p-3 border font-mono text-sm transition-colors" 
          :class="isDark ? 'bg-primary-800 border-primary-600 text-primary-100' : 'bg-primary-50 border-primary-300 text-primary-900'"
          placeholder="Enter CSS here..."
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2 transition-colors" 
               :class="isDark ? 'text-primary-300' : 'text-primary-700'">
          Live Preview:
        </label>
        <div 
          ref="previewContainer"
          class="border p-4 h-32 transition-colors" 
          :class="isDark ? 'bg-primary-950 border-primary-600' : 'bg-white border-primary-300'"
        >
          <div class="demo-element">Hello World!</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject, onMounted, onUnmounted } from 'vue'

// Get theme state from parent
const isDark = inject('isDark', ref(true))

const cssCode = ref(`.demo-element {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  padding: 20px;
  color: white;
  text-align: center;
  font-weight: bold;
}`)

const previewContainer = ref<HTMLElement>()
let styleElement: HTMLStyleElement | null = null

const updatePreview = () => {
  // Remove existing style
  if (styleElement) {
    document.head.removeChild(styleElement)
  }
  
  // Add new style
  styleElement = document.createElement('style')
  styleElement.id = 'live-css-preview'
  styleElement.textContent = cssCode.value
  document.head.appendChild(styleElement)
}

// Watch for changes in CSS code
watch(cssCode, updatePreview, { immediate: true })

onMounted(() => {
  updatePreview()
})

onUnmounted(() => {
  if (styleElement) {
    document.head.removeChild(styleElement)
  }
})
</script>
