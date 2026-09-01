import type { AccountStatus, PrismaClient } from '@prisma/client'
import { ApiError, apiErrors } from '../../core/api-error'
import { recordAudit } from '../../core/audit'
import { prisma } from '../../core/database/prisma'
import { hashPassword, verifyPassword } from '../../core/auth/password'
import { nextLoginFailure } from './rules'
import { authUserSelect, toAuthenticatedUser } from './types'
import type { AuthenticatedUser, AuthUserRecord } from './types'

export interface AuthAuditContext {
  correlationId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

export type LoginResult =
  | { status: 'success', user: AuthenticatedUser, sessionVersion: number }
  | { status: 'invalid' | 'locked' | 'suspended' | 'terminated' }

const passwordIssue = (path: string, message: string) => apiErrors.validation({
  issues: [{ path, code: 'custom', message }],
})

const assertNewPassword = async (user: AuthUserRecord, newPassword: string) => {
  if (newPassword === user.username) {
    throw passwordIssue('newPassword', 'รหัสผ่านใหม่ต้องไม่ตรงกับชื่อผู้ใช้')
  }
  if (await verifyPassword(newPassword, user.passwordHash)) {
    throw passwordIssue('newPassword', 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน')
  }
}

const loginAudit = (
  action: string,
  user: AuthUserRecord | null,
  username: string,
  result: string,
  context: AuthAuditContext,
  database: PrismaClient = prisma,
) => recordAudit({
  actorUserId: action === 'AUTH_LOGIN_SUCCESS' ? user?.id : null,
  action,
  entityType: 'User',
  entityId: user?.id ?? username,
  metadata: { result },
  ...context,
}, database)

export const authenticate = async (
  username: string,
  password: string,
  context: AuthAuditContext,
  database: PrismaClient = prisma,
  now = new Date(),
): Promise<LoginResult> => {
  const user = await database.user.findUnique({
    where: { username },
    select: authUserSelect,
  })

  if (!user) {
    await loginAudit('AUTH_LOGIN_FAILURE', null, username, 'INVALID_CREDENTIALS', context, database)
    return { status: 'invalid' }
  }

  if (user.lockedUntil && user.lockedUntil > now) {
    await loginAudit('AUTH_LOGIN_LOCKED', user, username, 'LOCKED', context, database)
    return { status: 'locked' }
  }

  if (!await verifyPassword(password, user.passwordHash)) {
    const failure = nextLoginFailure(user, now)
    await database.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failure.failedLoginCount,
          failedWindowAt: failure.failedWindowAt,
          lockedUntil: failure.lockedUntil,
        },
        select: { id: true },
      })
      await recordAudit({
        actorUserId: null,
        action: failure.shouldLock ? 'AUTH_LOGIN_LOCKED' : 'AUTH_LOGIN_FAILURE',
        entityType: 'User',
        entityId: user.id,
        metadata: { result: failure.shouldLock ? 'LOCKED' : 'INVALID_CREDENTIALS' },
        ...context,
      }, transaction)
    })
    return { status: failure.shouldLock ? 'locked' : 'invalid' }
  }

  if (user.recordStatus === 'INACTIVE' || user.status === 'TERMINATED') {
    await loginAudit('AUTH_LOGIN_FAILURE', user, username, 'TERMINATED', context, database)
    return { status: 'terminated' }
  }
  if (user.status === 'SUSPENDED') {
    await loginAudit('AUTH_LOGIN_FAILURE', user, username, 'SUSPENDED', context, database)
    return { status: 'suspended' }
  }

  const authenticatedUser = await database.$transaction(async (transaction) => {
    const updatedUser = await transaction.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        failedWindowAt: null,
        lockedUntil: null,
        lastLoginAt: now,
      },
      select: authUserSelect,
    })
    await recordAudit({
      actorUserId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: user.role },
      ...context,
    }, transaction)
    return updatedUser
  })

  return {
    status: 'success',
    user: toAuthenticatedUser(authenticatedUser),
    sessionVersion: authenticatedUser.sessionVersion,
  }
}

export const findAuthUserById = (userId: string, database: PrismaClient = prisma) => (
  database.user.findUnique({ where: { id: userId }, select: authUserSelect })
)

export const completeFirstLogin = async (
  user: AuthUserRecord,
  newPassword: string,
  context: AuthAuditContext,
  database: PrismaClient = prisma,
) => {
  if (user.status !== 'FIRST_LOGIN') throw apiErrors.forbidden('บัญชีนี้ไม่อยู่ในขั้นตอนเข้าสู่ระบบครั้งแรก')
  await assertNewPassword(user, newPassword)
  const passwordHash = await hashPassword(newPassword)

  const updatedUser = await database.$transaction(async (transaction) => {
    const updated = await transaction.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        passwordChangedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
      select: authUserSelect,
    })
    await recordAudit({
      actorUserId: user.id,
      action: 'AUTH_FIRST_LOGIN_COMPLETED',
      entityType: 'User',
      entityId: user.id,
      before: { status: user.status },
      after: { status: updated.status },
      ...context,
    }, transaction)
    return updated
  })

  return { user: toAuthenticatedUser(updatedUser), sessionVersion: updatedUser.sessionVersion }
}

