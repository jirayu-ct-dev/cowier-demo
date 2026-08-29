<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck2,
  FileText,
  RotateCcw,
  Search,
  Upload,
  X,
} from "@lucide/vue";
import { z } from "zod";
import type {
  LetterBatch,
  PlacementReviewRequest,
} from "~/composables/useLetterBatches";
import { getPageCount, paginateItems } from "~/utils/table";

definePageMeta({ title: "ตรวจคำร้อง", middleware: "lecturer-prototype" });
useHead({ title: "ตรวจคำร้องและหนังสือ" });

type ViewState = "data" | "loading" | "empty" | "error";
type SortKey = "studentName" | "submittedAt";
type FormErrorKey = "requestIds" | "letterNumber" | "letterDate" | "fileName";

interface LetterForm {
  requestIds: string[];
  coordinatorId: string;
  letterNumber: string;
  letterDate: string;
  fileName: string;
  fileSize: number;
}

const draftSchema = z.object({
  requestIds: z.array(z.string()).min(1, "เลือกคำร้องอย่างน้อย 1 รายการ"),
});
const publishSchema = draftSchema.extend({
  letterNumber: z.string().trim().min(1, "กรอกเลขที่หนังสือ"),
  letterDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "เลือกวันที่ออกหนังสือ"),
  fileName: z
    .string()
    .trim()
    .regex(/\.pdf$/i, "รองรับเฉพาะไฟล์ PDF"),
  fileSize: z
    .number()
    .positive("เลือกไฟล์ PDF")
    .max(10 * 1024 * 1024, "ไฟล์ต้องมีขนาดไม่เกิน 10 MB"),
});

const { scenario, recordEvent } = useScenario();
const { showToast } = useToast();
const {
  requests,
  getBatch,
  getBatchRequests,
  getCompatibleRequests,
  returnRequest,
  saveLetterBatch,
  publishLetterBatch,
  returnResponseDocument,
  confirmBatchResults,
} = useLetterBatches();

const search = ref("");
const status = ref("all");
const companyStatus = ref("all");
const sortKey = ref<SortKey>("submittedAt");
const sortDirection = ref<"asc" | "desc">("desc");
const page = ref(1);
const pageSize = ref("10");
const selectedIds = ref<string[]>([]);
const selectedRequest = ref<PlacementReviewRequest | null>(null);
const returnReason = ref("");
const responseReason = ref("");
const resultChoices = ref<Record<string, string>>({});
const resultError = ref("");
const letterOpen = ref(false);
const letterBatchId = ref<string | null>(null);
const letterRequests = ref<PlacementReviewRequest[]>([]);
const letterErrors = ref<Partial<Record<FormErrorKey, string>>>({});
const isSubmitting = ref(false);
const letterForm = reactive<LetterForm>({
  requestIds: [],
  coordinatorId: "none",
  letterNumber: "",
  letterDate: "",
  fileName: "",
  fileSize: 0,
});

const viewState = computed<ViewState>(() =>
  scenario.value.forceError ? "error" : (scenario.value.viewState as ViewState),
);
const statusOptions = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "submitted", label: "รอตรวจคำร้อง" },
  { value: "returned", label: "ส่งกลับแก้ไข" },
  { value: "letter_draft", label: "กำลังจัดทำหนังสือ" },
  { value: "waiting_response", label: "รอเอกสารตอบกลับ" },
  { value: "response_uploaded", label: "รอตรวจผล" },
  { value: "confirmed", label: "ยืนยันสถานประกอบการ" },
  { value: "not_accepted", label: "ไม่ได้รับการตอบรับ" },
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
];
const resultOptions = [
  { value: "confirmed", label: "ยืนยันสถานประกอบการ" },
  { value: "not_accepted", label: "ไม่ได้รับการตอบรับ" },
];
const statusMeta = {
  submitted: { label: "รอตรวจคำร้อง", tone: "warning" },
  returned: { label: "ส่งกลับแก้ไข", tone: "danger" },
  letter_draft: { label: "กำลังจัดทำหนังสือ", tone: "neutral" },
  waiting_response: { label: "รอเอกสารตอบกลับ", tone: "warning" },
  response_uploaded: { label: "รอตรวจผล", tone: "info" },
  confirmed: { label: "ยืนยันสถานประกอบการ", tone: "success" },
  not_accepted: { label: "ไม่ได้รับการตอบรับ", tone: "danger" },
  cancelled: { label: "ยกเลิก", tone: "neutral" },
} as const;

