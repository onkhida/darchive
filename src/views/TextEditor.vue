<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme, initializeTheme } = useTheme()

// Text content and cursor position
const textContent = ref('')
const textArea = ref<HTMLTextAreaElement>()

// Real-time Lagos time
const currentTime = ref('')

// Copy success state
const copySuccess = ref(false)

// Selected text tracking
const selectedText = ref('')
const selectionStart = ref(0)
const selectionEnd = ref(0)

// Computed word count and character count
const wordCount = computed(() => {
  if (!textContent.value.trim()) return 0
  return textContent.value.trim().split(/\s+/).length
})

const charCount = computed(() => {
  return textContent.value.length
})

const charCountWithoutSpaces = computed(() => {
  return textContent.value.replace(/\s/g, '').length
})

// Selected word count
const selectedWordCount = computed(() => {
  if (!selectedText.value.trim()) return 0
  return selectedText.value.trim().split(/\s+/).length
})

// Display format for selection count
const selectionDisplay = computed(() => {
  if (selectedWordCount.value === 0) return ''
  if (selectedWordCount.value === 1) {
    return `${selectedWordCount.value} word of ${wordCount.value}`
  }
  return `${selectedWordCount.value} words of ${wordCount.value}`
})

// Auto-save to localStorage
const saveToStorage = () => {
  localStorage.setItem('darchive-txt-content', textContent.value)
}

// Load from localStorage
const loadFromStorage = () => {
  const saved = localStorage.getItem('darchive-txt-content')
  if (saved) {
    textContent.value = saved
  }
}

// Copy to clipboard
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(textContent.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

// Clear all text
const clearText = () => {
  if (confirm('Are you sure you want to clear all text?')) {
    textContent.value = ''
    saveToStorage()
    textArea.value?.focus()
  }
}

// Auto-focus textarea
const focusTextArea = () => {
  textArea.value?.focus()
}

// Handle text selection
const handleSelection = () => {
  if (!textArea.value) return
  
  const start = textArea.value.selectionStart
  const end = textArea.value.selectionEnd
  
  selectionStart.value = start
  selectionEnd.value = end
  selectedText.value = textContent.value.substring(start, end)
}

const updateTime = () => {
  const now = new Date()
  const lagosTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now)
  
  currentTime.value = lagosTime
}

let timeInterval: number

