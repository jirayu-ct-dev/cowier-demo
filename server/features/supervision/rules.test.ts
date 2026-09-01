import { describe, expect, it } from 'vitest'
import { appointmentCompletionSchema, supervisionGroupCreateSchema } from './schema'
import {
  canManageAppointment,
  canTransitionAppointmentStatus,
  findGroupAssignmentConflicts,
  isAppointmentLocked,
  validateAppointmentCompletion,
} from './rules'

describe('supervision rules', () => {
  it('allows only the explicitly defined appointment transitions', () => {
    expect(canTransitionAppointmentStatus('draft', 'published')).toBe(true)
    expect(canTransitionAppointmentStatus('published', 'completed')).toBe(true)
    expect(canTransitionAppointmentStatus('postponed', 'published')).toBe(true)
    expect(canTransitionAppointmentStatus('completed', 'published')).toBe(false)
    expect(canTransitionAppointmentStatus('cancelled', 'draft')).toBe(false)
  })

  it('locks completed and cancelled appointments', () => {
    expect(isAppointmentLocked('completed')).toBe(true)
    expect(isAppointmentLocked('cancelled')).toBe(true)
    expect(isAppointmentLocked('published')).toBe(false)
  })

  it('deduplicates members when parsing a group and finds conflicts in the same cycle and round', () => {
    const input = supervisionGroupCreateSchema.parse({
      cycleId: 'cycle-1',
      round: 1,
      name: 'กลุ่มอาจารย์ 1',
      lecturerIds: ['lecturer-1', 'lecturer-1', 'lecturer-2'],
      companySiteIds: ['site-1', 'site-2', 'site-2'],
    })
    const conflicts = findGroupAssignmentConflicts(input, [
      { cycleId: 'cycle-1', round: 1, lecturerIds: ['lecturer-2'], companySiteIds: ['site-2'] },
      { cycleId: 'cycle-1', round: 2, lecturerIds: ['lecturer-1'], companySiteIds: ['site-1'] },
    ])

    expect(input.lecturerIds).toEqual(['lecturer-1', 'lecturer-2'])
    expect(input.companySiteIds).toEqual(['site-1', 'site-2'])
    expect(conflicts).toEqual({ lecturerIds: ['lecturer-2'], companySiteIds: ['site-2'] })
  })

  it('requires actual lecturers to come from the planned participant list', () => {
    const completion = appointmentCompletionSchema.parse({
      scheduledDate: '2026-09-02',
      period: 'morning',
      lecturerIds: ['lecturer-1', 'lecturer-2'],
      actualLecturerIds: ['lecturer-2', 'lecturer-3'],
      result: {},
    })

    expect(validateAppointmentCompletion(completion, ['lecturer-1', 'lecturer-2'])).toEqual({
      valid: false,
      invalidActualLecturerIds: ['lecturer-3'],
    })
  })

  it('allows the responsible or participating lecturer to manage an appointment', () => {
    expect(canManageAppointment('lecturer-1', ['lecturer-1'], [])).toBe(true)
    expect(canManageAppointment('lecturer-2', [], ['lecturer-2'])).toBe(true)
    expect(canManageAppointment('lecturer-3', ['lecturer-1'], ['lecturer-2'])).toBe(false)
  })
})
