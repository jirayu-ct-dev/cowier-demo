<script setup lang="ts">
import { ArrowLeft, KeyRound, Pencil, Power, Save, ShieldBan, UserRoundCheck } from '@lucide/vue'
import { z } from 'zod'
import type { PersonPrefix, PersonRecord, PersonType, StudentSection } from '~/composables/usePeopleDirectory'
import { PeopleActionError } from '~/composables/usePeopleApi'

interface EditPersonForm {
  id: string
  prefix: PersonPrefix
  firstName: string
  lastName: string
  cohortYear?: string
  section?: StudentSection
}

definePageMeta({ title: 'รายละเอียดข้อมูลบุคคล', middleware: 'staff' })

const route = useRoute()
const { showToast } = useToast()
const { get, update, updateAccountStatus, resetPassword } = usePeopleApi()

const personType = computed<PersonType>(() => route.params.type === 'lecturers' ? 'lecturer' : 'student')
if (!['students', 'lecturers'].includes(String(route.params.type))) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
const personId = computed(() => String(route.params.id))
const { data: personResponse, error: personError, status: personStatus, refresh } = get(personId)
const apiPerson = computed(() => personResponse.value?.data.person)
const person = computed<PersonRecord | null>(() => apiPerson.value
  ? {
      id: apiPerson.value.username,
      type: apiPerson.value.role,
      prefix: apiPerson.value.namePrefix as PersonPrefix,
      firstName: apiPerson.value.firstName,
      lastName: apiPerson.value.lastName,
      recordStatus: apiPerson.value.recordStatus,
      accountStatus: apiPerson.value.accountStatus,
      cycle: apiPerson.value.cohortYear ? `รุ่นปี ${apiPerson.value.cohortYear}` : undefined,
      section: apiPerson.value.section as StudentSection | undefined,
      activities: [],
    }
  : null)
const context = computed(() => personType.value === 'student'
  ? { title: 'รายละเอียดนักศึกษา', idLabel: 'รหัสนักศึกษา', singular: 'นักศึกษา' }
  : { title: 'รายละเอียดอาจารย์', idLabel: 'รหัสอาจารย์', singular: 'อาจารย์' })
useHead({ title: () => context.value.title })

const isEditing = ref(false)
const isSaving = ref(false)
const pendingAction = ref<string | null>(null)
const suspendDialogOpen = ref(false)
const terminateDialogOpen = ref(false)
const resetDialogOpen = ref(false)
const temporaryPassword = ref('')
const temporaryPasswordError = ref('')
const statusReason = ref('')
const statusReasonError = ref('')
const prefixOptions = computed(() => personPrefixOptions[personType.value])
const editForm = reactive<EditPersonForm>({ id: '', prefix: 'นาย', firstName: '', lastName: '', cohortYear: undefined, section: undefined })
const editSection = computed({
  get: () => editForm.section ?? '',
  set: value => { editForm.section = value as StudentSection },
})
const editErrors = reactive<Partial<Record<keyof EditPersonForm, string>>>({})
const schema = z.object({
  id: z.string().trim().min(1, 'กรุณากรอกรหัส').max(20),
  prefix: z.enum(personPrefixValues, { error: 'กรุณาเลือกคำนำหน้า' }),
  firstName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100),
  lastName: z.string().trim().min(1, 'กรุณากรอกนามสกุล').max(100),
  cohortYear: z.string().regex(/^25\d{2}$/, 'กรุณากรอกรุ่นปี พ.ศ. 4 หลัก').optional(),
  section: z.enum(studentSectionValues).optional(),
}).superRefine((input, context) => {
  if (personType.value === 'student' && !input.cohortYear) context.addIssue({ code: 'custom', path: ['cohortYear'], message: 'กรุณากรอกรุ่นปี' })
  if (personType.value === 'student' && !input.section) context.addIssue({ code: 'custom', path: ['section'], message: 'กรุณาเลือกหมู่เรียน' })
})

