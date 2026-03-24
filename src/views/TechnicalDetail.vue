<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTechnical, type TechnicalPost } from '../composables/useTechnical'
import { loadComponent } from '../composables/useComponentRegistry'
import { useTheme } from '../composables/useTheme'
import { createApp } from 'vue'

const route = useRoute()
const router = useRouter()
const { getPostBySlug, renderMarkdown } = useTechnical()
const { isDark, toggleTheme, initializeTheme } = useTheme()

// Real-time Lagos time
const currentTime = ref('')

// Post data
const post = ref<TechnicalPost | null>(null)
const isLoading = ref(true)

// Interactive components
const interactiveContainer = ref<HTMLElement>()
const dynamicComponents = ref<Record<string, any>>({})
// Track runtime-mounted app instances for cleanup
const mountedApps: Array<{ el: Element; app: any }> = []

// Table of Contents
const tableOfContents = ref<Array<{ id: string; text: string; level: number }>>([])
const activeHeadingId = ref<string | null>(null)

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

const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  return renderMarkdown(post.value.content)
})

const handleFootnoteClick = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('footnote-ref')) {
    const footnoteId = target.dataset.footnote
    if (footnoteId) {
      const footnoteEl = document.getElementById(`footnote-${footnoteId}`)
      if (footnoteEl) {
        // Add highlight effect
        footnoteEl.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50')
        footnoteEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Remove highlight after 2 seconds
        setTimeout(() => {
          footnoteEl.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50')
        }, 2000)
      }
    }
  }
}

// Tooltip for desktop hover preview of footnotes
import { ref as vueRef } from 'vue'
const footnoteTooltip = vueRef<HTMLElement | null>(null)

const showFootnoteTooltip = (ev: MouseEvent) => {
  const target = ev.target as HTMLElement
  if (!target || !target.classList.contains('footnote-ref')) return
  if (window.innerWidth < 1024) return // don't show on small screens
  const id = target.dataset.footnote
  if (!id) return
  const foot = post.value?.footnotes?.find(f => String(f.id) === id)
  if (!foot) return

  // remove existing tooltip if any
  hideFootnoteTooltip()

  const el = document.createElement('div')
  el.className = 'footnote-tooltip max-w-xs p-3 rounded shadow-lg text-sm'
  el.style.position = 'fixed'
  el.style.zIndex = '9999'
  el.style.background = getComputedStyle(document.body).getPropertyValue('--tooltip-bg') || (isDark.value ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.98)')
  el.style.color = isDark.value ? '#e5e7eb' : '#111827'
  el.innerHTML = foot.content

  document.body.appendChild(el)
  footnoteTooltip.value = el

  // position near mouse
  const left = Math.min(window.innerWidth - el.offsetWidth - 12, ev.clientX + 12)
  const top = Math.min(window.innerHeight - el.offsetHeight - 12, ev.clientY + 12)
  el.style.left = `${left}px`
  el.style.top = `${top}px`
}

const moveFootnoteTooltip = (ev: MouseEvent) => {
  if (!footnoteTooltip.value) return
  const el = footnoteTooltip.value
  const left = Math.min(window.innerWidth - el.offsetWidth - 12, ev.clientX + 12)
  const top = Math.min(window.innerHeight - el.offsetHeight - 12, ev.clientY + 12)
  el.style.left = `${left}px`
  el.style.top = `${top}px`
}

const hideFootnoteTooltip = () => {
  if (footnoteTooltip.value) {
    footnoteTooltip.value.remove()
    footnoteTooltip.value = null
  }
}

const setupFootnoteHover = () => {
  // Attach delegated listeners to the interactive container
  if (!interactiveContainer.value) return

  interactiveContainer.value.addEventListener('mouseover', showFootnoteTooltip as EventListener)
  interactiveContainer.value.addEventListener('mousemove', moveFootnoteTooltip as EventListener)
  interactiveContainer.value.addEventListener('mouseout', (ev: Event) => {
    const mouseEv = ev as MouseEvent
    const to = mouseEv.relatedTarget as HTMLElement | null
    // If moving into tooltip, keep it (rare). Otherwise hide.
    if (to && footnoteTooltip.value && footnoteTooltip.value.contains(to)) return
    hideFootnoteTooltip()
  })
}

