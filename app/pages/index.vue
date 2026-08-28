<script setup lang="ts">
import { ArrowDown, ArrowUp, Building2, CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, RotateCcw, Search, Users, X } from '@lucide/vue'
import { getPageCount, paginateItems } from '~/utils/table'

definePageMeta({ title: 'หน้าหลัก' })
useHead({ title: 'หน้าหลัก' })

const { scenario } = useScenario()
const roleLabel = computed(() => ({ staff: 'เจ้าหน้าที่', lecturer: 'อาจารย์นิเทศ', student: 'นักศึกษา' }[scenario.value.role]))

const dashboardByRole = {
  staff: {
    summary: [
      { label: 'คำร้องรอตรวจสอบ', value: '12', hint: 'เพิ่มขึ้น 3 รายการวันนี้', icon: ClipboardCheck },
      { label: 'นักศึกษาในรอบ', value: '248', hint: 'ยืนยันสถานประกอบการแล้ว 81%', icon: Users },
      { label: 'สถานประกอบการ', value: '96', hint: 'มีรายการใหม่รอตรวจ 2 แห่ง', icon: Building2 },
      { label: 'ตารางนิเทศเดือนนี้', value: '18', hint: 'มีรายการต้องจัดเวลา 4 รายการ', icon: CalendarDays },
    ],
    recentTitle: 'คำร้องล่าสุด',
    primaryLabel: 'นักศึกษา',
    secondaryLabel: 'สถานประกอบการ',
    recentItems: [
      { id: 'REQ-0269-041', primary: 'นายธนกฤต พูนทรัพย์', secondary: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', status: 'รอตรวจสอบ', tone: 'warning' as const },
      { id: 'REQ-0269-040', primary: 'นางสาวปภาวดี นาคแก้ว', secondary: 'บริษัท ไอทีโซลูชัน จำกัด', status: 'รอออกหนังสือ', tone: 'info' as const },
      { id: 'REQ-0269-039', primary: 'นายณัฐวุฒิ ทองดี', secondary: 'โรงพยาบาลบุรีรัมย์', status: 'ยืนยันแล้ว', tone: 'success' as const },
    ],
  },
  lecturer: {
    summary: [
      { label: 'รายการนิเทศที่รับผิดชอบ', value: '6', hint: 'ครั้งที่ 1 จำนวน 4 รายการ', icon: CalendarDays },
      { label: 'นักศึกษาที่เกี่ยวข้อง', value: '18', hint: 'จาก 7 สถานประกอบการ', icon: Users },
      { label: 'งานประเมินค้าง', value: '4', hint: 'ควรดำเนินการหลังนิเทศเสร็จ', icon: ClipboardCheck },
      { label: 'นัดถัดไป', value: '2 ก.ย.', hint: 'ช่วงเช้า · บริษัท บุรีรัมย์ดิจิทัล', icon: Building2 },
    ],
    recentTitle: 'ตารางนิเทศของฉัน',
    primaryLabel: 'สถานประกอบการ',
    secondaryLabel: 'วันและช่วงเวลา',
    recentItems: [
      { id: 'SUP-0269-014', primary: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', secondary: '2 ก.ย. 2569 · ช่วงเช้า', status: 'รอการนิเทศ', tone: 'info' as const },
      { id: 'SUP-0269-011', primary: 'โรงพยาบาลบุรีรัมย์', secondary: '5 ก.ย. 2569 · ช่วงบ่าย', status: 'รอการนิเทศ', tone: 'info' as const },
    ],
  },
  student: {
    summary: [
      { label: 'คำร้องของฉัน', value: '2', hint: 'มี 1 รายการรอเจ้าหน้าที่ตรวจสอบ', icon: ClipboardCheck },
      { label: 'สถานที่ฝึกงาน', value: '1', hint: 'ยืนยันแล้ว 1 แห่ง', icon: Building2 },
      { label: 'นัดนิเทศของฉัน', value: '2', hint: 'ครั้งถัดไปวันที่ 2 ก.ย. 2569', icon: CalendarDays },
    ],
    recentTitle: 'คำร้องของฉัน',
    primaryLabel: 'สถานประกอบการ',
    secondaryLabel: 'ขั้นตอนถัดไป',
    recentItems: [
      { id: 'REQ-0269-018', primary: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', secondary: 'รอหนังสือขอฝึกงานจากเจ้าหน้าที่', status: 'รอออกหนังสือ', tone: 'info' as const },
      { id: 'REQ-0269-006', primary: 'บริษัท อีสานเทค จำกัด', secondary: 'ตรวจสอบเหตุผลที่ส่งกลับ', status: 'ต้องแก้ไข', tone: 'warning' as const },
    ],
  },
}

const dashboard = computed(() => dashboardByRole[scenario.value.role])
const summaryGridClass = computed(() => scenario.value.role === 'student' ? 'xl:grid-cols-3' : 'xl:grid-cols-4')
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
watch(() => scenario.value.role, resetTable)

onBeforeUnmount(() => {
  if (retryTimer) window.clearTimeout(retryTimer)
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm font-medium text-warning">{{ scenario.cycle }}</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">สวัสดี {{ scenario.userName }}</h2>
        <p class="mt-1 text-sm text-muted">มุมมองสำหรับ{{ roleLabel }} · ข้อมูลตัวอย่างเพื่อยืนยันรูปแบบ UI</p>
      </div>
      <UiBadge tone="success">รอบกำลังดำเนินการ</UiBadge>
    </div>

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
              <p class="mt-1 text-sm leading-6 text-muted">รายการล่าสุดตามขอบเขตของ{{ roleLabel }}</p>
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
          <AppEmptyState title="ไม่พบรายการที่ตรงกับตัวกรอง" description="ลองเปลี่ยนคำค้นหรือล้างตัวกรองที่ใช้อยู่">
            <UiButton variant="secondary" @click="clearFilters">ล้างตัวกรอง</UiButton>
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