onMounted(() => {
  // Initialize theme from localStorage
  initializeTheme()
  
  // Set page title
  document.title = 'Text Editor - onkhida'
  
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  loadFromStorage()
  
  // Auto-focus after a short delay
  setTimeout(focusTextArea, 100)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Auto-save on text change
const handleTextChange = () => {
  saveToStorage()
}
</script>

<template>
  <div :class="isDark ? 'dark' : ''" class="min-h-screen transition-colors duration-300">
    <div :class="isDark ? 'bg-primary-950 text-primary-100' : 'bg-primary-50 text-primary-900'" class="min-h-screen font-sans">
      
      <!-- Minimal header -->
      <header class="border-b transition-colors" :class="isDark ? 'border-primary-800' : 'border-primary-200'">
        <div class="container mx-auto max-w-4xl px-4 md:px-8 py-4">
          <div class="flex justify-between items-center">
            <!-- Back to site -->
            <router-link 
              to="/" 
              class="text-sm transition-colors hover:underline" 
              :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'"
            >
              ← main site
            </router-link>
            
            <!-- Theme toggle -->
            <button @click="toggleTheme" class="w-4 h-4 transition-colors duration-200" :class="isDark ? 'text-primary-100 hover:text-primary-50' : 'text-primary-900 hover:text-primary-700'">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M8.5 0C8.81296 0 9.06667 0.253706 9.06667 0.566667V2.83333C9.06667 3.14629 8.81296 3.4 8.5 3.4C8.18704 3.4 7.93333 3.14629 7.93333 2.83333V0.566667C7.93333 0.253706 8.18704 0 8.5 0ZM2.48959 2.48959C2.71089 2.2683 3.06968 2.2683 3.29098 2.48959L4.89376 4.09236C5.11505 4.31366 5.11505 4.67246 4.89376 4.89376C4.67246 5.11505 4.31366 5.11505 4.09236 4.89376L2.48959 3.29098C2.2683 3.06968 2.2683 2.71089 2.48959 2.48959ZM0.566667 7.93333C0.253706 7.93333 0 8.18704 0 8.5C0 8.81296 0.253706 9.06667 0.566667 9.06667H2.83333C3.14629 9.06667 3.4 8.81296 3.4 8.5C3.4 8.18704 3.14629 7.93333 2.83333 7.93333H0.566667ZM2.48959 14.5104C2.2683 14.2891 2.2683 13.9304 2.48959 13.709L4.09236 12.1063C4.31366 11.8849 4.67246 11.8849 4.89376 12.1063C5.11505 12.3275 5.11505 12.6863 4.89376 12.9076L3.29098 14.5104C3.06968 14.7317 2.71089 14.7317 2.48959 14.5104ZM14.1667 7.93333C13.8538 7.93333 13.6 8.18704 13.6 8.5C13.6 8.81296 13.8538 9.06667 14.1667 9.06667H16.4333C16.7462 9.06667 17 8.81296 17 8.5C17 8.18704 16.7462 7.93333 16.4333 7.93333H14.1667ZM12.1063 4.89376C11.8849 4.67246 11.8849 4.31366 12.1063 4.09236L13.709 2.48959C13.9304 2.2683 14.2891 2.2683 14.5104 2.48959C14.7317 2.71089 14.7317 3.06968 14.5104 3.29098L12.9076 4.89376C12.6863 5.11505 12.3275 5.11505 12.1063 4.89376ZM9.06667 14.1667C9.06667 13.8538 8.81296 13.6 8.5 13.6C8.18704 13.6 7.93333 13.8538 7.93333 14.1667V16.4333C7.93333 16.7462 8.18704 17 8.5 17C8.81296 17 9.06667 16.7462 9.06667 16.4333V14.1667ZM12.1063 12.1063C12.3275 11.8849 12.6863 11.8849 12.9076 12.1063L14.5104 13.709C14.7317 13.9304 14.7317 14.2891 14.5104 14.5104C14.2891 14.7317 13.9304 14.7317 13.709 14.5104L12.1063 12.9076C11.8849 12.6863 11.8849 12.3275 12.1063 12.1063ZM6.23333 8.5C6.23333 7.24815 7.24815 6.23333 8.5 6.23333C9.75185 6.23333 10.7667 7.24815 10.7667 8.5C10.7667 9.75185 9.75185 10.7667 8.5 10.7667C7.24815 10.7667 6.23333 9.75185 6.23333 8.5ZM8.5 5.1C6.62224 5.1 5.1 6.62224 5.1 8.5C5.1 10.3778 6.62224 11.9 8.5 11.9C10.3778 11.9 11.9 10.3778 11.9 8.5C11.9 6.62224 10.3778 5.1 8.5 5.1Z"
                  fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main editor area -->
      <main class="container mx-auto max-w-4xl px-4 md:px-8 py-8 min-h-[calc(100vh-140px)]">
        <div class="flex flex-col h-full">
          <!-- Toolbar -->
          <div class="flex justify-between items-center mb-4 text-sm">
            <div class="flex space-x-4 items-center">
              <span :class="isDark ? 'text-primary-400' : 'text-primary-600'">
                Textbox
              </span>
            </div>
            
            <div class="flex space-x-3">
              <button 
                @click="copyToClipboard"
                class="px-3 py-1 rounded text-xs font-medium transition-all duration-200"
                :class="copySuccess 
                  ? (isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800')
                  : (isDark ? 'bg-primary-800 text-primary-300 hover:bg-primary-700' : 'bg-primary-200 text-primary-700 hover:bg-primary-300')
                "
              >
                {{ copySuccess ? 'Copied!' : 'Copy' }}
              </button>
              
              <button 
                @click="clearText"
                class="px-3 py-1 rounded text-xs font-medium transition-colors"
                :class="isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'"
              >
                Clear
              </button>
            </div>
          </div>

          <!-- Text area -->
          <div class="flex-1 relative">
            <textarea
              ref="textArea"
              v-model="textContent"
              @input="handleTextChange"
              @keyup="handleTextChange"
              @paste="handleTextChange"
              @select="handleSelection"
              @mouseup="handleSelection"
              @keyup.arrow="handleSelection"
              placeholder="Type something."
              class="w-full h-full min-h-[60vh] p-6 border resize-none focus:outline-none focus:ring-2 transition-all duration-200 font-mono leading-relaxed"
              style="font-size: 15px;"
              :class="isDark 
                ? 'bg-primary-900 border-primary-700 text-primary-100 placeholder-primary-500 focus:ring-primary-600' 
                : 'bg-white border-primary-200 text-primary-900 placeholder-primary-400 focus:ring-primary-500'"
            />
          </div>
        </div>
      </main>

      <!-- Footer with stats -->
      <footer class="border-t transition-colors" :class="isDark ? 'border-primary-800' : 'border-primary-200'">
        <div class="container mx-auto max-w-4xl px-4 md:px-8 py-4">
          <div class="flex justify-between items-center text-sm">
            <div class="flex space-x-6" :class="isDark ? 'text-primary-400' : 'text-primary-600'">
              <span v-if="selectionDisplay">{{ selectionDisplay }}</span>
              <span v-else>{{ wordCount }} words</span>
              <span>{{ charCount }} characters</span>
              <span class="hidden sm:inline">{{ charCountWithoutSpaces }} without spaces</span>
            </div>
            
            <div :class="isDark ? 'text-primary-500' : 'text-primary-500'">
              LAGOS, NG — {{ currentTime }}
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Custom range slider styling */
input[type="range"] {
  background: transparent;
}

input[type="range"]::-webkit-slider-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: currentColor;
  border-radius: 2px;
  opacity: 0.3;
}

input[type="range"]::-webkit-slider-thumb {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: currentColor;
  cursor: pointer;
  -webkit-appearance: none;
  border: none;
}

input[type="range"]::-moz-range-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: currentColor;
  border-radius: 2px;
  opacity: 0.3;
  border: none;
}

input[type="range"]::-moz-range-thumb {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: currentColor;
  cursor: pointer;
  border: none;
}

input[type="range"]:focus {
  outline: none;
}

input[type="range"]:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

input[type="range"]:focus::-moz-range-thumb {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
</style>
