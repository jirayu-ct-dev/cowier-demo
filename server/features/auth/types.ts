import type { AccountStatus, Prisma, UserRole } from '@prisma/client'

export const authUserSelect = {
  id: true,
  username: true,
  passwordHash: true,
  role: true,
  status: true,
  recordStatus: true,
  namePrefix: true,
  firstName: true,
  lastName: true,
  canReviewPlacements: true,
  failedLoginCount: true,
  failedWindowAt: true,
  lockedUntil: true,
  sessionVersion: true,
} satisfies Prisma.UserSelect

export type AuthUserRecord = Prisma.UserGetPayload<{ select: typeof authUserSelect }>
export type PublicUserRole = 'staff' | 'lecturer' | 'student'
export type PublicAccountStatus = 'first-login' | 'active' | 'suspended' | 'terminated'

export interface AuthenticatedUser {
  id: string
  username: string
  role: PublicUserRole
  status: PublicAccountStatus
  name: string
  canReviewPlacements: boolean
}

const publicRoles: Record<UserRole, PublicUserRole> = {
  STAFF: 'staff',
  LECTURER: 'lecturer',
  STUDENT: 'student',
}

const publicStatuses: Record<AccountStatus, PublicAccountStatus> = {
  FIRST_LOGIN: 'first-login',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
}

export const toAuthenticatedUser = (user: AuthUserRecord): AuthenticatedUser => ({
  id: user.id,
  username: user.username,
  role: publicRoles[user.role],
  status: publicStatuses[user.status],
  name: [user.namePrefix, user.firstName, user.lastName].filter(Boolean).join(' '),
  canReviewPlacements: user.role === 'LECTURER' && user.canReviewPlacements,
})

