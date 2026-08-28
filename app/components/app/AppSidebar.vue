<script setup lang="ts">
import { Blocks, LayoutDashboard } from '@lucide/vue'

const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()
const navigation = [
  { label: 'ภาพรวมระบบ', to: '/', icon: LayoutDashboard },
  ...(import.meta.dev ? [{ label: 'Design System', to: '/dev/ui', icon: Blocks }] : []),
]
</script>

<template>
  <aside class="flex h-full w-64 flex-col bg-sidebar text-white">
    <div class="flex h-20 items-center border-b border-white/10 px-5">
      <div class="grid size-10 place-items-center rounded-xl bg-primary text-sm font-black tracking-tight text-ink">CB</div>
      <div class="ml-3 min-w-0">
        <p class="font-bold tracking-wide">CWIE BRU</p>
        <p class="truncate text-xs text-white/55">ระบบบริหารสหกิจศึกษา</p>
      </div>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto p-3" aria-label="เมนูหลัก">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors"
        :class="route.path === item.to ? 'bg-primary text-ink' : 'text-white/72 hover:bg-white/8 hover:text-white'"
        :aria-current="route.path === item.to ? 'page' : undefined"
        @click="emit('navigate')"
      >
        <component :is="item.icon" :size="18" aria-hidden="true" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="border-t border-white/10 p-4 text-xs leading-5 text-white/50">
      <p>มหาวิทยาลัยราชภัฏบุรีรัมย์</p>
      <p>UI Prototype · Checkpoint 1</p>
    </div>
  </aside>
</template>
