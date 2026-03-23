<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <div class="space-y-6">
      <!-- Controls Section -->
      <div class="flex flex-col gap-4">
        <!-- Play/Pause and Speed Controls -->
        <div class="flex items-center gap-4 flex-wrap">
          <button
            @click="togglePlayPause"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors"
          >
            {{ isPlaying ? 'Pause' : 'Play' }}
          </button>

          <button
            @click="reset"
            class="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded font-medium transition-colors"
          >
            Reset
          </button>

          <div class="flex items-center gap-2">
            <label class="text-sm text-slate-600">Speed:</label>
            <select
              v-model.number="speedMultiplier"
              class="px-2 py-1 border border-slate-300 rounded text-sm"
            >
              <option value="0.5">Slow (0.5x)</option>
              <option value="1">Normal (1x)</option>
              <option value="2">Fast (2x)</option>
              <option value="4">Very Fast (4x)</option>
            </select>
          </div>

          <!-- Iteration Counter -->
          <div class="text-sm text-slate-600 ml-auto">
            <span class="font-semibold">{{ currentIterationIndex + 1 }}</span> / {{ totalIterations }}
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-slate-200 rounded-full h-2">
          <div
            class="bg-blue-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(currentIterationIndex / Math.max(totalIterations - 1, 1)) * 100}%` }"
          ></div>
        </div>

        <!-- Status Message -->
        <div v-if="convergenceResult" class="p-3 rounded" :class="convergenceResult.converged ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'">
          <div class="text-sm font-semibold" :class="convergenceResult.converged ? 'text-green-700' : 'text-amber-700'">
            {{ convergenceResult.converged ? 'Converged!' : 'Training...' }}
          </div>
          <div class="text-xs" :class="convergenceResult.converged ? 'text-green-600' : 'text-amber-600'">
            {{ convergenceResult.converged ? `Found solution in ${convergenceResult.epochsNeeded} epoch(s)` : 'Finding optimal decision boundary...' }}
          </div>
        </div>
      </div>

      <!-- Main Visualization and Sidebar -->
      <div class="flex flex-col lg:flex-row gap-6 min-h-[500px]">
        <!-- Graph Section -->
        <div class="flex-grow flex flex-col">
          <svg
            :viewBox="`0 0 ${width} ${height}`"
            :width="width"
            :height="height"
            class="w-full aspect-square border-2 border-slate-300 rounded bg-slate-50"
          >
            <!-- Grid background -->
            <defs>
              <pattern id="grid" :width="gridSize" :height="gridSize" patternUnits="userSpaceOnUse">
                <path :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`" fill="none" stroke="#e5e7eb" stroke-width="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Axes -->
            <line :x1="axisOriginX" :y1="0" :x2="axisOriginX" :y2="height" stroke="#d1d5db" stroke-width="1.5" />
            <line :x1="0" :y1="axisOriginY" :x2="width" :y2="axisOriginY" stroke="#d1d5db" stroke-width="1.5" />
            <text :x="axisOriginX + 8" :y="axisOriginY - 8" class="text-xs fill-slate-500">0.0</text>

            <!-- Decision Boundary (animates smoothly) -->
            <line
              v-if="boundaryPoints"
              :x1="boundaryPoints.x1"
              :y1="boundaryPoints.y1"
              :x2="boundaryPoints.x2"
              :y2="boundaryPoints.y2"
              stroke="#ef4444"
              stroke-width="2"
              stroke-dasharray="5,5"
              opacity="0.7"
              class="transition-all duration-500"
            />

            <!-- Weight Vector (arrow from origin) -->
            <line
              :x1="originX"
              :y1="originY"
              :x2="weightVectorEnd.x"
              :y2="weightVectorEnd.y"
              stroke="#3b82f6"
              stroke-width="2.5"
              class="transition-all duration-500"
            />
            <!-- Arrow head -->
            <polygon
              :points="arrowHeadPoints"
              fill="#3b82f6"
              class="transition-all duration-500"
            />

            <!-- Data points -->
            <g v-for="point in computedDataPoints" :key="`point-${point.day}`">
              <circle
                :cx="point.screenX"
                :cy="point.screenY"
                r="6"
                :fill="point.decision === 1 ? '#ef4444' : '#0ea5a4'"
                stroke="#fff"
                stroke-width="1.5"
                class="cursor-pointer transition-all duration-300"
                :class="point.day === currentPoint?.day ? 'opacity-100 filter drop-shadow-lg' : 'opacity-75'"
                @mouseenter="hoveredDay = point.day"
                @mouseleave="hoveredDay = null"
              />
            </g>

            <!-- Highlight current point being checked -->
            <g v-if="currentPoint">
              <circle
                :cx="currentPoint.screenX"
                :cy="currentPoint.screenY"
                r="12"
                fill="none"
                stroke="#fbbf24"
                stroke-width="2"
                stroke-dasharray="3,3"
                class="animate-pulse"
              />
            </g>

            <!-- Tooltip -->
            <g v-if="hoveredDay">
              <rect
                :x="tooltipX + 10"
                :y="tooltipY - 20"
                width="60"
                height="18"
                fill="white"
                stroke="#9ca3af"
                stroke-width="1"
                rx="4"
              />
              <text
                :x="tooltipX + 15"
                :y="tooltipY - 6"
                class="text-xs font-semibold fill-slate-700"
              >
                {{ hoveredDay }}
              </text>
            </g>
          </svg>

          <!-- Legend -->
          <div class="flex gap-6 justify-center mt-4 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-red-500"></div>
              <span class="text-slate-600">BRT (+1)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-teal-500"></div>
              <span class="text-slate-600">Danfo (−1)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-1 h-1 rounded-full bg-blue-500 mx-1"></div>
              <span class="text-slate-600">Weight Vector</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 border-t-2 border-dashed border-red-500"></div>
              <span class="text-slate-600">Decision Boundary</span>
            </div>
          </div>
        </div>

        <!-- Boundary Diaries Sidebar -->
        <div class="w-full lg:w-80 flex flex-col border-l border-slate-200 pl-6">
          <div class="text-sm font-bold text-slate-700 mb-4">Boundary Diaries</div>

          <!-- Current Info Box -->
          <div v-if="currentIteration" class="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div class="text-xs font-semibold text-blue-700 mb-2">Current Step</div>
            <div class="text-xs text-blue-600 space-y-1">
              <div><span class="font-medium">Day:</span> {{ currentIteration.pointDay }}</div>
              <div><span class="font-medium">Epoch:</span> {{ currentIteration.epoch }}</div>
              <div><span class="font-medium">Dot Product:</span> {{ currentIteration.dotProduct.toFixed(3) }}</div>
              <div v-if="!currentIteration.isCorrect" class="text-red-600 font-semibold">Misclassified - Updating...</div>
              <div v-else class="text-green-600 font-semibold">Correctly Classified</div>
            </div>
          </div>

          <!-- Weight Info -->
          <div v-if="currentWeights" class="mb-4 p-3 bg-slate-50 rounded">
            <div class="text-xs font-semibold text-slate-700 mb-2">Current Weights</div>
            <div class="text-xs text-slate-600 font-mono space-y-1">
              <div>w0 (bias): {{ currentWeights.w0.toFixed(3) }}</div>
              <div>w1 (money): {{ currentWeights.w1.toFixed(3) }}</div>
              <div>w2 (wait): {{ currentWeights.w2.toFixed(3) }}</div>
            </div>
          </div>

          <!-- Log Scroll Area -->
          <div class="flex-1 overflow-y-auto bg-slate-50 rounded p-3 space-y-2 mb-4">
            <div
              v-for="(iteration, idx) in recentIterations"
              :key="idx"
              class="text-xs text-slate-600 p-2 bg-white rounded border-l-2 transition-all"
              :class="idx === recentIterations.length - 1 ? 'border-blue-400 bg-blue-50 font-semibold' : 'border-slate-300'"
            >
              {{ iteration.logMessage }}
            </div>
            <div v-if="recentIterations.length === 0" class="text-xs text-slate-400 italic">
              Waiting to start...
            </div>
          </div>

          <!-- Final Result Box -->
          <div v-if="convergenceResult && convergenceResult.converged" class="p-3 bg-green-50 rounded border border-green-200">
            <div class="text-xs font-semibold text-green-700 mb-2">Solution Found</div>
            <div class="text-xs text-green-600 font-mono space-y-1">
              <div>Epochs: {{ convergenceResult.epochsNeeded }}</div>
              <div>Final w0: {{ convergenceResult.finalWeights.w0.toFixed(3) }}</div>
              <div>Final w1: {{ convergenceResult.finalWeights.w1.toFixed(3) }}</div>
              <div>Final w2: {{ convergenceResult.finalWeights.w2.toFixed(3) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePerceptronTraining, type NormalizedDataPoint, type ConvergenceResult } from '../../composables/usePerceptronTraining'

interface ComputedDataPoint extends NormalizedDataPoint {
  screenX: number
  screenY: number
}

const props = withDefaults(defineProps<{
  width?: number
  height?: number
}>(), {
  width: 560,
  height: 560,
})

const width = props.width
const height = props.height
const gridSize = 40

// Coordinate system (matching GraphPlotComponent)
const modelMin = -1.5
const modelMax = 2.5
const modelSpan = modelMax - modelMin

const originX = computed(() => ((0 - modelMin) / modelSpan) * width)
const originY = computed(() => (modelMax / modelSpan) * height)
const axisOriginX = computed(() => ((0 - modelMin) / modelSpan) * width)
const axisOriginY = computed(() => ((modelMax) / modelSpan) * height)

// Raw data (same as GraphPlotComponent)
const rawDataRaw = [
  { day: 'Mar 1', money: 150, waitTime: 28, decision: -1 as const },
  { day: 'Mar 2', money: 3200, waitTime: 12, decision: 1 as const },
  { day: 'Mar 3', money: 280, waitTime: 32, decision: -1 as const },
  { day: 'Mar 4', money: 4100, waitTime: 10, decision: 1 as const },
  { day: 'Mar 5', money: 320, waitTime: 30, decision: -1 as const },
  { day: 'Mar 8', money: 2500, waitTime: 15, decision: 1 as const },
  { day: 'Mar 9', money: 0, waitTime: 35, decision: -1 as const },
  { day: 'Mar 10', money: 3900, waitTime: 12, decision: 1 as const },
  { day: 'Mar 11', money: 450, waitTime: 26, decision: -1 as const },
  { day: 'Mar 12', money: 5200, waitTime: 9, decision: 1 as const },
  { day: 'Mar 15', money: 75, waitTime: 31, decision: -1 as const },
  { day: 'Mar 16', money: 4800, waitTime: 11, decision: 1 as const },
  { day: 'Mar 17', money: 180, waitTime: 33, decision: -1 as const },
  { day: 'Mar 18', money: 2800, waitTime: 14, decision: 1 as const },
  { day: 'Mar 19', money: 520, waitTime: 29, decision: -1 as const },
  { day: 'Mar 22', money: 3500, waitTime: 13, decision: 1 as const },
  { day: 'Mar 23', money: 400, waitTime: 27, decision: -1 as const },
  { day: 'Mar 24', money: 5600, waitTime: 8, decision: 1 as const },
  { day: 'Mar 25', money: 1200, waitTime: 22, decision: -1 as const },
  { day: 'Mar 26', money: 4200, waitTime: 11, decision: 1 as const },
  { day: 'Mar 29', money: 1800, waitTime: 19, decision: 1 as const },
  { day: 'Mar 30', money: 6000, waitTime: 9, decision: 1 as const },
]

// State
const isPlaying = ref(false)
const speedMultiplier = ref(1)
const currentIterationIndex = ref(0)
const hoveredDay = ref<string | null>(null)
const convergenceResult = ref<ConvergenceResult | null>(null)

// Compute normalized data points
const moneyStats = computed(() => {
  const values = rawDataRaw.map(p => p.money)
  return { min: Math.min(...values), max: Math.max(...values) }
})

const waitStats = computed(() => {
  const values = rawDataRaw.map(p => p.waitTime)
  return { min: Math.min(...values), max: Math.max(...values) }
})

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0
  return (value - min) / (max - min)
}

function modelToScreenX(modelValue: number): number {
  return ((modelValue - modelMin) / modelSpan) * width
}

function modelToScreenY(modelValue: number): number {
  return ((modelValue) / modelSpan) * height
}

const computedDataPoints = computed((): ComputedDataPoint[] => {
  const money = moneyStats.value
  const wait = waitStats.value

  return rawDataRaw.map(point => {
    const normalizedMoney = normalize(point.money, money.min, money.max)
    const normalizedWaitTime = normalize(point.waitTime, wait.min, wait.max)

    return {
      ...point,
      normalizedMoney,
      normalizedWaitTime,
      screenX: modelToScreenX(normalizedMoney),
      screenY: modelToScreenY(modelMax - normalizedWaitTime),
    }
  })
})

// Update raw data with normalized values (data is now computed)

// Train the perceptron
const { trainPerceptron } = usePerceptronTraining(computedDataPoints.value)

function initializeTraining() {
  convergenceResult.value = trainPerceptron()
  currentIterationIndex.value = 0
}

onMounted(() => {
  // Initialize training but don't start automatically
  convergenceResult.value = trainPerceptron()
  currentIterationIndex.value = 0
})

// Get current iteration
const currentIteration = computed(() => {
  if (!convergenceResult.value) return null
  // Use Math.floor to get the integer index from the animated decimal value
  const index = Math.floor(currentIterationIndex.value)
  return convergenceResult.value.iterations[index] || null
})

const currentPoint = computed(() => {
  const itPoint = currentIteration.value?.point
  if (!itPoint) return null
  // Find the corresponding computed data point with screen coordinates
  return computedDataPoints.value.find(p => p.day === itPoint.day) || null
})

const currentWeights = computed(() => {
  return currentIteration.value?.weightAfter || null
})

// Get recent iterations for the log (last 8)
const recentIterations = computed(() => {
  if (!convergenceResult.value) return []
  const start = Math.max(0, currentIterationIndex.value - 7)
  return convergenceResult.value.iterations.slice(start, currentIterationIndex.value + 1)
})

const totalIterations = computed(() => {
  return convergenceResult.value?.iterations.length || 0
})

// Compute weight vector endpoint for visualization
const weightMagnitude = computed(() => {
  const w = currentWeights.value
  if (!w) return 0
  return Math.sqrt(w.w1 * w.w1 + w.w2 * w.w2)
})

const weightVectorEnd = computed(() => {
  const w = currentWeights.value
  if (!w || weightMagnitude.value === 0) return { x: originX.value, y: originY.value }

  // Normalize the weight vector and scale for visualization
  const unitX = w.w1 / weightMagnitude.value
  const unitY = w.w2 / weightMagnitude.value
  const scale = 120 // Scale for visualization in model space
  
  // Calculate endpoints directly in screen space
  const screenDeltaX = (unitX * scale / modelSpan) * width
  const screenDeltaY = -(unitY * scale / modelSpan) * height // negative because y is inverted in SVG

  return {
    // x: originX.value + screenDeltaX,
    // y: originY.value + screenDeltaY,
    x: modelToScreenX(currentWeights.value.w1),
    y: modelToScreenY(modelMax - currentWeights.value.w2)
  }
})

// Compute arrow head points
const arrowHeadPoints = computed(() => {
  const w = currentWeights.value
  if (!w || weightMagnitude.value === 0) return `${originX.value},${originY.value}`

  const unitX = w.w1 / weightMagnitude.value
  const unitY = w.w2 / weightMagnitude.value
  const scale = 120
  
  // End point
  const screenDeltaX = (unitX * scale / modelSpan) * width
  const screenDeltaY = -(unitY * scale / modelSpan) * height
  const ex = originX.value + screenDeltaX
  const ey = originY.value + screenDeltaY

  // Arrow back (along negative direction)
  const backX = -(unitX * 10 / modelSpan) * width
  const backY = (unitY * 10 / modelSpan) * height // positive because inverted
  
  // Perpendicular for arrow wings
  const perpX = backY * 0.6
  const perpY = backX * 0.6

  return `${ex},${ey} ${ex + backX + perpX},${ey + backY + perpY} ${ex + backX - perpX},${ey + backY - perpY}`
})

// Compute decision boundary
const boundaryPoints = computed(() => {
  const w = currentWeights.value
  if (!w || weightMagnitude.value === 0) return null

  // Decision boundary is perpendicular to weight vector
  const unitX = w.w1 / weightMagnitude.value
  const unitY = w.w2 / weightMagnitude.value

  // Perpendicular direction (rotate 90 degrees)
  const perpX = -unitY
  const perpY = unitX

  // Center point: offset from origin by bias along weight direction
  const biasOffsetX = (unitX * w.w0 / modelSpan) * width
  const biasOffsetY = -(unitY * w.w0 / modelSpan) * height
  
  const centerX = originX.value + biasOffsetX
  const centerY = originY.value + biasOffsetY

  // Extent along perpendicular direction
  const extentScale = 250 // How far the boundary line extends
  const extentX = (perpX * extentScale / modelSpan) * width
  const extentY = -(perpY * extentScale / modelSpan) * height

  return {
    x1: centerX - extentX,
    y1: centerY - extentY,
    x2: centerX + extentX,
    y2: centerY + extentY,
  }
})

// Tooltip
const tooltipX = computed(() => {
  const point = currentPoint.value
  return point ? point.screenX : 0
})

const tooltipY = computed(() => {
  const point = currentPoint.value
  return point ? point.screenY : 0
})

// Animation loop
let animationFrameId: number | null = null

function animate() {
  if (isPlaying.value && convergenceResult.value) {
    currentIterationIndex.value += (speedMultiplier.value * 1) / 60
    if (currentIterationIndex.value >= totalIterations.value) {
      currentIterationIndex.value = totalIterations.value - 1
      isPlaying.value = false
    }
  }
  animationFrameId = requestAnimationFrame(animate)
}

watch(isPlaying, (playing) => {
  if (playing) {
    animationFrameId = requestAnimationFrame(animate)
  } else if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

onMounted(() => {
  initializeTraining()
})

// Cleanup on unmount
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

function togglePlayPause() {
  isPlaying.value = !isPlaying.value
}

function reset() {
  isPlaying.value = false
  currentIterationIndex.value = 0
  initializeTraining()
}
</script>

<style scoped>
svg {
  touch-action: manipulation;
}

text {
  font-family: inherit;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
