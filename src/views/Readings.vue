<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReadings } from '../composables/useReadings'
import { useTheme } from '../composables/useTheme'

const router = useRouter()
const { posts, isLoading, loadAllPosts } = useReadings()
const { isDark, toggleTheme, initializeTheme } = useTheme()

// Real-time Lagos time
const currentTime = ref('')

const goToReading = (slug: string) => {
  router.push(`/readings/${slug}`)
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
  document.title = 'Readings - onkhida'
  
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  loadAllPosts()
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
        <!-- Readings Header -->
        <section class="mb-12">
          <h1 class="text-6xl font-cormorant font-normal mb-6" :class="isDark ? 'text-primary-50' : 'text-primary-900'">readings.</h1>
          
          <p class="leading-relaxed mb-8" :class="isDark ? 'text-primary-300' : 'text-primary-700'">
            I go through a sizeable amount of text everyday. These entries here are essentially reviews and public notes 
            that I keep on articles, books, and posts that I find interesting. No entry is ever really complete; by the way, 
            and I keep iterating through each one across time.
          </p>
        </section>

        <!-- Divider -->
        <hr class="mb-12 border-t transition-colors" :class="isDark ? 'border-primary-800' : 'border-primary-200'">

        <!-- Reading Entries -->
        <section class="mb-12">
          <!-- Loading state -->
          <div v-if="isLoading" class="text-center py-8">
            <div :class="isDark ? 'text-primary-400' : 'text-primary-600'">Loading readings...</div>
          </div>
          
          <!-- Reading List -->
          <div v-else class="space-y-4">
            <article 
              v-for="post in posts" 
              :key="post.slug"
              class="flex items-center gap-3 md:gap-4 cursor-pointer group py-3 md:py-4 px-4 md:px-6 rounded-lg transition-all duration-200 hover:scale-[1.02] font-sans"
              :class="isDark ? 'bg-primary-900/40 hover:bg-primary-900/60' : 'bg-primary-100/60 hover:bg-primary-100/80'"
              @click="goToReading(post.slug)"
            >
              <!-- Author Image (Circle) -->
              <div class="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 transition-colors" 
                   :class="isDark ? 'border-primary-700' : 'border-primary-300'">
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

              <!-- Book Title (center) -->
              <h2 class="flex-1 text-sm md:text-base font-medium transition-colors group-hover:opacity-80 !font-sans" 
                  :class="isDark ? 'text-primary-100' : 'text-primary-900'">
                {{ post.title }}
              </h2>
              
              <!-- Author and year (right) - hidden on mobile -->
              <p class="hidden md:flex text-sm transition-colors flex-shrink-0" 
                 :class="isDark ? 'text-primary-400' : 'text-primary-600'">
                {{ post.author }}{{ post.year ? `, ${post.year}` : '' }}
              </p>
            </article>
          </div>

          <!-- Empty state -->
          <div v-if="!isLoading && posts.length === 0" class="text-center py-16">
            <div class="transition-colors" :class="isDark ? 'text-primary-400' : 'text-primary-600'">
              No readings yet. Check back soon!
            </div>
          </div>
        </section>
      </main>

      <!-- Footer - aligned with content -->
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
/* Any component-specific styles can go here */
</style>
