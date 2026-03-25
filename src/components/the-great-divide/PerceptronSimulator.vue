<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <div class="space-y-6">
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

          <!-- Current Weights Display -->
          <div v-if="currentWeights" class="flex items-center gap-4 justify-center mt-4 text-xs bg-slate-50 p-2 rounded border border-slate-200">
            <div class="flex items-center gap-1">
              <label class="font-semibold text-slate-700">w0:</label>
              <input 
                type="text" 
                :value="currentWeights.w0.toFixed(3)" 
                disabled 
                class="w-12 px-1 py-0.5 border border-slate-300 rounded bg-white text-slate-600 text-xs"
              />
            </div>
            <div class="flex items-center gap-1">
              <label class="font-semibold text-slate-700">w1:</label>
              <input 
                type="text" 
                :value="currentWeights.w1.toFixed(3)" 
                disabled 
                class="w-12 px-1 py-0.5 border border-slate-300 rounded bg-white text-slate-600 text-xs"
              />
            </div>
            <div class="flex items-center gap-1">
              <label class="font-semibold text-slate-700">w2:</label>
              <input 
                type="text" 
                :value="currentWeights.w2.toFixed(3)" 
                disabled 
                class="w-12 px-1 py-0.5 border border-slate-300 rounded bg-white text-slate-600 text-xs"
              />
            </div>
          </div>
        </div>

        <!-- Boundary Diaries Sidebar -->
        <div class="w-full lg:w-96 flex flex-col border-l border-slate-200 pl-6 max-h-[600px]">
          <!-- Header -->
          <div class="text-center text-sm font-bold text-slate-700 mb-2">Boundary Diaries</div>

          <!-- Epoch and Navigation -->
          <div class="mb-4 pb-4 border-b border-slate-200">
            <div class="text-xs font-semibold text-slate-600 mb-3 text-center">
              Epoch <span class="text-slate-900">{{ currentIteration?.epoch || '—' }}</span>
            </div>

            <!-- Navigation Controls (Centered) -->
            <div class="flex items-center justify-center gap-1 mb-3">
              <button
                @click="goToFirstEpoch"
                class="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-700 inline-flex items-center justify-center"
                title="Go to beginning (Epoch 1)"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.94976 2.74989C1.94976 2.44613 2.196 2.19989 2.49976 2.19989C2.80351 2.19989 3.04976 2.44613 3.04976 2.74989V7.2825C3.0954 7.18802 3.17046 7.10851 3.26662 7.05776L12.2666 2.30776C12.4216 2.22596 12.6081 2.23127 12.7582 2.32176C12.9083 2.41225 13 2.57471 13 2.74995V12.25C13 12.4252 12.9083 12.5877 12.7582 12.6781C12.6081 12.7686 12.4216 12.7739 12.2666 12.6921L3.26662 7.94214C3.17046 7.89139 3.0954 7.81188 3.04976 7.7174V12.2499C3.04976 12.5536 2.80351 12.7999 2.49976 12.7999C2.196 12.7999 1.94976 12.5536 1.94976 12.2499V2.74989ZM4.57122 7.49995L12 11.4207V3.5792L4.57122 7.49995Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              </button>
              <button
                @click="goToPreviousEpoch"
                class="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-700 inline-flex items-center justify-center"
                title="Previous epoch"
              >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              </button>
              <button
                @click="togglePlayPause"
                class="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-700 inline-flex items-center justify-center"
                :title="isPlaying ? 'Pause' : 'Play'"
              >
                <svg v-if="isPlaying" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.04995 2.74998C6.04995 2.44623 5.80371 2.19998 5.49995 2.19998C5.19619 2.19998 4.94995 2.44623 4.94995 2.74998V12.25C4.94995 12.5537 5.19619 12.8 5.49995 12.8C5.80371 12.8 6.04995 12.5537 6.04995 12.25V2.74998ZM10.05 2.74998C10.05 2.44623 9.80371 2.19998 9.49995 2.19998C9.19619 2.19998 8.94995 2.44623 8.94995 2.74998V12.25C8.94995 12.5537 9.19619 12.8 9.49995 12.8C9.80371 12.8 10.05 12.5537 10.05 12.25V2.74998Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.24182 2.32181C3.3919 2.23132 3.5784 2.22601 3.73338 2.30781L12.7334 7.05781C12.8974 7.14436 13 7.31457 13 7.5C13 7.68543 12.8974 7.85564 12.7334 7.94219L3.73338 12.6922C3.5784 12.774 3.3919 12.7687 3.24182 12.6782C3.09175 12.5877 3 12.4252 3 12.25V2.75C3 2.57476 3.09175 2.4123 3.24182 2.32181ZM4 3.57925V11.4207L11.4288 7.5L4 3.57925Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              </button>
              <button
                @click="goToNextEpoch"
                class="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-700 inline-flex items-center justify-center"
                title="Next epoch"
              >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              </button>
              <button
                @click="goToLastEpoch"
                class="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-700 inline-flex items-center justify-center"
                title="Go to end"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.0502 2.74989C13.0502 2.44613 12.804 2.19989 12.5002 2.19989C12.1965 2.19989 11.9502 2.44613 11.9502 2.74989V7.2825C11.9046 7.18802 11.8295 7.10851 11.7334 7.05776L2.73338 2.30776C2.5784 2.22596 2.3919 2.23127 2.24182 2.32176C2.09175 2.41225 2 2.57471 2 2.74995V12.25C2 12.4252 2.09175 12.5877 2.24182 12.6781C2.3919 12.7686 2.5784 12.7739 2.73338 12.6921L11.7334 7.94214C11.8295 7.89139 11.9046 7.81188 11.9502 7.7174V12.2499C11.9502 12.5536 12.1965 12.7999 12.5002 12.7999C12.804 12.7999 13.0502 12.5536 13.0502 12.2499V2.74989ZM3 11.4207V3.5792L10.4288 7.49995L3 11.4207Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              </button>
            </div>

            <!-- Point Counter (Centered) -->
            <div class="text-xs text-center text-slate-600 font-semibold">
              <span class="text-slate-900">{{ currentPointIndex }}</span> / 22
            </div>
          </div>

          <!-- Log Scroll Area - Filtered by Current Epoch -->
          <div 
            ref="scrollContainer"
            class="flex-1 overflow-y-auto bg-slate-50 rounded p-3 space-y-2 mb-4"
          >
            <div
              v-for="(iteration, idx) in epochFilteredIterations"
              :key="idx"
              class="text-xs text-slate-600 p-2 bg-white rounded border-l-2 transition-all"
              :class="[
                iteration.isCorrect ? 'border-green-400' : 'border-red-400',
                idx === epochFilteredIterations.length - 1 ? 'bg-blue-50 font-semibold' : ''
              ]"
            >
              {{ iteration.logMessage }}
            </div>
            <div v-if="epochFilteredIterations.length === 0" class="text-xs text-slate-400 italic">
              Waiting to start...
            </div>
          </div>

          <!-- Final Result Box -->
          <!-- <div v-if="convergenceResult && convergenceResult.converged" class="p-3 bg-green-50 rounded border border-green-200">
            <div class="text-xs font-semibold text-green-700 mb-2">Solution Found</div>
            <div class="text-xs text-green-600 font-mono space-y-1">
              <div>Epochs: {{ convergenceResult.epochsNeeded }}</div>
              <div>Final w0: {{ convergenceResult.finalWeights.w0.toFixed(3) }}</div>
              <div>Final w1: {{ convergenceResult.finalWeights.w1.toFixed(3) }}</div>
              <div>Final w2: {{ convergenceResult.finalWeights.w2.toFixed(3) }}</div>
            </div>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
