<script setup lang="ts">
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from '@lucide/vue'
import { z } from 'zod'
import type { CalendarEventType, RoleCalendarEventInput } from '~/composables/useRoleCalendar'

definePageMeta({ title: 'ปฏิทินงาน' })
useHead({ title: 'ปฏิทินงาน' })

const { scenario } = useScenario()
const { events, addEvent } = useRoleCalendar()
const { showToast } = useToast()
const viewMonth = ref(new Date(2026, 8, 1))
const selectedDate = ref('2026-09-01')
const selectedType = ref('all')
const addDialogOpen = ref(false)
const isSubmitting = ref(false)
const form = reactive<RoleCalendarEventInput>({ title: '', description: '', date: '2026-09-01', type: 'general' })
const fieldErrors = reactive({ title: '', date: '', type: '' })

const eventTypeOptions = [
  { value: 'all', label: 'กิจกรรมทุกประเภท' },
  ...Object.entries(calendarEventTypeMeta).map(([value, meta]) => ({ value, label: meta.label })),
]
const addEventTypeOptions = Object.entries(calendarEventTypeMeta).map(([value, meta]) => ({ value, label: meta.label }))
const weekDays = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']
const roleLabel = computed(() => ({ staff: 'เจ้าหน้าที่', lecturer: 'อาจารย์', student: 'นักศึกษา' })[scenario.value.role])
const roleDescription = computed(() => ({
  staff: 'ดูงานจัดการรอบสหกิจ การจัดกลุ่ม และตารางนิเทศทั้งหมด',
  lecturer: 'ดูงานตรวจคำร้อง นัดนิเทศ และการประเมินที่เกี่ยวข้องกับคุณ',
  student: 'ดูกำหนดส่งเอกสาร สถานะคำร้อง และตารางนิเทศของคุณ',
})[scenario.value.role])
const monthLabel = computed(() => new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(viewMonth.value))
const visibleEvents = computed(() => selectedType.value === 'all'
  ? events.value
  : events.value.filter(event => event.type === selectedType.value))
const calendarDays = computed(() => eachDayOfInterval({
  start: startOfWeek(startOfMonth(viewMonth.value), { weekStartsOn: 1 }),
  end: endOfWeek(endOfMonth(viewMonth.value), { weekStartsOn: 1 }),
}))
const monthEvents = computed(() => visibleEvents.value.filter(event => event.date.startsWith(format(viewMonth.value, 'yyyy-MM'))))
const selectedDateEvents = computed(() => visibleEvents.value.filter(event => event.date === selectedDate.value))
const upcomingEvents = computed(() => visibleEvents.value.filter(event => event.date >= '2026-09-01').slice(0, 5))
const deadlineCount = computed(() => monthEvents.value.filter(event => event.type === 'deadline').length)
const effectiveViewState = computed(() => scenario.value.forceError ? 'error' : scenario.value.viewState)

