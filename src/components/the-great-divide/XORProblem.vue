<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <svg
      :viewBox="`0 0 ${width} ${height}`"
      :width="width"
      :height="height"
      class="w-full border rounded bg-slate-50"
      style="max-width: 400px; margin: 0 auto;"
    >
      <!-- Grid background -->
      <defs>
        <pattern id="xor-grid" :width="gridSize" :height="gridSize" patternUnits="userSpaceOnUse">
          <path :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`" fill="none" stroke="#e5e7eb" stroke-width="0.5" />
        </pattern>
      </defs>

      <!-- Grid -->
      <rect width="100%" height="100%" fill="url(#xor-grid)" />

      <!-- Axes -->
      <line :x1="axisX" :y1="0" :x2="axisX" :y2="height" stroke="#9ca3af" stroke-width="1.5" />
      <line :x1="0" :y1="axisY" :x2="width" :y2="axisY" stroke="#9ca3af" stroke-width="1.5" />

      <!-- Axis labels -->
      <text :x="axisX + 8" :y="axisY - 8" class="text-xs fill-slate-500">0</text>

      <!-- XOR points -->
      <!-- (0,0) -> 0 (teal) -->
      <circle :cx="point00.x" :cy="point00.y" r="8" fill="#0ea5a4" stroke="#fff" stroke-width="2" />
      <text :x="point00.x - 15" :y="point00.y + 25" class="text-xs fill-slate-600 font-semibold">
        (0,0)
      </text>

      <!-- (0,1) -> 1 (red) -->
      <circle :cx="point01.x" :cy="point01.y" r="8" fill="#ef4444" stroke="#fff" stroke-width="2" />
      <text :x="point01.x - 15" :y="point01.y - 15" class="text-xs fill-slate-600 font-semibold">
        (0,1)
      </text>

      <!-- (1,0) -> 1 (red) -->
      <circle :cx="point10.x" :cy="point10.y" r="8" fill="#ef4444" stroke="#fff" stroke-width="2" />
      <text :x="point10.x + 8" :y="point10.y + 25" class="text-xs fill-slate-600 font-semibold">
        (1,0)
      </text>

      <!-- (1,1) -> 0 (teal) -->
      <circle :cx="point11.x" :cy="point11.y" r="8" fill="#0ea5a4" stroke="#fff" stroke-width="2" />
      <text :x="point11.x - 5" :y="point11.y - 15" class="text-xs fill-slate-600 font-semibold">
        (1,1)
      </text>
    </svg>

    <!-- Legend -->
    <div class="mt-4 flex gap-6 justify-center text-sm">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-full bg-red-500"></div>
        <span class="text-slate-600">Output: 1</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-full bg-teal-500"></div>
        <span class="text-slate-600">Output: 0</span>
      </div>
    </div>

    <!-- Description -->
    <div class="mt-4 text-center text-xs text-slate-600 max-w-md mx-auto">
      The XOR problem: No single straight line can separate the red points (1) from the teal points (0).
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const width = 400
const height = 400
const gridSize = 40

// Axis positions (centered at 25% from left and 75% from top)
const axisX = computed(() => width * 0.25)
const axisY = computed(() => height * 0.75)

// Point positions: map [0,1] to screen coordinates
function valueToScreen(value: number, axis: number, span: number): number {
  return axis + value * span
}

const span = computed(() => width * 0.5)

// Four XOR points
const point00 = computed(() => ({
  x: valueToScreen(0, axisX.value, span.value),
  y: valueToScreen(0, axisY.value, -span.value) // negative because y inverts
}))

const point01 = computed(() => ({
  x: valueToScreen(0, axisX.value, span.value),
  y: valueToScreen(1, axisY.value, -span.value)
}))

const point10 = computed(() => ({
  x: valueToScreen(1, axisX.value, span.value),
  y: valueToScreen(0, axisY.value, -span.value)
}))

const point11 = computed(() => ({
  x: valueToScreen(1, axisX.value, span.value),
  y: valueToScreen(1, axisY.value, -span.value)
}))
</script>
