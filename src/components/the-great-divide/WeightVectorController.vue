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

          <!-- bias offset visualization (small indicator) -->
          <g v-if="Math.abs(w0) > 0.05">
            <circle :cx="biasIndicatorX" :cy="biasIndicatorY" r="4" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.6" />
            <text :x="biasIndicatorX + 10" :y="biasIndicatorY - 5" class="text-xs fill-red-500" opacity="0.7">bias offset</text>
          </g>
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
          <span class="text-xs text-slate-500 mt-1 text-slate-600">Bias: shifts the decision boundary along the weight vector direction</span>
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

// Unit vector for the weight direction (in model space: w1 right, w2 up)
const ux = computed(() => w1.value / magnitude.value)
const uy = computed(() => w2.value / magnitude.value)

// Decision boundary: orthogonal line through a point offset by bias
// The boundary passes through: center + w0 * (scale) * unit_vector (in screen coords)
const biasOffsetX = computed(() => cx + w0.value * scale * ux.value)
const biasOffsetY = computed(() => cy - w0.value * scale * uy.value) // negate because SVG y grows down

// Perpendicular direction in SCREEN SPACE
// If weight is (ux, -uy) in screen space, perpendicular is (uy, ux)
// This gives us a 90° counterclockwise rotation
const perpX = computed(() => uy.value)
const perpY = computed(() => ux.value)

// Boundary line endpoints (extended far off screen)
const boundaryLen = Math.max(width, height) * 1.2
const boundaryX1 = computed(() => biasOffsetX.value + perpX.value * boundaryLen)
const boundaryY1 = computed(() => biasOffsetY.value + perpY.value * boundaryLen)
const boundaryX2 = computed(() => biasOffsetX.value - perpX.value * boundaryLen)
const boundaryY2 = computed(() => biasOffsetY.value - perpY.value * boundaryLen)

// Only show boundary if weight vector is not near zero
const boundaryVisible = computed(() => magnitude.value > 0.1)

// Bias indicator position (small circle on the weight vector at offset w0)
const biasIndicatorX = computed(() => biasOffsetX.value)
const biasIndicatorY = computed(() => biasOffsetY.value)

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
