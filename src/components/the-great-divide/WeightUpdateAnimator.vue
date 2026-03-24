<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <div class="space-y-6">
      <!-- Step Navigation-->
      <div class="flex gap-1 justify-center items-center">
        <div
          v-for="step in 3"
          :key="step"
          class="flex-1 h-1 rounded-full transition-all duration-300"
          :class="{
            'bg-blue-500': currentStep >= step,
            'bg-slate-200': currentStep < step,
            'opacity-100': true
          }"
        ></div>
      </div>

      <!-- Main content: Graph + Sidebar -->
      <div class="flex flex-col lg:flex-row gap-6 min-h-96">
        <!-- Large animated graph -->
        <div class="flex-grow flex flex-col">
          <svg
            viewBox="0 0 300 300"
            class="w-full aspect-square border-2 border-slate-300 rounded bg-white"
          >
            <!-- Grid -->
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" stroke-width="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Axes -->
            <line x1="150" y1="0" x2="150" y2="300" stroke="#d1d5db" stroke-width="1" />
            <line x1="0" y1="150" x2="300" y2="150" stroke="#d1d5db" stroke-width="1" />
            <text x="155" y="145" class="text-xs fill-slate-400" font-size="11">0</text>

            <!-- Decision boundary (animates smoothly) -->
            <line
              :x1="currentBoundary.x1"
              :y1="currentBoundary.y1"
              :x2="currentBoundary.x2"
              :y2="currentBoundary.y2"
              stroke="#ef4444"
              stroke-width="1"
              stroke-dasharray="6,4"
              opacity="0.7"
              class="transition-all duration-700"
            />

            <!-- Weight vector (animates smoothly) -->
            <line
              :x1="150"
              :y1="150"
              :x2="currentWeightScreen.x"
              :y2="currentWeightScreen.y"
              :stroke="currentWeightColor"
              stroke-width="1.5"
              class="transition-all duration-700"
            />
            <!-- Arrow head -->
            <polygon
              :points="arrowHeadPoints"
              :fill="currentWeightColor"
              class="transition-all duration-700"
            />

            <!-- Show y·x vector during step 2 -->
            <g v-if="currentStep === 2" class="transition-all duration-500">
              <line
                x1="150"
                y1="150"
                :x2="pointToAddScreen.x"
                :y2="pointToAddScreen.y"
                stroke="#10b981"
                stroke-width="2"
                stroke-dasharray="3,3"
                opacity="0.6"
              />
              <polygon
                :points="`${pointToAddScreen.x},${pointToAddScreen.y} ${pointToAddScreen.x - 6},${pointToAddScreen.y + 5} ${pointToAddScreen.x - 4},${pointToAddScreen.y - 3}`"
                fill="#10b981"
                opacity="0.6"
              />
              <text :x="pointToAddScreen.x + 8" :y="pointToAddScreen.y - 5" class="text-xs font-semibold fill-emerald-600">y·x</text>
            </g>

            <!-- Misclassified point -->
            <circle
              :cx="pointScreen.x"
              :cy="pointScreen.y"
              r="6"
              fill="#ef4444"
              stroke="white"
              stroke-width="2"
            />
            <text
              :x="pointScreen.x"
              :y="pointScreen.y + 4"
              class="text-xs font-bold fill-white text-center"
              text-anchor="middle"
            >
              +
            </text>

            <!-- Labels for weight vectors -->
            <text
              v-if="currentStep === 1"
              :x="currentWeightScreen.x + 8"
              :y="currentWeightScreen.y - 10"
              class="text-xs font-semibold fill-blue-600"
            >
              w₀
            </text>
            <text
              v-if="currentStep === 3"
              :x="currentWeightScreen.x + 8"
              :y="currentWeightScreen.y - 10"
              class="text-xs font-semibold fill-amber-600"
            >
              w_n
            </text>
          </svg>

          <!-- Step counter -->
          <div class="text-center mt-4">
            <div class="text-sm text-slate-600 font-semibold">
              Step {{ currentStep }} of 3
            </div>
          </div>
        </div>

        <!-- Explanation panel (right sidebar on desktop, below on mobile) -->
        <div class="w-full lg:w-80 flex flex-col gap-4">
          <!-- Dynamic explanation -->
          <div class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg p-5 border border-slate-200 flex-1 overflow-y-auto">
            <!-- Step 1 -->
            <div v-if="currentStep === 1" class="space-y-3">
              <h3 class="font-semibold text-slate-800 text-sm">Detect Misclassification</h3>
              <p class="text-xs text-slate-700 leading-relaxed">
                The blue weight vector <span class="font-mono font-semibold">w₀ = (0.6, 0.8)</span> currently defines a decision boundary (red dashed line) that is orthogonal to it.
              </p>
              <p class="text-xs text-slate-700 leading-relaxed">
                However, the red point with label <span class="font-mono"><KaTeX expression="y = +1" /></span> falls on the <span class="font-italic">wrong side</span> of the boundary. We detect this because <KaTeX expression="y(\vec{w}\cdot\vec{x})<0" />:
              </p>
              <div class="bg-white rounded p-3 space-y-2 text-xs font-mono text-slate-600 border-l-2 border-red-400">
                <div><span class="text-slate-600"><KaTeX expression="x = " /></span><span class="text-red-600"><KaTeX expression="(-0.4, 0.1)" /></span></div>
                <div><span class="text-slate-600"><KaTeX expression="w_o \cdot x = " /></span><span class="text-red-600"><KaTeX expression="(0.6)(-0.4) + (0.8)(0.1)" /></span></div>
                <div><span class="text-slate-600"></span><span class="text-red-600"><KaTeX expression="= -0.24 + 0.08" /></span></div>
                <div><span class="text-slate-600"></span><span class="text-red-600"><KaTeX expression="= -0.16" /></span></div>
                <div class="border-t border-red-200 pt-2 mt-2"><span class="text-slate-600"><KaTeX expression="y(\vec{w}\cdot\vec{x}) = " /></span><span class="text-red-600 font-semibold"><KaTeX expression="(+1)(-0.16) " /></span><br><span><KaTeX expression="= -0.16 \le 0" /></span></div>
              </div>
            </div>

            <!-- Step 2 -->
            <div v-else-if="currentStep === 2" class="space-y-3">
              <h3 class="font-semibold text-slate-800 text-sm">Compute Update</h3>
              <p class="text-xs text-slate-700 leading-relaxed">
                We apply the perceptron update rule by computing <span class="font-semibold text-emerald-600"><KaTeX expression="y \cdot x" /></span>, shown as the green dashed vector.
              </p>
              <div class="bg-white rounded p-3 space-y-1 text-xs font-mono border-l-2 border-emerald-400">
                <div><span class="text-slate-600"><KaTeX expression="y"/> (label):</span> <span class="text-emerald-600"><KaTeX expression="+1"/></span></div>
                <div><span class="text-slate-600"><KaTeX expression="x"/> (point):</span> <span class="text-emerald-600"><KaTeX expression="(-0.4, 0.1)"/></span></div>
                <div class="border-t border-slate-200 pt-1 mt-1 text-emerald-600 font-semibold">
                  <KaTeX expression="y \cdot x = (-0.4, 0.1)" />
                </div>
              </div>
              <p class="text-xs text-slate-700 leading-relaxed">
                This vector points toward the misclassified point, which is key. We're about to shift our weight in that direction.
              </p>
            </div>

            <!-- Step 3 -->
            <div v-else class="space-y-3">
              <h3 class="font-semibold text-slate-800 text-sm">Set Weight Vector</h3>
              <p class="text-xs text-slate-700 leading-relaxed">
                The new weight <span class="font-mono font-semibold text-amber-600"><KaTeX expression="w_n"/></span> is computed and the boundary rotates accordingly:
              </p>
              <div class="bg-white rounded p-3 space-y-1 text-xs font-mono border-l-2 border-amber-400">
                <div class="text-slate-700"><KaTeX expression="w_n = w_o + y \cdot x"/></div>
                <div class="text-slate-700"><KaTeX expression="= (0.6, 0.8) + (-0.4, 0.1)"/></div>
                <div class="text-amber-600 font-semibold"><KaTeX expression="= (0.2, 0.9)"/></div>
              </div>
              <p class="text-xs text-slate-700 leading-relaxed">
                Notice how the dashed boundary has rotated? The misclassified point is now closer to being on the correct side. This iterative process continues until convergence.
              </p>
            </div>
          </div>

          <!-- Play/pause button -->
          <button
            @click="autoPlay = !autoPlay"
            class="w-full px-4 py-3 bg-slate-800 text-white text-sm rounded font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg v-if="autoPlay" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.04995 2.74998C6.04995 2.44623 5.80371 2.19998 5.49995 2.19998C5.19619 2.19998 4.94995 2.44623 4.94995 2.74998V12.25C4.94995 12.5537 5.19619 12.8 5.49995 12.8C5.80371 12.8 6.04995 12.5537 6.04995 12.25V2.74998ZM10.05 2.74998C10.05 2.44623 9.80371 2.19998 9.49995 2.19998C9.19619 2.19998 8.94995 2.44623 8.94995 2.74998V12.25C8.94995 12.5537 9.19619 12.8 9.49995 12.8C9.80371 12.8 10.05 12.5537 10.05 12.25V2.74998Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.24182 2.32181C3.3919 2.23132 3.5784 2.22601 3.73338 2.30781L12.7334 7.05781C12.8974 7.14436 13 7.31457 13 7.5C13 7.68543 12.8974 7.85564 12.7334 7.94219L3.73338 12.6922C3.5784 12.774 3.3919 12.7687 3.24182 12.6782C3.09175 12.5877 3 12.4252 3 12.25V2.75C3 2.57476 3.09175 2.4123 3.24182 2.32181ZM4 3.57925V11.4207L11.4288 7.5L4 3.57925Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            <span>{{ autoPlay ? 'Pause' : 'Play' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import KaTeX from '../KaTeX.vue'