// Ensure we setup hover after mounting content
const mountInteractiveComponents = async () => {
  // This is now handled by the enhanced markdown processing in useTechnical
  // which automatically detects and renders components using the registry
  await nextTick()
  
  // GUARD: Don't re-mount components while an existing component is actively patching
  // This prevents insertBefore errors when ClassificationPlot (or similar) is updating
  // Use exponential backoff to wait for any concurrent updates to complete
  let retries = 0
  const maxRetries = 50 // ~500ms total wait time
  
  while (retries < maxRetries && typeof window !== 'undefined' && (window as any).__CP_IS_UPDATING?.()) {
    console.log(`[mountInteractiveComponents] deferring mount - ClassificationPlot is updating (attempt ${retries + 1}/${maxRetries})`)
    // Exponential backoff: 10ms initially, then longer waits
    const delay = Math.min(10 * Math.pow(1.1, retries), 50)
    await new Promise(resolve => setTimeout(resolve, delay))
    retries++
  }
  
  if (retries >= maxRetries) {
    console.warn('[mountInteractiveComponents] timeout waiting for ClassificationPlot update to complete, proceeding anyway')
  }
  
  // Add copy buttons to code blocks after content is rendered
  addCopyButtonsToCodeBlocks()

  // Setup footnote hover tooltip behavior
  setupFootnoteHover()

  // Debug: trace mounting flow
  console.log('[mountInteractiveComponents] start')

  // Find placeholder divs inserted by parseInteractiveComponents and mount Vue components into them
  if (interactiveContainer.value) {
    const placeholders = interactiveContainer.value.querySelectorAll<HTMLDivElement>('.interactive-component[data-component]')
    console.log('[mountInteractiveComponents] placeholders found:', placeholders.length)
    for (const ph of Array.from(placeholders)) {
      const compName = ph.dataset.component
      const propsJson = ph.dataset.props ? decodeURIComponent(ph.dataset.props) : '{}'
      let props: Record<string, any> = {}
      try { props = JSON.parse(propsJson) } catch (err) { props = {} }

      console.log(`[mountInteractiveComponents] attempting to mount component: ${compName}`, props)

      // show loading UI inside placeholder so it's visible while importing
      try {
        ph.innerHTML = ''
        ph.style.minHeight = '120px'
        const loaderEl = document.createElement('div')
        loaderEl.className = 'p-4 text-sm text-slate-500'
        loaderEl.textContent = 'Loading interactive component...'
        ph.appendChild(loaderEl)
      } catch (e) {
        // ignore DOM errors
      }

      try {
        const comp = await loadComponent(compName || '')
        console.log(`[mountInteractiveComponents] loadComponent result for ${compName}:`, comp)
        if (!comp) {
          console.warn(`[mountInteractiveComponents] component not found in registry: ${compName}`)
          ph.innerHTML = '<div class="p-4 text-sm text-red-500">Interactive component not found.</div>'
          continue
        }

        const appInstance = createApp(comp, props)
        // Mount into placeholder
        appInstance.mount(ph)
        mountedApps.push({ el: ph, app: appInstance })
        console.log(`[mountInteractiveComponents] mounted ${compName} into placeholder`) 
      } catch (err) {
        console.error('Failed to mount interactive component', compName, err)
        try {
          ph.innerHTML = `<div class="p-4 text-sm text-red-500">Failed to load interactive component: ${compName}</div>`
        } catch (e) { /* ignore */ }
      }
    }
  } else {
    console.log('[mountInteractiveComponents] no interactiveContainer ref')
  }

  console.log('[mountInteractiveComponents] complete')
}

const addCopyButtonsToCodeBlocks = () => {
  if (!interactiveContainer.value) return
  
  const codeBlocks = interactiveContainer.value.querySelectorAll('pre')
  
  codeBlocks.forEach((pre) => {
    // Skip if copy button already exists
    if (pre.querySelector('.copy-button')) return
    
    const copyButton = document.createElement('button')
    copyButton.className = 'copy-button'
    copyButton.textContent = 'Copy'
    copyButton.setAttribute('data-copied', 'false')
    
    copyButton.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      const codeElement = pre.querySelector('code')
      if (!codeElement) return
      
      const codeText = codeElement.textContent || ''
      
      try {
        await navigator.clipboard.writeText(codeText)
        copyButton.textContent = 'Copied!'
        copyButton.setAttribute('data-copied', 'true')
        
        setTimeout(() => {
          copyButton.textContent = 'Copy'
          copyButton.setAttribute('data-copied', 'false')
        }, 2000)
      } catch (err) {
        console.error('Failed to copy code:', err)
        copyButton.textContent = 'Failed'
        setTimeout(() => {
          copyButton.textContent = 'Copy'
        }, 2000)
      }
    })
    
    pre.appendChild(copyButton)
  })
}

