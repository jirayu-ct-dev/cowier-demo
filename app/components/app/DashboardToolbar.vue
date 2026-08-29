<script setup lang="ts">
import { CalendarRange } from '@lucide/vue'

const {
  cycleId,
  roundModel,
  cycleOptions,
  roundOptions,
  selectedCycleLabel,
} = useSupervisionContext()
</script>

<template>
  <aside class="sticky top-16 z-20 border-b border-divider bg-canvas/95 backdrop-blur" aria-label="บริบทการจัดกลุ่มนิเทศ">
    <div class="mx-auto flex min-h-16 w-full max-w-[1480px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3 sm:mr-auto">
        <span class="grid size-9 shrink-0 place-items-center rounded-control bg-warning-soft text-warning">
          <CalendarRange :size="18" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-medium text-muted">บริบทการจัดกลุ่มนิเทศ</p>
          <p class="truncate text-sm font-semibold text-ink">{{ selectedCycleLabel }} · {{ roundOptions.find(option => option.value === roundModel)?.label }}</p>
        </div>
      </div>

      <div class="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-[17rem_12rem]">
        <UiSelect
          v-model="cycleId"
          :options="cycleOptions"
          :placeholder="selectedCycleLabel"
          label="รอบสหกิจศึกษา"
          :label-visible="false"
        />
        <UiSelect
          v-model="roundModel"
          :options="roundOptions"
          :placeholder="roundOptions.find(option => option.value === roundModel)?.label"
          label="ครั้งที่นิเทศ"
          :label-visible="false"
        />
      </div>
    </div>
  </aside>
</template>