const eventsForDate = (date: Date) => visibleEvents.value.filter(event => event.date === format(date, 'yyyy-MM-dd'))
const formatSelectedDate = (date: string) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'full' }).format(new Date(`${date}T00:00:00+07:00`))
const goToMonth = (offset: number) => {
  viewMonth.value = addMonths(viewMonth.value, offset)
  selectedDate.value = format(startOfMonth(viewMonth.value), 'yyyy-MM-dd')
}
const goToCurrentMonth = () => {
  viewMonth.value = new Date(2026, 8, 1)
  selectedDate.value = '2026-09-01'
}
const selectDay = (date: Date) => {
  selectedDate.value = format(date, 'yyyy-MM-dd')
  if (!isSameMonth(date, viewMonth.value)) viewMonth.value = startOfMonth(date)
}
const openAddDialog = (date = selectedDate.value) => {
  Object.assign(form, { title: '', description: '', date, type: 'general' as CalendarEventType })
  Object.assign(fieldErrors, { title: '', date: '', type: '' })
  addDialogOpen.value = true
}
const retry = () => {
  scenario.value.forceError = false
  scenario.value.viewState = 'data'
}
const eventSchema = z.object({
  title: z.string().trim().min(1, 'กรุณากรอกชื่อกิจกรรม'),
  description: z.string().trim(),
  date: z.string().min(1, 'กรุณาเลือกวันที่'),
  type: z.enum(['supervision', 'document', 'deadline', 'evaluation', 'general']),
})
const submitEvent = async () => {
  Object.assign(fieldErrors, { title: '', date: '', type: '' })
  const parsed = eventSchema.safeParse(form)
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors
    fieldErrors.title = errors.title?.[0] ?? ''
    fieldErrors.date = errors.date?.[0] ?? ''
    fieldErrors.type = errors.type?.[0] ?? ''
    return
  }
  isSubmitting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 250))
    addEvent(parsed.data)
    selectedDate.value = parsed.data.date
    viewMonth.value = startOfMonth(new Date(`${parsed.data.date}T00:00:00+07:00`))
    addDialogOpen.value = false
    showToast({ title: 'เพิ่มกิจกรรมในปฏิทินแล้ว', description: `แสดงสำหรับบทบาท${roleLabel.value}` })
  }
  catch {
    showToast({ title: 'เพิ่มกิจกรรมไม่สำเร็จ', description: 'กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง' })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-primary">ปฏิทินสำหรับ{{ roleLabel }}</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">ปฏิทินงาน</h2>
        <p class="mt-1 text-sm leading-6 text-muted">{{ roleDescription }} กิจกรรมจากระบบจะเพิ่มและอัปเดตให้อัตโนมัติ</p>
      </div>
      <UiButton :icon="Plus" @click="openAddDialog()">เพิ่มกิจกรรม</UiButton>
    </header>

    <div v-if="effectiveViewState === 'loading'" class="space-y-5" aria-label="กำลังโหลดปฏิทินงาน">
      <div class="grid gap-3 sm:grid-cols-3"><UiSkeleton v-for="item in 3" :key="item" class="h-28" /></div>
      <UiSkeleton class="h-[38rem]" />
    </div>
    <AppErrorState v-else-if="effectiveViewState === 'error'" title="โหลดปฏิทินงานไม่สำเร็จ" description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองอีกครั้ง" @retry="retry" />
    <UiCard v-else-if="effectiveViewState === 'empty'"><AppEmptyState title="ยังไม่มีกิจกรรมในปฏิทิน" description="เมื่อมีงานหรือกิจกรรมใหม่ ระบบจะแสดงในปฏิทินตามบทบาทของคุณ" /></UiCard>

    <template v-else>
    <div class="mb-6 grid gap-3 sm:grid-cols-3">
      <UiCard><p class="text-sm text-muted">กิจกรรมเดือนนี้</p><p class="mt-2 text-2xl font-bold text-ink">{{ monthEvents.length }}</p></UiCard>
      <UiCard><p class="text-sm text-muted">กำหนดส่งเดือนนี้</p><p class="mt-2 text-2xl font-bold text-danger">{{ deadlineCount }}</p></UiCard>
      <UiCard><p class="text-sm text-muted">งานที่กำลังจะถึง</p><p class="mt-2 text-2xl font-bold text-info">{{ upcomingEvents.length }}</p></UiCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <UiCard :padded="false" class="min-w-0 overflow-hidden">
        <div class="flex flex-col gap-3 border-b border-divider p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div class="flex items-center gap-2">
            <button type="button" class="grid size-11 place-items-center rounded-control border border-divider text-muted hover:bg-surface hover:text-ink" aria-label="เดือนก่อนหน้า" @click="goToMonth(-1)"><ChevronLeft :size="18" aria-hidden="true" /></button>
            <button type="button" class="min-h-11 rounded-control border border-divider px-3 text-sm font-semibold text-ink hover:bg-surface" @click="goToCurrentMonth">เดือนปัจจุบัน</button>
            <button type="button" class="grid size-11 place-items-center rounded-control border border-divider text-muted hover:bg-surface hover:text-ink" aria-label="เดือนถัดไป" @click="goToMonth(1)"><ChevronRight :size="18" aria-hidden="true" /></button>
          </div>
          <h3 class="text-lg font-bold text-ink">{{ monthLabel }}</h3>
          <div class="w-full sm:w-52"><UiSelect v-model="selectedType" :options="eventTypeOptions" label="กรองประเภทกิจกรรม" :label-visible="false" /></div>
        </div>

        <div class="overflow-x-auto">
          <div class="min-w-[760px]">
            <div class="grid grid-cols-7 border-b border-divider bg-surface text-center text-xs font-semibold text-muted">
              <div v-for="day in weekDays" :key="day" class="px-2 py-3">{{ day }}</div>
            </div>
            <div class="grid grid-cols-7">
              <button
                v-for="day in calendarDays"
                :key="format(day, 'yyyy-MM-dd')"
                type="button"
                class="min-h-32 border-r border-b border-divider p-2 text-left align-top transition-colors hover:bg-surface/70 focus-visible:relative focus-visible:z-10"
                :class="selectedDate === format(day, 'yyyy-MM-dd') ? 'bg-warning-soft/60 ring-2 ring-inset ring-primary' : ''"
                :aria-label="`${formatSelectedDate(format(day, 'yyyy-MM-dd'))} มี ${eventsForDate(day).length} กิจกรรม`"
                @click="selectDay(day)"
              >
                <span class="grid size-7 place-items-center rounded-full text-sm font-semibold" :class="isSameMonth(day, viewMonth) ? 'text-ink' : 'text-muted/50'">{{ format(day, 'd') }}</span>
                <span class="mt-1 block space-y-1">
                  <span v-for="event in eventsForDate(day).slice(0, 3)" :key="event.id" class="flex min-w-0 items-center gap-1.5 rounded px-1.5 py-1 text-xs text-ink" :class="calendarEventTypeMeta[event.type].tone === 'danger' ? 'bg-danger-soft' : calendarEventTypeMeta[event.type].tone === 'warning' ? 'bg-warning-soft' : calendarEventTypeMeta[event.type].tone === 'info' ? 'bg-info-soft' : calendarEventTypeMeta[event.type].tone === 'interview' ? 'bg-interview-soft' : 'bg-surface'">
                    <span class="size-1.5 shrink-0 rounded-full" :class="calendarEventTypeMeta[event.type].dotClass" aria-hidden="true" />
                    <span class="truncate">{{ event.title }}</span>
                  </span>
                  <span v-if="eventsForDate(day).length > 3" class="block px-1.5 text-xs font-medium text-muted">+{{ eventsForDate(day).length - 3 }} รายการ</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </UiCard>

      <aside class="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <UiCard>
          <div class="flex items-start justify-between gap-3">
            <div><p class="text-xs font-medium text-muted">วันที่เลือก</p><h3 class="mt-1 text-base font-bold text-ink">{{ formatSelectedDate(selectedDate) }}</h3></div>
            <button type="button" class="grid size-10 shrink-0 place-items-center rounded-control border border-divider text-muted hover:bg-surface hover:text-ink" aria-label="เพิ่มกิจกรรมในวันที่เลือก" title="เพิ่มกิจกรรม" @click="openAddDialog(selectedDate)"><Plus :size="18" aria-hidden="true" /></button>
          </div>
          <div v-if="selectedDateEvents.length" class="mt-4 space-y-3">
            <article v-for="event in selectedDateEvents" :key="event.id" class="rounded-control border border-divider p-3">
              <div class="flex flex-wrap items-center gap-2"><UiBadge :tone="calendarEventTypeMeta[event.type].tone">{{ calendarEventTypeMeta[event.type].label }}</UiBadge><span v-if="event.source === 'system'" class="text-xs text-muted">จากระบบ</span></div>
              <h4 class="mt-2 font-semibold leading-6 text-ink">{{ event.title }}</h4>
              <p v-if="event.description" class="mt-1 text-sm leading-6 text-muted">{{ event.description }}</p>
              <NuxtLink v-if="event.href" :to="event.href" class="mt-3 inline-flex text-sm font-semibold text-info hover:underline">เปิดงานที่เกี่ยวข้อง</NuxtLink>
            </article>
          </div>
          <AppEmptyState v-else class="mt-4" title="ไม่มีกิจกรรมในวันนี้" description="เลือกวันอื่นหรือเพิ่มกิจกรรมใหม่สำหรับบทบาทของคุณ" />
        </UiCard>

        <UiCard>
          <div class="flex items-center gap-2"><CalendarDays :size="19" class="text-primary" aria-hidden="true" /><h3 class="font-bold text-ink">ประเภทกิจกรรม</h3></div>
          <div class="mt-4 flex flex-wrap gap-2"><UiBadge v-for="(meta, type) in calendarEventTypeMeta" :key="type" :tone="meta.tone">{{ meta.label }}</UiBadge></div>
        </UiCard>
      </aside>
    </div>
    </template>

    <UiDialog v-model:open="addDialogOpen" title="เพิ่มกิจกรรมในปฏิทิน" :description="`กิจกรรมนี้จะแสดงเฉพาะมุมมอง${roleLabel}ใน UI Prototype`" :close-on-confirm="false">
      <form id="calendar-event-form" class="space-y-5" novalidate @submit.prevent="submitEvent">
        <div><UiInput v-model="form.title" label="ชื่อกิจกรรม" placeholder="เช่น ประชุมเตรียมการนิเทศ" :error="fieldErrors.title" required /></div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div><UiInput v-model="form.date" type="date" label="วันที่" :error="fieldErrors.date" required /></div>
          <div><UiSelect v-model="form.type" :options="addEventTypeOptions" label="ประเภทกิจกรรม" :error="fieldErrors.type" required /></div>
        </div>
        <div><UiTextarea v-model="form.description" label="รายละเอียด" placeholder="ระบุรายละเอียดหรือสิ่งที่ต้องเตรียม (ไม่บังคับ)" /></div>
      </form>
      <template #cancel><UiButton variant="secondary">ยกเลิก</UiButton></template>
      <template #confirm><UiButton type="submit" form="calendar-event-form" :loading="isSubmitting">บันทึกกิจกรรม</UiButton></template>
    </UiDialog>
  </div>
</template>
