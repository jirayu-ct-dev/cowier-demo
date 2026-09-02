import type { AuthUserRecord, PublicUserRole } from './types'

export const LOGIN_FAILURE_LIMIT = 3
export const LOGIN_FAILURE_WINDOW_MS = 60_000
export const LOGIN_LOCK_DURATION_MS = 60_000

export const nextLoginFailure = (
  user: Pick<AuthUserRecord, 'failedLoginCount' | 'failedWindowAt'>,
  now: Date,
) => {
  const withinWindow = user.failedWindowAt !== null
    && now.getTime() - user.failedWindowAt.getTime() < LOGIN_FAILURE_WINDOW_MS
  const failedLoginCount = (withinWindow ? user.failedLoginCount : 0) + 1
  const shouldLock = failedLoginCount >= LOGIN_FAILURE_LIMIT

  return {
    failedLoginCount: shouldLock ? 0 : failedLoginCount,
    failedWindowAt: now,
    lockedUntil: shouldLock ? new Date(now.getTime() + LOGIN_LOCK_DURATION_MS) : null,
    shouldLock,
  }
}

export const hasRole = (actualRole: PublicUserRole, allowedRoles: readonly PublicUserRole[]) => (
  allowedRoles.includes(actualRole)
)

export const canReviewPlacements = (user: Pick<AuthUserRecord, 'role' | 'canReviewPlacements'>) => (
  user.role === 'LECTURER' && user.canReviewPlacements
)

