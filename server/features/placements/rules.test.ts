import { describe, expect, it } from 'vitest'
import {
  canManagePlacementDocuments,
  canTransitionPlacementRequest,
  placementActiveSlotKey,
  placementConfirmedSlotKey,
} from './rules'
import { letterBatchStatusSchema, placementRequestStatusSchema } from './schema'

describe('placement contract', () => {
  it('uses the canonical public status names', () => {
    expect(placementRequestStatusSchema.parse('waiting-response')).toBe('waiting-response')
    expect(placementRequestStatusSchema.safeParse('waiting_response').success).toBe(false)
    expect(letterBatchStatusSchema.parse('draft')).toBe('draft')
  })

  it('allows only the frozen placement transitions', () => {
    expect(canTransitionPlacementRequest('draft', 'submitted')).toBe(true)
    expect(canTransitionPlacementRequest('submitted', 'batched')).toBe(true)
    expect(canTransitionPlacementRequest('batched', 'waiting-response')).toBe(true)
    expect(canTransitionPlacementRequest('waiting-response', 'waiting-review')).toBe(true)
    expect(canTransitionPlacementRequest('waiting-review', 'confirmed')).toBe(true)
    expect(canTransitionPlacementRequest('confirmed', 'submitted')).toBe(false)
  })

  it('enforces one active request per student across cycles and one confirmation per enrollment', () => {
    expect(placementActiveSlotKey('submitted', 'student-1')).toBe('student-1')
    expect(placementActiveSlotKey('not-accepted', 'student-1')).toBeNull()
    expect(placementConfirmedSlotKey('confirmed', 'enrollment-1')).toBe('enrollment-1')
    expect(placementConfirmedSlotKey('waiting-review', 'enrollment-1')).toBeNull()
  })

  it('limits document management to lecturers with placement-review permission', () => {
    expect(canManagePlacementDocuments('lecturer', true)).toBe(true)
    expect(canManagePlacementDocuments('lecturer', false)).toBe(false)
    expect(canManagePlacementDocuments('staff', true)).toBe(false)
    expect(canManagePlacementDocuments('student', true)).toBe(false)
  })
})