const generateTableOfContents = () => {
  setTimeout(() => {
    if (!interactiveContainer.value) return
    
    const headings = interactiveContainer.value.querySelectorAll('h1')
    const toc: Array<{ id: string; text: string; level: number }> = []
    
    headings.forEach((heading, index) => {
      const level = 1
      const text = heading.textContent?.trim() || ''
      const id = `heading-${index}`
      
      // Add ID to heading for anchor links
      heading.id = id
      
      toc.push({ id, text, level })
    })
    
    tableOfContents.value = toc
    console.log('TOC generated:', toc) // Debug log
    
    // Set up intersection observer for active heading detection
    setupIntersectionObserver()
  }, 500) // Give content time to fully render
}

const setupIntersectionObserver = () => {
  if (!interactiveContainer.value) return
  
  const headings = interactiveContainer.value.querySelectorAll('h1')
  
  const observer = new IntersectionObserver((entries) => {
    // Find the entry that's most visible
    let mostVisible = entries[0]
    let maxRatio = 0
    
    entries.forEach(entry => {
      if (entry.intersectionRatio > maxRatio) {
        maxRatio = entry.intersectionRatio
        mostVisible = entry
      }
    })
    
    if (mostVisible && mostVisible.isIntersecting) {
      activeHeadingId.value = mostVisible.target.id
    }
  }, {
    threshold: [0, 0.25, 0.5, 0.75, 1],
    rootMargin: '-100px 0px -60% 0px'
  })
  
  headings.forEach(heading => observer.observe(heading))
}

// Load components used in the post
const loadPostComponents = async (components: string[]) => {
  const loadedComponents: Record<string, any> = {}
  
  for (const componentName of components) {
    try {
      const component = await loadComponent(componentName)
      if (component) {
        loadedComponents[componentName] = component
      }
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error)
    }
  }
  
  dynamicComponents.value = loadedComponents
}

