<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <div class="flex gap-4 flex-col md:flex-row md:items-stretch">
      <div class="flex-1 flex">
        <svg
          ref="svgRef"
          :viewBox="`0 0 ${width} ${height}`"
          :width="width"
          :height="height"
          class="w-full h-[420px] md:h-full border rounded bg-slate-50"
          style="touch-action: manipulation;"
          @pointerdown="onCanvasPointerDown"
        >
          <!-- shaded halves using polygon computed from decision boundary -->
          <polygon :points="southPoly" fill="#fff7ed" opacity="0.7" />

          <!-- axes -->
          <line :x1="0" :y1="axisOriginY" :x2="width" :y2="axisOriginY" stroke="#e5e7eb" />
          <line :x1="axisOriginX" :y1="0" :x2="axisOriginX" :y2="height" stroke="#e5e7eb" />

          <!-- decision boundary -->
          <line :x1="bx1" :y1="by1" :x2="bx2" :y2="by2" stroke="#374151" stroke-dasharray="6 6" stroke-width="2" />

          <!-- weight vector (fixed, from props) -->
          <line :x1="axisOriginX" :y1="axisOriginY" :x2="wx" :y2="wy" stroke="#111827" stroke-width="3" marker-end="url(#dc-arrow)" />
          <!-- weight tip -->
          <circle :cx="wx" :cy="wy" r="6" fill="#111827" stroke="#fff" stroke-width="1" />

          <!-- points rendered as vectors from origin + circle tip -->
          <defs>
            <marker id="dc-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L6,3 L0,6 L1.5,3 z" fill="#111827" />
            </marker>
          </defs>

          <g :key="'points-' + points.length">
            <g v-for="p in points" :key="p.id">
              <line
                v-show="showVectors"
                :x1="axisOriginX"
                :y1="axisOriginY"
                :x2="modelToScreenX(p.x)"
                :y2="modelToScreenY(p.y)"
                :stroke="p.label === 1 ? '#ef4444' : p.label === -1 ? '#0ea5a4' : '#9ca3af'"
                stroke-width="1"
                stroke-linecap="round"
                opacity="0.95"
              />
              <circle
                :cx="modelToScreenX(p.x)"
                :cy="modelToScreenY(p.y)"
                :r="5"
                :fill="p.label === 1 ? '#ef4444' : p.label === -1 ? '#0ea5a4' : '#9ca3af'"
                stroke="#fff"
                stroke-width="1"
              />
            </g>
          </g>
        </svg>
      </div>

      <div class="w-full md:w-72 flex flex-col">
        <div class="space-y-3">
          <div class="text-sm text-slate-600">Click anywhere on the plot to classify a point based on the trained weight vector. Alternatively, you can input raw values for money and time and see it normalised + plot on the graph.</div>

          <!-- Input for raw values -->
          <div class="p-3 bg-slate-50 rounded space-y-2">
            <div class="text-sm text-slate-500 font-semibold">Input Raw Values</div>
            <div class="flex gap-2">
              <input
                v-model.number="inputMoney"
                type="number"
                placeholder="Money (₦)"
                min="0"
                max="6000"
                class="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                v-model.number="inputWaitTime"
                type="number"
                placeholder="Wait Time (m)"
                min="8"
                max="35"
                class="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                @click="addPointFromRawValues"
                class="px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Plot
              </button>
            </div>
          </div>

          <div class="p-3 bg-slate-50 rounded">
            <div class="text-sm text-slate-500">Current Point</div>
            <div class="mt-3 space-y-2">
              <div v-if="currentPoint" class="text-xs p-2 bg-white rounded border-l-2" :class="currentPoint.label === 1 ? 'border-red-400' : 'border-teal-400'">
                <!-- Denormalized raw values -->
                <div class="mb-2 pb-2 border-b border-slate-200">
                  <div class="font-semibold text-slate-700 mb-1">Raw Values</div>
                  <div class="text-slate-600">
                    Money: <span class="font-mono">₦{{ currentPointDenormalized?.money }}</span>
                  </div>
                  <div class="text-slate-600">
                    Wait Time: <span class="font-mono">{{ currentPointDenormalized?.waitTime }}m</span>
                  </div>
                </div>
                
                <!-- Normalized values -->
                <div class="mb-2 pb-2 border-b border-slate-200">
                  <div class="font-semibold text-slate-700 mb-1">Normalized</div>
                  <div class="text-slate-600">x: {{ currentPoint.x.toFixed(3) }}, y: {{ currentPoint.y.toFixed(3) }}</div>
                </div>
                
                <!-- Classification result -->
                <div>
                  <div class="font-semibold text-slate-700 mb-1">Decision</div>
                  <div class="flex justify-between items-center">
                    <span :class="currentPoint.label === 1 ? 'text-red-500 font-semibold' : 'text-teal-600 font-semibold'">
                      {{ currentPoint.label === 1 ? 'BRT (Take it)' : 'No BRT (Danfo)' }}
                    </span>
                  </div>
                  <div class="text-slate-600 text-xs mt-1">z = {{ currentPoint.z.toFixed(3) }}</div>
                </div>
              </div>
              <div v-else class="text-xs text-slate-400 italic">
                Click on the plot to classify a point
              </div>
            </div>
            <div class="mt-3">
              <button @click="clearPoints" class="px-3 py-1 border rounded text-sm text-slate-600 hover:bg-slate-100">Clear point</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

