<script setup lang="ts">
import { ArrowLeft, Check, MapPinned, Save, UsersRound } from '@lucide/vue'
import { z } from 'zod'
import type { SupervisionRound, SupervisionScopeType } from '~/composables/useSupervisionGroups'

definePageMeta({ title: 'สร้างกลุ่มนิเทศ', middleware: 'staff-prototype' })
useHead({ title: 'สร้างกลุ่มนิเทศ' })

const route = useRoute()
const { showToast } = useToast()
const { cycles, selectedCycle } = useCoopCycles()
const { people } = usePeopleDirectory()
const { getUnassignedPlacements, createGroup } = useSupervisionGroups()

const queryCycle = String(route.query.cycle ?? '')
const cycleId = ref(cycles.some(cycle => cycle.id === queryCycle) ? queryCycle : selectedCycle.value.id)
const round = ref<SupervisionRound>(route.query.round === '2' ? 2 : 1)
const initialPlacementIds = String(route.query.placements ?? '').split(',').filter(Boolean)
const selectedFromQuery = computed(() => getUnassignedPlacements(cycleId.value, round.value).filter(item => initialPlacementIds.includes(item.id)))
const name = ref('')
const scopeType = ref<SupervisionScopeType>(selectedFromQuery.value.length ? 'company' : 'province')
const scopeValues = ref<string[]>(selectedFromQuery.value.length ? [...new Set(selectedFromQuery.value.map(item => item.company))] : [])
const lecturerIds = ref<string[]>([])
const placementIds = ref<string[]>(selectedFromQuery.value.map(item => item.id))
const errors = ref<Record<string, string>>({})
const isSaving = ref(false)

const cycleOptions = cycles.map(cycle => ({ value: cycle.id, label: cycle.label }))
const roundOptions = [{ value: '1', label: 'นิเทศครั้งที่ 1' }, { value: '2', label: 'นิเทศครั้งที่ 2' }]
const roundModel = computed({
  get: () => String(round.value),
  set: value => { round.value = Number(value) as SupervisionRound },
})
const scopeTypeModel = computed({
  get: () => scopeType.value,
  set: value => { scopeType.value = value as SupervisionScopeType },
})
const scopeTypeOptions = [
  { value: 'region', label: 'ภูมิภาค', description: 'เหมาะกับกลุ่มที่รับผิดชอบหลายจังหวัดในภูมิภาคเดียวกัน' },
  { value: 'province', label: 'จังหวัด', description: 'เหมาะกับการแบ่งพื้นที่ตามเขตจังหวัด' },
  { value: 'company', label: 'สถานประกอบการ', description: 'ระบุบริษัทที่กลุ่มรับผิดชอบโดยตรง' },
]
const availablePlacements = computed(() => getUnassignedPlacements(cycleId.value, round.value))
const scopeOptions = computed(() => {
  const values = availablePlacements.value.map(item => scopeType.value === 'region' ? item.region : scopeType.value === 'province' ? item.province : item.company)
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'th'))
})
const placementsInScope = computed(() => availablePlacements.value.filter((item) => {
  if (!scopeValues.value.length) return true
  const value = scopeType.value === 'region' ? item.region : scopeType.value === 'province' ? item.province : item.company
  return scopeValues.value.includes(value)
}))
const lecturerCandidates = computed(() => people.value.filter(person => person.type === 'lecturer' && person.recordStatus === 'active' && !['suspended', 'terminated'].includes(person.accountStatus)))
const selectedCompanies = computed(() => new Set(availablePlacements.value.filter(item => placementIds.value.includes(item.id)).map(item => item.company)).size)
const selectedCycleLabel = computed(() => cycles.find(cycle => cycle.id === cycleId.value)?.label ?? '')

const schema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อกลุ่ม'),
  scopeValues: z.array(z.string()).min(1, 'กรุณาเลือกพื้นที่รับผิดชอบอย่างน้อย 1 รายการ'),
  lecturerIds: z.array(z.string()).min(1, 'กรุณาเลือกอาจารย์รับผิดชอบหลักอย่างน้อย 1 คน'),
  placementIds: z.array(z.string()).min(1, 'กรุณาเลือกนักศึกษาอย่างน้อย 1 คน'),
})

