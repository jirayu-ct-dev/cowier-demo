<script setup lang="ts">
import { Building2, CalendarDays, ClipboardCheck, Users } from '@lucide/vue'

definePageMeta({ title: 'ภาพรวมระบบ' })

const { scenario } = useScenario()
const roleLabel = computed(() => ({ staff: 'เจ้าหน้าที่', lecturer: 'อาจารย์นิเทศ', student: 'นักศึกษา' }[scenario.value.role]))
const summary = [
  { label: 'คำร้องรอตรวจสอบ', value: '12', hint: 'เพิ่มขึ้น 3 รายการวันนี้', icon: ClipboardCheck },
  { label: 'นักศึกษาในรอบ', value: '248', hint: 'ยืนยันสถานประกอบการแล้ว 81%', icon: Users },
  { label: 'สถานประกอบการ', value: '96', hint: 'มีรายการใหม่รอตรวจ 2 แห่ง', icon: Building2 },
  { label: 'ตารางนิเทศเดือนนี้', value: '18', hint: 'มีรายการต้องจัดเวลา 4 รายการ', icon: CalendarDays },
]
const recentItems = [
  { id: 'REQ-0269-041', student: 'นายธนกฤต พูนทรัพย์', company: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', status: 'รอตรวจสอบ', tone: 'warning' as const },
  { id: 'REQ-0269-040', student: 'นางสาวปภาวดี นาคแก้ว', company: 'บริษัท ไอทีโซลูชัน จำกัด', status: 'รอออกหนังสือ', tone: 'info' as const },
  { id: 'REQ-0269-039', student: 'นายณัฐวุฒิ ทองดี', company: 'โรงพยาบาลบุรีรัมย์', status: 'ยืนยันแล้ว', tone: 'success' as const },
]

const retry = () => {
  scenario.value.viewState = 'loading'
  window.setTimeout(() => { scenario.value.viewState = 'data' }, 650)
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm font-medium text-warning">{{ scenario.cycle }}</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">สวัสดี {{ scenario.userName }}</h2>
        <p class="mt-1 text-sm text-muted">มุมมองสำหรับ{{ roleLabel }} · ข้อมูลตัวอย่างเพื่อยืนยันรูปแบบ UI</p>
      </div>
      <UiBadge tone="success">รอบกำลังดำเนินการ</UiBadge>
    </div>

    <template v-if="scenario.viewState === 'loading'">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="กำลังโหลดภาพรวม">
        <UiCard v-for="index in 4" :key="index">
          <UiSkeleton class="h-4 w-28" />
          <UiSkeleton class="mt-5 h-9 w-16" />
          <UiSkeleton class="mt-3 h-3 w-40" />
        </UiCard>
      </div>
      <UiCard class="mt-6">
        <UiSkeleton class="h-6 w-44" />
        <UiSkeleton v-for="index in 3" :key="index" class="mt-5 h-14 w-full" />
      </UiCard>
    </template>

    <AppEmptyState
      v-else-if="scenario.viewState === 'empty'"
      title="ยังไม่มีรายการในรอบนี้"
      description="เมื่อมีนักศึกษาส่งคำร้องหรือมีตารางนิเทศ รายการสรุปจะแสดงที่นี่"
    />
    <AppErrorState v-else-if="scenario.viewState === 'error'" @retry="retry" />

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UiCard v-for="item in summary" :key="item.label">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-medium text-muted">{{ item.label }}</p>
              <p class="mt-2 text-3xl font-bold tracking-tight text-ink">{{ item.value }}</p>
            </div>
            <div class="grid size-10 place-items-center rounded-control bg-warning-soft text-warning">
              <component :is="item.icon" :size="20" aria-hidden="true" />
            </div>
          </div>
          <p class="mt-4 text-xs leading-5 text-muted">{{ item.hint }}</p>
        </UiCard>
      </div>

      <UiCard class="mt-6" :padded="false">
        <div class="flex items-center justify-between gap-4 border-b border-divider px-5 py-4 sm:px-6">
          <div>
            <h2 class="font-bold text-ink">คำร้องล่าสุด</h2>
            <p class="mt-0.5 text-sm text-muted">ตัวอย่างรูปแบบตารางและสถานะ</p>
          </div>
          <span class="text-xs font-medium text-muted">3 รายการล่าสุด</span>
        </div>

        <div class="hidden overflow-x-auto md:block">
          <table class="w-full text-left text-sm">
            <thead class="bg-surface text-xs font-semibold text-muted">
              <tr><th class="px-6 py-3">เลขที่คำร้อง</th><th class="px-6 py-3">นักศึกษา</th><th class="px-6 py-3">สถานประกอบการ</th><th class="px-6 py-3">สถานะ</th></tr>
            </thead>
            <tbody class="divide-y divide-divider">
              <tr v-for="item in recentItems" :key="item.id" class="hover:bg-surface/70">
                <td class="px-6 py-4 font-semibold text-ink">{{ item.id }}</td>
                <td class="px-6 py-4 text-ink">{{ item.student }}</td>
                <td class="px-6 py-4 text-muted">{{ item.company }}</td>
                <td class="px-6 py-4"><UiBadge :tone="item.tone">{{ item.status }}</UiBadge></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-divider md:hidden">
          <article v-for="item in recentItems" :key="item.id" class="p-5">
            <div class="flex items-start justify-between gap-3">
              <p class="text-sm font-semibold text-ink">{{ item.student }}</p>
              <UiBadge :tone="item.tone">{{ item.status }}</UiBadge>
            </div>
            <p class="mt-2 text-sm text-muted">{{ item.company }}</p>
            <p class="mt-3 text-xs font-medium text-muted">{{ item.id }}</p>
          </article>
        </div>
      </UiCard>
    </template>
  </div>
</template>
