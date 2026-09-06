<script setup lang="ts">
import type { StudentPlacementSummary } from '~/utils/studentPlacementSummary'

const props = defineProps<{ summary: StudentPlacementSummary, cycleLabel: string }>()
const center = 88
const radius = 84
const items = computed(() => [
  { key: 'confirmed', label: 'ยืนยันสถานประกอบการ', value: props.summary.confirmed, color: 'text-success', labelClass: 'text-white' },
  { key: 'pending', label: 'ยังไม่ยืนยันสถานประกอบการ', value: props.summary.pending, color: 'text-primary', labelClass: 'text-ink' },
  { key: 'not-started', label: 'ยังไม่ดำเนินการ', value: props.summary.notStarted, color: 'text-divider', labelClass: 'text-ink' },
])
const percent = (value: number) => props.summary.total ? Math.round(value / props.summary.total * 100) : 0
const point = (angle: number) => {
  const rad = angle * Math.PI / 180
  return { x: center + radius * Math.sin(rad), y: center - radius * Math.cos(rad) }
}
const wedges = computed(() => {
  let start = 0
  return items.value
    .filter(item => item.value > 0)
    .map((item) => {
      const sweep = item.value / props.summary.total * 360
      const end = start + sweep
      const from = point(start)
      const to = point(end)
      const path = sweep >= 359.9
        ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius} Z`
        : `M ${center} ${center} L ${from.x} ${from.y} A ${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 1 ${to.x} ${to.y} Z`
      const mid = start + sweep / 2
      start = end
      return { ...item, path, mid, share: percent(item.value) }
    })
})
const labelStyle = (mid: number) => {
  const rad = mid * Math.PI / 180
  return { left: `${50 + 30 * Math.sin(rad)}%`, top: `${50 - 30 * Math.cos(rad)}%` }
}
</script>

<template>
  <UiCard aria-labelledby="student-placement-summary-title">
    <div>
      <h3 id="student-placement-summary-title" class="text-lg font-bold text-ink">สรุปสถานะการยืนยันสถานประกอบการ</h3>
      <p class="mt-1 text-sm text-muted">{{ cycleLabel }} · นักศึกษาทั้งหมด {{ summary.total }} คน แต่ละคนถูกนับในสถานะเดียว</p>
    </div>
    <div v-if="summary.total" class="mt-5 flex justify-center">
      <div class="relative size-72 sm:size-80" role="img" :aria-label="`นักศึกษาทั้งหมด ${summary.total} คน ยืนยันแล้ว ${summary.confirmed} คน ยังไม่ยืนยัน ${summary.pending} คน ยังไม่ดำเนินการ ${summary.notStarted} คน`">
        <svg class="size-full" viewBox="0 0 176 176" aria-hidden="true">
          <path v-for="wedge in wedges" :key="wedge.key" :d="wedge.path" fill="currentColor" stroke="white" stroke-width="2" stroke-linejoin="round" :class="wedge.color" />
        </svg>
        <div class="pointer-events-none absolute inset-0">
          <div v-for="wedge in wedges" :key="wedge.key" class="absolute w-24 -translate-x-1/2 -translate-y-1/2 text-center" :class="wedge.labelClass" :style="labelStyle(wedge.mid)">
            <p class="text-xs font-medium leading-4">{{ wedge.label }}</p>
            <p class="mt-1 text-base font-bold">{{ wedge.value }} คน<span class="ml-1 text-xs font-semibold opacity-80">{{ wedge.share }}%</span></p>
          </div>
        </div>
      </div>
    </div>
    <AppEmptyState v-else title="ยังไม่มีนักศึกษาในรอบนี้" description="เมื่อเพิ่มนักศึกษาเข้ารอบ กราฟจะแสดงสัดส่วนตามสถานะการยืนยันสถานประกอบการ" />
  </UiCard>
</template>
