<script setup lang="ts">
import { ArrowLeft, CalendarClock, Check, LockKeyhole, Save } from '@lucide/vue'
import { z } from 'zod'
import type { SupervisionPeriod } from '~/composables/useSupervisionAppointments'

definePageMeta({ title: 'รายละเอียดการนิเทศ', middleware: 'lecturer-prototype' })

const scheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'เลือกวันที่นิเทศ'),
  period: z.enum(['morning', 'afternoon'], { message: 'เลือกช่วงเวลา' }),
  lecturerIds: z.array(z.string()).min(1, 'เลือกอาจารย์ผู้เข้าร่วมอย่างน้อย 1 คน'),
})
const resultSchema = z.object({
  summary: z.string().trim().min(1, 'ระบุสรุปผลการนิเทศ'),
  issues: z.string(),
  suggestions: z.string(),
  companyRequirements: z.string(),
})

const route = useRoute()
const { scenario } = useScenario()
const { showToast } = useToast()
const { people } = usePeopleDirectory()
const { groups, getCompanies } = useSupervisionGroups()
const { appointments, updateAppointment, saveResult, completeAppointment } = useSupervisionAppointments()
const currentLecturerId = 'L0012'
const appointmentId = computed(() => String(route.params.id))
const appointment = computed(() => appointments.value.find(item => item.id === appointmentId.value) ?? null)
const company = computed(() => appointment.value
  ? getCompanies(appointment.value.cycleId).find(item => item.id === appointment.value?.companyId) ?? null
  : null)
const group = computed(() => groups.value.find(item => item.id === appointment.value?.groupId) ?? null)
const students = computed(() => company.value?.students.filter(student => appointment.value?.studentIds.includes(student.studentId)) ?? [])
const lecturers = computed(() => people.value.filter(person => person.type === 'lecturer' && person.recordStatus === 'active' && person.accountStatus === 'active'))
const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)
const isLocked = computed(() => appointment.value?.status === 'completed' || appointment.value?.status === 'cancelled')
const canManage = computed(() => Boolean(appointment.value && (
  appointment.value.lecturerIds.includes(currentLecturerId)
  || group.value?.lecturerIds.includes(currentLecturerId)
)))
const completionOpen = ref(false)
const isSavingSchedule = ref(false)
const isSavingResult = ref(false)
const isCompleting = ref(false)
const scheduleErrors = ref<{ date?: string, period?: string, lecturerIds?: string }>({})
const resultErrors = ref<{ summary?: string, actualLecturerIds?: string }>({})
const scheduleForm = reactive({ date: '', period: 'morning' as SupervisionPeriod, lecturerIds: [] as string[] })
const resultForm = reactive({ summary: '', issues: '', suggestions: '', companyRequirements: '' })
const actualLecturerIds = ref<string[]>([])
const periodOptions = [
  { value: 'morning', label: 'ช่วงเช้า' },
  { value: 'afternoon', label: 'ช่วงบ่าย' },
]

const lecturerName = (id: string) => {
  const lecturer = people.value.find(person => person.type === 'lecturer' && person.id === id)
  return lecturer ? getPersonFullName(lecturer) : id
}
const formatDateTime = (value: string) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
  .format(new Date(value))
