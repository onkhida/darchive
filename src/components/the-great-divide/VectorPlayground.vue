<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <!-- <h3 class="text-lg font-semibold mb-2">Vector Playground</h3> -->
    <div class="flex gap-4 flex-col md:flex-row md:items-stretch">
      <div class="flex-1 flex">
        <svg
          ref="svgRef"
          :viewBox="`0 0 ${width} ${height}`"
          width="100%"
          height="100%"
          class="w-full h-[400px] md:h-full border rounded bg-slate-50"
          @pointerdown.stop.prevent="onPointerDown"
          @pointermove.stop.prevent="onPointerMove"
          @pointerup.stop.prevent="onPointerUp"
          @pointerleave.stop.prevent="onPointerUp"
          tabindex="0"
        >
          <defs>
            <!-- reduced arrow sizes -->
            <marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L5,2.5 L0,5 L1,2.5 z" fill="#111827" />
            </marker>
            <marker id="arrow-red" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L5,2.5 L0,5 L1,2.5 z" fill="#dc2626" />
            </marker>
            <marker id="arrow-blue" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L5,2.5 L0,5 L1,2.5 z" fill="#2563eb" />
            </marker>
          </defs>

          <!-- grid + axes -->
          <!-- no internal rect stroke to avoid visible line; background handled by CSS -->

          <!-- center cross -->
          <line :x1="cx-6" :y1="cy" :x2="cx+6" :y2="cy" stroke="#9ca3af" stroke-width="1" />
          <line :x1="cx" :y1="cy-6" :x2="cx" :y2="cy+6" stroke="#9ca3af" stroke-width="1" />

          <!-- vectors -->
          <g>
            <!-- vector A -->
            <line :x1="cx" :y1="cy" :x2="a.x" :y2="a.y" stroke="#2563eb" stroke-width="3" marker-end="url(#arrow-blue)" />
            <circle :cx="a.x" :cy="a.y" r="8" fill="#2563eb" stroke="white" stroke-width="1.5" class="cursor-pointer" :data-id="'a'"/>

            <!-- vector B -->
            <line :x1="cx" :y1="cy" :x2="b.x" :y2="b.y" stroke="#dc2626" stroke-width="3" marker-end="url(#arrow-red)" />
            <circle :cx="b.x" :cy="b.y" r="8" fill="#dc2626" stroke="white" stroke-width="1.5" class="cursor-pointer" :data-id="'b'"/>
          </g>

          <!-- projection line and label for angle -->
          <g v-if="validAngle">
            <path :d="angleArcPath" fill="none" stroke="#111827" stroke-width="1.25" />
          </g>
        </svg>
      </div>

      <div class="w-full md:w-64 flex flex-col">
        <div class="space-y-3">
          <div class="p-3 bg-slate-50 rounded">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs text-slate-500">Manual angle θ (deg)</label>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex flex-col gap-2 w-full">
                <input v-model.number="angleInput" type="number" step="0.1" class="w-full px-2 py-1 rounded border text-slate-800" />
                <button @click="applyAngle" class="w-full px-3 py-1 bg-slate-800 text-white rounded text-sm">Apply</button>
              </div>
            </div>
            <div class="text-xs text-slate-500 mt-2">Red vector stays fixed; applying θ rotates blue to close the angle.</div>
          </div>

          <div class="text-sm text-slate-600">Drag vector tips or use keyboard arrows to nudge them (focus SVG then press A/B to select).</div>

          <div class="p-3 bg-slate-50 rounded">
            <div class="flex justify-between mb-2">
              <span class="text-xs text-slate-500">Vector A</span>
              <span class="text-xs font-medium text-slate-700">(blue)</span>
            </div>
            <div class="text-sm text-slate-600">x: <span class="font-mono">{{ ax.toFixed(3) }}</span></div>
            <div class="text-sm text-slate-600">y: <span class="font-mono">{{ ay.toFixed(3) }}</span></div>
            <div class="text-sm text-slate-600">|a|: <span class="font-mono">{{ magA.toFixed(3) }}</span></div>
          </div>

          <div class="p-3 bg-slate-50 rounded">
            <div class="flex justify-between mb-2">
              <span class="text-xs text-slate-500">Vector B</span>
              <span class="text-xs font-medium text-slate-700">(red)</span>
            </div>
            <div class="text-sm text-slate-600">x: <span class="font-mono">{{ bx.toFixed(3) }}</span></div>
            <div class="text-sm text-slate-600">y: <span class="font-mono">{{ by.toFixed(3) }}</span></div>
            <div class="text-sm text-slate-600">|b|: <span class="font-mono">{{ magB.toFixed(3) }}</span></div>
          </div>

          <div class="p-3 bg-slate-50 rounded">
            <div class="text-sm text-slate-600">θ (deg): <span class="font-mono">{{ angleDeg }}</span></div>
            <div class="text-sm text-slate-600">dot(a, b): <span class="font-mono">{{ dot.toFixed(3) }}</span></div>
            <div class="text-sm text-slate-600">cos θ: <span class="font-mono">{{ cosTheta.toFixed(3) }}</span></div>
          </div>

          <!-- <div class="flex gap-2">
            <button @click="reset" class="flex-1 px-3 py-2 bg-slate-800 text-white rounded">Reset</button>
            <button @click="randomize" class="flex-1 px-3 py-2 border rounded">Randomize</button>
          </div> -->

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

