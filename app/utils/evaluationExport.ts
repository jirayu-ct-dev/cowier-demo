import type { SupervisionAppointment } from '../composables/useSupervisionAppointments'
import { companyEvaluationCriteria, studentEvaluationCriteria } from '../composables/useSupervisionEvaluations'
import type { CompanyEvaluation, StudentEvaluation } from '../composables/useSupervisionEvaluations'

export type EvaluationExportRow = Record<string, string | number>
export const buildEvaluationRows = (
  appointments: readonly SupervisionAppointment[],
  students: readonly StudentEvaluation[],
  companies: readonly CompanyEvaluation[],
  nameFor: (id: string) => string,
  companyFor: (id: string) => string,
): EvaluationExportRow[] => {
  const byId = new Map(appointments.map(item => [item.id, item]))
  const evaluations = [
    ...students.map(item => ({ ...item, kind: 'นักศึกษา', personId: item.studentId, evaluator: item.lecturerId, criteria: studentEvaluationCriteria })),
    ...companies.map(item => ({ ...item, kind: 'สถานประกอบการ', personId: '', evaluator: item.evaluatorId, criteria: companyEvaluationCriteria })),
  ]
  return evaluations.filter(item => item.status === 'submitted' && byId.has(item.appointmentId)).flatMap(item => {
    const appointment = byId.get(item.appointmentId)!
    return item.criteria.map(criterion => ({
      'รอบสหกิจศึกษา': appointment.cycleId,
      'ครั้งที่นิเทศ': appointment.round,
      'รหัสนัดนิเทศ': appointment.id,
      'วันที่นิเทศ': appointment.date,
      'ประเภทแบบประเมิน': item.kind,
      'รหัสนักศึกษา': item.personId,
      'ชื่อนักศึกษา': item.personId ? nameFor(item.personId) : '',
      'สถานประกอบการ': companyFor(appointment.companyId),
      'รหัสผู้ประเมิน': item.evaluator,
      'ผู้ประเมิน': nameFor(item.evaluator),
      'เกณฑ์ประเมิน': criterion.label,
      'คะแนน (เต็ม 5)': Number(item.ratings[criterion.id]) || '',
      'วันที่ส่งผลประเมิน': item.submittedAt ?? '',
    }))
  })
}

export const evaluationCsv = (rows: EvaluationExportRow[]) => {
  const headers = Object.keys(rows[0] ?? {})
  const cell = (value: string | number) => {
    const text = String(value)
    // Quoting alone does not prevent spreadsheet formula injection.
    const safe = typeof value === 'string' && /^[\s]*[=+@-]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }
  return `\uFEFF${[headers, ...rows.map(row => headers.map(key => row[key] ?? ''))].map(row => row.map(cell).join(',')).join('\r\n')}`
}
