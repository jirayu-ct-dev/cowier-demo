<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Pencil, Plus, RotateCcw, Search, Trash2, X } from '@lucide/vue'
import {
  CheckboxIndicator,
  CheckboxRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from 'reka-ui'

definePageMeta({ title: 'Design System' })
if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

const accepted = ref(false)
const province = ref('buriram')
const { showToast } = useToast()
const colors = [
  { name: 'Primary', value: '#F5B32B', class: 'bg-primary text-ink' },
  { name: 'Main', value: '#FFFFFF', class: 'border border-divider bg-canvas text-ink' },
  { name: 'Secondary', value: '#F7F7F7', class: 'bg-surface text-ink' },
  { name: 'Sidebar', value: '#1D1E20', class: 'bg-sidebar text-white' },
  { name: 'Border', value: '#E5E7E9', class: 'bg-divider text-ink' },
]
const tabs = [{ value: 'student', label: 'นักศึกษา' }, { value: 'lecturer', label: 'อาจารย์' }, { value: 'staff', label: 'เจ้าหน้าที่' }]
const provinceOptions = [
  { value: 'buriram', label: 'บุรีรัมย์' },
  { value: 'nakhon-ratchasima', label: 'นครราชสีมา' },
  { value: 'khon-kaen', label: 'ขอนแก่น' },
]

type RequestStatus = 'draft' | 'review' | 'approved' | 'rejected'
type TablePreviewState = 'data' | 'loading' | 'empty' | 'error'
type SortDirection = 'asc' | 'desc'
type SortKey = 'studentName' | 'submittedDate'

interface PlacementRequest {
  id: string
  studentId: string
  studentName: string
  company: string
  position: string
  submittedDate: string
  submittedAt: string
  status: RequestStatus
}

const statusOptions = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'draft', label: 'ฉบับร่าง' },
  { value: 'review', label: 'รอตรวจสอบ' },
  { value: 'approved', label: 'ยืนยันแล้ว' },
  { value: 'rejected', label: 'ต้องแก้ไข' },
]
const pageSizeOptions = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
]
const tablePreviewOptions: { value: TablePreviewState, label: string }[] = [
  { value: 'data', label: 'Data' },
  { value: 'loading', label: 'Loading' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Error' },
]
const placementRequests: PlacementRequest[] = [
  { id: 'REQ-001', studentId: '65011212001', studentName: 'กานต์พิชชา สุขใจ', company: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', position: 'Frontend Developer', submittedDate: '2026-08-24', submittedAt: '24 ส.ค. 2569', status: 'review' },
  { id: 'REQ-002', studentId: '65011212008', studentName: 'ธีรภัทร วัฒนะ', company: 'โรงพยาบาลบุรีรัมย์', position: 'IT Support', submittedDate: '2026-08-23', submittedAt: '23 ส.ค. 2569', status: 'approved' },
  { id: 'REQ-003', studentId: '65011212014', studentName: 'ปวีณ์นุช มั่นคง', company: 'บริษัท อีสานเทค จำกัด', position: 'UX/UI Designer', submittedDate: '2026-08-22', submittedAt: '22 ส.ค. 2569', status: 'draft' },
  { id: 'REQ-004', studentId: '65011212021', studentName: 'ณัฐวุฒิ แสงทอง', company: 'สำนักงานจังหวัดบุรีรัมย์', position: 'Data Analyst', submittedDate: '2026-08-21', submittedAt: '21 ส.ค. 2569', status: 'review' },
  { id: 'REQ-005', studentId: '65011212029', studentName: 'ศิริพร ใจดี', company: 'บริษัท โคราชซอฟต์แวร์ จำกัด', position: 'Software Tester', submittedDate: '2026-08-20', submittedAt: '20 ส.ค. 2569', status: 'rejected' },
  { id: 'REQ-006', studentId: '65011212035', studentName: 'ภูริณัฐ ทองแท้', company: 'การไฟฟ้าส่วนภูมิภาค', position: 'Network Engineer', submittedDate: '2026-08-19', submittedAt: '19 ส.ค. 2569', status: 'approved' },
]

const searchQuery = ref('')
const statusFilter = ref('all')
const tablePreviewState = ref<TablePreviewState>('data')
const sortKey = ref<SortKey>('studentName')
const sortDirection = ref<SortDirection>('asc')
const currentPage = ref(1)
const pageSize = ref('10')
const selectedIds = ref<string[]>([])

const statusMeta: Record<RequestStatus, { label: string, tone: 'neutral' | 'warning' | 'success' | 'danger' }> = {
  draft: { label: 'ฉบับร่าง', tone: 'neutral' },
  review: { label: 'รอตรวจสอบ', tone: 'warning' },
  approved: { label: 'ยืนยันแล้ว', tone: 'success' },
  rejected: { label: 'ต้องแก้ไข', tone: 'danger' },
}

const filteredRequests = computed(() => {
  const keyword = searchQuery.value.trim().toLocaleLowerCase('th')
  return placementRequests
    .filter(request => statusFilter.value === 'all' || request.status === statusFilter.value)
    .filter(request => !keyword || [request.studentId, request.studentName, request.company, request.position].some(value => value.toLocaleLowerCase('th').includes(keyword)))
    .toSorted((a, b) => {
      const comparison = sortKey.value === 'studentName'
        ? a.studentName.localeCompare(b.studentName, 'th')
        : a.submittedDate.localeCompare(b.submittedDate)
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
})
const pageSizeNumber = computed(() => Number(pageSize.value))
const pageCount = computed(() => Math.max(1, Math.ceil(filteredRequests.value.length / pageSizeNumber.value)))
const paginatedRequests = computed(() => filteredRequests.value.slice((currentPage.value - 1) * pageSizeNumber.value, currentPage.value * pageSizeNumber.value))
const visibleSelectedCount = computed(() => paginatedRequests.value.filter(request => selectedIds.value.includes(request.id)).length)
const selectAllState = computed<boolean | 'indeterminate'>(() => {
  if (!visibleSelectedCount.value) return false
  if (visibleSelectedCount.value === paginatedRequests.value.length) return true
  return 'indeterminate'
})
const resultStart = computed(() => filteredRequests.value.length ? (currentPage.value - 1) * pageSizeNumber.value + 1 : 0)
const resultEnd = computed(() => Math.min(currentPage.value * pageSizeNumber.value, filteredRequests.value.length))

watch([searchQuery, statusFilter, pageSize], () => {
  currentPage.value = 1
  selectedIds.value = []
})

const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
  selectedIds.value = []
}
const toggleSelectAll = (checked: boolean | 'indeterminate') => {
  const visibleIds = paginatedRequests.value.map(request => request.id)
  selectedIds.value = checked === true
    ? [...new Set([...selectedIds.value, ...visibleIds])]
    : selectedIds.value.filter(id => !visibleIds.includes(id))
}
const toggleRow = (id: string, checked: boolean | 'indeterminate') => {
  selectedIds.value = checked === true
    ? [...new Set([...selectedIds.value, id])]
    : selectedIds.value.filter(selectedId => selectedId !== id)
}
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
}
const resetTable = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  tablePreviewState.value = 'data'
  sortKey.value = 'studentName'
  sortDirection.value = 'asc'
  pageSize.value = '10'
  currentPage.value = 1
  selectedIds.value = []
}
const retryTable = () => {
  tablePreviewState.value = 'loading'
  window.setTimeout(() => { tablePreviewState.value = 'data' }, 600)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-medium text-warning">Checkpoint 1</p>
      <h2 class="mt-1 text-2xl font-bold text-ink sm:text-3xl">Design Foundation</h2>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-muted">หน้านี้ใช้ตรวจสี ตัวอักษร ปุ่ม ฟอร์ม สถานะ และ interaction กลางก่อนนำไปสร้างทุกโมดูล</p>
    </div>

    <UiCard>
      <h3 class="text-lg font-bold text-ink">สีและสถานะ</h3>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div v-for="color in colors" :key="color.name" class="overflow-hidden rounded-control border border-divider">
          <div class="h-20 p-3 text-sm font-semibold" :class="color.class">{{ color.name }}</div>
          <div class="bg-canvas px-3 py-2 font-mono text-xs text-muted">{{ color.value }}</div>
        </div>
      </div>
      <div class="mt-5 flex flex-wrap gap-2">
        <UiBadge>ค่าเริ่มต้น</UiBadge><UiBadge tone="info">รอดำเนินการ</UiBadge><UiBadge tone="warning">รอตรวจสอบ</UiBadge><UiBadge tone="success">ยืนยันแล้ว</UiBadge><UiBadge tone="danger">ไม่ผ่าน</UiBadge>
      </div>
    </UiCard>

    <UiCard>
      <h3 class="text-lg font-bold text-ink">ปุ่มและ Feedback</h3>
      <div class="mt-4 flex flex-wrap gap-3">
        <UiButton :icon="Plus">สร้างรายการ</UiButton>
        <UiButton variant="secondary" :icon="Search">ค้นหา</UiButton>
        <UiButton variant="ghost">ยกเลิก</UiButton>
        <UiButton variant="danger" :icon="Trash2">ยุติการใช้งาน</UiButton>
        <UiButton loading>กำลังบันทึก</UiButton>
        <UiButton disabled>ไม่มีสิทธิ์ใช้งาน</UiButton>
        <UiButton variant="secondary" @click="showToast({ title: 'บันทึกข้อมูลแล้ว', description: 'ตัวอย่างข้อความตอบกลับระดับ Action' })">ทดลอง Toast</UiButton>
      </div>
      <div class="mt-5 grid gap-3 lg:grid-cols-2">
        <UiAlert title="ข้อมูลสำหรับตรวจสอบ">ใช้สีร่วมกับข้อความและไอคอน ไม่ใช้สีอย่างเดียวในการบอกสถานะ</UiAlert>
        <UiAlert tone="success" title="ดำเนินการสำเร็จ">ระบบบันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว</UiAlert>
        <UiAlert tone="warning" title="ต้องตรวจสอบเพิ่มเติม">เอกสารยังไม่มีลายเซ็นของสถานประกอบการ</UiAlert>
        <UiAlert tone="danger" title="ไม่สามารถบันทึกได้">กรุณาตรวจสอบข้อมูลในช่องที่ระบุ</UiAlert>
      </div>
    </UiCard>

    <UiCard>
      <h3 class="text-lg font-bold text-ink">ฟอร์ม</h3>
      <div class="mt-4 grid gap-5 lg:grid-cols-2">
        <label class="block text-sm font-semibold text-ink">ชื่อสถานประกอบการ <span class="text-danger">*</span>
          <input class="mt-1.5 min-h-11 w-full rounded-control border border-divider bg-canvas px-3 font-normal placeholder:text-gray-400" placeholder="เช่น บริษัท ตัวอย่าง จำกัด" />
          <span class="mt-1.5 block text-xs font-normal text-muted">ใช้ชื่อที่ปรากฏในหนังสือราชการ</span>
        </label>
        <div>
          <label id="province-label" class="block text-sm font-semibold text-ink">จังหวัด</label>
          <div class="mt-1.5"><UiSelect v-model="province" :options="provinceOptions" label="จังหวัด" /></div>
        </div>
        <label class="block text-sm font-semibold text-ink lg:col-span-2">รายละเอียดตำแหน่งงาน
          <textarea class="mt-1.5 min-h-28 w-full resize-y rounded-control border border-divider bg-canvas p-3 font-normal" placeholder="อธิบายลักษณะงานที่คาดว่าจะได้รับมอบหมาย" />
        </label>
        <label class="flex items-start gap-3 text-sm text-ink lg:col-span-2">
          <CheckboxRoot v-model="accepted" class="mt-0.5 grid size-5 shrink-0 place-items-center rounded border border-divider bg-canvas data-[state=checked]:border-primary data-[state=checked]:bg-primary">
            <CheckboxIndicator class="text-ink">✓</CheckboxIndicator>
          </CheckboxRoot>
          <span>ยืนยันว่าข้อมูลข้างต้นถูกต้องและสามารถนำไปจัดทำหนังสือขอฝึกงานได้</span>
        </label>
      </div>
    </UiCard>

    <UiCard>
      <h3 class="text-lg font-bold text-ink">Dialog และ Tabs</h3>
      <div class="mt-4">
        <DialogRoot>
          <DialogTrigger as-child><UiButton variant="secondary">เปิด Dialog</UiButton></DialogTrigger>
          <DialogPortal>
            <DialogOverlay class="fixed inset-0 z-50 bg-black/45" />
            <DialogContent class="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-panel border border-divider bg-canvas p-6 shadow-2xl outline-none">
              <DialogTitle class="text-lg font-bold text-ink">ยืนยันการดำเนินการ</DialogTitle>
              <DialogDescription class="mt-2 text-sm leading-6 text-muted">ตัวอย่าง Dialog สำหรับ Action ที่ต้องให้ผู้ใช้ตรวจสอบข้อมูลก่อนยืนยัน</DialogDescription>
              <div class="mt-6 flex justify-end gap-3"><DialogClose as-child><UiButton variant="ghost">ยกเลิก</UiButton></DialogClose><DialogClose as-child><UiButton>ยืนยัน</UiButton></DialogClose></div>
            </DialogContent>
          </DialogPortal>
        </DialogRoot>
      </div>

      <TabsRoot default-value="student" class="mt-6">
        <TabsList class="inline-flex rounded-control bg-surface p-1" aria-label="ตัวอย่างมุมมองตามบทบาท">
          <TabsTrigger v-for="tab in tabs" :key="tab.value" :value="tab.value" class="min-h-10 rounded-md px-4 text-sm font-semibold text-muted data-[state=active]:bg-canvas data-[state=active]:text-ink data-[state=active]:shadow-sm">{{ tab.label }}</TabsTrigger>
        </TabsList>
        <TabsContent value="student" class="mt-4 rounded-control border border-divider p-4 text-sm text-muted">มุมมองติดตามคำร้องและตารางนิเทศของนักศึกษา</TabsContent>
        <TabsContent value="lecturer" class="mt-4 rounded-control border border-divider p-4 text-sm text-muted">มุมมองตารางนิเทศและแบบประเมินของอาจารย์</TabsContent>
        <TabsContent value="staff" class="mt-4 rounded-control border border-divider p-4 text-sm text-muted">มุมมองจัดการคำร้อง รอบสหกิจ และการนิเทศของเจ้าหน้าที่</TabsContent>
      </TabsRoot>
    </UiCard>

    <UiCard :padded="false">
      <div class="border-b border-divider p-5 sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 class="text-lg font-bold text-ink">Data Table</h3>
            <p class="mt-1 text-sm leading-6 text-muted">ตัวอย่างตารางคำร้องสถานประกอบการ รองรับค้นหา กรอง เรียง เลือกหลายรายการ เมนูต่อแถว และแบ่งหน้า</p>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <div class="flex flex-wrap gap-2" aria-label="เลือกสถานะตัวอย่างตาราง">
              <button
                v-for="option in tablePreviewOptions"
                :key="option.value"
                type="button"
                class="min-h-9 rounded-control border px-3 text-xs font-semibold transition-colors"
                :class="tablePreviewState === option.value ? 'border-primary bg-warning-soft text-ink' : 'border-divider bg-canvas text-muted hover:bg-surface'"
                :aria-pressed="tablePreviewState === option.value"
                @click="tablePreviewState = option.value"
              >{{ option.label }}</button>
            </div>
            <UiButton :icon="Plus">สร้างคำร้อง</UiButton>
          </div>
        </div>

        <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label class="block w-full text-sm font-semibold text-ink sm:max-w-sm lg:w-96 lg:flex-none">
            <span class="sr-only">ค้นหาคำร้อง</span>
            <span class="relative block">
              <Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input v-model="searchQuery" type="search" class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 font-normal placeholder:text-gray-400" placeholder="ค้นหารหัส ชื่อ บริษัท หรือตำแหน่ง" />
            </span>
          </label>
          <div class="flex flex-wrap items-center justify-end gap-2 lg:ml-auto lg:flex-nowrap">
            <div class="w-full sm:w-48">
              <UiSelect v-model="statusFilter" :options="statusOptions" label="กรองตามสถานะ" />
            </div>
            <button type="button" class="inline-grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-ink transition-colors hover:bg-surface" aria-label="รีเซ็ตตาราง" title="รีเซ็ตตาราง" @click="resetTable"><RotateCcw :size="18" aria-hidden="true" /></button>
          </div>
        </div>

        <div v-if="statusFilter !== 'all' || searchQuery" class="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span class="text-muted">ตัวกรองที่ใช้:</span>
          <span v-if="searchQuery" class="inline-flex min-h-8 items-center gap-1 rounded-full bg-surface px-3 text-ink">คำค้น “{{ searchQuery }}”</span>
          <span v-if="statusFilter !== 'all'" class="inline-flex min-h-8 items-center gap-1 rounded-full bg-surface px-3 text-ink">{{ statusOptions.find(option => option.value === statusFilter)?.label }}</span>
          <button type="button" class="inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-semibold text-warning hover:bg-warning-soft" @click="clearFilters"><X :size="15" aria-hidden="true" />ล้างทั้งหมด</button>
        </div>
      </div>

      <div v-if="selectedIds.length" class="flex flex-wrap items-center justify-between gap-3 border-b border-divider bg-warning-soft px-5 py-3 sm:px-6" role="status">
        <p class="text-sm font-semibold text-ink">เลือกแล้ว {{ selectedIds.length }} รายการ</p>
        <div class="flex gap-2"><UiButton size="sm" variant="secondary">ส่งออก</UiButton><UiButton size="sm" variant="ghost" @click="selectedIds = []">ยกเลิกการเลือก</UiButton></div>
      </div>

      <div v-if="tablePreviewState === 'loading'" class="space-y-3 p-5 sm:p-6" aria-label="กำลังโหลดข้อมูล">
        <div v-for="row in 4" :key="row" class="grid grid-cols-[2rem_1.2fr_1fr_8rem] gap-4 max-md:grid-cols-[1fr_7rem]">
          <UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10" />
        </div>
      </div>
      <div v-else-if="tablePreviewState === 'error'" class="p-5 sm:p-6"><AppErrorState title="โหลดรายการคำร้องไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองดึงข้อมูลอีกครั้ง" @retry="retryTable" /></div>
      <div v-else-if="tablePreviewState === 'empty' || !paginatedRequests.length" class="p-5 sm:p-6">
        <AppEmptyState :title="searchQuery || statusFilter !== 'all' ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีคำร้องสถานประกอบการ'" :description="searchQuery || statusFilter !== 'all' ? 'ลองเปลี่ยนคำค้นหรือล้างตัวกรองที่ใช้อยู่' : 'เมื่อมีคำร้อง รายการจะแสดงในตารางนี้'">
          <UiButton v-if="searchQuery || statusFilter !== 'all'" variant="secondary" @click="clearFilters">ล้างตัวกรอง</UiButton><UiButton v-else :icon="Plus">สร้างคำร้อง</UiButton>
        </AppEmptyState>
      </div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[900px] border-collapse text-left text-sm">
            <caption class="sr-only">รายการคำร้องสถานประกอบการของนักศึกษา</caption>
            <thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" class="w-14 px-5 py-3 sm:px-6">
                  <CheckboxRoot :model-value="selectAllState" class="grid size-5 place-items-center rounded border border-divider bg-canvas data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary" aria-label="เลือกทุกรายการในหน้านี้" @update:model-value="toggleSelectAll">
                    <CheckboxIndicator class="text-ink"><span v-if="selectAllState === 'indeterminate'">−</span><span v-else>✓</span></CheckboxIndicator>
                  </CheckboxRoot>
                </th>
                <th scope="col" class="px-4 py-3" :aria-sort="sortKey === 'studentName' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'"><button type="button" class="inline-flex items-center gap-1 font-semibold hover:text-ink" :aria-label="`เรียงชื่อนักศึกษา ${sortKey === 'studentName' && sortDirection === 'asc' ? 'จาก ฮ ถึง ก' : 'จาก ก ถึง ฮ'}`" @click="toggleSort('studentName')">นักศึกษา <ArrowUp v-if="sortKey === 'studentName' && sortDirection === 'asc'" :size="15" aria-hidden="true" /><ArrowDown v-else-if="sortKey === 'studentName'" :size="15" aria-hidden="true" /><ArrowUpDown v-else :size="15" aria-hidden="true" /></button></th>
                <th scope="col" class="px-4 py-3">สถานประกอบการ / ตำแหน่ง</th>
                <th scope="col" class="px-4 py-3" :aria-sort="sortKey === 'submittedDate' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'"><button type="button" class="inline-flex items-center gap-1 font-semibold hover:text-ink" :aria-label="`เรียงวันที่ยื่น ${sortKey === 'submittedDate' && sortDirection === 'asc' ? 'จากใหม่ไปเก่า' : 'จากเก่าไปใหม่'}`" @click="toggleSort('submittedDate')">วันที่ยื่น <ArrowUp v-if="sortKey === 'submittedDate' && sortDirection === 'asc'" :size="15" aria-hidden="true" /><ArrowDown v-else-if="sortKey === 'submittedDate'" :size="15" aria-hidden="true" /><ArrowUpDown v-else :size="15" aria-hidden="true" /></button></th>
                <th scope="col" class="px-4 py-3">สถานะ</th>
                <th scope="col" class="w-24 px-4 py-3 text-right">การทำงาน</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider">
              <tr v-for="request in paginatedRequests" :key="request.id" class="transition-colors hover:bg-surface/70" :class="selectedIds.includes(request.id) && 'bg-warning-soft/60'">
                <td class="px-5 py-4 sm:px-6"><CheckboxRoot :model-value="selectedIds.includes(request.id)" class="grid size-5 place-items-center rounded border border-divider bg-canvas data-[state=checked]:border-primary data-[state=checked]:bg-primary" :aria-label="`เลือกคำร้องของ ${request.studentName}`" @update:model-value="toggleRow(request.id, $event)"><CheckboxIndicator class="text-ink">✓</CheckboxIndicator></CheckboxRoot></td>
                <td class="px-4 py-4"><p class="font-semibold text-ink">{{ request.studentName }}</p><p class="mt-1 text-xs text-muted">{{ request.studentId }} · {{ request.id }}</p></td>
                <td class="px-4 py-4"><p class="font-medium text-ink">{{ request.company }}</p><p class="mt-1 text-xs text-muted">{{ request.position }}</p></td>
                <td class="whitespace-nowrap px-4 py-4 text-muted">{{ request.submittedAt }}</td>
                <td class="px-4 py-4"><UiBadge :tone="statusMeta[request.status].tone">{{ statusMeta[request.status].label }}</UiBadge></td>
                <td class="px-4 py-4 text-right">
                  <div class="inline-flex items-center justify-end">
                    <button type="button" class="inline-grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink" :aria-label="`ดูรายละเอียดคำร้องของ ${request.studentName}`" title="ดูรายละเอียด"><Eye :size="15" aria-hidden="true" /></button>
                    <button type="button" class="inline-grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink" :aria-label="`แก้ไขคำร้องของ ${request.studentName}`" title="แก้ไข"><Pencil :size="15" aria-hidden="true" /></button>
                    <button type="button" class="inline-grid size-7 place-items-center rounded-md text-danger transition-colors hover:bg-danger-soft" :aria-label="`ยุติการใช้งานคำร้องของ ${request.studentName}`" title="ยุติการใช้งาน"><Trash2 :size="15" aria-hidden="true" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-divider md:hidden">
          <article v-for="request in paginatedRequests" :key="request.id" class="p-5" :class="selectedIds.includes(request.id) && 'bg-warning-soft/60'">
            <div class="flex items-start gap-3">
              <CheckboxRoot :model-value="selectedIds.includes(request.id)" class="mt-0.5 grid size-5 shrink-0 place-items-center rounded border border-divider bg-canvas data-[state=checked]:border-primary data-[state=checked]:bg-primary" :aria-label="`เลือกคำร้องของ ${request.studentName}`" @update:model-value="toggleRow(request.id, $event)"><CheckboxIndicator class="text-ink">✓</CheckboxIndicator></CheckboxRoot>
              <div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-3"><div><h4 class="font-semibold text-ink">{{ request.studentName }}</h4><p class="mt-0.5 text-xs text-muted">{{ request.studentId }}</p></div><UiBadge :tone="statusMeta[request.status].tone">{{ statusMeta[request.status].label }}</UiBadge></div><dl class="mt-4 grid gap-3 text-sm"><div><dt class="text-xs text-muted">สถานประกอบการ</dt><dd class="mt-0.5 font-medium text-ink">{{ request.company }}</dd></div><div class="grid grid-cols-2 gap-3"><div><dt class="text-xs text-muted">ตำแหน่ง</dt><dd class="mt-0.5 text-ink">{{ request.position }}</dd></div><div><dt class="text-xs text-muted">วันที่ยื่น</dt><dd class="mt-0.5 text-ink">{{ request.submittedAt }}</dd></div></div></dl><div class="mt-4 flex flex-wrap gap-2"><UiButton size="sm" variant="secondary" :icon="Eye">ดูรายละเอียด</UiButton><UiButton size="sm" variant="ghost" :icon="Pencil">แก้ไข</UiButton><UiButton size="sm" variant="danger" :icon="Trash2">ยุติการใช้งาน</UiButton></div></div>
            </div>
          </article>
        </div>

        <div class="flex flex-col gap-3 border-t border-divider px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div class="flex items-center gap-3">
            <p class="whitespace-nowrap text-muted">แสดง {{ resultStart }}–{{ resultEnd }} จาก {{ filteredRequests.length }} รายการ</p>
            <div class="w-20 shrink-0"><UiSelect v-model="pageSize" :options="pageSizeOptions" label="จำนวนรายการต่อหน้า" /></div>
          </div>
          <nav class="flex items-center gap-2" aria-label="การแบ่งหน้าตาราง"><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:cursor-not-allowed disabled:opacity-45" :disabled="currentPage === 1" aria-label="หน้าก่อนหน้า" @click="currentPage--"><ChevronLeft :size="18" aria-hidden="true" /></button><span class="min-w-20 text-center font-semibold text-ink">หน้า {{ currentPage }} / {{ pageCount }}</span><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:cursor-not-allowed disabled:opacity-45" :disabled="currentPage === pageCount" aria-label="หน้าถัดไป" @click="currentPage++"><ChevronRight :size="18" aria-hidden="true" /></button></nav>
        </div>
      </template>
    </UiCard>

    <UiCard>
      <h3 class="text-lg font-bold text-ink">Shared States</h3>
      <p class="mt-1 text-sm text-muted">ใช้แผง “จำลองสถานการณ์” มุมขวาล่างเพื่อดู Loading, Empty, Error และ Data state บนหน้าภาพรวม</p>
      <div class="mt-5 grid gap-4 lg:grid-cols-2"><AppEmptyState title="ไม่พบรายการที่ค้นหา" description="ลองล้างตัวกรองหรือค้นหาด้วยคำอื่น" /><AppErrorState /></div>
    </UiCard>
  </div>
</template>
