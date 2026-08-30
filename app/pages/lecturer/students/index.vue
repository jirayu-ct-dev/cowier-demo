<script setup lang="ts">
import { ChevronLeft, ChevronRight, Eye, RotateCcw, Search, X } from '@lucide/vue'
import { getPageCount, paginateItems } from '~/utils/table'

definePageMeta({ title: 'ข้อมูลนักศึกษา', middleware: 'lecturer-prototype' })
useHead({ title: 'ข้อมูลนักศึกษา' })

const { scenario } = useScenario()
const { people, getStudentApplicationHistory } = usePeopleDirectory()
const search = ref('')
const applicationStatus = ref('all')
const pageSize = ref('10')
const currentPage = ref(1)
const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)
const statusOptions = [
  { value: 'all', label: 'ทุกสถานะคำร้อง' },
  { value: 'in-progress', label: 'กำลังดำเนินการ' },
  { value: 'returned', label: 'ส่งกลับแก้ไข' },
  { value: 'confirmed', label: 'ยืนยันสถานประกอบการแล้ว' },
  { value: 'cancelled', label: 'ยกเลิกแล้ว' },
]
const pageSizeOptions = ['10', '20', '50', '100'].map(value => ({ value, label: value }))

const filteredStudents = computed(() => {
  if (scenario.value.viewState === 'empty') return []
  const keyword = search.value.trim().toLocaleLowerCase('th')
  return people.value
    .filter(person => person.type === 'student')
    .filter((person) => {
      const history = getStudentApplicationHistory(person.id)
      const searchable = [person.id, person.prefix, person.firstName, person.lastName, ...history.map(item => item.company)]
      const matchesSearch = !keyword || searchable.some(value => value.toLocaleLowerCase('th').includes(keyword))
      const latestStatus = history[0]?.status
      const matchesStatus = applicationStatus.value === 'all'
        || latestStatus === applicationStatus.value
        || (applicationStatus.value === 'in-progress' && ['submitted', 'letter-issued'].includes(latestStatus || ''))
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`, 'th'))
})
const pageSizeNumber = computed(() => Number(pageSize.value))
const pageCount = computed(() => getPageCount(filteredStudents.value.length, pageSizeNumber.value))
const paginatedStudents = computed(() => paginateItems(filteredStudents.value, currentPage.value, pageSizeNumber.value))
const resultStart = computed(() => filteredStudents.value.length ? (currentPage.value - 1) * pageSizeNumber.value + 1 : 0)
const resultEnd = computed(() => Math.min(currentPage.value * pageSizeNumber.value, filteredStudents.value.length))
const hasFilters = computed(() => Boolean(search.value) || applicationStatus.value !== 'all')
watch([search, applicationStatus, pageSize], () => { currentPage.value = 1 })
const clearFilters = () => { search.value = ''; applicationStatus.value = 'all' }
const resetTable = () => { clearFilters(); pageSize.value = '10'; currentPage.value = 1 }
const retry = () => { scenario.value.forceError = false; scenario.value.viewState = 'data' }
</script>

<template>
  <div>
    <div class="mb-6"><h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">ข้อมูลนักศึกษา</h2><p class="mt-1 text-sm leading-6 text-muted">ค้นหานักศึกษาทุกคน ดูสถานะและประวัติคำร้อง หรือแก้ไขเฉพาะชื่อ–นามสกุล</p></div>
    <UiCard :padded="false">
      <div class="border-b border-divider p-5 sm:p-6">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label class="block w-full text-sm font-semibold text-ink sm:max-w-md lg:w-96 lg:flex-none"><span class="sr-only">ค้นหานักศึกษา</span><span class="relative block"><Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" /><input v-model="search" type="search" class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 font-normal placeholder:text-gray-400" placeholder="ค้นหารหัส ชื่อ นามสกุล หรือบริษัท"></span></label>
          <div class="flex items-center gap-2 lg:ml-auto"><div class="w-full sm:w-60"><UiSelect v-model="applicationStatus" :options="statusOptions" :placeholder="statusOptions.find(item => item.value === applicationStatus)?.label" label="กรองสถานะคำร้อง" :label-visible="false" /></div><button type="button" class="inline-grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-ink hover:bg-surface" aria-label="รีเซ็ตตาราง" title="รีเซ็ตตาราง" @click="resetTable"><RotateCcw :size="18" aria-hidden="true" /></button></div>
        </div>
        <div v-if="hasFilters" class="mt-3 flex flex-wrap items-center gap-2 text-sm"><span class="text-muted">ตัวกรองที่ใช้:</span><span v-if="search" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">คำค้น “{{ search }}”</span><span v-if="applicationStatus !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ statusOptions.find(item => item.value === applicationStatus)?.label }}</span><button type="button" class="inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-semibold text-warning hover:bg-warning-soft" @click="clearFilters"><X :size="15" aria-hidden="true" />ล้างทั้งหมด</button></div>
      </div>
      <div v-if="effectiveViewState === 'loading'" class="space-y-3 p-5 sm:p-6" aria-label="กำลังโหลดข้อมูลนักศึกษา"><div v-for="row in 4" :key="row" class="grid grid-cols-[1fr_1fr_10rem_3rem] gap-4 max-md:grid-cols-[1fr_8rem]"><UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" /></div></div>
      <div v-else-if="effectiveViewState === 'error'" class="p-5 sm:p-6"><AppErrorState title="โหลดข้อมูลนักศึกษาไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองดึงข้อมูลอีกครั้ง" @retry="retry" /></div>
      <div v-else-if="!paginatedStudents.length" class="p-5 sm:p-6"><AppEmptyState :title="hasFilters ? 'ไม่พบนักศึกษาที่ตรงกับตัวกรอง' : 'ยังไม่มีข้อมูลนักศึกษา'" :description="hasFilters ? 'ลองเปลี่ยนคำค้นหรือล้างตัวกรองที่ใช้อยู่' : 'ข้อมูลนักศึกษาที่เจ้าหน้าที่เพิ่มจะปรากฏที่นี่'"><UiButton v-if="hasFilters" variant="secondary" @click="clearFilters">ล้างตัวกรอง</UiButton></AppEmptyState></div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[850px] text-left text-sm"><caption class="sr-only">ข้อมูลนักศึกษาสำหรับอาจารย์</caption><thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase"><tr><th class="px-6 py-3">นักศึกษา</th><th class="px-4 py-3">คำร้องล่าสุด / สถานประกอบการ</th><th class="px-4 py-3">สถานะล่าสุด</th><th class="w-20 px-4 py-3"><span class="sr-only">ดูรายละเอียด</span></th></tr></thead><tbody class="divide-y divide-divider"><tr v-for="student in paginatedStudents" :key="student.id" class="hover:bg-surface/70"><td class="px-6 py-4"><p class="font-semibold text-ink">{{ getPersonFullName(student) }}</p><p class="mt-1 text-xs text-muted">{{ student.id }}</p></td><td class="max-w-md px-4 py-4"><template v-if="getStudentApplicationHistory(student.id)[0]"><p class="font-medium text-ink">{{ getStudentApplicationHistory(student.id)[0]?.company }}</p><p class="mt-1 text-xs text-muted">{{ getStudentApplicationHistory(student.id)[0]?.id }} · {{ getStudentApplicationHistory(student.id)[0]?.position }}</p></template><p v-else class="text-muted">ยังไม่มีประวัติคำร้อง</p></td><td class="px-4 py-4"><UiBadge v-if="getStudentApplicationHistory(student.id)[0]" :tone="studentApplicationStatusMeta[getStudentApplicationHistory(student.id)[0]!.status].tone">{{ studentApplicationStatusMeta[getStudentApplicationHistory(student.id)[0]!.status].label }}</UiBadge><UiBadge v-else tone="neutral">ยังไม่มีคำร้อง</UiBadge></td><td class="px-4 py-4 text-right"><NuxtLink :to="`/lecturer/students/${student.id}`" class="inline-grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink" :aria-label="`ดูรายละเอียด ${getPersonFullName(student)}`" title="ดูรายละเอียด"><Eye :size="15" aria-hidden="true" /></NuxtLink></td></tr></tbody></table></div>
        <div class="divide-y divide-divider md:hidden"><article v-for="student in paginatedStudents" :key="student.id" class="p-5"><div class="flex items-start justify-between gap-3"><div><h3 class="font-semibold text-ink">{{ getPersonFullName(student) }}</h3><p class="mt-1 text-xs text-muted">{{ student.id }}</p></div><UiBadge v-if="getStudentApplicationHistory(student.id)[0]" :tone="studentApplicationStatusMeta[getStudentApplicationHistory(student.id)[0]!.status].tone">{{ studentApplicationStatusMeta[getStudentApplicationHistory(student.id)[0]!.status].label }}</UiBadge></div><p class="mt-4 text-sm text-muted">{{ getStudentApplicationHistory(student.id)[0]?.company || 'ยังไม่มีประวัติคำร้อง' }}</p><div class="mt-4 flex justify-end border-t border-divider pt-3"><UiButton size="sm" variant="secondary" :icon="Eye" @click="navigateTo(`/lecturer/students/${student.id}`)">ดูรายละเอียด</UiButton></div></article></div>
        <div class="flex flex-col gap-3 border-t border-divider px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"><div class="flex items-center gap-3"><p class="whitespace-nowrap text-muted">แสดง {{ resultStart }}–{{ resultEnd }} จาก {{ filteredStudents.length }} รายการ</p><div class="w-20 shrink-0"><UiSelect v-model="pageSize" :options="pageSizeOptions" :placeholder="pageSize" label="จำนวนรายการต่อหน้า" :label-visible="false" /></div></div><nav class="flex items-center gap-2" aria-label="การแบ่งหน้าตาราง"><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:opacity-45" :disabled="currentPage === 1" aria-label="หน้าก่อนหน้า" @click="currentPage--"><ChevronLeft :size="18" aria-hidden="true" /></button><span class="min-w-20 text-center font-semibold text-ink">หน้า {{ currentPage }} / {{ pageCount }}</span><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:opacity-45" :disabled="currentPage === pageCount" aria-label="หน้าถัดไป" @click="currentPage++"><ChevronRight :size="18" aria-hidden="true" /></button></nav></div>
      </template>
    </UiCard>
  </div>
</template>
