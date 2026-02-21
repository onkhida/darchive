<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReadings, type ReadingPost } from '../composables/useReadings'
import { useTheme } from '../composables/useTheme'

const route = useRoute()
const router = useRouter()
const { getPostBySlug, renderMarkdown } = useReadings()
const { isDark, toggleTheme, initializeTheme } = useTheme()

// Real-time Lagos time
const currentTime = ref('')

// Post data
const post = ref<ReadingPost | null>(null)
const isLoading = ref(true)

// Footnotes panel
const activeFootnote = ref<number | null>(null)
const expandedFootnote = ref<number | null>(null)

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

const goBack = () => {
  router.push('/readings')
}

const toggleFootnote = (footnoteId: number) => {
  if (expandedFootnote.value === footnoteId) {
    // Close if already open
    expandedFootnote.value = null
    activeFootnote.value = null
  } else {
    // Open this footnote and close others
    expandedFootnote.value = footnoteId
    activeFootnote.value = footnoteId
  }
}

const highlightFootnote = (footnoteId: number) => {
  // When clicked from content, expand the footnote
  toggleFootnote(footnoteId)
  
  // On mobile, scroll to footnotes section
  if (window.innerWidth < 1024) { // lg breakpoint
    setTimeout(() => {
      const footnotesSection = document.getElementById('mobile-footnotes')
      if (footnotesSection) {
        footnotesSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 100)
  }
  
  // Remove highlight after 3 seconds
  setTimeout(() => {
    activeFootnote.value = null
  }, 3000)
}

const handleFootnoteClick = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('footnote-ref')) {
    const footnoteId = parseInt(target.dataset.footnote || '0')
    if (footnoteId) {
      highlightFootnote(footnoteId)
    }
  }
}

const loadPost = async () => {
  const slug = route.params.slug as string
  const loadedPost = await getPostBySlug(slug)
  
  if (loadedPost) {
    post.value = loadedPost
    // Set page title based on reading title
    document.title = `${loadedPost.title} - onkhida`
  } else {
    document.title = 'Reading Not Found - onkhida'
  }
  
  isLoading.value = false
}

let timeInterval: number

