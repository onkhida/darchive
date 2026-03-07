<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme, initializeTheme } = useTheme()

// Real-time Lagos time
const currentTime = ref('')

// Hover preview state for name-follow image
const showPreview = ref(false)
const previewX = ref(0)
const previewY = ref(0)
// Use the same public asset used elsewhere
const previewSrc = '/assets/images/me.png'

const updatePreviewPos = (e: MouseEvent) => {
  const offset = 16
  previewX.value = e.clientX + offset
  previewY.value = e.clientY + offset
}

const onNameEnter = (e: MouseEvent) => {
  updatePreviewPos(e)
  showPreview.value = true
}
const onNameLeave = () => {
  showPreview.value = false
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
  document.title = 'About - onkhida'
  
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
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
        <!-- About Section -->
        <section id="about" class="mb-16">

          <h1 class="text-6xl font-cormorant font-normal mb-8" :class="isDark ? 'text-primary-50' : 'text-primary-900'">about.</h1>

          <div class="space-y-3 leading-relaxed" :class="isDark ? 'text-primary-300' : 'text-primary-700'">
            <div>
              <p class="text-sm mb-1" :class="isDark ? 'text-primary-500' : 'text-primary-500'">
                Pronunciation — /ˈetə/
              </p>
              <p>
                My name is 
                <span class="underline cursor-pointer" 
                      @mouseenter="onNameEnter" 
                      @mouseleave="onNameLeave" 
                      @mousemove="updatePreviewPos">
                  Daniel Eta</span>.
              </p>
            </div>

            <p>This site—and the content in it—doubles as my personal archive and also as a documentation of my progression through the years. Much of the content that you will find here is related to technology (and software in general), but a healthy chunk of what I post here has roots in different (sometimes even diverging) fields.
            </p>
            <p>I suppose my goal with a lot of what I do seems to tend towards some sort of consilience. The wanderlust within has always transmuted beyond the physical; I can't always control where my mind and its pursuits will take me. 
            </p>
            <p>I try to spin <a href="http://onkhida.me/technical" class="underline">narratives around technology</a>, <a href="http://onkhida.me/consumables" class="underline">the entities I consume</a>, and <a href="http://onkhida.me/commentary" class="underline">the thoughts that stay with me</a> as I continue existing. In the same vein, I also spend time logging my <a href="http://notebooks.onkhida.me/" class="underline">process of learning</a> and what is commonly the output of this learning process—in an <a href="http://papers.onkhida.me/" class="underline">academic</a> or <a href="http://demos.onkhida.me/" class="underline">practical</a> sense.
            </p>
            <p>The best way to reach is me is (by far) through my <a href="mailto:daniel.eta@outlook.com" class="underline">email</a>. I love reading/writing to/from people, and it is my most active channel of communication. Though I do have accounts on <a href="https://www.reddit.com/user/onkhida/" class="underline">Reddit</a>, <a href="https://www.linkedin.com/in/daniel-eta/" class="underline">LinkedIn</a> and <a href="https://x.com/onkhida" class="underline">x.com</a> to allow me to share some of my work and provide me with some sort of digital footprint. 
            </p>            
            
            <div class="mt-8">
              <a href="#" class="fancy text-sm" :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'">
                web links 
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>

      <!-- Hover-follow preview image (detached from flow) -->
      <img
        v-show="showPreview"
        :src="previewSrc"
        :style="{ left: previewX + 'px', top: previewY + 'px', height: '100px', width: 'auto' }"
        class="fixed pointer-events-none shadow-lg z-50 transition-opacity duration-150"
        :class="showPreview ? 'opacity-100' : 'opacity-0'"
        alt="preview" />

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
