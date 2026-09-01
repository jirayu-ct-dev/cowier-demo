import type { H3Event } from 'h3'
import { ApiError, apiErrors } from '../api-error'
import { findAuthUserById } from '../../features/auth/service'
import { hasRole } from '../../features/auth/rules'
import { toAuthenticatedUser } from '../../features/auth/types'
import type { AuthenticatedUser, AuthUserRecord, PublicUserRole } from '../../features/auth/types'

declare module 'h3' {
  interface H3EventContext {
    authUser?: AuthUserRecord
    requestId?: string
  }
}

export const replaceAuthSession = async (event: H3Event, user: AuthenticatedUser, sessionVersion: number) => {
  await replaceUserSession(event, {
    user,
    secure: { sessionVersion },
    loggedInAt: Date.now(),
  })
}

export const requireUser = async (event: H3Event, options: { allowFirstLogin?: boolean } = {}) => {
  const cachedUser = event.context.authUser
  if (cachedUser) {
    if (cachedUser.status === 'FIRST_LOGIN' && !options.allowFirstLogin) {
      throw new ApiError(403, 'PASSWORD_CHANGE_REQUIRED', 'กรุณาเปลี่ยนรหัสผ่านก่อนเข้าใช้งาน')
    }
    return cachedUser
  }

  const session = await getUserSession(event)
  if (!session.user?.id || session.secure?.sessionVersion === undefined) throw apiErrors.unauthorized()

  const user = await findAuthUserById(session.user.id)
  const isValid = user
    && user.recordStatus === 'ACTIVE'
    && (user.status === 'ACTIVE' || user.status === 'FIRST_LOGIN')
    && user.sessionVersion === session.secure.sessionVersion

  if (!isValid) {
    await clearUserSession(event)
    throw apiErrors.unauthorized('Session หมดอายุหรือถูกยกเลิกแล้ว')
  }

  event.context.authUser = user
  if (user.status === 'FIRST_LOGIN' && !options.allowFirstLogin) {
    throw new ApiError(403, 'PASSWORD_CHANGE_REQUIRED', 'กรุณาเปลี่ยนรหัสผ่านก่อนเข้าใช้งาน')
  }
  return user
}

export const requireRole = async (event: H3Event, ...roles: PublicUserRole[]) => {
  const user = await requireUser(event)
  const publicUser = toAuthenticatedUser(user)
  if (!hasRole(publicUser.role, roles)) throw apiErrors.forbidden()
  return user
}

export const requirePlacementReviewer = async (event: H3Event) => {
  const user = await requireRole(event, 'lecturer')
  if (!user.canReviewPlacements) throw apiErrors.forbidden('บัญชีนี้ไม่มีสิทธิ์ตรวจคำร้องและหนังสือ')
  return user
}