// Load post data
const loadPost = async () => {
  const slug = route.params.slug as string
  const loadedPost = await getPostBySlug(slug)
  
  if (loadedPost) {
    post.value = loadedPost
    
    // Set page title based on post title
    document.title = `${loadedPost.title} - onkhida`

    // Ensure the loading state is cleared so the article DOM is rendered
    isLoading.value = false

    // Wait for DOM update and for the interactiveContainer ref to become available
    // Poll a few times because v-html content can take a couple of frames to attach
    let attempts = 0
    while (!interactiveContainer.value && attempts < 12) {
      console.log('[loadPost] waiting for interactiveContainer ref, attempt', attempts + 1)
      await nextTick()
      attempts++
    }
    console.log('[loadPost] interactiveContainer available:', !!interactiveContainer.value)

    // Load any dynamic components used in this post
    if (loadedPost.components && loadedPost.components.length > 0) {
      await loadPostComponents(loadedPost.components)
    }
    
    await mountInteractiveComponents()
    
    // Generate TOC after content is fully rendered
    await nextTick()
    generateTableOfContents()
  } else {
    // Post not found
    document.title = 'Technical Not Found - onkhida'
    isLoading.value = false
  }
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
  // cleanup mounted interactive apps
  for (const m of mountedApps) {
    try { m.app.unmount(); } catch (e) { /* ignore */ }
  }
  mountedApps.length = 0
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
              
              <!-- Theme Toggle - visible on small screens only -->
              <button @click="toggleTheme" class="lg:hidden w-4 h-4 transition-colors duration-200" :class="isDark ? 'text-primary-100 hover:text-primary-50' : 'text-primary-900 hover:text-primary-700'">
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

      <!-- Main Content with margin layout for TOC -->
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
                <h1 class="text-5xl md:text-6xl font-serif font-normal mb-4 leading-[1.55]" 
                    :class="isDark ? 'text-primary-50' : 'text-primary-900'">
                  {{ post.title }}
                </h1>
                
                <p v-if="post.desc" class="text-lg mb-4 leading-relaxed" 
                   :class="isDark ? 'text-primary-300' : 'text-primary-600'">
                  {{ post.desc }}
                </p>
                
                <div class="flex items-center gap-4 text-sm mb-6" :class="isDark ? 'text-primary-400' : 'text-primary-600'">
                  <span>{{ post.dateFormatted }}</span>
                  <span v-if="post.hasInteractiveComponents" class="px-2 py-1 text-xs font-medium border border-pink-500/30 text-pink-500">
                    INTERACTIVE
                  </span>
                </div>
              </header>

              <!-- Divider -->
              <hr class="border-t mb-8" :class="isDark ? 'border-primary-800' : 'border-primary-200'">

              <!-- Post Content -->
              <div class="prose prose-lg max-w-none" :class="isDark ? 'prose-invert' : ''">
                <div 
                  ref="interactiveContainer"
                  v-html="renderedContent" 
                  @click="handleFootnoteClick"
                  class="leading-relaxed" 
                  :class="isDark ? 'text-primary-300' : 'text-primary-700'">
                </div>
              </div>
            </article>
          </main>

          <!-- Sidebar for TOC (desktop only) -->
          <aside v-if="tableOfContents.length > 0" 
                 class="hidden lg:block fixed top-24 right-8 xl:right-16 z-10">
            <div class="bg-transparent">
              <!-- Theme Toggle - visible on large screens only, above TOC -->
              <div class="flex justify-end mb-6">
                <button @click="toggleTheme" class="w-4 h-4 transition-colors duration-200" :class="isDark ? 'text-primary-100 hover:text-primary-50' : 'text-primary-900 hover:text-primary-700'">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M8.5 0C8.81296 0 9.06667 0.253706 9.06667 0.566667V2.83333C9.06667 3.14629 8.81296 3.4 8.5 3.4C8.18704 3.4 7.93333 3.14629 7.93333 2.83333V0.566667C7.93333 0.253706 8.18704 0 8.5 0ZM2.48959 2.48959C2.71089 2.2683 3.06968 2.2683 3.29098 2.48959L4.89376 4.09236C5.11505 4.31366 5.11505 4.67246 4.89376 4.89376C4.67246 5.11505 4.31366 5.11505 4.09236 4.89376L2.48959 3.29098C2.2683 3.06968 2.2683 2.71089 2.48959 2.48959ZM0.566667 7.93333C0.253706 7.93333 0 8.18704 0 8.5C0 8.81296 0.253706 9.06667 0.566667 9.06667H2.83333C3.14629 9.06667 3.4 8.81296 3.4 8.5C3.4 8.18704 3.14629 7.93333 2.83333 7.93333H0.566667ZM2.48959 14.5104C2.2683 14.2891 2.2683 13.9304 2.48959 13.709L4.09236 12.1063C4.31366 11.8849 4.67246 11.8849 4.89376 12.1063C5.11505 12.3275 5.11505 12.6863 4.89376 12.9076L3.29098 14.5104C3.06968 14.7317 2.71089 14.7317 2.48959 14.5104ZM14.1667 7.93333C13.8538 7.93333 13.6 8.18704 13.6 8.5C13.6 8.81296 13.8538 9.06667 14.1667 9.06667H16.4333C16.7462 9.06667 17 8.81296 17 8.5C17 8.18704 16.7462 7.93333 16.4333 7.93333H14.1667ZM12.1063 4.89376C11.8849 4.67246 11.8849 4.31366 12.1063 4.09236L13.709 2.48959C13.9304 2.2683 14.2891 2.2683 14.5104 2.48959C14.7317 2.71089 14.7317 3.06968 14.5104 3.29098L12.9076 4.89376C12.6863 5.11505 12.3275 5.11505 12.1063 4.89376ZM9.06667 14.1667C9.06667 13.8538 8.81296 13.6 8.5 13.6C8.18704 13.6 7.93333 13.8538 7.93333 14.1667V16.4333C7.93333 16.7462 8.18704 17 8.5 17C8.81296 17 9.06667 16.7462 9.06667 16.4333V14.1667ZM12.1063 12.1063C12.3275 11.8849 12.6863 11.8849 12.9076 12.1063L14.5104 13.709C14.7317 13.9304 14.7317 14.2891 14.5104 14.5104C14.2891 14.7317 13.9304 14.7317 13.709 14.5104L12.1063 12.9076C11.8849 12.6863 11.8849 12.3275 12.1063 12.1063ZM6.23333 8.5C6.23333 7.24815 7.24815 6.23333 8.5 6.23333C9.75185 6.23333 10.7667 7.24815 10.7667 8.5C10.7667 9.75185 9.75185 10.7667 8.5 10.7667C7.24815 10.7667 6.23333 9.75185 6.23333 8.5ZM8.5 5.1C6.62224 5.1 5.1 6.62224 5.1 8.5C5.1 10.3778 6.62224 11.9 8.5 11.9C10.3778 11.9 11.9 10.3778 11.9 8.5C11.9 6.62224 10.3778 5.1 8.5 5.1Z"
                      fill="currentColor" />
                </svg>
                </button>
              </div>
              
              <nav class="space-y-2 text-right">
                <a v-for="heading in tableOfContents" 
                   :key="heading.id"
                   :href="`#${heading.id}`"
                   class="block text-sm transition-all duration-200 no-underline"
                   :class="[
                     isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900',
                     activeHeadingId === heading.id ? 'font-semibold' : 'font-normal'
                   ]">
                  {{ heading.text }}
                </a>
              </nav>
            </div>
          </aside>
        </div>

        <!-- Mobile footnotes (appear after content) -->
        <div v-if="post && post.footnotes && post.footnotes.length > 0">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 lg:col-start-2">
              <div id="mobile-footnotes" class="border-t pt-8 mt-12" :class="isDark ? 'border-primary-800' : 'border-primary-200'">
                <h3 class="text-2xl font-medium mb-6"
                    :class="isDark ? 'text-primary-200' : 'text-primary-800'">
                  Footnotes
                </h3>
                
                <div class="space-y-4">
                  <p v-for="footnote in post.footnotes" :key="footnote.id" 
                     class="text-sm leading-relaxed"
                     :class="isDark ? 'text-primary-300' : 'text-primary-700'">
                    <span class="font-medium"
                          :class="isDark ? 'text-primary-200' : 'text-primary-600'">
                      {{ footnote.id }}:
                    </span>
                    <span :id="`footnote-${footnote.id}`" v-html="footnote.content"></span>
                    <a :href="`#fnref-${footnote.id}-1`" class="ml-2 text-xs opacity-60" aria-label="Back to reference">↩</a>
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
                <a href="https://www.reddit.com/user/onkhida/" target="_blank" rel="noopener" class="transition-colors" :class="isDark ? 'text-primary-400 hover:text-primary-100' : 'text-primary-600 hover:text-primary-900'">u/onkhida</a>
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
  text-decoration: none !important; /* Prevent underline on footnote anchors */
}

