<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, MapPinned, Plus, RotateCcw, Search, UsersRound, X } from '@lucide/vue'
import type { SupervisionRound } from '~/composables/useSupervisionGroups'
import { getPageCount, paginateItems } from '~/utils/table'

definePageMeta({ title: 'จัดกลุ่มนิเทศ', middleware: 'staff-prototype' })
useHead({ title: 'จัดกลุ่มนิเทศ' })

const { scenario } = useScenario()
const route = useRoute()
const { cycles, selectedCycle } = useCoopCycles()
const { people } = usePeopleDirectory()
const { groups, getGroupPlacements, getUnassignedPlacements } = useSupervisionGroups()

const queryCycle = String(route.query.cycle ?? '')
const cycleId = ref(cycles.some(cycle => cycle.id === queryCycle) ? queryCycle : selectedCycle.value.id)
const round = ref<SupervisionRound>(route.query.round === '2' ? 2 : 1)
const search = ref('')
const region = ref('all')
const province = ref('all')
const company = ref('all')
const sortDirection = ref<'asc' | 'desc'>('asc')
const selectedIds = ref<string[]>([])
const pageSize = ref('10')
const currentPage = ref(1)
const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)

const cycleOptions = cycles.map(cycle => ({ value: cycle.id, label: cycle.label }))
const roundOptions = [
  { value: '1', label: 'นิเทศครั้งที่ 1' },
  { value: '2', label: 'นิเทศครั้งที่ 2' },
]
const selectedCycleLabel = computed(() => cycles.find(cycle => cycle.id === cycleId.value)?.label ?? 'ไม่พบรอบ')
const roundModel = computed({
  get: () => String(round.value),
  set: value => { round.value = Number(value) as SupervisionRound },
})
const currentGroups = computed(() => groups.value.filter(group => group.cycleId === cycleId.value && group.round === round.value))
const unassignedPlacements = computed(() => getUnassignedPlacements(cycleId.value, round.value))
const regionOptions = computed(() => [{ value: 'all', label: 'ทุกภูมิภาค' }, ...[...new Set(unassignedPlacements.value.map(item => item.region))].sort((a, b) => a.localeCompare(b, 'th')).map(value => ({ value, label: value }))])
const provinceOptions = computed(() => [{ value: 'all', label: 'ทุกจังหวัด' }, ...[...new Set(unassignedPlacements.value.filter(item => region.value === 'all' || item.region === region.value).map(item => item.province))].sort((a, b) => a.localeCompare(b, 'th')).map(value => ({ value, label: value }))])
const companyOptions = computed(() => [{ value: 'all', label: 'ทุกสถานประกอบการ' }, ...[...new Set(unassignedPlacements.value.filter(item => (region.value === 'all' || item.region === region.value) && (province.value === 'all' || item.province === province.value)).map(item => item.company))].sort((a, b) => a.localeCompare(b, 'th')).map(value => ({ value, label: value }))])
const filteredPlacements = computed(() => {
  if (scenario.value.viewState === 'empty') return []
  const keyword = search.value.trim().toLocaleLowerCase('th')
  return unassignedPlacements.value
    .filter(item => !keyword || [item.studentId, item.studentName, item.company, item.province].some(value => value.toLocaleLowerCase('th').includes(keyword)))
    .filter(item => region.value === 'all' || item.region === region.value)
    .filter(item => province.value === 'all' || item.province === province.value)
    .filter(item => company.value === 'all' || item.company === company.value)
    .sort((a, b) => {
      const comparison = a.company.localeCompare(b.company, 'th') || a.studentName.localeCompare(b.studentName, 'th')
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
})
const pageSizeNumber = computed(() => Number(pageSize.value))
const pageCount = computed(() => getPageCount(filteredPlacements.value.length, pageSizeNumber.value))
const paginatedPlacements = computed(() => paginateItems(filteredPlacements.value, currentPage.value, pageSizeNumber.value))
const resultStart = computed(() => filteredPlacements.value.length ? (currentPage.value - 1) * pageSizeNumber.value + 1 : 0)
const resultEnd = computed(() => Math.min(currentPage.value * pageSizeNumber.value, filteredPlacements.value.length))
const pageSizeOptions = ['10', '20', '50'].map(value => ({ value, label: value }))
const hasFilters = computed(() => Boolean(search.value) || region.value !== 'all' || province.value !== 'all' || company.value !== 'all')
const currentPageIds = computed(() => paginatedPlacements.value.map(item => item.id))
const selectAllState = computed<boolean | 'indeterminate'>(() => {
  const selectedCount = currentPageIds.value.filter(id => selectedIds.value.includes(id)).length
  if (!selectedCount) return false
  return selectedCount === currentPageIds.value.length ? true : 'indeterminate'
})
const assignedLecturerCount = computed(() => new Set(currentGroups.value.flatMap(group => group.lecturerIds)).size)
const assignedCompanyCount = computed(() => new Set(currentGroups.value.flatMap(group => getGroupPlacements(group).map(item => item.company))).size)

watch([cycleId, round], () => {
  selectedIds.value = []
  clearFilters()
})
watch(region, () => {
  if (!provinceOptions.value.some(option => option.value === province.value)) province.value = 'all'
})
watch([region, province], () => {
  if (!companyOptions.value.some(option => option.value === company.value)) company.value = 'all'
})
watch([search, region, province, company, pageSize], () => { currentPage.value = 1 })
watch(pageCount, count => { if (currentPage.value > count) currentPage.value = count })

const clearFilters = () => {
  search.value = ''
  region.value = 'all'
  province.value = 'all'
  company.value = 'all'
}
const resetTable = () => {
  clearFilters()
  sortDirection.value = 'asc'
  pageSize.value = '10'
  currentPage.value = 1
}
const retry = () => {
  scenario.value.forceError = false
  scenario.value.viewState = 'data'
}
const toggleRow = (id: string, checked: boolean | 'indeterminate') => {
  selectedIds.value = checked ? [...new Set([...selectedIds.value, id])] : selectedIds.value.filter(item => item !== id)
}
const toggleSelectAll = (checked: boolean | 'indeterminate') => {
  if (checked) selectedIds.value = [...new Set([...selectedIds.value, ...currentPageIds.value])]
  else selectedIds.value = selectedIds.value.filter(id => !currentPageIds.value.includes(id))
}
const startCreateGroup = (ids = selectedIds.value) => navigateTo({
  path: '/staff/supervision/groups/new',
  query: { cycle: cycleId.value, round: String(round.value), ...(ids.length ? { placements: ids.join(',') } : {}) },
})
const lecturerName = (id: string) => {
  const lecturer = people.value.find(person => person.type === 'lecturer' && person.id === id)
  return lecturer ? `${lecturer.firstName} ${lecturer.lastName}` : id
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">จัดกลุ่มนิเทศ</h2><p class="mt-1 text-sm leading-6 text-muted">กำหนดกลุ่ม พื้นที่รับผิดชอบ และอาจารย์หลัก แยกสำหรับการนิเทศแต่ละครั้ง</p></div>
      <UiButton :icon="Plus" @click="startCreateGroup([])">สร้างกลุ่มนิเทศ</UiButton>
    </div>

    <UiCard class="mb-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <UiSelect v-model="cycleId" :options="cycleOptions" :placeholder="selectedCycleLabel" label="รอบสหกิจศึกษา" />
        <UiSelect v-model="roundModel" :options="roundOptions" :placeholder="roundOptions.find(item => item.value === roundModel)?.label" label="ครั้งที่นิเทศ" />
      </div>
      <UiAlert class="mt-4" tone="info" title="กลุ่มของแต่ละครั้งจัดแยกจากกัน">การเปลี่ยนกลุ่มของครั้งที่ {{ round }} ไม่มีผลต่อกลุ่มของการนิเทศอีกครั้ง และระบบจะไม่คัดลอกกลุ่มให้อัตโนมัติ</UiAlert>
    </UiCard>

    <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <UiCard><p class="text-sm text-muted">กลุ่มนิเทศครั้งที่ {{ round }}</p><p class="mt-2 text-3xl font-bold text-ink">{{ currentGroups.length }}</p></UiCard>
      <UiCard><p class="text-sm text-muted">อาจารย์รับผิดชอบ</p><p class="mt-2 text-3xl font-bold text-ink">{{ assignedLecturerCount }}</p></UiCard>
      <UiCard><p class="text-sm text-muted">สถานประกอบการที่จัดแล้ว</p><p class="mt-2 text-3xl font-bold text-ink">{{ assignedCompanyCount }}</p></UiCard>
      <UiCard><p class="text-sm text-muted">นักศึกษารอจัดกลุ่ม</p><p class="mt-2 text-3xl font-bold text-warning">{{ unassignedPlacements.length }}</p></UiCard>
    </div>

    <UiCard :padded="false" class="mb-6">
      <div class="border-b border-divider p-5 sm:p-6"><div class="flex items-start gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-control bg-warning-soft text-warning"><UsersRound :size="20" aria-hidden="true" /></span><div><h3 class="text-lg font-bold text-ink">กลุ่มที่จัดแล้ว</h3><p class="mt-1 text-sm text-muted">{{ selectedCycleLabel }} · นิเทศครั้งที่ {{ round }}</p></div></div></div>
      <div v-if="effectiveViewState === 'loading'" class="space-y-3 p-5 sm:p-6" aria-label="กำลังโหลดกลุ่มนิเทศ"><UiSkeleton v-for="row in 3" :key="row" class="h-14" /></div>
      <div v-else-if="effectiveViewState === 'error'" class="p-5 sm:p-6"><AppErrorState title="โหลดกลุ่มนิเทศไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองอีกครั้ง" @retry="retry" /></div>
      <div v-else-if="!currentGroups.length" class="p-5 sm:p-6"><AppEmptyState title="ยังไม่มีกลุ่มสำหรับการนิเทศครั้งนี้" description="สร้างกลุ่มและกำหนดอาจารย์รับผิดชอบก่อนเริ่มวางรายการนัด"><UiButton :icon="Plus" @click="startCreateGroup([])">สร้างกลุ่มนิเทศ</UiButton></AppEmptyState></div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[900px] border-collapse text-left text-sm"><caption class="sr-only">กลุ่มนิเทศที่จัดแล้ว</caption><thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase"><tr><th scope="col" class="px-6 py-3">ชื่อกลุ่ม</th><th scope="col" class="px-4 py-3">พื้นที่รับผิดชอบ</th><th scope="col" class="px-4 py-3">อาจารย์รับผิดชอบหลัก</th><th scope="col" class="px-4 py-3 text-right">สถานประกอบการ</th><th scope="col" class="px-6 py-3 text-right">นักศึกษา</th></tr></thead><tbody class="divide-y divide-divider"><tr v-for="group in currentGroups" :key="group.id" class="hover:bg-surface/70"><td class="px-6 py-4"><p class="font-semibold text-ink">{{ group.name }}</p><p class="mt-1 text-xs text-muted">{{ group.id }}</p></td><td class="px-4 py-4"><p class="font-medium text-ink">{{ supervisionScopeMeta[group.scopeType].label }}</p><p class="mt-1 max-w-xs text-xs leading-5 text-muted">{{ group.scopeValues.join(', ') }}</p></td><td class="px-4 py-4"><p v-for="id in group.lecturerIds" :key="id" class="text-ink">{{ lecturerName(id) }}</p></td><td class="px-4 py-4 text-right font-semibold text-ink">{{ new Set(getGroupPlacements(group).map(item => item.company)).size }}</td><td class="px-6 py-4 text-right font-semibold text-ink">{{ group.placementIds.length }}</td></tr></tbody></table></div>
        <div class="divide-y divide-divider md:hidden"><article v-for="group in currentGroups" :key="group.id" class="p-5"><div class="flex items-start justify-between gap-3"><div><h4 class="font-semibold text-ink">{{ group.name }}</h4><p class="mt-1 text-xs text-muted">{{ group.id }}</p></div><UiBadge tone="info">{{ supervisionScopeMeta[group.scopeType].label }}</UiBadge></div><p class="mt-3 text-sm text-ink">{{ group.scopeValues.join(', ') }}</p><dl class="mt-4 grid grid-cols-2 gap-3 border-t border-divider pt-3 text-sm"><div><dt class="text-xs text-muted">อาจารย์หลัก</dt><dd class="mt-1 text-ink">{{ group.lecturerIds.map(lecturerName).join(', ') }}</dd></div><div><dt class="text-xs text-muted">สมาชิก</dt><dd class="mt-1 font-semibold text-ink">{{ group.placementIds.length }} คน</dd></div></dl></article></div>
      </template>
    </UiCard>

    <UiCard :padded="false">
      <div class="border-b border-divider p-5 sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div class="flex items-start gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-control bg-info-soft text-info"><MapPinned :size="20" aria-hidden="true" /></span><div><h3 class="text-lg font-bold text-ink">นักศึกษาที่พร้อมจัดกลุ่ม</h3><p class="mt-1 text-sm leading-6 text-muted">แสดงเฉพาะนักศึกษาที่ยืนยันสถานที่ฝึกงานแล้วและยังไม่อยู่ในกลุ่มของครั้งที่ {{ round }}</p></div></div></div>
        <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><label class="block w-full text-sm font-semibold text-ink sm:max-w-md lg:w-96 lg:flex-none"><span class="sr-only">ค้นหานักศึกษาที่พร้อมจัดกลุ่ม</span><span class="relative block"><Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" /><input v-model="search" type="search" class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 font-normal placeholder:text-gray-400" placeholder="ค้นหารหัส ชื่อ บริษัท หรือจังหวัด"></span></label><div class="flex flex-col gap-2 sm:flex-row lg:ml-auto"><div class="w-full sm:w-56"><UiSelect v-model="region" :options="regionOptions" :placeholder="regionOptions.find(item => item.value === region)?.label" label="กรองภูมิภาค" :label-visible="false" /></div><div class="w-full sm:w-44"><UiSelect v-model="province" :options="provinceOptions" :placeholder="provinceOptions.find(item => item.value === province)?.label" label="กรองจังหวัด" :label-visible="false" /></div><div class="w-full sm:w-64"><UiSelect v-model="company" :options="companyOptions" :placeholder="companyOptions.find(item => item.value === company)?.label" label="กรองสถานประกอบการ" :label-visible="false" /></div><button type="button" class="inline-grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-ink hover:bg-surface" aria-label="รีเซ็ตตาราง" title="รีเซ็ตตาราง" @click="resetTable"><RotateCcw :size="18" aria-hidden="true" /></button></div></div>
        <div v-if="hasFilters" class="mt-3 flex flex-wrap items-center gap-2 text-sm"><span class="text-muted">ตัวกรองที่ใช้:</span><span v-if="search" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">คำค้น “{{ search }}”</span><span v-if="region !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ region }}</span><span v-if="province !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ province }}</span><span v-if="company !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ company }}</span><button type="button" class="inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-semibold text-warning hover:bg-warning-soft" @click="clearFilters"><X :size="15" aria-hidden="true" />ล้างทั้งหมด</button></div>
      </div>

      <div v-if="selectedIds.length" class="flex flex-wrap items-center justify-between gap-3 border-b border-divider bg-warning-soft px-5 py-3 sm:px-6" role="status"><p class="text-sm font-semibold text-ink">เลือกแล้ว {{ selectedIds.length }} คน</p><div class="flex gap-2"><UiButton size="sm" @click="startCreateGroup()">สร้างกลุ่มจากที่เลือก</UiButton><UiButton size="sm" variant="ghost" @click="selectedIds = []">ยกเลิกการเลือก</UiButton></div></div>

      <div v-if="effectiveViewState === 'loading'" class="space-y-3 p-5 sm:p-6" aria-label="กำลังโหลดนักศึกษา"><UiSkeleton v-for="row in 5" :key="row" class="h-14" /></div>
      <div v-else-if="effectiveViewState === 'error'" class="p-5 sm:p-6"><AppErrorState title="โหลดนักศึกษาที่พร้อมจัดกลุ่มไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองอีกครั้ง" @retry="retry" /></div>
      <div v-else-if="!paginatedPlacements.length" class="p-5 sm:p-6"><AppEmptyState :title="hasFilters ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'จัดกลุ่มนักศึกษาครบแล้ว'" :description="hasFilters ? 'ลองเปลี่ยนคำค้นหรือล้างตัวกรองที่ใช้อยู่' : `ไม่มีนักศึกษาที่ยืนยันสถานที่แล้วค้างอยู่ในการนิเทศครั้งที่ ${round}`"><UiButton v-if="hasFilters" variant="secondary" @click="clearFilters">ล้างตัวกรอง</UiButton></AppEmptyState></div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[980px] border-collapse text-left text-sm"><caption class="sr-only">นักศึกษาที่ยืนยันสถานที่แล้วและพร้อมจัดกลุ่ม</caption><thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase"><tr><th scope="col" class="w-14 px-5 py-3 sm:px-6"><UiCheckbox :model-value="selectAllState" label="เลือกทุกรายการในหน้านี้" @update:model-value="toggleSelectAll" /></th><th scope="col" class="px-4 py-3">นักศึกษา</th><th scope="col" class="px-4 py-3" :aria-sort="sortDirection === 'asc' ? 'ascending' : 'descending'"><button type="button" class="inline-flex items-center gap-1 font-semibold hover:text-ink" :aria-label="`เรียงสถานประกอบการ${sortDirection === 'asc' ? 'จาก ฮ ถึง ก' : 'จาก ก ถึง ฮ'}`" @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'">สถานประกอบการ <ArrowUp v-if="sortDirection === 'asc'" :size="15" aria-hidden="true" /><ArrowDown v-else :size="15" aria-hidden="true" /></button></th><th scope="col" class="px-4 py-3">พื้นที่</th><th scope="col" class="px-6 py-3">ตำแหน่ง</th></tr></thead><tbody class="divide-y divide-divider"><tr v-for="placement in paginatedPlacements" :key="placement.id" class="hover:bg-surface/70"><td class="px-5 py-4 sm:px-6"><UiCheckbox :model-value="selectedIds.includes(placement.id)" :label="`เลือก ${placement.studentName}`" @update:model-value="toggleRow(placement.id, $event)" /></td><td class="px-4 py-4"><p class="font-semibold text-ink">{{ placement.studentName }}</p><p class="mt-1 text-xs text-muted">{{ placement.studentId }}</p></td><td class="max-w-sm px-4 py-4"><p class="font-medium text-ink">{{ placement.company }}</p><p class="mt-1 text-xs text-muted">{{ placement.branch }}</p></td><td class="px-4 py-4"><p class="text-ink">{{ placement.province }}</p><p class="mt-1 text-xs text-muted">{{ placement.region }}</p></td><td class="px-6 py-4 text-muted">{{ placement.position }}</td></tr></tbody></table></div>
        <div class="divide-y divide-divider md:hidden"><article v-for="placement in paginatedPlacements" :key="placement.id" class="p-5"><div class="flex items-start gap-3"><UiCheckbox :model-value="selectedIds.includes(placement.id)" :label="`เลือก ${placement.studentName}`" @update:model-value="toggleRow(placement.id, $event)" /><div class="min-w-0 flex-1"><h4 class="font-semibold text-ink">{{ placement.studentName }}</h4><p class="mt-1 text-xs text-muted">{{ placement.studentId }}</p><p class="mt-3 font-medium text-ink">{{ placement.company }}</p><p class="mt-1 text-sm text-muted">{{ placement.province }} · {{ placement.position }}</p></div></div></article></div>
        <div class="flex flex-col gap-3 border-t border-divider px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"><div class="flex items-center gap-3"><p class="whitespace-nowrap text-muted">แสดง {{ resultStart }}–{{ resultEnd }} จาก {{ filteredPlacements.length }} รายการ</p><div class="w-20 shrink-0"><UiSelect v-model="pageSize" :options="pageSizeOptions" :placeholder="pageSize" label="จำนวนรายการต่อหน้า" :label-visible="false" /></div></div><nav class="flex items-center gap-2" aria-label="การแบ่งหน้านักศึกษาที่พร้อมจัดกลุ่ม"><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:opacity-45" :disabled="currentPage === 1" aria-label="หน้าก่อนหน้า" @click="currentPage--"><ChevronLeft :size="18" aria-hidden="true" /></button><span class="min-w-20 text-center font-semibold text-ink">หน้า {{ currentPage }} / {{ pageCount }}</span><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:opacity-45" :disabled="currentPage === pageCount" aria-label="หน้าถัดไป" @click="currentPage++"><ChevronRight :size="18" aria-hidden="true" /></button></nav></div>
      </template>
    </UiCard>
  </div>
</template>