type Point = { x: number; y: number }

const width = 560
const height = 400
const cx = width / 2
const cy = height / 2

const a = ref<Point>({ x: cx + 100, y: cy - 40 })
const b = ref<Point>({ x: cx - 80, y: cy + 80 })

const svgRef = ref<SVGSVGElement | null>(null)
let dragging: null | 'a' | 'b' = null

function toLocalPoint(clientX: number, clientY: number) {
  const svg = svgRef.value
  if (!svg) return { x: 0, y: 0 }
  const rect = svg.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * width
  const y = ((clientY - rect.top) / rect.height) * height
  return { x, y }
}

function onPointerDown(e: PointerEvent) {
  const target = (e.target as HTMLElement)
  const id = target.getAttribute?.('data-id')
  if (id === 'a' || id === 'b') {
    dragging = id
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const p = toLocalPoint(e.clientX, e.clientY)
  if (dragging === 'a') {
    a.value = { x: p.x, y: p.y }
  } else if (dragging === 'b') {
    b.value = { x: p.x, y: p.y }
  }
}

function onPointerUp() {
  dragging = null
}

const ax = computed(() => a.value.x - cx)
const ay = computed(() => cy - a.value.y) // flip for math coords
const bx = computed(() => b.value.x - cx)
const by = computed(() => cy - b.value.y)

const magA = computed(() => Math.hypot(ax.value, ay.value))
const magB = computed(() => Math.hypot(bx.value, by.value))
const dot = computed(() => ax.value * bx.value + ay.value * by.value)

const cosTheta = computed(() => {
  const denom = magA.value * magB.value
  if (denom === 0) return 0
  return Math.max(-1, Math.min(1, dot.value / denom))
})

const angleRad = computed(() => Math.acos(cosTheta.value || 0))
const angleDeg = computed(() => (isNaN(angleRad.value) ? '—' : (angleRad.value * 180 / Math.PI).toFixed(1)))
const validAngle = computed(() => !isNaN(angleRad.value) && isFinite(angleRad.value))

const angleArcPath = computed(() => {
  if (!validAngle.value) return ''
  // small arc near center showing angle between a and b
  const r = 36
  const aAng = Math.atan2(-ay.value, ax.value) // note: svg y-down
  const bAng = Math.atan2(-by.value, bx.value)
  const start = { x: cx + r * Math.cos(aAng), y: cy + r * Math.sin(aAng) }
  const end = { x: cx + r * Math.cos(bAng), y: cy + r * Math.sin(bAng) }
  const large = Math.abs(bAng - aAng) > Math.PI ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`
})

// manual angle control (placed after computed defs so angleRad/magA exist)
const angleInput = ref<number>(90)

function applyAngle() {
  const deg = Number(angleInput.value) || 0
  const theta = deg * Math.PI / 180
  // keep red (b) fixed, rotate blue (a) so angle between b and a equals theta
  const bAng = Math.atan2(b.value.y - cy, b.value.x - cx)
  const aAng = bAng - theta
  let r = magA.value
  if (!isFinite(r) || r === 0) r = 80
  a.value = { x: cx + r * Math.cos(aAng), y: cy + r * Math.sin(aAng) }
}

// keep angle input synced to live computed angle
watch(angleRad, (v) => {
  if (isFinite(v) && !isNaN(v)) {
    angleInput.value = v * 180 / Math.PI
  }
}, { immediate: true })

// keyboard support: select vector A/B, arrow keys to nudge when svg focused
onMounted(() => {
  const svg = svgRef.value
  if (!svg) return
  svg.addEventListener('keydown', (ev: KeyboardEvent) => {
    const key = ev.key.toLowerCase()
    if (key === 'a') {
      dragging = 'a'
    } else if (key === 'b') {
      dragging = 'b'
    } else if (['arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
      ev.preventDefault()
      const step = ev.shiftKey ? 8 : 2
      if (dragging === 'a') {
        if (key === 'arrowup') a.value.y -= step
        if (key === 'arrowdown') a.value.y += step
        if (key === 'arrowleft') a.value.x -= step
        if (key === 'arrowright') a.value.x += step
      } else if (dragging === 'b') {
        if (key === 'arrowup') b.value.y -= step
        if (key === 'arrowdown') b.value.y += step
        if (key === 'arrowleft') b.value.x -= step
        if (key === 'arrowright') b.value.x += step
      }
    } else if (key === 'escape') {
      dragging = null
    }
  })
})
</script>

<style scoped>
svg:focus {
  outline: 3px solid rgba(99,102,241,0.15);
}
</style>
