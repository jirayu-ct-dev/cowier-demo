<script setup lang="ts">
import { ArrowLeft, Building2, Pencil, RotateCcw, Search, Trash2, UserRoundCheck } from '@lucide/vue'
import { z } from 'zod'
import type { CompanyInput, SupervisionPlacement } from '~/composables/useSupervisionGroups'

definePageMeta({ title: 'รายละเอียดสถานประกอบการ', middleware: 'company-access', alias: ['/staff/companies/:id', '/lecturer/companies/:id'] })

const route = useRoute()
const { scenario } = useScenario()
const { getCompanyRecord, getCompanyPlacements, getStudentProfile, updateCompany, deactivateCompany, restoreCompany, deleteCompany, updateCompanyStudent } = useSupervisionGroups()
const { showToast } = useToast()
const companyId = computed(() => String(route.params.id))
const company = computed(() => getCompanyRecord(companyId.value))
const placements = computed(() => company.value ? getCompanyPlacements(company.value.id) : [])
const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)
const companyBasePath = computed(() => scenario.value.role === 'lecturer' ? '/lecturer/companies' : '/staff/companies')
const isSaving = ref(false)
const companyDialogOpen = ref(false)
const studentSearch = ref('')
const selectedPlacement = ref<SupervisionPlacement | null>(null)
const studentDialogOpen = computed({
  get: () => selectedPlacement.value !== null,
  set: value => { if (!value) selectedPlacement.value = null },
})
const studentForm = reactive({ prefix: 'นาย', firstName: '', lastName: '', section: 'หมู่ 1', position: '' })
const studentErrors = reactive<Partial<Record<keyof typeof studentForm, string>>>({})
const studentSchema = z.object({
  prefix: z.enum(personPrefixValues, { error: 'กรุณาเลือกคำนำหน้า' }),
  firstName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  lastName: z.string().trim().min(1, 'กรุณากรอกนามสกุล').max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
  section: z.enum(studentSectionValues, { error: 'กรุณาเลือกหมู่เรียน' }),
  position: z.string().trim().min(1, 'กรุณากรอกตำแหน่งฝึกงาน').max(150, 'ตำแหน่งต้องไม่เกิน 150 ตัวอักษร'),
})
const companyInitialValue = computed<CompanyInput>(() => company.value
  ? { name: company.value.name, branch: company.value.branch, province: company.value.province, region: company.value.region, address: company.value.address, contactName: company.value.contactName, contactPhone: company.value.contactPhone }
  : { name: '', branch: '', province: '', region: '', address: '', contactName: '', contactPhone: '' })
const visiblePlacements = computed(() => {
  const keyword = studentSearch.value.trim().toLocaleLowerCase('th')
  return placements.value.filter((placement) => {
    const profile = getStudentProfile(placement.studentId)
    return !keyword || [placement.studentId, `${profile.prefix}${placement.studentName}`, placement.position, profile.section].some(value => value.toLocaleLowerCase('th').includes(keyword))
  })
})

watch(company, value => { if (value) useHead({ title: `${value.name} · สถานประกอบการ` }) }, { immediate: true })
const retry = () => {
  scenario.value.forceError = false
  scenario.value.viewState = 'data'
}
const saveCompany = async (input: CompanyInput) => {
  if (!company.value || isSaving.value) return
  isSaving.value = true
  try {
    updateCompany(company.value, input)
    showToast({ title: 'บันทึกข้อมูลสถานประกอบการแล้ว', description: company.value.name })
    companyDialogOpen.value = false
  } catch {
    showToast({ title: 'บันทึกข้อมูลไม่สำเร็จ', description: 'กรุณาลองอีกครั้ง' })
  } finally {
    isSaving.value = false
  }
}
const openStudent = (placement: SupervisionPlacement) => {
  const [firstName = placement.studentName, lastName = ''] = placement.studentName.split(' ')
  const profile = getStudentProfile(placement.studentId)
  Object.assign(studentForm, { prefix: profile.prefix, firstName, lastName, section: profile.section === 'ยังไม่กำหนด' ? 'หมู่ 1' : profile.section, position: placement.position })
  Object.assign(studentErrors, { prefix: undefined, firstName: undefined, lastName: undefined, section: undefined, position: undefined })
  selectedPlacement.value = placement
}
const saveStudent = async () => {
  if (!selectedPlacement.value || isSaving.value) return
  Object.assign(studentErrors, { prefix: undefined, firstName: undefined, lastName: undefined, section: undefined, position: undefined })
  const result = studentSchema.safeParse(studentForm)
  if (!result.success) {
    result.error.issues.forEach((issue) => { studentErrors[issue.path[0] as keyof typeof studentForm] = issue.message })
    return
  }
  isSaving.value = true
  try {
    updateCompanyStudent(selectedPlacement.value.id, result.data)
    showToast({ title: 'บันทึกข้อมูลนักศึกษาแล้ว', description: selectedPlacement.value.studentId })
    selectedPlacement.value = null
  } catch {
    showToast({ title: 'บันทึกข้อมูลนักศึกษาไม่สำเร็จ', description: 'กรุณาลองอีกครั้ง' })
  } finally {
    isSaving.value = false
  }
}
const handleDeactivate = () => {
  if (!company.value) return
  deactivateCompany(company.value)
  showToast({ title: 'ยุติการใช้งานสถานประกอบการแล้ว', description: 'ข้อมูลและประวัตินักศึกษายังคงอยู่' })
}
const handleRestore = () => {
  if (!company.value) return
  restoreCompany(company.value)
  showToast({ title: 'เปิดใช้งานสถานประกอบการแล้ว', description: company.value.name })
}
const handleDelete = async () => {
  if (!company.value) return
  try {
    deleteCompany(company.value)
    showToast({ title: 'ลบสถานประกอบการแล้ว', description: 'รายการที่ไม่มีข้อมูลอ้างอิงถูกลบออกจากระบบ' })
    await navigateTo(companyBasePath.value)
  } catch {
    showToast({ title: 'ลบสถานประกอบการไม่ได้', description: 'สถานประกอบการนี้มีนักศึกษาหรือประวัติอ้างอิงอยู่' })
  }
}
</script>

