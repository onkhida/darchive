<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <div class="flex gap-4 flex-col md:flex-row md:items-stretch">
      <!-- SVG Visualization -->
      <div class="flex-1 flex">
        <svg
          :viewBox="`0 0 ${width} ${height}`"
          :width="width"
          :height="height"
          class="w-full h-[400px] md:h-full border rounded bg-slate-50"
          style="touch-action: manipulation;"
        >
          <defs>
            <marker id="wv-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L6,3 L0,6 L1.5,3 z" fill="#111827" />
            </marker>
          </defs>

          <!-- axes -->
          <line :x1="0" :y1="cy" :x2="width" :y2="cy" stroke="#e5e7eb" stroke-width="1" />
          <line :x1="cx" :y1="0" :x2="cx" :y2="height" stroke="#e5e7eb" stroke-width="1" />

          <!-- axis labels -->
          <text :x="width - 20" :y="cy - 8" class="text-xs fill-slate-500" style="color: #64748b">x₁</text>
          <text :x="cx + 8" :y="20" class="text-xs fill-slate-500" style="color: #64748b">x₂</text>

          <!-- decision boundary (orthogonal line to weight vector) -->
          <line
            v-if="boundaryVisible"
            :x1="boundaryX1"
            :y1="boundaryY1"
            :x2="boundaryX2"
            :y2="boundaryY2"
            stroke="#fbbf24"
            stroke-width="2.5"
            stroke-dasharray="6 4"
            opacity="0.8"
          />

          <!-- weight vector -->
          <line
            :x1="cx"
            :y1="cy"
            :x2="wx"
            :y2="wy"
            stroke="#111827"
            stroke-width="3"
            marker-end="url(#wv-arrow)"
          />

          <!-- weight vector tip (circle) -->
          <circle :cx="wx" :cy="wy" r="6" fill="#111827" stroke="#fff" stroke-width="1" />
        </svg>
      </div>

      <!-- Control Panel -->
      <div class="w-full md:w-80 flex flex-col space-y-3">
        <!-- w0 (bias) slider -->
        <div class="p-3 bg-slate-50 rounded">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-medium text-slate-700">w₀ (bias)</label>
            <span class="text-xs font-mono bg-white px-2 py-1 rounded text-slate-700">{{ w0.toFixed(2) }}</span>
          </div>
          <input
            v-model.number="w0"
            type="range"
            min="-2"
            max="2"
            step="0.05"
            class="w-full accent-slate-700"
          />
          <span class="text-xs text-slate-500 mt-1 text-slate-600">Bias: shifts the decision boundary. The equation is w₀ + w₁x + w₂y = 0</span>
        </div>

        <!-- w1 slider -->
        <div class="p-3 bg-slate-50 rounded">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-medium text-slate-700">w₁ (x-component)</label>
            <span class="text-xs font-mono bg-white px-2 py-1 rounded text-slate-700">{{ w1.toFixed(2) }}</span>
          </div>
          <input
            v-model.number="w1"
            type="range"
            min="-2"
            max="2"
            step="0.05"
            class="w-full accent-slate-700"
          />
          <span class="text-xs text-slate-500 mt-1 text-slate-600">Rotates the vector horizontally</span>
        </div>

        <!-- w2 slider -->
        <div class="p-3 bg-slate-50 rounded">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-medium text-slate-700">w₂ (y-component)</label>
            <span class="text-xs font-mono bg-white px-2 py-1 rounded text-slate-700">{{ w2.toFixed(2) }}</span>
          </div>
          <input
            v-model.number="w2"
            type="range"
            min="-2"
            max="2"
            step="0.05"
            class="w-full accent-slate-700"
          />
          <span class="text-xs text-slate-700 mt-1 text-slate-600">Rotates the vector vertically</span>
        </div>

        <!-- Weight vector info -->
        <div class="p-3 bg-slate-50 rounded border border-slate-200">
          <div class="text-xs font-medium text-slate-700 mb-2">Weight Vector</div>
          <div class="text-sm text-slate-600 font-mono space-y-1">
            <div class="text-slate-600">w = ({{ w1.toFixed(2) }}, {{ w2.toFixed(2) }})</div>
            <div class="text-slate-600">|w| = {{ magnitude.toFixed(2) }}</div>
            <div v-if="Math.abs(w0) > 0.05" class="text-red-600">bias = {{ w0.toFixed(2) }}</div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="p-3 bg-blue-50 rounded border border-blue-200">
          <p class="text-xs text-blue-900 leading-relaxed">
            <span class="text-slate-900">Try this: Keep w₀ at 0 and adjust w₁ and w₂. Notice how the boundary rotates. 
            Now set w₁=0, w₂=1, and increase w₀. The boundary slides perpendicular to the vector without rotating.</span>
          </p>
        </div>

        <!-- Reset Button -->
        <button
          @click="resetWeights"
          class="px-3 py-2 bg-slate-800 text-white text-sm rounded hover:bg-slate-700 transition-colors"
        >
          Reset to (1, 1)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const width = 560
