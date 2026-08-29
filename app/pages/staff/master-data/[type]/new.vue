<script setup lang="ts">
import { ArrowLeft, Save } from '@lucide/vue'
import { z } from 'zod'
import type { PersonInput, PersonType } from '~/composables/usePeopleDirectory'

definePageMeta({ title: 'เพิ่มข้อมูลบุคคล', middleware: 'staff-prototype' })

const route = useRoute()
const { createPerson } = usePeopleDirectory()
const { showToast } = useToast()

const personType = computed<PersonType>(() => route.params.type === 'lecturers' ? 'lecturer' : 'student')
if (!['students', 'lecturers'].includes(String(route.params.type))) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
const context = computed(() => personType.value === 'student'
  ? { title: 'เพิ่มนักศึกษา', idLabel: 'รหัสนักศึกษา', singular: 'นักศึกษา' }
  : { title: 'เพิ่มอาจารย์', idLabel: 'รหัสอาจารย์', singular: 'อาจารย์' })
useHead({ title: () => context.value.title })

const form = reactive<PersonInput>({ id: '', firstName: '', lastName: '', cycle: personType.value === 'student' ? 'ภาคเรียนที่ 2/2569' : undefined })
const errors = reactive<Partial<Record<keyof PersonInput, string>>>({})
const isSubmitting = ref(false)

const schema = z.object({
  id: z.string().trim().min(1, 'กรุณากรอกรหัส').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
  firstName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  lastName: z.string().trim().min(1, 'กรุณากรอกนามสกุล').max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
  cycle: z.string().optional(),
})

const submit = async () => {
  Object.assign(errors, { id: undefined, firstName: undefined, lastName: undefined, cycle: undefined })
  const result = schema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach((issue) => { errors[issue.path[0] as keyof PersonInput] = issue.message })
    return
  }

  isSubmitting.value = true
  try {
    const person = createPerson(personType.value, result.data)
    showToast({ title: `เพิ่ม${context.value.singular}แล้ว`, description: `สร้างบัญชี ${person.id} และรอเข้าสู่ระบบครั้งแรก` })
    await navigateTo(`/staff/master-data/${route.params.type}/${person.id}`)
  } catch (error) {
    if (error instanceof Error && error.message === 'duplicate-id') errors.id = `${context.value.idLabel}นี้มีอยู่ในระบบแล้ว`
    else showToast({ title: 'บันทึกข้อมูลไม่สำเร็จ', description: 'กรุณาลองอีกครั้ง' })
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
          <div><UiInput v-model="form.firstName" label="ชื่อ" placeholder="กรอกชื่อ" :error="errors.firstName" required /></div>
          <div><UiInput v-model="form.lastName" label="นามสกุล" placeholder="กรอกนามสกุล" :error="errors.lastName" required /></div>
          <div v-if="personType === 'student'" class="sm:col-span-2"><UiInput v-model="form.cycle" label="รอบสหกิจศึกษา" help="กำหนดรอบของนักศึกษาได้ภายหลังโดยไม่ต้องสร้างบัญชีใหม่" :error="errors.cycle" /></div>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 border-t border-divider pt-5 sm:flex-row sm:justify-end"><UiButton variant="ghost" @click="navigateTo(`/staff/master-data/${route.params.type}`)">ยกเลิก</UiButton><UiButton type="submit" :icon="Save" :loading="isSubmitting">บันทึกและสร้างบัญชี</UiButton></div>
      </form>
    </UiCard>
  </div>
</template>