const currentStep = ref(1)
const autoPlay = ref(false)

// Coordinate system: Data space ranges from -1.5 to +1.5 on both axes
const chartRange = 1.5       // Data range: -1.5 to +1.5
const positiveLength = 150   // Pixels from center to chart edge (half of 300×300 viewBox)
const centerX = 150          // SVG center x
const centerY = 150          // SVG center y

// Unified coordinate conversion function
const toScreenCoords = (x: number, y: number) => ({
  x: centerX + (x / chartRange) * positiveLength,
  y: centerY - (y / chartRange) * positiveLength  // Minus because SVG y increases downward
})

// Weight vectors in data space
const w0 = { x: 0.6, y: 0.8 }   // Initial weight vector
const misclassifiedPoint = { x: -0.4, y: 0.1 }  // Misclassified data point

// Updated weight: w_n = w₀ + y·x (where y=+1)
const pointToAdd = { x: misclassifiedPoint.x, y: misclassifiedPoint.y }
const wn = {
  x: w0.x + pointToAdd.x,     // 0.6 + (-0.4) = 0.2
  y: w0.y + pointToAdd.y      // 0.8 + 0.1 = 0.9
}

// Compute boundary (perpendicular to weight vector)
// Returns screen coordinates for the decision boundary line
const getBoundaryPoints = (weight: { x: number; y: number }, boundaryExtent: number) => {
  // Perpendicular direction: rotate weight 90° counterclockwise
  const perpX = -weight.y
  const perpY = weight.x
  const perpLength = Math.sqrt(perpX * perpX + perpY * perpY)
  
  // Normalize perpendicular vector
  const perpNormalizedX = perpX / perpLength
  const perpNormalizedY = perpY / perpLength
  
  // Scale by boundary extent and convert to screen coordinates
  // boundaryExtent is in data space units
  const screenExtentX = (perpNormalizedX * boundaryExtent / chartRange) * positiveLength
  const screenExtentY = -(perpNormalizedY * boundaryExtent / chartRange) * positiveLength
  
  return {
    x1: centerX - screenExtentX,
    y1: centerY - screenExtentY,
    x2: centerX + screenExtentX,
    y2: centerY + screenExtentY
  }
}

