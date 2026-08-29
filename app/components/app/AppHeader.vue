<script setup lang="ts">
import { Bell, ChevronDown, Menu } from '@lucide/vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'

const emit = defineEmits<{ openNavigation: [] }>()
const route = useRoute()
const { scenario, recordEvent } = useScenario()
const notificationRead = useState<boolean>('mock-notification-read', () => false)

const roleLabel = computed(() => ({
  staff: 'เจ้าหน้าที่',
  lecturer: 'อาจารย์นิเทศ',
  student: 'นักศึกษา',
}[scenario.value.role]))
const pageTitle = computed(() => {
  const path = route.path
  if (path.startsWith('/staff/master-data/students/new')) return 'เพิ่มนักศึกษา'
  if (/^\/staff\/master-data\/students\/[^/]+$/.test(path)) return 'รายละเอียดนักศึกษา'
  if (path.startsWith('/staff/master-data/students')) return 'ข้อมูลนักศึกษา'
  if (path.startsWith('/staff/master-data/lecturers/new')) return 'เพิ่มอาจารย์'
  if (/^\/staff\/master-data\/lecturers\/[^/]+$/.test(path)) return 'รายละเอียดอาจารย์'
  if (path.startsWith('/staff/master-data/lecturers')) return 'ข้อมูลอาจารย์'
  return String(route.meta.title ?? 'หน้าหลัก')
})
const unreadNotificationCount = computed(() => scenario.value.role === 'student' && !notificationRead.value ? 1 : 0)
const markNotificationRead = () => {
  if (!unreadNotificationCount.value) return
  notificationRead.value = true
  recordEvent('อ่านการแจ้งเตือน: มีการเผยแพร่ตารางนิเทศ')
}
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
        <nav aria-label="เส้นทางนำทาง">
          <ol class="flex min-w-0 items-center gap-1 truncate text-xs text-muted">
            <li>CWIE BRU</li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" class="truncate">{{ pageTitle }}</li>
          </ol>
        </nav>
        <h1 class="truncate text-base font-bold text-ink sm:text-lg">{{ pageTitle }}</h1>
      </div>

      <DropdownMenuRoot>
        <DropdownMenuTrigger
          class="relative grid size-11 shrink-0 place-items-center rounded-control border border-divider text-muted hover:bg-surface hover:text-ink"
          :aria-label="unreadNotificationCount ? `การแจ้งเตือน มี ${unreadNotificationCount} รายการใหม่` : 'การแจ้งเตือน ไม่มีรายการใหม่'"
        >
          <Bell :size="19" aria-hidden="true" />
          <span v-if="unreadNotificationCount" class="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-semibold leading-none text-white">
            {{ unreadNotificationCount }}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent :side-offset="8" align="end" class="z-50 w-[calc(100vw-2rem)] max-w-sm rounded-panel border border-divider bg-canvas p-2 shadow-xl">
            <DropdownMenuLabel class="px-3 py-2 text-sm font-semibold text-ink">การแจ้งเตือน</DropdownMenuLabel>
            <DropdownMenuItem
              v-if="unreadNotificationCount"
              class="cursor-pointer rounded-control bg-info-soft px-3 py-3 outline-none data-[highlighted]:bg-blue-100"
              @select="markNotificationRead"
            >
              <div>
                <p class="text-sm font-medium text-ink">มีการเผยแพร่ตารางนิเทศ</p>
                <p class="mt-1 text-xs leading-5 text-muted">ตารางนิเทศครั้งถัดไปวันที่ 2 ก.ย. 2569</p>
              </div>
            </DropdownMenuItem>
            <p v-else class="rounded-control bg-surface px-3 py-3 text-sm text-muted">ไม่มีการแจ้งเตือนใหม่</p>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>

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
            <DropdownMenuLabel class="px-3 py-2 outline-none">
              <span class="block text-sm font-semibold text-ink">{{ scenario.userName }}</span>
              <span class="mt-0.5 block text-xs font-normal text-muted">{{ roleLabel }} · ข้อมูลจำลอง</span>
            </DropdownMenuLabel>
            <p class="rounded-control bg-surface px-3 py-2 text-xs leading-5 text-muted">เมนูบัญชีจะเปิดใช้งานใน Checkpoint Authentication</p>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </header>
</template>
