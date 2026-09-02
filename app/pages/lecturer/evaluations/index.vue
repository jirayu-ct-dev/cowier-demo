<script setup lang="ts">
import { ChevronLeft, ChevronRight, ClipboardCheck, RotateCcw, Search, X } from '@lucide/vue'
import type { SupervisionAppointment } from '~/composables/useSupervisionAppointments'
import { getPageCount, paginateItems } from '~/utils/table'

definePageMeta({ title: 'การประเมิน', middleware: 'lecturer' })
useHead({ title: 'การประเมิน' })

const { scenario } = useScenario()
const { cycleId, round } = useSupervisionContext()
const { groups, getCompanies } = useSupervisionGroups()
const { appointments } = useSupervisionAppointments()
const { studentEvaluations, companyEvaluations } = useSupervisionEvaluations()
const currentLecturerId = 'L0012'
const searchQuery = ref('')
const statusFilter = ref('all')
const pageSize = ref('10')
const currentPage = ref(1)
const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)
const companies = computed(() => getCompanies(cycleId.value))
const statusOptions = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'not-ready', label: 'รอนิเทศเสร็จ' },
  { value: 'pending', label: 'ยังไม่เริ่มประเมิน' },
  { value: 'in-progress', label: 'กำลังประเมิน' },
  { value: 'completed', label: 'ประเมินครบแล้ว' },
]
const pageSizeOptions = ['10', '20', '50'].map(value => ({ value, label: value }))

const company = (id: string) => companies.value.find(item => item.id === id)
const groupName = (id: string) => groups.value.find(group => group.id === id)?.name ?? id
const evaluatorIds = (appointment: SupervisionAppointment) => appointment.result.actualLecturerIds.length
  ? appointment.result.actualLecturerIds
  : appointment.lecturerIds
const evaluationProgress = (appointment: SupervisionAppointment) => {
  const studentSubmitted = studentEvaluations.value.filter(evaluation => evaluation.appointmentId === appointment.id
    && evaluation.lecturerId === currentLecturerId
    && appointment.studentIds.includes(evaluation.studentId)
    && evaluation.status === 'submitted').length
  const requiresCompany = evaluatorIds(appointment)[0] === currentLecturerId
  const companySubmitted = requiresCompany && companyEvaluations.value.some(evaluation => evaluation.appointmentId === appointment.id && evaluation.status === 'submitted') ? 1 : 0
  return { submitted: studentSubmitted + companySubmitted, required: appointment.studentIds.length + (requiresCompany ? 1 : 0) }
}
const evaluationState = (appointment: SupervisionAppointment) => {
  if (appointment.status !== 'completed') return 'not-ready'
  const progress = evaluationProgress(appointment)
  if (progress.submitted === progress.required) return 'completed'
  if (progress.submitted) return 'in-progress'
  return 'pending'
}
const evaluationStatusMeta = {
  'not-ready': { label: 'รอนิเทศเสร็จ', tone: 'neutral' as const },
  pending: { label: 'ยังไม่เริ่มประเมิน', tone: 'warning' as const },
  'in-progress': { label: 'กำลังประเมิน', tone: 'info' as const },
  completed: { label: 'ประเมินครบแล้ว', tone: 'success' as const },
}
const currentAppointments = computed(() => {
  if (scenario.value.viewState === 'empty') return []
  const keyword = searchQuery.value.trim().toLocaleLowerCase('th')
  return appointments.value
    .filter(appointment => appointment.cycleId === cycleId.value && appointment.round === round.value)
    .filter(appointment => evaluatorIds(appointment).includes(currentLecturerId))
    .filter(appointment => statusFilter.value === 'all' || evaluationState(appointment) === statusFilter.value)
    .filter((appointment) => {
      const appointmentCompany = company(appointment.companyId)
      const searchable = [appointment.id, appointmentCompany?.name, appointmentCompany?.province, groupName(appointment.groupId)]
      return !keyword || searchable.some(value => value?.toLocaleLowerCase('th').includes(keyword))
    })
    .toSorted((a, b) => b.date.localeCompare(a.date))
})
const pageSizeNumber = computed(() => Number(pageSize.value))
const pageCount = computed(() => getPageCount(currentAppointments.value.length, pageSizeNumber.value))
const paginatedAppointments = computed(() => paginateItems(currentAppointments.value, currentPage.value, pageSizeNumber.value))
const resultStart = computed(() => currentAppointments.value.length ? (currentPage.value - 1) * pageSizeNumber.value + 1 : 0)
const resultEnd = computed(() => Math.min(currentPage.value * pageSizeNumber.value, currentAppointments.value.length))
const hasFilters = computed(() => Boolean(searchQuery.value.trim()) || statusFilter.value !== 'all')