/* Tooltip for footnote previews appended to body */
:deep(.footnote-tooltip) {
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  max-width: 22rem;
  line-height: 1.4;
}

/* Ensure bold text is clearly visible in light mode */
.prose :deep(strong),
.prose :deep(b) {
  color: rgb(17 24 39) !important; /* text-gray-900 */
  font-weight: 600 !important;
}

/* Indent lists inside prose for better reading */
.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 1.5rem !important; /* 24px */
  margin-left: 1rem !important;
  list-style-position: outside !important;
  list-style-type: disc !important;
}

.prose :deep(ul ul),
.prose :deep(ol ol),
.prose :deep(ul ol),
.prose :deep(ol ul) {
  padding-left: 1.25rem !important; /* nested indent */
}

/* Link styling that inherits text color instead of being grey */
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

/* Interactive component styles */
.interactive-component {
  margin: 2rem 0;
}

.code-sandbox {
  margin: 2rem 0;
}

/* TOC specific styling - no underlines */
aside nav a {
  text-decoration: none !important;
}

aside nav a:hover {
  text-decoration: none !important;
}

/* Better prose contrast for dark mode */
.dark .prose :deep(p),
.dark .prose :deep(li),
.dark .prose :deep(blockquote) {
  color: rgb(209 213 219) !important; /* text-gray-300 */
}

.dark .prose :deep(h1),
.dark .prose :deep(h2),
.dark .prose :deep(h3),
.dark .prose :deep(h4),
.dark .prose :deep(h5),
.dark .prose :deep(h6) {
  color: rgb(243 244 246) !important; /* text-gray-100 */
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
}

.dark .prose :deep(h1) {
  font-size: 1.4375rem !important; /* 23px - Minor Second ratio base */
  line-height: 1.8rem !important;
  margin-top: 2rem !important;
  margin-bottom: 1rem !important;
}

