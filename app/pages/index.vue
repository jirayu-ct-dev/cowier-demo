<script setup lang="ts">
import { ArrowDown, ArrowUp, Building2, CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, RotateCcw, Search, Users, X } from '@lucide/vue'
import type { Component } from 'vue'
import { getPageCount, paginateItems } from '~/utils/table'

definePageMeta({ title: 'หน้าหลัก' })
useHead({ title: 'หน้าหลัก' })

const { scenario } = useScenario()
const { cycles, selectedCycle } = useCoopCycles()
const roleLabel = computed(() => ({ staff: 'เจ้าหน้าที่', lecturer: 'อาจารย์', student: 'นักศึกษา' }[scenario.value.role]))

type DashboardTone = 'neutral' | 'warning' | 'info' | 'success' | 'danger'

interface DashboardData {
  summary: Array<{ label: string, value: string, hint: string, icon: Component }>
  recentTitle: string
  primaryLabel: string
  secondaryLabel: string
  recentItems: Array<{ id: string, primary: string, secondary: string, status: string, tone: DashboardTone }>
}

const currentCycleDashboard: { staff: DashboardData, lecturer: DashboardData, student: DashboardData } = {
  staff: {
    summary: [
      { label: 'นักศึกษาในรอบ', value: '248', hint: 'ยืนยันสถานประกอบการแล้ว 201 คน', icon: Users },
      { label: 'ยืนยันสถานประกอบการแล้ว', value: '201', hint: 'คิดเป็น 81% ของนักศึกษาในรอบ', icon: Building2 },
      { label: 'รอมอบหมายกลุ่มนิเทศ', value: '6', hint: 'สถานประกอบการที่ยังไม่มีกลุ่มอาจารย์รับผิดชอบ', icon: ClipboardCheck },
      { label: 'กลุ่มอาจารย์นิเทศ', value: '18', hint: 'ครอบคลุม 74 สถานประกอบการ', icon: CalendarDays },
    ],
    recentTitle: 'สถานะนักศึกษาในรอบ',
    primaryLabel: 'นักศึกษา',
    secondaryLabel: 'สถานประกอบการ',
    recentItems: [
      { id: 'STU-66010041', primary: 'นายธนกฤต พูนทรัพย์', secondary: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', status: 'ยังไม่เริ่มปฏิบัติงาน', tone: 'warning' },
      { id: 'STU-66010040', primary: 'นางสาวปภาวดี นาคแก้ว', secondary: 'บริษัท ไอทีโซลูชัน จำกัด', status: 'กำลังปฏิบัติงาน', tone: 'info' },
      { id: 'STU-66010039', primary: 'นายณัฐวุฒิ ทองดี', secondary: 'โรงพยาบาลบุรีรัมย์', status: 'ปฏิบัติงานเสร็จแล้ว', tone: 'success' },
    ],
  },
  lecturer: {
    summary: [
      { label: 'คำร้องรอตรวจ', value: '12', hint: 'อาจารย์ทุกคนสามารถเปิดตรวจได้', icon: ClipboardCheck },
      { label: 'หนังสือตอบกลับรอตรวจ', value: '5', hint: 'รอยืนยันผลรายบุคคล', icon: Building2 },
      { label: 'รายการนิเทศที่รับผิดชอบ', value: '6', hint: 'ครั้งที่ 1 จำนวน 4 รายการ', icon: CalendarDays },
      { label: 'งานประเมินค้าง', value: '4', hint: 'จากนักศึกษาที่นิเทศเสร็จแล้ว', icon: Users },
    ],
    recentTitle: 'งานที่ต้องดำเนินการ',
    primaryLabel: 'นักศึกษา / สถานประกอบการ',
    secondaryLabel: 'รายละเอียดงาน',
    recentItems: [
      { id: 'REQ-0269-041', primary: 'นายธนกฤต พูนทรัพย์', secondary: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', status: 'รอตรวจคำร้อง', tone: 'warning' },
      { id: 'REQ-0269-037', primary: 'นางสาวปภาวดี นาคแก้ว', secondary: 'บริษัท ไอทีโซลูชัน จำกัด', status: 'รอตรวจหนังสือตอบกลับ', tone: 'info' },
      { id: 'SUP-0269-014', primary: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', secondary: '2 ก.ย. 2569 · ช่วงเช้า', status: 'รอการนิเทศ', tone: 'info' },
    ],
  },
  student: {
    summary: [
      { label: 'สถานะคำร้อง', value: 'ยืนยันแล้ว', hint: 'หนังสือตอบกลับได้รับการตรวจแล้ว', icon: ClipboardCheck },
      { label: 'สถานที่ฝึกงาน', value: 'ยืนยันแล้ว', hint: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', icon: Building2 },
      { label: 'สถานะการปฏิบัติงาน', value: 'ยังไม่เริ่ม', hint: 'เปลี่ยนโดยเจ้าหน้าที่และไม่เปลี่ยนตามวันที่อัตโนมัติ', icon: Users },
      { label: 'นัดนิเทศถัดไป', value: 'ยังไม่มี', hint: 'จะแสดงเมื่ออาจารย์เผยแพร่ตารางนิเทศ', icon: CalendarDays },
    ],
    recentTitle: 'ความคืบหน้าของฉัน',
    primaryLabel: 'รายการ',
    secondaryLabel: 'รายละเอียด',
    recentItems: [
      { id: 'REQ-0269-018', primary: 'คำร้องสถานประกอบการ', secondary: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', status: 'ยืนยันแล้ว', tone: 'success' },
      { id: 'WORK-0269-018', primary: 'การปฏิบัติงาน', secondary: 'รอถึงช่วงฝึกงานและการอัปเดตสถานะจากเจ้าหน้าที่', status: 'ยังไม่เริ่มปฏิบัติงาน', tone: 'warning' },
    ],
  },
}

const emptyStaffDashboard = (studentCount: string, studentHint: string): DashboardData => ({
  summary: [
    { label: 'นักศึกษาในรอบ', value: studentCount, hint: studentHint, icon: Users },
    { label: 'ยืนยันสถานประกอบการแล้ว', value: '0', hint: 'ยังไม่มีการยืนยันสถานประกอบการ', icon: Building2 },
    { label: 'รอมอบหมายกลุ่มนิเทศ', value: '0', hint: 'ไม่มีสถานประกอบการรอมอบหมายกลุ่มอาจารย์', icon: ClipboardCheck },
    { label: 'กลุ่มอาจารย์นิเทศ', value: '0', hint: 'จะเริ่มจัดหลังยืนยันสถานที่ฝึกงาน', icon: CalendarDays },
  ],
  recentTitle: 'สถานะนักศึกษาในรอบ', primaryLabel: 'นักศึกษา', secondaryLabel: 'สถานประกอบการ', recentItems: [],
})

const emptyLecturerDashboard: DashboardData = {
  summary: [
    { label: 'คำร้องรอตรวจ', value: '0', hint: 'รอบยังไม่เปิดรับคำร้อง', icon: ClipboardCheck },
    { label: 'หนังสือตอบกลับรอตรวจ', value: '0', hint: 'ยังไม่มีเอกสารตอบกลับ', icon: Building2 },
    { label: 'รายการนิเทศที่รับผิดชอบ', value: '0', hint: 'ยังไม่มีการมอบหมาย', icon: CalendarDays },
    { label: 'งานประเมินค้าง', value: '0', hint: 'ยังไม่เริ่มการนิเทศ', icon: Users },
  ],
  recentTitle: 'งานที่ต้องดำเนินการ', primaryLabel: 'นักศึกษา / สถานประกอบการ', secondaryLabel: 'รายละเอียดงาน', recentItems: [],
}

const dashboardByCycle: Record<string, { staff: DashboardData, lecturer: DashboardData }> = {
  'CYCLE-2569-2': { staff: currentCycleDashboard.staff, lecturer: currentCycleDashboard.lecturer },
  'CYCLE-2569-SUMMER': { staff: emptyStaffDashboard('42', 'เตรียมข้อมูลก่อนเปิดรับคำร้อง'), lecturer: emptyLecturerDashboard },
  'CYCLE-2570-1': { staff: emptyStaffDashboard('0', 'ยังไม่ได้เพิ่มนักศึกษาเข้ารอบ'), lecturer: emptyLecturerDashboard },
}

const canSelectDashboardCycle = computed(() => scenario.value.role === 'staff' || scenario.value.role === 'lecturer')
const dashboardCycleId = ref(selectedCycle.value.id)
const cycleOptions = cycles.map(cycle => ({ value: cycle.id, label: `${cycle.label} · ${cycle.cohort}` }))
const dashboardCycle = computed(() => canSelectDashboardCycle.value
  ? cycles.find(cycle => cycle.id === dashboardCycleId.value) ?? selectedCycle.value
  : selectedCycle.value)
const dashboard = computed<DashboardData>(() => {
  if (scenario.value.role === 'student') return currentCycleDashboard.student
  return dashboardByCycle[dashboardCycle.value.id]?.[scenario.value.role] ?? emptyLecturerDashboard
})
const summaryGridClass = 'xl:grid-cols-4'
const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)
const search = ref('')
const status = ref('all')
const sortDirection = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const pageSize = ref('10')
const pageSizeOptions = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
]
const summary = computed(() => scenario.value.dataSet === 'edge'
  ? dashboard.value.summary.map(item => ({ ...item, value: '0', hint: 'ยังไม่มีข้อมูลสำหรับกรณีนี้' }))
  : dashboard.value.summary.map(item => scenario.value.dataSet === 'long'
      ? { ...item, hint: `${item.hint} · ข้อความตัวอย่างแบบยาวสำหรับตรวจสอบการตัดบรรทัดและความยืดหยุ่นของพื้นที่แสดงผลบนหน้าจอขนาดต่าง ๆ` }
      : item))
const statusOptions = computed(() => [
  { value: 'all', label: 'ทุกสถานะ' },
  ...[...new Set(dashboard.value.recentItems.map(item => item.status))]
    .map(itemStatus => ({ value: itemStatus, label: itemStatus })),
])
const filteredRecentItems = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase('th')
  return dashboard.value.recentItems
    .filter(item => status.value === 'all' || item.status === status.value)
    .filter(item => !keyword || [item.id, item.primary, item.secondary, item.status]
      .some(value => value.toLocaleLowerCase('th').includes(keyword)))
    .toSorted((a, b) => {
      const comparison = a.id.localeCompare(b.id, 'th', { numeric: true })
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
})
const pageSizeNumber = computed(() => Number(pageSize.value))
const pageCount = computed(() => getPageCount(filteredRecentItems.value.length, pageSizeNumber.value))
const paginatedRecentItems = computed(() => paginateItems(filteredRecentItems.value, currentPage.value, pageSizeNumber.value))
const resultStart = computed(() => filteredRecentItems.value.length ? (currentPage.value - 1) * pageSizeNumber.value + 1 : 0)
const resultEnd = computed(() => Math.min(currentPage.value * pageSizeNumber.value, filteredRecentItems.value.length))
const hasActiveFilters = computed(() => Boolean(search.value) || status.value !== 'all')
const activeStatusLabel = computed(() => statusOptions.value.find(option => option.value === status.value)?.label)

let retryTimer: number | undefined

const clearFilters = () => {
  search.value = ''
  status.value = 'all'
}
const resetTable = () => {
  clearFilters()
  sortDirection.value = 'desc'
  pageSize.value = '10'
  currentPage.value = 1
}
const toggleItemSort = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  currentPage.value = 1
}
const retry = () => {
  scenario.value.viewState = 'loading'
  retryTimer = window.setTimeout(() => {
    scenario.value.forceError = false
    scenario.value.viewState = 'data'
  }, scenario.value.networkDelay === 'slow' ? 1500 : 650)
}

watch([search, status, pageSize], () => {
  currentPage.value = 1
})
watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count
})
watch(() => scenario.value.role, () => {
  dashboardCycleId.value = selectedCycle.value.id
  resetTable()
})
watch(dashboardCycleId, resetTable)

