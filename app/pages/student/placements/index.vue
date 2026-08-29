<script setup lang="ts">
import { ArrowDown, ArrowUp, Building2, ChevronLeft, ChevronRight, Eye, FilePlus2, RotateCcw, Search, X } from '@lucide/vue'
import { getPageCount, paginateItems } from '~/utils/table'

definePageMeta({ title: 'คำร้องของฉัน', middleware: 'student-prototype' })
useHead({ title: 'คำร้องของฉัน' })

const { scenario } = useScenario()
const { selectedCycle } = useCoopCycles()
const { cycleRequests, activeRequest, confirmedRequest, confirmedCompany, findCompany } = useStudentPlacements()

const search = ref('')
const status = ref('all')
const sortDirection = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const pageSize = ref('10')
const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)
const canCreateRequest = computed(() => selectedCycle.value.status === 'open' && !activeRequest.value)

const statusOptions = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'editable', label: 'แก้ไขได้' },
  { value: 'waiting', label: 'อยู่ระหว่างดำเนินการ' },
  { value: 'cancelled', label: 'ยกเลิกแล้ว' },
]
const pageSizeOptions = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
]

const filteredRequests = computed(() => {
  if (scenario.value.viewState === 'empty') return []
  const keyword = search.value.trim().toLocaleLowerCase('th')
  return cycleRequests.value
    .filter((request) => {
      const company = findCompany(request.companyId)
      const matchesSearch = !keyword || [request.id, request.position, company?.name, company?.branch]
        .some(value => value?.toLocaleLowerCase('th').includes(keyword))
      const matchesStatus = status.value === 'all'
        || (status.value === 'editable' && ['draft', 'submitted', 'returned'].includes(request.status))
        || (status.value === 'waiting' && ['batched', 'letter-issued'].includes(request.status))
        || (status.value === 'cancelled' && request.status === 'cancelled')
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const comparison = a.appliedAt.localeCompare(b.appliedAt)
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
})

const pageSizeNumber = computed(() => Number(pageSize.value))
const pageCount = computed(() => getPageCount(filteredRequests.value.length, pageSizeNumber.value))
const paginatedRequests = computed(() => paginateItems(filteredRequests.value, currentPage.value, pageSizeNumber.value))
const resultStart = computed(() => filteredRequests.value.length ? (currentPage.value - 1) * pageSizeNumber.value + 1 : 0)
const resultEnd = computed(() => Math.min(currentPage.value * pageSizeNumber.value, filteredRequests.value.length))
const hasActiveFilters = computed(() => Boolean(search.value) || status.value !== 'all')
const activeStatusLabel = computed(() => statusOptions.find(option => option.value === status.value)?.label)

watch([search, status, pageSize], () => {
  currentPage.value = 1
})
watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count
})

