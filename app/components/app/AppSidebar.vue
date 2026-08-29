<script setup lang="ts">
import {
  Blocks,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  PlusCircle,
  Presentation,
} from "@lucide/vue";

const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();
const { scenario } = useScenario();
const navigation = computed(() => [
  { label: "หน้าหลัก", to: "/", icon: LayoutDashboard, exact: true },
  ...(scenario.value.role === "staff" || route.path.startsWith("/staff")
    ? [
        {
          label: "ข้อมูลนักศึกษา",
          to: "/staff/master-data/students",
          icon: GraduationCap,
          exact: false,
        },
        {
          label: "ข้อมูลอาจารย์",
          to: "/staff/master-data/lecturers",
          icon: Presentation,
          exact: false,
        },
      ]
    : []),
  ...(scenario.value.role === "student" || route.path.startsWith("/student")
    ? [
        {
          label: "คำร้องของฉัน",
          to: "/student/placements",
          icon: ClipboardList,
          exact: false,
        },
        {
          label: "แจ้งข้อมูลที่ฝึกงาน",
          to: "/student/placements/new",
          icon: PlusCircle,
          exact: true,
        },
      ]
    : []),
  ...(scenario.value.role === "lecturer" || route.path.startsWith("/lecturer")
    ? [
        {
          label: "ตรวจคำร้องและหนังสือ",
          to: "/lecturer/placements",
          icon: FileCheck2,
          exact: false,
        },
        {
          label: "ข้อมูลนักศึกษา",
          to: "/lecturer/students",
          icon: GraduationCap,
          exact: false,
        },
      ]
    : []),
  ...(import.meta.dev
    ? [{ label: "Design System", to: "/dev/ui", icon: Blocks, exact: true }]
    : []),
]);

const isActive = (to: string, exact: boolean) => {
  if (exact) return route.path === to;
  if (to === "/student/placements") {
    return (
      route.path === to ||
      (route.path.startsWith(`${to}/`) && route.path !== `${to}/new`)
    );
  }
  return route.path.startsWith(to);
};
</script>

<template>
  <aside class="flex h-full w-64 flex-col bg-sidebar text-white">
    <div class="flex h-20 items-center border-b border-white/10 px-5">
      <div
        class="grid size-10 place-items-center rounded-xl bg-primary text-sm font-black tracking-tight text-ink"
      >
        CB
      </div>
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
        active-class=""
        exact-active-class=""
        class="flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors"
        :class="
          isActive(item.to, item.exact)
            ? 'bg-primary text-ink'
            : 'text-white/72 hover:bg-white/8 hover:text-white'
        "
        :aria-current="isActive(item.to, item.exact) ? 'page' : undefined"
        @click="emit('navigate')"
      >
        <component :is="item.icon" :size="18" aria-hidden="true" />
        <span class="whitespace-pre-line leading-5">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="border-t border-white/10 p-4 text-xs leading-5 text-white/50">
      <p>มหาวิทยาลัยราชภัฏบุรีรัมย์</p>
      <p>UI Prototype · Checkpoint 5B</p>
    </div>
  </aside>
</template>