// Animated boundary - interpolates between w0 and wn
const currentBoundary = computed(() => {
  if (currentStep.value <= 1) {
    // Step 1: Boundary perpendicular to w0
    return getBoundaryPoints(w0, 1.5)
  } else if (currentStep.value < 3) {
    // Step 2: Smoothly interpolate weight between w0 and wn
    const progress = (currentStep.value - 1) / 1
    const interpWeight = {
      x: w0.x + (wn.x - w0.x) * progress,
      y: w0.y + (wn.y - w0.y) * progress
    }
    return getBoundaryPoints(interpWeight, 1.5)
  }
  // Step 3: Boundary perpendicular to wn
  return getBoundaryPoints(wn, 1.5)
})

// Animated weight vector endpoint - interpolates between w0 and wn
const currentWeightScreen = computed(() => {
  if (currentStep.value <= 1) {
    // Step 1: Show w0
    return toScreenCoords(w0.x, w0.y)
  } else if (currentStep.value < 3) {
    // Step 2: Smoothly interpolate weight between w0 and wn
    const progress = (currentStep.value - 1) / 1
    const interpWeight = {
      x: w0.x + (wn.x - w0.x) * progress,
      y: w0.y + (wn.y - w0.y) * progress
    }
    return toScreenCoords(interpWeight.x, interpWeight.y)
  }
  // Step 3: Show wn
  return toScreenCoords(wn.x, wn.y)
})