<template>
  <div>
    <button type="button" class="mb-4 inline-flex min-h-10 items-center gap-2 rounded-control px-2 text-sm font-semibold text-muted hover:bg-surface hover:text-ink" @click="navigateTo(companyBasePath)"><ArrowLeft :size="17" aria-hidden="true" />กลับไปข้อมูลสถานประกอบการ</button>
    <div v-if="effectiveViewState === 'loading'" class="space-y-5" aria-label="กำลังโหลดรายละเอียดสถานประกอบการ"><UiSkeleton class="h-24" /><UiSkeleton class="h-96" /><UiSkeleton class="h-72" /></div>
    <AppErrorState v-else-if="effectiveViewState === 'error'" title="โหลดข้อมูลสถานประกอบการไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองอีกครั้ง" @retry="retry" />
    <AppEmptyState v-else-if="!company" title="ไม่พบสถานประกอบการ" description="รายการนี้อาจถูกลบหรือไม่มีอยู่ในข้อมูลตัวอย่าง"><UiButton variant="secondary" @click="navigateTo(companyBasePath)">กลับไปข้อมูลสถานประกอบการ</UiButton></AppEmptyState>
    <template v-else>
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p class="text-sm font-semibold text-primary">{{ company.id }} · {{ company.branch }}</p><h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{{ company.name }}</h2><p class="mt-1 text-sm leading-6 text-muted">{{ company.province }} · {{ company.region }}</p></div><UiBadge :tone="company.status === 'active' ? 'success' : 'neutral'">{{ company.status === 'active' ? 'ใช้งาน' : 'ยุติการใช้งาน' }}</UiBadge></header>

      <div class="grid gap-4 sm:grid-cols-3">
        <UiCard><p class="text-xs font-medium text-muted">นักศึกษาที่ฝึกอยู่</p><p class="mt-2 text-2xl font-bold text-ink">{{ placements.length }} คน</p></UiCard>
        <UiCard><p class="text-xs font-medium text-muted">รอบสหกิจศึกษา</p><p class="mt-2 text-2xl font-bold text-ink">{{ new Set(placements.map(item => item.cycleId)).size }} รอบ</p></UiCard>
        <UiCard><p class="text-xs font-medium text-muted">ผู้ประสานงาน</p><p class="mt-2 font-bold text-ink">{{ company.contactName }}</p><p class="mt-1 text-sm text-muted">{{ company.contactPhone }}</p></UiCard>
      </div>

      <UiCard class="mt-6">
        <div class="flex flex-col gap-4 border-b border-divider pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-control bg-info-soft text-info"><Building2 :size="20" aria-hidden="true" /></span><div><h3 class="text-lg font-bold text-ink">รายละเอียดสถานประกอบการ</h3><p class="mt-0.5 text-sm text-muted">ข้อมูลสำหรับติดต่อและใช้ในการจัดกลุ่มนิเทศ</p></div></div>
          <UiButton class="shrink-0" variant="secondary" :icon="Pencil" @click="companyDialogOpen = true">แก้ไขข้อมูล</UiButton>
        </div>
        <dl class="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div class="sm:col-span-2"><dt class="text-xs font-medium text-muted">ชื่อสถานประกอบการ</dt><dd class="mt-1.5 font-semibold text-ink">{{ company.name }}</dd></div>
          <div><dt class="text-xs font-medium text-muted">สาขา</dt><dd class="mt-1.5 text-sm text-ink">{{ company.branch }}</dd></div>
          <div><dt class="text-xs font-medium text-muted">จังหวัด / ภูมิภาค</dt><dd class="mt-1.5 text-sm text-ink">{{ company.province }} · {{ company.region }}</dd></div>
          <div><dt class="text-xs font-medium text-muted">ผู้ประสานงาน</dt><dd class="mt-1.5 text-sm text-ink">{{ company.contactName }}</dd></div>
          <div><dt class="text-xs font-medium text-muted">เบอร์โทรศัพท์</dt><dd class="mt-1.5 text-sm text-ink">{{ company.contactPhone }}</dd></div>
          <div class="sm:col-span-2"><dt class="text-xs font-medium text-muted">ที่อยู่สถานประกอบการ</dt><dd class="mt-1.5 text-sm leading-6 text-ink">{{ company.address }}</dd></div>
        </dl>
      </UiCard>

      <UiDialog v-model:open="companyDialogOpen" size="xl" title="แก้ไขข้อมูลสถานประกอบการ" description="ข้อมูลที่แก้ไขจะถูกนำไปใช้กับการจัดกลุ่มและตารางนิเทศ">
        <CompanyForm :key="String(companyDialogOpen)" :initial-value="companyInitialValue" :submitting="isSaving" @submit="saveCompany" @cancel="companyDialogOpen = false" />
      </UiDialog>

      <UiCard class="mt-6" :padded="false">
        <div class="border-b border-divider p-5 sm:p-6"><div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h3 class="text-lg font-bold text-ink">นักศึกษาที่ฝึกอยู่สถานประกอบการนี้</h3><p class="mt-1 text-sm text-muted">กดแก้ไขเพื่อปรับชื่อ หมู่เรียน และตำแหน่งฝึกงานของนักศึกษา</p></div><UiBadge tone="info">{{ placements.length }} คน</UiBadge></div><div v-if="placements.length" class="mt-4 flex gap-2"><div class="relative min-w-0 flex-1 sm:max-w-md"><Search class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" :size="18" aria-hidden="true" /><label for="company-student-search" class="sr-only">ค้นหานักศึกษา</label><input id="company-student-search" v-model="studentSearch" type="search" class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 text-sm text-ink placeholder:text-muted" placeholder="ค้นหารหัส ชื่อ หมู่ หรือตำแหน่ง"></div><button v-if="studentSearch" type="button" class="grid size-11 place-items-center rounded-control border border-divider text-muted hover:bg-surface hover:text-ink" aria-label="ล้างคำค้นหา" title="ล้างคำค้นหา" @click="studentSearch = ''"><RotateCcw :size="17" aria-hidden="true" /></button></div></div>
        <div v-if="!placements.length" class="p-5 sm:p-6"><AppEmptyState title="ยังไม่มีนักศึกษาฝึกที่สถานประกอบการนี้" description="เมื่อนักศึกษาได้รับการยืนยันสถานที่ฝึกงาน รายชื่อจะแสดงในส่วนนี้" /></div>
        <div v-else-if="!visiblePlacements.length" class="p-5 sm:p-6"><AppEmptyState title="ไม่พบนักศึกษาที่ตรงกับคำค้นหา" description="ลองเปลี่ยนรหัส ชื่อ หมู่เรียน หรือตำแหน่งที่ค้นหา"><UiButton variant="secondary" @click="studentSearch = ''">ล้างคำค้นหา</UiButton></AppEmptyState></div>
        <template v-else>
          <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[820px] text-left text-sm"><caption class="sr-only">นักศึกษาที่ฝึกอยู่สถานประกอบการนี้</caption><thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase"><tr><th class="px-6 py-3">นักศึกษา</th><th class="px-4 py-3">หมู่เรียน</th><th class="px-4 py-3">ตำแหน่งฝึกงาน</th><th class="px-4 py-3">รอบสหกิจศึกษา</th><th class="w-20 px-4 py-3"><span class="sr-only">แก้ไข</span></th></tr></thead><tbody class="divide-y divide-divider"><tr v-for="placement in visiblePlacements" :key="placement.id" class="hover:bg-surface/70"><td class="px-6 py-4"><p class="font-semibold text-ink">{{ getStudentProfile(placement.studentId).prefix }}{{ placement.studentName }}</p><p class="mt-1 text-xs text-muted">{{ placement.studentId }}</p></td><td class="whitespace-nowrap px-4 py-4 text-ink">{{ getStudentProfile(placement.studentId).section }}</td><td class="px-4 py-4 text-ink">{{ placement.position }}</td><td class="whitespace-nowrap px-4 py-4 text-muted">{{ placement.cycleId }}</td><td class="px-4 py-4 text-right"><button type="button" class="inline-grid size-9 place-items-center rounded-control text-muted hover:bg-surface hover:text-ink" :aria-label="`แก้ไข ${placement.studentId}`" title="แก้ไขข้อมูลนักศึกษา" @click="openStudent(placement)"><Pencil :size="16" aria-hidden="true" /></button></td></tr></tbody></table></div>
          <div class="divide-y divide-divider md:hidden"><article v-for="placement in visiblePlacements" :key="placement.id" class="p-5"><div class="flex items-start justify-between gap-3"><div><h4 class="font-semibold text-ink">{{ getStudentProfile(placement.studentId).prefix }}{{ placement.studentName }}</h4><p class="mt-1 text-xs text-muted">{{ placement.studentId }} · {{ getStudentProfile(placement.studentId).section }}</p></div><button type="button" class="inline-grid size-9 shrink-0 place-items-center rounded-control border border-divider text-muted" :aria-label="`แก้ไข ${placement.studentId}`" @click="openStudent(placement)"><Pencil :size="16" aria-hidden="true" /></button></div><p class="mt-3 text-sm text-ink">{{ placement.position }}</p><p class="mt-1 text-xs text-muted">{{ placement.cycleId }}</p></article></div>
        </template>
      </UiCard>

      <UiCard class="mt-6"><h3 class="text-lg font-bold text-ink">สถานะข้อมูล</h3><p class="mt-1 text-sm leading-6 text-muted">สถานประกอบการที่มีนักศึกษาหรือประวัติอ้างอิงจะไม่ถูกลบถาวร</p><div class="mt-5 flex flex-wrap gap-2"><UiButton v-if="company.status === 'inactive'" variant="secondary" :icon="UserRoundCheck" @click="handleRestore">เปิดใช้งานอีกครั้ง</UiButton><UiDialog v-if="company.status === 'active' && placements.length" title="ยุติการใช้งานสถานประกอบการ" description="สถานประกอบการจะไม่ถูกเลือกสำหรับรายการใหม่ แต่ข้อมูลนักศึกษาและประวัติเดิมยังคงอยู่"><template #trigger><UiButton variant="danger" :icon="Trash2">ยุติการใช้งาน</UiButton></template><template #cancel><UiButton variant="ghost">ยกเลิก</UiButton></template><template #confirm><UiButton variant="danger" @click="handleDeactivate">ยืนยันยุติการใช้งาน</UiButton></template></UiDialog><UiDialog v-if="!placements.length" title="ลบสถานประกอบการ" description="รายการนี้ยังไม่มีนักศึกษาหรือข้อมูลอ้างอิง เมื่อลบแล้วจะไม่สามารถเรียกคืนได้"><template #trigger><UiButton variant="danger" :icon="Trash2">ลบสถานประกอบการ</UiButton></template><template #cancel><UiButton variant="ghost">ยกเลิก</UiButton></template><template #confirm><UiButton variant="danger" @click="handleDelete">ยืนยันลบ</UiButton></template></UiDialog></div></UiCard>

      <UiDialog v-model:open="studentDialogOpen" size="lg" :title="`แก้ไขข้อมูลนักศึกษา ${selectedPlacement?.studentId ?? ''}`" description="ข้อมูลที่แก้ไขจะแสดงทั้งในหน้าสถานประกอบการและตารางนิเทศ">
        <form novalidate @submit.prevent="saveStudent"><div class="grid gap-5 sm:grid-cols-2"><div><UiSelect v-model="studentForm.prefix" :options="personPrefixOptions.student" label="คำนำหน้า" :error="studentErrors.prefix" required /></div><div><UiSelect v-model="studentForm.section" :options="studentSectionValues.map(value => ({ value, label: value }))" label="หมู่เรียน" :error="studentErrors.section" required /></div><div><UiInput v-model="studentForm.firstName" label="ชื่อ" :error="studentErrors.firstName" required /></div><div><UiInput v-model="studentForm.lastName" label="นามสกุล" :error="studentErrors.lastName" required /></div><div class="sm:col-span-2"><UiInput v-model="studentForm.position" label="ตำแหน่งฝึกงาน" :error="studentErrors.position" required /></div></div><div class="mt-6 flex justify-end gap-2 border-t border-divider pt-5"><UiButton variant="ghost" :disabled="isSaving" @click="selectedPlacement = null">ยกเลิก</UiButton><UiButton type="submit" :loading="isSaving">บันทึกข้อมูลนักศึกษา</UiButton></div></form>
      </UiDialog>
    </template>
  </div>
</template>
