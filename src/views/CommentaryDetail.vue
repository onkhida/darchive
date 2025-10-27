<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommentary, type CommentaryPost } from '../composables/useCommentary'
import { useTheme } from '../composables/useTheme'

const route = useRoute()
const router = useRouter()
const { getPostBySlug, renderMarkdown } = useCommentary()
const { isDark, toggleTheme, initializeTheme } = useTheme()

// Real-time Lagos time
const currentTime = ref('')

// Post data
const post = ref<CommentaryPost | null>(null)
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
  router.push('/commentary')
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
  
  // Clear highlight after 5 seconds (longer for mobile since they scrolled)
  setTimeout(() => {
    if (activeFootnote.value === footnoteId) {
      activeFootnote.value = null
    }
  }, 5000)
}

const handleFootnoteClick = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('footnote-ref')) {
    const footnoteIdStr = target.dataset.footnote
    if (footnoteIdStr) {
      const footnoteId = parseInt(footnoteIdStr, 10)
      if (!isNaN(footnoteId)) {
        highlightFootnote(footnoteId)
      }
    }
  }
}

// Load post data from markdown files
const loadPost = async () => {
  const slug = route.params.slug as string
  isLoading.value = true
  
  try {
    const loadedPost = await getPostBySlug(slug)
    post.value = loadedPost
    
    if (loadedPost) {
      // Set page title based on commentary title
      document.title = `${loadedPost.title} - onkhida`
    } else {
      document.title = 'Commentary Not Found - onkhida'
    }
  } catch (error) {
    console.error('Error loading post:', error)
    post.value = null
    document.title = 'Commentary Not Found - onkhida'
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
      
      <!-- Header with back button and theme toggle -->
      <header class="max-w-7xl mx-auto px-4 md:px-8 pt-16">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-8 lg:col-start-2">
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
          </div>
        </div>
      </header>

      <!-- Main Content with margin layout for footnotes -->
      <div class="relative max-w-7xl mx-auto px-4 md:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <!-- Main article content -->
          <main class="lg:col-span-8 lg:col-start-2">
            <div v-if="isLoading" class="text-center py-12">
              <div :class="isDark ? 'text-primary-400' : 'text-primary-600'">Loading...</div>
            </div>
            
            <div v-else-if="!post" class="text-center py-12">
              <div :class="isDark ? 'text-primary-400' : 'text-primary-600'">Post not found</div>
            </div>
            
            <article v-else>
              <!-- Post Header -->
              <header class="mb-8">
                <div class="flex items-center space-x-3 mb-4">
                  <!-- Lightning bolt SVG -->
                  <svg v-if="post.birthday" width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M6.45279 0.0526993C6.53413 0.0979755 6.59797 0.169189 6.63412 0.25498C6.67027 0.340771 6.67664 0.436197 6.65223 0.526035L5.54556 4.58328H9.58336C9.66456 4.58328 9.74399 4.60702 9.81188 4.65156C9.87978 4.6961 9.93318 4.75951 9.96552 4.83399C9.99786 4.90847 10.0077 4.99078 9.99393 5.0708C9.98012 5.15082 9.94324 5.22506 9.8878 5.28439L4.05444 11.5344C3.9909 11.6026 3.90632 11.6476 3.81423 11.6621C3.72214 11.6765 3.62785 11.6597 3.54645 11.6143C3.46504 11.5688 3.40123 11.4974 3.36521 11.4114C3.32919 11.3254 3.32305 11.2299 3.34777 11.14L4.45444 7.08329H0.416643C0.335442 7.08329 0.256011 7.05955 0.188116 7.01501C0.120221 6.97047 0.0668201 6.90706 0.0344776 6.83258C0.0021351 6.7581 -0.00773936 6.67579 0.00606815 6.59577C0.0198757 6.51575 0.0567633 6.44151 0.112197 6.38218L5.94556 0.132144C6.0091 0.0641694 6.09356 0.0194172 6.18548 0.00501932C6.27741 -0.00937859 6.37151 0.00740635 6.45279 0.0526993Z"
                      fill="#A67C00" />
                  </svg>
                  <svg v-else width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M6.45279 0.0526993C6.53413 0.0979755 6.59797 0.169189 6.63412 0.25498C6.67027 0.340771 6.67664 0.436197 6.65223 0.526035L5.54556 4.58328H9.58336C9.66456 4.58328 9.74399 4.60702 9.81188 4.65156C9.87978 4.6961 9.93318 4.75951 9.96552 4.83399C9.99786 4.90847 10.0077 4.99078 9.99393 5.0708C9.98012 5.15082 9.94324 5.22506 9.8878 5.28439L4.05444 11.5344C3.9909 11.6026 3.90632 11.6476 3.81423 11.6621C3.72214 11.6765 3.62785 11.6597 3.54645 11.6143C3.46504 11.5688 3.40123 11.4974 3.36521 11.4114C3.32919 11.3254 3.32305 11.2299 3.34777 11.14L4.45444 7.08329H0.416643C0.335442 7.08329 0.256011 7.05955 0.188116 7.01501C0.120221 6.97047 0.0668201 6.90706 0.0344776 6.83258C0.0021351 6.7581 -0.00773936 6.67579 0.00606815 6.59577C0.0198757 6.51575 0.0567633 6.44151 0.112197 6.38218L5.94556 0.132144C6.0091 0.0641694 6.09356 0.0194172 6.18548 0.00501932C6.27741 -0.00937859 6.37151 0.00740635 6.45279 0.0526993Z"
                      fill="currentColor" />
                  </svg>
                  
                  <h1 class="text-5xl font-cormorant font-normal" 
                      :class="isDark ? 'text-primary-50' : 'text-primary-900'">
                    {{ post.title }}
                  </h1>
                </div>
                
                <p class="text-sm mb-6" :class="isDark ? 'text-primary-400' : 'text-primary-600'">
                  {{ post.dateFormatted }}
                </p>
              </header>

              <!-- Divider -->
              <hr class="border-t mb-8" :class="isDark ? 'border-primary-800' : 'border-primary-200'">

              <!-- Post Content -->
              <div class="prose prose-lg max-w-none" :class="isDark ? 'prose-invert' : ''">
                <div v-html="renderMarkdown(post.content || '')" 
                     @click="handleFootnoteClick"
                     class="leading-relaxed" 
                     :class="isDark ? 'text-primary-300' : 'text-primary-700'">
                </div>
              </div>
            </article>
          </main>

          <!-- Sidebar for footnotes (desktop only) -->
          <aside v-if="post && post.footnotes && post.footnotes.length > 0" 
                 class="hidden lg:block lg:col-span-3 lg:col-start-10">
            <div class="sticky top-8">
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
        </div>

        <!-- Mobile footnotes (appear as asides after content) -->
        <div v-if="post && post.footnotes && post.footnotes.length > 0" class="lg:hidden">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 lg:col-start-2">
              <div id="mobile-footnotes" class="border-t pt-8 mt-12" :class="isDark ? 'border-primary-800' : 'border-primary-200'">
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
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="max-w-7xl mx-auto px-4 md:px-8 pb-12 pt-16 border-t mt-16 transition-colors" :class="isDark ? 'border-primary-800' : 'border-primary-200'">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-8 lg:col-start-2">
            <div class="flex justify-between items-center text-sm" :class="isDark ? 'text-primary-500' : 'text-primary-500'">
              <div>
                LAGOS, NG — {{ currentTime }}
              </div>
              <div>
                @etadn
              </div>
            </div>
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