watch([cycleId, round], () => {
  scopeValues.value = []
  placementIds.value = []
  errors.value = {}
})
watch(scopeType, () => {
  scopeValues.value = []
  placementIds.value = []
  delete errors.value.scopeValues
})
watch(scopeValues, () => {
  const visibleIds = new Set(placementsInScope.value.map(item => item.id))
  placementIds.value = placementIds.value.filter(id => visibleIds.has(id))
}, { deep: true })

const toggleValue = (target: 'scope' | 'lecturer' | 'placement', value: string, checked: boolean | 'indeterminate') => {
  const list = target === 'scope' ? scopeValues : target === 'lecturer' ? lecturerIds : placementIds
  list.value = checked ? [...new Set([...list.value, value])] : list.value.filter(item => item !== value)
  const errorKey = target === 'scope' ? 'scopeValues' : target === 'lecturer' ? 'lecturerIds' : 'placementIds'
  errors.value = { ...errors.value, [errorKey]: '' }
}
const selectAllPlacements = () => {
  placementIds.value = placementsInScope.value.map(item => item.id)
  delete errors.value.placementIds
}
const clearPlacements = () => { placementIds.value = [] }

const submit = async () => {
  if (isSaving.value) return
  errors.value = {}
  const result = schema.safeParse({ name: name.value, scopeValues: scopeValues.value, lecturerIds: lecturerIds.value, placementIds: placementIds.value })
  if (!result.success) {
    result.error.issues.forEach((issue) => { errors.value[String(issue.path[0])] = issue.message })
    return
  }
  isSaving.value = true
  try {
    const group = createGroup({
      cycleId: cycleId.value,
      round: round.value,
      name: result.data.name,
      scopeType: scopeType.value,
      scopeValues: result.data.scopeValues,
      lecturerIds: result.data.lecturerIds,
      placementIds: result.data.placementIds,
    })
    showToast({ title: 'สร้างกลุ่มนิเทศแล้ว', description: `${group.name} · นักศึกษา ${group.placementIds.length} คน` })
    await navigateTo({ path: '/staff/supervision/groups', query: { cycle: cycleId.value, round: String(round.value) } })
  }
  catch (error) {
    console.error(error)
    errors.value.form = error instanceof Error && error.message === 'placement-already-assigned'
      ? 'มีนักศึกษาบางคนถูกจัดเข้ากลุ่มของครั้งนี้แล้ว กรุณากลับไปเลือกรายการใหม่'
      : 'บันทึกกลุ่มไม่สำเร็จ กรุณาลองอีกครั้ง'
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <form novalidate @submit.prevent="submit">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><button type="button" class="mb-3 inline-flex min-h-9 items-center gap-2 rounded-control text-sm font-semibold text-muted hover:text-ink" @click="navigateTo('/staff/supervision/groups')"><ArrowLeft :size="17" aria-hidden="true" />กลับไปจัดกลุ่มนิเทศ</button><h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">สร้างกลุ่มนิเทศ</h2><p class="mt-1 text-sm leading-6 text-muted">กำหนดขอบเขตความรับผิดชอบ อาจารย์หลัก และนักศึกษาของกลุ่ม</p></div>
      <UiButton type="submit" :icon="Save" :loading="isSaving">บันทึกกลุ่มนิเทศ</UiButton>
    </div>

    <UiAlert v-if="errors.form" class="mb-6" tone="danger" title="บันทึกกลุ่มไม่สำเร็จ">{{ errors.form }}</UiAlert>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="space-y-6">
        <UiCard>
          <div class="flex items-start gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-control bg-warning-soft text-warning"><MapPinned :size="20" aria-hidden="true" /></span><div><h3 class="text-lg font-bold text-ink">ข้อมูลกลุ่มและพื้นที่รับผิดชอบ</h3><p class="mt-1 text-sm text-muted">พื้นที่ใช้สำหรับกรองนักศึกษาที่เกี่ยวข้องและอธิบายขอบเขตของอาจารย์กลุ่มนี้</p></div></div>
          <div class="mt-5 grid gap-4 sm:grid-cols-2"><UiSelect v-model="cycleId" :options="cycleOptions" :placeholder="selectedCycleLabel" label="รอบสหกิจศึกษา" /><UiSelect v-model="roundModel" :options="roundOptions" :placeholder="roundOptions.find(item => item.value === roundModel)?.label" label="ครั้งที่นิเทศ" /><div class="sm:col-span-2"><UiInput v-model="name" label="ชื่อกลุ่ม" placeholder="เช่น กลุ่มบุรีรัมย์ 1" :error="errors.name" required /></div></div>
          <div class="mt-5"><UiRadioGroup v-model="scopeTypeModel" :options="scopeTypeOptions" label="แบ่งความรับผิดชอบตาม" /></div>
          <fieldset class="mt-5"><legend class="text-sm font-semibold text-ink">เลือก{{ supervisionScopeMeta[scopeType].label }} <span class="text-danger" aria-hidden="true">*</span></legend><div class="mt-2 grid gap-2 sm:grid-cols-2"><label v-for="value in scopeOptions" :key="value" class="flex min-h-11 items-center gap-2 rounded-control border border-divider px-3 py-2 text-sm hover:bg-surface"><UiCheckbox :model-value="scopeValues.includes(value)" :label="`เลือก ${value}`" @update:model-value="toggleValue('scope', value, $event)" /><span class="font-medium text-ink">{{ value }}</span></label></div><p v-if="!scopeOptions.length" class="mt-2 rounded-control bg-surface p-4 text-sm text-muted">ไม่มีพื้นที่จากนักศึกษาที่ยืนยันสถานที่ฝึกงานในรอบนี้</p><p v-if="errors.scopeValues" class="mt-1.5 text-xs font-medium text-danger">{{ errors.scopeValues }}</p></fieldset>
        </UiCard>

        <UiCard :padded="false">
          <div class="border-b border-divider p-5 sm:p-6"><div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 class="text-lg font-bold text-ink">นักศึกษาในกลุ่ม</h3><p class="mt-1 text-sm text-muted">แสดงเฉพาะผู้ที่ยืนยันสถานที่แล้ว ยังไม่อยู่ในกลุ่มครั้งนี้ และตรงกับพื้นที่ที่เลือก</p></div><div class="flex gap-2"><UiButton size="sm" variant="secondary" @click="selectAllPlacements">เลือกทั้งหมด</UiButton><UiButton size="sm" variant="ghost" @click="clearPlacements">ล้างการเลือก</UiButton></div></div><p v-if="errors.placementIds" class="mt-3 text-xs font-medium text-danger">{{ errors.placementIds }}</p></div>
          <div v-if="!placementsInScope.length" class="p-5 sm:p-6"><AppEmptyState title="ไม่มีนักศึกษาที่ตรงกับพื้นที่" description="ลองเปลี่ยนพื้นที่รับผิดชอบ หรือกลับไปตรวจว่ามีนักศึกษาที่ยืนยันสถานที่แล้วหรือไม่" /></div>
          <template v-else><div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[760px] border-collapse text-left text-sm"><caption class="sr-only">นักศึกษาที่เลือกเข้ากลุ่มนิเทศ</caption><thead class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase"><tr><th scope="col" class="w-14 px-5 py-3 sm:px-6"><span class="sr-only">เลือก</span></th><th scope="col" class="px-4 py-3">นักศึกษา</th><th scope="col" class="px-4 py-3">สถานประกอบการ</th><th scope="col" class="px-6 py-3">จังหวัด / ตำแหน่ง</th></tr></thead><tbody class="divide-y divide-divider"><tr v-for="placement in placementsInScope" :key="placement.id" class="hover:bg-surface/70"><td class="px-5 py-4 sm:px-6"><UiCheckbox :model-value="placementIds.includes(placement.id)" :label="`เลือก ${placement.studentName}`" @update:model-value="toggleValue('placement', placement.id, $event)" /></td><td class="px-4 py-4"><p class="font-semibold text-ink">{{ placement.studentName }}</p><p class="mt-1 text-xs text-muted">{{ placement.studentId }}</p></td><td class="px-4 py-4"><p class="font-medium text-ink">{{ placement.company }}</p><p class="mt-1 text-xs text-muted">{{ placement.branch }}</p></td><td class="px-6 py-4"><p class="text-ink">{{ placement.province }}</p><p class="mt-1 text-xs text-muted">{{ placement.position }}</p></td></tr></tbody></table></div><div class="divide-y divide-divider md:hidden"><label v-for="placement in placementsInScope" :key="placement.id" class="flex items-start gap-3 p-5"><UiCheckbox :model-value="placementIds.includes(placement.id)" :label="`เลือก ${placement.studentName}`" @update:model-value="toggleValue('placement', placement.id, $event)" /><span><span class="block font-semibold text-ink">{{ placement.studentName }}</span><span class="mt-1 block text-xs text-muted">{{ placement.studentId }}</span><span class="mt-3 block text-sm font-medium text-ink">{{ placement.company }}</span><span class="mt-1 block text-xs text-muted">{{ placement.province }} · {{ placement.position }}</span></span></label></div></template>
        </UiCard>
      </div>

      <aside class="space-y-6">
        <UiCard>
          <div class="flex items-start gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-control bg-info-soft text-info"><UsersRound :size="20" aria-hidden="true" /></span><div><h3 class="text-lg font-bold text-ink">อาจารย์รับผิดชอบหลัก</h3><p class="mt-1 text-sm leading-6 text-muted">เลือกได้มากกว่าหนึ่งคน</p></div></div>
          <div class="mt-4 space-y-2"><label v-for="lecturer in lecturerCandidates" :key="lecturer.id" class="flex min-h-14 items-center gap-3 rounded-control border border-divider px-3 py-2 hover:bg-surface"><UiCheckbox :model-value="lecturerIds.includes(lecturer.id)" :label="`เลือก ${lecturer.firstName} ${lecturer.lastName}`" @update:model-value="toggleValue('lecturer', lecturer.id, $event)" /><span class="min-w-0"><span class="block font-semibold text-ink">{{ lecturer.firstName }} {{ lecturer.lastName }}</span><span class="mt-0.5 block text-xs text-muted">{{ lecturer.id }}</span></span></label></div>
          <p v-if="errors.lecturerIds" class="mt-2 text-xs font-medium text-danger">{{ errors.lecturerIds }}</p>
        </UiCard>

        <UiCard class="xl:sticky xl:top-24">
          <h3 class="text-lg font-bold text-ink">สรุปกลุ่ม</h3>
          <dl class="mt-4 space-y-3 text-sm"><div class="flex items-start justify-between gap-4"><dt class="text-muted">รอบ</dt><dd class="text-right font-semibold text-ink">{{ selectedCycleLabel }}</dd></div><div class="flex items-start justify-between gap-4"><dt class="text-muted">ครั้งที่นิเทศ</dt><dd class="font-semibold text-ink">ครั้งที่ {{ round }}</dd></div><div class="flex items-start justify-between gap-4"><dt class="text-muted">พื้นที่</dt><dd class="text-right font-semibold text-ink">{{ scopeValues.length }} รายการ</dd></div><div class="flex items-start justify-between gap-4"><dt class="text-muted">อาจารย์หลัก</dt><dd class="font-semibold text-ink">{{ lecturerIds.length }} คน</dd></div><div class="flex items-start justify-between gap-4"><dt class="text-muted">สถานประกอบการ</dt><dd class="font-semibold text-ink">{{ selectedCompanies }} แห่ง</dd></div><div class="flex items-start justify-between gap-4 border-t border-divider pt-3"><dt class="font-semibold text-ink">นักศึกษา</dt><dd class="text-xl font-bold text-ink">{{ placementIds.length }} คน</dd></div></dl>
          <UiButton type="submit" class="mt-5 w-full" :icon="Check" :loading="isSaving">บันทึกกลุ่มนิเทศ</UiButton>
        </UiCard>
      </aside>
    </div>
  </form>
</template>
