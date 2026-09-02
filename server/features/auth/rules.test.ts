import { describe, expect, it } from 'vitest'
import { canReviewPlacements, hasRole, nextLoginFailure } from './rules'

describe('authentication rules', () => {
  it('locks the third failed login within one minute', () => {
    const now = new Date('2026-09-02T10:00:30.000Z')
    const result = nextLoginFailure({
      failedLoginCount: 2,
      failedWindowAt: new Date('2026-09-02T10:00:00.000Z'),
    }, now)

    expect(result.shouldLock).toBe(true)
    expect(result.lockedUntil).toEqual(new Date('2026-09-02T10:01:30.000Z'))
  })

  it('starts a new failure window after one minute', () => {
    const result = nextLoginFailure({
      failedLoginCount: 2,
      failedWindowAt: new Date('2026-09-02T09:58:00.000Z'),
    }, new Date('2026-09-02T10:00:00.000Z'))

    expect(result.failedLoginCount).toBe(1)
    expect(result.shouldLock).toBe(false)
  })

  it('checks roles and the placement reviewer permission independently', () => {
    expect(hasRole('staff', ['staff'])).toBe(true)
    expect(hasRole('student', ['staff', 'lecturer'])).toBe(false)
    expect(canReviewPlacements({ role: 'LECTURER', canReviewPlacements: true })).toBe(true)
    expect(canReviewPlacements({ role: 'LECTURER', canReviewPlacements: false })).toBe(false)
    expect(canReviewPlacements({ role: 'STAFF', canReviewPlacements: true })).toBe(false)
  })
})

