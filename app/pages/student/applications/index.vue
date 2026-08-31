<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from '@lucide/vue'
import { format } from 'date-fns'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { z } from 'zod'
import type { StudentApplication, StudentApplicationFormValue, TrackedApplicationStatus } from '~/composables/useStudentApplications'
import { getPageCount, paginateItems } from '~/utils/table'

definePageMeta({ title: 'ติดตามการสมัครสหกิจ', middleware: 'student-prototype' })
useHead({ title: 'ติดตามการสมัครสหกิจ' })

const { scenario } = useScenario()
const { showToast } = useToast()
const {
  currentStudentApplications: applications,
  addApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
} = useStudentApplications()

const searchQuery = ref('')
const statusFilter = ref('all')
const provinceFilter = ref('all')
const sortDirection = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const pageSize = ref('10')
const applicationDialogOpen = ref(false)
const statusDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editingId = ref<string | null>(null)
const selectedId = ref<string | null>(null)
const statusValue = ref<TrackedApplicationStatus>('submitted')

interface ApplicationFormErrors {
  companyName?: string
  position?: string
  province?: string
  appliedAt?: string
  status?: string
}

const today = format(new Date(), 'yyyy-MM-dd')
const emptyForm = (): StudentApplicationFormValue => ({
  companyName: '',
  position: '',
  province: '',
  appliedAt: today,
  status: 'submitted',
})
const form = reactive<StudentApplicationFormValue>(emptyForm())
const formErrors = reactive<ApplicationFormErrors>({})

const applicationSchema = z.object({
  companyName: z.string().trim().min(1, 'กรุณากรอกชื่อบริษัทหรือสถานประกอบการ'),
  position: z.string().trim().min(1, 'กรุณากรอกตำแหน่งที่สมัคร'),
  province: z.string().trim().min(1, 'กรุณาเลือกจังหวัด'),
  appliedAt: z.string().min(1, 'กรุณาเลือกวันที่สมัคร'),
  status: z.enum(['submitted', 'waiting-response', 'responded', 'waiting-interview', 'accepted', 'rejected']),
})

const statusOptions = [
  { value: 'all', label: 'ทุกสถานะ' },
  ...trackedApplicationStatusOptions,
]
const formStatusOptions = trackedApplicationStatusOptions
const provinceOptions = computed(() => [
  { value: 'all', label: 'ทุกจังหวัด' },
  ...[...new Set(applications.value.map(application => application.province))]
    .sort((a, b) => a.localeCompare(b, 'th'))
    .map(province => ({ value: province, label: province })),
])
const formProvinceOptions = [
  'กรุงเทพมหานคร',
  'ขอนแก่น',
  'ชลบุรี',
  'เชียงใหม่',
  'นครราชสีมา',
  'บุรีรัมย์',
  'สงขลา',
  'สุพรรณบุรี',
].map(province => ({ value: province, label: province }))
const pageSizeOptions = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
]