const retry = () => {
  scenario.value.forceError = false
  scenario.value.viewState = 'data'
}
const toggleLecturer = (target: 'planned' | 'actual', id: string, checked: boolean | 'indeterminate') => {
  const selected = target === 'planned' ? scheduleForm.lecturerIds : actualLecturerIds.value
  const next = checked === true ? [...new Set([...selected, id])] : selected.filter(item => item !== id)
  if (target === 'planned') {
    scheduleForm.lecturerIds = next
    scheduleErrors.value.lecturerIds = undefined
  } else {
    actualLecturerIds.value = next
    resultErrors.value.actualLecturerIds = undefined
  }
}
const saveSchedule = async () => {
  if (!appointment.value || !canManage.value || isLocked.value) return
  const parsed = scheduleSchema.safeParse(scheduleForm)
  if (!parsed.success) {
    scheduleErrors.value = Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message]))
    return
  }
  isSavingSchedule.value = true
  try {
    updateAppointment(appointment.value.id, parsed.data)
    showToast({ title: 'บันทึกตารางนิเทศแล้ว', description: appointment.value.id })
  } catch {
    showToast({ title: 'บันทึกตารางไม่ได้', description: 'รายการอาจถูกล็อกหรือข้อมูลไม่ครบ กรุณาลองอีกครั้ง' })
  } finally {
    isSavingSchedule.value = false
  }
}
const validateResult = () => {
  const parsed = resultSchema.safeParse(resultForm)
  resultErrors.value.summary = parsed.success ? undefined : parsed.error.issues.find(issue => issue.path[0] === 'summary')?.message
  return parsed
}
const saveSupervisionResult = async () => {
  if (!appointment.value || !canManage.value || isLocked.value) return
  const parsed = validateResult()
  if (!parsed.success) return
  isSavingResult.value = true
  try {
    saveResult(appointment.value.id, parsed.data)
    showToast({ title: 'บันทึกผลการนิเทศแล้ว', description: 'ยังสามารถแก้ไขข้อมูลได้จนกว่าจะยืนยันนิเทศเสร็จแล้ว' })
  } catch {
    showToast({ title: 'บันทึกผลไม่ได้', description: 'กรุณาลองอีกครั้ง' })
  } finally {
    isSavingResult.value = false
  }
}
const openCompletion = () => {
  const parsed = validateResult()
  if (!parsed.success || !appointment.value) return
  actualLecturerIds.value = [...appointment.value.lecturerIds]
  resultErrors.value.actualLecturerIds = undefined
  completionOpen.value = true
}
const confirmCompletion = async () => {
  if (!appointment.value) return
  if (!actualLecturerIds.value.length) {
    resultErrors.value.actualLecturerIds = 'เลือกอาจารย์ที่เข้าร่วมนิเทศจริงอย่างน้อย 1 คน'
    return
  }
  isCompleting.value = true
  try {
    completeAppointment(appointment.value.id, { ...resultForm, actualLecturerIds: actualLecturerIds.value })
    completionOpen.value = false
    showToast({ title: 'ยืนยันนิเทศเสร็จแล้ว', description: 'ระบบล็อกวัน เวลา นักศึกษา และรายชื่อผู้เข้าร่วมจริงแล้ว' })
  } catch {
    showToast({ title: 'ยืนยันรายการไม่ได้', description: 'ตรวจสอบสรุปผลและรายชื่ออาจารย์ที่เข้าร่วมจริง' })
  } finally {
    isCompleting.value = false
  }
}

watch(appointment, (value) => {
  if (!value) return
  Object.assign(scheduleForm, { date: value.date, period: value.period, lecturerIds: [...value.lecturerIds] })
  Object.assign(resultForm, {
    summary: value.result.summary,
    issues: value.result.issues,
    suggestions: value.result.suggestions,
    companyRequirements: value.result.companyRequirements,
  })
  useHead({ title: `${value.id} · รายละเอียดการนิเทศ` })
}, { immediate: true })
</script>