const filtered = computed(() => {
  if (viewState.value === "empty") return [];
  const keyword = search.value.trim().toLocaleLowerCase();
  return requests.value
    .filter(
      (request) =>
        (!keyword ||
          [
            request.id,
            request.studentName,
            request.studentId,
            request.company,
            request.position,
          ].some((value) => value.toLocaleLowerCase().includes(keyword))) &&
        (status.value === "all" || request.status === status.value) &&
        (companyStatus.value === "all" ||
          request.companyStatus === companyStatus.value),
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
const selectableOnPage = computed(() =>
  paginated.value.filter((request) => request.status === "submitted"),
);
const selectAllState = computed<boolean | "indeterminate">(() =>
  selectableOnPage.value.length > 0 &&
  selectableOnPage.value.every((request) =>
    selectedIds.value.includes(request.id),
  )
    ? true
    : selectableOnPage.value.some((request) =>
          selectedIds.value.includes(request.id),
        )
      ? "indeterminate"
      : false,
);
const selectedRequests = computed(() =>
  requests.value.filter((request) => selectedIds.value.includes(request.id)),
);
const selectionCompatible = computed(() => {
  if (!selectedRequests.value.length) return false;
  const first = selectedRequests.value[0]!;
  return selectedRequests.value.every(
    (request) =>
      request.status === "submitted" &&
      request.company === first.company &&
      request.branch === first.branch &&
      request.recipientName === first.recipientName &&
      request.recipientRole === first.recipientRole &&
      request.letterAddress === first.letterAddress,
  );
});
const hasFilters = computed(
  () =>
    Boolean(search.value) ||
    status.value !== "all" ||
    companyStatus.value !== "all",
);
const selectedBatch = computed(() =>
  getBatch(selectedRequest.value?.batchId ?? null),
);
const batchRequests = computed(() =>
  selectedBatch.value ? getBatchRequests(selectedBatch.value.id) : [],
);
const activeOutgoing = computed(() =>
  selectedBatch.value
    ? [...selectedBatch.value.outgoingDocuments]
        .reverse()
        .find((document) => document.status === "active")
    : undefined,
);
const activeResponse = computed(() =>
  selectedBatch.value
    ? [...selectedBatch.value.responseDocuments]
        .reverse()
        .find((document) => document.status === "active")
    : undefined,
);
const coordinatorOptions = computed(() => [
  { value: "none", label: "ไม่ระบุผู้ประสานงาน" },
  ...letterRequests.value
    .filter((request) => letterForm.requestIds.includes(request.id))
    .map((request) => ({
      value: request.studentId,
      label: `${request.studentName} (${request.studentId})`,
    })),
]);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value.includes("T") ? value : `${value}T00:00:00+07:00`));
const resetFilters = () => {
  search.value = "";
  status.value = "all";
  companyStatus.value = "all";
  sortKey.value = "submittedAt";
  sortDirection.value = "desc";
  page.value = 1;
  selectedIds.value = [];
};
const retry = () => {
  scenario.value.forceError = false;
  scenario.value.viewState = "data";
};
const toggleSort = (key: SortKey) => {
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
            ...selectableOnPage.value.map((request) => request.id),
          ]),
        ]
      : selectedIds.value.filter(
          (id) => !selectableOnPage.value.some((request) => request.id === id),
        );
};

const review = (request: PlacementReviewRequest) => {
  selectedRequest.value = request;
  returnReason.value = "";
  responseReason.value = "";
  resultError.value = "";
  const batch = getBatch(request.batchId);
  resultChoices.value = batch
    ? Object.fromEntries(
        getBatchRequests(batch.id).map((item) => {
          const result = batch.results[item.id];
          return [item.id, !result || result === "waiting" ? "" : result];
        }),
      ) as Record<string, string>
    : {};
};
const closeReview = () => {
  selectedRequest.value = null;
};
const sendBackRequest = () => {
  if (!selectedRequest.value || !returnReason.value.trim()) return;
  try {
    returnRequest(selectedRequest.value.id, returnReason.value.trim());
    showToast({
      title: "ส่งคำร้องกลับแก้ไขแล้ว",
      description: selectedRequest.value.studentName,
    });
    recordEvent(`ส่งคำร้องกลับแก้ไข: ${selectedRequest.value.id}`);
    closeReview();
  } catch (error) {
    showToast({
      title: "ดำเนินการไม่สำเร็จ",
      description: error instanceof Error ? error.message : "กรุณาลองใหม่",
    });
  }
};