export const changeOwnPassword = async (
  user: AuthUserRecord,
  currentPassword: string,
  newPassword: string,
  context: AuthAuditContext,
  database: PrismaClient = prisma,
) => {
  if (!await verifyPassword(currentPassword, user.passwordHash)) {
    throw passwordIssue('currentPassword', 'รหัสผ่านปัจจุบันไม่ถูกต้อง')
  }
  await assertNewPassword(user, newPassword)
  const passwordHash = await hashPassword(newPassword)

  const updatedUser = await database.$transaction(async (transaction) => {
    const updated = await transaction.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
      select: authUserSelect,
    })
    await recordAudit({
      actorUserId: user.id,
      action: 'AUTH_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
      ...context,
    }, transaction)
    return updated
  })

  return { user: toAuthenticatedUser(updatedUser), sessionVersion: updatedUser.sessionVersion }
}

export const resetUserPassword = async (
  actor: AuthUserRecord,
  targetUserId: string,
  temporaryPassword: string,
  context: AuthAuditContext,
  database: PrismaClient = prisma,
) => {
  const target = await findAuthUserById(targetUserId, database)
  if (!target) throw apiErrors.notFound('ไม่พบบัญชีผู้ใช้')
  if (target.role === 'STAFF') throw apiErrors.forbidden('บัญชีเจ้าหน้าที่จัดการโดยผู้ดูแลระบบภายนอก')
  if (target.recordStatus === 'INACTIVE' || target.status === 'SUSPENDED' || target.status === 'TERMINATED') {
    throw apiErrors.conflict('กรุณาเปิดใช้งานบัญชีก่อนรีเซ็ตรหัสผ่าน')
  }
  await assertNewPassword(target, temporaryPassword)
  const passwordHash = await hashPassword(temporaryPassword)

  const updated = await database.$transaction(async (transaction) => {
    const account = await transaction.user.update({
      where: { id: target.id },
      data: {
        passwordHash,
        status: 'FIRST_LOGIN',
        passwordChangedAt: null,
        failedLoginCount: 0,
        failedWindowAt: null,
        lockedUntil: null,
        sessionVersion: { increment: 1 },
      },
      select: authUserSelect,
    })
    await recordAudit({
      actorUserId: actor.id,
      action: 'AUTH_PASSWORD_RESET',
      entityType: 'User',
      entityId: target.id,
      before: { status: target.status },
      after: { status: account.status },
      ...context,
    }, transaction)
    return account
  })

  return toAuthenticatedUser(updated)
}

export const changeAccountStatus = async (
  actor: AuthUserRecord,
  targetUserId: string,
  status: Exclude<AccountStatus, 'FIRST_LOGIN'>,
  reason: string | undefined,
  context: AuthAuditContext,
  database: PrismaClient = prisma,
) => {
  const target = await findAuthUserById(targetUserId, database)
  if (!target) throw apiErrors.notFound('ไม่พบบัญชีผู้ใช้')
  if (target.id === actor.id || target.role === 'STAFF') {
    throw apiErrors.forbidden('บัญชีเจ้าหน้าที่จัดการโดยผู้ดูแลระบบภายนอก')
  }
  if (target.status === 'FIRST_LOGIN' && status === 'ACTIVE') {
    throw apiErrors.conflict('บัญชีต้องตั้งรหัสผ่านใหม่ให้เสร็จก่อนเปลี่ยนเป็นสถานะใช้งาน')
  }
  if (target.status === status) return toAuthenticatedUser(target)

  const now = new Date()
  const updated = await database.$transaction(async (transaction) => {
    const account = await transaction.user.update({
      where: { id: target.id },
      data: {
        status,
        recordStatus: status === 'TERMINATED' ? 'INACTIVE' : 'ACTIVE',
        suspendedAt: status === 'SUSPENDED' ? now : null,
        terminatedAt: status === 'TERMINATED' ? now : null,
        failedLoginCount: 0,
        failedWindowAt: null,
        lockedUntil: null,
        sessionVersion: { increment: 1 },
      },
      select: authUserSelect,
    })
    await recordAudit({
      actorUserId: actor.id,
      action: 'AUTH_ACCOUNT_STATUS_CHANGED',
      entityType: 'User',
      entityId: target.id,
      reason,
      before: { status: target.status, recordStatus: target.recordStatus },
      after: { status: account.status, recordStatus: account.recordStatus },
      ...context,
    }, transaction)
    return account
  })

  return toAuthenticatedUser(updated)
}

export const authResultError = (status: Exclude<LoginResult['status'], 'success'>) => {
  if (status === 'locked') return new ApiError(429, 'AUTH_LOCKED', 'ระงับการเข้าสู่ระบบชั่วคราว')
  if (status === 'suspended') return new ApiError(403, 'ACCOUNT_SUSPENDED', 'บัญชีถูกระงับชั่วคราว')
  if (status === 'terminated') return new ApiError(403, 'ACCOUNT_TERMINATED', 'บัญชีสิ้นสุดการใช้งานแล้ว')
  return new ApiError(401, 'AUTH_INVALID_CREDENTIALS', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
}
