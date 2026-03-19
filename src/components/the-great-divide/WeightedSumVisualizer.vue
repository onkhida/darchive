<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main animation area (left/full on mobile, 2 cols on desktop) -->
      <div class="lg:col-span-2 flex flex-col pt-8">
        <!-- Progress bars / Step indicators -->
        <div class="mb-8">
          <div class="flex gap-2 items-center justify-between">
        <!-- Step 1: w₀x₀ -->
        <div class="flex-1">
          <div 
            class="h-1 bg-slate-200 rounded-full overflow-hidden"
            :class="{ 'bg-blue-400': currentStep >= 0 }"
          >
            <div 
              class="h-full bg-blue-500 transition-all duration-500"
              :style="{ width: currentStep > 0 ? '100%' : (currentStep === 0 ? `${stepProgress}%` : '0%') }"
            ></div>
          </div>
          <div class="text-xs text-slate-600 mt-2 text-center font-mono">w₀x₀</div>
        </div>

        <!-- Arrow -->
        <div class="text-slate-400 px-2">+</div>

        <!-- Step 2: w₁x₁ -->
        <div class="flex-1">
          <div 
            class="h-1 bg-slate-200 rounded-full overflow-hidden"
            :class="{ 'bg-emerald-400': currentStep >= 1 }"
          >
            <div 
              class="h-full bg-emerald-500 transition-all duration-500"
              :style="{ width: currentStep > 1 ? '100%' : (currentStep === 1 ? `${stepProgress}%` : '0%') }"
            ></div>
          </div>
          <div class="text-xs text-slate-600 mt-2 text-center font-mono">w₁x₁</div>
        </div>

        <!-- Arrow -->
        <div class="text-slate-400 px-2">+</div>

        <!-- Step 3: w₂x₂ -->
        <div class="flex-1">
          <div 
            class="h-1 bg-slate-200 rounded-full overflow-hidden"
            :class="{ 'bg-amber-400': currentStep >= 2 }"
          >
            <div 
              class="h-full bg-amber-500 transition-all duration-500"
              :style="{ width: currentStep > 2 ? '100%' : (currentStep === 2 ? `${stepProgress}%` : '0%') }"
            ></div>
          </div>
          <div class="text-xs text-slate-600 mt-2 text-center font-mono">w₂x₂</div>
        </div>

        <!-- Arrow -->
        <div class="text-slate-400 px-2">=</div>

        <!-- Result: z -->
        <div class="flex-1">
          <div 
            class="h-1 bg-slate-200 rounded-full overflow-hidden"
            :class="{ 'bg-rose-400': currentStep >= 3 }"
          >
            <div 
              class="h-full bg-rose-500 transition-all duration-500"
              :style="{ width: currentStep > 3 ? '100%' : (currentStep === 3 ? `${stepProgress}%` : '0%') }"
            ></div>
          </div>
          <div class="text-xs mt-2 text-center font-mono font-bold"><span class="text-slate-600">z</span></div>
        </div>
      </div>
    </div>

    <!-- Calculation breakdown -->
    <div class="mb-8 bg-slate-50 rounded-lg p-6 flex-1">
      <div class="space-y-4">
        <!-- Step 0: w₀x₀ -->
        <div 
          class="transition-all duration-300"
          :class="{ 'opacity-100': currentStep >= 0, 'opacity-40': currentStep < 0 }"
        >
          <div class="flex items-baseline gap-3">
            <span class="text-sm font-mono text-blue-600 font-semibold min-w-20">Step 1:</span>
            <span class="text-sm text-slate-700">
              <span class="font-mono text-slate-700">w₀</span> × <span class="font-mono text-slate-700">x₀</span>
              <span v-if="currentStep >= 0" class="ml-3 text-slate-500">=</span>
              <span v-if="currentStep >= 0" class="ml-2 font-mono text-blue-600 font-semibold">{{ values.w0 }} × 1 = {{ values.w0 }}</span>
            </span>
          </div>
          <span v-if="currentStep === 0" class="text-xs text-slate-600 mt-2 pl-24">The bias term, always multiplied by 1</span>
        </div>

        <!-- Step 1: w₁x₁ -->
        <div 
          class="transition-all duration-300 border-t border-slate-200 pt-4"
          :class="{ 'opacity-100': currentStep >= 1, 'opacity-40': currentStep < 1 }"
        >
          <div class="flex items-baseline gap-3">
            <span class="text-sm font-mono text-emerald-600 font-semibold min-w-20">Step 2:</span>
            <span class="text-sm text-slate-700">
              <span class="font-mono text-slate-700">w₁</span> × <span class="font-mono text-slate-700">x₁</span>
              <span v-if="currentStep >= 1" class="ml-3 text-slate-500">=</span>
              <span v-if="currentStep >= 1" class="ml-2 font-mono text-emerald-600 font-semibold">{{ values.w1 }} × {{ values.x1 }} = {{ (values.w1 * values.x1).toFixed(2) }}</span>
            </span>
          </div>
          <span v-if="currentStep === 1" class="text-xs text-slate-600 mt-2 pl-24">First feature weight multiplied by its input value</span>
        </div>

        <!-- Step 2: w₂x₂ -->
        <div 
          class="transition-all duration-300 border-t border-slate-200 pt-4"
          :class="{ 'opacity-100': currentStep >= 2, 'opacity-40': currentStep < 2 }"
        >
          <div class="flex items-baseline gap-3">
            <span class="text-sm font-mono text-amber-600 font-semibold min-w-20">Step 3:</span>
            <span class="text-sm text-slate-700">
              <span class="font-mono text-slate-700">w₂</span> × <span class="font-mono text-slate-700">x₂</span>
              <span v-if="currentStep >= 2" class="ml-3 text-slate-500">=</span>
              <span v-if="currentStep >= 2" class="ml-2 font-mono text-amber-600 font-semibold">{{ values.w2 }} × {{ values.x2 }} = {{ (values.w2 * values.x2).toFixed(2) }}</span>
            </span>
          </div>
          <span v-if="currentStep === 2" class="text-xs text-slate-600 mt-2 pl-24">Second feature weight multiplied by its input value</span>
        </div>

        <!-- Step 3: Final sum -->
        <div 
          class="transition-all duration-300 border-t border-slate-200 pt-4 bg-white rounded-lg p-4"
          :class="{ 'opacity-100': currentStep >= 3, 'opacity-40': currentStep < 3 }"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-mono text-rose-600 font-semibold min-w-20">Result:</span>
            <span v-if="currentStep >= 3" class="text-sm font-mono text-slate-700">
              {{ values.w0 }} + {{ (values.w1 * values.x1).toFixed(2) }} + {{ (values.w2 * values.x2).toFixed(2) }}
              <span class="text-slate-400 mx-2">=</span>
              <span class="text-rose-600 font-bold text-lg">{{ finalZ.toFixed(2) }}</span>
            </span>
            <span v-else class="text-sm text-slate-500">Awaiting calculation...</span>
          </div>
          <span v-if="currentStep === 3" class="text-xs text-slate-600 mt-3">
            This is <span class="font-mono font-semibold text-slate-700">z</span>, the weighted sum (dot product of <span class="font-mono text-slate-700">w</span> and <span class="font-mono text-slate-700">x</span>).
            <span v-if="finalZ > 0" class="text-red-500 font-semibold">Because it is positive, the point falls in the "northern half".</span>
            <span v-else-if="finalZ < 0" class="text-teal-600 font-semibold">Because it is negative, the point falls in the "southern half".</span>
            <span v-else class="text-slate-700 font-semibold">Because it is zero, the point falls on the decision boundary (orthogonal line).</span>
          </span>
        </div>
      </div>
    </div>

        <!-- Controls -->
        <div class="flex gap-4 items-center justify-between flex-wrap mt-auto pt-6">
          <!-- Play/Pause button -->
          <button
            @click="toggleAutoPlay"
            class="px-4 py-2 bg-slate-800 text-white text-sm rounded font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <svg v-if="isPlaying" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.04995 2.74998C6.04995 2.44623 5.80371 2.19998 5.49995 2.19998C5.19619 2.19998 4.94995 2.44623 4.94995 2.74998V12.25C4.94995 12.5537 5.19619 12.8 5.49995 12.8C5.80371 12.8 6.04995 12.5537 6.04995 12.25V2.74998ZM10.05 2.74998C10.05 2.44623 9.80371 2.19998 9.49995 2.19998C9.19619 2.19998 8.94995 2.44623 8.94995 2.74998V12.25C8.94995 12.5537 9.19619 12.8 9.49995 12.8C9.80371 12.8 10.05 12.5537 10.05 12.25V2.74998Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.24182 2.32181C3.3919 2.23132 3.5784 2.22601 3.73338 2.30781L12.7334 7.05781C12.8974 7.14436 13 7.31457 13 7.5C13 7.68543 12.8974 7.85564 12.7334 7.94219L3.73338 12.6922C3.5784 12.774 3.3919 12.7687 3.24182 12.6782C3.09175 12.5877 3 12.4252 3 12.25V2.75C3 2.57476 3.09175 2.4123 3.24182 2.32181ZM4 3.57925V11.4207L11.4288 7.5L4 3.57925Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            <span>{{ isPlaying ? 'Pause' : 'Play' }}</span>
          </button>

          <!-- Reset button -->
          <button
            @click="reset"
            class="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.85355 2.14645C5.04882 2.34171 5.04882 2.65829 4.85355 2.85355L3.70711 4H9C11.4853 4 13.5 6.01472 13.5 8.5C13.5 10.9853 11.4853 13 9 13H5C4.72386 13 4.5 12.7761 4.5 12.5C4.5 12.2239 4.72386 12 5 12H9C10.933 12 12.5 10.433 12.5 8.5C12.5 6.567 10.933 5 9 5H3.70711L4.85355 6.14645C5.04882 6.34171 5.04882 6.65829 4.85355 6.85355C4.65829 7.04882 4.34171 7.04882 4.14645 6.85355L2.14645 4.85355C1.95118 4.65829 1.95118 4.34171 2.14645 4.14645L4.14645 2.14645C4.34171 1.95118 4.65829 1.95118 4.85355 2.14645Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Side pane: Custom values (desktop only) -->
      <div class="hidden lg:flex lg:flex-col py-8 px-4 bg-slate-50 rounded-lg border border-slate-200">
        <div class="space-y-4 flex-1">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-2">w₀ (bias)</label>
            <input
              v-model.number="values.w0"
              type="number"
              step="0.1"
              class="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
              @input="reset"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-2">w₁</label>
            <input
              v-model.number="values.w1"
              type="number"
              step="0.1"
              class="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
              @input="reset"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-2">w₂</label>
            <input
              v-model.number="values.w2"
              type="number"
              step="0.1"
              class="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
              @input="reset"
            />
          </div>
          <div class="border-t border-slate-200 pt-4 grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-2">x₁</label>
              <input
                v-model.number="values.x1"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
                @input="reset"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-2">x₂</label>
              <input
                v-model.number="values.x2"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
                @input="reset"
              />
            </div>
          </div>
        </div>
        <span class="text-xs text-slate-600 mt-auto pt-6">Change any value to reset and recalculate.</span>
      </div>
    </div>

    <!-- Mobile controls/inputs: Show on mobile below animation -->
    <div class="lg:hidden mt-8 pt-6 border-t">
      <details class="mb-6">
        <summary class="text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900">
          Custom Values
        </summary>
        <div class="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-2">w₀ (bias)</label>
            <input
              v-model.number="values.w0"
              type="number"
              step="0.1"
              class="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-700"
              @input="reset"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-2">w₁</label>
            <input
              v-model.number="values.w1"
              type="number"
              step="0.1"
              class="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-700"
              @input="reset"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-2">w₂</label>
            <input
              v-model.number="values.w2"
              type="number"
              step="0.1"
              class="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-700"
              @input="reset"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-2">x₁</label>
            <input
              v-model.number="values.x1"
              type="number"
              step="0.1"
              class="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-700"
              @input="reset"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-2">x₂</label>
            <input
              v-model.number="values.x2"
              type="number"
              step="0.1"
              class="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-700"
              @input="reset"
            />
          </div>
        </div>
      </details>
    </div>
  </div>
