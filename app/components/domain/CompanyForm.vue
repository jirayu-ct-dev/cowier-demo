<script setup lang="ts">
import { Save } from '@lucide/vue'
import { z } from 'zod'
import { provinceSeeds } from '~~/shared/constants/provinces'
import type { CompanyInput } from '~/composables/useSupervisionGroups'

interface Props {
  initialValue?: CompanyInput
  submitting?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: () => ({ name: '', branch: 'สำนักงานใหญ่', province: '', region: '', address: '', contactName: '', contactPhone: '' }),
  submitting: false,
  submitLabel: 'บันทึกข้อมูล',
})
const emit = defineEmits<{ submit: [value: CompanyInput], cancel: [] }>()

const regionLabels = {
  NORTH: 'ภาคเหนือ',
  NORTHEAST: 'ภาคตะวันออกเฉียงเหนือ',
  CENTRAL: 'ภาคกลาง',
  EAST: 'ภาคตะวันออก',
  WEST: 'ภาคตะวันตก',
  SOUTH: 'ภาคใต้',
} as const
const provinceOptions = provinceSeeds.map(province => ({ value: province.nameTh, label: province.nameTh }))
const regionForProvince = (provinceName: string) => {
  const province = provinceSeeds.find(item => item.nameTh === provinceName)
  return province ? regionLabels[province.region] : ''
}
const schema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อสถานประกอบการ').max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
  branch: z.string().trim().min(1, 'กรุณากรอกชื่อสาขา').max(100, 'ชื่อสาขาต้องไม่เกิน 100 ตัวอักษร'),
  province: z.string().trim().min(1, 'กรุณากรอกจังหวัด').max(100, 'จังหวัดต้องไม่เกิน 100 ตัวอักษร'),
  region: z.string().trim().min(1, 'กรุณาเลือกจังหวัดที่มีในระบบ'),
  address: z.string().trim().min(1, 'กรุณากรอกที่อยู่').max(500, 'ที่อยู่ต้องไม่เกิน 500 ตัวอักษร'),
  contactName: z.string().trim().min(1, 'กรุณากรอกชื่อผู้ประสานงาน').max(150, 'ชื่อต้องไม่เกิน 150 ตัวอักษร'),
  contactPhone: z.string().trim().min(1, 'กรุณากรอกเบอร์โทรศัพท์').max(30, 'เบอร์โทรศัพท์ต้องไม่เกิน 30 ตัวอักษร'),
})
const form = reactive<CompanyInput>({ ...props.initialValue })
const errors = reactive<Partial<Record<keyof CompanyInput, string>>>({})

watch(() => props.initialValue, value => Object.assign(form, value), { deep: true })
watch(() => form.province, (province) => { form.region = regionForProvince(province) }, { immediate: true })

const submit = () => {
  Object.assign(errors, { name: undefined, branch: undefined, province: undefined, region: undefined, address: undefined, contactName: undefined, contactPhone: undefined })
  const result = schema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach((issue) => { errors[issue.path[0] as keyof CompanyInput] = issue.message })
    return
  }
  emit('submit', result.data)
}
</script>

<template>
  <form novalidate @submit.prevent="submit">
    <div class="grid gap-5 sm:grid-cols-2">
      <div class="sm:col-span-2"><UiInput v-model="form.name" label="ชื่อสถานประกอบการ" placeholder="กรอกชื่อสถานประกอบการ" :error="errors.name" required /></div>
      <div><UiInput v-model="form.branch" label="สาขา" placeholder="เช่น สำนักงานใหญ่" :error="errors.branch" required /></div>
      <div><UiSelect v-model="form.province" :options="provinceOptions" label="จังหวัด" placeholder="เลือกจังหวัด" :error="errors.province" required /></div>
      <div>
        <p class="text-sm font-medium text-ink">ภูมิภาค</p>
        <p class="mt-2 min-h-11 rounded-control border border-divider bg-surface px-3 py-2.5 text-sm text-muted">{{ form.region || 'ระบบกำหนดจากจังหวัด' }}</p>
        <p v-if="errors.region" class="mt-1.5 text-xs text-danger">{{ errors.region }}</p>
      </div>
      <div><UiInput v-model="form.contactPhone" type="tel" label="เบอร์โทรศัพท์" placeholder="เช่น 044-000-000" :error="errors.contactPhone" required /></div>
      <div class="sm:col-span-2"><UiInput v-model="form.contactName" label="ผู้ประสานงาน" placeholder="ชื่อผู้ประสานงานของสถานประกอบการ" :error="errors.contactName" required /></div>
      <div class="sm:col-span-2"><UiTextarea v-model="form.address" label="ที่อยู่สถานประกอบการ" placeholder="กรอกที่อยู่สำหรับติดต่อ" :error="errors.address" required /></div>
    </div>
    <div class="mt-6 flex flex-col-reverse gap-2 border-t border-divider pt-5 sm:flex-row sm:justify-end">
      <UiButton variant="ghost" :disabled="submitting" @click="emit('cancel')">ยกเลิก</UiButton>
      <UiButton type="submit" :icon="Save" :loading="submitting">{{ submitLabel }}</UiButton>
    </div>
  </form>
</template>