<template>
  <div>
    <button type="button" class="mb-4 inline-flex min-h-10 items-center gap-2 rounded-control px-2 text-sm font-semibold text-muted hover:bg-surface hover:text-ink" @click="navigateTo('/lecturer/supervision')">
      <ArrowLeft :size="18" aria-hidden="true" />กลับไปตารางนิเทศ
    </button>

    <div v-if="effectiveViewState === 'loading'" class="space-y-5" aria-label="กำลังโหลดรายละเอียดการนิเทศ">
      <UiSkeleton class="h-24" /><UiSkeleton class="h-72" /><UiSkeleton class="h-80" />
    </div>
    <AppErrorState v-else-if="effectiveViewState === 'error'" title="โหลดรายละเอียดการนิเทศไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองอีกครั้ง" @retry="retry" />
    <AppEmptyState v-else-if="!appointment" title="ไม่พบรายการนิเทศ" description="รายการนี้อาจถูกย้ายหรือไม่มีอยู่ในข้อมูลตัวอย่าง"><UiButton variant="secondary" @click="navigateTo('/lecturer/supervision')">กลับไปตารางนิเทศ</UiButton></AppEmptyState>

    <template v-else>
      <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-sm font-semibold text-primary">{{ appointment.id }} · นิเทศครั้งที่ {{ appointment.round }}</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{{ company?.name ?? appointment.companyId }}</h2>
          <p class="mt-1 text-sm leading-6 text-muted">{{ company?.branch }} · {{ company?.province }} · {{ group?.name }}</p>
        </div>
        <UiBadge :tone="supervisionAppointmentStatusMeta[appointment.status].tone">{{ supervisionAppointmentStatusMeta[appointment.status].label }}</UiBadge>
      </header>

      <UiAlert v-if="!canManage" class="mb-6" tone="warning" title="ดูรายละเอียดได้ แต่ยังบันทึกผลไม่ได้">เข้าร่วมรายการนี้จากหน้าตารางนิเทศก่อน จึงจะแก้ไขตารางและบันทึกผลการนิเทศได้</UiAlert>
      <UiAlert v-else-if="isLocked" class="mb-6" tone="info" title="ข้อมูลรายการนี้ถูกล็อกแล้ว">รายการนิเทศเสร็จแล้ว จึงไม่สามารถแก้ไขวัน เวลา นักศึกษา และอาจารย์ที่เข้าร่วมจริงได้</UiAlert>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <div class="space-y-6">
          <UiCard>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><h3 class="text-lg font-bold text-ink">วันและอาจารย์ผู้เข้าร่วม</h3><p class="mt-1 text-sm leading-6 text-muted">แก้ไขได้เฉพาะก่อนยืนยันนิเทศเสร็จแล้ว</p></div>
              <CalendarClock :size="22" class="text-primary" aria-hidden="true" />
            </div>
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <div class="min-w-0">
                <UiInput v-model="scheduleForm.date" type="date" label="วันที่นิเทศ" required :disabled="!canManage || isLocked" :error="scheduleErrors.date" />
              </div>
              <div class="min-w-0">
                <UiSelect v-model="scheduleForm.period" :options="periodOptions" label="ช่วงเวลา" required :disabled="!canManage || isLocked" :error="scheduleErrors.period" />
              </div>
            </div>
            <div class="mt-5">
              <div class="flex items-center justify-between gap-3"><h4 class="text-sm font-bold text-ink">อาจารย์ที่วางแผนเข้าร่วม</h4><UiBadge tone="info">{{ scheduleForm.lecturerIds.length }} คน</UiBadge></div>
              <div class="mt-3 divide-y divide-divider overflow-hidden rounded-control border border-divider">
                <label v-for="lecturer in lecturers" :key="lecturer.id" class="flex min-h-14 items-center gap-3 px-4 py-2" :class="canManage && !isLocked ? 'cursor-pointer hover:bg-surface' : ''">
                  <UiCheckbox :model-value="scheduleForm.lecturerIds.includes(lecturer.id)" :label="`เลือก ${getPersonFullName(lecturer)}`" :disabled="!canManage || isLocked" @update:model-value="toggleLecturer('planned', lecturer.id, $event)" />
                  <span class="min-w-0 text-sm"><span class="font-semibold text-ink">{{ getPersonFullName(lecturer) }}</span><span class="ml-2 text-muted">{{ lecturer.id }}</span></span>
                </label>
              </div>
              <p v-if="scheduleErrors.lecturerIds" class="mt-2 text-xs font-medium text-danger">{{ scheduleErrors.lecturerIds }}</p>
            </div>
            <div v-if="canManage && !isLocked" class="mt-5 flex justify-end"><UiButton variant="secondary" :icon="Save" :loading="isSavingSchedule" @click="saveSchedule">บันทึกตาราง</UiButton></div>
          </UiCard>

          <UiCard>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><h3 class="text-lg font-bold text-ink">ผลการนิเทศ</h3><p class="mt-1 text-sm leading-6 text-muted">บันทึกภาพรวม ปัญหา ข้อเสนอแนะ และข้อมูลที่สถานประกอบการต้องการ</p></div>
              <LockKeyhole v-if="isLocked" :size="21" class="text-muted" aria-label="ข้อมูลถูกล็อก" />
            </div>
            <div class="mt-5 space-y-5">
              <div class="[&>textarea]:min-h-32">
                <UiTextarea v-model="resultForm.summary" label="สรุปผลการนิเทศ" required :disabled="!canManage || isLocked" :error="resultErrors.summary" placeholder="สรุปการปฏิบัติงานและสิ่งที่พบจากการนิเทศ" />
              </div>
              <div class="grid gap-5 lg:grid-cols-2">
                <div class="min-w-0 [&>textarea]:min-h-32">
                  <UiTextarea v-model="resultForm.issues" label="ปัญหาที่พบ" :disabled="!canManage || isLocked" placeholder="ระบุปัญหาของนักศึกษา งาน หรือการประสานงาน" />
                </div>
                <div class="min-w-0 [&>textarea]:min-h-32">
                  <UiTextarea v-model="resultForm.suggestions" label="ข้อเสนอแนะและเรื่องที่ต้องติดตาม" :disabled="!canManage || isLocked" placeholder="ระบุคำแนะนำหรือสิ่งที่ต้องติดตามครั้งถัดไป" />
                </div>
              </div>
              <div class="[&>textarea]:min-h-32">
                <UiTextarea v-model="resultForm.companyRequirements" label="ความต้องการของสถานประกอบการ" :disabled="!canManage || isLocked" placeholder="เช่น ทักษะที่ต้องการ จำนวนที่รับ หรือความร่วมมือในรอบถัดไป" />
              </div>
            </div>

            <div v-if="isLocked" class="mt-5 rounded-control border border-divider bg-surface p-4">
              <p class="text-xs font-medium text-muted">อาจารย์ที่เข้าร่วมนิเทศจริง</p>
              <p class="mt-1 text-sm font-semibold text-ink">{{ appointment.result.actualLecturerIds.map(lecturerName).join(', ') }}</p>
              <p v-if="appointment.result.completedAt" class="mt-2 text-xs text-muted">ยืนยันเมื่อ {{ formatDateTime(appointment.result.completedAt) }}</p>
            </div>
            <div v-else-if="canManage" class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <UiButton variant="secondary" :icon="Save" :loading="isSavingResult" @click="saveSupervisionResult">บันทึกผล</UiButton>
              <UiButton :icon="Check" @click="openCompletion">ยืนยันนิเทศเสร็จแล้ว</UiButton>
            </div>
          </UiCard>
        </div>

        <aside class="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <UiCard>
            <h3 class="text-lg font-bold text-ink">ข้อมูลสถานประกอบการ</h3>
            <dl v-if="company" class="mt-5 space-y-4 text-sm">
              <div><dt class="text-xs text-muted">สาขา / พื้นที่</dt><dd class="mt-1 font-semibold text-ink">{{ company.branch }} · {{ company.province }}</dd></div>
              <div><dt class="text-xs text-muted">ผู้ประสานงาน</dt><dd class="mt-1 text-ink">{{ company.contactName }} · {{ company.contactPhone }}</dd></div>
              <div><dt class="text-xs text-muted">ที่อยู่</dt><dd class="mt-1 leading-6 text-ink">{{ company.address }}</dd></div>
            </dl>
          </UiCard>

          <UiCard :padded="false">
            <div class="flex items-center justify-between gap-3 border-b border-divider p-5"><h3 class="text-lg font-bold text-ink">นักศึกษาในรายการ</h3><UiBadge tone="info">{{ students.length }} คน</UiBadge></div>
            <div class="divide-y divide-divider">
              <article v-for="student in students" :key="student.id" class="p-5">
                <p class="font-semibold text-ink">{{ student.studentName }}</p>
                <p class="mt-1 text-xs text-muted">{{ student.studentId }}</p>
                <p class="mt-2 text-sm text-muted">{{ student.position }}</p>
              </article>
            </div>
          </UiCard>
        </aside>
      </div>

      <UiDialog v-model:open="completionOpen" size="lg" :close-on-confirm="false" title="ยืนยันอาจารย์ที่เข้าร่วมนิเทศจริง" description="รายชื่อที่ยืนยันจะถูกใช้กำหนดผู้ทำแบบประเมิน และไม่สามารถแก้ไขหลังจบรายการ">
        <div class="divide-y divide-divider overflow-hidden rounded-control border border-divider">
          <label v-for="id in appointment.lecturerIds" :key="id" class="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 hover:bg-surface">
            <UiCheckbox :model-value="actualLecturerIds.includes(id)" :label="`ยืนยัน ${lecturerName(id)} เข้าร่วมจริง`" @update:model-value="toggleLecturer('actual', id, $event)" />
            <span class="text-sm font-semibold text-ink">{{ lecturerName(id) }}</span>
          </label>
        </div>
        <p v-if="resultErrors.actualLecturerIds" class="mt-2 text-xs font-medium text-danger">{{ resultErrors.actualLecturerIds }}</p>
        <UiAlert class="mt-5" tone="warning" title="ข้อมูลจะถูกล็อกหลังยืนยัน">วัน ช่วงเวลา นักศึกษา และอาจารย์ที่เข้าร่วมจริงจะไม่สามารถแก้ไขได้</UiAlert>
        <template #cancel><UiButton variant="ghost">กลับไปตรวจสอบ</UiButton></template>
        <template #confirm><UiButton :icon="Check" :loading="isCompleting" @click="confirmCompletion">ยืนยันนิเทศเสร็จแล้ว</UiButton></template>
      </UiDialog>
    </template>
  </div>
</template>