const currentWeightColor = computed(() => {
  if (currentStep.value === 1) return '#3b82f6' // blue
  if (currentStep.value === 2) return '#8b5cf6' // purple (transitioning)
  return '#f59e0b' // amber
})

// Calculate arrow head points based on vector direction
const arrowHeadPoints = computed(() => {
  const tip = currentWeightScreen.value
  // Vector from center to tip
  const vx = tip.x - centerX
  const vy = tip.y - centerY
  const len = Math.sqrt(vx * vx + vy * vy)
  
  if (len === 0) return `${tip.x},${tip.y} ${tip.x},${tip.y} ${tip.x},${tip.y}`
  
  // Normalize vector
  const nx = vx / len
  const ny = vy / len
  
  // Perpendicular vector (rotated 90 degrees)
  const px = -ny
  const py = nx
  
  // Arrow head size
  const arrowSize = 10
  const arrowWidth = 6
  
  // Calculate arrow base points
  const base1X = tip.x - nx * arrowSize + px * arrowWidth
  const base1Y = tip.y - ny * arrowSize + py * arrowWidth
  const base2X = tip.x - nx * arrowSize - px * arrowWidth
  const base2Y = tip.y - ny * arrowSize - py * arrowWidth
  
  return `${tip.x},${tip.y} ${base1X},${base1Y} ${base2X},${base2Y}`
})

// Screen coordinates for the misclassified point
const pointScreen = computed(() => toScreenCoords(misclassifiedPoint.x, misclassifiedPoint.y))

// Screen coordinates for the y·x update vector (shown in step 2)
const pointToAddScreen = computed(() => toScreenCoords(pointToAdd.x, pointToAdd.y))

// Auto-play logic with interval management
let autoPlayInterval: ReturnType<typeof setInterval> | null = null

watch(autoPlay, (isAutoPlay) => {
  if (isAutoPlay) {
    autoPlayInterval = setInterval(() => {
      if (currentStep.value === 3) {
        currentStep.value = 1
      } else {
        currentStep.value++
      }
    }, 2500)
  } else {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval)
      autoPlayInterval = null
    }
  }
})
</script>
