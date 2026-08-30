<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Eye, Plus, RotateCcw, Search, Upload, X } from '@lucide/vue'
import type { PeopleFileFormat } from '~/composables/usePeopleImport'
import type { PersonType } from '~/composables/usePeopleDirectory'
import { getPageCount, paginateItems } from '~/utils/table'

definePageMeta({ title: 'ข้อมูลบุคคล', middleware: 'staff-prototype' })

const route = useRoute()
const { scenario } = useScenario()
const { showToast } = useToast()
const { people } = usePeopleDirectory()
const { exportPeople } = usePeopleImport()

const personType = computed<PersonType>(() => route.params.type === 'lecturers' ? 'lecturer' : 'student')
const isValidType = computed(() => ['students', 'lecturers'].includes(String(route.params.type)))
if (!isValidType.value) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

const context = computed(() => personType.value === 'student'
  ? { title: 'ข้อมูลนักศึกษา', singular: 'นักศึกษา', idLabel: 'รหัสนักศึกษา' }
  : { title: 'ข้อมูลอาจารย์', singular: 'อาจารย์', idLabel: 'รหัสอาจารย์' })
useHead({ title: () => context.value.title })

const search = ref('')
const recordStatus = ref('all')
const accountStatus = ref('all')
const sortDirection = ref<'asc' | 'desc'>('asc')
const pageSize = ref('10')
const currentPage = ref(1)
const exportFormat = ref<PeopleFileFormat>('xlsx')
const isExporting = ref(false)
const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)

const recordStatusOptions = [
  { value: 'all', label: 'ทุกสถานะข้อมูล' },
  { value: 'active', label: 'ใช้งาน' },
  { value: 'inactive', label: 'ยุติการใช้งาน' },
]
const accountStatusOptions = [
  { value: 'all', label: 'ทุกสถานะบัญชี' },
  { value: 'first-login', label: 'รอเข้าสู่ระบบครั้งแรก' },
  { value: 'active', label: 'ใช้งาน' },
  { value: 'suspended', label: 'ระงับชั่วคราว' },
  { value: 'terminated', label: 'ยุติการใช้งาน' },
]
const pageSizeOptions = ['10', '20', '50', '100'].map(value => ({ value, label: value }))
const exportFormatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
]