const height = 400
const cx = width / 2
const cy = height / 2
const scale = Math.min(width, height) / 2 - 40

// Sliders
const w0 = ref(0)    // bias
const w1 = ref(1)    // x-component
const w2 = ref(1)    // y-component

// Computed weight vector endpoint
const wx = computed(() => cx + w1.value * scale)
const wy = computed(() => cy - w2.value * scale) // negate because SVG y grows down

// Magnitude of weight vector
const magnitude = computed(() => Math.sqrt(w1.value ** 2 + w2.value ** 2) || 1)

// Decision boundary: w0 + w1*x + w2*y = 0
// Solve for boundary line endpoints using the direct equation
const boundaryPoints = computed(() => {
  const w1Val = w1.value
  const w2Val = w2.value
  const w0Val = w0.value
  
  // Convert screen coordinates to model coordinates
  const screenToModelX = (sx: number) => (sx - cx) / scale
  const modelToScreenX = (mx: number) => cx + mx * scale
  const modelToScreenY = (my: number) => cy - my * scale // negate because SVG y grows down
  
  // Threshold to detect near-vertical or near-horizontal lines
  const threshold = 0.05
  let x1, y1, x2, y2
  
  if (Math.abs(w2Val) > threshold) {
    // Line is not horizontal: y = -(w0 + w1*x) / w2
    // Use left and right edges of screen
    const leftX = screenToModelX(0)
    const rightX = screenToModelX(width)
    
    const leftY = -(w0Val + w1Val * leftX) / w2Val
    const rightY = -(w0Val + w1Val * rightX) / w2Val
    
    x1 = modelToScreenX(leftX)
    y1 = modelToScreenY(leftY)
    x2 = modelToScreenX(rightX)
    y2 = modelToScreenY(rightY)
  } else if (Math.abs(w1Val) > threshold) {
    // Line is vertical: x = -w0 / w1
    const boundaryX = -w0Val / w1Val
    const screenX = modelToScreenX(boundaryX)
    
    x1 = screenX
    y1 = 0
    x2 = screenX
    y2 = height
  } else {
    // Both w1 and w2 near zero, no clear boundary
    return null
  }
  
  return { x1, y1, x2, y2 }
})

// Only show boundary if weight vector is not near zero
const boundaryVisible = computed(() => magnitude.value > 0.1 && boundaryPoints.value !== null)

// Boundary endpoints with fallback
const boundaryX1 = computed(() => boundaryPoints.value?.x1 ?? 0)
const boundaryY1 = computed(() => boundaryPoints.value?.y1 ?? 0)
const boundaryX2 = computed(() => boundaryPoints.value?.x2 ?? 0)
const boundaryY2 = computed(() => boundaryPoints.value?.y2 ?? 0)

const resetWeights = () => {
  w0.value = 0
  w1.value = 1
  w2.value = 1
}
</script>

<style scoped>
input[type="range"] {
  cursor: pointer;
}

svg {
  touch-action: none;
}
</style>
