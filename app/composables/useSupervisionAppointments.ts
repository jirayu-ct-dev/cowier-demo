import type { SupervisionRound } from './useSupervisionGroups'

export type SupervisionPeriod = 'morning' | 'afternoon'
export type SupervisionAppointmentStatus = 'draft' | 'published' | 'postponed' | 'cancelled'

export interface SupervisionAppointment {
  id: string
  cycleId: string
  round: SupervisionRound
  groupId: string
  companyId: string
  studentIds: string[]
  date: string
  period: SupervisionPeriod
  lecturerIds: string[]
  splitReason?: string
  status: SupervisionAppointmentStatus
  createdAt: string
}

export interface SupervisionAppointmentInput {
  cycleId: string
  round: SupervisionRound
  groupId: string
  companyId: string
  studentIds: string[]
  date: string
  period: SupervisionPeriod
  lecturerIds: string[]
  splitReason?: string
}

const appointmentsSeed: SupervisionAppointment[] = [
  {
    id: 'SA-001', cycleId: 'CYCLE-2569-2', round: 1, groupId: 'SG-001', companyId: 'SC-001',
    studentIds: ['66123456701', '66123456702'], date: '2026-09-02', period: 'morning',
    lecturerIds: ['L0012'], status: 'published', createdAt: '2026-08-30T15:20:00+07:00',
  },
  {
    id: 'SA-002', cycleId: 'CYCLE-2569-2', round: 1, groupId: 'SG-001', companyId: 'SC-002',
    studentIds: ['66123456704'], date: '2026-09-03', period: 'afternoon',
    lecturerIds: ['L0012'], status: 'published', createdAt: '2026-08-30T15:25:00+07:00',
  },
  {
    id: 'SA-003', cycleId: 'CYCLE-2569-2', round: 1, groupId: 'SG-003', companyId: 'SC-003',
    studentIds: ['66123456708', '66123456723'], date: '2026-09-02', period: 'morning',
    lecturerIds: ['L0021'], status: 'published', createdAt: '2026-08-30T15:30:00+07:00',
  },
  {
    id: 'SA-004', cycleId: 'CYCLE-2569-2', round: 2, groupId: 'SG-002', companyId: 'SC-001',
    studentIds: ['66123456701', '66123456702'], date: '2026-10-07', period: 'morning',
    lecturerIds: ['L0021'], status: 'published', createdAt: '2026-08-30T15:35:00+07:00',
  },
  {
    id: 'SA-005', cycleId: 'CYCLE-2569-2', round: 2, groupId: 'SG-002', companyId: 'SC-003',
    studentIds: ['66123456708', '66123456723'], date: '2026-10-08', period: 'afternoon',
    lecturerIds: ['L0021'], status: 'published', createdAt: '2026-08-30T15:40:00+07:00',
  },
]

export const supervisionPeriodMeta: Record<SupervisionPeriod, { label: string }> = {
  morning: { label: 'ช่วงเช้า' },
  afternoon: { label: 'ช่วงบ่าย' },
}

export const supervisionAppointmentStatusMeta: Record<SupervisionAppointmentStatus, { label: string, tone: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  draft: { label: 'ฉบับร่าง', tone: 'neutral' },
  published: { label: 'เผยแพร่แล้ว', tone: 'info' },
  postponed: { label: 'เลื่อนนัด', tone: 'warning' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' },
}

export const useSupervisionAppointments = () => {
  const appointments = useState<SupervisionAppointment[]>('supervision-appointments-v1', () => structuredClone(appointmentsSeed))
  const { recordEvent } = useScenario()

  const createAppointment = (input: SupervisionAppointmentInput) => {
    const nextNumber = Math.max(0, ...appointments.value.map(item => Number(item.id.replace('SA-', '')) || 0)) + 1
    const appointment: SupervisionAppointment = {
      ...input,
      id: `SA-${String(nextNumber).padStart(3, '0')}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    appointments.value.unshift(appointment)
    recordEvent(`สร้างนัดนิเทศ ${appointment.id}`)
    return appointment
  }

  const joinAppointment = (appointmentId: string, lecturerId: string) => {
    const appointment = appointments.value.find(item => item.id === appointmentId)
    if (!appointment) throw new Error('appointment-not-found')
    if (appointment.lecturerIds.includes(lecturerId)) return appointment

    appointment.lecturerIds.push(lecturerId)
    recordEvent(`เข้าร่วมนิเทศ ${appointment.id}`)
    return appointment
  }

  const leaveAppointment = (appointmentId: string, lecturerId: string) => {
    const appointment = appointments.value.find(item => item.id === appointmentId)
    if (!appointment) throw new Error('appointment-not-found')
    appointment.lecturerIds = appointment.lecturerIds.filter(id => id !== lecturerId)
    recordEvent(`ยกเลิกการเข้าร่วมนิเทศ ${appointment.id}`)
    return appointment
  }

  return { appointments, createAppointment, joinAppointment, leaveAppointment }
}