.dark .prose :deep(h2) {
  font-size: 1.347rem !important; /* ~21.5px - Minor Second ratio */
  line-height: 1.7rem !important;
  margin-top: 1.5rem !important;
  margin-bottom: 0.75rem !important;
}

.dark .prose :deep(h3) {
  font-size: 1.263rem !important; /* ~20.2px - Minor Second ratio */
  line-height: 1.6rem !important;
  margin-top: 1.25rem !important;
  margin-bottom: 0.5rem !important;
}

.dark .prose :deep(h4) {
  font-size: 1.183rem !important; /* ~18.9px - Minor Second ratio */
  line-height: 1.5rem !important;
  margin-top: 1rem !important;
  margin-bottom: 0.5rem !important;
}

.dark .prose :deep(h5) {
  font-size: 1.110rem !important; /* ~17.8px - Minor Second ratio */
  line-height: 1.4rem !important;
  margin-top: 1rem !important;
  margin-bottom: 0.25rem !important;
}

.dark .prose :deep(h6) {
  font-size: 1.040rem !important; /* ~16.6px - Minor Second ratio */
  line-height: 1.3rem !important;
  margin-top: 0.75rem !important;
  margin-bottom: 0.25rem !important;
}

.dark .prose :deep(strong),
.dark .prose :deep(b) {
  color: rgb(243 244 246) !important; /* text-gray-100 */
  font-weight: 600;
}

.dark .prose :deep(em),
.dark .prose :deep(i) {
  color: rgb(229 231 235) !important; /* text-gray-200 */
}

/* Dark mode code styling */
.dark .prose :deep(code) {
  color: rgb(249 115 22) !important; /* orange-500 */
  background-color: rgb(39 39 42) !important; /* zinc-800 */
  padding: 0.125rem 0.375rem !important;
  border-radius: 0.25rem !important;
  font-size: 0.875em !important;
  font-weight: 500 !important;
  border: 1px solid rgb(63 63 70) !important; /* zinc-700 */
}

.dark .prose :deep(pre) {
  background-color: rgb(24 24 27) !important; /* zinc-900 */
  border: 1px solid rgb(63 63 70) !important; /* zinc-700 */
  border-radius: 0.5rem !important;
  padding: 1rem !important;
  overflow-x: auto !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  position: relative !important;
}

.dark .prose :deep(pre):hover .copy-button {
  opacity: 1 !important;
}

.dark .prose :deep(pre .copy-button) {
  position: absolute !important;
  top: 0.75rem !important;
  right: 0.75rem !important;
  background-color: rgb(39 39 42) !important; /* zinc-800 */
  border: 1px solid rgb(63 63 70) !important; /* zinc-700 */
  color: rgb(161 161 170) !important; /* zinc-400 */
  padding: 0.375rem !important;
  border-radius: 0.25rem !important;
  opacity: 0 !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
  font-size: 0.75rem !important;
  font-family: ui-sans-serif, system-ui, sans-serif !important;
}

.dark .prose :deep(pre .copy-button:hover) {
  background-color: rgb(63 63 70) !important; /* zinc-700 */
  color: rgb(228 228 231) !important; /* zinc-200 */
}

.dark .prose :deep(pre .copy-button[data-copied="true"]) {
  background-color: rgb(34 197 94) !important; /* green-500 */
  color: rgb(255 255 255) !important; /* white */
  border-color: rgb(34 197 94) !important; /* green-500 */
}

.dark .prose :deep(pre code) {
  color: rgb(228 228 231) !important; /* zinc-200 */
  background-color: transparent !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  font-size: 0.875rem !important;
  line-height: 1.7 !important;
}

/* Better prose contrast for light mode */
.prose :deep(p),
.prose :deep(li),
.prose :deep(blockquote) {
  color: rgb(55 65 81) !important; /* text-gray-700 */
}

/* Ensure lists inside prose are indented (stronger specificity) */
:deep(.prose) :deep(ul),
:deep(.prose) :deep(ol) {
  padding-left: 1.5rem !important; /* 24px */
  margin-left: 0 !important;
  list-style-position: outside !important;
  list-style-type: disc !important;
}

:deep(.prose) :deep(ul ul),
:deep(.prose) :deep(ol ol),
:deep(.prose) :deep(ul ol),
:deep(.prose) :deep(ol ul) {
  padding-left: 1.25rem !important; /* nested indent */
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  color: rgb(17 24 39) !important; /* text-gray-900 */
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
}