const scrollContainer = ref<HTMLElement | null>(null)

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

const currentPointIndex = computed(() => {
  if (!currentIteration.value) return 0
  // For Mar 0 (initial state), show as point 0
  if (currentIteration.value.pointIndex === -1) return 0
  // Otherwise use the actual pointIndex and add 1 for 1-based display
  return currentIteration.value.pointIndex + 1
})

// Get recent iterations for the log (last 8)
const epochFilteredIterations = computed(() => {
  if (!convergenceResult.value || !currentIteration.value) return []
  const currentEpoch = currentIteration.value.epoch
  // Return all iterations from the current epoch up to and including the current iteration
  return convergenceResult.value.iterations.filter(
    it => it.epoch === currentEpoch && 
          convergenceResult.value!.iterations.indexOf(it) <= Math.floor(currentIterationIndex.value)
  )
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
  if (!w) return null
  if (w.w2 === 0) return null

  // Decision boundary: w0 + w1*x + w2*y = 0
  // We need to find where this line intersects the display area
  // The line will extend beyond the [0,1] data space into the display space [-1.5, 2.5]
  
  // Map the display space back to "data-like coordinates" for calculation purposes
  // Display space [-1.5, 2.5] maps back through inverse of modelToScreenX/Y
  // x_data = x_screen * modelSpan / width + modelMin
  // y_data = y_screen * modelSpan / height (and inverted)
  
  // For simplicity, solve the equation in extended space that covers both data and display
  const xMin = -1.5
  const xMax = 2.5
  const yMin = -1.5
  const yMax = 2.5
  
  // Solve for y: y = -(w0 + w1*x) / w2
  const yAtXMin = -(w.w0 + w.w1 * xMin) / w.w2
  const yAtXMax = -(w.w0 + w.w1 * xMax) / w.w2
  
  const isYValid = (y: number) => y >= yMin && y <= yMax
  
  let point1: { x: number; y: number } | null = null
  let point2: { x: number; y: number } | null = null
  
  // Try x boundaries
  if (isYValid(yAtXMin)) {
    point1 = { x: xMin, y: yAtXMin }
  }
  if (isYValid(yAtXMax)) {
    if (!point1) point1 = { x: xMax, y: yAtXMax }
    else point2 = { x: xMax, y: yAtXMax }
  }
  
  // If we need a second point, try y boundaries
  if (!point2 && w.w1 !== 0) {
    // Solve for x: x = -(w0 + w2*y) / w1
    const xAtYMin = -(w.w0 + w.w2 * yMin) / w.w1
    const xAtYMax = -(w.w0 + w.w2 * yMax) / w.w1
    const isXValid = (x: number) => x >= xMin && x <= xMax
    
    if (isXValid(xAtYMin) && (!point1 || (point1 && (point1.x !== xAtYMin || point1.y !== yMin)))) {
      if (!point1) point1 = { x: xAtYMin, y: yMin }
      else point2 = { x: xAtYMin, y: yMin }
    }
    if (isXValid(xAtYMax) && (!point2 && (!point1 || (point1 && (point1.x !== xAtYMax || point1.y !== yMax))))) {
      if (!point1) point1 = { x: xAtYMax, y: yMax }
      else point2 = { x: xAtYMax, y: yMax }
    }
  }
  
  if (!point1 || !point2) return null
  
  // Convert to screen coordinates
  const x1Screen = modelToScreenX(point1.x)
  const y1Screen = modelToScreenY(modelMax - point1.y)
  const x2Screen = modelToScreenX(point2.x)
  const y2Screen = modelToScreenY(modelMax - point2.y)

  return {
    x1: x1Screen,
    y1: y1Screen,
    x2: x2Screen,
    y2: y2Screen,
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

// Epoch Navigation Functions
function goToFirstEpoch() {
  if (!convergenceResult.value) return
  // Go to the first iteration (which is Mar 0)
  currentIterationIndex.value = 0
}

function goToLastEpoch() {
  if (!convergenceResult.value) return
  // Go to the last iteration
  currentIterationIndex.value = totalIterations.value - 1
}

function goToPreviousEpoch() {
  if (!convergenceResult.value || !currentIteration.value) return
  const currentEpoch = currentIteration.value.epoch
  // Find the last iteration of the previous epoch
  const previousEpochIterations = convergenceResult.value.iterations.filter(
    it => it.epoch === currentEpoch - 1
  )
  if (previousEpochIterations.length > 0) {
    const lastIterationOfPrevEpoch = previousEpochIterations[previousEpochIterations.length - 1]!
    const idx = convergenceResult.value.iterations.indexOf(lastIterationOfPrevEpoch)
    if (idx !== -1) {
      currentIterationIndex.value = idx
    }
  }
}

function goToNextEpoch() {
  if (!convergenceResult.value || !currentIteration.value) return
  const currentEpoch = currentIteration.value.epoch
  // Find the first iteration of the next epoch
  const nextEpochIterations = convergenceResult.value.iterations.filter(
    it => it.epoch === currentEpoch + 1
  )
  if (nextEpochIterations.length > 0) {
    const firstIterationOfNextEpoch = nextEpochIterations[0]!
    const idx = convergenceResult.value.iterations.indexOf(firstIterationOfNextEpoch)
    if (idx !== -1) {
      currentIterationIndex.value = idx
    }
  }
}

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

// Auto-scroll to bottom when new iterations are added
watch(epochFilteredIterations, () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}, { deep: true })

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

// function reset() {
//   isPlaying.value = false
//   currentIterationIndex.value = 0
//   initializeTraining()
// }
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
