<script setup lang="ts">
import { ArrowLeft, Save } from '@lucide/vue'
import { z } from 'zod'
import type { PersonPrefix, PersonType, StudentSection } from '~/composables/usePeopleDirectory'
import { PeopleActionError } from '~/composables/usePeopleApi'

interface CreatePersonForm {
  id: string
  prefix: PersonPrefix
  firstName: string
  lastName: string
  temporaryPassword: string
  confirmPassword: string
  cohortYear?: string
  section?: StudentSection
}

definePageMeta({ title: 'เพิ่มข้อมูลบุคคล', middleware: 'staff' })

const route = useRoute()
const { create } = usePeopleApi()
const { showToast } = useToast()

const personType = computed<PersonType>(() => route.params.type === 'lecturers' ? 'lecturer' : 'student')
if (!['students', 'lecturers'].includes(String(route.params.type))) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
const context = computed(() => personType.value === 'student'
  ? { title: 'เพิ่มนักศึกษา', idLabel: 'รหัสนักศึกษา', singular: 'นักศึกษา' }
  : { title: 'เพิ่มอาจารย์', idLabel: 'รหัสอาจารย์', singular: 'อาจารย์' })
useHead({ title: () => context.value.title })

const prefixOptions = computed(() => personPrefixOptions[personType.value])
const form = reactive<CreatePersonForm>({ id: '', prefix: personType.value === 'student' ? 'นาย' : 'อาจารย์', firstName: '', lastName: '', temporaryPassword: '', confirmPassword: '', cohortYear: personType.value === 'student' ? '2566' : undefined, section: personType.value === 'student' ? 'หมู่ 1' : undefined })
const formSection = computed({
  get: () => form.section ?? '',
  set: value => { form.section = value as StudentSection },
})
const errors = reactive<Partial<Record<keyof CreatePersonForm, string>>>({})
const isSubmitting = ref(false)

const schema = z.object({
  id: z.string().trim().min(1, 'กรุณากรอกรหัส').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
  prefix: z.enum(personPrefixValues, { error: 'กรุณาเลือกคำนำหน้า' }),
  firstName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  lastName: z.string().trim().min(1, 'กรุณากรอกนามสกุล').max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
  temporaryPassword: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร').max(128).regex(/[A-Za-zก-๙]/u, 'รหัสผ่านต้องมีตัวอักษรอย่างน้อย 1 ตัว').regex(/\d/u, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว'),
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านชั่วคราว'),
  cohortYear: z.string().regex(/^25\d{2}$/, 'กรุณากรอกรุ่นปี พ.ศ. 4 หลัก').optional(),
  section: z.enum(studentSectionValues).optional(),
}).superRefine((input, context) => {
  if (input.temporaryPassword !== input.confirmPassword) context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' })
  if (input.temporaryPassword === input.id) context.addIssue({ code: 'custom', path: ['temporaryPassword'], message: 'รหัสผ่านชั่วคราวต้องไม่ซ้ำกับรหัสผู้ใช้' })
  if (personType.value === 'student' && !input.cohortYear) context.addIssue({ code: 'custom', path: ['cohortYear'], message: 'กรุณากรอกรุ่นปี' })
  if (personType.value === 'student' && !input.section) context.addIssue({ code: 'custom', path: ['section'], message: 'กรุณาเลือกหมู่เรียน' })
})

