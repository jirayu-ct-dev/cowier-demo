import { describe, expect, it } from 'vitest'
import { buildEvaluationRows, evaluationCsv } from './evaluationExport'
import type { SupervisionAppointment } from '../composables/useSupervisionAppointments'
import { companyEvaluationCriteria, studentEvaluationCriteria } from '../composables/useSupervisionEvaluations'
import type { CompanyEvaluation, StudentEvaluation } from '../composables/useSupervisionEvaluations'

describe('evaluation export', () => {
  it('exports only submitted evaluations in scope with numeric ratings', () => {
    const appointments = [{ id: 'A1', cycleId: 'C1', round: 1, date: '2026-09-04', companyId: 'CO1' }] as SupervisionAppointment[]
    const student: StudentEvaluation = { appointmentId: 'A1', studentId: 'S1', lecturerId: 'L1', status: 'submitted', submittedAt: '2026-09-04', ratings: { responsibility: '5', ethics: '3', communication: '4' }, strengths: '', issues: '', suggestions: '', followUp: '' }
    const company: CompanyEvaluation = { appointmentId: 'A1', evaluatorId: 'L1', status: 'submitted', submittedAt: '2026-09-04', ratings: { field_relevance: '4' }, recommendation: 'recommended', observations: '', companyRequirements: '', issues: '', suggestions: '' }
    const rows = buildEvaluationRows(appointments, [student, { ...student, status: 'draft' }, { ...student, appointmentId: 'A2' }], [company], id => id, id => id)
    expect(rows).toHaveLength(studentEvaluationCriteria.length + companyEvaluationCriteria.length)
    expect(rows[0]?.['คะแนน (เต็ม 5)']).toBe(5)
    expect(rows[2]?.['คะแนน (เต็ม 5)']).toBe(4)
    expect(buildEvaluationRows([], [student], [company], id => id, id => id)).toEqual([])
  })
  it('produces UTF-8 BOM CSV and neutralizes formulas while escaping quotes and newlines', () => {
    const csv = evaluationCsv([{ name: '=1+1', note: 'ชื่อ,"ไทย"\nบรรทัดใหม่', score: 5, id: '00123' }])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"\'=1+1"')
    expect(csv).toContain('"ชื่อ,""ไทย""\nบรรทัดใหม่"')
    expect(csv).toContain('"00123"')
  })
})