const toggleDateSort = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  currentPage.value = 1
}
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
const retry = () => {
  scenario.value.forceError = false
  scenario.value.viewState = 'data'
}
const formatDate = (date: string) => new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(`${date}T00:00:00+07:00`))
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">ข้อมูลที่ฝึกงานของฉัน</h2>
      <p class="mt-1 text-sm leading-6 text-muted">ติดตามข้อมูลที่ส่งให้ผู้รับผิดชอบจัดทำหนังสือขอฝึกงาน และดูประวัติในรอบปัจจุบัน</p>
    </div>

    <UiCard class="mb-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex items-start gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-control bg-info-soft text-info">
            <Building2 :size="20" aria-hidden="true" />
          </span>
          <div>
            <h3 class="font-semibold text-ink">สถานะการปฏิบัติงานของฉัน</h3>
            <p class="mt-1 text-sm text-muted">
              {{ confirmedCompany ? `${confirmedCompany.name} · ${confirmedCompany.branch}` : 'ยังไม่มีสถานประกอบการที่ยืนยันในรอบนี้' }}
            </p>
          </div>
        </div>
        <UiBadge v-if="confirmedRequest?.workStatus" :tone="workStatusMeta[confirmedRequest.workStatus].tone">
          {{ workStatusMeta[confirmedRequest.workStatus].label }}
        </UiBadge>
        <UiBadge v-else tone="neutral">รอยืนยันสถานประกอบการ</UiBadge>
      </div>
      <p class="mt-4 border-t border-divider pt-4 text-xs leading-5 text-muted">
        สถานะการปฏิบัติงานเป็นข้อมูลของรอบนี้และไม่เปลี่ยนอัตโนมัติตามวันที่ ตารางนิเทศ หรือผลประเมิน
      </p>
    </UiCard>

    <UiCard :padded="false">
      <div class="border-b border-divider p-5 sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 class="text-lg font-bold text-ink">รายการคำร้องของฉัน</h3>
            <p class="mt-1 text-sm leading-6 text-muted">นักศึกษามีคำร้องที่กำลังดำเนินการได้ครั้งละหนึ่งรายการต่อรอบ</p>
          </div>
          <UiButton v-if="activeRequest" class="shrink-0" :icon="Eye" @click="navigateTo(`/student/placements/${activeRequest.id}`)">ดูคำร้องปัจจุบัน</UiButton>
          <UiButton v-else-if="canCreateRequest" class="shrink-0" :icon="FilePlus2" @click="navigateTo('/student/placements/new')">แจ้งข้อมูลที่ฝึกงาน</UiButton>
          <UiButton v-else class="shrink-0" variant="secondary" disabled>รอบยังไม่เปิดรับคำร้อง</UiButton>
        </div>

        <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label class="block w-full text-sm font-semibold text-ink sm:max-w-sm lg:w-96 lg:flex-none">
            <span class="sr-only">ค้นหาคำร้อง</span>
            <span class="relative block">
              <Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input v-model="search" type="search" class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 font-normal placeholder:text-gray-400" placeholder="ค้นหาเลขที่คำร้อง บริษัท หรือตำแหน่ง">
            </span>
          </label>
          <div class="flex flex-wrap items-center justify-end gap-2 lg:ml-auto lg:flex-nowrap">
            <div class="w-full sm:w-56">
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

      <div v-if="effectiveViewState === 'loading'" class="space-y-3 p-5 sm:p-6" aria-label="กำลังโหลดรายการคำร้อง">
        <div v-for="row in 4" :key="row" class="grid grid-cols-[1fr_1fr_8rem_9rem_2rem] gap-4 max-md:grid-cols-[1fr_7rem]">
          <UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" />
        </div>
      </div>
      <div v-else-if="effectiveViewState === 'error'" class="p-5 sm:p-6">
        <AppErrorState title="โหลดรายการคำร้องไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองดึงข้อมูลอีกครั้ง" @retry="retry" />
      </div>
      <div v-else-if="scenario.viewState === 'empty' || !paginatedRequests.length" class="p-5 sm:p-6">
        <AppEmptyState :title="hasActiveFilters ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีคำร้องในรอบนี้'" :description="hasActiveFilters ? 'ลองเปลี่ยนคำค้นหรือล้างตัวกรองที่ใช้อยู่' : 'เริ่มค้นหาและเลือกสถานประกอบการที่ต้องการฝึกงาน แล้วกรอกข้อมูลสำหรับออกหนังสือ'">
          <UiButton v-if="hasActiveFilters" variant="secondary" @click="clearFilters">ล้างตัวกรอง</UiButton>
          <UiButton v-else-if="canCreateRequest" :icon="FilePlus2" @click="navigateTo('/student/placements/new')">แจ้งข้อมูลที่ฝึกงาน</UiButton>
        </AppEmptyState>
      </div>

      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[900px] border-collapse text-left text-sm">
            <caption class="sr-only">รายการคำร้องขอฝึกงานของฉัน</caption>
            <thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" class="px-6 py-3">เลขที่คำร้อง</th>
                <th scope="col" class="px-4 py-3">สถานประกอบการ / ตำแหน่ง</th>
                <th scope="col" class="px-4 py-3" :aria-sort="sortDirection === 'asc' ? 'ascending' : 'descending'">
                  <button type="button" class="inline-flex items-center gap-1 font-semibold hover:text-ink" :aria-label="`เรียงวันที่สมัคร${sortDirection === 'asc' ? 'จากใหม่ไปเก่า' : 'จากเก่าไปใหม่'}`" @click="toggleDateSort">
                    วันที่สมัคร
                    <ArrowUp v-if="sortDirection === 'asc'" :size="15" aria-hidden="true" />
                    <ArrowDown v-else :size="15" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" class="px-4 py-3">สถานะ / ขั้นตอนถัดไป</th>
                <th scope="col" class="w-24 px-4 py-3 text-right">การทำงาน</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider">
              <tr v-for="request in paginatedRequests" :key="request.id" class="transition-colors hover:bg-surface/70">
                <td class="whitespace-nowrap px-6 py-4 font-semibold text-ink">{{ request.id }}</td>
                <td class="max-w-sm px-4 py-4"><p class="font-medium text-ink">{{ findCompany(request.companyId)?.name }}</p><p class="mt-1 text-xs text-muted">{{ findCompany(request.companyId)?.branch }} · {{ request.position }}</p></td>
                <td class="whitespace-nowrap px-4 py-4 text-muted">{{ formatDate(request.appliedAt) }}</td>
                <td class="max-w-xs px-4 py-4"><UiBadge :tone="placementStatusMeta[request.status].tone">{{ placementStatusMeta[request.status].label }}</UiBadge><p class="mt-1.5 text-xs leading-5 text-muted">{{ placementStatusMeta[request.status].nextStep }}</p></td>
                <td class="px-4 py-4 text-right">
                  <NuxtLink :to="`/student/placements/${request.id}`" class="inline-grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink" :aria-label="`ดูรายละเอียด ${request.id}`" title="ดูรายละเอียด"><Eye :size="15" aria-hidden="true" /></NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-divider md:hidden">
          <article v-for="request in paginatedRequests" :key="request.id" class="p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0"><p class="truncate font-semibold text-ink">{{ findCompany(request.companyId)?.name }}</p><p class="mt-1 text-sm text-muted">{{ request.position }}</p></div>
              <UiBadge :tone="placementStatusMeta[request.status].tone">{{ placementStatusMeta[request.status].label }}</UiBadge>
            </div>
            <p class="mt-3 text-xs leading-5 text-muted">{{ placementStatusMeta[request.status].nextStep }}</p>
            <div class="mt-4 flex items-center justify-between gap-3 border-t border-divider pt-3">
              <div class="text-xs text-muted"><p>{{ request.id }}</p><p class="mt-0.5">{{ formatDate(request.appliedAt) }}</p></div>
              <UiButton size="sm" variant="secondary" :icon="Eye" @click="navigateTo(`/student/placements/${request.id}`)">ดูรายละเอียด</UiButton>
            </div>
          </article>
        </div>

        <div class="flex flex-col gap-3 border-t border-divider px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div class="flex items-center gap-3">
            <p class="whitespace-nowrap text-muted">แสดง {{ resultStart }}–{{ resultEnd }} จาก {{ filteredRequests.length }} รายการ</p>
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
  </div>
</template>