watch([searchQuery, statusFilter, pageSize, cycleId, round], () => { currentPage.value = 1 })
watch(pageCount, (count) => { if (currentPage.value > count) currentPage.value = count })

const clearFilters = () => { searchQuery.value = ''; statusFilter.value = 'all' }
const resetTable = () => { clearFilters(); pageSize.value = '10'; currentPage.value = 1 }
const retry = () => { scenario.value.forceError = false; scenario.value.viewState = 'data' }
const formatDate = (date: string) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00+07:00`))
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">การประเมิน</h2>
      <p class="mt-1 text-sm leading-6 text-muted">ประเมินนักศึกษาและสถานประกอบการหลังจากบันทึกว่านิเทศเสร็จแล้ว</p>
    </div>

    <UiCard :padded="false">
      <div class="border-b border-divider p-5 sm:p-6">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label class="block w-full text-sm font-semibold text-ink sm:max-w-md lg:w-96 lg:flex-none"><span class="sr-only">ค้นหางานประเมิน</span><span class="relative block"><Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" /><input v-model="searchQuery" type="search" class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 font-normal placeholder:text-gray-400" placeholder="ค้นหาบริษัท กลุ่ม หรือเลขที่รายการ"></span></label>
          <div class="flex items-center gap-2 lg:ml-auto"><div class="w-full sm:w-56"><UiSelect v-model="statusFilter" :options="statusOptions" label="กรองสถานะการประเมิน" :label-visible="false" /></div><button type="button" class="inline-grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-ink hover:bg-surface" aria-label="รีเซ็ตตาราง" title="รีเซ็ตตาราง" @click="resetTable"><RotateCcw :size="18" aria-hidden="true" /></button></div>
        </div>
        <div v-if="hasFilters" class="mt-3 flex flex-wrap items-center gap-2 text-sm"><span class="text-muted">ตัวกรองที่ใช้:</span><span v-if="searchQuery" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">คำค้น “{{ searchQuery }}”</span><span v-if="statusFilter !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ statusOptions.find(option => option.value === statusFilter)?.label }}</span><button type="button" class="inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-semibold text-warning hover:bg-warning-soft" @click="clearFilters"><X :size="15" aria-hidden="true" />ล้างทั้งหมด</button></div>
      </div>

      <div v-if="effectiveViewState === 'loading'" class="space-y-3 p-5 sm:p-6" aria-label="กำลังโหลดงานประเมิน"><div v-for="row in 4" :key="row" class="grid grid-cols-[1.5fr_8rem_10rem_7rem] gap-4 max-md:grid-cols-[1fr_8rem]"><UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" /></div></div>
      <div v-else-if="effectiveViewState === 'error'" class="p-5 sm:p-6"><AppErrorState title="โหลดงานประเมินไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองดึงข้อมูลอีกครั้ง" @retry="retry" /></div>
      <div v-else-if="!paginatedAppointments.length" class="p-5 sm:p-6"><AppEmptyState :title="hasFilters ? 'ไม่พบงานประเมินที่ตรงกับตัวกรอง' : 'ยังไม่มีงานประเมินในรอบนี้'" :description="hasFilters ? 'ลองเปลี่ยนคำค้นหรือล้างตัวกรองที่ใช้อยู่' : 'รายการนิเทศที่คุณเข้าร่วมจะแสดงที่นี่'"><UiButton v-if="hasFilters" variant="secondary" @click="clearFilters">ล้างตัวกรอง</UiButton></AppEmptyState></div>

      <template v-else>
        <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[900px] text-left text-sm"><caption class="sr-only">รายการงานประเมินหลังการนิเทศ</caption><thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase"><tr><th class="px-6 py-3">สถานประกอบการ / กลุ่ม</th><th class="px-4 py-3">วันที่นิเทศ</th><th class="px-4 py-3">ความคืบหน้า</th><th class="px-4 py-3">สถานะ</th><th class="w-28 px-4 py-3"><span class="sr-only">ดำเนินการ</span></th></tr></thead><tbody class="divide-y divide-divider"><tr v-for="appointment in paginatedAppointments" :key="appointment.id" class="hover:bg-surface/70"><td class="px-6 py-4"><p class="font-semibold text-ink">{{ company(appointment.companyId)?.name ?? appointment.companyId }}</p><p class="mt-1 text-xs text-muted">{{ appointment.id }} · {{ groupName(appointment.groupId) }} · นิเทศครั้งที่ {{ appointment.round }}</p></td><td class="whitespace-nowrap px-4 py-4 text-muted">{{ formatDate(appointment.date) }}</td><td class="whitespace-nowrap px-4 py-4 text-ink">{{ evaluationProgress(appointment).submitted }} / {{ evaluationProgress(appointment).required }} รายการ</td><td class="px-4 py-4"><UiBadge :tone="evaluationStatusMeta[evaluationState(appointment)].tone">{{ evaluationStatusMeta[evaluationState(appointment)].label }}</UiBadge></td><td class="px-4 py-4 text-right"><UiButton v-if="appointment.status === 'completed'" class="whitespace-nowrap" size="sm" variant="secondary" :icon="ClipboardCheck" @click="navigateTo(`/lecturer/evaluations/${appointment.id}`)">{{ evaluationState(appointment) === 'completed' ? 'ดูผล' : 'ประเมิน' }}</UiButton><span v-else class="text-xs text-muted">รอนิเทศเสร็จ</span></td></tr></tbody></table></div>
        <div class="divide-y divide-divider md:hidden"><article v-for="appointment in paginatedAppointments" :key="appointment.id" class="p-5"><div class="flex items-start justify-between gap-3"><div><h3 class="font-semibold text-ink">{{ company(appointment.companyId)?.name ?? appointment.companyId }}</h3><p class="mt-1 text-xs text-muted">{{ appointment.id }} · {{ groupName(appointment.groupId) }}</p></div><UiBadge :tone="evaluationStatusMeta[evaluationState(appointment)].tone">{{ evaluationStatusMeta[evaluationState(appointment)].label }}</UiBadge></div><div class="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p class="text-xs text-muted">วันที่นิเทศ</p><p class="mt-1 text-ink">{{ formatDate(appointment.date) }}</p></div><div><p class="text-xs text-muted">ความคืบหน้า</p><p class="mt-1 text-ink">{{ evaluationProgress(appointment).submitted }} / {{ evaluationProgress(appointment).required }} รายการ</p></div></div><div class="mt-4 flex justify-end border-t border-divider pt-3"><UiButton v-if="appointment.status === 'completed'" size="sm" variant="secondary" :icon="ClipboardCheck" @click="navigateTo(`/lecturer/evaluations/${appointment.id}`)">{{ evaluationState(appointment) === 'completed' ? 'ดูผลประเมิน' : 'เริ่มประเมิน' }}</UiButton><span v-else class="text-xs text-muted">ประเมินได้หลังนิเทศเสร็จ</span></div></article></div>
        <div class="flex flex-col gap-3 border-t border-divider px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"><div class="flex items-center gap-3"><p class="whitespace-nowrap text-muted">แสดง {{ resultStart }}–{{ resultEnd }} จาก {{ currentAppointments.length }} รายการ</p><div class="w-20 shrink-0"><UiSelect v-model="pageSize" :options="pageSizeOptions" label="จำนวนรายการต่อหน้า" :label-visible="false" /></div></div><nav class="flex items-center gap-2" aria-label="การแบ่งหน้าตาราง"><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:opacity-45" :disabled="currentPage === 1" aria-label="หน้าก่อนหน้า" @click="currentPage--"><ChevronLeft :size="18" aria-hidden="true" /></button><span class="min-w-20 text-center font-semibold text-ink">หน้า {{ currentPage }} / {{ pageCount }}</span><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:opacity-45" :disabled="currentPage === pageCount" aria-label="หน้าถัดไป" @click="currentPage++"><ChevronRight :size="18" aria-hidden="true" /></button></nav></div>
      </template>
    </UiCard>
  </div>
</template>