onMounted(() => {
  // Initialize theme from localStorage
  initializeTheme()
  
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  loadPost()
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<template>
  <div :class="isDark ? 'dark' : ''" class="min-h-screen transition-colors duration-300">
    <div :class="isDark ? 'bg-primary-950 text-primary-100' : 'bg-primary-50 text-primary-900'" class="min-h-screen font-sans">
      
      <!-- Header -->
      <header class="container mx-auto max-w-3xl px-4 md:px-8 pt-16">
        <div class="flex justify-between items-center mb-10">
          <!-- Back Button -->
          <button @click="goBack" class="transition-colors duration-200" :class="isDark ? 'text-primary-100 hover:text-primary-50' : 'text-primary-900 hover:text-primary-700'">
            <svg
              width="15"
              height="10"
              viewBox="0 0 15 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.61848 0.162725C6.88476 0.37968 6.88476 0.731436 6.61848 0.948391L2.32788 4.44445H14.3182C14.6947 4.44445 15 4.69318 15 5C15 5.30682 14.6947 5.55556 14.3182 5.55556H2.32788L6.61848 9.05156C6.88476 9.26856 6.88476 9.62033 6.61848 9.83733C6.35222 10.0542 5.92052 10.0542 5.65425 9.83733L0.199708 5.39283C-0.0665693 5.17588 -0.0665693 4.82412 0.199708 4.60717L5.65425 0.162725C5.92052 -0.0542416 6.35222 -0.0542416 6.61848 0.162725Z"
                fill="currentColor"
              />
            </svg>
          </button>
          
          <!-- Theme Toggle -->
          <button @click="toggleTheme" class="w-4 h-4 transition-colors duration-200" :class="isDark ? 'text-primary-100 hover:text-primary-50' : 'text-primary-900 hover:text-primary-700'">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
              <path fill-rule="evenodd" clip-rule="evenodd"
                d="M8.5 0C8.81296 0 9.06667 0.253706 9.06667 0.566667V2.83333C9.06667 3.14629 8.81296 3.4 8.5 3.4C8.18704 3.4 7.93333 3.14629 7.93333 2.83333V0.566667C7.93333 0.253706 8.18704 0 8.5 0ZM2.48959 2.48959C2.71089 2.2683 3.06968 2.2683 3.29098 2.48959L4.89376 4.09236C5.11505 4.31366 5.11505 4.67246 4.89376 4.89376C4.67246 5.11505 4.31366 5.11505 4.09236 4.89376L2.48959 3.29098C2.2683 3.06968 2.2683 2.71089 2.48959 2.48959ZM0.566667 7.93333C0.253706 7.93333 0 8.18704 0 8.5C0 8.81296 0.253706 9.06667 0.566667 9.06667H2.83333C3.14629 9.06667 3.4 8.81296 3.4 8.5C3.4 8.18704 3.14629 7.93333 2.83333 7.93333H0.566667ZM2.48959 14.5104C2.2683 14.2891 2.2683 13.9304 2.48959 13.709L4.09236 12.1063C4.31366 11.8849 4.67246 11.8849 4.89376 12.1063C5.11505 12.3275 5.11505 12.6863 4.89376 12.9076L3.29098 14.5104C3.06968 14.7317 2.71089 14.7317 2.48959 14.5104ZM14.1667 7.93333C13.8538 7.93333 13.6 8.18704 13.6 8.5C13.6 8.81296 13.8538 9.06667 14.1667 9.06667H16.4333C16.7462 9.06667 17 8.81296 17 8.5C17 8.18704 16.7462 7.93333 16.4333 7.93333H14.1667ZM12.1063 4.89376C11.8849 4.67246 11.8849 4.31366 12.1063 4.09236L13.709 2.48959C13.9304 2.2683 14.2891 2.2683 14.5104 2.48959C14.7317 2.71089 14.7317 3.06968 14.5104 3.29098L12.9076 4.89376C12.6863 5.11505 12.3275 5.11505 12.1063 4.89376ZM9.06667 14.1667C9.06667 13.8538 8.81296 13.6 8.5 13.6C8.18704 13.6 7.93333 13.8538 7.93333 14.1667V16.4333C7.93333 16.7462 8.18704 17 8.5 17C8.81296 17 9.06667 16.7462 9.06667 16.4333V14.1667ZM12.1063 12.1063C12.3275 11.8849 12.6863 11.8849 12.9076 12.1063L14.5104 13.709C14.7317 13.9304 14.7317 14.2891 14.5104 14.5104C14.2891 14.7317 13.9304 14.7317 13.709 14.5104L12.1063 12.9076C11.8849 12.6863 11.8849 12.3275 12.1063 12.1063ZM6.23333 8.5C6.23333 7.24815 7.24815 6.23333 8.5 6.23333C9.75185 6.23333 10.7667 7.24815 10.7667 8.5C10.7667 9.75185 9.75185 10.7667 8.5 10.7667C7.24815 10.7667 6.23333 9.75185 6.23333 8.5ZM8.5 5.1C6.62224 5.1 5.1 6.62224 5.1 8.5C5.1 10.3778 6.62224 11.9 8.5 11.9C10.3778 11.9 11.9 10.3778 11.9 8.5C11.9 6.62224 10.3778 5.1 8.5 5.1Z"
                fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container mx-auto px-4 md:px-8 pb-12 max-w-3xl">
        <div v-if="isLoading" class="text-center py-12">
          <div :class="isDark ? 'text-primary-400' : 'text-primary-600'">Loading...</div>
        </div>
        
        <div v-else-if="!post" class="text-center py-12">
          <div :class="isDark ? 'text-primary-400' : 'text-primary-600'">Reading not found</div>
        </div>
        
        <article v-else>
          <!-- Reading Header -->
          <header class="mb-8">
            <h1 class="text-4xl sm:text-5xl md:text-6xl font-cormorant font-normal mb-4" 
                :class="isDark ? 'text-primary-50' : 'text-primary-900'">
              {{ post.title }}
            </h1>
            
            <div class="flex items-center gap-4 text-lg mb-6" :class="isDark ? 'text-primary-400' : 'text-primary-600'">
              <!-- Author Image -->
              <div class="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border-2 transition-colors" 
                   :class="isDark ? 'border-primary-600' : 'border-primary-400'">
                <img 
                  v-if="post.authorImage"
                  :src="post.authorImage" 
                  :alt="post.author"
                  class="w-full h-full object-cover"
                />
                <div 
                  v-else 
                  class="w-full h-full flex items-center justify-center text-xs font-medium transition-colors"
                  :class="isDark ? 'text-primary-400 bg-primary-800' : 'text-primary-500 bg-primary-200'"
                >
                  {{ post.author ? post.author.charAt(0).toUpperCase() : '?' }}
                </div>
              </div>
              
              <span class="font-medium">{{ post.author }}</span>
              <span v-if="post.year" class="opacity-70">{{ post.year }}</span>
            </div>
            
            <p v-if="post.desc" class="text-lg leading-relaxed mb-6" 
               :class="isDark ? 'text-primary-300' : 'text-primary-600'">
              {{ post.desc }}
            </p>
            
            <div class="text-sm opacity-70" :class="isDark ? 'text-primary-400' : 'text-primary-600'">
              {{ post.dateFormatted }}
            </div>
          </header>

          <!-- Divider -->
          <hr class="mb-8 border-t transition-colors" :class="isDark ? 'border-primary-800' : 'border-primary-200'">

          <!-- Reading Content -->
          <div class="prose prose-lg max-w-none leading-relaxed" :class="isDark ? 'prose-invert text-primary-300' : 'text-primary-700'">
            <div v-html="renderMarkdown(post.content)" @click="handleFootnoteClick"></div>
          </div>
        </article>
      </main>

      <!-- Footnotes sidebar positioned in right margin (desktop only) -->
      <aside v-if="post && post.footnotes && post.footnotes.length > 0" 
             class="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-64">
        <div class="max-h-[70vh] overflow-y-auto">
          <h3 class="text-sm font-medium mb-6 uppercase tracking-wide"
              :class="isDark ? 'text-primary-400' : 'text-primary-600'">
            Footnotes
          </h3>
          
          <div class="space-y-2">
            <div v-for="footnote in post.footnotes" :key="footnote.id" 
                 class="text-sm border-l-2 transition-all duration-200 cursor-pointer"
                 :class="expandedFootnote === footnote.id 
                   ? (isDark ? 'border-primary-400 bg-primary-900/30 -ml-1' : 'border-primary-500 bg-primary-50/50 -ml-1')
                   : (isDark ? 'border-primary-700 hover:border-primary-600' : 'border-primary-200 hover:border-primary-400')
                 "
                 @click="toggleFootnote(footnote.id)">
              
              <!-- Footnote ID (always visible) -->
              <div class="pl-4 py-2 font-medium transition-colors"
                   :class="expandedFootnote === footnote.id 
                     ? (isDark ? 'text-primary-200' : 'text-primary-700') 
                     : (isDark ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700')
                   ">
                {{ footnote.id }}
                <span class="ml-2 text-xs opacity-60">
                  {{ expandedFootnote === footnote.id ? '−' : '+' }}
                </span>
              </div>
              
              <!-- Footnote Content (expandable) -->
              <div v-if="expandedFootnote === footnote.id" 
                   class="pl-4 pb-3 pr-2 leading-relaxed text-xs animate-in slide-in-from-top-2 duration-200"
                   :class="isDark ? 'text-primary-400' : 'text-primary-700'">
                {{ footnote.content }}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile footnotes (appear as section after main content) -->
      <section v-if="post && post.footnotes && post.footnotes.length > 0" class="xl:hidden container mx-auto px-4 md:px-8 pb-12 max-w-3xl">
        <div id="mobile-footnotes" class="border-t pt-8" :class="isDark ? 'border-primary-800' : 'border-primary-200'">
          <h3 class="text-lg font-medium mb-6"
              :class="isDark ? 'text-primary-200' : 'text-primary-800'">
            Footnotes
          </h3>
          
          <div class="space-y-4">
            <p v-for="footnote in post.footnotes" :key="footnote.id" 
               class="text-sm leading-relaxed transition-colors duration-200"
               :class="isDark ? 'text-primary-300' : 'text-primary-700'">
              <span class="font-medium"
                    :class="isDark ? 'text-primary-200' : 'text-primary-600'">
                {{ footnote.id }}:
              </span>
              {{ footnote.content }}
            </p>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="container mx-auto max-w-3xl px-4 md:px-8 pb-12 pt-8 border-t transition-colors" :class="isDark ? 'border-primary-800' : 'border-primary-200'">
        <div class="flex justify-between items-center text-sm" :class="isDark ? 'text-primary-500' : 'text-primary-500'">
          <div>
            LAGOS, NG — {{ currentTime }}
          </div>
          <div>
            <a href="https://www.reddit.com/user/onkhida/" target="_blank" rel="noopener" class="transition-colors" :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'">u/onkhida</a>
          </div>
        </div>
      </footer>
      
    </div>
  </div>
</template>

<style scoped>
/* Footnote styling that inherits text color from theme */
:deep(.footnote-ref) {
  color: inherit;
}

/* Link styling that inherits text color instead of being greyed */
:deep(a) {
  color: inherit !important;
  text-decoration-line: underline;
  text-underline-offset: 2px;
  transition: all 0.2s ease;
}

:deep(a:hover) {
  text-decoration-line: none;
}

/* Dark theme footnotes - slightly lighter */
.dark :deep(.footnote-ref) {
  opacity: 0.9;
}

.dark :deep(.footnote-ref:hover) {
  opacity: 0.7;
}

/* Light theme footnotes - slightly darker */
:not(.dark) :deep(.footnote-ref) {
  opacity: 0.8;
}

:not(.dark) :deep(.footnote-ref:hover) {
  opacity: 0.6;
}
</style>
