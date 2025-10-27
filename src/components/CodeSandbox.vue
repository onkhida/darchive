<template>
  <div class="p-6 border transition-colors" 
       :class="isDark ? 'bg-primary-900 border-primary-700' : 'bg-white border-primary-200'">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-lg font-semibold transition-colors" 
          :class="isDark ? 'text-primary-100' : 'text-primary-900'">
        Code Sandbox ({{ language }})
      </h4>
      <button 
        @click="copyCode"
        class="px-3 py-1 text-sm transition-colors" 
        :class="isDark ? 'bg-primary-700 text-primary-100 hover:bg-primary-600' : 'bg-primary-600 text-white hover:bg-primary-700'"
      >
        {{ copied ? 'Copied!' : 'Copy Code' }}
      </button>
    </div>
    <pre class="overflow-x-auto transition-colors p-4" 
         :class="isDark ? 'bg-primary-950 text-primary-100' : 'bg-primary-100 text-primary-900'">
      <code><slot /></code>
    </pre>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'

interface Props {
  language?: string
}

withDefaults(defineProps<Props>(), {
  language: 'javascript'
})

// Get theme state from parent
const isDark = inject('isDark', ref(true))

const copied = ref(false)

const copyCode = async () => {
  const codeElement = document.querySelector('code')
  if (codeElement) {
    try {
      await navigator.clipboard.writeText(codeElement.textContent || '')
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }
}
</script>
