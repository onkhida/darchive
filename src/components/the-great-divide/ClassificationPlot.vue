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
          <defs>
            <marker id="cp-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L6,3 L0,6 L1.5,3 z" fill="#111827" />
            </marker>
          </defs>

          <!-- shaded halves using two large polygons computed from decision boundary -->
          <polygon :points="northPoly" fill="#f1f5f9" opacity="0.7" v-if="northPoly" />
          <polygon :points="southPoly" fill="#fff7ed" opacity="0.7" v-if="southPoly" />

          <!-- axes -->
          <line :x1="0" :y1="cy" :x2="width" :y2="cy" stroke="#e5e7eb" />
          <line :x1="cx" :y1="0" :x2="cx" :y2="height" stroke="#e5e7eb" />

          <!-- decision boundary -->
          <line :x1="bx1" :y1="by1" :x2="bx2" :y2="by2" stroke="#374151" stroke-dasharray="6 6" stroke-width="2" />

          <!-- points rendered as thin vectors from origin + circle tip -->
          <g v-for="(p, i) in points" :key="i">
            <line
              v-if="showVectors"
              :x1="cx"
              :y1="cy"
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

          <!-- weight vector (fixed) -->
          <line :x1="cx" :y1="cy" :x2="wx" :y2="wy" stroke="#111827" stroke-width="3" marker-end="url(#cp-arrow)" />
          <!-- fixed weight tip (non-draggable) -->
          <circle :cx="wx" :cy="wy" r="6" fill="#111827" stroke="#fff" stroke-width="1" />

        </svg>
      </div>

      <div class="w-full md:w-72 flex flex-col">
        <div class="space-y-3">
          <div class="text-sm text-slate-600">Click anywhere on the plot to add a point. Points are auto-labelled by their position relative to the fixed weight vector. If the dot product between a point and a weight vector is positive, the point is classified as north (red); if negative, south (blue); and if close to zero, orthogonal (grey).</div>

          <!-- <div class="p-3 bg-slate-50 rounded">
            <div class="flex justify-between mb-2">
              <span class="text-xs text-slate-500">Weight vector (fixed)</span>
              <span class="text-xs font-medium text-slate-700">angle: {{ weightAngleDeg }}°</span>
            </div>
            <div class="text-xs text-slate-500">Classification rule: w·x + b &gt; 0 → north (red); &lt; 0 → south (blue); ≈ 0 → orthogonal (grey)</div>
          </div> -->

           <div class="p-3 bg-slate-50 rounded">
             <div class="text-sm">Points: <span class="font-mono">{{ points.length }}</span></div>
             <div class="mt-2">
              <label class="flex items-center text-xs"><input type="checkbox" v-model="showVectors" class="mr-2"/> Show vectors</label>
             </div>
             <div class="mt-2 space-y-1">
              <div v-for="(p,i) in points" :key="i" class="flex items-center justify-between text-xs">
                <div>{{ p.x.toFixed(2) }}, {{ p.y.toFixed(2) }}</div>
                <div :class="p.label === 1 ? 'text-red-500' : p.label === -1 ? 'text-teal-600' : 'text-slate-500'">{{ p.label === 1 ? 'north' : p.label === -1 ? 'south' : 'orthogonal' }}</div>
              </div>
             </div>
             <div class="mt-3">
               <button @click="clearPoints" class="px-3 py-1 border rounded text-sm">Clear points</button>
             </div>
           </div>

         </div>
       </div>
     </div>
   </div>
 </template>

 <script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

type Pt = { x: number; y: number; label: 1 | -1 | 0 }

const props = defineProps({ width: { type: Number, default: 560 }, height: { type: Number, default: 400 } })
const width = props.width
const height = props.height
const cx = width / 2
const cy = height / 2

const svgRef = ref<SVGSVGElement | null>(null)
const points = ref<Pt[]>([])
// timestamp of last added point to debounce duplicate events
const lastAddAt = ref<number | null>(null)
// UI toggle: whether to show origin-anchored vectors for plotted points
const showVectors = ref(true)

// fixed weight for this iteration (angle in model space), default 45°
const weightAngle = ref(Math.PI / 4)
const weightLen = ref(Math.min(width, height) * 0.35)

// per-axis mapping from model -> screen (used to convert model-direction to screen direction)
const scaleX = (width / 2 - 20)
const scaleY = (height / 2 - 20)

// compute a screen-space unit vector that corresponds to the model-space direction
function screenUnitFromAngle(theta: number) {
  const sx = Math.cos(theta) * scaleX
  const sy = -Math.sin(theta) * scaleY // negate because screen Y grows down
  const L = Math.hypot(sx, sy) || 1
  return { ux: sx / L, uy: sy / L }
}

