<script setup lang="ts">
import { CalendarRange, X } from '@lucide/vue'

const route = useRoute()
const {
  cycleId,
  roundModel,
  cycleOptions,
  roundOptions,
  scheduleDate,
  selectedCycleLabel,
} = useSupervisionContext()
const {
  studentCohort,
  studentCohortOptions,
  studentSection,
  studentSectionOptions,
  studentSemester,
  studentSemesterOptions,
  ensureAvailableStudentFilters,
  selectedStudentCohortLabel,
  selectedStudentSectionLabel,
  selectedStudentSemesterLabel,
} = useStudentCohortContext()
const showsSupervisionRound = computed(() => route.path.startsWith('/lecturer/supervision')
  || route.path.startsWith('/lecturer/evaluations')
  || route.path.startsWith('/staff/supervision'))
const showsLecturerScheduleFilters = computed(() => route.path.startsWith('/lecturer/supervision'))
const showsStudentCohort = computed(() => route.path.startsWith('/lecturer/students')
  || route.path.startsWith('/lecturer/applications')
  || route.path.startsWith('/staff/applications')
  || route.path === '/staff/master-data/students'
  || route.path === '/staff/companies')
const toolbarGridClass = computed(() => showsLecturerScheduleFilters.value
  ? 'sm:grid-cols-[17rem_12rem_13rem]'
  : showsStudentCohort.value
    ? 'sm:grid-cols-[11rem_9rem_12rem]'
  : showsSupervisionRound.value
    ? 'sm:grid-cols-[17rem_12rem]'
  : 'sm:w-[17rem]')
const contextLabel = computed(() => {
  if (route.path.startsWith('/lecturer/placements')) return 'บริบทการตรวจคำร้อง'
  if (route.path.startsWith('/lecturer/students')) return 'บริบทข้อมูลนักศึกษา'
  if (route.path.startsWith('/lecturer/applications')) return 'บริบทการสมัครสหกิจ'
  if (route.path.startsWith('/staff/applications')) return 'บริบทการสมัครสหกิจ'
  if (route.path.startsWith('/lecturer/evaluations')) return 'บริบทการประเมิน'
  if (route.path.startsWith('/lecturer/supervision')) return 'บริบทตารางนิเทศ'
  if (route.path.startsWith('/staff/master-data/students')) return 'บริบทข้อมูลนักศึกษา'
  if (route.path === '/staff/companies') return 'บริบทสถานประกอบการ'
  if (route.path === '/staff/supervision') return 'บริบทตารางนิเทศ'
  return 'บริบทการจัดกลุ่มนิเทศ'
})
const scheduleDateLabel = computed(() => scheduleDate.value
  ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(`${scheduleDate.value}T00:00:00+07:00`))
  : '')
watchEffect(() => {
  if (showsStudentCohort.value) ensureAvailableStudentFilters()
})
</script>

<template>
  <aside class="sticky top-16 z-20 border-b border-divider bg-canvas/95 backdrop-blur" :aria-label="contextLabel">
    <div class="mx-auto flex min-h-16 w-full max-w-[1480px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3 sm:mr-auto">
        <span class="grid size-9 shrink-0 place-items-center rounded-control bg-warning-soft text-warning">
          <CalendarRange :size="18" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-medium text-muted">{{ contextLabel }}</p>
          <p class="truncate text-sm font-semibold text-ink">
            <template v-if="showsStudentCohort">{{ selectedStudentCohortLabel }} · {{ selectedStudentSectionLabel }} · {{ selectedStudentSemesterLabel }}</template><template v-else>{{ selectedCycleLabel }}<template v-if="showsSupervisionRound"> · {{ roundOptions.find(option => option.value === roundModel)?.label }}</template><template v-if="showsLecturerScheduleFilters && scheduleDateLabel"> · {{ scheduleDateLabel }}</template></template>
          </p>
        </div>
      </div>

      <div class="grid w-full grid-cols-1 gap-2 sm:w-auto" :class="toolbarGridClass">
        <UiSelect
          v-if="showsStudentCohort"
          v-model="studentCohort"
          :options="studentCohortOptions"
          :placeholder="selectedStudentCohortLabel"
          label="รุ่นนักศึกษา"
          :label-visible="false"
        />
        <UiSelect
          v-if="showsStudentCohort"
          v-model="studentSection"
          :options="studentSectionOptions"
          :placeholder="selectedStudentSectionLabel"
          label="หมู่เรียน"
          :label-visible="false"
        />
        <UiSelect
          v-if="showsStudentCohort"
          v-model="studentSemester"
          :options="studentSemesterOptions"
          :placeholder="selectedStudentSemesterLabel"
          label="ภาคเรียน"
          :label-visible="false"
        />
        <UiSelect
          v-if="!showsStudentCohort"
          v-model="cycleId"
          :options="cycleOptions"
          :placeholder="selectedCycleLabel"
          label="รอบสหกิจศึกษา"
          :label-visible="false"
        />
        <UiSelect
          v-if="showsSupervisionRound"
          v-model="roundModel"
          :options="roundOptions"
          :placeholder="roundOptions.find(option => option.value === roundModel)?.label"
          label="ครั้งที่นิเทศ"
          :label-visible="false"
        />
        <div v-if="showsLecturerScheduleFilters" class="flex items-center gap-1">
          <label for="supervision-schedule-date" class="sr-only">วันที่นิเทศ</label>
          <input
            id="supervision-schedule-date"
            v-model="scheduleDate"
            type="date"
            class="min-h-11 min-w-0 flex-1 rounded-control border border-divider bg-canvas px-3 text-sm font-normal text-ink transition-colors hover:border-gray-300"
            aria-label="เลือกวันที่นิเทศ"
          >
          <button
            v-if="scheduleDate"
            type="button"
            class="grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-muted hover:bg-surface hover:text-ink"
            aria-label="ล้างวันที่นิเทศ"
            title="ล้างวันที่"
            @click="scheduleDate = ''"
          >
            <X :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
