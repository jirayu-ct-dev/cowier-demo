<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Search,
  X,
} from "@lucide/vue";
import { getPageCount, paginateItems } from "~/utils/table";

definePageMeta({ title: "ตรวจคำร้อง", middleware: "staff-prototype" });
useHead({ title: "ตรวจคำร้อง" });

type RequestStatus = "submitted" | "returned" | "approved" | "batched";
type ViewState = "data" | "loading" | "empty" | "error";

interface PlacementRequest {
  id: string;
  studentName: string;
  studentId: string;
  company: string;
  branch: string;
  position: string;
  submittedAt: string;
  status: RequestStatus;
  companyStatus: "active" | "pending";
  recipient: string;
  address: string;
}

const requests = ref<PlacementRequest[]>([
  {
    id: "REQ-018",
    studentName: "กานต์พิชชา สุขใจ",
    studentId: "65011212001",
    company: "บริษัท บุรีรัมย์ดิจิทัล จำกัด",
    branch: "สำนักงานใหญ่",
    position: "Frontend Developer",
    submittedAt: "2026-08-24",
    status: "submitted",
    companyStatus: "active",
    recipient: "ผู้จัดการฝ่ายบุคคล",
    address: "บุรีรัมย์",
  },
  {
    id: "REQ-019",
    studentName: "ธีรภัทร วัฒนะ",
    studentId: "65011212008",
    company: "โรงพยาบาลบุรีรัมย์",
    branch: "สำนักงานใหญ่",
    position: "IT Support",
    submittedAt: "2026-08-23",
    status: "submitted",
    companyStatus: "active",
    recipient: "หัวหน้าฝ่ายทรัพยากรบุคคล",
    address: "บุรีรัมย์",
  },
  {
    id: "REQ-020",
    studentName: "ปวีณ์นุช มั่นคง",
    studentId: "65011212014",
    company: "บริษัท อีสานเทค จำกัด",
    branch: "สาขาขอนแก่น",
    position: "UX/UI Designer",
    submittedAt: "2026-08-22",
    status: "returned",
    companyStatus: "pending",
    recipient: "ผู้จัดการฝ่ายบุคคล",
    address: "ขอนแก่น",
  },
  {
    id: "REQ-021",
    studentName: "ณัฐวุฒิ แสงทอง",
    studentId: "65011212021",
    company: "สำนักงานจังหวัดบุรีรัมย์",
    branch: "ศาลากลางจังหวัด",
    position: "Data Analyst",
    submittedAt: "2026-08-21",
    status: "approved",
    companyStatus: "active",
    recipient: "หัวหน้าสำนักงาน",
    address: "บุรีรัมย์",
  },
]);
const { scenario } = useScenario();
const { showToast } = useToast();
const search = ref("");
const status = ref("all");
const companyStatus = ref("all");
const sortDirection = ref<"asc" | "desc">("desc");
const sortKey = ref<"studentName" | "submittedAt">("submittedAt");
const page = ref(1);
const pageSize = ref("10");
const selectedIds = ref<string[]>([]);
const selected = ref<PlacementRequest | null>(null);
const returnReason = ref("");
const viewState = computed<ViewState>(() =>
  scenario.value.forceError ? "error" : (scenario.value.viewState as ViewState),
);
const statusOptions = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "submitted", label: "รอตรวจสอบ" },
  { value: "returned", label: "ส่งกลับแก้ไข" },
  { value: "approved", label: "ยืนยันแล้ว" },
  { value: "batched", label: "รวมชุดหนังสือแล้ว" },
];
const companyOptions = [
  { value: "all", label: "ทุกสถานประกอบการ" },
  { value: "active", label: "ตรวจสอบแล้ว" },
  { value: "pending", label: "รอตรวจสอบ" },
];
const pageSizeOptions = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];
const statusMeta: Record<
  RequestStatus,
  { label: string; tone: "neutral" | "warning" | "success" | "danger" }