.prose :deep(h1) {
  font-size: 1.4375rem !important; /* 23px - Minor Second ratio base */
  line-height: 1.8rem !important;
  margin-top: 2rem !important;
  margin-bottom: 1rem !important;
}

.prose :deep(h2) {
  font-size: 1.347rem !important; /* ~21.5px - Minor Second ratio */
  line-height: 1.7rem !important;
  margin-top: 1.5rem !important;
  margin-bottom: 0.75rem !important;
}

.prose :deep(h3) {
  font-size: 1.263rem !important; /* ~20.2px - Minor Second ratio */
  line-height: 1.6rem !important;
  margin-top: 1.25rem !important;
  margin-bottom: 0.5rem !important;
}

.prose :deep(h4) {
  font-size: 1.183rem !important; /* ~18.9px - Minor Second ratio */
  line-height: 1.5rem !important;
  margin-top: 1rem !important;
  margin-bottom: 0.5rem !important;
}

.prose :deep(h5) {
  font-size: 1.110rem !important; /* ~17.8px - Minor Second ratio */
  line-height: 1.4rem !important;
  margin-top: 1rem !important;
  margin-bottom: 0.25rem !important;
}

.prose :deep(h6) {
  font-size: 1.040rem !important; /* ~16.6px - Minor Second ratio */
  line-height: 1.3rem !important;
  margin-top: 0.75rem !important;
  margin-bottom: 0.25rem !important;
}

.prose :deep(strong),
.prose :deep(b) {
  color: rgb(17 24 39) !important; /* text-gray-900 */
  font-weight: 600;
}

.prose :deep(em),
.prose :deep(i) {
  color: rgb(31 41 55) !important; /* text-gray-800 */
}

/* Light mode code styling */
.prose :deep(code) {
  color: rgb(194 65 12) !important; /* orange-700 */
  background-color: rgb(248 250 252) !important; /* slate-50 */
  padding: 0.125rem 0.375rem !important;
  border-radius: 0.25rem !important;
  font-size: 0.875em !important;
  font-weight: 500 !important;
  border: 1px solid rgb(226 232 240) !important; /* slate-200 */
}

.prose :deep(pre) {
  background-color: rgb(248 250 252) !important; /* slate-50 */
  border: 1px solid rgb(226 232 240) !important; /* slate-200 */
  border-radius: 0.5rem !important;
  padding: 1rem !important;
  overflow-x: auto !important;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
  position: relative !important;
}

.prose :deep(pre):hover .copy-button {
  opacity: 1 !important;
}

.prose :deep(pre .copy-button) {
  position: absolute !important;
  top: 0.75rem !important;
  right: 0.75rem !important;
  background-color: rgb(255 255 255) !important; /* white */
  border: 1px solid rgb(203 213 225) !important; /* slate-300 */
  color: rgb(100 116 139) !important; /* slate-500 */
  padding: 0.375rem !important;
  border-radius: 0.25rem !important;
  opacity: 0 !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
  font-size: 0.75rem !important;
  font-family: ui-sans-serif, system-ui, sans-serif !important;
}

.prose :deep(pre .copy-button:hover) {
  background-color: rgb(248 250 252) !important; /* slate-50 */
  color: rgb(51 65 85) !important; /* slate-700 */
}

.prose :deep(pre .copy-button[data-copied="true"]) {
  background-color: rgb(34 197 94) !important; /* green-500 */
  color: rgb(255 255 255) !important; /* white */
  border-color: rgb(34 197 94) !important; /* green-500 */
}

.prose :deep(pre code) {
  color: rgb(51 65 85) !important; /* slate-700 */
  background-color: transparent !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  font-size: 0.875rem !important;
  line-height: 1.7 !important;
}

/* Tooltip styling for footnote previews */
.footnote-tooltip {
  pointer-events: none;
  transition: opacity 0.2s ease;
  opacity: 0;
  will-change: opacity;
}

.footnote-ref {
  position: relative;
  cursor: pointer;
}

.footnote-ref:hover .footnote-tooltip {
  opacity: 1;
}
</style>

<style scoped>
/* Interactive components global padding utility */
:deep(.interactive-component) {
  padding-top: 1.5rem; /* 24px */
  padding-bottom: 1.5rem; /* 24px */
}
</style>