const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)
const visibleSource = computed(() => scenario.value.viewState === 'empty' ? [] : applications.value)
const summaryCards = computed(() => [
  { label: 'สมัครทั้งหมด', value: visibleSource.value.length, icon: Building2, tone: 'bg-surface text-ink' },
  { label: 'รอการตอบกลับ', value: visibleSource.value.filter(item => item.status === 'waiting-response').length, icon: Clock3, tone: 'bg-warning-soft text-warning' },
  { label: 'รอสัมภาษณ์', value: visibleSource.value.filter(item => item.status === 'waiting-interview').length, icon: CalendarClock, tone: 'bg-interview-soft text-interview' },
  { label: 'ผ่านการสมัคร', value: visibleSource.value.filter(item => item.status === 'accepted').length, icon: CircleCheck, tone: 'bg-success-soft text-success' },
  { label: 'ปฏิเสธ', value: visibleSource.value.filter(item => item.status === 'rejected').length, icon: CircleX, tone: 'bg-danger-soft text-danger' },
])
const filteredApplications = computed(() => {
  const keyword = searchQuery.value.trim().toLocaleLowerCase('th')
  return visibleSource.value
    .filter(application => !keyword || [application.companyName, application.position]
      .some(value => value.toLocaleLowerCase('th').includes(keyword)))
    .filter(application => statusFilter.value === 'all' || application.status === statusFilter.value)
    .filter(application => provinceFilter.value === 'all' || application.province === provinceFilter.value)
    .toSorted((a, b) => {
      const comparison = a.appliedAt.localeCompare(b.appliedAt)
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
})
const pageSizeNumber = computed(() => Number(pageSize.value))
const pageCount = computed(() => getPageCount(filteredApplications.value.length, pageSizeNumber.value))
const paginatedApplications = computed(() => paginateItems(filteredApplications.value, currentPage.value, pageSizeNumber.value))
const resultStart = computed(() => filteredApplications.value.length ? (currentPage.value - 1) * pageSizeNumber.value + 1 : 0)
const resultEnd = computed(() => Math.min(currentPage.value * pageSizeNumber.value, filteredApplications.value.length))
const hasActiveFilters = computed(() => Boolean(searchQuery.value.trim()) || statusFilter.value !== 'all' || provinceFilter.value !== 'all')
const activeStatusLabel = computed(() => statusOptions.find(option => option.value === statusFilter.value)?.label)
const selectedApplication = computed(() => applications.value.find(application => application.id === selectedId.value) ?? null)

watch([searchQuery, statusFilter, provinceFilter, pageSize], () => {
  currentPage.value = 1
})
watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count
})

const clearFormErrors = () => {
  Object.assign(formErrors, {
    companyName: undefined,
    position: undefined,
    province: undefined,
    appliedAt: undefined,
    status: undefined,
  })
}
const openAddDialog = () => {
  editingId.value = null
  Object.assign(form, emptyForm())
  clearFormErrors()
  applicationDialogOpen.value = true
}
const openEditDialog = (application: StudentApplication) => {
  editingId.value = application.id
  Object.assign(form, {
    companyName: application.companyName,
    position: application.position,
    province: application.province,
    appliedAt: application.appliedAt,
    status: application.status,
  })
  clearFormErrors()
  applicationDialogOpen.value = true
}
const openStatusDialog = (application: StudentApplication) => {
  selectedId.value = application.id
  statusValue.value = application.status
  statusDialogOpen.value = true
}
const openDeleteDialog = (application: StudentApplication) => {
  selectedId.value = application.id
  deleteDialogOpen.value = true
}

