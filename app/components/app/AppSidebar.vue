<script setup lang="ts">
import type { Component } from "vue";
import {
  Blocks,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Presentation,
  UsersRound,
} from "@lucide/vue";

withDefaults(defineProps<{ collapsed?: boolean }>(), { collapsed: false });
const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();
const { scenario } = useScenario();
const { canAccess } = useLecturerPermissions();

interface NavigationItem {
  label: string;
  to: string;
  icon: Component;
  exact: boolean;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const navigationGroups = computed<NavigationGroup[]>(() => [
  {
    label: "ภาพรวม",
    items: [
      { label: "ภาพรวมระบบ", to: "/", icon: LayoutDashboard, exact: true },
      { label: "ปฏิทินงาน", to: "/calendar", icon: CalendarDays, exact: true },
    ],
  },
  ...(scenario.value.role === "staff" || route.path.startsWith("/staff")
    ? [
        {
          label: "ข้อมูลและคำร้อง",
          items: [
            { label: "ข้อมูลนักศึกษา", to: "/staff/students", icon: GraduationCap, exact: false },
            { label: "อาจารย์", to: "/staff/lecturers", icon: Presentation, exact: false },
            { label: "สถานประกอบการ", to: "/staff/companies", icon: Building2, exact: false },
            { label: "การสมัครสหกิจ", to: "/staff/applications", icon: BriefcaseBusiness, exact: false },
            { label: "คำร้องและหนังสือ", to: "/staff/requests", icon: FileCheck2, exact: false },
          ],
        },
        {
          label: "การนิเทศ",
          items: [
            { label: "จัดกลุ่มอาจารย์", to: "/staff/supervision/groups", icon: UsersRound, exact: false },
            { label: "ตารางนิเทศ", to: "/staff/supervision", icon: CalendarDays, exact: true },
          ],
        },
      ]
    : []),
  ...(scenario.value.role === "student" || route.path.startsWith("/student")
    ? [
        {
          label: "การฝึกงานของฉัน",
          items: [
            { label: "สมัครและยืนยันที่ฝึกงาน", to: "/student/applications", icon: BriefcaseBusiness, exact: false },
            { label: "คำร้องขอหนังสือ (ระบบเดิม)", to: "/student/placements", icon: ClipboardList, exact: false },
            { label: "ตารางนิเทศ", to: "/student/supervision", icon: CalendarDays, exact: false },
          ],
        },
      ]
    : []),
  ...(scenario.value.role === "lecturer" || route.path.startsWith("/lecturer")
    ? [
        {
          label: "งานที่ต้องดำเนินการ",
          items: [
            ...(canAccess() ? [{ label: "ตรวจคำร้องและผลตอบกลับ", to: "/lecturer/placements", icon: FileCheck2, exact: false }] : []),
            { label: "ตารางนิเทศ", to: "/lecturer/supervision", icon: CalendarDays, exact: false },
            { label: "ประเมินผล", to: "/lecturer/evaluations", icon: ClipboardCheck, exact: false },
          ],
        },
        {
          label: "ข้อมูลประกอบงาน",
          items: [
            { label: "การสมัครสหกิจ", to: "/lecturer/applications", icon: BriefcaseBusiness, exact: false },
            { label: "นักศึกษา", to: "/lecturer/students", icon: GraduationCap, exact: false },
            { label: "สถานประกอบการ", to: "/lecturer/companies", icon: Building2, exact: false },
          ],
        },
      ]
    : []),
  ...(import.meta.dev
    ? [{ label: "สำหรับนักพัฒนา", items: [{ label: "Design System", to: "/dev/ui", icon: Blocks, exact: true }] }]
    : []),
]);

const isActive = (to: string, exact: boolean) => {
  if (exact) return route.path === to;
  return route.path.startsWith(to);
};
</script>

<template>
  <aside class="flex h-full w-full flex-col overflow-hidden bg-sidebar text-white">
    <div class="flex min-h-20 items-center" :class="collapsed ? 'justify-center px-3' : 'px-3 py-3 sm:px-4'">
      <div v-if="collapsed" class="h-10 w-11 overflow-hidden" title="วิทยาการคอมพิวเตอร์ มรภ.บุรีรัมย์">
        <AppBrandLogo class="h-10 w-[226px] max-w-none object-contain object-left" />
      </div>
      <AppBrandLogo v-else class="h-auto w-full max-w-56 object-left" />
    </div>

    <nav class="flex-1 space-y-5 overflow-y-auto" :class="collapsed ? 'px-2 py-3' : 'p-3'" aria-label="เมนูหลัก">
      <section
        v-for="group in navigationGroups"
        :key="group.label"
        :aria-label="collapsed ? group.label : undefined"
        :aria-labelledby="collapsed ? undefined : `nav-${group.label}`"
      >
        <h2 v-if="!collapsed" :id="`nav-${group.label}`" class="mb-1 px-3 text-[11px] font-semibold tracking-wide text-white/45 uppercase">
          {{ group.label }}
        </h2>
        <div v-else class="mx-2 mb-2 border-t border-white/10" aria-hidden="true" />
        <div class="space-y-1">
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
        :to="item.to"
        active-class=""
        exact-active-class=""
        class="flex min-h-11 items-center rounded-control py-2 text-sm font-medium transition-colors"
        :class="[
          collapsed ? 'justify-center px-2' : 'gap-3 px-3',
          isActive(item.to, item.exact)
            ? 'bg-primary text-ink'
            : 'text-white/72 hover:bg-white/8 hover:text-white',
        ]"
        :aria-current="isActive(item.to, item.exact) ? 'page' : undefined"
        :aria-label="collapsed ? item.label : undefined"
        :title="collapsed ? item.label : undefined"
        @click="emit('navigate')"
          >
            <component :is="item.icon" :size="18" aria-hidden="true" />
            <span :class="collapsed ? 'sr-only' : 'leading-5'">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </section>
    </nav>

    <div v-if="!collapsed" class="border-t border-white/10 p-4 text-xs leading-5 text-white/50">
      <p>มหาวิทยาลัยราชภัฏบุรีรัมย์</p>
    </div>
    <div v-else class="border-t border-white/10 px-2 py-4 text-center text-[10px] font-semibold text-white/45">BRU</div>
  </aside>
</template>
