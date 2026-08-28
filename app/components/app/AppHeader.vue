<script setup lang="ts">
import { Bell, ChevronDown, LogOut, Menu, Settings, UserRound } from '@lucide/vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'

const emit = defineEmits<{ openNavigation: [] }>()
const route = useRoute()
const { scenario } = useScenario()

const roleLabel = computed(() => ({
  staff: 'เจ้าหน้าที่',
  lecturer: 'อาจารย์นิเทศ',
  student: 'นักศึกษา',
}[scenario.value.role]))
const pageTitle = computed(() => String(route.meta.title ?? 'ภาพรวมระบบ'))
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-divider bg-canvas/95 backdrop-blur">
    <div class="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded-control text-ink hover:bg-surface lg:hidden"
        aria-label="เปิดเมนูหลัก"
        @click="emit('openNavigation')"
      >
        <Menu :size="21" aria-hidden="true" />
      </button>

      <div class="min-w-0 flex-1">
        <p class="truncate text-xs text-muted">CWIE BRU / {{ pageTitle }}</p>
        <h1 class="truncate text-base font-bold text-ink sm:text-lg">{{ pageTitle }}</h1>
      </div>

      <button
        type="button"
        disabled
        class="relative grid size-11 shrink-0 place-items-center rounded-control border border-divider text-muted hover:bg-surface hover:text-ink"
        aria-label="การแจ้งเตือน ยังไม่มีรายการใหม่"
      >
        <Bell :size="19" aria-hidden="true" />
      </button>

      <DropdownMenuRoot>
        <DropdownMenuTrigger class="flex min-h-12 items-center gap-2.5 rounded-control border border-divider bg-canvas px-3 text-left hover:bg-surface">
          <span class="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-ink">{{ scenario.userName.slice(0, 1) }}</span>
          <span class="hidden min-w-0 sm:block">
            <span class="block max-w-40 truncate text-sm font-semibold text-ink">{{ scenario.userName }}</span>
            <span class="block text-xs text-muted">{{ roleLabel }}</span>
          </span>
          <ChevronDown class="hidden size-4 text-muted sm:block" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent :side-offset="8" align="end" class="z-50 min-w-64 rounded-panel border border-divider bg-canvas p-2 shadow-xl">
            <DropdownMenuItem disabled class="flex min-h-12 items-center gap-3 rounded-control px-4 text-sm opacity-55 outline-none">
              <UserRound :size="16" aria-hidden="true" /> ข้อมูลบัญชี
            </DropdownMenuItem>
            <DropdownMenuItem disabled class="flex min-h-12 items-center gap-3 rounded-control px-4 text-sm opacity-55 outline-none">
              <Settings :size="16" aria-hidden="true" /> ตั้งค่ารหัสผ่าน
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-1.5 h-px bg-divider" />
            <DropdownMenuItem disabled class="flex min-h-12 items-center gap-3 rounded-control px-4 text-sm text-danger opacity-55 outline-none">
              <LogOut :size="16" aria-hidden="true" /> ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </header>
</template>