const resetLetterForm = () => {
  Object.assign(letterForm, {
    requestIds: [],
    coordinatorId: "none",
    letterNumber: "",
    letterDate: "",
    fileName: "",
    fileSize: 0,
  });
  letterErrors.value = {};
  letterRequests.value = [];
  letterBatchId.value = null;
};
const openLetter = (
  candidates: PlacementReviewRequest[],
  batch: LetterBatch | null = null,
) => {
  resetLetterForm();
  letterRequests.value = candidates;
  letterForm.requestIds = candidates.map((request) => request.id);
  if (batch) {
    letterBatchId.value = batch.id;
    letterForm.coordinatorId = batch.coordinatorId ?? "none";
    letterForm.letterNumber = batch.letterNumber;
    letterForm.letterDate = batch.letterDate;
  }
  letterOpen.value = true;
  closeReview();
};
const openLetterFromReview = () => {
  if (selectedRequest.value)
    openLetter(getCompatibleRequests(selectedRequest.value.id));
};
const openLetterFromSelection = () => {
  if (selectionCompatible.value) openLetter(selectedRequests.value);
};
const toggleLetterRequest = (
  id: string,
  checked: boolean | "indeterminate",
) => {
  if (letterBatchId.value) return;
  letterForm.requestIds =
    checked === true
      ? [...new Set([...letterForm.requestIds, id])]
      : letterForm.requestIds.filter((item) => item !== id);
  if (
    !coordinatorOptions.value.some(
      (option) => option.value === letterForm.coordinatorId,
    )
  )
    letterForm.coordinatorId = "none";
  letterErrors.value.requestIds = undefined;
};
const handleFile = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  letterForm.fileName = file?.name ?? "";
  letterForm.fileSize = file?.size ?? 0;
  letterErrors.value.fileName = undefined;
};
const setLetterValidation = (issues: z.core.$ZodIssue[]) => {
  const next: Partial<Record<FormErrorKey, string>> = {};
  issues.forEach((issue) => {
    const key = String(issue.path[0]);
    if (key === "fileSize") next.fileName ??= issue.message;
    else if (
      key === "requestIds" ||
      key === "letterNumber" ||
      key === "letterDate" ||
      key === "fileName"
    )
      next[key] ??= issue.message;
  });
  letterErrors.value = next;
};
const waitForMockNetwork = async () => {
  if (scenario.value.networkDelay === "slow")
    await new Promise((resolve) => setTimeout(resolve, 500));
};
const submitLetter = async (publish: boolean) => {
  const result = (publish ? publishSchema : draftSchema).safeParse(letterForm);
  if (!result.success) {
    setLetterValidation(result.error.issues);
    return;
  }
  isSubmitting.value = true;
  try {
    await waitForMockNetwork();
    const coordinatorId =
      letterForm.coordinatorId === "none" ? null : letterForm.coordinatorId;
    const batch = letterBatchId.value
      ? publishLetterBatch(letterBatchId.value, {
          coordinatorId,
          letterNumber: letterForm.letterNumber.trim(),
          letterDate: letterForm.letterDate,
          fileName: letterForm.fileName,
        })
      : saveLetterBatch({
          requestIds: letterForm.requestIds,
          coordinatorId,
          publish,
          letterNumber: letterForm.letterNumber.trim() || undefined,
          letterDate: letterForm.letterDate || undefined,
          fileName: letterForm.fileName || undefined,
        });
    const title = publish
      ? "เผยแพร่หนังสือและยืนยันคำร้องแล้ว"
      : "บันทึกชุดหนังสือฉบับร่างแล้ว";
    showToast({
      title,
      description: `${batch.id} · ${batch.requestIds.length} คำร้อง`,
    });
    recordEvent(`${title}: ${batch.id}`);
    selectedIds.value = [];
    letterOpen.value = false;
    resetLetterForm();
  } catch (error) {
    showToast({
      title: "ดำเนินการไม่สำเร็จ",
      description: error instanceof Error ? error.message : "กรุณาลองใหม่",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const sendBackResponse = () => {
  if (!selectedBatch.value || !responseReason.value.trim()) return;
  try {
    returnResponseDocument(selectedBatch.value.id, responseReason.value.trim());
    showToast({
      title: "ส่งเอกสารตอบกลับให้แก้ไขแล้ว",
      description: selectedBatch.value.id,
    });
    recordEvent(`ส่งเอกสารตอบกลับให้แก้ไข: ${selectedBatch.value.id}`);
    closeReview();
  } catch (error) {
    showToast({
      title: "ดำเนินการไม่สำเร็จ",
      description: error instanceof Error ? error.message : "กรุณาลองใหม่",
    });
  }
};
const confirmResults = () => {
  if (!selectedBatch.value) return;
  const missing = batchRequests.value.some(
    (request) => !resultChoices.value[request.id],
  );
  if (missing) {
    resultError.value = "เลือกผลตอบรับของนักศึกษาทุกคน";
    return;
  }
  try {
    confirmBatchResults(
      selectedBatch.value.id,
      resultChoices.value as Record<string, "confirmed" | "not_accepted">,
    );
    showToast({
      title: "ยืนยันผลรายบุคคลแล้ว",
      description: selectedBatch.value.id,
    });
    recordEvent(`ยืนยันผลคำร้อง: ${selectedBatch.value.id}`);
    closeReview();
  } catch (error) {
    showToast({
      title: "ดำเนินการไม่สำเร็จ",
      description: error instanceof Error ? error.message : "กรุณาลองใหม่",
    });
  }
};

watch([search, status, companyStatus, pageSize], () => {
  page.value = 1;
  selectedIds.value = [];
});
watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});
</script>

<template>
  <div>
    <header class="mb-6">
      <p class="text-sm font-medium text-warning">{{ scenario.cycle }}</p>
      <h2 class="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        ตรวจคำร้องและหนังสือ
      </h2>
      <p class="mt-1 text-sm leading-6 text-muted">
        ตรวจคำร้อง จัดชุด ออกหนังสือ และตรวจเอกสารตอบกลับจากหน้าเดียว
      </p>
    </header>

    <UiCard :padded="false">
      <div class="border-b border-divider p-5 sm:p-6">
        <div
          class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"
        >
          <div>
            <h3 class="text-lg font-bold text-ink">
              รายการคำร้องสถานประกอบการ
            </h3>
            <p class="mt-1 text-sm leading-6 text-muted">
              การเผยแพร่ PDF หนังสือขอฝึกงานถือเป็นการยืนยันคำร้อง
            </p>
          </div>
          <div
            v-if="selectedIds.length"
            class="flex flex-wrap items-center justify-end gap-2"
            role="status"
          >
            <span class="text-sm font-semibold text-ink"
              >เลือกแล้ว {{ selectedIds.length }} รายการ</span
            >
            <UiButton
              size="sm"
              :disabled="!selectionCompatible"
              @click="openLetterFromSelection"
              >จัดชุดและยืนยันคำร้อง</UiButton
            >
            <UiButton size="sm" variant="ghost" @click="selectedIds = []"
              >ยกเลิกการเลือก</UiButton
            >
            <p
              v-if="!selectionCompatible"
              class="w-full text-right text-xs text-danger"
            >
              เลือกได้เฉพาะคำร้องที่บริษัท ผู้รับ และที่อยู่หนังสือตรงกัน
            </p>
          </div>
        </div>
        <div
          class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
        >
          <label class="block w-full sm:max-w-sm lg:w-96 lg:flex-none"
            ><span class="sr-only">ค้นหาคำร้อง</span
            ><span class="relative block"
              ><Search
                :size="18"
                class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                aria-hidden="true" /><input
                v-model="search"
                type="search"
                class="min-h-11 w-full rounded-control border border-divider bg-canvas pr-3 pl-10 text-sm placeholder:text-gray-400"
                placeholder="ค้นหารหัส ชื่อ บริษัท หรือตำแหน่ง" ></span
          ></label>
          <div
            class="flex flex-wrap items-center justify-end gap-2 lg:ml-auto lg:flex-nowrap"
          >
            <div class="w-full sm:w-52">
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
              class="inline-grid size-11 shrink-0 place-items-center rounded-control border border-divider bg-canvas text-ink hover:bg-surface"
              aria-label="รีเซ็ตตาราง"
              title="รีเซ็ตตาราง"
              @click="resetFilters"
            >
              <RotateCcw :size="18" />
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
            >{{
              statusOptions.find((option) => option.value === status)?.label
            }}</span
          ><span
            v-if="companyStatus !== 'all'"
            class="inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-ink"
            >{{
              companyOptions.find((option) => option.value === companyStatus)
                ?.label
            }}</span
          ><button
            type="button"
            class="inline-flex min-h-8 items-center gap-1 rounded-control px-2 font-semibold text-warning hover:bg-warning-soft"
            @click="resetFilters"
          >
            <X :size="15" />ล้างทั้งหมด
          </button>
        </div>
      </div>

      <div
        v-if="viewState === 'loading'"
        class="space-y-3 p-5 sm:p-6"
        aria-label="กำลังโหลดคำร้อง"
      >
        <UiSkeleton v-for="row in 5" :key="row" class="h-14" />
      </div>
      <div v-else-if="viewState === 'error'" class="p-5 sm:p-6">
        <AppErrorState
          title="โหลดรายการคำร้องไม่สำเร็จ"
          description="เกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้ง"
          @retry="retry"
        />
      </div>
      <div v-else-if="!paginated.length" class="p-5 sm:p-6">
        <AppEmptyState
          :title="hasFilters ? 'ไม่พบคำร้องที่ตรงกับตัวกรอง' : 'ยังไม่มีคำร้อง'"
          :description="
            hasFilters
              ? 'ลองเปลี่ยนคำค้นหรือล้างตัวกรอง'
              : 'เมื่อมีนักศึกษาส่งคำร้อง รายการจะปรากฏที่นี่'
          "
          ><UiButton v-if="hasFilters" variant="secondary" @click="resetFilters"
            >ล้างตัวกรอง</UiButton
          ></AppEmptyState
        >
      </div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table
            class="w-full min-w-[1040px] border-collapse text-left text-sm"
          >
            <caption class="sr-only">
              รายการตรวจคำร้องและหนังสือขอฝึกงาน
            </caption>
            <thead
              class="bg-surface text-xs font-semibold tracking-wide text-muted uppercase"
            >
              <tr>
                <th scope="col" class="w-14 px-5 py-3 sm:px-6">
                  <UiCheckbox
                    :model-value="selectAllState"
                    label="เลือกคำร้องรอตรวจทั้งหมดในหน้านี้"
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
                    /><ArrowDown
                      v-else-if="sortKey === 'studentName'"
                      :size="15"
                    /><ArrowUpDown v-else :size="15" />
                  </button>
                </th>
                <th scope="col" class="px-4 py-3">สถานประกอบการ / ตำแหน่ง</th>
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
                    /><ArrowDown
                      v-else-if="sortKey === 'submittedAt'"
                      :size="15"
                    /><ArrowUpDown v-else :size="15" />
                  </button>
                </th>
                <th scope="col" class="px-4 py-3">สถานะ</th>
                <th scope="col" class="w-24 px-4 py-3 text-right">การทำงาน</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-divider">
              <tr
                v-for="request in paginated"
                :key="request.id"
                class="transition-colors hover:bg-surface/70"
                :class="
                  selectedIds.includes(request.id) && 'bg-warning-soft/60'
                "
              >
                <td class="px-5 py-4 sm:px-6">
                  <UiCheckbox
                    v-if="request.status === 'submitted'"
                    :model-value="selectedIds.includes(request.id)"
                    :label="`เลือกคำร้องของ ${request.studentName}`"
                    @update:model-value="toggleRow(request.id, $event)"
                  /><span v-else class="block size-5" />
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
                  <p v-if="request.batchId" class="mt-1 text-xs text-muted">
                    {{ request.batchId }}
                  </p>
                </td>
                <td class="px-4 py-4 text-right">
                  <button
                    type="button"
                    class="inline-grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink"
                    :aria-label="`ดูรายละเอียด ${request.id}`"
                    title="ดูรายละเอียด"
                    @click="review(request)"
                  >
                    <Eye :size="15" />
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
                v-if="request.status === 'submitted'"
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
                  <UiBadge :tone="statusMeta[request.status].tone">{{
                    statusMeta[request.status].label
                  }}</UiBadge>
                </div>
                <p class="mt-4 font-medium text-ink">{{ request.company }}</p>
                <p class="mt-1 text-sm text-muted">{{ request.position }}</p>
                <UiButton
                  size="sm"
                  variant="secondary"
                  class="mt-4"
                  :icon="Eye"
                  @click="review(request)"
                  >ดูรายละเอียด</UiButton
                >
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
          </nav>
        </div>
      </template>
    </UiCard>

    <UiDialog
      v-if="selectedRequest"
      :open="Boolean(selectedRequest)"
      :close-on-confirm="false"
      title="รายละเอียดคำร้อง"
      :description="`${selectedRequest.id} · ${selectedRequest.studentName}`"
      @update:open="(value) => !value && closeReview()"
    >
      <div class="space-y-4">
        <section class="rounded-control bg-surface p-4 text-sm">
          <div class="flex items-start justify-between gap-3">
            <h4 class="font-semibold text-ink">ข้อมูลสถานประกอบการ</h4>
            <UiBadge :tone="statusMeta[selectedRequest.status].tone">{{
              statusMeta[selectedRequest.status].label
            }}</UiBadge>
          </div>
          <dl class="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt class="text-xs text-muted">สถานประกอบการ</dt>
              <dd class="mt-1 font-semibold text-ink">
                {{ selectedRequest.company }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted">สาขา</dt>
              <dd class="mt-1 text-ink">{{ selectedRequest.branch }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs text-muted">ที่อยู่</dt>
              <dd class="mt-1 leading-6 text-ink">
                {{ selectedRequest.companyAddress }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted">ตำแหน่งฝึกงาน</dt>
              <dd class="mt-1 text-ink">{{ selectedRequest.position }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted">วันที่ยื่น</dt>
              <dd class="mt-1 text-ink">
                {{ formatDate(selectedRequest.submittedAt) }}
              </dd>
            </div>
          </dl>
        </section>
        <section class="rounded-control border border-divider p-4 text-sm">
          <h4 class="font-semibold text-ink">ข้อมูลสำหรับออกหนังสือ</h4>
          <dl class="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt class="text-xs text-muted">เรียน / ผู้รับหนังสือ</dt>
              <dd class="mt-1 text-ink">{{ selectedRequest.recipientName }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted">ตำแหน่งหรือหน่วยงาน</dt>
              <dd class="mt-1 text-ink">{{ selectedRequest.recipientRole }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs text-muted">ที่อยู่สำหรับออกหนังสือ</dt>
              <dd class="mt-1 leading-6 text-ink">
                {{ selectedRequest.letterAddress }}
              </dd>
            </div>
          </dl>
        </section>
        <UiAlert
          v-if="
            selectedRequest.status === 'submitted' &&
            getCompatibleRequests(selectedRequest.id).length > 1
          "
          tone="info"
          title="พบคำร้องที่จัดชุดร่วมกันได้"
          >มีทั้งหมด
          {{ getCompatibleRequests(selectedRequest.id).length }} คำร้อง
          ระบบจะเลือกไว้ให้ในขั้นตอนจัดชุด</UiAlert
        >
        <UiTextarea
          v-if="selectedRequest.status === 'submitted'"
          v-model="returnReason"
          label="เหตุผลส่งกลับแก้ไข"
          placeholder="ระบุเมื่อข้อมูลคำร้องไม่ถูกต้อง"
        />
        <UiAlert
          v-if="selectedRequest.status === 'returned'"
          tone="warning"
          title="เหตุผลที่ส่งกลับ"
          >{{ selectedRequest.returnReason }}</UiAlert
        >

        <section
          v-if="selectedBatch"
          class="rounded-control border border-divider p-4 text-sm"
        >
          <h4 class="font-semibold text-ink">
            หนังสือขอฝึกงาน · {{ selectedBatch.id }}
          </h4>
          <dl class="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt class="text-xs text-muted">เลขที่หนังสือ</dt>
              <dd class="mt-1 text-ink">
                {{ selectedBatch.letterNumber || "ยังไม่ระบุ" }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted">วันที่หนังสือ</dt>
              <dd class="mt-1 text-ink">
                {{
                  selectedBatch.letterDate
                    ? formatDate(selectedBatch.letterDate)
                    : "ยังไม่ระบุ"
                }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs text-muted">ไฟล์ที่เผยแพร่</dt>
              <dd class="mt-1 flex items-center gap-2 text-ink">
                <FileText :size="17" class="text-muted" />{{
                  activeOutgoing?.fileName || "ยังไม่ได้แนบไฟล์"
                }}
              </dd>
            </div>
          </dl>
          <div class="mt-4 border-t border-divider pt-4">
            <p class="text-xs font-semibold text-muted">สมาชิกในชุด</p>
            <ul class="mt-2 space-y-1 text-ink">
              <li v-for="request in batchRequests" :key="request.id">
                {{ request.studentName }} · {{ request.position }}
              </li>
            </ul>
          </div>
        </section>

        <section
          v-if="selectedRequest.status === 'response_uploaded' && selectedBatch"
          class="rounded-control bg-info-soft p-4 text-sm"
        >
          <h4 class="font-semibold text-info">
            หนังสือตอบกลับจากสถานประกอบการ
          </h4>
          <p class="mt-2 flex items-center gap-2 text-ink">
            <FileCheck2 :size="18" class="text-info" />{{
              activeResponse?.fileName
            }}
          </p>
          <p class="mt-1 text-xs text-muted">
            อัปโหลดโดย {{ activeResponse?.uploadedBy }} ·
            {{ activeResponse ? formatDate(activeResponse.uploadedAt) : "" }}
          </p>
        </section>
        <section
          v-if="selectedRequest.status === 'response_uploaded' && selectedBatch"
        >
          <h4 class="text-sm font-semibold text-ink">ผลตอบรับรายบุคคล</h4>
          <div class="mt-2 space-y-3 rounded-control border border-divider p-4">
            <div
              v-for="request in batchRequests"
              :key="request.id"
              class="grid gap-2 sm:grid-cols-[1fr_13rem] sm:items-center"
            >
              <div>
                <p class="text-sm font-semibold text-ink">
                  {{ request.studentName }}
                </p>
                <p class="text-xs text-muted">{{ request.position }}</p>
              </div>
              <UiSelect
                :model-value="resultChoices[request.id] ?? ''"
                :options="resultOptions"
                :label="`ผลตอบรับของ ${request.studentName}`"
                :label-visible="false"
                placeholder="เลือกผลตอบรับ"
                @update:model-value="resultChoices[request.id] = $event"
              />
            </div>
          </div>
          <p v-if="resultError" class="mt-1.5 text-xs font-medium text-danger">
            {{ resultError }}
          </p>
          <UiTextarea
            v-model="responseReason"
            label="เหตุผลส่งเอกสารกลับแก้ไข"
            placeholder="ระบุเมื่อ PDF ตอบกลับไม่ถูกต้อง"
          />
        </section>
      </div>
      <template #cancel
        ><UiButton variant="ghost" @click="closeReview">ปิด</UiButton></template
      >
      <template #confirm
        ><div class="flex flex-wrap gap-2">
          <UiButton
            v-if="selectedRequest.status === 'submitted'"
            variant="secondary"
            :disabled="!returnReason.trim()"
            @click="sendBackRequest"
            >ส่งกลับแก้ไข</UiButton
          ><UiButton
            v-if="selectedRequest.status === 'submitted'"
            :icon="FileCheck2"
            @click="openLetterFromReview"
            >จัดชุดและยืนยันคำร้อง</UiButton
          ><UiButton
            v-if="selectedRequest.status === 'letter_draft' && selectedBatch"
            :icon="Upload"
            @click="openLetter(batchRequests, selectedBatch)"
            >แนบและเผยแพร่ PDF</UiButton
          ><UiButton
            v-if="selectedRequest.status === 'response_uploaded'"
            variant="secondary"
            :disabled="!responseReason.trim()"
            @click="sendBackResponse"
            >ส่งเอกสารกลับแก้ไข</UiButton
          ><UiButton
            v-if="selectedRequest.status === 'response_uploaded'"
            :icon="Check"
            @click="confirmResults"
            >ยืนยันผลรายบุคคล</UiButton
          >
        </div></template
      >
    </UiDialog>

    <UiDialog
      :open="letterOpen"
      :close-on-confirm="false"
      :title="letterBatchId ? 'แนบและเผยแพร่หนังสือ' : 'จัดชุดและยืนยันคำร้อง'"
      description="เมื่อเผยแพร่ PDF แล้ว คำร้องทั้งหมดในชุดจะถือว่าได้รับการยืนยันจากอาจารย์"
      @update:open="
        (value) => {
          letterOpen = value;
          if (!value) resetLetterForm();
        }
      "
    >
      <div class="space-y-5">
        <section>
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-sm font-semibold text-ink">รายชื่อนักศึกษา</h4>
            <span class="text-xs text-muted"
              >{{ letterForm.requestIds.length }} คน</span
            >
          </div>
          <div
            class="mt-2 divide-y divide-divider rounded-control border border-divider"
          >
            <label
              v-for="request in letterRequests"
              :key="request.id"
              class="flex items-start gap-3 p-3"
              :class="!letterBatchId && 'cursor-pointer'"
              ><UiCheckbox
                :model-value="letterForm.requestIds.includes(request.id)"
                :disabled="Boolean(letterBatchId)"
                :label="`เลือก ${request.studentName}`"
                @update:model-value="toggleLetterRequest(request.id, $event)"
              /><span
                ><span class="block text-sm font-semibold text-ink">{{
                  request.studentName
                }}</span
                ><span class="mt-0.5 block text-xs text-muted"
                  >{{ request.studentId }} · {{ request.position }}</span
                ></span
              ></label
            >
          </div>
          <p
            v-if="letterErrors.requestIds"
            class="mt-1.5 text-xs font-medium text-danger"
          >
            {{ letterErrors.requestIds }}
          </p>
        </section>
        <UiSelect
          v-model="letterForm.coordinatorId"
          :options="coordinatorOptions"
          label="ผู้ประสานงานของชุด"
          help="ไม่บังคับ"
        />
        <div class="grid gap-4 sm:grid-cols-2">
          <UiInput
            v-model="letterForm.letterNumber"
            label="เลขที่หนังสือ"
            placeholder="เช่น อว 0624.12/2569-019"
            :error="letterErrors.letterNumber"
          /><UiInput
            v-model="letterForm.letterDate"
            type="date"
            label="วันที่ออกหนังสือ"
            :error="letterErrors.letterDate"
          />
        </div>
        <div>
          <label
            for="placement-letter-pdf"
            class="block text-sm font-semibold text-ink"
            >ไฟล์หนังสือขอฝึกงาน PDF</label
          ><label
            for="placement-letter-pdf"
            class="mt-1.5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-control border border-dashed bg-surface p-4 text-center hover:border-primary"
            :class="letterErrors.fileName ? 'border-danger' : 'border-divider'"
            ><Upload :size="22" class="text-muted" /><span
              class="mt-2 text-sm font-semibold text-ink"
              >{{ letterForm.fileName || "เลือกไฟล์ PDF" }}</span
            ><span class="mt-1 text-xs text-muted"
              >ขนาดไม่เกิน 10 MB</span
            ></label
          ><input
            id="placement-letter-pdf"
            type="file"
            accept="application/pdf,.pdf"
            class="sr-only"
            @change="handleFile"
          >
          <p
            v-if="letterErrors.fileName"
            class="mt-1.5 text-xs font-medium text-danger"
          >
            {{ letterErrors.fileName }}
          </p>
        </div>
      </div>
      <template #cancel
        ><UiButton variant="ghost" :disabled="isSubmitting"
          >ยกเลิก</UiButton
        ></template
      >
      <template #confirm
        ><UiButton
          v-if="!letterBatchId"
          variant="secondary"
          :loading="isSubmitting"
          @click="submitLetter(false)"
          >บันทึกฉบับร่าง</UiButton
        ><UiButton
          :icon="FileCheck2"
          :loading="isSubmitting"
          @click="submitLetter(true)"
          >เผยแพร่ PDF และยืนยันคำร้อง</UiButton
        ></template
      >
    </UiDialog>
  </div>
</template>