> = {
  submitted: { label: "รอตรวจสอบ", tone: "warning" },
  returned: { label: "ส่งกลับแก้ไข", tone: "danger" },
  approved: { label: "ยืนยันแล้ว", tone: "success" },
  batched: { label: "รวมชุดหนังสือแล้ว", tone: "neutral" },
};
const filtered = computed(() => {
  if (viewState.value === "empty") return [];
  const keyword = search.value.trim().toLocaleLowerCase();
  return requests.value
    .filter(
      (item) =>
        (!keyword ||
          [
            item.id,
            item.studentName,
            item.studentId,
            item.company,
            item.position,
          ].some((value) => value.toLocaleLowerCase().includes(keyword))) &&
        (status.value === "all" || item.status === status.value) &&
        (companyStatus.value === "all" ||
          item.companyStatus === companyStatus.value),
    )
    .sort((a, b) => {
      const comparison =
        sortKey.value === "studentName"
          ? a.studentName.localeCompare(b.studentName, "th")
          : a.submittedAt.localeCompare(b.submittedAt);
      return sortDirection.value === "asc" ? comparison : -comparison;
    });
});
const pageCount = computed(() =>
  getPageCount(filtered.value.length, Number(pageSize.value)),
);
const paginated = computed(() =>
  paginateItems(filtered.value, page.value, Number(pageSize.value)),
);
const hasFilters = computed(
  () =>
    Boolean(search.value) ||
    status.value !== "all" ||
    companyStatus.value !== "all",
);
const selectAllState = computed<boolean | "indeterminate">(() =>
  paginated.value.length > 0 &&
  paginated.value.every((item) => selectedIds.value.includes(item.id))
    ? true
    : paginated.value.some((item) => selectedIds.value.includes(item.id))
      ? "indeterminate"
      : false,
);
const statusLabel = computed(
  () => statusOptions.find((option) => option.value === status.value)?.label,
);
const companyStatusLabel = computed(
  () =>
    companyOptions.find((option) => option.value === companyStatus.value)
      ?.label,
);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00+07:00`));
const reset = () => {
  search.value = "";
  status.value = "all";
  companyStatus.value = "all";
  page.value = 1;
  sortKey.value = "submittedAt";
  sortDirection.value = "desc";
  selectedIds.value = [];
};
const toggleSort = (key: "studentName" | "submittedAt") => {
  if (sortKey.value === key)
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  else {
    sortKey.value = key;
    sortDirection.value = "asc";
  }
  page.value = 1;
};
const toggleRow = (id: string, checked: boolean | "indeterminate") => {
  selectedIds.value =
    checked === true
      ? [...new Set([...selectedIds.value, id])]
      : selectedIds.value.filter((item) => item !== id);
};
const toggleSelectAll = (checked: boolean | "indeterminate") => {
  selectedIds.value =
    checked === true
      ? [
          ...new Set([
            ...selectedIds.value,
            ...paginated.value.map((item) => item.id),
          ]),
        ]
      : selectedIds.value.filter(
          (id) => !paginated.value.some((item) => item.id === id),
        );
};
const approveSelected = () => {
  if (!selectedIds.value.length) return;
  requests.value.forEach((request) => {
    if (selectedIds.value.includes(request.id)) request.status = "approved";
  });
  showToast({
    title: "ยืนยันคำร้องที่เลือกแล้ว",
    description: `ดำเนินการทั้งหมด ${selectedIds.value.length} รายการ`,
  });
  selectedIds.value = [];
};
const retry = () => {
  scenario.value.forceError = false;
  scenario.value.viewState = "data";
};
const review = (request: PlacementRequest) => {
  selected.value = request;
  returnReason.value = "";
};
const approve = () => {
  if (!selected.value) return;
  selected.value.status = "approved";
  showToast({
    title: "ยืนยันคำร้องแล้ว",
    description: `${selected.value.id} พร้อมสำหรับการจัดชุดหนังสือ`,
  });
  selected.value = null;
};
const sendBack = () => {
  if (!selected.value || !returnReason.value.trim()) return;
  selected.value.status = "returned";
  showToast({
    title: "ส่งกลับแก้ไขแล้ว",
    description: `แจ้งเหตุผลให้ ${selected.value.studentName} เรียบร้อย`,
  });
  selected.value = null;
};
watch([search, status, companyStatus, pageSize], () => {
  page.value = 1;
});
watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});
</script>

<template>
  <div>
    <div class="mb-6">
      <p class="text-sm font-medium text-warning">{{ scenario.cycle }}</p>
      <h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        ตรวจคำร้องสถานประกอบการ
      </h2>
      <p class="mt-1 text-sm leading-6 text-muted">
        ตรวจข้อมูลคำร้องและสถานประกอบการก่อนนำไปรวมเป็นชุดหนังสือ
      </p>
    </div>
    <UiCard :padded="false">
      <div class="border-b border-divider p-5 sm:p-6">
        <div
          class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"
        >
          <div>
            <h3 class="text-lg font-bold text-ink">
              คิวคำร้องที่ต้องดำเนินการ
            </h3>
            <p class="mt-1 text-sm leading-6 text-muted">
              ตรวจสอบคำร้องทีละรายการ
              และส่งกลับแก้ไขพร้อมเหตุผลเมื่อข้อมูลไม่ครบถ้วน
            </p>
          </div>
          <div
            v-if="selectedIds.length"
            class="flex flex-wrap items-center justify-end gap-2"
            role="status"
          >
            <span class="mr-1 text-sm font-semibold text-ink">
              เลือกแล้ว {{ selectedIds.length }} รายการ
            </span>
            <UiButton size="sm" @click="approveSelected">
              ยืนยันคำร้องทั้งหมดที่เลือก
            </UiButton>
            <UiButton size="sm" variant="ghost" @click="selectedIds = []">
              ยกเลิกการเลือก
            </UiButton>
          </div>
        </div>
        <div
          class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
        >
          <label
            class="block w-full text-sm font-semibold text-ink sm:max-w-sm lg:w-96 lg:flex-none"
            ><span class="sr-only">ค้นหาคำร้อง</span
            ><span class="relative block"
              ><Search
                :size="18"
                class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                aria-hidden="true" /><input
                v-model="search"
                type="search"
                class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 font-normal placeholder:text-gray-400"
                placeholder="ค้นหารหัส ชื่อ บริษัท หรือตำแหน่ง"
              ></span
          ></label>
          <div
            class="flex flex-wrap items-center justify-end gap-2 lg:ml-auto lg:flex-nowrap"
          >
            <div class="w-full sm:w-48">
              <UiSelect
                v-model="status"
                :options="statusOptions"
                label="กรองตามสถานะ"
                :label-visible="false"
              />
            </div>
            <div class="w-full sm:w-52">
              <UiSelect
                v-model="companyStatus"
                :options="companyOptions"
                label="กรองสถานประกอบการ"
                :label-visible="false"
              />
            </div>
            <button
              type="button"
              class="inline-grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-ink transition-colors hover:bg-surface"
              aria-label="รีเซ็ตตาราง"
              title="รีเซ็ตตาราง"
              @click="reset"
            >
              <RotateCcw :size="18" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div
          v-if="hasFilters"
          class="mt-3 flex flex-wrap items-center gap-2 text-sm"
        >
          <span class="text-muted">ตัวกรองที่ใช้:</span
          ><span
            v-if="search"
            class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink"
            >คำค้น “{{ search }}”</span
          ><span
            v-if="status !== 'all'"
            class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink"
            >{{ statusLabel }}</span
          ><span
            v-if="companyStatus !== 'all'"
            class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink"
            >{{ companyStatusLabel }}</span
          ><button
            type="button"
            class="inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-semibold text-warning hover:bg-warning-soft"
            @click="reset"
          >
            <X :size="15" aria-hidden="true" />ล้างทั้งหมด
          </button>
        </div>
      </div>
      <div
        v-if="viewState === 'loading'"
        class="space-y-3 p-5 sm:p-6"
        aria-label="กำลังโหลดคำร้อง"
      >
        <UiSkeleton v-for="row in 4" :key="row" class="h-14" />
      </div>
      <div v-else-if="viewState === 'error'" class="p-5 sm:p-6">
        <AppErrorState
          title="โหลดคิวคำร้องไม่สำเร็จ"
          description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้ง"
          @retry="retry"
        />
      </div>
      <div v-else-if="!paginated.length" class="p-5 sm:p-6">
        <AppEmptyState
          :title="
            hasFilters
              ? 'ไม่พบคำร้องที่ตรงกับตัวกรอง'
              : 'ยังไม่มีคำร้องรอตรวจสอบ'
          "
          :description="
            hasFilters
              ? 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง'
              : 'เมื่อมีนักศึกษาส่งคำร้อง รายการจะปรากฏที่นี่'
          "
          ><UiButton v-if="hasFilters" variant="secondary" @click="reset"
            >ล้างตัวกรอง</UiButton
          ></AppEmptyState
        >
      </div>
      <template v-else
        ><div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[1000px] border-collapse text-left text-sm">
            <caption class="sr-only">
              คิวตรวจคำร้องสถานประกอบการ
            </caption>
            <thead
              class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase"
            >
              <tr>
                <th scope="col" class="w-14 px-5 py-3 sm:px-6">
                  <UiCheckbox
                    :model-value="selectAllState"
                    label="เลือกทุกรายการในหน้านี้"
                    @update:model-value="toggleSelectAll"
                  />
                </th>
                <th
                  scope="col"
                  class="px-4 py-3"
                  :aria-sort="
                    sortKey === 'studentName'
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  "
                >
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 font-semibold hover:text-ink"
                    @click="toggleSort('studentName')"
                  >
                    นักศึกษา
                    <ArrowUp
                      v-if="
                        sortKey === 'studentName' && sortDirection === 'asc'
                      "
                      :size="15"
                      aria-hidden="true"
                    />
                    <ArrowDown
                      v-else-if="sortKey === 'studentName'"
                      :size="15"
                      aria-hidden="true"
                    />
                    <ArrowUpDown v-else :size="15" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" class="px-4 py-3">
                  สถานประกอบการ / ตำแหน่ง
                </th>
                <th
                  scope="col"
                  class="px-4 py-3"
                  :aria-sort="
                    sortKey === 'submittedAt'
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  "
                >
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 font-semibold hover:text-ink"
                    @click="toggleSort('submittedAt')"
                  >
                    วันที่ยื่น
                    <ArrowUp
                      v-if="
                        sortKey === 'submittedAt' && sortDirection === 'asc'
                      "
                      :size="15"
                      aria-hidden="true"
                    />
                    <ArrowDown
                      v-else-if="sortKey === 'submittedAt'"
                      :size="15"
                      aria-hidden="true"
                    />
                    <ArrowUpDown v-else :size="15" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" class="px-4 py-3">สถานะ</th>
                <th scope="col" class="w-24 px-4 py-3 text-right">
                  การทำงาน
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider">
              <tr
                v-for="request in paginated"
                :key="request.id"
                class="transition-colors hover:bg-surface/70"
                :class="selectedIds.includes(request.id) && 'bg-warning-soft/60'"
              >
                <td class="px-5 py-4 sm:px-6">
                  <UiCheckbox
                    :model-value="selectedIds.includes(request.id)"
                    :label="`เลือกคำร้องของ ${request.studentName}`"
                    @update:model-value="toggleRow(request.id, $event)"
                  />
                </td>
                <td class="px-4 py-4">
                  <p class="font-semibold text-ink">
                    {{ request.studentName }}
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    {{ request.studentId }} · {{ request.id }}
                  </p>
                </td>
                <td class="px-4 py-4">
                  <p class="font-medium text-ink">{{ request.company }}</p>
                  <p class="mt-1 text-xs text-muted">
                    {{ request.branch }} · {{ request.position }}
                  </p>
                </td>
                <td class="whitespace-nowrap px-4 py-4 text-muted">
                  {{ formatDate(request.submittedAt) }}
                </td>
                <td class="px-4 py-4">
                  <UiBadge :tone="statusMeta[request.status].tone">{{
                    statusMeta[request.status].label
                  }}</UiBadge>
                  <p class="mt-1 text-xs text-muted">
                    {{
                      request.companyStatus === "pending"
                        ? "สถานประกอบการรอตรวจสอบ"
                        : "สถานประกอบการตรวจสอบแล้ว"
                    }}
                  </p>
                </td>
                <td class="px-4 py-4 text-right">
                  <button
                    type="button"
                    class="inline-grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
                    :aria-label="`ตรวจคำร้อง ${request.id}`"
                    title="ดูรายละเอียด"
                    @click="review(request)"
                  >
                    <Eye :size="15" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="divide-y divide-divider md:hidden">
          <article
            v-for="request in paginated"
            :key="request.id"
            class="p-5"
            :class="selectedIds.includes(request.id) && 'bg-warning-soft/60'"
          >
            <div class="flex items-start gap-3">
              <UiCheckbox
                :model-value="selectedIds.includes(request.id)"
                :label="`เลือกคำร้องของ ${request.studentName}`"
                @update:model-value="toggleRow(request.id, $event)"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-semibold text-ink">
                      {{ request.studentName }}
                    </p>
                    <p class="mt-1 text-xs text-muted">
                      {{ request.id }} · {{ formatDate(request.submittedAt) }}
                    </p>
                  </div>
                  <UiBadge :tone="statusMeta[request.status].tone">
                    {{ statusMeta[request.status].label }}
                  </UiBadge>
                </div>
                <p class="mt-4 font-medium text-ink">{{ request.company }}</p>
                <p class="mt-1 text-sm text-muted">{{ request.position }}</p>
                <UiButton
                  size="sm"
                  variant="secondary"
                  class="mt-4"
                  :icon="Eye"
                  @click="review(request)"
                >
                  ตรวจคำร้อง
                </UiButton>
              </div>
            </div>
          </article>
        </div>
        <div
          class="flex flex-col gap-3 border-t border-divider px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div class="flex items-center gap-3">
            <p class="whitespace-nowrap text-muted">
              แสดง {{ (page - 1) * Number(pageSize) + 1 }}–{{
                Math.min(page * Number(pageSize), filtered.length)
              }}
              จาก {{ filtered.length }} รายการ
            </p>
            <div class="w-20 shrink-0">
              <UiSelect
                v-model="pageSize"
                :options="pageSizeOptions"
                label="จำนวนรายการต่อหน้า"
                :label-visible="false"
              />
            </div>
          </div>
          <nav class="flex items-center gap-2" aria-label="การแบ่งหน้าตาราง">
            <button
              type="button"
              class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted disabled:opacity-45"
              :disabled="page === 1"
              aria-label="หน้าก่อนหน้า"
              @click="page--"
            >
              <ChevronLeft :size="18" /></button
            ><span class="min-w-16 text-center font-semibold text-ink"
              >{{ page }} / {{ pageCount }}</span
            ><button
              type="button"
              class="inline-grid size-10 place-items-center rounded-control border border-divider text-muted disabled:opacity-45"
              :disabled="page === pageCount"
              aria-label="หน้าถัดไป"
              @click="page++"
            >
              <ChevronRight :size="18" />
            </button>
          </nav></div
      ></template>
    </UiCard>
    <UiDialog
      v-if="selected"
      :open="Boolean(selected)"
      title="ตรวจรายละเอียดคำร้อง"
      :description="`${selected.id} · ${selected.studentName}`"
      @update:open="(value) => !value && (selected = null)"
      ><div class="space-y-4">
        <div
          class="grid gap-3 rounded-control bg-surface p-4 text-sm sm:grid-cols-2"
        >
          <div>
            <p class="text-xs text-muted">สถานประกอบการ</p>
            <p class="mt-1 font-semibold text-ink">{{ selected.company }}</p>
            <p class="text-muted">{{ selected.branch }}</p>
          </div>
          <div>
            <p class="text-xs text-muted">ตำแหน่ง</p>
            <p class="mt-1 font-semibold text-ink">{{ selected.position }}</p>
          </div>
          <div>
            <p class="text-xs text-muted">ผู้รับหนังสือ</p>
            <p class="mt-1 font-medium text-ink">{{ selected.recipient }}</p>
          </div>
          <div>
            <p class="text-xs text-muted">ที่อยู่หนังสือ</p>
            <p class="mt-1 font-medium text-ink">{{ selected.address }}</p>
          </div>
        </div>
        <UiAlert
          v-if="selected.companyStatus === 'pending'"
          tone="warning"
          title="สถานประกอบการรอตรวจสอบ"
          >สามารถรับคำร้องไว้ตรวจสอบได้
          แต่ควรตรวจข้อมูลสถานประกอบการก่อนยืนยัน</UiAlert
        ><label class="block text-sm font-semibold text-ink"
          >เหตุผลส่งกลับแก้ไข<textarea
            v-model="returnReason"
            rows="3"
            class="mt-1.5 w-full rounded-control border border-divider bg-canvas p-3 font-normal"
            placeholder="ระบุเมื่อจำเป็นต้องให้นักศึกษาแก้ไข"
          />
        </label>
      </div>
      <template #cancel
        ><UiButton variant="ghost" @click="selected = null"
          >ปิด</UiButton
        ></template
      ><template #confirm
        ><div class="flex gap-2">
          <UiButton
            variant="secondary"
            :disabled="!returnReason.trim()"
            @click="sendBack"
            >ส่งกลับแก้ไข</UiButton
          ><UiButton :icon="Check" @click="approve">ยืนยันคำร้อง</UiButton>
        </div></template
      ></UiDialog
    >
  </div>
</template>