const populateEditForm = () => {
  if (!person.value) return
  Object.assign(editForm, { id: person.value.id, prefix: person.value.prefix, firstName: person.value.firstName, lastName: person.value.lastName, cohortYear: apiPerson.value?.cohortYear?.toString(), section: person.value.section })
  Object.assign(editErrors, { id: undefined, prefix: undefined, firstName: undefined, lastName: undefined, cohortYear: undefined, section: undefined })
}
const startEditing = () => {
  populateEditForm()
  isEditing.value = true
}
const cancelEditing = () => {
  isEditing.value = false
  populateEditForm()
}
const save = async () => {
  Object.assign(editErrors, { id: undefined, prefix: undefined, firstName: undefined, lastName: undefined, cohortYear: undefined, section: undefined })
  const result = schema.safeParse(editForm)
  if (!result.success) {
    result.error.issues.forEach(issue => { editErrors[issue.path[0] as keyof EditPersonForm] = issue.message })
    return
  }
  if (!person.value) return
  isSaving.value = true
  try {
    const oldId = person.value.id
    await update(apiPerson.value!.id, personType.value === 'student'
      ? { role: 'student', username: result.data.id, namePrefix: result.data.prefix, firstName: result.data.firstName, lastName: result.data.lastName, cohortYear: Number(result.data.cohortYear), section: result.data.section }
      : { role: 'lecturer', username: result.data.id, namePrefix: result.data.prefix, firstName: result.data.firstName, lastName: result.data.lastName })
    isEditing.value = false
    showToast({ title: 'บันทึกข้อมูลแล้ว', description: 'ระบบบันทึกค่าเดิมและค่าใหม่ในประวัติ' })
    if (oldId !== result.data.id) await navigateTo(`/staff/master-data/${route.params.type}/${result.data.id}`, { replace: true })
    else await refresh()
  } catch (error) {
    if (error instanceof PeopleActionError && error.fieldErrors.username) editErrors.id = error.fieldErrors.username
    else {
      console.error(error)
      showToast({ title: 'บันทึกข้อมูลไม่สำเร็จ', description: error instanceof PeopleActionError ? error.message : 'กรุณาลองอีกครั้ง' })
    }
  } finally {
    isSaving.value = false
  }
}
const changeStatus = async (status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED', title: string, description: string, reason?: string) => {
  if (!apiPerson.value || pendingAction.value) return
  pendingAction.value = status
  try {
    await updateAccountStatus(apiPerson.value.id, status, reason)
    await refresh()
    statusReason.value = ''
    suspendDialogOpen.value = false
    terminateDialogOpen.value = false
    showToast({ title, description })
  }
  catch (error) {
    console.error(error)
    showToast({ title: 'เปลี่ยนสถานะไม่สำเร็จ', description: error instanceof PeopleActionError ? error.message : 'กรุณาลองอีกครั้ง' })
  }
  finally {
    pendingAction.value = null
  }
}
const requireStatusReason = async (status: 'SUSPENDED' | 'TERMINATED', title: string, description: string) => {
  statusReasonError.value = ''
  if (!statusReason.value.trim()) {
    statusReasonError.value = 'กรุณาระบุเหตุผล'
    return
  }
  await changeStatus(status, title, description, statusReason.value.trim())
}
const confirmPasswordReset = async () => {
  temporaryPasswordError.value = ''
  if (temporaryPassword.value.length < 8 || !/[A-Za-zก-๙]/.test(temporaryPassword.value) || !/\d/.test(temporaryPassword.value)) {
    temporaryPasswordError.value = 'รหัสผ่านชั่วคราวต้องมีอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวอักษรกับตัวเลข'
    return
  }
  if (temporaryPassword.value === person.value?.id) {
    temporaryPasswordError.value = 'รหัสผ่านชั่วคราวต้องไม่ซ้ำกับรหัสผู้ใช้'
    return
  }
  if (!apiPerson.value || pendingAction.value) return
  pendingAction.value = 'reset-password'
  try {
    await resetPassword(apiPerson.value.id, temporaryPassword.value)
    await refresh()
    resetDialogOpen.value = false
    temporaryPassword.value = ''
    showToast({ title: 'รีเซ็ตรหัสผ่านแล้ว', description: 'Session เดิมถูกยกเลิกและผู้ใช้ต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งถัดไป' })
  }
  catch (error) {
    console.error(error)
    temporaryPasswordError.value = error instanceof PeopleActionError ? error.message : 'รีเซ็ตรหัสผ่านไม่สำเร็จ กรุณาลองอีกครั้ง'
  }
  finally {
    pendingAction.value = null
  }
}
</script>