const submit = async () => {
  Object.assign(errors, { id: undefined, prefix: undefined, firstName: undefined, lastName: undefined, temporaryPassword: undefined, confirmPassword: undefined, cohortYear: undefined, section: undefined })
  const result = schema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach((issue) => { errors[issue.path[0] as keyof CreatePersonForm] = issue.message })
    return
  }

  isSubmitting.value = true
  try {
    const response = await create(personType.value === 'student'
      ? { role: 'student', username: result.data.id, temporaryPassword: result.data.temporaryPassword, namePrefix: result.data.prefix, firstName: result.data.firstName, lastName: result.data.lastName, cohortYear: Number(result.data.cohortYear), section: result.data.section! }
      : { role: 'lecturer', username: result.data.id, temporaryPassword: result.data.temporaryPassword, namePrefix: result.data.prefix, firstName: result.data.firstName, lastName: result.data.lastName })
    showToast({ title: `เพิ่ม${context.value.singular}แล้ว`, description: `สร้างบัญชี ${response.data.person.username} และรอเข้าสู่ระบบครั้งแรก` })
    await navigateTo(`/staff/master-data/${route.params.type}/${response.data.person.username}`)
  } catch (error) {
    if (error instanceof PeopleActionError) {
      const fieldMap: Record<string, keyof CreatePersonForm> = {
        username: 'id',
        namePrefix: 'prefix',
        firstName: 'firstName',
        lastName: 'lastName',
        temporaryPassword: 'temporaryPassword',
        cohortYear: 'cohortYear',
        section: 'section',
      }
      Object.entries(error.fieldErrors).forEach(([field, message]) => {
        const formField = fieldMap[field]
        if (formField) errors[formField] = message
      })
      if (!Object.keys(error.fieldErrors).length) showToast({ title: 'บันทึกข้อมูลไม่สำเร็จ', description: error.message })
    }
    else {
      console.error(error)
      showToast({ title: 'บันทึกข้อมูลไม่สำเร็จ', description: 'กรุณาลองอีกครั้ง' })
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <button type="button" class="mb-4 inline-flex min-h-10 items-center gap-2 rounded-control px-2 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink" @click="navigateTo(`/staff/master-data/${route.params.type}`)"><ArrowLeft :size="17" aria-hidden="true" />กลับไป{{ personType === 'student' ? 'ข้อมูลนักศึกษา' : 'ข้อมูลอาจารย์' }}</button>
    <div class="mb-6"><h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{{ context.title }}</h2><p class="mt-1 text-sm leading-6 text-muted">ระบบจะสร้างบัญชีจากรหัสและกำหนดสถานะเป็นรอเข้าสู่ระบบครั้งแรก</p></div>

    <UiAlert tone="info" title="การสร้างบัญชีอัตโนมัติ" class="mb-6">ชื่อผู้ใช้จะเป็นรหัสที่กรอกในหน้านี้ รหัสผ่านเริ่มต้นจะถูกส่งมอบนอกระบบ และผู้ใช้ต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก</UiAlert>

    <UiCard>
      <form novalidate @submit.prevent="submit">
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="sm:col-span-2"><UiInput v-model="form.id" :label="context.idLabel" :placeholder="personType === 'student' ? 'เช่น 66123456701' : 'เช่น L0021'" :error="errors.id" required /></div>
          <div><UiSelect v-model="form.prefix" :options="prefixOptions" label="คำนำหน้า" :error="errors.prefix" required /></div>
          <div><UiInput v-model="form.firstName" label="ชื่อ" placeholder="กรอกชื่อ" :error="errors.firstName" required /></div>
          <div><UiInput v-model="form.lastName" label="นามสกุล" placeholder="กรอกนามสกุล" :error="errors.lastName" required /></div>
          <div v-if="personType === 'student'"><UiInput v-model="form.cohortYear" label="รุ่นปีการศึกษา (พ.ศ.)" placeholder="เช่น 2566" :error="errors.cohortYear" required /></div>
          <div v-if="personType === 'student'"><UiSelect v-model="formSection" :options="studentSectionValues.map(value => ({ value, label: value }))" label="หมู่เรียน" :error="errors.section" required /></div>
          <div><UiInput v-model="form.temporaryPassword" label="รหัสผ่านชั่วคราว" type="password" help="อย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรกับตัวเลข" :error="errors.temporaryPassword" required /></div>
          <div><UiInput v-model="form.confirmPassword" label="ยืนยันรหัสผ่านชั่วคราว" type="password" :error="errors.confirmPassword" required /></div>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 border-t border-divider pt-5 sm:flex-row sm:justify-end"><UiButton variant="ghost" @click="navigateTo(`/staff/master-data/${route.params.type}`)">ยกเลิก</UiButton><UiButton type="submit" :icon="Save" :loading="isSubmitting">บันทึกและสร้างบัญชี</UiButton></div>
      </form>
    </UiCard>
  </div>
</template>
