<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm" style="color-scheme: light;">
    <div class="space-y-4">
      <!-- Title -->
      <div>
        <span class="text-sm text-slate-600">
          Place a point on the graph, choose its label, and check if it's classified correctly using the formula <KaTeX expression="y(\vec{w}\cdot\vec{x})" />.
        </span>
      </div>

      <!-- Main layout: Graph on left, controls on right -->
      <div class="flex flex-col lg:flex-row gap-4 lg:items-start">
        <!-- Graph section -->
        <div class="flex-grow">
          <svg
            :viewBox="`0 0 ${plotSize} ${plotSize}`"
            :width="plotSize"
            :height="plotSize"
            class="w-full max-w-md border-2 border-slate-300 rounded bg-white cursor-crosshair"
            @click="handleCanvasClick"
          >
            <!-- Grid -->
            <defs>
              <pattern id="grid" :width="20" :height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Axes -->
            <line :x1="plotSize/2" :y1="0" :x2="plotSize/2" :y2="plotSize" stroke="#d1d5db" stroke-width="1.5" />
            <line :x1="0" :y1="plotSize/2" :x2="plotSize" :y2="plotSize/2" stroke="#d1d5db" stroke-width="1.5" />

            <!-- Origin label -->
            <text :x="plotSize/2 + 8" :y="plotSize/2 - 8" class="text-xs fill-slate-400">0</text>

            <!-- Weight vector (fixed) -->
            <line
              :x1="plotSize/2"
              :y1="plotSize/2"
              :x2="plotSize/2 + 80"
              :y2="plotSize/2 - 80"
              stroke="#3b82f6"
              stroke-width="3"
            />
            <!-- Arrow head for weight vector -->
            <polygon
              :points="`${plotSize/2 + 80},${plotSize/2 - 80} ${plotSize/2 + 70},${plotSize/2 - 68} ${plotSize/2 + 68},${plotSize/2 - 70}`"
              fill="#3b82f6"
            />
            <text :x="plotSize/2 + 85" :y="plotSize/2 - 85" class="text-xs font-semibold fill-blue-600">w⃗</text>

            <!-- Decision boundary (perpendicular to weight vector) -->
            <line
              :x1="plotSize/2 - 70"
              :y1="plotSize/2 - 70"
              :x2="plotSize/2 + 70"
              :y2="plotSize/2 + 70"
              stroke="#ef4444"
              stroke-width="2"
              stroke-dasharray="5,5"
              opacity="0.5"
            />

            <!-- Placed point -->
            <g v-if="placedPoint">
              <circle
                :cx="placedPoint.x"
                :cy="placedPoint.y"
                r="8"
                :fill="placedPoint.label === 1 ? '#ef4444' : '#0ea5a4'"
                stroke="white"
                stroke-width="2"
              />
              <!-- Label on point -->
              <text
                :x="placedPoint.x"
                :y="placedPoint.y + 4"
                class="text-xs font-bold fill-white text-center"
                text-anchor="middle"
              >
                {{ placedPoint.label === 1 ? '+' : '−' }}
              </text>
            </g>
          </svg>

          <!-- Graph instructions -->
          <span class="text-xs text-slate-500 mt-2">Click on the graph to place a point</span>
        </div>

        <!-- Controls panel -->
        <div class="w-full lg:w-64 space-y-4">
          <!-- Label selector -->
          <div class="border rounded-lg p-4 bg-slate-50">
            <div class="text-sm font-semibold text-slate-800 mb-3">Point Label (y)</div>
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  :checked="selectedLabel === 1"
                  @change="selectedLabel = 1"
                  class="w-4 h-4"
                />
                <span class="text-sm text-slate-700">
                  <span class="font-semibold text-red-600">+1</span> (Take the bus)
                </span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  :checked="selectedLabel === -1"
                  @change="selectedLabel = -1"
                  class="w-4 h-4"
                />
                <span class="text-sm text-slate-700">
                  <span class="font-semibold text-teal-600">−1</span> (Don't take the bus)
                </span>
              </label>
            </div>
          </div>

          <!-- Point status -->
          <div v-if="placedPoint" class="border rounded-lg p-4 bg-slate-50">
            <div class="text-sm font-semibold text-slate-800 mb-2">Point Placed</div>
            <div class="text-xs text-slate-600 space-y-1">
              <div>Position: ({{ ((placedPoint.x - plotSize/2)/80).toFixed(3) }}, {{ ((placSize/2 - placedPoint.y)/80).toFixed(3) }})</div>
              <div>Label: <span :class="placedPoint.label === 1 ? 'text-red-600 font-semibold' : 'text-teal-600 font-semibold'">{{ placedPoint.label === 1 ? '+1' : '−1' }}</span></div>
            </div>
          </div>

          <!-- Check button -->
          <button
            v-if="placedPoint"
            @click="showResult ? resetPoint() : checkClassification()"
            :class="[
              'w-full py-3 rounded font-semibold text-sm transition-colors',
              showResult
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            ]"
          >
            {{ showResult ? 'Reset to Check Again' : 'Check Classification' }}
          </button>
        </div>
      </div>

      <!-- Result visualization - Full width below -->
      <div v-if="showResult && classificationResult" class="border-2 rounded-lg p-6 mt-6 bg-slate-50">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <!-- Dot product step -->
          <div class="p-4 bg-white rounded-lg border border-slate-200">
            <div class="text-sm font-semibold text-slate-800 mb-2">Step 1: Dot Product</div>
            <div class="text-lg text-slate-700 font-mono font-bold mb-2"><KaTeX expression="\vec{w}\cdot\vec{x}" /> = <span class="text-blue-600">{{ classificationResult.dotProduct.toFixed(2) }}</span></div>
            <div class="text-xs text-slate-600">
              {{ classificationResult.dotProduct > 0 ? 'Positive: point in positive half' : 'Negative: point in negative half' }}
            </div>
          </div>

          <!-- Multiply step -->
          <div class="p-4 bg-white rounded-lg border border-slate-200">
            <div class="text-sm font-semibold text-slate-800 mb-2">Step 2: Multiply by Label</div>
            <div class="text-xs text-slate-600 mb-2">
              <KaTeX expression="y(\vec{w}\cdot\vec{x})" /> = {{ classificationResult.label === 1 ? '(+1)' : '(−1)' }} <KaTeX expression="\times" /> {{ classificationResult.dotProduct.toFixed(2) }}
            </div>
            <span class="text-lg text-slate-700 font-mono font-bold" :class="classificationResult.product > 0 ? 'text-green-600' : 'text-red-600'">
              = {{ classificationResult.product.toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Verdict - Full width below steps -->
        <div class="mt-6 p-4 bg-white rounded-lg border-2 border-slate-200">
          <div class="flex items-center justify-center gap-2" :class="classificationResult.isCorrect ? 'text-green-800' : 'text-red-800'">
            <!-- Checkmark for correct -->
            <svg v-if="classificationResult.isCorrect" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 flex-shrink-0 text-green-700">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
            <!-- Warning icon for incorrect -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 flex-shrink-0 text-red-700">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span class="text-sm">
              {{ classificationResult.isCorrect
                ? 'Product is positive. Label and dot product agree!'
                : 'Product is negative. Label and dot product disagree!' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import KaTeX from '../KaTeX.vue'

const plotSize = 300
const placSize = plotSize // typo helper for template

interface Point {
  x: number
  y: number
  label: 1 | -1
}

interface ClassificationResult {
  label: 1 | -1
  dotProduct: number
  product: number
  isCorrect: boolean
}

// Fixed weight vector (pointing northeast at 45 degrees)
const weightVector = { x: 1, y: 1 }

const selectedLabel = ref<1 | -1>(1)
const placedPoint = ref<Point | null>(null)
const showResult = ref(false)
const classificationResult = ref<ClassificationResult | null>(null)

// ...existing code...

// Calculate dot product between weight vector and point
function calculateDotProduct(pointX: number, pointY: number): number {
  // Normalize point coordinates relative to center
  const x = pointX - plotSize / 2
  const y = plotSize / 2 - pointY // Flip Y because SVG grows downward

  // Scale to normalized space (map pixel distances to data space)
  const normalizedX = x / 80 // 80px represents ~1.0 in data space
  const normalizedY = y / 80

  // Dot product: w · p = wx*px + wy*py
  return weightVector.x * normalizedX + weightVector.y * normalizedY
}

function handleCanvasClick(event: MouseEvent) {
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  
  // Get click position relative to the browser viewport
  const clientX = event.clientX - rect.left
  const clientY = event.clientY - rect.top
  
  // Map from screen coordinates to SVG viewBox coordinates
  const svgX = (clientX / rect.width) * plotSize
  const svgY = (clientY / rect.height) * plotSize

  placedPoint.value = {
    x: svgX,
    y: svgY,
    label: selectedLabel.value,
  }
  showResult.value = false
  classificationResult.value = null
}

function checkClassification() {
  if (!placedPoint.value) return

  const dotProduct = calculateDotProduct(placedPoint.value.x, placedPoint.value.y)
  const product = placedPoint.value.label * dotProduct
  const isCorrect = product > 0

  classificationResult.value = {
    label: placedPoint.value.label,
    dotProduct,
    product,
    isCorrect,
  }

  showResult.value = true
}

function resetPoint() {
  placedPoint.value = null
  showResult.value = false
  classificationResult.value = null
}
</script>

<style scoped>
:root {
  color-scheme: light;
}

svg {
  touch-action: manipulation;
}

text {
  font-family: inherit;
  pointer-events: none;
  user-select: none;
}

input[type='radio'] {
  accent-color: #3b82f6;
}

/* Force all text to be dark */
:deep(.text-slate-600) { color: #475569 !important; }
:deep(.text-slate-800) { color: #1e293b !important; }
:deep(.text-slate-700) { color: #334155 !important; }
:deep(.text-slate-500) { color: #64748b !important; }
:deep(.text-slate-400) { color: #94a3b8 !important; }
:deep(.text-red-600) { color: #dc2626 !important; }
:deep(.text-teal-600) { color: #0d9488 !important; }
:deep(.text-blue-600) { color: #2563eb !important; }
:deep(.text-green-600) { color: #16a34a !important; }
:deep(.text-green-900) { color: #14532d !important; }
:deep(.text-green-800) { color: #166534 !important; }
:deep(.text-red-900) { color: #7f1d1d !important; }
:deep(.text-red-800) { color: #991b1b !important; }
:deep(.text-white) { color: #ffffff !important; }
</style>