type Point = { id: string; x: number; y: number; label: 1 | -1 | 0; z: number }

const props = withDefaults(defineProps<{
  w0: number
  w1: number
  w2: number
  width?: number
  height?: number
}>(), {
  width: 560,
  height: 700,
})

const width = props.width
const height = props.height

const svgRef = ref<SVGSVGElement | null>(null)
const points = ref<Point[]>([])
const lastAddAt = ref<number | null>(null)
const showVectors = ref(true)

// Input refs for raw values
const inputMoney = ref<number | null>(null)
const inputWaitTime = ref<number | null>(null)

// Data ranges for denormalization (from PerceptronSimulator training data)
const moneyMin = 0
const moneyMax = 6000
const waitMin = 8
const waitMax = 35

// Coordinate system: [-1.5, 2.5] range (matching PerceptronSimulator)
const modelMin = -2
const modelMax = 2.5
const modelSpan = modelMax - modelMin

// Compute screen position of axis origin (where model coordinate 0,0 maps to)
const axisOriginX = computed(() => ((0 - modelMin) / modelSpan) * width)
const axisOriginY = computed(() => ((modelMax - 0) / modelSpan) * height)

// Map from model space to screen space
function modelToScreenX(modelValue: number): number {
  return ((modelValue - modelMin) / modelSpan) * width
}

function modelToScreenY(modelValue: number): number {
  return ((modelMax - modelValue) / modelSpan) * height
}

// Map from screen space to model space
function screenToModelX(screenValue: number): number {
  return (screenValue / width) * modelSpan + modelMin
}

function screenToModelY(screenValue: number): number {
  return modelMax - (screenValue / height) * modelSpan
}

// Denormalization: convert from [0,1] normalized space back to raw values
function denormalizeValue(normalized: number, min: number, max: number): number {
  return normalized * (max - min) + min
}

// Weight vector endpoint - treat w1, w2 as model-space coordinates
const wx = computed(() => {
  return modelToScreenX(props.w1)
})

const wy = computed(() => {
  return modelToScreenY(props.w2)
})

