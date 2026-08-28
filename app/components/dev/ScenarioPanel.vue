<script setup lang="ts">
import { RotateCcw, SlidersHorizontal, X } from '@lucide/vue'
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'

const { scenario, resetScenario } = useScenario()
const roleOptions = [
  { value: 'staff', label: 'เจ้าหน้าที่' },
  { value: 'lecturer', label: 'อาจารย์' },
  { value: 'student', label: 'นักศึกษา' },
]
const cycleOptions = [
  { value: 'ภาคเรียนที่ 2/2569', label: 'ภาคเรียนที่ 2/2569' },
  { value: 'ภาคฤดูร้อน/2569', label: 'ภาคฤดูร้อน/2569' },
  { value: 'ภาคเรียนที่ 1/2570', label: 'ภาคเรียนที่ 1/2570' },
]

const selectedRole = computed({
  get: () => scenario.value.role,
  set: (value: string) => {
    if (value === 'staff' || value === 'lecturer' || value === 'student') {
      scenario.value.role = value
    }
  },
})
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger class="fixed right-4 bottom-4 z-40 flex min-h-12 items-center gap-2 rounded-full bg-sidebar px-5 text-sm font-semibold text-white shadow-xl hover:bg-black">
      <SlidersHorizontal :size="17" aria-hidden="true" />
      <span class="hidden sm:inline">จำลองสถานการณ์</span>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent :side-offset="10" align="end" class="z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-panel border border-divider bg-canvas p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-bold text-ink">Developer Scenario</p>
            <p class="mt-0.5 text-xs text-muted">ข้อมูลจำลองจะรีเซ็ตเมื่อโหลดหน้าใหม่</p>
          </div>
          <PopoverClose class="grid size-11 place-items-center rounded-md text-muted hover:bg-surface" aria-label="ปิดแผงจำลองสถานการณ์">
            <X :size="17" aria-hidden="true" />
          </PopoverClose>
        </div>

        <div class="mt-5 space-y-4">
          <div>
            <label id="scenario-role-label" class="block text-sm font-semibold text-ink">บทบาท</label>
            <div class="mt-1.5"><UiSelect v-model="selectedRole" :options="roleOptions" label="บทบาท" /></div>
          </div>
          <label class="block text-sm font-semibold text-ink">
            ผู้ใช้งาน
            <input v-model="scenario.userName" class="mt-1.5 min-h-11 w-full rounded-control border border-divider bg-canvas px-3 font-normal" />
          </label>
          <div>
            <label id="scenario-cycle-label" class="block text-sm font-semibold text-ink">รอบสหกิจศึกษา</label>
            <div class="mt-1.5"><UiSelect v-model="scenario.cycle" :options="cycleOptions" label="รอบสหกิจศึกษา" /></div>
          </div>
          <fieldset>
            <legend class="text-sm font-semibold text-ink">สถานะข้อมูล</legend>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <label
                v-for="state in [{ value: 'data', label: 'มีข้อมูล' }, { value: 'loading', label: 'กำลังโหลด' }, { value: 'empty', label: 'ไม่มีข้อมูล' }, { value: 'error', label: 'ผิดพลาด' }]"
                :key="state.value"
                class="flex min-h-10 items-center gap-2 rounded-control border border-divider px-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-warning-soft"
              >
                <input v-model="scenario.viewState" type="radio" name="view-state" :value="state.value" class="accent-amber-500" />
                {{ state.label }}
              </label>
            </div>
          </fieldset>
          <UiButton class="w-full" variant="secondary" :icon="RotateCcw" @click="resetScenario">คืนค่าเริ่มต้น</UiButton>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