// screen-space tip computed from unit vector
const wx = computed(() => cx + screenUnitFromAngle(weightAngle.value).ux * weightLen.value)
const wy = computed(() => cy + screenUnitFromAngle(weightAngle.value).uy * weightLen.value)
// human-friendly degrees
const weightAngleDeg = computed(() => Math.round((weightAngle.value * 180 / Math.PI) * 10) / 10)

// Helper to test which side of the boundary a given screen point lies on using the same unit vector
function screenDot(sx: number, sy: number) {
  const { ux, uy } = screenUnitFromAngle(weightAngle.value)
  return ux * (sx - cx) + uy * (sy - cy)
}

// compute boundary points in SCREEN space so the drawn dashed line is visually orthogonal
const boundaryPoints = computed(() => {
  const { ux, uy } = screenUnitFromAngle(weightAngle.value)
  // perpendicular direction in screen space
  let dirx = -uy
  let diry = ux
  const len = Math.hypot(dirx, diry) || 1
  dirx /= len
  diry /= len
  const L = Math.max(width, height) * 1.5
  return {
    sx1: cx + dirx * L,
    sy1: cy + diry * L,
    sx2: cx - dirx * L,
    sy2: cy - diry * L
  }
})

const bx1 = computed(() => boundaryPoints.value.sx1)
const by1 = computed(() => boundaryPoints.value.sy1)
const bx2 = computed(() => boundaryPoints.value.sx2)
const by2 = computed(() => boundaryPoints.value.sy2)

const northPoly = computed(() => {
  const { sx1, sy1, sx2, sy2 } = boundaryPoints.value
  // centroid for the polygon that uses the right/top corners
  const cxPoly = (sx1 + sx2 + width + width) / 4
  const cyPoly = (sy1 + sy2 + height + 0) / 4
  // if this centroid lies on the positive side of the weight vector, it's the north (positive) region
  const isPositive = screenDot(cxPoly, cyPoly) > 0
  if (isPositive) {
    return `${sx1},${sy1} ${sx2},${sy2} ${width},${height} ${width},0`
  }
  // otherwise swap
  return `0,0 0,${height} ${sx1},${sy1} ${sx2},${sy2}`
})

const southPoly = computed(() => {
  const { sx1, sy1, sx2, sy2 } = boundaryPoints.value
  // centroid for the left/bottom polygon
  const cxPoly = (sx1 + sx2 + 0 + 0) / 4
  const cyPoly = (sy1 + sy2 + 0 + height) / 4
  const isPositive = screenDot(cxPoly, cyPoly) > 0
  if (!isPositive) {
    return `${sx1},${sy1} ${sx2},${sy2} 0,0 0,${height}`
  }
  // otherwise swap
  return `${sx1},${sy1} ${sx2},${sy2} ${width},${height} ${width},0`
})

function classifyModel(x: number, y: number) {
  // Map candidate point into screen coords then dot with the same screen unit vector
  const sx = modelToScreenX(x)
  const sy = modelToScreenY(y)
  const { ux, uy } = screenUnitFromAngle(weightAngle.value)
  return ux * (sx - cx) + uy * (sy - cy)
}

function onCanvasPointerDown(e: PointerEvent | MouseEvent) {
  // ignore non-left mouse buttons
  if ('button' in e && (e as MouseEvent).button !== 0) return

  const now = Date.now()
  if (lastAddAt.value && now - lastAddAt.value < 250) return
  lastAddAt.value = now

  const svg = svgRef.value
  if (!svg) return

  // Convert client coordinates into SVG internal coordinates using getScreenCTM inverse
  const clientX = (e as PointerEvent).clientX ?? (e as MouseEvent).clientX
  const clientY = (e as PointerEvent).clientY ?? (e as MouseEvent).clientY
  if (typeof clientX !== 'number' || typeof clientY !== 'number') return

  // create an SVGPoint and transform it to the SVG coordinate system
  const pt = (svg as any).createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return
  const inv = ctm.inverse()
  const svgP = pt.matrixTransform(inv)
  const sx = svgP.x
  const sy = svgP.y

  const mx = screenToModelX(sx)
  const my = screenToModelY(sy)
  const d = classifyModel(mx, my)
  const eps = 1e-6
  const label = d > eps ? 1 : d < -eps ? -1 : 0
  points.value.push({ x: mx, y: my, label })
}

function clearPoints() { points.value = [] }

onMounted(() => {
  // start empty — user will click to add points
})

// coordinate helpers: model space in [-1,1] on both axes
function modelToScreenX(x: number) { return cx + x * (width / 2 - 20) }
function modelToScreenY(y: number) { return cy - y * (height / 2 - 20) }
function screenToModelX(sx: number) { return (sx - cx) / (width / 2 - 20) }
function screenToModelY(sy: number) { return (cy - sy) / (height / 2 - 20) }
</script>

<style scoped>
svg:focus { outline: 3px solid rgba(99,102,241,0.08); }
</style>
