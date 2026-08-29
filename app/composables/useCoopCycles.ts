export type CoopCycleStatus =
  | "draft"
  | "open"
  | "closed_to_requests"
  | "training"
  | "closed";

export type StudentWorkStatus =
  | "not_started"
  | "training"
  | "completed"
  | "terminated";

export interface CoopCycle {
  id: string;
  label: string;
  academicYear: string;
  semester: string;
  cohort: string;
  requestStart: string;
  requestEnd: string;
  trainingStart: string;
  trainingEnd: string;
  status: CoopCycleStatus;
}

const cycles: CoopCycle[] = [
  {
    id: "CYCLE-2569-2",
    label: "ภาคเรียนที่ 2/2569",
    academicYear: "2569",
    semester: "ภาคเรียนที่ 2",
    cohort: "รุ่น 66",
    requestStart: "2026-08-01",
    requestEnd: "2026-09-30",
    trainingStart: "2026-11-02",
    trainingEnd: "2027-03-05",
    status: "open",
  },
  {
    id: "CYCLE-2569-SUMMER",
    label: "ภาคฤดูร้อน/2569",
    academicYear: "2569",
    semester: "ภาคฤดูร้อน",
    cohort: "รุ่น 66",
    requestStart: "2027-01-04",
    requestEnd: "2027-02-12",
    trainingStart: "2027-03-22",
    trainingEnd: "2027-05-28",
    status: "draft",
  },
  {
    id: "CYCLE-2570-1",
    label: "ภาคเรียนที่ 1/2570",
    academicYear: "2570",
    semester: "ภาคเรียนที่ 1",
    cohort: "รุ่น 66",
    requestStart: "2027-04-01",
    requestEnd: "2027-05-31",
    trainingStart: "2027-06-14",
    trainingEnd: "2027-10-15",
    status: "draft",
  },
];

export const cycleStatusMeta: Record<
  CoopCycleStatus,
  { label: string; tone: "neutral" | "warning" | "info" | "success" }
> = {
  draft: { label: "ฉบับร่าง", tone: "neutral" },
  open: { label: "เปิดยื่นสถานประกอบการ", tone: "success" },
  closed_to_requests: { label: "ปิดรับคำร้องใหม่", tone: "warning" },
  training: { label: "กำลังฝึกงาน", tone: "info" },
  closed: { label: "ปิดรอบ", tone: "neutral" },
};

export const workStatusMeta: Record<
  StudentWorkStatus,
  { label: string; tone: "neutral" | "warning" | "info" | "success" | "danger" }
> = {
  not_started: { label: "ยังไม่เริ่มปฏิบัติงาน", tone: "warning" },
  training: { label: "กำลังปฏิบัติงาน", tone: "info" },
  completed: { label: "ปฏิบัติงานเสร็จแล้ว", tone: "success" },
  terminated: { label: "ยุติการปฏิบัติงาน", tone: "danger" },
};

export const useCoopCycles = () => {
  const { scenario } = useScenario();
  const selectedCycle = computed(
    () => cycles.find((cycle) => cycle.label === scenario.value.cycle) ?? cycles[0]!,
  );

  return { cycles, selectedCycle };
};
