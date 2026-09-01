import { getAuditRequestContext, recordAudit } from '../core/audit'
import { findAuthUserById } from '../features/auth/service'
import { toAuthenticatedUser } from '../features/auth/types'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session) => {
    if (!session.user?.id || session.secure?.sessionVersion === undefined) return

    const user = await findAuthUserById(session.user.id)
    const isValid = user
      && user.recordStatus === 'ACTIVE'
      && (user.status === 'ACTIVE' || user.status === 'FIRST_LOGIN')
      && user.sessionVersion === session.secure.sessionVersion

    if (!isValid) {
      delete session.user
      delete session.secure
      delete session.loggedInAt
      return
    }

    session.user = toAuthenticatedUser(user)
  })

  sessionHooks.hook('clear', async (session, event) => {
    if (!session.user?.id) return
    await recordAudit({
      actorUserId: session.user.id,
      action: 'AUTH_LOGOUT',
      entityType: 'User',
      entityId: session.user.id,
      ...getAuditRequestContext(event),
    })
  })
})