<template>
  <div v-if="personStatus === 'pending'" class="space-y-6" aria-label="กำลังโหลดข้อมูลบุคคล">
    <UiSkeleton class="h-10 w-48" />
    <UiSkeleton class="h-28 w-full" />
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]"><UiSkeleton class="h-96" /><UiSkeleton class="h-72" /></div>
  </div>
  <div v-else-if="personError" class="mx-auto max-w-3xl py-8"><AppErrorState title="โหลดข้อมูลบุคคลไม่สำเร็จ" description="ไม่พบข้อมูล หรือเกิดข้อผิดพลาดระหว่างดึงข้อมูล" @retry="refresh" /></div>
  <div v-else-if="person">
    <button type="button" class="mb-4 inline-flex min-h-10 items-center gap-2 rounded-control px-2 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink" @click="navigateTo(`/staff/master-data/${route.params.type}`)"><ArrowLeft :size="17" aria-hidden="true" />กลับไป{{ personType === 'student' ? 'ข้อมูลนักศึกษา' : 'ข้อมูลอาจารย์' }}</button>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{{ getPersonFullName(person) }}</h2><p class="mt-1 text-sm text-muted">{{ context.idLabel }} {{ person.id }}</p></div>
      <UiButton v-if="!isEditing" :icon="Pencil" @click="startEditing">แก้ไขข้อมูล</UiButton>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
      <div class="space-y-6">
        <UiCard>
          <div class="flex items-center justify-between gap-3"><h3 class="text-lg font-bold text-ink">ข้อมูลบุคคล</h3><UiBadge :tone="recordStatusMeta[person.recordStatus].tone">{{ recordStatusMeta[person.recordStatus].label }}</UiBadge></div>
          <form v-if="isEditing" class="mt-5" novalidate @submit.prevent="save">
            <div class="grid gap-5 sm:grid-cols-2"><div class="sm:col-span-2"><UiInput v-model="editForm.id" :label="context.idLabel" :error="editErrors.id" required /></div><div><UiSelect v-model="editForm.prefix" :options="prefixOptions" label="คำนำหน้า" :error="editErrors.prefix" required /></div><div><UiInput v-model="editForm.firstName" label="ชื่อ" :error="editErrors.firstName" required /></div><div><UiInput v-model="editForm.lastName" label="นามสกุล" :error="editErrors.lastName" required /></div><div v-if="personType === 'student'"><UiInput v-model="editForm.cohortYear" label="รุ่นปีการศึกษา (พ.ศ.)" placeholder="เช่น 2566" :error="editErrors.cohortYear" required /></div><div v-if="personType === 'student'"><UiSelect v-model="editSection" :options="studentSectionValues.map(value => ({ value, label: value }))" label="หมู่เรียน" :error="editErrors.section" required /></div></div>
            <div class="mt-6 flex flex-wrap justify-end gap-2 border-t border-divider pt-5"><UiButton variant="ghost" @click="cancelEditing">ยกเลิก</UiButton><UiButton type="submit" :icon="Save" :loading="isSaving">บันทึกการแก้ไข</UiButton></div>
          </form>
          <dl v-else class="mt-5 grid gap-5 sm:grid-cols-2"><div><dt class="text-xs font-medium text-muted">{{ context.idLabel }}</dt><dd class="mt-1 font-semibold text-ink">{{ person.id }}</dd></div><div><dt class="text-xs font-medium text-muted">ชื่อผู้ใช้</dt><dd class="mt-1 font-semibold text-ink">{{ person.id }}</dd></div><div><dt class="text-xs font-medium text-muted">คำนำหน้า</dt><dd class="mt-1 text-ink">{{ person.prefix }}</dd></div><div><dt class="text-xs font-medium text-muted">ชื่อ</dt><dd class="mt-1 text-ink">{{ person.firstName }}</dd></div><div><dt class="text-xs font-medium text-muted">นามสกุล</dt><dd class="mt-1 text-ink">{{ person.lastName }}</dd></div><div v-if="personType === 'student'"><dt class="text-xs font-medium text-muted">หมู่เรียน</dt><dd class="mt-1 text-ink">{{ person.section || 'ยังไม่กำหนด' }}</dd></div><div v-if="personType === 'student'"><dt class="text-xs font-medium text-muted">รุ่นปีการศึกษา</dt><dd class="mt-1 text-ink">{{ person.cycle || 'ยังไม่กำหนด' }}</dd></div></dl>
        </UiCard>

        <UiCard :padded="false">
          <div class="border-b border-divider p-5 sm:p-6"><h3 class="text-lg font-bold text-ink">ประวัติการเปลี่ยนแปลงและบัญชี</h3><p class="mt-1 text-sm text-muted">แสดงผู้ดำเนินการ เวลา และรายละเอียดที่เปลี่ยน โดยไม่สามารถลบประวัติได้</p></div>
          <div class="p-5 sm:p-6"><AppEmptyState title="ยังไม่มีข้อมูลประวัติจาก API" description="ระบบบันทึก audit log แล้ว แต่ endpoint สำหรับอ่านประวัติรายบุคคลยังไม่ได้เปิดใช้งาน" /></div>
        </UiCard>
      </div>

      <aside class="space-y-6">
        <UiCard>
          <div class="flex items-center justify-between gap-3"><h3 class="text-lg font-bold text-ink">บัญชีผู้ใช้</h3><UiBadge :tone="accountStatusMeta[person.accountStatus].tone">{{ accountStatusMeta[person.accountStatus].label }}</UiBadge></div>
          <p class="mt-3 text-sm leading-6 text-muted">การระงับ รีเซ็ตรหัสผ่าน หรือยุติบัญชีจะยกเลิก Session เดิมทั้งหมด</p>
          <div v-if="person.recordStatus === 'active'" class="mt-5 grid gap-2">
            <UiDialog v-if="person.accountStatus === 'active' || person.accountStatus === 'first-login'" v-model:open="suspendDialogOpen" :close-on-confirm="false" title="ระงับบัญชีชั่วคราว" description="ผู้ใช้จะเข้าสู่ระบบไม่ได้และ Session ปัจจุบันจะถูกยกเลิก แต่ข้อมูลและประวัติยังคงอยู่">
              <template #trigger><UiButton variant="secondary" :icon="ShieldBan" @click="statusReason = ''; statusReasonError = ''">ระงับบัญชีชั่วคราว</UiButton></template><UiTextarea v-model="statusReason" label="เหตุผลที่ระงับ" :error="statusReasonError" required /><template #cancel><UiButton variant="ghost">ยกเลิก</UiButton></template><template #confirm><UiButton variant="danger" :loading="pendingAction === 'SUSPENDED'" @click="requireStatusReason('SUSPENDED', 'ระงับบัญชีแล้ว', 'ผู้ใช้จะเข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง')">ยืนยันการระงับ</UiButton></template>
            </UiDialog>
            <UiButton v-if="person.accountStatus === 'suspended'" variant="secondary" :icon="UserRoundCheck" :loading="pendingAction === 'ACTIVE'" @click="changeStatus('ACTIVE', 'เปิดใช้งานบัญชีแล้ว', 'ผู้ใช้สามารถเข้าสู่ระบบได้อีกครั้ง')">เปิดใช้งานบัญชี</UiButton>
            <UiButton v-if="person.accountStatus === 'active' || person.accountStatus === 'first-login'" variant="secondary" :icon="KeyRound" @click="resetDialogOpen = true">รีเซ็ตรหัสผ่าน</UiButton>
          </div>
        </UiCard>

        <UiCard>
          <h3 class="text-lg font-bold text-ink">สถานะข้อมูล</h3>
          <p class="mt-3 text-sm leading-6 text-muted">การยุติการใช้งานจะไม่ลบข้อมูล คำร้อง ตารางนิเทศ หรือประวัติที่เคยอ้างอิง</p>
          <div class="mt-5">
            <UiDialog v-if="person.recordStatus === 'active'" v-model:open="terminateDialogOpen" :close-on-confirm="false" :title="`ยุติการใช้งาน${context.singular}`" description="ข้อมูลจะไม่ปรากฏเป็นตัวเลือกสำหรับรายการใหม่ และบัญชีจะถูกยุติ แต่ยังค้นหาและดูประวัติเดิมได้">
              <template #trigger><UiButton variant="danger" :icon="Power" @click="statusReason = ''; statusReasonError = ''">ยุติการใช้งาน</UiButton></template><UiTextarea v-model="statusReason" label="เหตุผลที่ยุติการใช้งาน" :error="statusReasonError" required /><template #cancel><UiButton variant="ghost">ยกเลิก</UiButton></template><template #confirm><UiButton variant="danger" :loading="pendingAction === 'TERMINATED'" @click="requireStatusReason('TERMINATED', 'ยุติการใช้งานแล้ว', 'ข้อมูลและประวัติเดิมยังคงอยู่ในระบบ')">ยืนยันการยุติ</UiButton></template>
            </UiDialog>
            <UiButton v-else :icon="UserRoundCheck" :loading="pendingAction === 'ACTIVE'" @click="changeStatus('ACTIVE', 'เปิดใช้งานข้อมูลแล้ว', 'ข้อมูลและบัญชีกลับมาใช้งานได้อีกครั้ง')">เปิดใช้งานอีกครั้ง</UiButton>
          </div>
        </UiCard>
      </aside>
    </div>

    <UiDialog v-model:open="resetDialogOpen" :close-on-confirm="false" title="กำหนดรหัสผ่านชั่วคราว" description="ระบบจะยกเลิก Session เดิมและบังคับให้ผู้ใช้เปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งถัดไป">
      <UiInput v-model="temporaryPassword" label="รหัสผ่านชั่วคราว" type="text" help="อย่างน้อย 8 ตัวอักษร มีตัวอักษรและตัวเลข และต้องไม่ซ้ำกับรหัสผู้ใช้" :error="temporaryPasswordError" required />
      <template #cancel><UiButton variant="ghost">ยกเลิก</UiButton></template><template #confirm><UiButton :icon="KeyRound" :loading="pendingAction === 'reset-password'" @click="confirmPasswordReset">ยืนยันรีเซ็ตรหัสผ่าน</UiButton></template>
    </UiDialog>
  </div>
</template>
