import { describe, expect, it } from 'vitest'
import {
  coopCycleDefinitionSchema,
  cycleEnrollmentUpdateSchema,
  cycleListQuerySchema,
} from './schema'

const validCycle = {
  code: 'CYCLE-2569-2',
  label: 'ภาคเรียนที่ 2/2569',
  academicYear: 2569,
  term: 'second',
  termLabel: 'ภาคเรียนที่ 2',
  targetCohortYear: 2566,
  requestStartDate: '2026-08-01',
  requestEndDate: '2026-09-30',
  trainingStartDate: '2026-11-02',
  trainingEndDate: '2027-03-05',
} as const

describe('cycle schemas', () => {
  it('accepts a cycle definition with ordered date ranges', () => {
    expect(coopCycleDefinitionSchema.safeParse(validCycle).success).toBe(true)
  })

  it('rejects reversed request and training date ranges', () => {
    const result = coopCycleDefinitionSchema.safeParse({
      ...validCycle,
      requestStartDate: '2026-10-01',
      requestEndDate: '2026-09-30',
      trainingStartDate: '2027-04-01',
      trainingEndDate: '2027-03-05',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join('.'))).toEqual([
        'requestEndDate',
        'trainingEndDate',
      ])
    }
  })

  it('rejects an enrollment update without a changed field', () => {
    expect(cycleEnrollmentUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('coerces the academic year used by list queries', () => {
    expect(cycleListQuerySchema.parse({ academicYear: '2569' }).academicYear).toBe(2569)
  })
})
