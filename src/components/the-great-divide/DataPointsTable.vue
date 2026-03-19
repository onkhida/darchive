<template>
  <div class="py-6 px-4 bg-white rounded-lg shadow-sm">
    <div class="space-y-4">
      <!-- Summary section (always visible) -->
      <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-lg font-semibold text-slate-700 mb-2">March 2026 Decision Log</span>
            <br>
            <span class="text-sm text-slate-600">22 morning commute decisions (weekdays only)</span>
          </div>
          <button
            @click="isExpanded = !isExpanded"
            class="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm rounded transition-colors flex items-center gap-2"
          >
            <svg v-if="isExpanded" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H11L7.5 10.5L4 6Z" fill="currentColor"></path></svg>
            <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor"></path></svg>

            <span v-if="isExpanded">Collapse</span>
            <span v-else>Expand</span>
          </button>
        </div>
      </div>

      <!-- Table (expandable) -->
      <div v-if="isExpanded" class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-slate-100 border border-slate-200">
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-700 border border-slate-300">Day</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-700 border border-slate-300">Money (NGN)</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-700 border border-slate-300">Wait Time (min)</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-700 border border-slate-300">Decision</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(point, idx) in dataPoints"
              :key="idx"
              class="border border-slate-200 hover:bg-slate-50 transition-colors"
              :class="idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'"
            >
              <td class="px-3 py-2 text-xs text-slate-600 border border-slate-300 font-mono">{{ point.day }}</td>
              <td class="px-3 py-2 text-xs text-slate-600 border border-slate-300 font-mono">{{ point.money }}</td>
              <td class="px-3 py-2 text-xs text-slate-600 border border-slate-300 font-mono">{{ point.waitTime }}</td>
              <td class="px-3 py-2 text-xs border border-slate-300 font-semibold" :class="point.decision === 1 ? 'text-red-600' : 'text-teal-600'">
                {{ point.decision === 1 ? '+1' : '−1' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Statistics footer -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div class="p-2 bg-red-50 rounded border border-red-200">
          <div class="text-red-700 font-semibold">{{ brtCount }}</div>
          <div class="text-red-600">Took BRT (+1)</div>
        </div>
        <div class="p-2 bg-teal-50 rounded border border-teal-200">
          <div class="text-teal-700 font-semibold">{{ danfoCount }}</div>
          <div class="text-teal-600">Took Danfo (−1)</div>
        </div>
        <div class="p-2 bg-slate-50 rounded border border-slate-200">
          <div class="text-slate-700 font-semibold">₦{{ avgMoneyBRT.toFixed(0) }}</div>
          <div class="text-slate-600">Avg money (BRT)</div>
        </div>
        <div class="p-2 bg-slate-50 rounded border border-slate-200">
          <div class="text-slate-700 font-semibold">{{ avgWaitTimeBRT.toFixed(1) }}</div>
          <div class="text-slate-600">Avg wait (BRT)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface DataPoint {
  day: string
  money: number
  waitTime: number
  decision: 1 | -1
}

const isExpanded = ref(false)

// Generated data: 22 points that are linearly separable
// The decision boundary roughly separates:
// - BRT (+1): higher money (2000-6000) with lower wait times (8-18)
// - Danfo (−1): lower money (0-2000) with higher wait times (18-35)
const dataPoints = ref<DataPoint[]>([
  // Danfo decisions (−1) - low money, long wait times
  { day: 'Mar 1 (Mon)', money: 150, waitTime: 28, decision: -1 },
  { day: 'Mar 2 (Tue)', money: 280, waitTime: 32, decision: -1 },
  { day: 'Mar 3 (Wed)', money: 0, waitTime: 35, decision: -1 },
  { day: 'Mar 4 (Thu)', money: 450, waitTime: 26, decision: -1 },
  { day: 'Mar 5 (Fri)', money: 320, waitTime: 30, decision: -1 },
  { day: 'Mar 8 (Mon)', money: 180, waitTime: 33, decision: -1 },
  { day: 'Mar 9 (Tue)', money: 520, waitTime: 29, decision: -1 },
  { day: 'Mar 10 (Wed)', money: 75, waitTime: 31, decision: -1 },
  { day: 'Mar 11 (Thu)', money: 400, waitTime: 27, decision: -1 },

  // Transition zone - mixed decisions (near the boundary)
  { day: 'Mar 12 (Fri)', money: 1200, waitTime: 22, decision: -1 },
  { day: 'Mar 15 (Mon)', money: 1800, waitTime: 19, decision: 1 },

  // BRT decisions (+1) - high money, short wait times
  { day: 'Mar 16 (Tue)', money: 2500, waitTime: 15, decision: 1 },
  { day: 'Mar 17 (Wed)', money: 3200, waitTime: 12, decision: 1 },
  { day: 'Mar 18 (Thu)', money: 2800, waitTime: 14, decision: 1 },
  { day: 'Mar 19 (Fri)', money: 4100, waitTime: 10, decision: 1 },
  { day: 'Mar 22 (Mon)', money: 3500, waitTime: 13, decision: 1 },
  { day: 'Mar 23 (Tue)', money: 5200, waitTime: 9, decision: 1 },
  { day: 'Mar 24 (Wed)', money: 4800, waitTime: 11, decision: 1 },
  { day: 'Mar 25 (Thu)', money: 3900, waitTime: 12, decision: 1 },
  { day: 'Mar 26 (Fri)', money: 5600, waitTime: 8, decision: 1 },
  { day: 'Mar 29 (Mon)', money: 4200, waitTime: 11, decision: 1 },
  { day: 'Mar 30 (Tue)', money: 6000, waitTime: 9, decision: 1 },
])

// Computed statistics
const brtCount = computed(() => dataPoints.value.filter(p => p.decision === 1).length)
const danfoCount = computed(() => dataPoints.value.filter(p => p.decision === -1).length)

const avgMoneyBRT = computed(() => {
  const brtPoints = dataPoints.value.filter(p => p.decision === 1)
  return brtPoints.length > 0
    ? brtPoints.reduce((sum, p) => sum + p.money, 0) / brtPoints.length
    : 0
})

const avgWaitTimeBRT = computed(() => {
  const brtPoints = dataPoints.value.filter(p => p.decision === 1)
  return brtPoints.length > 0
    ? brtPoints.reduce((sum, p) => sum + p.waitTime, 0) / brtPoints.length
    : 0
})
</script>

<style scoped>
/* Light theme lock - all text elements explicit */
table {
  border-collapse: collapse;
}

th, td {
  text-align: left;
}

/* Ensure borders are visible */
tbody tr {
  border: 1px solid #e2e8f0;
}

tbody td {
  border-right: 1px solid #e2e8f0;
}
</style>