// Decision boundary: solve w0 + w1*x + w2*y = 0
const boundaryPoints = computed(() => {
  const { w0, w1, w2 } = props
  
  // If w2 is near zero, use vertical line approach
  if (Math.abs(w2) < 1e-6) {
    const xModel = -w0 / w1
    const xScreen = modelToScreenX(xModel)
    return {
      sx1: xScreen,
      sy1: 0,
      sx2: xScreen,
      sy2: height,
    }
  }

  const xMin = -2
  const xMax = 2.5
  const yMin = -2
  const yMax = 2.5

  // Solve for y: y = -(w0 + w1*x) / w2
  const yAtXMin = -(w0 + w1 * xMin) / w2
  const yAtXMax = -(w0 + w1 * xMax) / w2

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
  if (!point2 && Math.abs(w1) > 1e-6) {
    // Solve for x: x = -(w0 + w2*y) / w1
    const xAtYMin = -(w0 + w2 * yMin) / w1
    const xAtYMax = -(w0 + w2 * yMax) / w1
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
  
  // Convert to screen coordinates (no double transformation)
  const sx1 = modelToScreenX(point1.x)
  const sy1 = modelToScreenY(point1.y)
  const sx2 = modelToScreenX(point2.x)
  const sy2 = modelToScreenY(point2.y)

  return { sx1, sy1, sx2, sy2 }
})

const bx1 = computed(() => boundaryPoints.value?.sx1 ?? 0)
const by1 = computed(() => boundaryPoints.value?.sy1 ?? 0)
const bx2 = computed(() => boundaryPoints.value?.sx2 ?? 0)
const by2 = computed(() => boundaryPoints.value?.sy2 ?? 0)

// Helper: which side of the boundary is a screen point on?
function screenDot(sx: number, sy: number): number {
  const { w0, w1, w2 } = props
  const mx = screenToModelX(sx)
  const my = screenToModelY(sy)
  return w0 + w1 * mx + w2 * my
}

// Polygon shadings
const southPoly = computed(() => {
  if (!boundaryPoints.value) return ''
  const { sx1, sy1, sx2, sy2 } = boundaryPoints.value
  const cxPoly = (sx1 + sx2 + 0 + 0) / 4
  const cyPoly = (sy1 + sy2 + 0 + height) / 4
  const isPositive = screenDot(cxPoly, cyPoly) > 0
  if (!isPositive) {
    return `${sx1},${sy1} ${sx2},${sy2} 0,0 0,${height}`
  }
  return `${sx1},${sy1} ${sx2},${sy2} ${width},${height} ${width},0`
})

// Classify a point
function classifyPoint(x: number, y: number): { label: 1 | -1 | 0; z: number } {
  const z = props.w0 + props.w1 * x + props.w2 * y
  const eps = 1e-6
  const label = (z > eps ? 1 : z < -eps ? -1 : 0) as 1 | -1 | 0
  return { label, z }
}

// Current point (only one at a time)
const currentPoint = computed(() => {
  return points.value.length > 0 ? points.value[0] : null
})

// Denormalized values for current point (raw money and wait time)
const currentPointDenormalized = computed(() => {
  if (!currentPoint.value) return null
  
  // The points are stored in model space [-2, 2.5]
  // The actual training data occupies [0, 1] in normalized space
  // But the display allows clicking anywhere in the model space
  // We should NOT clamp to [0, 1] - allow extrapolation beyond training data
  
  const normalizedMoney = currentPoint.value.x  // Can be > 1 or < 0
  const normalizedWait = currentPoint.value.y   // Can be > 1 or < 0
  
  // Denormalize to raw values (allow values beyond training range)
  const rawMoney = denormalizeValue(normalizedMoney, moneyMin, moneyMax)
  const rawWait = denormalizeValue(normalizedWait, waitMin, waitMax)
  
  return {
    money: Math.round(rawMoney),
    waitTime: Math.round(rawWait)
  }
})

// Handle click
function onCanvasPointerDown(e: PointerEvent | MouseEvent) {
  try {
    if ('button' in e && (e as MouseEvent).button !== 0) return

    const now = Date.now()
    if (lastAddAt.value && now - lastAddAt.value < 250) return
    lastAddAt.value = now

    const svg = svgRef.value
    if (!svg || !document.body.contains(svg)) return

    const clientX = (e as PointerEvent).clientX ?? (e as MouseEvent).clientX
    const clientY = (e as PointerEvent).clientY ?? (e as MouseEvent).clientY
    if (typeof clientX !== 'number' || typeof clientY !== 'number') return

    const pt = (svg as any).createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const inv = ctm.inverse()
    const svgP = pt.matrixTransform(inv)

    const mx = screenToModelX(svgP.x)
    const my = screenToModelY(svgP.y)
    const { label, z } = classifyPoint(mx, my)

    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const newPoint: Point = { id, x: mx, y: my, label, z }

    // Replace any existing point with the new one (only keep one point)
    points.value = [newPoint]
  } catch (err) {
    console.error('[DecisionClassifier] error', err)
  }
}

function clearPoints() {
  points.value = []
}

function addPointFromRawValues() {
  if (inputMoney.value === null || inputWaitTime.value === null) return

  // Normalize the raw values
  const normalizedMoney = (inputMoney.value - moneyMin) / (moneyMax - moneyMin)
  const normalizedWaitTime = (inputWaitTime.value - waitMin) / (waitMax - waitMin)

  // Clamp to [0, 1] to keep within training range
  const mx = Math.max(0, Math.min(1, normalizedMoney))
  const my = Math.max(0, Math.min(1, normalizedWaitTime))

  const { label, z } = classifyPoint(mx, my)

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const newPoint: Point = { id, x: mx, y: my, label, z }

  // Replace any existing point with the new one
  points.value = [newPoint]

  // Clear inputs
  inputMoney.value = null
  inputWaitTime.value = null
}

onMounted(() => {
  console.log('[DecisionClassifier] mounted with weights', { w0: props.w0, w1: props.w1, w2: props.w2 })
})
</script>

<style scoped>
svg {
  cursor: crosshair;
}
</style>