onBeforeUnmount(() => {
  if (retryTimer) window.clearTimeout(retryTimer)
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p class="text-sm font-medium text-warning">{{ dashboardCycle.label }}</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">สวัสดี {{ scenario.userName }}</h2>
        <p class="mt-1 text-sm text-muted">มุมมองสำหรับ{{ roleLabel }} · สรุปข้อมูลตามรอบสหกิจศึกษา</p>
      </div>
      <div class="flex w-full flex-col gap-2 sm:w-auto sm:min-w-72">
        <UiSelect
          v-if="canSelectDashboardCycle"
          v-model="dashboardCycleId"
          :options="cycleOptions"
          label="รอบสหกิจศึกษา"
        />
        <div class="flex justify-start sm:justify-end">
          <UiBadge :tone="cycleStatusMeta[dashboardCycle.status].tone">
            {{ cycleStatusMeta[dashboardCycle.status].label }}
          </UiBadge>
        </div>
      </div>
    </div>

    <CycleContextPanel class="mb-6" :cycle="dashboardCycle" />

    <template v-if="effectiveViewState === 'loading'">
      <div class="grid gap-4 sm:grid-cols-2" :class="summaryGridClass" aria-label="กำลังโหลดหน้าหลัก">
        <UiCard v-for="index in dashboard.summary.length" :key="index">
          <UiSkeleton class="h-4 w-28" />
          <UiSkeleton class="mt-5 h-9 w-16" />
          <UiSkeleton class="mt-3 h-3 w-40" />
        </UiCard>
      </div>
      <UiCard class="mt-6">
        <UiSkeleton class="h-6 w-44" />
        <UiSkeleton v-for="index in 3" :key="index" class="mt-5 h-14 w-full" />
      </UiCard>
    </template>

    <AppEmptyState
      v-else-if="effectiveViewState === 'empty'"
      title="ยังไม่มีรายการในรอบนี้"
      description="เมื่อมีนักศึกษาส่งคำร้องหรือมีตารางนิเทศ รายการสรุปจะแสดงที่นี่"
    />
    <AppErrorState v-else-if="effectiveViewState === 'error'" @retry="retry" />

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2" :class="summaryGridClass">
        <UiCard v-for="item in summary" :key="item.label">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-medium text-muted">{{ item.label }}</p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-ink">{{ item.value }}</p>
            </div>
            <div class="grid size-10 place-items-center rounded-control bg-warning-soft text-warning">
              <component :is="item.icon" :size="20" aria-hidden="true" />
            </div>
          </div>
          <p class="mt-4 text-xs leading-5 text-muted">{{ item.hint }}</p>
        </UiCard>
      </div>

      <UiCard class="mt-6" :padded="false">
        <div class="border-b border-divider p-5 sm:p-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 class="text-lg font-bold text-ink">{{ dashboard.recentTitle }}</h3>
              <p class="mt-1 text-sm leading-6 text-muted">รายการล่าสุดของ{{ roleLabel }}ใน {{ dashboardCycle.label }}</p>
            </div>
            <span class="text-xs font-medium text-muted">{{ dashboard.recentItems.length }} รายการล่าสุด</span>
          </div>

          <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <label class="block w-full text-sm font-semibold text-ink sm:max-w-sm lg:w-96 lg:flex-none">
              <span class="sr-only">ค้นหารายการล่าสุด</span>
              <span class="relative block">
                <Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input v-model="search" type="search" class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 font-normal placeholder:text-gray-400" placeholder="ค้นหาเลขที่รายการหรือข้อมูลสำคัญ">
              </span>
            </label>
            <div class="flex flex-wrap items-center justify-end gap-2 lg:ml-auto lg:flex-nowrap">
              <div class="w-full sm:w-48">
                <UiSelect v-model="status" :options="statusOptions" label="กรองตามสถานะ" :label-visible="false" />
              </div>
              <button type="button" class="inline-grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-ink transition-colors hover:bg-surface" aria-label="รีเซ็ตตาราง" title="รีเซ็ตตาราง" @click="resetTable">
                <RotateCcw :size="18" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div v-if="hasActiveFilters" class="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span class="text-muted">ตัวกรองที่ใช้:</span>
            <span v-if="search" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">คำค้น “{{ search }}”</span>
            <span v-if="status !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ activeStatusLabel }}</span>
            <button type="button" class="inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-semibold text-warning hover:bg-warning-soft" @click="clearFilters"><X :size="15" aria-hidden="true" />ล้างทั้งหมด</button>
          </div>
        </div>

        <div v-if="!paginatedRecentItems.length" class="p-5 sm:p-6">
          <AppEmptyState
            :title="hasActiveFilters ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีรายการในรอบนี้'"
            :description="hasActiveFilters ? 'ลองเปลี่ยนคำค้นหรือล้างตัวกรองที่ใช้อยู่' : 'เมื่อมีข้อมูล รายการล่าสุดจะแสดงที่นี่'"
          >
            <UiButton v-if="hasActiveFilters" variant="secondary" @click="clearFilters">ล้างตัวกรอง</UiButton>
          </AppEmptyState>
        </div>

        <template v-else>
          <div class="hidden overflow-x-auto md:block">
            <table class="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption class="sr-only">{{ dashboard.recentTitle }}</caption>
              <thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase">
                <tr>
                  <th scope="col" class="px-6 py-3" :aria-sort="sortDirection === 'asc' ? 'ascending' : 'descending'">
                    <button type="button" class="inline-flex items-center gap-1 font-semibold hover:text-ink" :aria-label="`เรียงเลขที่รายการ${sortDirection === 'asc' ? 'จากมากไปน้อย' : 'จากน้อยไปมาก'}`" @click="toggleItemSort">
                      เลขที่รายการ
                      <ArrowUp v-if="sortDirection === 'asc'" :size="15" aria-hidden="true" />
                      <ArrowDown v-else :size="15" aria-hidden="true" />
                    </button>
                  </th>
                  <th scope="col" class="px-4 py-3">{{ dashboard.primaryLabel }}</th>
                  <th scope="col" class="px-4 py-3">{{ dashboard.secondaryLabel }}</th>
                  <th scope="col" class="px-4 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-divider">
                <tr v-for="item in paginatedRecentItems" :key="item.id" class="transition-colors hover:bg-surface/70">
                  <td class="px-6 py-4 font-semibold text-ink">{{ item.id }}</td>
                  <td class="px-4 py-4 text-ink">{{ item.primary }}</td>
                  <td class="px-4 py-4 text-muted">{{ item.secondary }}</td>
                  <td class="px-4 py-4"><UiBadge :tone="item.tone">{{ item.status }}</UiBadge></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="divide-y divide-divider md:hidden">
            <article v-for="item in paginatedRecentItems" :key="item.id" class="p-5">
              <div class="flex items-start justify-between gap-3">
                <p class="text-sm font-semibold text-ink">{{ item.primary }}</p>
                <UiBadge :tone="item.tone">{{ item.status }}</UiBadge>
              </div>
              <p class="mt-2 text-sm text-muted">{{ item.secondary }}</p>
              <p class="mt-3 text-xs font-medium text-muted">{{ item.id }}</p>
            </article>
          </div>

          <div class="flex flex-col gap-3 border-t border-divider px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div class="flex items-center gap-3">
              <p class="whitespace-nowrap text-muted">แสดง {{ resultStart }}–{{ resultEnd }} จาก {{ filteredRecentItems.length }} รายการ</p>
              <div class="w-20 shrink-0"><UiSelect v-model="pageSize" :options="pageSizeOptions" label="จำนวนรายการต่อหน้า" :label-visible="false" /></div>
            </div>
            <nav class="flex items-center gap-2" aria-label="การแบ่งหน้าตาราง">
              <button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:cursor-not-allowed disabled:opacity-45" :disabled="currentPage === 1" aria-label="หน้าก่อนหน้า" @click="currentPage--"><ChevronLeft :size="18" aria-hidden="true" /></button>
              <span class="min-w-20 text-center font-semibold text-ink">หน้า {{ currentPage }} / {{ pageCount }}</span>
              <button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:cursor-not-allowed disabled:opacity-45" :disabled="currentPage === pageCount" aria-label="หน้าถัดไป" @click="currentPage++"><ChevronRight :size="18" aria-hidden="true" /></button>
            </nav>
          </div>
        </template>
      </UiCard>
    </template>
  </div>
</template>