const filteredPeople = computed(() => {
  if (scenario.value.viewState === 'empty') return []
  const keyword = search.value.trim().toLocaleLowerCase('th')
  return people.value
    .filter(person => person.type === personType.value)
    .filter(person => !keyword || [person.id, person.prefix, person.firstName, person.lastName, person.company]
      .some(value => value?.toLocaleLowerCase('th').includes(keyword)))
    .filter(person => recordStatus.value === 'all' || person.recordStatus === recordStatus.value)
    .filter(person => accountStatus.value === 'all' || person.accountStatus === accountStatus.value)
    .sort((a, b) => {
      const comparison = `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`, 'th')
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
})
const pageSizeNumber = computed(() => Number(pageSize.value))
const pageCount = computed(() => getPageCount(filteredPeople.value.length, pageSizeNumber.value))
const paginatedPeople = computed(() => paginateItems(filteredPeople.value, currentPage.value, pageSizeNumber.value))
const resultStart = computed(() => filteredPeople.value.length ? (currentPage.value - 1) * pageSizeNumber.value + 1 : 0)
const resultEnd = computed(() => Math.min(currentPage.value * pageSizeNumber.value, filteredPeople.value.length))
const hasFilters = computed(() => Boolean(search.value) || recordStatus.value !== 'all' || accountStatus.value !== 'all')

watch([search, recordStatus, accountStatus, pageSize, personType], () => { currentPage.value = 1 })
watch(pageCount, count => { if (currentPage.value > count) currentPage.value = count })

const clearFilters = () => {
  search.value = ''
  recordStatus.value = 'all'
  accountStatus.value = 'all'
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
const handleExport = async () => {
  if (isExporting.value) return
  isExporting.value = true
  try {
    await exportPeople(people.value, personType.value, exportFormat.value)
    showToast({ title: `ส่งออก${context.value.title}แล้ว`, description: `${people.value.filter(person => person.type === personType.value).length} รายการ · ${exportFormat.value.toUpperCase()}` })
  }
  catch (error) {
    console.error(error)
    showToast({ title: 'ส่งออกข้อมูลไม่สำเร็จ', description: 'กรุณาลองอีกครั้ง' })
  }
  finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{{ context.title }}</h2>
        <p class="mt-1 text-sm leading-6 text-muted">ค้นหา เพิ่ม แก้ไข และจัดการสถานะข้อมูลกับบัญชีโดยไม่ลบประวัติเดิม</p>
      </div>
      <div class="flex flex-wrap gap-2 sm:justify-end">
        <UiButton variant="secondary" :icon="Upload" @click="navigateTo({ path: '/staff/master-data/import', query: { type: personType } })">นำเข้าข้อมูล</UiButton>
        <UiDialog :title="`ส่งออก${context.title}`" description="ไฟล์จะมีรหัส ชื่อ นามสกุล และสถานะข้อมูล โดยไม่รวมรหัสผ่านหรือข้อมูลยืนยันตัวตน">
          <template #trigger><UiButton variant="secondary" :icon="Download">ส่งออกข้อมูล</UiButton></template>
          <UiSelect v-model="exportFormat" :options="exportFormatOptions" :placeholder="exportFormatOptions.find(item => item.value === exportFormat)?.label" label="รูปแบบไฟล์" />
          <template #cancel><UiButton variant="ghost">ยกเลิก</UiButton></template>
          <template #confirm><UiButton :loading="isExporting" :icon="Download" @click="handleExport">ดาวน์โหลดไฟล์</UiButton></template>
        </UiDialog>
        <UiButton :icon="Plus" @click="navigateTo(`/staff/master-data/${route.params.type}/new`)">เพิ่ม{{ context.singular }}</UiButton>
      </div>
    </div>

    <UiCard :padded="false">
      <div class="border-b border-divider p-5 sm:p-6">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <label class="block w-full text-sm font-semibold text-ink sm:max-w-md xl:w-96 xl:flex-none">
            <span class="sr-only">ค้นหา{{ context.singular }}</span>
            <span class="relative block">
              <Search :size="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input v-model="search" type="search" class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 font-normal placeholder:text-gray-400" :placeholder="`ค้นหา${context.idLabel} ชื่อ หรือนามสกุล`">
            </span>
          </label>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center xl:ml-auto">
            <div class="w-full sm:w-52"><UiSelect :key="`record-${personType}`" v-model="recordStatus" :options="recordStatusOptions" :placeholder="recordStatusOptions.find(item => item.value === recordStatus)?.label" label="กรองสถานะข้อมูล" :label-visible="false" /></div>
            <div class="w-full sm:w-56"><UiSelect :key="`account-${personType}`" v-model="accountStatus" :options="accountStatusOptions" :placeholder="accountStatusOptions.find(item => item.value === accountStatus)?.label" label="กรองสถานะบัญชี" :label-visible="false" /></div>
            <button type="button" class="inline-grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-ink transition-colors hover:bg-surface" aria-label="รีเซ็ตตาราง" title="รีเซ็ตตาราง" @click="resetTable"><RotateCcw :size="18" aria-hidden="true" /></button>
          </div>
        </div>
        <div v-if="hasFilters" class="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span class="text-muted">ตัวกรองที่ใช้:</span>
          <span v-if="search" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">คำค้น “{{ search }}”</span>
          <span v-if="recordStatus !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ recordStatusOptions.find(item => item.value === recordStatus)?.label }}</span>
          <span v-if="accountStatus !== 'all'" class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink">{{ accountStatusOptions.find(item => item.value === accountStatus)?.label }}</span>
          <button type="button" class="inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-semibold text-warning hover:bg-warning-soft" @click="clearFilters"><X :size="15" aria-hidden="true" />ล้างทั้งหมด</button>
        </div>
      </div>

      <div v-if="effectiveViewState === 'loading'" class="space-y-3 p-5 sm:p-6" :aria-label="`กำลังโหลด${context.title}`">
        <div v-for="row in 4" :key="row" class="grid grid-cols-[1fr_1fr_9rem_9rem_3rem] gap-4 max-md:grid-cols-[1fr_8rem]"><UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10" /><UiSkeleton class="h-10 max-md:hidden" /><UiSkeleton class="h-10 max-md:hidden" /></div>
      </div>
      <div v-else-if="effectiveViewState === 'error'" class="p-5 sm:p-6"><AppErrorState :title="`โหลด${context.title}ไม่สำเร็จ`" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองดึงข้อมูลอีกครั้ง" @retry="retry" /></div>
      <div v-else-if="!paginatedPeople.length" class="p-5 sm:p-6">
        <AppEmptyState :title="hasFilters ? 'ไม่พบข้อมูลที่ตรงกับตัวกรอง' : `ยังไม่มี${context.title}`" :description="hasFilters ? 'ลองเปลี่ยนคำค้นหรือล้างตัวกรองที่ใช้อยู่' : `เพิ่ม${context.singular}คนแรกเพื่อสร้างข้อมูลและบัญชีผู้ใช้`">
          <UiButton v-if="hasFilters" variant="secondary" @click="clearFilters">ล้างตัวกรอง</UiButton>
          <UiButton v-else :icon="Plus" @click="navigateTo(`/staff/master-data/${route.params.type}/new`)">เพิ่ม{{ context.singular }}</UiButton>
        </AppEmptyState>
      </div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[900px] border-collapse text-left text-sm">
            <caption class="sr-only">{{ context.title }}</caption>
            <thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" class="px-6 py-3">{{ context.idLabel }}</th>
                <th scope="col" class="px-4 py-3" :aria-sort="sortDirection === 'asc' ? 'ascending' : 'descending'">
                  <button type="button" class="inline-flex items-center gap-1 font-semibold hover:text-ink" :aria-label="`เรียงชื่อ${sortDirection === 'asc' ? 'จาก ฮ ถึง ก' : 'จาก ก ถึง ฮ'}`" @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'">ชื่อ–นามสกุล <ArrowUp v-if="sortDirection === 'asc'" :size="15" aria-hidden="true" /><ArrowDown v-else :size="15" aria-hidden="true" /></button>
                </th>
                <th v-if="personType === 'student'" scope="col" class="px-4 py-3">รอบ / สถานประกอบการ</th>
                <th scope="col" class="px-4 py-3">สถานะข้อมูล</th>
                <th scope="col" class="px-4 py-3">สถานะบัญชี</th>
                <th scope="col" class="w-20 px-4 py-3"><span class="sr-only">ดูรายละเอียด</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider">
              <tr v-for="person in paginatedPeople" :key="person.id" class="transition-colors hover:bg-surface/70">
                <td class="whitespace-nowrap px-6 py-4 font-semibold text-ink">{{ person.id }}</td>
                <td class="px-4 py-4"><p class="font-semibold text-ink">{{ getPersonFullName(person) }}</p><p class="mt-1 text-xs text-muted">ชื่อผู้ใช้: {{ person.id }}</p></td>
                <td v-if="personType === 'student'" class="max-w-sm px-4 py-4"><p class="text-ink">{{ person.cycle || 'ยังไม่กำหนดรอบ' }}</p><p class="mt-1 truncate text-xs text-muted">{{ person.company || 'ยังไม่มีสถานประกอบการที่ยืนยัน' }}</p></td>
                <td class="px-4 py-4"><UiBadge :tone="recordStatusMeta[person.recordStatus].tone">{{ recordStatusMeta[person.recordStatus].label }}</UiBadge></td>
                <td class="px-4 py-4"><UiBadge :tone="accountStatusMeta[person.accountStatus].tone">{{ accountStatusMeta[person.accountStatus].label }}</UiBadge></td>
                <td class="px-4 py-4 text-right"><NuxtLink :to="`/staff/master-data/${route.params.type}/${person.id}`" class="inline-grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink" :aria-label="`ดูรายละเอียด ${getPersonFullName(person)}`" title="ดูรายละเอียด"><Eye :size="15" aria-hidden="true" /></NuxtLink></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-divider md:hidden">
          <article v-for="person in paginatedPeople" :key="person.id" class="p-5">
            <div class="flex items-start justify-between gap-3"><div><h3 class="font-semibold text-ink">{{ getPersonFullName(person) }}</h3><p class="mt-1 text-xs text-muted">{{ person.id }}</p></div><UiBadge :tone="recordStatusMeta[person.recordStatus].tone">{{ recordStatusMeta[person.recordStatus].label }}</UiBadge></div>
            <div class="mt-4 flex items-end justify-between gap-3 border-t border-divider pt-3"><div><p class="text-xs text-muted">สถานะบัญชี</p><div class="mt-1"><UiBadge :tone="accountStatusMeta[person.accountStatus].tone">{{ accountStatusMeta[person.accountStatus].label }}</UiBadge></div></div><UiButton size="sm" variant="secondary" :icon="Eye" @click="navigateTo(`/staff/master-data/${route.params.type}/${person.id}`)">ดูรายละเอียด</UiButton></div>
          </article>
        </div>

        <div class="flex flex-col gap-3 border-t border-divider px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div class="flex items-center gap-3"><p class="whitespace-nowrap text-muted">แสดง {{ resultStart }}–{{ resultEnd }} จาก {{ filteredPeople.length }} รายการ</p><div class="w-20 shrink-0"><UiSelect :key="`page-size-${personType}`" v-model="pageSize" :options="pageSizeOptions" :placeholder="pageSize" label="จำนวนรายการต่อหน้า" :label-visible="false" /></div></div>
          <nav class="flex items-center gap-2" aria-label="การแบ่งหน้าตาราง"><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:opacity-45" :disabled="currentPage === 1" aria-label="หน้าก่อนหน้า" @click="currentPage--"><ChevronLeft :size="18" aria-hidden="true" /></button><span class="min-w-20 text-center font-semibold text-ink">หน้า {{ currentPage }} / {{ pageCount }}</span><button type="button" class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted hover:bg-surface disabled:opacity-45" :disabled="currentPage === pageCount" aria-label="หน้าถัดไป" @click="currentPage++"><ChevronRight :size="18" aria-hidden="true" /></button></nav>
        </div>
      </template>
    </UiCard>
  </div>
</template>