const submitApplication = () => {
  clearFormErrors()
  const result = applicationSchema.safeParse(form)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    formErrors.companyName = errors.companyName?.[0]
    formErrors.position = errors.position?.[0]
    formErrors.province = errors.province?.[0]
    formErrors.appliedAt = errors.appliedAt?.[0]
    formErrors.status = errors.status?.[0]
    return
  }

  try {
    if (editingId.value) {
      updateApplication(editingId.value, result.data)
      showToast({ title: 'แก้ไขข้อมูลการสมัครแล้ว', description: result.data.companyName })
    }
    else {
      addApplication(result.data)
      showToast({ title: 'เพิ่มการสมัครแล้ว', description: result.data.companyName })
    }
    applicationDialogOpen.value = false
  }
  catch {
    showToast({ title: 'บันทึกข้อมูลไม่สำเร็จ', description: 'กรุณาลองอีกครั้ง' })
  }
}
const submitStatus = () => {
  if (!selectedApplication.value) return
  try {
    updateApplicationStatus(selectedApplication.value.id, statusValue.value)
    showToast({
      title: 'อัปเดตสถานะแล้ว',
      description: `${selectedApplication.value.companyName} · ${trackedApplicationStatusMeta[statusValue.value].label}`,
    })
    statusDialogOpen.value = false
  }
  catch {
    showToast({ title: 'อัปเดตสถานะไม่สำเร็จ', description: 'กรุณาลองอีกครั้ง' })
  }
}
const confirmDelete = () => {
  if (!selectedApplication.value) return
  const companyName = selectedApplication.value.companyName
  try {
    deleteApplication(selectedApplication.value.id)
    showToast({ title: 'ลบรายการการสมัครแล้ว', description: companyName })
    selectedId.value = null
  }
  catch {
    showToast({ title: 'ลบรายการไม่สำเร็จ', description: 'กรุณาลองอีกครั้ง' })
  }
}
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  provinceFilter.value = 'all'
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
const toggleDateSort = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  currentPage.value = 1
}
const formatDate = (date: string) => new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(`${date}T00:00:00+07:00`))
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">ติดตามการสมัครสหกิจ</h2>
        <p class="mt-1 text-sm leading-6 text-muted">ติดตามและอัปเดตสถานะบริษัทที่คุณยื่นสมัครฝึกสหกิจ</p>
      </div>
      <UiButton class="shrink-0" :icon="Plus" @click="openAddDialog">เพิ่มการสมัคร</UiButton>
    </div>

    <div v-if="effectiveViewState === 'loading'" class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="กำลังโหลดสรุปการสมัคร">
      <UiCard v-for="item in 5" :key="item"><UiSkeleton class="h-20" /></UiCard>
    </div>
    <div v-else class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <UiCard v-for="card in summaryCards" :key="card.label" class="flex items-center gap-4">
        <span class="grid size-11 shrink-0 place-items-center rounded-control" :class="card.tone"><component :is="card.icon" :size="20" aria-hidden="true" /></span>
        <div><p class="text-xs font-medium text-muted">{{ card.label }}</p><p class="mt-1 text-2xl font-bold text-ink">{{ card.value }}</p></div>
      </UiCard>
    </div>

    <UiCard :padded="false">
      <div class="border-b border-divider p-5 sm:p-6">
        <div>
          <h3 class="text-lg font-bold text-ink">รายการบริษัทที่สมัคร</h3>
          <p class="mt-1 text-sm leading-6 text-muted">เพิ่มบริษัทที่สนใจและอัปเดตผลการติดต่อไว้ในที่เดียว</p>
        </div>

        <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label class="block w-full text-sm font-semibold text-ink sm:max-w-sm lg:w-96 lg:flex-none">
            <span class="sr-only">ค้นหาบริษัทหรือตำแหน่ง</span>
            <span class="relative block">
              <Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input v-model="searchQuery" type="search" class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 font-normal placeholder:text-gray-400" placeholder="ค้นหาชื่อบริษัทหรือตำแหน่ง">
            </span>
          </label>
          <div class="flex flex-wrap items-center justify-end gap-2 lg:ml-auto lg:flex-nowrap">
            <div class="w-full sm:w-52"><UiSelect v-model="statusFilter" :options="statusOptions" label="กรองตามสถานะ" :label-visible="false" /></div>
            <div class="w-full sm:w-48"><UiSelect v-model="provinceFilter" :options="provinceOptions" label="กรองตามจังหวัด" :label-visible="false" /></div>
            <button type="button" class="inline-grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-ink transition-colors hover:bg-surface" aria-label="รีเซ็ตตาราง" title="รีเซ็ตตาราง" @click="resetTable">
              <RotateCcw :size="18" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div v-if="hasActiveFilters" class="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span class="text-muted">ตัวกรองที่ใช้:</span>
          <span v-if="searchQuery" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">คำค้น “{{ searchQuery }}”</span>
          <span v-if="statusFilter !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ activeStatusLabel }}</span>
          <span v-if="provinceFilter !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ provinceFilter }}</span>
          <button type="button" class="inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-semibold text-warning hover:bg-warning-soft" @click="clearFilters"><X :size="15" aria-hidden="true" />ล้างทั้งหมด</button>
        </div>
      </div>

      <div v-if="effectiveViewState === 'loading'" class="space-y-3 p-5 sm:p-6" aria-label="กำลังโหลดรายการการสมัคร">
        <div v-for="row in 5" :key="row" class="grid grid-cols-[2fr_1fr_8rem_9rem_2rem] gap-4 max-md:grid-cols-[1fr_8rem]">
          <UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" />
        </div>
      </div>
      <div v-else-if="effectiveViewState === 'error'" class="p-5 sm:p-6">
        <AppErrorState title="โหลดรายการการสมัครไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองดึงข้อมูลอีกครั้ง" @retry="retry" />
      </div>
      <div v-else-if="!paginatedApplications.length" class="p-5 sm:p-6">
        <AppEmptyState :title="hasActiveFilters ? 'ไม่พบการสมัครที่ตรงกับตัวกรอง' : 'ยังไม่มีรายการการสมัคร'" :description="hasActiveFilters ? 'ลองเปลี่ยนคำค้นหรือล้างตัวกรองที่ใช้อยู่' : 'เพิ่มบริษัทที่คุณสมัครไว้เพื่อเริ่มติดตามสถานะ'">
          <UiButton v-if="hasActiveFilters" variant="secondary" @click="clearFilters">ล้างตัวกรอง</UiButton>
          <UiButton v-else :icon="Plus" @click="openAddDialog">เพิ่มการสมัคร</UiButton>
        </AppEmptyState>
      </div>

      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[960px] border-collapse text-left text-sm">
            <caption class="sr-only">รายการบริษัทที่นักศึกษาสมัครสหกิจ</caption>
            <thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" class="px-6 py-3">บริษัท / ตำแหน่ง</th>
                <th scope="col" class="px-4 py-3">จังหวัด</th>
                <th scope="col" class="px-4 py-3" :aria-sort="sortDirection === 'asc' ? 'ascending' : 'descending'">
                  <button type="button" class="inline-flex items-center gap-1 font-semibold hover:text-ink" :aria-label="`เรียงวันที่สมัคร${sortDirection === 'asc' ? 'จากใหม่ไปเก่า' : 'จากเก่าไปใหม่'}`" @click="toggleDateSort">
                    วันที่สมัคร <ArrowUp v-if="sortDirection === 'asc'" :size="15" aria-hidden="true" /><ArrowDown v-else :size="15" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" class="px-4 py-3">สถานะ</th>
                <th scope="col" class="w-16 px-4 py-3"><span class="sr-only">การทำงาน</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider">
              <tr v-for="application in paginatedApplications" :key="application.id" class="transition-colors hover:bg-surface/70">
                <td class="max-w-md px-6 py-4"><p class="font-semibold text-ink">{{ application.companyName }}</p><p class="mt-1 text-xs text-muted">{{ application.position }}</p></td>
                <td class="whitespace-nowrap px-4 py-4 text-muted">{{ application.province }}</td>
                <td class="whitespace-nowrap px-4 py-4 text-muted">{{ formatDate(application.appliedAt) }}</td>
                <td class="whitespace-nowrap px-4 py-4"><UiBadge :tone="trackedApplicationStatusMeta[application.status].tone">{{ trackedApplicationStatusMeta[application.status].label }}</UiBadge></td>
                <td class="px-4 py-4 text-right">
                  <DropdownMenuRoot>
                    <DropdownMenuTrigger class="inline-grid size-9 place-items-center rounded-control text-muted hover:bg-surface hover:text-ink" :aria-label="`จัดการการสมัคร ${application.companyName}`">
                      <MoreHorizontal :size="18" aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuContent :side-offset="6" align="end" class="z-40 min-w-48 rounded-panel border border-divider bg-canvas p-1.5 shadow-xl">
                        <DropdownMenuItem class="flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 text-sm text-ink outline-none data-[highlighted]:bg-surface" @select="openEditDialog(application)"><Pencil :size="16" aria-hidden="true" />แก้ไขข้อมูล</DropdownMenuItem>
                        <DropdownMenuItem class="flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 text-sm text-ink outline-none data-[highlighted]:bg-surface" @select="openStatusDialog(application)"><RefreshCw :size="16" aria-hidden="true" />อัปเดตสถานะ</DropdownMenuItem>
                        <DropdownMenuItem class="flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 text-sm text-danger outline-none data-[highlighted]:bg-danger-soft" @select="openDeleteDialog(application)"><Trash2 :size="16" aria-hidden="true" />ลบรายการ</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenuPortal>
                  </DropdownMenuRoot>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-divider md:hidden">
          <article v-for="application in paginatedApplications" :key="application.id" class="p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0"><p class="font-semibold leading-6 text-ink">{{ application.companyName }}</p><p class="mt-1 text-sm text-muted">{{ application.position }}</p></div>
              <DropdownMenuRoot>
                <DropdownMenuTrigger class="inline-grid size-9 shrink-0 place-items-center rounded-control text-muted hover:bg-surface hover:text-ink" :aria-label="`จัดการการสมัคร ${application.companyName}`"><MoreHorizontal :size="18" aria-hidden="true" /></DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent :side-offset="6" align="end" class="z-40 min-w-48 rounded-panel border border-divider bg-canvas p-1.5 shadow-xl">
                    <DropdownMenuItem class="flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 text-sm text-ink outline-none data-[highlighted]:bg-surface" @select="openEditDialog(application)"><Pencil :size="16" aria-hidden="true" />แก้ไขข้อมูล</DropdownMenuItem>
                    <DropdownMenuItem class="flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 text-sm text-ink outline-none data-[highlighted]:bg-surface" @select="openStatusDialog(application)"><RefreshCw :size="16" aria-hidden="true" />อัปเดตสถานะ</DropdownMenuItem>
                    <DropdownMenuItem class="flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-3 text-sm text-danger outline-none data-[highlighted]:bg-danger-soft" @select="openDeleteDialog(application)"><Trash2 :size="16" aria-hidden="true" />ลบรายการ</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenuRoot>
            </div>
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-4">
              <div class="text-xs leading-5 text-muted"><p>{{ application.province }}</p><p>{{ formatDate(application.appliedAt) }}</p></div>
              <UiBadge :tone="trackedApplicationStatusMeta[application.status].tone">{{ trackedApplicationStatusMeta[application.status].label }}</UiBadge>
            </div>
          </article>
        </div>

        <div class="flex flex-col gap-3 border-t border-divider px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div class="flex items-center gap-3">
            <p class="whitespace-nowrap text-muted">แสดง {{ resultStart }}–{{ resultEnd }} จาก {{ filteredApplications.length }} รายการ</p>
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

    <UiDialog v-model:open="applicationDialogOpen" size="lg" :title="editingId ? 'แก้ไขข้อมูลการสมัคร' : 'เพิ่มการสมัคร'" description="บันทึกข้อมูลบริษัทที่คุณยื่นสมัครเพื่อใช้ติดตามความคืบหน้า">
      <form class="grid gap-5 sm:grid-cols-2" novalidate @submit.prevent="submitApplication">
        <div class="sm:col-span-2"><UiInput v-model="form.companyName" label="ชื่อบริษัท / สถานประกอบการ" placeholder="เช่น บริษัท ตัวอย่าง จำกัด" :error="formErrors.companyName" required /></div>
        <div class="sm:col-span-2"><UiInput v-model="form.position" label="ตำแหน่งที่สมัคร" placeholder="เช่น นักพัฒนาเว็บไซต์" :error="formErrors.position" required /></div>
        <UiSelect v-model="form.province" :options="formProvinceOptions" label="จังหวัด" placeholder="เลือกจังหวัด" :error="formErrors.province" required />
        <div><UiInput v-model="form.appliedAt" type="date" label="วันที่สมัคร" :error="formErrors.appliedAt" required /></div>
        <div class="sm:col-span-2"><UiSelect v-model="form.status" :options="formStatusOptions" label="สถานะการสมัคร" :error="formErrors.status" required /></div>
        <div class="flex flex-wrap justify-end gap-2 border-t border-divider pt-5 sm:col-span-2">
          <UiButton variant="ghost" @click="applicationDialogOpen = false">ยกเลิก</UiButton>
          <UiButton type="submit">บันทึก</UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model:open="statusDialogOpen" title="อัปเดตสถานะการสมัคร" :description="selectedApplication?.companyName">
      <form class="space-y-5" @submit.prevent="submitStatus">
        <UiSelect v-model="statusValue" :options="formStatusOptions" label="สถานะใหม่" required />
        <div class="flex flex-wrap justify-end gap-2 border-t border-divider pt-5">
          <UiButton variant="ghost" @click="statusDialogOpen = false">ยกเลิก</UiButton>
          <UiButton type="submit">บันทึกสถานะ</UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model:open="deleteDialogOpen" title="ลบรายการการสมัคร" :description="selectedApplication ? `ต้องการลบ ${selectedApplication.companyName} ออกจากรายการติดตามหรือไม่` : undefined">
      <template #cancel><UiButton variant="ghost">ยกเลิก</UiButton></template>
      <template #confirm><UiButton variant="danger" @click="confirmDelete">ลบรายการ</UiButton></template>
    </UiDialog>
  </div>
</template>
