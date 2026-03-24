<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <div class="flex gap-4 flex-col md:flex-row md:items-stretch">
      <!-- SVG Plot -->
      <div class="flex-grow flex">
        <svg
          ref="svgRef"
          :viewBox="`0 0 ${width} ${height}`"
          :width="width"
          :height="height"
          class="w-full h-[420px] md:h-full border rounded bg-slate-50"
        >
          <!-- Grid background -->
          <defs>
            <pattern id="grid" :width="gridSize" :height="gridSize" patternUnits="userSpaceOnUse">
              <path :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`" fill="none" stroke="#e5e7eb" stroke-width="0.5" />
            </pattern>
          </defs>

          <!-- Grid -->
          <rect width="100%" height="100%" fill="url(#grid)" />

          <!-- Axes -->
          <!-- X-axis: horizontal line at y=axisOriginY (where model y=0) -->
          <line :x1="0" :y1="axisOriginY" :x2="width" :y2="axisOriginY" stroke="#9ca3af" stroke-width="1.5" />
          <!-- Y-axis: vertical line at x=axisOriginX (where model x=0) -->
          <line :x1="axisOriginX" :y1="0" :x2="axisOriginX" :y2="height" stroke="#9ca3af" stroke-width="1.5" />

          <text :x="originX + 8" :y="originY - 8" class="text-xs fill-slate-500 text-right">0.0</text>

          <!-- Decision Boundary (orthogonal line - dashed) -->
          <line
            :x1="boundaryStart.x"
            :y1="boundaryStart.y"
            :x2="boundaryEnd.x"
            :y2="boundaryEnd.y"
            stroke="#ef4444"
            stroke-width="2"
            stroke-dasharray="5,5"
            opacity="0.7"
          />

          <!-- Weight Vector (arrow from origin) -->
          <line
            :x1="originX"
            :y1="originY"
            :x2="weightVectorEnd.x"
            :y2="weightVectorEnd.y"
            stroke="#3b82f6"
            stroke-width="2.5"
          />
          <!-- Arrow head -->
          <polygon
            :points="arrowHeadPoints"
            fill="#3b82f6"
          />

          <!-- Data points -->
          <g v-for="point in dataPoints" :key="`point-${point.day}`">
            <!-- Point circle -->
            <circle
              :cx="point.screenX"
              :cy="point.screenY"
              r="6"
              :fill="point.decision === 1 ? '#ef4444' : '#0ea5a4'"
              stroke="#fff"
              stroke-width="1.5"
              class="cursor-pointer"
              @mouseenter="hoveredDay = point.day"
              @mouseleave="hoveredDay = null"
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
              {{ hoveredPointData?.day }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Legend and Info Panel -->
      <div class="w-full md:w-60 flex flex-col">
        <div class="space-y-4">
          <!-- Weight Vector Info -->
          <div class="p-3 bg-slate-50 rounded">
            <div class="text-xs font-semibold text-slate-700 mb-2">Weight Vector</div>
            <div class="text-xs text-slate-600 font-mono">
              w = ({{ weightVector.x.toFixed(3) }}, {{ weightVector.y.toFixed(3) }})
            </div>
          </div>

          <!-- Sample Normalized Values -->
          <div class="p-3 bg-slate-50 rounded">
            <div class="text-xs font-semibold text-slate-700 mb-2">Formula</div>
            <div class="text-xs text-slate-600 font-mono">
              <KaTeX expression="x_n=(x - min)\div(max - min)" /> 
            </div>
          </div>

          <!-- Hover Info (always present to prevent layout shift) -->
          <div class="p-3 bg-slate-50 rounded border border-slate-300 h-40">
            <div v-if="hoveredPointData" class="text-xs text-slate-600 space-y-1">
              <div class="text-xs font-semibold text-slate-700 mb-2">{{ hoveredPointData.day }}</div>
              <div>Money (Raw): ₦{{ hoveredPointData.money }}</div>
              <div>Money (Normalized): {{ hoveredPointData.normalizedMoney.toFixed(3) }}</div>
              <hr class="my-2">
              <div>Wait (Raw): {{ hoveredPointData.waitTime }}m</div>
              <div>Wait (Normalized): {{ hoveredPointData.normalizedWaitTime.toFixed(3) }}</div>
              <hr class="my-2">
              <div class="font-semibold">
                Decision:
                <span
                  :class="
                    hoveredPointData.decision === 1 ? 'text-red-600' : 'text-teal-600'
                  "
                >
                  {{ hoveredPointData.decision === 1 ? 'BRT (+1)' : 'Danfo (−1)' }}
                </span>
              </div>
            </div>
            <div v-else class="text-xs text-slate-400 italic">Hover over a point to see details</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import KaTeX from '../KaTeX.vue'

interface RawDataPoint {
  day: string
  money: number
  waitTime: number
  decision: 1 | -1
}

interface NormalizedDataPoint extends RawDataPoint {
  normalizedMoney: number
  normalizedWaitTime: number
  screenX: number
  screenY: number
}

const width = 560
const height = 560

const gridSize = 40

// Coordinate system: model space ranges from -0.2 to +1 (span of 1.2)
const modelMin = -0.2
const modelMax = 1.0
const modelSpan = modelMax - modelMin // 1.2

const originX = ((0 - modelMin) / modelSpan) * width
const originY = (1 / modelSpan) * height

// Compute screen position of axis origin (where model coordinate 0 maps to)
const axisOriginX = computed(() => ((0 - modelMin) / modelSpan) * width)
const axisOriginY = computed(() => ((1.0) / modelSpan) * height)

// Initial weight vector (scaled appropriately for the normalized space)
const weightVector = ref({ x: 0.4, y: 0.4 })

// Raw data from the experiment
const rawData: RawDataPoint[] = [
  { day: 'Mar 1', money: 150, waitTime: 28, decision: -1 },
  { day: 'Mar 2', money: 3200, waitTime: 12, decision: 1 },
  { day: 'Mar 3', money: 280, waitTime: 32, decision: -1 },
  { day: 'Mar 4', money: 4100, waitTime: 10, decision: 1 },
  { day: 'Mar 5', money: 320, waitTime: 30, decision: -1 },
  { day: 'Mar 8', money: 2500, waitTime: 15, decision: 1 },
  { day: 'Mar 9', money: 0, waitTime: 35, decision: -1 },
  { day: 'Mar 10', money: 3900, waitTime: 12, decision: 1 },
  { day: 'Mar 11', money: 450, waitTime: 26, decision: -1 },
  { day: 'Mar 12', money: 5200, waitTime: 9, decision: 1 },
  { day: 'Mar 15', money: 75, waitTime: 31, decision: -1 },
  { day: 'Mar 16', money: 4800, waitTime: 11, decision: 1 },
  { day: 'Mar 17', money: 180, waitTime: 33, decision: -1 },
  { day: 'Mar 18', money: 2800, waitTime: 14, decision: 1 },
  { day: 'Mar 19', money: 520, waitTime: 29, decision: -1 },
  { day: 'Mar 22', money: 3500, waitTime: 13, decision: 1 },
  { day: 'Mar 23', money: 400, waitTime: 27, decision: -1 },
  { day: 'Mar 24', money: 5600, waitTime: 8, decision: 1 },
  { day: 'Mar 25', money: 1200, waitTime: 22, decision: -1 },
  { day: 'Mar 26', money: 4200, waitTime: 11, decision: 1 },
  { day: 'Mar 29', money: 1800, waitTime: 19, decision: 1 },
  { day: 'Mar 30', money: 6000, waitTime: 9, decision: 1 },
]

// Compute min/max for each dimension
const moneyStats = computed(() => {
  const values = rawData.map(p => p.money)
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
})

const waitStats = computed(() => {
  const values = rawData.map(p => p.waitTime)
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
})

// Normalize a value using min-max formula
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0
  return (value - min) / (max - min)
}

// Convert model coordinates to screen coordinates
function modelToScreenX(modelValue: number, screenDimension: number): number {
  return ((modelValue - modelMin) / modelSpan) * screenDimension
}

function modelToScreenY(modelValue: number, screenDimension: number): number {
  return ((modelValue) / modelSpan) * screenDimension
}

// Compute normalized data points
const dataPoints = computed((): NormalizedDataPoint[] => {
  const money = moneyStats.value
  const wait = waitStats.value

  return rawData.map(point => {
    const normalizedMoney = normalize(point.money, money.min, money.max)
    const normalizedWaitTime = normalize(point.waitTime, wait.min, wait.max)

    return {
      ...point,
      normalizedMoney,
      normalizedWaitTime,
      screenX: modelToScreenX(normalizedMoney, width),
      screenY: modelToScreenY(1 - normalizedWaitTime, height),
    }
  })
})

// Weight vector endpoint (scaled for visualization)
const weightVectorEnd = computed(() => {
    const xValue = modelToScreenX(weightVector.value.x, width)
    const yValue = modelToScreenY(1 - weightVector.value.y, height)
  return {
    x: xValue,
    y: yValue, // Subtract because Y increases downward
  }
})

// Arrow head points (rotated to face the vector direction)
const arrowHeadPoints = computed(() => {
  const dx = weightVectorEnd.value.x - originX
  const dy = weightVectorEnd.value.y - originY
  const magnitude = Math.sqrt(dx ** 2 + dy ** 2)
  
  // Normalized direction vector
  const ux = dx / magnitude
  const uy = dy / magnitude
  
  // Perpendicular vector (rotated 90 degrees)
  const px = -uy
  const py = ux
  
  // Arrow dimensions
  const arrowLength = 12
  const arrowWidth = 8
  
  // Calculate arrow head points
  const baseX = weightVectorEnd.value.x - ux * arrowLength
  const baseY = weightVectorEnd.value.y - uy * arrowLength
  
  const left = {
    x: baseX - px * (arrowWidth / 2),
    y: baseY - py * (arrowWidth / 2),
  }
  
  const right = {
    x: baseX + px * (arrowWidth / 2),
    y: baseY + py * (arrowWidth / 2),
  }
  
  return `${weightVectorEnd.value.x},${weightVectorEnd.value.y} ${left.x},${left.y} ${right.x},${right.y}`
})

// Decision boundary (orthogonal line perpendicular to weight vector)
const boundaryStart = computed(() => {
  // Direction perpendicular to weight vector
  const perpX = -weightVector.value.y
  const perpY = weightVector.value.x
  
  // Normalize the perpendicular direction
  const magnitude = Math.sqrt(perpX ** 2 + perpY ** 2)
  const normPerpX = perpX / magnitude
  const normPerpY = perpY / magnitude
  
  // Extend line from origin in perpendicular direction
  const boundaryLength = 250
  return {
    x: originX - normPerpX * boundaryLength,
    y: originY + normPerpY * boundaryLength, // Add because Y increases downward
  }
})

const boundaryEnd = computed(() => {
  // Direction perpendicular to weight vector
  const perpX = -weightVector.value.y
  const perpY = weightVector.value.x
  
  // Normalize the perpendicular direction
  const magnitude = Math.sqrt(perpX ** 2 + perpY ** 2)
  const normPerpX = perpX / magnitude
  const normPerpY = perpY / magnitude
  
  // Extend line from origin in opposite perpendicular direction
  const boundaryLength = 250
  return {
    x: originX + normPerpX * boundaryLength,
    y: originY - normPerpY * boundaryLength, // Subtract because Y increases downward
  }
})

// Hover state
const hoveredDay = ref<string | null>(null)

const hoveredPointData = computed(() => {
  if (!hoveredDay.value) return null
  return dataPoints.value.find(p => p.day === hoveredDay.value) || null
})

const tooltipX = computed(() => {
  const point = hoveredPointData.value
  return point?.screenX || 0
})

const tooltipY = computed(() => {
  const point = hoveredPointData.value
  return point?.screenY || 0
})
</script>

<style scoped>
svg {
  touch-action: manipulation;
}

text {
  font-family: inherit;
  pointer-events: none;
}

sub {
  font-size: 0.75em;
  vertical-align: sub;
}
</style>
