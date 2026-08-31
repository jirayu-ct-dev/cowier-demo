<script setup lang="ts">
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
  PlusCircle,
  Presentation,
  UsersRound,
} from "@lucide/vue";

const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();
const { scenario } = useScenario();
const { canAccess } = useLecturerPermissions();
const { activeRequest } = useStudentPlacements();
const studentPlacementActionTarget = computed(() =>
  activeRequest.value
    ? `/student/placements/${activeRequest.value.id}`
    : "/student/placements/new",
);
const navigation = computed(() => [
  { label: "หน้าหลัก", to: "/", icon: LayoutDashboard, exact: true },
  { label: "ปฏิทินงาน", to: "/calendar", icon: CalendarDays, exact: true },
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
        {
          label: "การสมัครสหกิจของนักศึกษา",
          to: "/staff/applications",
          icon: BriefcaseBusiness,
          exact: false,
        },
        {
          label: "ข้อมูลสถานประกอบการ",
          to: "/staff/companies",
          icon: Building2,
          exact: false,
        },
        {
          label: "จัดกลุ่มอาจารย์นิเทศ",
          to: "/staff/supervision/groups",
          icon: UsersRound,
          exact: false,
        },
        {
          label: "ตารางนิเทศ",
          to: "/staff/supervision",
          icon: CalendarDays,
          exact: true,
        },
      ]
    : []),
  ...(scenario.value.role === "student" || route.path.startsWith("/student")
    ? [
        {
          label: "ติดตามการสมัครสหกิจ",
          to: "/student/applications",
          icon: BriefcaseBusiness,
          exact: false,
        },
        {
          label: "คำร้องของฉัน",
          to: "/student/placements",
          icon: ClipboardList,
          exact: false,
        },
        {
          label: activeRequest.value
            ? "ข้อมูลที่ฝึกงานปัจจุบัน"
            : "แจ้งข้อมูลที่ฝึกงาน",
          to: studentPlacementActionTarget.value,
          icon: activeRequest.value ? FileCheck2 : PlusCircle,
          exact: true,
        },
        {
          label: "ตารางนิเทศของฉัน",
          to: "/student/supervision",
          icon: CalendarDays,
          exact: false,
        },
      ]
    : []),
  ...(scenario.value.role === "lecturer" || route.path.startsWith("/lecturer")
    ? [
        {
          label: "ตารางนิเทศ",
          to: "/lecturer/supervision",
          icon: CalendarDays,
          exact: false,
        },
        {
          label: "การสมัครสหกิจของนักศึกษา",
          to: "/lecturer/applications",
          icon: BriefcaseBusiness,
          exact: false,
        },
        {
          label: "ข้อมูลนักศึกษา",
          to: "/lecturer/students",
          icon: GraduationCap,
          exact: false,
        },
        {
          label: "ข้อมูลสถานประกอบการ",
          to: "/lecturer/companies",
          icon: Building2,
          exact: false,
        },
        ...(canAccess() ? [{
          label: "ตรวจคำร้องและหนังสือ",
          to: "/lecturer/placements",
          icon: FileCheck2,
          exact: false,
        }] : []),
        {
          label: "ประเมินนิเทศสหกิจ",
          to: "/lecturer/evaluations",
          icon: ClipboardCheck,
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
    if (activeRequest.value && route.path === studentPlacementActionTarget.value)
      return false;
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
    <div class="flex min-h-20 items-center px-3 py-3 sm:px-4">
      <AppBrandLogo class="h-auto w-full max-w-56 object-left" />
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
      <p>UI Prototype · Checkpoint 11</p>
    </div>
  </aside>
</template>