</template><script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

// State
const currentStep = ref(0)
const isPlaying = ref(false)
const stepProgress = ref(0)

let animationInterval: number | null = null

// Values
const values = ref({
  w0: 2.5,
  w1: 1.2,
  x1: 0.8,
  w2: -0.5,
  x2: 1.5
})

// Computed
const finalZ = computed(() => {
  return values.value.w0 + values.value.w1 * values.value.x1 + values.value.w2 * values.value.x2
})

// Methods
const toggleAutoPlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startAnimation()
  } else {
    if (animationInterval) clearInterval(animationInterval)
  }
}

const startAnimation = () => {
  // Animation duration for each step (in milliseconds)
  // Adjust this constant to change animation speed:
  const STEP_DURATION = 1200
  
  let progress = 0
  
  animationInterval = window.setInterval(() => {
    progress += (100 / (STEP_DURATION / 50))
    
    if (progress >= 100) {
      progress = 0
      currentStep.value++
      
      if (currentStep.value > 3) {
        currentStep.value = 0
      }
    }
    
    stepProgress.value = Math.min(progress, 100)
  }, 50)
}

const reset = () => {
  currentStep.value = 0
  stepProgress.value = 0
  isPlaying.value = false
  if (animationInterval) clearInterval(animationInterval)
}

onUnmounted(() => {
  if (animationInterval) clearInterval(animationInterval)
})
</script>

<style scoped>
/* Light theme lock */
input[type="range"] {
  cursor: pointer;
}
</style>
