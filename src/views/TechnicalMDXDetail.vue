<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTechnicalMDX, type TechnicalMDXPost } from '../composables/useTechnicalMDX'
import { useTheme } from '../composables/useTheme'

const route = useRoute()
const router = useRouter()
const { getPostBySlug } = useTechnicalMDX()
const { isDark, toggleTheme, initializeTheme } = useTheme()

// Real-time Lagos time
const currentTime = ref('')

// Post data
const post = ref<TechnicalMDXPost | null>(null)
const isLoading = ref(true)

// Provide theme state to child components
provide('isDark', isDark)

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
  router.push('/technical')
}

// Load post data
const loadPost = async () => {
  const slug = route.params.slug as string
  post.value = await getPostBySlug(slug)
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
      
      <!-- Navigation - aligned with content -->
      <nav class="container mx-auto max-w-3xl px-4 md:px-8 pt-16">
        <div class="flex justify-between items-center">
          <!-- Theme Toggle -->
          <button @click="toggleTheme" class="w-4 h-4 transition-colors duration-200" :class="isDark ? 'text-primary-100 hover:text-primary-50' : 'text-primary-900 hover:text-primary-700'">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
              <path fill-rule="evenodd" clip-rule="evenodd"
                d="M8.5 0C8.81296 0 9.06667 0.253706 9.06667 0.566667V2.83333C9.06667 3.14629 8.81296 3.4 8.5 3.4C8.18704 3.4 7.93333 3.14629 7.93333 2.83333V0.566667C7.93333 0.253706 8.18704 0 8.5 0ZM2.48959 2.48959C2.71089 2.2683 3.06968 2.2683 3.29098 2.48959L4.89376 4.09236C5.11505 4.31366 5.11505 4.67246 4.89376 4.89376C4.67246 5.11505 4.31366 5.11505 4.09236 4.89376L2.48959 3.29098C2.2683 3.06968 2.2683 2.71089 2.48959 2.48959ZM0.566667 7.93333C0.253706 7.93333 0 8.18704 0 8.5C0 8.81296 0.253706 9.06667 0.566667 9.06667H2.83333C3.14629 9.06667 3.4 8.81296 3.4 8.5C3.4 8.18704 3.14629 7.93333 2.83333 7.93333H0.566667ZM2.48959 14.5104C2.2683 14.2891 2.2683 13.9304 2.48959 13.709L4.09236 12.1063C4.31366 11.8849 4.67246 11.8849 4.89376 12.1063C5.11505 12.3275 5.11505 12.6863 4.89376 12.9076L3.29098 14.5104C3.06968 14.7317 2.71089 14.7317 2.48959 14.5104ZM14.1667 7.93333C13.8538 7.93333 13.6 8.18704 13.6 8.5C13.6 8.81296 13.8538 9.06667 14.1667 9.06667H16.4333C16.7462 9.06667 17 8.81296 17 8.5C17 8.18704 16.7462 7.93333 16.4333 7.93333H14.1667ZM12.1063 4.89376C11.8849 4.67246 11.8849 4.31366 12.1063 4.09236L13.709 2.48959C13.9304 2.2683 14.2891 2.2683 14.5104 2.48959C14.7317 2.71089 14.7317 3.06968 14.5104 3.29098L12.9076 4.89376C12.6863 5.11505 12.3275 5.11505 12.1063 4.89376ZM9.06667 14.1667C9.06667 13.8538 8.81296 13.6 8.5 13.6C8.18704 13.6 7.93333 13.8538 7.93333 14.1667V16.4333C7.93333 16.7462 8.18704 17 8.5 17C8.81296 17 9.06667 16.7462 9.06667 16.4333V14.1667ZM12.1063 12.1063C12.3275 11.8849 12.6863 11.8849 12.9076 12.1063L14.5104 13.709C14.7317 13.9304 14.7317 14.2891 14.5104 14.5104C14.2891 14.7317 13.9304 14.7317 13.709 14.5104L12.1063 12.9076C11.8849 12.6863 11.8849 12.3275 12.1063 12.1063ZM6.23333 8.5C6.23333 7.24815 7.24815 6.23333 8.5 6.23333C9.75185 6.23333 10.7667 7.24815 10.7667 8.5C10.7667 9.75185 9.75185 10.7667 8.5 10.7667C7.24815 10.7667 6.23333 9.75185 6.23333 8.5ZM8.5 5.1C6.62224 5.1 5.1 6.62224 5.1 8.5C5.1 10.3778 6.62224 11.9 8.5 11.9C10.3778 11.9 11.9 10.3778 11.9 8.5C11.9 6.62224 10.3778 5.1 8.5 5.1Z"
                fill="currentColor" />
            </svg>
          </button>
          
          <!-- Navigation Links -->
          <div class="flex space-x-3 sm:space-x-6 text-sm">
            <router-link to="/" class="transition-colors" :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'">About</router-link>
            <router-link to="/commentary" class="transition-colors" :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'">Commentary</router-link>
            <router-link to="/technical" class="transition-colors" :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'">Technical</router-link>
            <router-link to="/readings" class="transition-colors" :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'">Readings</router-link>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="container mx-auto px-4 md:px-8 py-10 max-w-3xl">
        
        <!-- Loading state -->
        <div v-if="isLoading" class="text-center py-16">
          <div :class="isDark ? 'text-primary-400' : 'text-primary-600'">Loading...</div>
        </div>

        <!-- Post not found -->
        <div v-else-if="!post" class="text-center py-16">
          <h2 class="text-2xl font-bold mb-4" :class="isDark ? 'text-primary-100' : 'text-primary-900'">Post not found</h2>
          <button 
            @click="goBack"
            class="inline-flex items-center text-sm transition-colors group" 
            :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'"
          >
            <svg 
              width="15" 
              height="10" 
              viewBox="0 0 15 10" 
              fill="currentColor" 
              class="mr-2 group-hover:-translate-x-1 transition-transform"
            >
              <path d="M4.5 0L0 5l4.5 5V7h10V3h-10V0z"/>
            </svg>
            Back to technical posts
          </button>
        </div>

        <!-- Post content -->
        <article v-else>
          <!-- Back button -->
          <div class="mb-8">
            <button 
              @click="goBack"
              class="inline-flex items-center text-sm transition-colors group" 
              :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'"
            >
              <svg 
                width="15" 
                height="10" 
                viewBox="0 0 15 10" 
                fill="currentColor" 
                class="mr-2 group-hover:-translate-x-1 transition-transform"
              >
                <path d="M4.5 0L0 5l4.5 5V7h10V3h-10V0z"/>
              </svg>
              Back
            </button>
          </div>

          <!-- Post header -->
          <header class="mb-12">
            <div v-if="post.coverImage" class="mb-8">
              <img 
                :src="post.coverImage" 
                :alt="post.title"
                class="w-full h-64 md:h-96 object-cover shadow-lg"
              />
            </div>
            
            <div class="text-sm font-medium mb-4 transition-colors" 
                 :class="isDark ? 'text-primary-500' : 'text-primary-500'">
              {{ post.dateFormatted }}
            </div>
            
            <h1 class="text-4xl md:text-5xl font-bold mb-6 transition-colors" 
                :class="isDark ? 'text-primary-100' : 'text-primary-900'">
              {{ post.title }}
            </h1>
            
            <p v-if="post.desc" class="text-xl leading-relaxed transition-colors" 
               :class="isDark ? 'text-primary-300' : 'text-primary-700'">
              {{ post.desc }}
            </p>
          </header>

          <!-- Main content grid with sidebar for footnotes -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Main content - Render MDX component -->
            <div class="lg:col-span-8">
              <div 
                class="prose prose-lg max-w-none transition-colors"
                :class="isDark 
                  ? 'prose-invert prose-headings:text-primary-100 prose-p:text-primary-300 prose-a:text-primary-400 prose-code:text-pink-400 prose-pre:bg-primary-900' 
                  : 'prose-headings:text-primary-900 prose-p:text-primary-700 prose-a:text-primary-600 prose-code:text-pink-600 prose-pre:bg-primary-100'"
              >
                <!-- Render the MDX component -->
                <component :is="post.component" v-if="post.component" />
              </div>
            </div>

            <!-- Footnotes sidebar -->
            <div class="lg:col-span-4" v-if="post.footnotes && post.footnotes.length > 0">
              <div class="lg:sticky lg:top-8 space-y-6">
                <h3 class="text-sm font-semibold uppercase tracking-wide border-b pb-2 transition-colors" 
                    :class="isDark ? 'text-primary-100 border-primary-700' : 'text-primary-900 border-primary-200'">
                  Footnotes
                </h3>
                <div class="space-y-4">
                  <div 
                    v-for="footnote in post.footnotes" 
                    :key="footnote.id"
                    :id="`footnote-${footnote.id}`"
                    class="p-4 border text-sm transition-all duration-300"
                    :class="isDark ? 'bg-primary-900 border-primary-700 text-primary-300' : 'bg-white border-primary-200 text-primary-600'"
                  >
                    <div class="flex items-start space-x-2">
                      <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-medium transition-colors" 
                            :class="isDark ? 'bg-primary-800 text-primary-400' : 'bg-primary-100 text-primary-600'">
                        {{ footnote.id }}
                      </span>
                      <div v-html="footnote.content" class="flex-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      <!-- Footer - aligned with content -->
      <footer class="container mx-auto max-w-3xl px-4 md:px-8 pb-12 pt-8 border-t transition-colors" :class="isDark ? 'border-primary-800' : 'border-primary-200'">
        <div class="flex justify-between items-center text-sm" :class="isDark ? 'text-primary-500' : 'text-primary-500'">
          <div>
            LAGOS, NG — {{ currentTime }}
          </div>
          <div>
            @etadn
          </div>
        </div>
      </footer>
      
    </div>
  </div>
</template>

<style>
/* Enhanced prose styling for MDX content */
:deep(.prose) {
  --tw-prose-body: inherit;
  --tw-prose-headings: inherit;
  --tw-prose-links: inherit;
  --tw-prose-bold: inherit;
  --tw-prose-counters: inherit;
  --tw-prose-bullets: inherit;
  --tw-prose-hr: inherit;
  --tw-prose-quotes: inherit;
  --tw-prose-quote-borders: inherit;
  --tw-prose-captions: inherit;
  --tw-prose-code: inherit;
  --tw-prose-pre-code: inherit;
  --tw-prose-pre-bg: inherit;
  --tw-prose-th-borders: inherit;
  --tw-prose-td-borders: inherit;
}

/* Footnote reference styling */
:deep(.footnote-ref) {
  color: rgb(37 99 235);
  opacity: 0.9;
}

.dark :deep(.footnote-ref) {
  color: rgb(96 165 250);
}

:deep(.footnote-ref:hover) {
  opacity: 0.7;
}

/* Link styling */
:deep(a) {
  color: inherit;
}

:deep(a:hover) {
  color: rgb(37 99 235);
}

.dark :deep(a:hover) {
  color: rgb(96 165 250);
}

/* Component spacing */
:deep(.interactive-component) {
  margin: 2rem 0;
}
</style>
